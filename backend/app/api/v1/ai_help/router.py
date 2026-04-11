from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.ai_help.schemas import AiHelpChatIn, AiHelpChatOut
from app.api.v1.deps import get_current_user
from app.core.config import get_settings
from app.db.models import User
from app.schemas.envelope import Envelope
from app.services.rag.service import run_rag_query

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=Envelope[AiHelpChatOut])
async def ai_help_chat(
    body: AiHelpChatIn,
    _user: User = Depends(get_current_user),
):
    settings = get_settings()
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Help is not configured (missing GROQ_API_KEY).",
        )
    try:
        reply = await asyncio.to_thread(run_rag_query, body.message)
    except FileNotFoundError as e:
        logger.warning("RAG index unavailable: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Knowledge base index is not available.",
        ) from e
    except Exception as e:
        logger.exception("AI Help RAG failure")
        err_s = str(e).lower()
        hint = ""
        if any(
            s in err_s
            for s in ("model", "invalid model", "not found", "does not exist", "unknown model")
        ):
            hint = " Try a supported Groq model in backend/.env, e.g. GROQ_MODEL=llama-3.3-70b-versatile, then restart the API."
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"The assistant failed to complete your request.{hint}",
        ) from e

    return Envelope(data=AiHelpChatOut(reply=reply), meta=None, errors=None)
