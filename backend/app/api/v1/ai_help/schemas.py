from __future__ import annotations

from pydantic import BaseModel, Field


class AiHelpChatIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)


class AiHelpChatOut(BaseModel):
    reply: str
