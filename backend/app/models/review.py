"""REVIEWS 테이블 모델 (간단 리뷰 / 블로그형 리뷰)."""
from __future__ import annotations

from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, Text, TIMESTAMP
from sqlalchemy.dialects.mysql import ENUM, TINYINT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Review(Base):
    __tablename__ = "REVIEWS"
    __table_args__ = (
        CheckConstraint("score BETWEEN 1 AND 5", name="ck_review_score_range"),
    )

    review_id = Column(Integer, primary_key=True, autoincrement=True, comment="리뷰 ID")
    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        comment="작성자",
    )
    restaurant_id = Column(
        Integer,
        ForeignKey("RESTAURANTS.restaurant_id", ondelete="CASCADE"),
        comment="대상 식당",
    )
    type = Column(
        ENUM("simple", "blog"),
        server_default="simple",
        comment="리뷰 타입 (간단 / 블로그형)",
    )
    content = Column(Text, comment="본문")
    score = Column(TINYINT, comment="별점 (1~5)")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="작성일")
    updated_at = Column(TIMESTAMP, nullable=True, onupdate=func.now(), comment="수정일")

    author = relationship("User", back_populates="reviews")
    restaurant = relationship("Restaurant", back_populates="reviews")
    images = relationship(
        "Image",
        back_populates="review",
        cascade="all, delete-orphan",
    )
    likes = relationship(
        "ReviewLike",
        back_populates="review",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Review review_id={self.review_id} type={self.type!r} score={self.score}>"
