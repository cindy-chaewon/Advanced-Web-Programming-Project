from __future__ import annotations
"""식당/주소/카테고리/점수 Pydantic 스키마."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ─────────────────────────── Category ───────────────────────────


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_id: int
    name: str


# ─────────────────────────── Address ───────────────────────────


class AddressIn(BaseModel):
    """식당 등록 시 함께 받는 주소."""

    full_address: str | None = Field(default=None, max_length=200)
    district: str | None = Field(default=None, max_length=50, description="구/군")
    city: str | None = Field(default=None, max_length=50, description="시")
    latitude: Decimal = Field(..., description="위도")
    longitude: Decimal = Field(..., description="경도")


class AddressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    address_id: int
    full_address: str | None = None
    district: str | None = None
    city: str | None = None
    latitude: Decimal
    longitude: Decimal


# ─────────────────────────── Score ───────────────────────────


class RestaurantScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    restaurant_id: int
    avg_review_score: float = 0.0
    review_count: int = 0
    scrap_count: int = 0
    total_score: float = 0.0
    updated_at: datetime | None = None


# ─────────────────────────── Restaurant CRUD ───────────────────────────


class RestaurantCreate(BaseModel):
    """식당 등록 요청."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(default=None, description="식당 설명")
    phone: str | None = Field(default=None, max_length=20)
    opening_hours: str | None = Field(
        default=None, max_length=100, description="예: 매일 11:00 - 22:00"
    )
    break_time: str | None = Field(
        default=None, max_length=100, description="예: 15:00 - 17:00"
    )
    thumbnail_url: str | None = Field(default=None, max_length=255)
    image_urls: list[str] = Field(
        default_factory=list, description="식당 갤러리 이미지 URL 목록"
    )
    category_id: int = Field(..., gt=0)
    address: AddressIn
    hashtags: list[str] = Field(
        default_factory=list,
        description="해시태그 이름 목록 (# 제외)",
    )
    group_ids: list[int] = Field(
        default_factory=list,
        description="추가할 그룹 ID 목록 (등록자가 멤버인 그룹만 반영)",
    )


class RestaurantUpdate(BaseModel):
    """식당 정보 부분 수정. 보낸 필드만 갱신."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None)
    phone: str | None = Field(default=None, max_length=20)
    opening_hours: str | None = Field(default=None, max_length=100)
    break_time: str | None = Field(default=None, max_length=100)
    thumbnail_url: str | None = Field(default=None, max_length=255)
    image_urls: list[str] | None = Field(
        default=None, description="None=미변경, []=모두 제거, 그 외=전체 교체"
    )
    category_id: int | None = Field(default=None, gt=0)
    address: AddressIn | None = None
    hashtags: list[str] | None = Field(
        default=None,
        description="None이면 미변경, []면 모든 태그 제거, 그 외면 전체 교체",
    )


class RestaurantBrief(BaseModel):
    """리스트/검색용 경량 응답."""

    model_config = ConfigDict(from_attributes=True)

    restaurant_id: int
    name: str
    phone: str | None = None
    opening_hours: str | None = None
    category: CategoryOut | None = None
    address: AddressOut | None = None
    hashtags: list[str] = Field(default_factory=list)
    avg_review_score: float = 0.0
    review_count: int = 0
    scrap_count: int = 0
    distance_meters: float | None = None
    thumbnail_url: str | None = None


class RestaurantRead(BaseModel):
    """식당 상세 응답."""

    model_config = ConfigDict(from_attributes=True)

    restaurant_id: int
    name: str
    description: str | None = None
    phone: str | None = None
    opening_hours: str | None = None
    break_time: str | None = None
    thumbnail_url: str | None = None
    images: list[str] = Field(default_factory=list, description="식당 갤러리 이미지 URL 목록")
    category: CategoryOut | None = None
    address: AddressOut | None = None
    hashtags: list[str] = Field(default_factory=list)
    score: RestaurantScoreOut | None = None
    registered_by: int | None = None
    created_at: datetime
