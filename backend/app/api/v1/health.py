from __future__ import annotations

from fastapi import APIRouter

from app.schemas.envelope import Envelope

router = APIRouter(tags=["health"])


@router.get("/health", response_model=Envelope[dict])
async def health() -> Envelope[dict]:
    return Envelope(data={"status": "ok"}, meta=None, errors=None)

