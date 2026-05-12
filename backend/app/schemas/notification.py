"""알림 Pydantic 스키마."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    type: str
    related_id: int | None = None
    is_read: bool
    created_at: datetime
