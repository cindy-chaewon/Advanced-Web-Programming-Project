from __future__ import annotations
"""리뷰(Review) 도메인 서비스."""
from typing import Any

from sqlalchemy.orm import Query, Session, selectinload

from app.models.image import Image
from app.models.review import Review
from app.models.user import User


def review_query_with_relations(db: Session) -> Query:
    """공통 eager load."""
    return (
        db.query(Review)
        .options(selectinload(Review.author))
        .options(selectinload(Review.images))
        .options(selectinload(Review.likes))
    )


def replace_review_images(db: Session, review_id: int, urls: list[str]) -> None:
    db.query(Image).filter(Image.review_id == review_id).delete(
        synchronize_session=False
    )
    db.flush()
    seen: set[str] = set()
    for url in urls:
        if not url or url in seen:
            continue
        seen.add(url)
        db.add(Image(url=url, review_id=review_id))
    db.flush()


def is_review_liked_loaded(review: Review, user: User | None) -> bool:
    if user is None or not review.likes:
        return False
    return any(like.user_id == user.user_id for like in review.likes)


def serialize_review(
    review: Review, *, current_user: User | None = None
) -> dict[str, Any]:
    return {
        "review_id": review.review_id,
        "type": review.type,
        "content": review.content,
        "score": review.score,
        "author": review.author,
        "restaurant_id": review.restaurant_id,
        "restaurant_name": review.restaurant.name if review.restaurant else None,
        "images": [img.url for img in review.images],
        "like_count": len(review.likes),
        "is_liked": is_review_liked_loaded(review, current_user),
        "created_at": review.created_at,
        "updated_at": review.updated_at,
    }
