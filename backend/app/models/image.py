"""IMAGES 테이블 모델.

리뷰, 블로그 글, 또는 식당에 첨부되는 이미지.
post_id / review_id / restaurant_id 중 하나에만 속함 (애플리케이션 레벨 검증).
"""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Image(Base):
    __tablename__ = "IMAGES"

    image_id = Column(Integer, primary_key=True, autoincrement=True, comment="이미지 ID")
    url = Column(String(255), nullable=False, comment="이미지 URL")
    post_id = Column(
        Integer,
        ForeignKey("POSTS.post_id", ondelete="CASCADE"),
        nullable=True,
        comment="블로그 글에 속함",
    )
    review_id = Column(
        Integer,
        ForeignKey("REVIEWS.review_id", ondelete="CASCADE"),
        nullable=True,
        comment="또는 리뷰에 속함",
    )
    restaurant_id = Column(
        Integer,
        ForeignKey("RESTAURANTS.restaurant_id", ondelete="CASCADE"),
        nullable=True,
        comment="또는 식당에 속함",
    )

    post = relationship("Post", back_populates="images")
    review = relationship("Review", back_populates="images")
    restaurant = relationship(
        "Restaurant",
        back_populates="images",
        foreign_keys=[restaurant_id],
    )

    def __repr__(self) -> str:
        return f"<Image image_id={self.image_id} url={self.url!r}>"
