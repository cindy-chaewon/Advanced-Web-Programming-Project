"""POST_TAGS junction 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base


class PostTag(Base):
    __tablename__ = "POST_TAGS"

    post_id = Column(
        Integer,
        ForeignKey("POSTS.post_id", ondelete="CASCADE"),
        primary_key=True,
        comment="글 ID",
    )
    tag_id = Column(
        Integer,
        ForeignKey("TAGS.tag_id", ondelete="CASCADE"),
        primary_key=True,
        comment="태그 ID",
    )

    post = relationship("Post", back_populates="tags")
    tag = relationship("Tag", back_populates="post_links")

    def __repr__(self) -> str:
        return f"<PostTag post_id={self.post_id} tag_id={self.tag_id}>"
