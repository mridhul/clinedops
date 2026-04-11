FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends bash openssl && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml ./
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./
COPY backend/docker ./docker

RUN pip install --no-cache-dir -U pip && pip install --no-cache-dir .

# Knowledge base for RAG: source folder relative to image build context (repo root). See RAG_DOCS_BUILD_PATH in docker-compose.
ARG RAG_DOCS_BUILD_PATH=DOCS
COPY ${RAG_DOCS_BUILD_PATH} /DOCS
ENV RAG_DOCS_PATH=/DOCS
ENV RAG_INDEX_PATH=/rag_data
RUN mkdir -p /rag_data && python -m app.scripts.build_rag_index

EXPOSE 8000

CMD ["bash", "-c", "/app/docker/entrypoint.sh"]
