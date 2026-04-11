from __future__ import annotations

import json
import threading
from pathlib import Path

import numpy as np
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_groq import ChatGroq

from app.core.config import get_settings
from app.services.rag.constants import (
    INDEX_DOCUMENTS_NAME,
    INDEX_EMBEDDINGS_NAME,
    INDEX_MANIFEST_NAME,
)

_lock = threading.Lock()
_chain = None


def _format_docs(docs):
    return "\n\n".join(d.page_content for d in docs)


def _build_chain():
    settings = get_settings()
    index_dir = Path(settings.rag_index_path)
    if not (index_dir / INDEX_MANIFEST_NAME).is_file():
        raise FileNotFoundError(f"RAG manifest missing under {index_dir}")

    manifest = json.loads((index_dir / INDEX_MANIFEST_NAME).read_text(encoding="utf-8"))
    embed_model = manifest.get("embed_model")
    if not embed_model:
        raise ValueError("RAG manifest missing embed_model")

    embeddings_arr = np.load(index_dir / INDEX_EMBEDDINGS_NAME)
    docs_raw = json.loads((index_dir / INDEX_DOCUMENTS_NAME).read_text(encoding="utf-8"))
    texts = [d["page_content"] for d in docs_raw]
    metadatas = [d.get("metadata") or {} for d in docs_raw]
    embeddings_list = embeddings_arr.astype(np.float64).tolist()

    embedder = FastEmbedEmbeddings(model_name=embed_model)
    store = InMemoryVectorStore(embedding=embedder)
    store.add_texts(texts, metadatas=metadatas, embeddings=embeddings_list)

    retriever = store.as_retriever(search_kwargs={"k": settings.rag_retrieval_k})

    llm = ChatGroq(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        temperature=0,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are ClinEdOps AI Help. Use ONLY the following context to answer. "
                "If the answer is not in the context, say you do not have that information "
                "in the provided materials. Be concise and clear. "
                "When naming parts of the app, you may wrap labels in **double asterisks**.\n\n"
                "Context:\n{context}",
            ),
            ("human", "{input}"),
        ]
    )

    return (
        {"context": retriever | _format_docs, "input": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )


def run_rag_query(question: str) -> str:
    global _chain
    with _lock:
        if _chain is None:
            _chain = _build_chain()
        chain = _chain
    answer = chain.invoke(question.strip())
    if not isinstance(answer, str) or not answer.strip():
        return "I could not generate a reply. Please try rephrasing your question."
    return answer.strip()
