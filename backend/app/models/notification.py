"""NOTIFICATIONS 테이블 모델."""
from __future__ import annotations

from sqlalchemy import Boolean, Column, ForeignKey, Integer, TIMESTAMP
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Notification(Base):
    __tablename__ = "NOTIFICATIONS"

    notification_id = Column(
        Integer, primary_key=True, autoincrement=True, comment="알림 ID"
    )
    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="알림 수신자",
    )
    type = Column(
        ENUM("friend_request", "like", "group_invite", "mention", "comment"),
        nullable=False,
        comment="알림 종류 (Phase 2-F에서 comment 추가)",
    )
    related_id = Column(
        Integer,
        nullable=True,
        comment="관련 엔티티 ID (post_id, group_id 등)",
    )
    actor_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="알림 발신자 (좋아요 누른 사람, 친구 요청 보낸 사람 등)",
    )
    is_read = Column(Boolean, server_default="0", comment="읽음 여부")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="발생일")

    user = relationship(
        "User",
        foreign_keys="[Notification.user_id]",
        back_populates="notifications",
    )
    actor = relationship(
        "User",
        foreign_keys="[Notification.actor_id]",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return (
            f"<Notification notification_id={self.notification_id} "
            f"type={self.type!r} is_read={self.is_read}>"
        )
