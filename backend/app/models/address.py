"""ADDRESSES 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Address(Base):
    __tablename__ = "ADDRESSES"

    address_id = Column(Integer, primary_key=True, autoincrement=True, comment="주소 ID")
    full_address = Column(String(200), comment="전체 주소 문자열")
    district = Column(String(50), comment="구/군")
    city = Column(String(50), comment="시")
    latitude = Column(Numeric(10, 7), nullable=False, comment="위도")
    longitude = Column(Numeric(10, 7), nullable=False, comment="경도")

    restaurants = relationship("Restaurant", back_populates="address")

    def __repr__(self) -> str:
        return f"<Address address_id={self.address_id} {self.full_address!r}>"
