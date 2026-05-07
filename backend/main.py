from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Generator

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from clinical_rag_agent import create_clinical_rag_agent
from rag_processing import (
    ENCODED_DIR,
    initialize_vector_database,
    load_data_from_encoded,
    retrieve_similar_chunks,
)
from db import SessionLocal, init_db
from models import User, AuthToken, ChatConversation, ChatMessage
from auth_utils import hash_password, verify_password, generate_token

# ---------------------------
# Pydantic models
# ---------------------------
class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class CreateChatRequest(BaseModel):
    title: str | None = "New Chat"


class AskRequest(BaseModel):
    message: str


# ---------------------------
# Environment and Globals
# ---------------------------
load_dotenv()
clinical_chunks = None
FRONTEND_DIST_DIR = Path(
    os.getenv(
        "FRONTEND_DIST_DIR",
        str(Path(__file__).resolve().parent.parent / "dist"),
    )
)

google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    print("WARNING: GOOGLE_API_KEY environment variable is not set!")
    print("Clinical RAG chat endpoint will fail until GOOGLE_API_KEY is configured.")


# ---------------------------
# Lifespan
# ---------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global clinical_chunks
    try:
        init_db()
        initialize_vector_database(ENCODED_DIR)
        clinical_chunks = load_data_from_encoded(ENCODED_DIR)
        print(f"Initialized clinical RAG index with {len(clinical_chunks)} chunks")
        yield
    finally:
        pass


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://adorable-macaron-2074b9.netlify.app",
        "https://rag-chat-ui-backend:10000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# DB/Auth dependencies
# ---------------------------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token_value = auth_header.split(" ", 1)[1].strip()
    if not token_value:
        raise HTTPException(status_code=401, detail="Invalid token")

    token = db.scalar(select(AuthToken).where(AuthToken.token == token_value))
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    if token.expires_at <= datetime.utcnow():
        db.delete(token)
        db.commit()
        raise HTTPException(status_code=401, detail="Token expired")

    user = db.scalar(select(User).where(User.id == token.user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ---------------------------
# Clinical retrieval tool
# ---------------------------
async def retrieve_clinical_context(query: str, limit: int = 5) -> str:
    global clinical_chunks

    if clinical_chunks is None:
        initialize_vector_database(ENCODED_DIR)
        clinical_chunks = load_data_from_encoded(ENCODED_DIR)

    if not limit or limit <= 0:
        limit = 5

    top_indices = retrieve_similar_chunks(query, top_k=limit)

    sections = []
    for rank, index in enumerate(top_indices, start=1):
        item = clinical_chunks[int(index)]
        sections.append(f"[Source {rank}: {item['filename']}]\n{item['content']}")

    return "\n\n".join(sections)


# ---------------------------
# Auth Routes
# ---------------------------
@app.post("/auth/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = db.scalar(select(User).where(User.email == request.email.lower().strip()))
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    user = User(
        email=request.email.lower().strip(),
        password_hash=hash_password(request.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"id": user.id, "email": user.email, "created_at": user.created_at.isoformat()}


@app.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == request.email.lower().strip()))
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_value = generate_token()
    token = AuthToken(user_id=user.id, token=token_value)
    db.add(token)
    db.commit()

    return {
        "access_token": token_value,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email},
    }


@app.post("/auth/logout")
def logout(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    auth_header = request.headers.get("Authorization", "")
    token_value = auth_header.split(" ", 1)[1].strip()
    token = db.scalar(select(AuthToken).where(AuthToken.token == token_value))
    if token:
        db.delete(token)
        db.commit()
    return {"success": True}


@app.get("/users/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat(),
    }


# ---------------------------
# Chat Routes
# ---------------------------
@app.post("/chats")
def create_chat(
    request: CreateChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = ChatConversation(
        user_id=current_user.id,
        title=(request.title or "New Chat").strip() or "New Chat",
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)

    return {"id": chat.id, "title": chat.title, "created_at": chat.created_at.isoformat()}


@app.get("/chats")
def list_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chats = db.scalars(
        select(ChatConversation)
        .where(ChatConversation.user_id == current_user.id)
        .order_by(ChatConversation.created_at.desc())
    ).all()

    return [
        {"id": c.id, "title": c.title, "created_at": c.created_at.isoformat()}
        for c in chats
    ]


@app.get("/chats/{chat_id}/messages")
def get_chat_messages(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat = db.scalar(select(ChatConversation).where(ChatConversation.id == chat_id))
    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.asc())
    ).all()

    return {
        "chat": {"id": chat.id, "title": chat.title},
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


@app.post("/chats/{chat_id}/ask")
async def ask_chat(
    chat_id: int,
    request: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = db.scalar(select(ChatConversation).where(ChatConversation.id == chat_id))
    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Chat not found")

    clinical_agent = create_clinical_rag_agent(retrieve_clinical_context)

    context = await retrieve_clinical_context(request.message, limit=5)
    parts = []
    async for delta in clinical_agent.stream_answer(request.message, context):
        parts.append(delta)

    answer = "".join(parts).strip()

    db.add(ChatMessage(chat_id=chat.id, role="user", content=request.message))
    db.add(ChatMessage(chat_id=chat.id, role="assistant", content=answer))
    db.commit()

    return {"chat_id": chat.id, "answer": answer}


@app.delete("/chats/{chat_id}")
def delete_chat(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat = db.scalar(select(ChatConversation).where(ChatConversation.id == chat_id))
    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Chat not found")

    db.delete(chat)
    db.commit()
    return {"success": True}


# ---------------------------
# Health
# ---------------------------
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


if (FRONTEND_DIST_DIR / "static").exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIST_DIR / "static")), name="static")


@app.get("/", include_in_schema=False)
def serve_frontend_index():
    index_path = FRONTEND_DIST_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Frontend build not found")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend_routes(full_path: str):
    if not FRONTEND_DIST_DIR.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found")

    requested_path = full_path.strip("/")
    if requested_path:
        candidate = FRONTEND_DIST_DIR / requested_path
        if candidate.is_file():
            return FileResponse(candidate)

    index_path = FRONTEND_DIST_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Frontend build not found")
