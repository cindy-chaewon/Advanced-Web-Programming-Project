from __future__ import annotations
"""블로그 글(Post) / 간단 리뷰(simple) Pydantic 스키마."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.auth import UserPublic
from app.schemas.restaurant import RestaurantBrief


class PostCreate(BaseModel):
    type: Literal["blog", "simple"] = "blog"
    restaurant_id: int = Field(..., gt=0)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    score: int | None = Field(default=None, ge=1, le=5, description="별점 1-5 (simple 타입 필수)")
    hashtags: list[str] = Field(default_factory=list, description="해시태그 (# 제외)")
    image_urls: list[str] = Field(
        default_factory=list, description="업로드한 이미지 URL 목록"
    )
    thumbnail_url: str | None = Field(
        default=None, description="대표 이미지 (생략 시 첫 이미지 자동 설정)"
    )

    @model_validator(mode="after")
    def check_simple_requires_score(self) -> "PostCreate":
        if self.type == "simple" and self.score is None:
            raise ValueError("간단 리뷰(simple)는 score(별점)가 필수입니다.")
        return self


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)
    score: int | None = Field(default=None, ge=1, le=5)
    hashtags: list[str] | None = None
    image_urls: list[str] | None = Field(
        default=None,
        description="None=미변경 / [] = 모두 제거 / 그 외 = 전체 교체",
    )
    thumbnail_url: str | None = None


class PostBrief(BaseModel):
    """카드 리스트용 경량."""

    model_config = ConfigDict(from_attributes=True)

    post_id: int
    type: str = "blog"
    title: str | None = None
    content_preview: str = ""
    score: int | None = None
    thumbnail_url: str | None = None
    author: UserPublic
    restaurant: RestaurantBrief | None = None
    hashtags: list[str] = Field(default_factory=list)
    like_count: int = 0
    comment_count: int = 0
    created_at: datetime


class PostRead(BaseModel):
    """글 상세."""

    model_config = ConfigDict(from_attributes=True)

    post_id: int
    type: str = "blog"
    title: str | None = None
    content: str | None = None
    score: int | None = None
    ai_summary: str | None = None
    thumbnail_url: str | None = None
    author: UserPublic
    restaurant: RestaurantBrief | None = None
    images: list[str] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list)
    like_count: int = 0
    comment_count: int = 0
    is_liked: bool = False
    created_at: datetime
    updated_at: datetime | None = None
