from __future__ import annotations
"""알림 Pydantic 스키마."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActorBrief(BaseModel):
    """알림 발신자 요약 정보."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    username: str
    profile_image: str | None = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    type: str
    related_id: int | None = None
    actor: ActorBrief | None = None
    is_read: bool
    created_at: datetime
