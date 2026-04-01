from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import json
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from pydantic import BaseModel
import traceback
from fastapi.responses import StreamingResponse
from clinical_rag_agent import create_clinical_rag_agent
from rag_processing import (
    ENCODED_DIR,
    initialize_vector_database,
    load_data_from_encoded,
    retrieve_similar_chunks,
)

# ---------------------------
# Pydantic models
# ---------------------------
class MessageRequest(BaseModel):
    message: str

# ---------------------------
# Environment and Globals
# ---------------------------
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "ChatMIM"
COLLECTION_NAME = "Incidents"

# Global variables
mongodb_client = None
clinical_chunks = None

google_api_key = os.getenv("GOOGLE_API_KEY")

if not google_api_key:
    print("WARNING: GOOGLE_API_KEY environment variable is not set!")
    print("Clinical RAG chat endpoint will fail until GOOGLE_API_KEY is configured.")


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     global mongodb_client, openai_client, clinical_chunks
#     try:
#         mongodb_client = MongoClient(
#             MONGODB_URI,
#             server_api=ServerApi("1"),
#             maxPoolSize=5,
#             minPoolSize=1,
#             maxIdleTimeMS=30000,
#             retryWrites=True,
#             connectTimeoutMS=5000,
#             serverSelectionTimeoutMS=5000,
#         )
#         mongodb_client.admin.command("ping")
#         print("Connected to MongoDB!")

#         # Initialize the AsyncOpenAI client with the API key
#         api_key = os.getenv("OPENAI_API_KEY")
#         if not api_key:
#             raise ValueError("OPENAI_API_KEY environment variable is not set!")

#         openai_client = AsyncOpenAI(api_key=api_key)

#         # Set this client as the default for the Agents SDK
#         set_default_openai_client(openai_client, use_for_tracing=True)

#         # Initialize local clinical vector index and chunk metadata
#         initialize_vector_database(ENCODED_DIR)
#         clinical_chunks = load_data_from_encoded(ENCODED_DIR)
#         print(f"Initialized clinical RAG index with {len(clinical_chunks)} chunks")

#         print("Initialized AsyncOpenAI client and set as default for Agents SDK")

#         yield
#     except Exception as e:
#         print(f"Startup error: {e}")
#         raise
#     finally:
#         if mongodb_client:
#             mongodb_client.close()
#             print("Closed MongoDB connection")


app = FastAPI()

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
# Tool Functions Using function_tool Decorator
# ---------------------------
async def retrieve_clinical_context(query: str, limit: int = 5) -> str:
    """Retrieve top matching NSTG clinical chunks for a user query."""
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
# Chat Endpoint Using Runner
# ---------------------------
@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    try:
        # Create the clinical RAG agent
        clinical_agent = create_clinical_rag_agent(retrieve_clinical_context)

        async def generate():
            try:
                # Always retrieve clinical context first
                yield f"data: {json.dumps({'tool': 'retrieve_clinical_context'})}\n\n"
                context = await retrieve_clinical_context(request.message, limit=5)
                yield f"data: {json.dumps({'tool_output': context})}\n\n"

                streamed_chunks = []
                async for delta in clinical_agent.stream_answer(
                    request.message, context
                ):
                    streamed_chunks.append(delta)
                    yield f"data: {json.dumps({'content': delta})}\n\n"

                full_message = "".join(streamed_chunks).strip()
                if full_message:
                    yield f"data: {json.dumps({'message': full_message})}\n\n"

                yield "data: [DONE]\n\n"

            except Exception as e:
                print(f"Agent execution error: {str(e)}")
                traceback.print_exc()
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )

    except Exception as e:
        print(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# Endpoints for Health and Incidents
# ---------------------------
@app.get("/health")
async def health_check():
    try:
        mongodb_client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/incidents")
async def get_incidents(skip: int = 0, limit: int = 10):
    try:
        collection = mongodb_client[DB_NAME][COLLECTION_NAME]

        # First get total count of unique documents
        count_pipeline = [
            {
                "$group": {
                    "_id": "$metadata.filename"
                }
            },
            {
                "$count": "total"
            }
        ]

        total_count_result = list(collection.aggregate(count_pipeline))
        total_count = total_count_result[0]['total'] if total_count_result else 0

        # Get paginated unique documents
        pipeline = [
            {
                "$group": {
                    "_id": "$metadata.filename",
                    "metadata": {"$first": "$metadata"},
                    "count": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "metadata": 1,
                    "count": 1
                }
            },
            {
                "$skip": skip
            },
            {
                "$limit": limit
            }
        ]

        unique_documents = list(collection.aggregate(pipeline))

        # Format the response to match what the frontend expects
        formatted_documents = []
        for doc in unique_documents:
            if doc.get('metadata'):
                formatted_documents.append({
                    "metadata": {
                        "filename": doc['metadata'].get('filename'),
                        "preview_image": doc['metadata'].get('preview_image'),
                        "file_type": doc['metadata'].get('file_type'),
                        "upload_timestamp": doc['metadata'].get('upload_timestamp'),
                        "embedding_count": doc.get('count', 0)
                    }
                })

        # Return paginated response with metadata
        return {
            "documents": formatted_documents,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total_count
        }

    except Exception as e:
        print(f"Error fetching incidents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
