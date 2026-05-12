"""FRIENDS 테이블 모델 (친구 관계)."""
from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, String, TIMESTAMP
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Friend(Base):
    __tablename__ = "FRIENDS"

    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        primary_key=True,
        comment="친구 요청을 보낸 사용자",
    )
    friend_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        primary_key=True,
        comment="친구 (요청 받은 사용자)",
    )
    status = Column(
        ENUM("pending", "accepted"),
        nullable=False,
        server_default="pending",
        comment="친구 요청 상태",
    )
    color = Column(
        String(20),
        server_default="pink",
        comment="지도 핀 색상 (pink/blue/green/purple/coral)",
    )
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="요청일")

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="friends_initiated",
    )
    friend = relationship(
        "User",
        foreign_keys=[friend_id],
        back_populates="friends_received",
    )

    def __repr__(self) -> str:
        return (
            f"<Friend user_id={self.user_id} friend_id={self.friend_id} "
            f"status={self.status!r}>"
        )
