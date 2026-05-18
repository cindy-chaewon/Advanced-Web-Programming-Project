from __future__ import annotations
"""리뷰(Review) Pydantic 스키마."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserPublic


class ReviewCreate(BaseModel):
    type: Literal["simple", "blog"] = Field(default="simple", description="간단 / 블로그형")
    content: str = Field(..., min_length=1)
    score: int = Field(..., ge=1, le=5, description="별점 1~5")
    image_urls: list[str] = Field(default_factory=list, description="첨부 이미지")


class ReviewUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1)
    score: int | None = Field(default=None, ge=1, le=5)
    image_urls: list[str] | None = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    review_id: int
    type: str
    content: str | None = None
    score: int | None = None
    author: UserPublic
    restaurant_id: int
    restaurant_name: str | None = None
    images: list[str] = Field(default_factory=list)
    like_count: int = 0
    is_liked: bool = False
    created_at: datetime
    updated_at: datetime | None = None
