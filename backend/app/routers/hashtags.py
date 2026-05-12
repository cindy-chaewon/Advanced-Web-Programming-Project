"""해시태그 라우터: 인기 / 자동완성 / 태그별 글·식당."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.post import Post
from app.models.post_tag import PostTag
from app.models.restaurant import Restaurant
from app.models.restaurant_tag import RestaurantTag
from app.models.tag import Tag
from app.schemas.hashtag import PopularTagOut, TagOut
from app.schemas.post import PostBrief
from app.schemas.restaurant import RestaurantBrief
from app.services.post_service import (
    post_query_with_relations,
    serialize_post_brief,
)
from app.services.restaurant_service import (
    restaurants_query_with_relations,
    serialize_brief,
)


router = APIRouter(prefix="/hashtags", tags=["hashtags"])


def _combined_usage(db: Session) -> dict[int, int]:
    """RESTAURANT_TAGS + POST_TAGS 사용 횟수 합산."""
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
    return combined


@router.get(
    "/popular",
    response_model=list[PopularTagOut],
    summary="인기 해시태그 (식당 + 글 사용량 합산)",
)
def popular_hashtags(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    combined = _combined_usage(db)
    if not combined:
        return []

    sorted_pairs = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:limit]
    tag_ids = [tid for tid, _ in sorted_pairs]
    tag_map = {
        t.tag_id: t.name
        for t in db.query(Tag).filter(Tag.tag_id.in_(tag_ids)).all()
    }
    return [
        PopularTagOut(tag_id=tid, name=tag_map[tid], usage_count=cnt)
        for tid, cnt in sorted_pairs
        if tid in tag_map
    ]


@router.get(
    "/search",
    response_model=list[TagOut],
    summary="해시태그 자동완성 (이름 LIKE)",
)
def search_hashtags(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    clean = q.strip().lstrip("#")
    if not clean:
        return []
    return (
        db.query(Tag)
        .filter(Tag.name.like(f"%{clean}%"))
        .order_by(Tag.name)
        .limit(limit)
        .all()
    )


@router.get(
    "/{tag_name}/posts",
    response_model=list[PostBrief],
    summary="태그별 글 목록",
)
def posts_by_tag(
    tag_name: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    clean = tag_name.strip().lstrip("#")
    t = db.query(Tag).filter(Tag.name == clean).first()
    if t is None:
        return []
    posts = (
        post_query_with_relations(db)
        .join(PostTag, PostTag.post_id == Post.post_id)
        .filter(PostTag.tag_id == t.tag_id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [PostBrief.model_validate(serialize_post_brief(p)) for p in posts]


@router.get(
    "/{tag_name}/restaurants",
    response_model=list[RestaurantBrief],
    summary="태그별 식당 목록",
)
def restaurants_by_tag(
    tag_name: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    clean = tag_name.strip().lstrip("#")
    t = db.query(Tag).filter(Tag.name == clean).first()
    if t is None:
        return []
    rows = (
        restaurants_query_with_relations(db)
        .join(RestaurantTag, RestaurantTag.restaurant_id == Restaurant.restaurant_id)
        .filter(RestaurantTag.tag_id == t.tag_id)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [RestaurantBrief.model_validate(serialize_brief(r)) for r in rows]
