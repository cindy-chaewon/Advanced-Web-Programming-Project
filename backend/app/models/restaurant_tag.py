"""RESTAURANT_TAGS junction 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base


class RestaurantTag(Base):
    __tablename__ = "RESTAURANT_TAGS"

    restaurant_id = Column(
        Integer,
        ForeignKey("RESTAURANTS.restaurant_id", ondelete="CASCADE"),
        primary_key=True,
        comment="식당 ID",
    )
    tag_id = Column(
        Integer,
        ForeignKey("TAGS.tag_id", ondelete="CASCADE"),
        primary_key=True,
        comment="태그 ID",
    )

    restaurant = relationship("Restaurant", back_populates="tags")
    tag = relationship("Tag", back_populates="restaurant_links")

    def __repr__(self) -> str:
        return f"<RestaurantTag restaurant_id={self.restaurant_id} tag_id={self.tag_id}>"
