#!/usr/bin/env bash
set -euo pipefail

JWT_PRIVATE_KEY="${JWT_PRIVATE_KEY:-}"
JWT_PUBLIC_KEY="${JWT_PUBLIC_KEY:-}"

# If keys aren't provided, generate ephemeral dev keys so RS256 can function.
if [[ -z "${JWT_PRIVATE_KEY}" || -z "${JWT_PUBLIC_KEY}" ]]; then
  mkdir -p /tmp/jwt
  if [[ ! -s /tmp/jwt/private.pem || ! -s /tmp/jwt/public.pem ]]; then
    openssl genrsa -out /tmp/jwt/private.pem 2048 >/dev/null 2>&1
    openssl rsa -in /tmp/jwt/private.pem -pubout -out /tmp/jwt/public.pem >/dev/null 2>&1
  fi
  export JWT_PRIVATE_KEY
  export JWT_PUBLIC_KEY
  JWT_PRIVATE_KEY="$(cat /tmp/jwt/private.pem)"
  JWT_PUBLIC_KEY="$(cat /tmp/jwt/public.pem)"
  export JWT_PRIVATE_KEY JWT_PUBLIC_KEY
fi

echo "Waiting for Postgres to accept connections..."
python - <<'PY'
import asyncio
import os

import asyncpg

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is required")

# asyncpg expects a plain postgresql:// DSN, while SQLAlchemy uses postgresql+asyncpg://
asyncpg_url = database_url.replace("postgresql+asyncpg://", "postgresql://")


async def main():
    last_err = None
    for _ in range(60):
        try:
            conn = await asyncpg.connect(asyncpg_url, timeout=2)
            await conn.close()
            return
        except Exception as e:
            last_err = e
            await asyncio.sleep(1)
    raise RuntimeError(f"Postgres not reachable after retries: {last_err}")


asyncio.run(main())
PY

alembic upgrade head
# Seed data if needed - disabled to avoid startup crashes. Use app.scripts.seed manually.
# python -m app.scripts.seed_demo_data


uvicorn app.main:app --host 0.0.0.0 --port 8000

