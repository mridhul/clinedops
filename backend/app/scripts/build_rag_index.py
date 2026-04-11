"""
Build RAG index at Docker image build time (chunk + embed → /rag_data).

Paths are read from environment, including backend/.env (same as other settings):
  RAG_DOCS_PATH — folder containing .md and .pdf (in Docker this is /DOCS after COPY).
  RAG_INDEX_PATH — output directory for manifest + embeddings + documents JSON.

Run manually from repo (after setting vars in backend/.env or the shell):
  cd backend && python -m app.scripts.build_rag_index
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
from pydantic_settings import BaseSettings, SettingsConfigDict
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.services.rag.constants import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_EMBED_MODEL,
    INDEX_DOCUMENTS_NAME,
    INDEX_EMBEDDINGS_NAME,
    INDEX_MANIFEST_NAME,
)

_BACKEND_ROOT = Path(__file__).resolve().parents[2]


class _RagBuildSettings(BaseSettings):
    """Loads RAG paths from env and backend/.env without requiring DATABASE_URL."""

    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    rag_docs_path: str = "/DOCS"
    rag_index_path: str = "/rag_data"


def _discover_files(docs_root: Path) -> list[Path]:
    if not docs_root.is_dir():
        return []
    out: list[Path] = []
    for pattern in ("**/*.md", "**/*.pdf"):
        for p in docs_root.glob(pattern):
            if p.is_file() and not p.name.startswith("."):
                out.append(p)
    return sorted(set(out))


def _load_one(path: Path) -> list[Document]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        loader = PyPDFLoader(str(path))
        docs = loader.load()
    elif suffix == ".md":
        loader = TextLoader(str(path), encoding="utf-8")
        docs = loader.load()
    else:
        return []
    for d in docs:
        d.metadata = dict(d.metadata or {})
        d.metadata["source"] = str(path)
    return docs


def main() -> None:
    cfg = _RagBuildSettings()
    docs_path = Path(cfg.rag_docs_path).expanduser().resolve()
    index_path = Path(cfg.rag_index_path).expanduser().resolve()
    embed_model = os.environ.get("RAG_EMBED_MODEL", DEFAULT_EMBED_MODEL)
    chunk_size = int(os.environ.get("RAG_CHUNK_SIZE", str(DEFAULT_CHUNK_SIZE)))
    chunk_overlap = int(os.environ.get("RAG_CHUNK_OVERLAP", str(DEFAULT_CHUNK_OVERLAP)))

    files = _discover_files(docs_path)
    if not files:
        print(f"RAG build error: no .md or .pdf files under {docs_path}", file=sys.stderr)
        sys.exit(1)

    raw_docs: list[Document] = []
    for fp in files:
        try:
            raw_docs.extend(_load_one(fp))
        except Exception as e:
            print(f"RAG build warning: skip {fp}: {e}", file=sys.stderr)

    if not raw_docs:
        print("RAG build error: no document text loaded", file=sys.stderr)
        sys.exit(1)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    splits = splitter.split_documents(raw_docs)
    if not splits:
        print("RAG build error: chunking produced no segments", file=sys.stderr)
        sys.exit(1)

    texts = [d.page_content for d in splits]
    metadatas = [dict(d.metadata) for d in splits]

    embedder = FastEmbedEmbeddings(model_name=embed_model)
    vectors = embedder.embed_documents(texts)
    arr = np.asarray(vectors, dtype=np.float32)
    if arr.ndim != 2:
        print("RAG build error: embeddings must be 2-D", file=sys.stderr)
        sys.exit(1)

    index_path.mkdir(parents=True, exist_ok=True)
    np.save(index_path / INDEX_EMBEDDINGS_NAME.replace(".npy", ""), arr)

    docs_payload = [{"page_content": t, "metadata": m} for t, m in zip(texts, metadatas)]
    with (index_path / INDEX_DOCUMENTS_NAME).open("w", encoding="utf-8") as f:
        json.dump(docs_payload, f, ensure_ascii=False)

    manifest = {
        "embed_model": embed_model,
        "embedding_dim": int(arr.shape[1]),
        "num_chunks": int(arr.shape[0]),
        "docs_root": str(docs_path),
    }
    with (index_path / INDEX_MANIFEST_NAME).open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(
        f"RAG index built: {manifest['num_chunks']} chunks, dim={manifest['embedding_dim']}, "
        f"model={embed_model}, out={index_path}"
    )


if __name__ == "__main__":
    main()
