"""POSTS 테이블 모델 (블로그형 글 / 간단 리뷰)."""
from __future__ import annotations

from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, SmallInteger, String, Text, TIMESTAMP
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Post(Base):
    __tablename__ = "POSTS"
    __table_args__ = (
        CheckConstraint(
            "score IS NULL OR (score >= 1 AND score <= 5)",
            name="ck_post_score",
        ),
    )

    post_id = Column(Integer, primary_key=True, autoincrement=True, comment="글 ID")
    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        comment="작성자",
    )
    restaurant_id = Column(
        Integer,
        ForeignKey("RESTAURANTS.restaurant_id", ondelete="CASCADE"),
        comment="연결된 식당",
    )
    type = Column(
        ENUM("blog", "simple"),
        nullable=False,
        server_default="blog",
        comment="글 유형: blog=맛집 블로그, simple=간단 리뷰",
    )
    score = Column(SmallInteger, nullable=True, comment="별점 1-5 (simple 타입에서만 사용)")
    title = Column(String(200), comment="제목")
    content = Column(Text, comment="본문")
    ai_summary = Column(Text, nullable=True, comment="AI 3줄 요약")
    thumbnail_url = Column(String(255), nullable=True, comment="카드 리스트 대표 이미지")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="작성일")
    updated_at = Column(TIMESTAMP, nullable=True, onupdate=func.now(), comment="수정일")

    author = relationship("User", back_populates="posts")
    restaurant = relationship("Restaurant", back_populates="posts")
    tags = relationship(
        "PostTag",
        back_populates="post",
        cascade="all, delete-orphan",
    )
    images = relationship(
        "Image",
        back_populates="post",
        cascade="all, delete-orphan",
    )
    likes = relationship(
        "PostLike",
        back_populates="post",
        cascade="all, delete-orphan",
    )
    comments = relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Post post_id={self.post_id} title={self.title!r}>"
