"""CATEGORIES 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "CATEGORIES"

    category_id = Column(Integer, primary_key=True, autoincrement=True, comment="카테고리 ID")
    name = Column(
        String(50),
        nullable=False,
        comment="카테고리명 (한식/양식/일식/중식/카페/술집/디저트/기타)",
    )

    restaurants = relationship("Restaurant", back_populates="category")

    def __repr__(self) -> str:
        return f"<Category category_id={self.category_id} name={self.name!r}>"
