"""사용자 관련 Pydantic 스키마."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserMeOut(BaseModel):
    """내 정보 응답."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    username: str
    email: str | None = None
    profile_image: str | None = None
    bio: str | None = None
    points: int = 0
    level: int = 1
    created_at: datetime


class UserProfileUpdate(BaseModel):
    """프로필 수정 요청 (PUT /users/me)."""

    username: str | None = Field(default=None, min_length=1, max_length=50)
    profile_image: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=500)


class UserSearchHit(BaseModel):
    """닉네임 검색 결과 항목 (친구 관계 포함)."""

    user_id: int
    username: str
    profile_image: str | None = None
    bio: str | None = None
    friend_status: str = "none"
    """none | pending_sent | pending_received | accepted | self"""


class UserPublicProfile(BaseModel):
    """다른 사용자 공개 프로필 + 통계."""

    user_id: int
    username: str
    profile_image: str | None = None
    bio: str | None = None
    level: int = 1
    post_count: int = 0
    review_count: int = 0
    friend_count: int = 0
    friend_status: str = "none"


class NicknameCheckOut(BaseModel):
    nickname: str
    available: bool


class NotificationSettingsUpdate(BaseModel):
    friend_request: bool | None = None
    likes: bool | None = None
    group_invite: bool | None = None
    marketing: bool | None = None


class NotificationSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    friend_request: bool
    likes: bool
    group_invite: bool
    marketing: bool


class UserStatsOut(BaseModel):
    """마이페이지 통계."""

    post_count: int
    review_count: int
    scrap_count: int
    friend_count: int
