"""리뷰 라우터: 식당 nested(GET·POST) + 단독 (PUT·DELETE·LIKE)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user
from app.models.restaurant import Restaurant
from app.models.review import Review
from app.models.review_like import ReviewLike
from app.models.user import User
from app.schemas.common import LikeStatus
from app.schemas.review import ReviewCreate, ReviewOut, ReviewUpdate
from app.services.notification_service import create_notification
from app.services.review_service import (
    replace_review_images,
    review_query_with_relations,
    serialize_review,
)
from app.services.score_service import recompute_restaurant_score


# 같은 router 하나에 다양한 경로 매핑.
router = APIRouter(tags=["reviews"])


# ─────────────────────────── 헬퍼 ───────────────────────────


def _get_review_or_404(db: Session, review_id: int) -> Review:
    r = (
        review_query_with_relations(db)
        .filter(Review.review_id == review_id)
        .first()
    )
    if r is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="리뷰를 찾을 수 없습니다.",
        )
    return r


def _ensure_owner(review: Review, user: User) -> None:
    if review.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="작성자만 수정/삭제할 수 있습니다.",
        )


def _ensure_restaurant_exists(db: Session, restaurant_id: int) -> None:
    if (
        db.query(Restaurant.restaurant_id)
        .filter(Restaurant.restaurant_id == restaurant_id)
        .first()
        is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="식당을 찾을 수 없습니다.",
        )


# ─────────────────────────── 식당 nested ───────────────────────────


@router.get(
    "/restaurants/{restaurant_id}/reviews",
    response_model=list[ReviewOut],
    summary="식당 리뷰 목록 (type=simple|blog 필터 선택)",
)
def list_reviews_for_restaurant(
    restaurant_id: int,
    type: Optional[str] = Query(default=None, pattern="^(simple|blog)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    _ensure_restaurant_exists(db, restaurant_id)

    q = review_query_with_relations(db).filter(Review.restaurant_id == restaurant_id)
    if type:
        q = q.filter(Review.type == type)
    q = q.order_by(Review.created_at.desc()).offset(offset).limit(limit)

    return [
        ReviewOut.model_validate(serialize_review(rv, current_user=current_user))
        for rv in q.all()
    ]


@router.post(
    "/restaurants/{restaurant_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
    summary="리뷰 작성 (인증 필요)",
)
def create_review(
    restaurant_id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_restaurant_exists(db, restaurant_id)

    review = Review(
        user_id=current_user.user_id,
        restaurant_id=restaurant_id,
        type=body.type,
        content=body.content,
        score=body.score,
    )
    db.add(review)
    db.flush()

    if body.image_urls:
        replace_review_images(db, review.review_id, body.image_urls)

    recompute_restaurant_score(db, restaurant_id)
    db.commit()

    fresh = _get_review_or_404(db, review.review_id)
    return ReviewOut.model_validate(
        serialize_review(fresh, current_user=current_user)
    )


# ─────────────────────────── 리뷰 단독 ───────────────────────────


@router.put(
    "/reviews/{review_id}",
    response_model=ReviewOut,
    summary="리뷰 수정 (작성자만)",
)
def update_review(
    review_id: int,
    body: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = _get_review_or_404(db, review_id)
    _ensure_owner(review, current_user)

    if body.content is not None:
        review.content = body.content
    if body.score is not None:
        review.score = body.score
    if body.image_urls is not None:
        replace_review_images(db, review.review_id, body.image_urls)

    recompute_restaurant_score(db, review.restaurant_id)
    db.commit()

    fresh = _get_review_or_404(db, review_id)
    return ReviewOut.model_validate(
        serialize_review(fresh, current_user=current_user)
    )


@router.delete(
    "/reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="리뷰 삭제 (작성자만)",
)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = _get_review_or_404(db, review_id)
    _ensure_owner(review, current_user)
    restaurant_id = review.restaurant_id
    db.delete(review)
    db.flush()
    recompute_restaurant_score(db, restaurant_id)
    db.commit()


# ─────────────────────────── 좋아요 ───────────────────────────


@router.post(
    "/reviews/{review_id}/like",
    response_model=LikeStatus,
    summary="리뷰 좋아요 (작성자에게 자동 알림)",
)
def like_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = (
        db.query(Review).filter(Review.review_id == review_id).first()
    )
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="리뷰를 찾을 수 없습니다.",
        )

    already = (
        db.query(ReviewLike)
        .filter(
            ReviewLike.review_id == review_id,
            ReviewLike.user_id == current_user.user_id,
        )
        .first()
    )
    if already is None:
        db.add(ReviewLike(review_id=review_id, user_id=current_user.user_id))
        if review.user_id is not None and review.user_id != current_user.user_id:
            create_notification(
                db,
                user_id=review.user_id,
                type="like",
                related_id=review_id,
                actor_id=current_user.user_id,
            )
        db.commit()

    cnt = (
        db.query(ReviewLike).filter(ReviewLike.review_id == review_id).count()
    )
    return LikeStatus(is_liked=True, like_count=cnt)


@router.delete(
    "/reviews/{review_id}/like",
    response_model=LikeStatus,
    summary="리뷰 좋아요 취소",
)
def unlike_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(ReviewLike).filter(
        ReviewLike.review_id == review_id,
        ReviewLike.user_id == current_user.user_id,
    ).delete(synchronize_session=False)
    db.commit()
    cnt = (
        db.query(ReviewLike).filter(ReviewLike.review_id == review_id).count()
    )
    return LikeStatus(is_liked=False, like_count=cnt)
