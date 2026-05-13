"""RESTAURANTS 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Restaurant(Base):
    __tablename__ = "RESTAURANTS"

    restaurant_id = Column(Integer, primary_key=True, autoincrement=True, comment="식당 ID")
    name = Column(String(100), nullable=False, comment="식당명")
    phone = Column(String(20), comment="전화번호")
    opening_hours = Column(
        String(100), nullable=True, comment="영업시간 (예: 매일 11:00 - 22:00)"
    )
    break_time = Column(String(100), nullable=True, comment="브레이크타임")
    description = Column(Text, nullable=True, comment="식당 설명")
    thumbnail_url = Column(
        String(255), nullable=True, comment="카드 리스트 대표 이미지"
    )
    address_id = Column(
        Integer,
        ForeignKey("ADDRESSES.address_id"),
        comment="주소 FK",
    )
    category_id = Column(
        Integer,
        ForeignKey("CATEGORIES.category_id"),
        comment="카테고리 FK",
    )
    registered_by = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="SET NULL"),
        comment="최초 등록자 (탈퇴 시 NULL)",
    )
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="등록일")

    address = relationship("Address", back_populates="restaurants")
    category = relationship("Category", back_populates="restaurants")
    registrar = relationship(
        "User",
        foreign_keys=[registered_by],
        back_populates="registered_restaurants",
    )
    score = relationship(
        "RestaurantScore",
        back_populates="restaurant",
        uselist=False,
        cascade="all, delete-orphan",
    )
    menus = relationship(
        "Menu",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )
    tags = relationship(
        "RestaurantTag",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )
    posts = relationship(
        "Post",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )
    reviews = relationship(
        "Review",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )
    scraps = relationship(
        "Scrap",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )
    images = relationship(
        "Image",
        back_populates="restaurant",
        cascade="all, delete-orphan",
        foreign_keys="Image.restaurant_id",
    )

    def __repr__(self) -> str:
        return f"<Restaurant restaurant_id={self.restaurant_id} name={self.name!r}>"
