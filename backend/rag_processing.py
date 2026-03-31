import hashlib
import json
import os
import time
from collections import deque
from datetime import date
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


vector_database = None
BASE_DIR = Path(__file__).resolve().parent
ENCODED_DIR = BASE_DIR / "data" / "encoded"
VECTORS_FILE = BASE_DIR / "vectors.npy"
MANIFEST_FILE = BASE_DIR / "vectors_manifest.json"
EMBEDDING_MODEL = "gemini-embedding-001"
EMBED_RETRIES = 3
DOCUMENT_TASK_TYPE = "RETRIEVAL_DOCUMENT"
QUERY_TASK_TYPE = "RETRIEVAL_QUERY"

# Use headroom by default to avoid hitting hard limits.
# You can override these from environment variables.
EMBED_RPM_LIMIT = int(os.getenv("EMBED_RPM_LIMIT", "90"))
EMBED_TPM_LIMIT = int(os.getenv("EMBED_TPM_LIMIT", "24000"))
EMBED_RPD_LIMIT = int(os.getenv("EMBED_RPD_LIMIT", "1000"))
TOKEN_ESTIMATE_CHARS_PER_TOKEN = float(
    os.getenv("TOKEN_ESTIMATE_CHARS_PER_TOKEN", "4.0")
)


class EmbeddingRateLimiter:
    """In-process limiter for requests/minute and estimated tokens/minute.

    Notes:
    - TPM uses a text-length estimate: tokens ~= len(text) / TOKEN_ESTIMATE_CHARS_PER_TOKEN
    - RPD is process-local (resets when the process restarts).
    """

    def __init__(self, rpm_limit: int, tpm_limit: int, rpd_limit: int):
        if rpm_limit <= 0 or tpm_limit <= 0 or rpd_limit <= 0:
            raise ValueError("RPM, TPM and RPD limits must be positive")
        self.rpm_limit = rpm_limit
        self.tpm_limit = tpm_limit
        self.rpd_limit = rpd_limit
        self.request_events = deque()  # (timestamp_seconds)
        self.token_events = deque()  # (timestamp_seconds, estimated_tokens)
        self.daily_count = 0
        self.current_day = date.today()

    def _reset_if_new_day(self):
        today = date.today()
        if today != self.current_day:
            self.current_day = today
            self.daily_count = 0

    def _prune_windows(self, now: float):
        one_minute_ago = now - 60.0
        while self.request_events and self.request_events[0] <= one_minute_ago:
            self.request_events.popleft()
        while self.token_events and self.token_events[0][0] <= one_minute_ago:
            self.token_events.popleft()

    def _estimate_tokens(self, text: str) -> int:
        estimated = int((len(text) / TOKEN_ESTIMATE_CHARS_PER_TOKEN) + 0.9999)
        return max(1, estimated)

    def acquire(self, text: str):
        self._reset_if_new_day()

        estimated_tokens = self._estimate_tokens(text)
        if estimated_tokens > self.tpm_limit:
            raise RuntimeError(
                f"Single chunk estimated at {estimated_tokens} tokens exceeds TPM limit {self.tpm_limit}. "
                "Split the chunk before embedding."
            )

        while True:
            now = time.time()
            self._prune_windows(now)

            if self.daily_count >= self.rpd_limit:
                raise RuntimeError(
                    f"RPD limit reached for current process day: {self.daily_count}/{self.rpd_limit}. "
                    "Try again tomorrow or raise EMBED_RPD_LIMIT."
                )

            current_rpm = len(self.request_events)
            current_tpm = sum(tokens for _, tokens in self.token_events)
            rpm_ok = current_rpm + 1 <= self.rpm_limit
            tpm_ok = current_tpm + estimated_tokens <= self.tpm_limit

            if rpm_ok and tpm_ok:
                self.request_events.append(now)
                self.token_events.append((now, estimated_tokens))
                self.daily_count += 1
                return

            waits = []
            if not rpm_ok and self.request_events:
                waits.append(60.0 - (now - self.request_events[0]))

            if not tpm_ok:
                projected = current_tpm + estimated_tokens
                excess = projected - self.tpm_limit
                released = 0
                wait_for_tpm = None
                for ts, tokens in self.token_events:
                    released += tokens
                    if released >= excess:
                        wait_for_tpm = 60.0 - (now - ts)
                        break
                if wait_for_tpm is not None:
                    waits.append(wait_for_tpm)

            sleep_seconds = max(0.05, max(waits) if waits else 0.5)
            print(
                f"Rate limit pacing: sleeping {sleep_seconds:.2f}s "
                f"(RPM {current_rpm}/{self.rpm_limit}, TPM {current_tpm}/{self.tpm_limit})"
            )
            time.sleep(sleep_seconds)


rate_limiter = EmbeddingRateLimiter(
    rpm_limit=EMBED_RPM_LIMIT,
    tpm_limit=EMBED_TPM_LIMIT,
    rpd_limit=EMBED_RPD_LIMIT,
)


