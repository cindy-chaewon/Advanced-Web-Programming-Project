"""댓글(Comment) 도메인 서비스."""
from typing import Any

from sqlalchemy.orm import Query, Session, selectinload

from app.models.comment import Comment


def comment_query_with_relations(db: Session) -> Query:
    """eager load 작성자."""
    return db.query(Comment).options(selectinload(Comment.author))


def serialize_comment(c: Comment) -> dict[str, Any]:
    return {
        "comment_id": c.comment_id,
        "post_id": c.post_id,
        "content": c.content,
        "author": c.author,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
    }
