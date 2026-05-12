"""AI(Gemini) 응답 Pydantic 스키마."""
from pydantic import BaseModel


class AISummaryOut(BaseModel):
    """글 본문 AI 요약 응답."""

    post_id: int
    summary: str
    cached: bool


class AIReviewOut(BaseModel):
    """식당 종합 AI 평 응답."""

    restaurant_id: int
    review: str
    review_count: int
    post_count: int
