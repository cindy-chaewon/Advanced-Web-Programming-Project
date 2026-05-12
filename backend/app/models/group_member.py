"""GROUP_MEMBERS 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, TIMESTAMP
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class GroupMember(Base):
    __tablename__ = "GROUP_MEMBERS"

    group_id = Column(
        Integer,
        ForeignKey("GROUPS.group_id", ondelete="CASCADE"),
        primary_key=True,
        comment="그룹 ID",
    )
    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        primary_key=True,
        comment="멤버 user_id",
    )
    role = Column(
        ENUM("owner", "member"),
        nullable=False,
        server_default="member",
        comment="역할",
    )
    joined_at = Column(TIMESTAMP, server_default=func.now(), comment="가입일")

    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")

    def __repr__(self) -> str:
        return (
            f"<GroupMember group_id={self.group_id} user_id={self.user_id} "
            f"role={self.role!r}>"
        )
