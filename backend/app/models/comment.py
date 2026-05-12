"""COMMENTS 테이블 모델 (글 댓글)."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Comment(Base):
    __tablename__ = "COMMENTS"

    comment_id = Column(Integer, primary_key=True, autoincrement=True, comment="댓글 ID")
    post_id = Column(
        Integer,
        ForeignKey("POSTS.post_id", ondelete="CASCADE"),
        nullable=False,
        comment="댓글이 달린 글",
    )
    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="작성자 (탈퇴 시 NULL)",
    )
    content = Column(Text, nullable=False, comment="댓글 본문")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="작성일")
    updated_at = Column(TIMESTAMP, nullable=True, onupdate=func.now(), comment="수정일")

    author = relationship("User", foreign_keys=[user_id])
    post = relationship("Post", back_populates="comments")

    def __repr__(self) -> str:
        return f"<Comment comment_id={self.comment_id} post_id={self.post_id}>"
