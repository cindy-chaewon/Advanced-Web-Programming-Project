"""그룹 도메인 서비스."""
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.group import Group
from app.models.group_member import GroupMember
from app.services.notification_service import create_notification


def is_member(db: Session, group_id: int, user_id: int) -> bool:
    return (
        db.query(GroupMember.user_id)
        .filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
        )
        .first()
        is not None
    )


def is_owner(db: Session, group_id: int, user_id: int) -> bool:
    row = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.role == "owner",
        )
        .first()
    )
    return row is not None


def member_count(db: Session, group_id: int) -> int:
    return int(
        db.query(func.count(GroupMember.user_id))
        .filter(GroupMember.group_id == group_id)
        .scalar()
        or 0
    )


def serialize_group(g: Group, count: int = 0) -> dict[str, Any]:
    return {
        "group_id": g.group_id,
        "name": g.name,
        "owner_id": g.owner_id,
        "color": g.color,
        "icon": g.icon,
        "member_count": count,
        "created_at": g.created_at,
    }


def add_member(
    db: Session,
    *,
    group_id: int,
    user_id: int,
    role: str = "member",
    notify: bool = True,
) -> bool:
    """이미 멤버면 False, 추가했으면 True. commit은 호출자가 책임."""
    if is_member(db, group_id, user_id):
        return False
    db.add(GroupMember(group_id=group_id, user_id=user_id, role=role))
    db.flush()
    if notify:
        create_notification(
            db, user_id=user_id, type="group_invite", related_id=group_id
        )
    return True
