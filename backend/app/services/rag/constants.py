"""Shared RAG defaults (build script and runtime must stay aligned)."""

DEFAULT_EMBED_MODEL = "BAAI/bge-small-en-v1.5"
DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200
INDEX_MANIFEST_NAME = "manifest.json"
INDEX_EMBEDDINGS_NAME = "embeddings.npy"
INDEX_DOCUMENTS_NAME = "documents.json"
