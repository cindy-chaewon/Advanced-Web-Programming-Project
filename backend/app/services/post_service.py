"""블로그 글(Post) 도메인 서비스."""
from typing import Any

from sqlalchemy.orm import Query, Session, selectinload

from app.models.image import Image
from app.models.post import Post
from app.models.post_tag import PostTag
from app.models.restaurant import Restaurant
from app.models.restaurant_tag import RestaurantTag
from app.models.user import User
from app.services.restaurant_service import (
    find_or_create_tags,
    serialize_brief,
)


def post_query_with_relations(db: Session) -> Query:
    """공통 eager load."""
    return (
        db.query(Post)
        .options(selectinload(Post.author))
        .options(
            selectinload(Post.restaurant).selectinload(Restaurant.address)
        )
        .options(
            selectinload(Post.restaurant).selectinload(Restaurant.category)
        )
        .options(
            selectinload(Post.restaurant).selectinload(Restaurant.score)
        )
        .options(
            selectinload(Post.restaurant)
            .selectinload(Restaurant.tags)
            .selectinload(RestaurantTag.tag)
        )
        .options(selectinload(Post.images))
        .options(selectinload(Post.tags).selectinload(PostTag.tag))
        .options(selectinload(Post.likes))
        .options(selectinload(Post.comments))
    )


def replace_post_images(db: Session, post_id: int, urls: list[str]) -> None:
    """기존 이미지 모두 삭제 후 새 URL 목록으로 교체."""
    db.query(Image).filter(Image.post_id == post_id).delete(
        synchronize_session=False
    )
    db.flush()
    seen: set[str] = set()
    for url in urls:
        if not url or url in seen:
            continue
        seen.add(url)
        db.add(Image(url=url, post_id=post_id))
    db.flush()


def replace_post_tags(db: Session, post_id: int, tag_names: list[str]) -> None:
    """기존 태그 매핑 삭제 후 새 태그 이름으로 재매핑."""
    db.query(PostTag).filter(PostTag.post_id == post_id).delete(
        synchronize_session=False
    )
    db.flush()
    if not tag_names:
        return
    tags = find_or_create_tags(db, tag_names)
    seen: set[int] = set()
    for t in tags:
        if t.tag_id in seen:
            continue
        seen.add(t.tag_id)
        db.add(PostTag(post_id=post_id, tag_id=t.tag_id))
    db.flush()


def is_post_liked_loaded(post: Post, user: User | None) -> bool:
    """eager-loaded `post.likes` 기준으로 좋아요 여부 판정."""
    if user is None or not post.likes:
        return False
    return any(like.user_id == user.user_id for like in post.likes)


def serialize_post_brief(
    post: Post, *, current_user: User | None = None
) -> dict[str, Any]:
    content = post.content or ""
    return {
        "post_id": post.post_id,
        "type": post.type or "blog",
        "title": post.title,
        "content_preview": content[:100],
        "score": post.score,
        "thumbnail_url": post.thumbnail_url,
        "author": post.author,
        "restaurant": serialize_brief(post.restaurant) if post.restaurant else None,
        "hashtags": [pt.tag.name for pt in post.tags if pt.tag is not None],
        "like_count": len(post.likes),
        "comment_count": len(post.comments),
        "created_at": post.created_at,
    }


def serialize_post_detail(
    post: Post, *, current_user: User | None = None
) -> dict[str, Any]:
    return {
        "post_id": post.post_id,
        "type": post.type or "blog",
        "title": post.title,
        "content": post.content,
        "score": post.score,
        "ai_summary": post.ai_summary,
        "thumbnail_url": post.thumbnail_url,
        "author": post.author,
        "restaurant": serialize_brief(post.restaurant) if post.restaurant else None,
        "images": [img.url for img in post.images],
        "hashtags": [pt.tag.name for pt in post.tags if pt.tag is not None],
        "like_count": len(post.likes),
        "comment_count": len(post.comments),
        "is_liked": is_post_liked_loaded(post, current_user),
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }
