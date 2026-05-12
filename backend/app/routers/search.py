"""검색 자동완성·추천 라우터."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.models.post_tag import PostTag
from app.models.restaurant import Restaurant
from app.models.restaurant_score import RestaurantScore
from app.models.restaurant_tag import RestaurantTag
from app.models.tag import Tag
from app.schemas.search import (
    AutocompleteOut,
    RestaurantHit,
    SuggestionsOut,
    TagHit,
)


router = APIRouter(prefix="/search", tags=["search"])


@router.get(
    "/suggestions",
    response_model=SuggestionsOut,
    summary="추천 검색어 (인기 태그 + 전체 카테고리)",
)
def suggestions(db: Session = Depends(get_db)):
    # 인기 태그 5개 (RESTAURANT_TAGS + POST_TAGS 합산)
    r_counts = dict(
        db.query(RestaurantTag.tag_id, func.count(RestaurantTag.tag_id))
        .group_by(RestaurantTag.tag_id)
        .all()
    )
    p_counts = dict(
        db.query(PostTag.tag_id, func.count(PostTag.tag_id))
        .group_by(PostTag.tag_id)
        .all()
    )
    combined: dict[int, int] = {}
    for tid, c in r_counts.items():
        combined[tid] = combined.get(tid, 0) + int(c)
    for tid, c in p_counts.items():
        combined[tid] = combined.get(tid, 0) + int(c)

    popular: list[TagHit] = []
    if combined:
        top_ids = [tid for tid, _ in sorted(combined.items(), key=lambda x: x[1], reverse=True)[:5]]
        tag_map = {
            t.tag_id: t.name
            for t in db.query(Tag).filter(Tag.tag_id.in_(top_ids)).all()
        }
        popular = [
            TagHit(tag_id=tid, name=tag_map[tid])
            for tid in top_ids
            if tid in tag_map
        ]

    categories = [
        c.name for c in db.query(Category).order_by(Category.category_id).all()
    ]
    return SuggestionsOut(popular_hashtags=popular, categories=categories)


@router.get(
    "/autocomplete",
    response_model=AutocompleteOut,
    summary="검색어 자동완성 (식당명 + 해시태그)",
)
def autocomplete(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db),
):
    clean = q.strip()
    if not clean:
        return AutocompleteOut()

    clean_tag = clean.lstrip("#")

    rests = (
        db.query(Restaurant.restaurant_id, Restaurant.name)
        .outerjoin(
            RestaurantScore,
            RestaurantScore.restaurant_id == Restaurant.restaurant_id,
        )
        .filter(Restaurant.name.like(f"%{clean}%"))
        .order_by(
            func.coalesce(RestaurantScore.total_score, 0).desc(),
            Restaurant.restaurant_id.desc(),
        )
        .limit(limit)
        .all()
    )
    tags = (
        db.query(Tag.tag_id, Tag.name)
        .filter(Tag.name.like(f"%{clean_tag}%"))
        .order_by(Tag.name)
        .limit(limit)
        .all()
    )

    return AutocompleteOut(
        restaurants=[
            RestaurantHit(restaurant_id=r[0], name=r[1]) for r in rests
        ],
        hashtags=[TagHit(tag_id=t[0], name=t[1]) for t in tags],
    )
