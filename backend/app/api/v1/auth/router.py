from __future__ import annotations

from typing import Optional

import shutil
import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, Request, Response, File, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.auth.schemas import (
    ForgotPasswordRequest, 
    LoginRequest, 
    MeResponse, 
    ResetPasswordRequest, 
    TokenResponse,
    ProfileUpdate
)
from app.core.config import get_settings
from app.core.security import decode_jwt
from app.db.models import User
from app.db.models.enums import DisciplineEnum, RoleEnum
from app.db.session import get_db_session
from app.schemas.envelope import Envelope
from app.services.auth_service import (
    forgot_password as forgot_password_service,
    login as login_service,
    logout as logout_service,
    reset_password as reset_password_service,
    refresh_access_token,
)


router = APIRouter(prefix="/auth", tags=["auth"])
bearer_optional = HTTPBearer(auto_error=False)


@router.post("/login", response_model=Envelope[TokenResponse])
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
) -> Envelope[TokenResponse]:
    try:
        result = await login_service(session, email=payload.email, password=payload.password)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    settings = get_settings()
    response.set_cookie(
        key="refresh_token",
        value=result.refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
    )

    return Envelope(
        data=TokenResponse(
            access_token=result.access_token,
            role=result.role,
            discipline=result.discipline,
        ),
        meta=None,
        errors=None,
    )


@router.post("/logout", response_model=Envelope[dict])
async def logout(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_optional),
) -> Envelope[dict]:
    # Logout is idempotent: clear cookie even if token is missing/invalid.
    response.delete_cookie("refresh_token")

    user: Optional[User] = None
    if credentials is not None:
        try:
            decoded = decode_jwt(credentials.credentials, expected_type="access")
            res = await session.execute(select(User).where(User.id == decoded.user_id, User.is_active.is_(True)))
            user = res.scalar_one_or_none()
        except Exception:
            user = None

    await logout_service(session=session, user=user)
    return Envelope(data={}, meta=None, errors=None)


@router.post("/refresh", response_model=Envelope[TokenResponse])
async def refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
) -> Envelope[TokenResponse]:
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        result = await refresh_access_token(session=session, refresh_token=refresh_token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    settings = get_settings()
    response.set_cookie(
        key="refresh_token",
        value=result.refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
    )

    return Envelope(
        data=TokenResponse(access_token=result.access_token, role=result.role, discipline=result.discipline),
        meta=None,
        errors=None,
    )


@router.get("/me", response_model=Envelope[MeResponse])
async def me(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Envelope[MeResponse]:
    from app.services.admin_service import AdminService
    service = AdminService(session)
    permissions = await service.get_permissions_for_role(user.role)
    
    return Envelope(
        data=MeResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            title=user.title,
            profile_photo_url=user.profile_photo_url,
            role=RoleEnum(user.role),
            discipline=DisciplineEnum(user.discipline) if user.discipline else None,
            permissions=permissions,
        ),
        meta=None,
        errors=None,
    )


@router.patch("/me", response_model=Envelope[MeResponse])
async def update_me(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Envelope[MeResponse]:
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.title is not None:
        user.title = payload.title
    
    await session.flush()
    await session.commit()
    await session.refresh(user)

    from app.services.admin_service import AdminService
    service = AdminService(session)
    permissions = await service.get_permissions_for_role(user.role)

    return Envelope(
        data=MeResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            title=user.title,
            profile_photo_url=user.profile_photo_url,
            role=RoleEnum(user.role),
            discipline=DisciplineEnum(user.discipline) if user.discipline else None,
            permissions=permissions,
        )
    )


@router.post("/me/profile-photo", response_model=Envelope[MeResponse])
async def upload_profile_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Envelope[MeResponse]:
    # Check file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Ensure upload directory exists
    upload_dir = os.path.join("uploads", "profiles")
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update user
    # Store the URL path that the frontend will use
    user.profile_photo_url = f"/uploads/profiles/{filename}"
    
    await session.flush()
    await session.commit()
    await session.refresh(user)

    from app.services.admin_service import AdminService
    service = AdminService(session)
    permissions = await service.get_permissions_for_role(user.role)

    return Envelope(
        data=MeResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            title=user.title,
            profile_photo_url=user.profile_photo_url,
            role=RoleEnum(user.role),
            discipline=DisciplineEnum(user.discipline) if user.discipline else None,
            permissions=permissions,
        )
    )



@router.post("/forgot-password", response_model=Envelope[dict])
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> Envelope[dict]:
    token = await forgot_password_service(session, email=payload.email, expires_in_seconds=30 * 60)
    # In this scaffold we do not send email; token is returned for testability.
    return Envelope(data={"reset_token": token}, meta=None, errors=None)


@router.post("/reset-password", response_model=Envelope[dict])
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> Envelope[dict]:
    try:
        await reset_password_service(session, token=payload.token, new_password=payload.new_password)
        await session.commit()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    return Envelope(data={}, meta=None, errors=None)

