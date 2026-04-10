from __future__ import annotations

from uuid import uuid4

from fastapi import Request


def get_trace_id(request: Request) -> str:
    trace = request.headers.get("x-trace-id")
    return trace if trace else str(uuid4())

