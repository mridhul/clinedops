from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.postings.schemas import PostingCreate, PostingListResponse, PostingOut, PostingUpdate
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.services import posting_service

router = APIRouter(prefix="/postings", tags=["postings"])


@router.get("", response_model=Envelope[PostingListResponse])
async def list_postings(
    discipline: Optional[str] = Query(None),
    department_id: Optional[UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[PostingListResponse]:
    data = await posting_service.list_postings(
        session,
        actor=actor,
        discipline=discipline,
        department_id=department_id,
        date_from=date_from,
        date_to=date_to,
        status_filter=status,
        limit=limit,
        offset=offset,
    )
    return Envelope(
        data=data,
        meta={"total": data.total, "limit": data.limit, "offset": data.offset},
        errors=None,
    )


@router.get("/{posting_id}", response_model=Envelope[PostingOut])
async def get_posting(
    posting_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[PostingOut]:
    out = await posting_service.get_posting(session, actor=actor, posting_id=posting_id)
    return Envelope(data=out, meta=None, errors=None)


@router.post("", response_model=Envelope[PostingOut])
async def create_posting(
    payload: PostingCreate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[PostingOut]:
    out = await posting_service.create_posting(session, actor=actor, payload=payload)
    return Envelope(data=out, meta=None, errors=None)


@router.patch("/{posting_id}", response_model=Envelope[PostingOut])
async def patch_posting(
    posting_id: UUID,
    payload: PostingUpdate,
    session: AsyncSession = Depends(get_db_session),
    actor: User = Depends(get_current_user),
) -> Envelope[PostingOut]:
    out = await posting_service.update_posting(session, actor=actor, posting_id=posting_id, payload=payload)
    return Envelope(data=out, meta=None, errors=None)