# create data from the .toon files in data/encoded, where each file is a chunk of text.
# The data variable should be a list of dicts with filename/content/hash for stable caching.
def load_data_from_encoded(input_dir):
    input_path = Path(input_dir)
    if not input_path.exists():
        raise FileNotFoundError(f"Input directory not found: {input_path}")

    data = []
    for file_path in sorted(input_path.glob("*.toon"), key=lambda p: p.name):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            data.append(
                {
                    "filename": file_path.name,
                    "content": content,
                    "sha256": hashlib.sha256(content.encode("utf-8")).hexdigest(),
                }
            )

    if not data:
        raise ValueError(f"No .toon files found in {input_path}")

    return data


def build_manifest(data):
    return {
        "model": EMBEDDING_MODEL,
        "document_task_type": DOCUMENT_TASK_TYPE,
        "items": [
            {"filename": item["filename"], "sha256": item["sha256"]} for item in data
        ],
    }


def load_manifest():
    if not MANIFEST_FILE.exists():
        return None
    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_manifest(manifest):
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)


def build_or_load_vector_db(data):
    """Load vectors from disk if present and valid, otherwise compute and save them.

    Returns:
        np.ndarray: shape (n_chunks, embedding_dim)
    """
    expected_manifest = build_manifest(data)

    if VECTORS_FILE.exists() and MANIFEST_FILE.exists():
        try:
            vectors = np.load(VECTORS_FILE)
            cached_manifest = load_manifest()
            if vectors.shape[0] == len(data) and cached_manifest == expected_manifest:
                print(f"Loaded {vectors.shape[0]} vectors from {VECTORS_FILE}")
                return vectors
            print(
                "Vector cache mismatch detected (size or manifest differs). Rebuilding."
            )
        except Exception as e:
            print(f"Failed to load vectors from disk: {e}. Rebuilding.")
    elif VECTORS_FILE.exists() != MANIFEST_FILE.exists():
        print(
            "Incomplete vector cache detected (missing vector or manifest file). Rebuilding."
        )

    vectors = []
    total = len(data)
    for index, item in enumerate(data, start=1):
        vec = embed_text(item["content"], task_type=DOCUMENT_TASK_TYPE)
        vectors.append(vec)
        print(f"Embedded {index}/{total}: {item['filename']}")

    vectors = np.stack(vectors)
    try:
        np.save(VECTORS_FILE, vectors)
        save_manifest(expected_manifest)
        print(f"Saved {vectors.shape[0]} vectors to {VECTORS_FILE}")
    except Exception as e:
        print(f"Warning: failed to save vectors to disk: {e}")

    return vectors


def embed_text(chunk, task_type=DOCUMENT_TASK_TYPE):
    """Request embedding for text and return a 1-D numpy array.

    Raises RuntimeError if embedding cannot be retrieved.
    """
    last_error = None
    for attempt in range(1, EMBED_RETRIES + 1):
        try:
            rate_limiter.acquire(chunk)
            resp = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=[chunk],
                config=types.EmbedContentConfig(task_type=task_type),
            )
            if resp is None:
                raise RuntimeError("Embedding API returned None response")
            embeddings = getattr(resp, "embeddings", None)
            if not embeddings or len(embeddings) == 0:
                raise RuntimeError("Embedding API returned no embeddings")
            values = getattr(embeddings[0], "values", None)
            if values is None:
                raise RuntimeError("Embedding object has no values")
            return np.array(values, dtype=np.float32)
        except Exception as e:
            last_error = e
            if attempt == EMBED_RETRIES:
                break
            sleep_seconds = 2 ** (attempt - 1)
            print(
                f"Embedding attempt {attempt}/{EMBED_RETRIES} failed ({e}). Retrying in {sleep_seconds}s..."
            )
            time.sleep(sleep_seconds)

    raise RuntimeError(f"Embedding failed after {EMBED_RETRIES} attempts: {last_error}")


def initialize_vector_database(input_dir=ENCODED_DIR):
    global vector_database
    data = load_data_from_encoded(input_dir)
    print(f"Loaded {len(data)} chunks from {input_dir}")
    print(
        "Embedding limiter active: "
        f"RPM={EMBED_RPM_LIMIT}, TPM={EMBED_TPM_LIMIT}, RPD={EMBED_RPD_LIMIT}, "
        f"chars/token≈{TOKEN_ESTIMATE_CHARS_PER_TOKEN}"
    )
    vector_database = build_or_load_vector_db(data)
    return vector_database

def retrieve_similar_chunks(query, top_k=5):
    """Given a query string, return the filenames of the top_k most similar chunks."""
    if vector_database is None:
        raise RuntimeError("Vector database not initialized")

    query_vec = embed_text(query, task_type=QUERY_TASK_TYPE)
    similarities = vector_database @ query_vec
    top_indices = np.argsort(similarities)[::-1][:top_k]
    return top_indices


if __name__ == "__main__":
    initialize_vector_database()
