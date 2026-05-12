"""POST_LIKES 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PostLike(Base):
    __tablename__ = "POST_LIKES"

    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        primary_key=True,
    )
    post_id = Column(
        Integer,
        ForeignKey("POSTS.post_id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="post_likes")
    post = relationship("Post", back_populates="likes")

    def __repr__(self) -> str:
        return f"<PostLike user_id={self.user_id} post_id={self.post_id}>"
