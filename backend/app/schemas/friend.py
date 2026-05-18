from __future__ import annotations
"""친구 Pydantic 스키마."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class FriendRequestBody(BaseModel):
    """친구 요청 — 대상 사용자."""

    target_user_id: int = Field(..., gt=0)


class FriendActionBody(BaseModel):
    """수락/거절 — 요청 보낸 사람의 user_id."""

    from_user_id: int = Field(..., gt=0)


class FriendOut(BaseModel):
    """친구 목록 항목 (상대방 정보 + 핀 색상)."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    username: str
    profile_image: str | None = None
    color: str
    status: str
    created_at: datetime


class FriendRequestOut(BaseModel):
    """받은 친구 요청 (보낸 사람 정보)."""

    from_user_id: int
    from_username: str
    from_profile_image: str | None = None
    created_at: datetime


class FriendColorUpdate(BaseModel):
    """친구 핀 색상 변경."""

    color: Literal["pink", "blue", "green", "purple", "coral"]
