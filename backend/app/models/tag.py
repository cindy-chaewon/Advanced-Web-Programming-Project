"""TAGS 테이블 모델 (해시태그 마스터)."""
from __future__ import annotations

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Tag(Base):
    __tablename__ = "TAGS"

    tag_id = Column(Integer, primary_key=True, autoincrement=True, comment="태그 ID")
    name = Column(String(50), unique=True, nullable=False, comment="태그명 (# 제외)")

    restaurant_links = relationship(
        "RestaurantTag",
        back_populates="tag",
        cascade="all, delete-orphan",
    )
    post_links = relationship(
        "PostTag",
        back_populates="tag",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Tag tag_id={self.tag_id} name={self.name!r}>"
