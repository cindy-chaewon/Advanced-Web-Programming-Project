"""알림 라우터: 목록 + 읽음 처리."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get(
    "",
    response_model=list[NotificationOut],
    summary="내 알림 목록 (최신순)",
)
def list_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        db.query(Notification)
        .options(joinedload(Notification.actor))
        .filter(Notification.user_id == current_user.user_id)
    )
    if unread_only:
        q = q.filter(Notification.is_read == False)  # noqa: E712
    return (
        q.order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.patch(
    "/{notification_id}/read",
    summary="개별 알림 읽음 처리",
)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.user_id,
        )
        .first()
    )
    if n is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="알림을 찾을 수 없습니다.",
        )
    n.is_read = True
    db.commit()
    return {"message": "읽음 처리됨"}


@router.post(
    "/read-all",
    summary='"모두 읽음" 버튼',
)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read == False,  # noqa: E712
        )
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return {"updated": updated}
