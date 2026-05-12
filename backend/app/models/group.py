"""GROUPS 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Group(Base):
    __tablename__ = "GROUPS"

    group_id = Column(Integer, primary_key=True, autoincrement=True, comment="그룹 ID")
    name = Column(String(100), nullable=False, comment="그룹명")
    owner_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="방장 user_id",
    )
    color = Column(String(20), server_default="blue", comment="그룹 대표 색상")
    icon = Column(String(10), comment="이모지 아이콘")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="생성일")

    owner = relationship(
        "User", foreign_keys=[owner_id], back_populates="owned_groups"
    )
    members = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Group group_id={self.group_id} name={self.name!r}>"
