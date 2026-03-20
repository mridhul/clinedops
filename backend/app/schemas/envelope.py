from __future__ import annotations

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorItem(BaseModel):
    code: str
    message: str
    field: Optional[str] = None
    trace_id: Optional[str] = None


class Envelope(BaseModel, Generic[T]):
    data: Optional[T] = None
    meta: Optional[dict] = None
    errors: Optional[list[ErrorItem]] = None

