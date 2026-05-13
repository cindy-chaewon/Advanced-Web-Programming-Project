"""알림 생성 헬퍼 (다른 도메인에서 호출).

`respect_settings=True`면 수신자의 NOTIFICATION_SETTINGS에서 해당 타입이 OFF면
알림을 만들지 않는다 (기본값).
"""
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.notification_setting import NotificationSetting


_SETTING_FIELD_BY_TYPE = {
    "friend_request": "friend_request",
    "like": "likes",
    "comment": "likes",  # 좋아요·댓글 통합 토글 (화면 25번)
    "group_invite": "group_invite",
    "mention": None,  # 별도 토글 없음 — 항상 ON
}


def _is_enabled(db: Session, user_id: int, type: str) -> bool:
    field = _SETTING_FIELD_BY_TYPE.get(type)
    if field is None:
        return True
    s = (
        db.query(NotificationSetting)
        .filter(NotificationSetting.user_id == user_id)
        .first()
    )
    if s is None:
        return True  # 설정 row 없으면 기본 ON
    return bool(getattr(s, field, True))


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: str,
    related_id: int | None = None,
    actor_id: int | None = None,
    respect_settings: bool = True,
) -> Notification | None:
    """알림 row 추가 (commit은 호출자가 책임).

    수신자 설정이 OFF면 None 반환하고 row 생성 안 함.
    actor_id: 알림을 유발한 사용자 ID (좋아요/댓글/친구요청 보낸 사람).
    """
    if respect_settings and not _is_enabled(db, user_id, type):
        return None
    n = Notification(user_id=user_id, type=type, related_id=related_id, actor_id=actor_id)
    db.add(n)
    return n
