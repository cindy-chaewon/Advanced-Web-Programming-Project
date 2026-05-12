"""RESTAURANT_SCORES 테이블 모델 (식당 신뢰도 점수 캐시)."""
from __future__ import annotations

from sqlalchemy import Column, Float, ForeignKey, Integer, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class RestaurantScore(Base):
    __tablename__ = "RESTAURANT_SCORES"

    restaurant_id = Column(
        Integer,
        ForeignKey("RESTAURANTS.restaurant_id", ondelete="CASCADE"),
        primary_key=True,
        comment="식당 ID (1:1)",
    )
    avg_review_score = Column(Float, server_default="0", comment="리뷰 평균 별점")
    review_count = Column(Integer, server_default="0", comment="리뷰 수")
    scrap_count = Column(Integer, server_default="0", comment="스크랩 수")
    total_score = Column(Float, server_default="0", comment="최종 복합 점수")
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
        comment="갱신일",
    )

    restaurant = relationship("Restaurant", back_populates="score")

    def __repr__(self) -> str:
        return (
            f"<RestaurantScore restaurant_id={self.restaurant_id} "
            f"total_score={self.total_score}>"
        )
