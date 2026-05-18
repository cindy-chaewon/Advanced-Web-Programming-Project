"""댓글 라우터: 글 nested(GET·POST) + 단독(PUT·DELETE)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user
from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut, CommentUpdate
from app.services.comment_service import (
    comment_query_with_relations,
    serialize_comment,
)
from app.services.notification_service import create_notification


router = APIRouter(tags=["comments"])


def _get_comment_or_404(db: Session, comment_id: int) -> Comment:
    c = (
        comment_query_with_relations(db)
        .filter(Comment.comment_id == comment_id)
        .first()
    )
    if c is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="댓글을 찾을 수 없습니다.",
        )
    return c


def _ensure_owner(comment: Comment, user: User) -> None:
    if comment.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="작성자만 수정/삭제할 수 있습니다.",
        )


@router.get(
    "/posts/{post_id}/comments",
    response_model=list[CommentOut],
    summary="글 댓글 목록 (최신순)",
)
def list_comments(
    post_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if (
        db.query(Post.post_id).filter(Post.post_id == post_id).first() is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="글을 찾을 수 없습니다."
        )
    rows = (
        comment_query_with_relations(db)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [CommentOut.model_validate(serialize_comment(c)) for c in rows]


@router.post(
    "/posts/{post_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
    summary="댓글 작성 (글 작성자에게 자동 알림)",
)
def create_comment(
    post_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="글을 찾을 수 없습니다."
        )

    comment = Comment(
        post_id=post_id,
        user_id=current_user.user_id,
        content=body.content,
    )
    db.add(comment)
    db.flush()

    # 알림: 자기 자신 댓글에는 알림 X, 작성자 NULL이어도 X
    if post.user_id is not None and post.user_id != current_user.user_id:
        create_notification(
            db,
            user_id=post.user_id,
            type="comment",
            related_id=post_id,
            actor_id=current_user.user_id,
        )

    db.commit()
    fresh = _get_comment_or_404(db, comment.comment_id)
    return CommentOut.model_validate(serialize_comment(fresh))


@router.put(
    "/comments/{comment_id}",
    response_model=CommentOut,
    summary="댓글 수정 (작성자만)",
)
def update_comment(
    comment_id: int,
    body: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = _get_comment_or_404(db, comment_id)
    _ensure_owner(comment, current_user)
    comment.content = body.content
    db.commit()
    fresh = _get_comment_or_404(db, comment_id)
    return CommentOut.model_validate(serialize_comment(fresh))


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="댓글 삭제 (작성자만)",
)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = _get_comment_or_404(db, comment_id)
    _ensure_owner(comment, current_user)
    db.delete(comment)
    db.commit()
