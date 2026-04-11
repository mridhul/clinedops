# AI Help Documentation

## Overview
ClinEdOps **AI Help** is a Retrieval-Augmented Generation (RAG) assistant designed to answer platform-specific and organizational questions. It combines the power of **Groq's Llama-3.3** language models with a localized knowledge base built from documents in the repository.

---

## Technical Architecture

### 1. Vector Retrieval (RAG)
Instead of relying solely on the LLM's pre-trained knowledge, the assistant retrieves relevant snippets from local documents in real-time.
- **Engine**: LangChain with `InMemoryVectorStore`.
- **Embeddings**: `FastEmbedEmbeddings` using the `BAAI/bge-small-en-v1.5` model.
- **Retrieval Logic**: The system performs a similarity search across pre-computed embeddings of document chunks and provides the top $k$ relevant results $(default: k=4)$ as context to the LLM.

### 2. Language Model
- **Provider**: [Groq](https://groq.com/) for low-latency inference.
- **Model**: `llama-3.3-70b-versatile` (configurable via `GROQ_MODEL`).

---

## Data Sources

The AI Help knowledge base is built from files located in the `/DOCS` directory.
- **Supported Formats**: `.md` (Markdown) and `.pdf` (Portable Document Format).
- **Current Content**:
    - **PRD & Strategy**: Product Requirements and Unified Platform briefs.
    - **Clinical Content**: Discipline-specific files (e.g., `INFECTIOUS DISEASES.pdf`).
    - **System Config**: RBAC mappings and demo scripts.

---

## How it Works

1.  **Ingestion (Build Time)**:
    -   Documents are loaded, cleaned, and split into chunks $(chunk\_size=1000, overlap=200)$.
    -   High-dimensional vector embeddings are generated for each chunk.
    -   The results are saved to `/rag_data` as a set of static files (`manifest.json`, `embeddings.npy`, `documents.json`).
2.  **Query (Runtime)**:
    -   User sends a message via the **AI Help** page.
    -   The system embeds the user's query.
    -   The most relevant document chunks are retrieved from the index.
    -   The LLM receives the chunks and the query, generating a concise answer based *strictly* on the provided context.

---

## How to Add More Context

To enrich the AI Help's knowledge, follow these steps:

### 1. Add Sources
Place your new `.md` or `.pdf` files into the `DOCS/` folder in the project root.

### 2. Standardize Content
-   For PDFs, ensure they are text-searchable (not scanned images).
-   For Markdown, use clear headings for better chunking quality.

### 3. Rebuild the Index
Run the build script to update the vector data:
```bash
cd backend
# Ensure backend/.env has the correct RAG_DOCS_PATH and RAG_INDEX_PATH
python -m app.scripts.build_rag_index
```

### 4. Restart the Service
The RAG index is loaded into memory at startup. Restart the backend API for changes to take effect:
```bash
docker compose restart backend
```

---

## Troubleshooting

-   **"Knowledge base index is not available"**: Ensure the `RAG_INDEX_PATH` directory (default `/rag_data`) contains the three required index files and is reachable by the backend.
-   **"AI Help is not configured"**: Check your `GROQ_API_KEY` in `backend/.env`.
-   **Poor Answer Quality**: Try reducing `DEFAULT_CHUNK_SIZE` or increasing `rag_retrieval_k` in the configuration if the context retrieved is too fragmented.
