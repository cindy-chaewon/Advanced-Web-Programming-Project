"""NOTIFICATION_SETTINGS 테이블 모델 (사용자별 알림 토글)."""
from __future__ import annotations

from sqlalchemy import Boolean, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base


class NotificationSetting(Base):
    __tablename__ = "NOTIFICATION_SETTINGS"

    user_id = Column(
        Integer,
        ForeignKey("USERS.user_id", ondelete="CASCADE"),
        primary_key=True,
        comment="사용자",
    )
    friend_request = Column(Boolean, server_default="1", comment="친구 요청 알림")
    likes = Column(Boolean, server_default="1", comment="좋아요·댓글 알림")
    group_invite = Column(Boolean, server_default="1", comment="그룹 초대 알림")
    marketing = Column(Boolean, server_default="0", comment="마케팅 알림")

    user = relationship("User", back_populates="notification_settings")

    def __repr__(self) -> str:
        return f"<NotificationSetting user_id={self.user_id}>"
