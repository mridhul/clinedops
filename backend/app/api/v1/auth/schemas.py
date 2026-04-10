from __future__ import annotations

from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.db.models.enums import DisciplineEnum, RoleEnum


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    role: RoleEnum
    discipline: Optional[DisciplineEnum] = None


class MeResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    title: Optional[str] = None
    profile_photo_url: Optional[str] = None
    role: RoleEnum
    discipline: Optional[DisciplineEnum] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    title: Optional[str] = Field(None, max_length=100)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

