"""REVIEW_LIKES 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ReviewLike(Base):
    __tablename__ = "REVIEW_LIKES"

    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        primary_key=True,
    )
    review_id = Column(
        Integer,
        ForeignKey("REVIEWS.review_id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="review_likes")
    review = relationship("Review", back_populates="likes")

    def __repr__(self) -> str:
        return f"<ReviewLike user_id={self.user_id} review_id={self.review_id}>"
