from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.core.database import Base


class GroupRestaurant(Base):
    __tablename__ = "GROUP_RESTAURANTS"

    group_id = Column(Integer, ForeignKey("GROUPS.group_id", ondelete="CASCADE"), primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("RESTAURANTS.restaurant_id", ondelete="CASCADE"), primary_key=True)
    added_by = Column(Integer, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
