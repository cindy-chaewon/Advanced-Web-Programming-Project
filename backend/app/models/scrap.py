"""SCRAPS 테이블 모델 (맛집 즐겨찾기)."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Scrap(Base):
    __tablename__ = "SCRAPS"

    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        primary_key=True,
    )
    restaurant_id = Column(
        Integer,
        ForeignKey("RESTAURANTS.restaurant_id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="스크랩 일시")

    user = relationship("User", back_populates="scraps")
    restaurant = relationship("Restaurant", back_populates="scraps")

    def __repr__(self) -> str:
        return f"<Scrap user_id={self.user_id} restaurant_id={self.restaurant_id}>"
