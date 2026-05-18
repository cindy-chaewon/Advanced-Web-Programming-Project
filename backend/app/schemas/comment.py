from __future__ import annotations
"""댓글(Comment) Pydantic 스키마."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserPublic


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    comment_id: int
    post_id: int
    content: str
    author: UserPublic | None = None
    created_at: datetime
    updated_at: datetime | None = None
