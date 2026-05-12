"""친구 라우터."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.friend import Friend
from app.models.user import User
from app.schemas.friend import (
    FriendActionBody,
    FriendColorUpdate,
    FriendOut,
    FriendRequestBody,
    FriendRequestOut,
)
from app.services.friend_service import (
    find_friendship,
    list_friends,
    list_received_requests,
)
from app.services.notification_service import create_notification


router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("", response_model=list[FriendOut], summary="내 친구 목록")
def get_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return [
        FriendOut.model_validate(r)
        for r in list_friends(db, current_user.user_id)
    ]


@router.get(
    "/requests",
    response_model=list[FriendRequestOut],
    summary="받은 친구 요청 목록",
)
def get_friend_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return [
        FriendRequestOut.model_validate(r)
        for r in list_received_requests(db, current_user.user_id)
    ]


@router.post("/request", summary="친구 요청 보내기")
def request_friend(
    body: FriendRequestBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.target_user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자기 자신에게 요청할 수 없습니다.",
        )

    target = (
        db.query(User).filter(User.user_id == body.target_user_id).first()
    )
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다.",
        )

    existing = find_friendship(db, current_user.user_id, body.target_user_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"이미 {existing.status} 상태입니다.",
        )

    db.add(
        Friend(
            user_id=current_user.user_id,
            friend_id=body.target_user_id,
            status="pending",
        )
    )
    create_notification(
        db,
        user_id=body.target_user_id,
        type="friend_request",
        related_id=current_user.user_id,
    )
    db.commit()
    return {"message": "친구 요청을 보냈습니다."}


@router.post("/accept", summary="친구 요청 수락")
def accept_friend(
    body: FriendActionBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = (
        db.query(Friend)
        .filter(
            Friend.user_id == body.from_user_id,
            Friend.friend_id == current_user.user_id,
            Friend.status == "pending",
        )
        .first()
    )
    if f is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="받은 친구 요청을 찾을 수 없습니다.",
        )
    f.status = "accepted"
    db.commit()
    return {"message": "친구 요청을 수락했습니다."}


@router.post("/reject", summary="친구 요청 거절")
def reject_friend(
    body: FriendActionBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = (
        db.query(Friend)
        .filter(
            Friend.user_id == body.from_user_id,
            Friend.friend_id == current_user.user_id,
            Friend.status == "pending",
        )
        .first()
    )
    if f is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="받은 친구 요청을 찾을 수 없습니다.",
        )
    db.delete(f)
    db.commit()
    return {"message": "거절했습니다."}


@router.delete(
    "/{friend_user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="친구 삭제 (양방향 관계 row 제거)",
)
def delete_friend(
    friend_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = find_friendship(db, current_user.user_id, friend_user_id)
    if f is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="친구 관계가 없습니다.",
        )
    db.delete(f)
    db.commit()


@router.patch(
    "/{friend_user_id}",
    response_model=FriendOut,
    summary="친구 핀 색상 변경 (pink/blue/green/purple/coral)",
    description=(
        "⚠️ `FRIENDS.color`는 단일 컬럼이므로 양쪽 친구가 동일 색을 공유한다.\n"
        "양방향 개별 색상이 필요하면 schema 확장 필요."
    ),
)
def update_friend_color(
    friend_user_id: int,
    body: FriendColorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = find_friendship(db, current_user.user_id, friend_user_id)
    if f is None or f.status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="수락된 친구 관계가 아닙니다.",
        )

    f.color = body.color
    db.commit()
    db.refresh(f)

    other_id = (
        f.friend_id if f.user_id == current_user.user_id else f.user_id
    )
    other = db.query(User).filter(User.user_id == other_id).first()
    return FriendOut(
        user_id=other.user_id,
        username=other.username,
        profile_image=other.profile_image,
        color=f.color,
        status=f.status,
        created_at=f.created_at,
    )
