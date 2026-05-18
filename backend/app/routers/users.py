"""사용자 라우터: 마이페이지 + 프로필 수정/탈퇴 + 검색/조회 + 알림 설정."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user
from app.models.friend import Friend
from app.models.notification_setting import NotificationSetting
from app.models.post import Post
from app.models.restaurant import Restaurant
from app.models.review import Review
from app.models.scrap import Scrap
from app.models.user import User
from app.schemas.post import PostBrief
from app.schemas.restaurant import RestaurantBrief
from app.schemas.review import ReviewOut
from app.schemas.user import (
    NicknameCheckOut,
    NotificationSettingsOut,
    NotificationSettingsUpdate,
    UserMeOut,
    UserProfileUpdate,
    UserPublicProfile,
    UserSearchHit,
    UserStatsOut,
)
from app.services.friend_service import compute_friend_statuses
from app.services.post_service import (
    post_query_with_relations,
    serialize_post_brief,
)
from app.services.restaurant_service import (
    restaurants_query_with_relations,
    serialize_brief,
)
from app.services.review_service import (
    review_query_with_relations,
    serialize_review,
)


router = APIRouter(prefix="/users", tags=["users"])


# ────────────── 헬퍼 ──────────────


def _get_or_create_notif_settings(
    db: Session, user_id: int
) -> NotificationSetting:
    s = (
        db.query(NotificationSetting)
        .filter(NotificationSetting.user_id == user_id)
        .first()
    )
    if s is None:
        s = NotificationSetting(user_id=user_id)
        db.add(s)
        db.flush()
        db.refresh(s)
    return s


def _user_stats(db: Session, user_id: int) -> dict[str, int]:
    return {
        "post_count": int(
            db.query(func.count(Post.post_id))
            .filter(Post.user_id == user_id)
            .scalar()
            or 0
        ),
        "review_count": int(
            db.query(func.count(Review.review_id))
            .filter(Review.user_id == user_id)
            .scalar()
            or 0
        ),
        "scrap_count": int(
            db.query(func.count(Scrap.user_id))
            .filter(Scrap.user_id == user_id)
            .scalar()
            or 0
        ),
        "friend_count": int(
            db.query(func.count(Friend.user_id))
            .filter(
                ((Friend.user_id == user_id) | (Friend.friend_id == user_id))
                & (Friend.status == "accepted")
            )
            .scalar()
            or 0
        ),
    }


# ────────────── /me ──────────────


@router.get("/me", response_model=UserMeOut, summary="내 정보")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put(
    "/me",
    response_model=UserMeOut,
    summary="내 프로필 수정 (닉네임/이미지/자기소개)",
)
def update_me(
    body: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.username is not None and body.username != current_user.username:
        # 중복 체크
        conflict = (
            db.query(User.user_id)
            .filter(User.username == body.username, User.user_id != current_user.user_id)
            .first()
        )
        if conflict is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 사용 중인 닉네임입니다.",
            )
        current_user.username = body.username

    if body.profile_image is not None:
        current_user.profile_image = body.profile_image
    if body.bio is not None:
        current_user.bio = body.bio

    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="회원 탈퇴 (영구 삭제)",
)
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.delete(current_user)
    db.commit()


@router.get(
    "/me/stats",
    response_model=UserStatsOut,
    summary="마이페이지 통계",
)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserStatsOut(**_user_stats(db, current_user.user_id))


@router.get(
    "/me/notifications",
    response_model=NotificationSettingsOut,
    summary="내 알림 설정 조회",
)
def get_my_notification_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_or_create_notif_settings(db, current_user.user_id)


@router.patch(
    "/me/notifications",
    response_model=NotificationSettingsOut,
    summary="알림 설정 토글 (4종)",
)
def update_my_notification_settings(
    body: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = _get_or_create_notif_settings(db, current_user.user_id)
    if body.friend_request is not None:
        s.friend_request = body.friend_request
    if body.likes is not None:
        s.likes = body.likes
    if body.group_invite is not None:
        s.group_invite = body.group_invite
    if body.marketing is not None:
        s.marketing = body.marketing
    db.commit()
    db.refresh(s)
    return s


@router.get(
    "/me/posts", response_model=list[PostBrief], summary="내가 쓴 글"
)
def get_my_posts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    posts = (
        post_query_with_relations(db)
        .filter(Post.user_id == current_user.user_id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        PostBrief.model_validate(serialize_post_brief(p, current_user=current_user))
        for p in posts
    ]


@router.get(
    "/me/reviews", response_model=list[ReviewOut], summary="내가 쓴 리뷰"
)
def get_my_reviews(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = (
        review_query_with_relations(db)
        .filter(Review.user_id == current_user.user_id)
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        ReviewOut.model_validate(serialize_review(r, current_user=current_user))
        for r in reviews
    ]


@router.get(
    "/me/scraps",
    response_model=list[RestaurantBrief],
    summary="내 스크랩 식당",
)
def get_my_scraps(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        restaurants_query_with_relations(db)
        .join(Scrap, Scrap.restaurant_id == Restaurant.restaurant_id)
        .filter(Scrap.user_id == current_user.user_id)
        .order_by(Scrap.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [RestaurantBrief.model_validate(serialize_brief(r)) for r in rows]


# ────────────── 검색 / 닉네임 중복 (정적 경로 우선) ──────────────


@router.get(
    "/search",
    response_model=list[UserSearchHit],
    summary="닉네임으로 사용자 검색 (친구 상태 포함)",
)
def search_users(
    nickname: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    rows = (
        db.query(User)
        .filter(User.username.like(f"%{nickname}%"))
        .order_by(User.user_id.desc())
        .limit(limit)
        .all()
    )
    if not rows:
        return []

    me_id = current_user.user_id if current_user else None
    other_ids = [u.user_id for u in rows]
    statuses = (
        compute_friend_statuses(db, me_id, other_ids) if me_id else {}
    )

    return [
        UserSearchHit(
            user_id=u.user_id,
            username=u.username,
            profile_image=u.profile_image,
            bio=u.bio,
            friend_status=statuses.get(u.user_id, "none"),
        )
        for u in rows
    ]


@router.get(
    "/check-nickname",
    response_model=NicknameCheckOut,
    summary="닉네임 중복 확인 (본인 닉네임은 사용 가능 처리)",
)
def check_nickname(
    q: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    target = q.strip()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="닉네임이 비어있습니다.",
        )

    row = db.query(User).filter(User.username == target).first()
    if row is None:
        return NicknameCheckOut(nickname=target, available=True)
    # 본인 닉네임은 사용 가능으로 표시 (변경 시 자기 자신 제외)
    if current_user is not None and row.user_id == current_user.user_id:
        return NicknameCheckOut(nickname=target, available=True)
    return NicknameCheckOut(nickname=target, available=False)


# ────────────── 다른 사용자 프로필 (동적 경로, 마지막) ──────────────


@router.get(
    "/{user_id}",
    response_model=UserPublicProfile,
    summary="다른 사용자 프로필 (통계 + 친구 상태)",
)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    u = db.query(User).filter(User.user_id == user_id).first()
    if u is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다.",
        )

    stats = _user_stats(db, user_id)
    friend_status = "none"
    if current_user is not None:
        statuses = compute_friend_statuses(db, current_user.user_id, [user_id])
        friend_status = statuses.get(user_id, "none")

    return UserPublicProfile(
        user_id=u.user_id,
        username=u.username,
        profile_image=u.profile_image,
        bio=u.bio,
        level=u.level,
        post_count=stats["post_count"],
        review_count=stats["review_count"],
        friend_count=stats["friend_count"],
        friend_status=friend_status,
    )
