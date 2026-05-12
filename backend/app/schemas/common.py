"""공용 Pydantic 응답 스키마."""
from pydantic import BaseModel


class LikeStatus(BaseModel):
    """좋아요 토글 응답."""

    is_liked: bool
    like_count: int


class ScrapStatus(BaseModel):
    """스크랩 토글 응답."""

    is_scrapped: bool
    scrap_count: int
