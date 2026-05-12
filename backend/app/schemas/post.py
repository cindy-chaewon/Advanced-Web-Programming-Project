"""블로그 글(Post) Pydantic 스키마."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserPublic
from app.schemas.restaurant import RestaurantBrief


class PostCreate(BaseModel):
    restaurant_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    hashtags: list[str] = Field(default_factory=list, description="해시태그 (# 제외)")
    image_urls: list[str] = Field(
        default_factory=list, description="업로드한 이미지 URL 목록"
    )
    thumbnail_url: str | None = Field(
        default=None, description="대표 이미지 (생략 시 첫 이미지 자동 설정)"
    )


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)
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
    title: str | None = None
    content_preview: str = ""
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
    title: str | None = None
    content: str | None = None
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
