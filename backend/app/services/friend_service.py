"""친구 도메인 서비스."""
from typing import Any

from sqlalchemy.orm import Session

from app.models.friend import Friend
from app.models.user import User


def _other_user_id(row: Friend, me: int) -> int:
    return row.friend_id if row.user_id == me else row.user_id


def list_friends(db: Session, user_id: int) -> list[dict[str, Any]]:
    """수락된 친구 목록 (양방향)."""
    rows = (
        db.query(Friend)
        .filter(
            ((Friend.user_id == user_id) | (Friend.friend_id == user_id))
            & (Friend.status == "accepted")
        )
        .all()
    )
    if not rows:
        return []

    other_ids = {_other_user_id(f, user_id) for f in rows}
    users = {
        u.user_id: u
        for u in db.query(User).filter(User.user_id.in_(other_ids)).all()
    }

    out: list[dict[str, Any]] = []
    for f in rows:
        oid = _other_user_id(f, user_id)
        other = users.get(oid)
        if other is None:
            continue
        out.append(
            {
                "user_id": other.user_id,
                "username": other.username,
                "profile_image": other.profile_image,
                "color": f.color or "pink",
                "status": f.status,
                "created_at": f.created_at,
            }
        )
    return out


def list_received_requests(db: Session, user_id: int) -> list[dict[str, Any]]:
    """내가 받은 pending 요청."""
    rows = (
        db.query(Friend)
        .filter(Friend.friend_id == user_id, Friend.status == "pending")
        .all()
    )
    if not rows:
        return []

    sender_ids = {f.user_id for f in rows}
    users = {
        u.user_id: u
        for u in db.query(User).filter(User.user_id.in_(sender_ids)).all()
    }

    return [
        {
            "from_user_id": r.user_id,
            "from_username": users[r.user_id].username,
            "from_profile_image": users[r.user_id].profile_image,
            "created_at": r.created_at,
        }
        for r in rows
        if r.user_id in users
    ]


def find_friendship(db: Session, a: int, b: int) -> Friend | None:
    """양방향으로 친구 관계 찾기."""
    return (
        db.query(Friend)
        .filter(
            ((Friend.user_id == a) & (Friend.friend_id == b))
            | ((Friend.user_id == b) & (Friend.friend_id == a))
        )
        .first()
    )


def compute_friend_statuses(
    db: Session, me_id: int, other_ids: list[int]
) -> dict[int, str]:
    """me 기준 each other_id의 friend_status를 dict로 반환.

    값: 'self' / 'accepted' / 'pending_sent' / 'pending_received' / 'none'
    """
    if not other_ids:
        return {}

    result: dict[int, str] = {oid: "none" for oid in other_ids}

    rows = (
        db.query(Friend)
        .filter(
            ((Friend.user_id == me_id) & (Friend.friend_id.in_(other_ids)))
            | ((Friend.friend_id == me_id) & (Friend.user_id.in_(other_ids)))
        )
        .all()
    )
    for f in rows:
        other = f.friend_id if f.user_id == me_id else f.user_id
        if f.status == "accepted":
            result[other] = "accepted"
        elif f.status == "pending":
            result[other] = "pending_sent" if f.user_id == me_id else "pending_received"

    if me_id in result:
        result[me_id] = "self"
    return result
