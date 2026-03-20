FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends bash openssl && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY docker ./docker

RUN pip install --no-cache-dir -U pip && pip install --no-cache-dir .

EXPOSE 8000

CMD ["bash", "-c", "/app/docker/entrypoint.sh"]

