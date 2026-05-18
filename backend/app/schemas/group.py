from __future__ import annotations
"""그룹 Pydantic 스키마."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="blue", max_length=20)
    icon: str | None = Field(default=None, max_length=10, description="이모지")
    invite_user_ids: list[int] = Field(
        default_factory=list, description="생성 시 초대할 멤버 user_id 목록"
    )


class GroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = Field(default=None, max_length=20)
    icon: str | None = Field(default=None, max_length=10)


class GroupMemberInvite(BaseModel):
    user_ids: list[int] = Field(..., min_length=1)


class GroupMemberOut(BaseModel):
    user_id: int
    username: str
    profile_image: str | None = None
    role: str
    joined_at: datetime


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    group_id: int
    name: str
    owner_id: int
    color: str | None = None
    icon: str | None = None
    member_count: int = 0
    created_at: datetime
