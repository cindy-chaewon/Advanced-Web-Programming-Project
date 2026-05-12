"""MENUS 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Menu(Base):
    __tablename__ = "MENUS"

    menu_id = Column(Integer, primary_key=True, autoincrement=True, comment="메뉴 ID")
    restaurant_id = Column(
        Integer,
        ForeignKey("RESTAURANTS.restaurant_id", ondelete="CASCADE"),
        nullable=False,
        comment="식당 ID",
    )
    name = Column(String(100), nullable=False, comment="메뉴명")
    description = Column(String(255), nullable=True, comment="메뉴 한 줄 설명")
    price = Column(Integer, comment="가격 (원)")
    is_signature = Column(
        Boolean,
        server_default="0",
        comment="BEST(시그니처) 메뉴 여부",
    )

    restaurant = relationship("Restaurant", back_populates="menus")

    def __repr__(self) -> str:
        return f"<Menu menu_id={self.menu_id} name={self.name!r}>"
