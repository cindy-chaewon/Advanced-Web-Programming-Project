"""블로그 글 라우터: CRUD + 좋아요 + AI 요약."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user
from app.core.rate_limit import limiter
from app.models.address import Address
from app.models.group_member import GroupMember
from app.models.post import Post
from app.models.post_like import PostLike
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.ai import AISummaryOut
from app.schemas.common import LikeStatus
from app.schemas.post import PostBrief, PostCreate, PostRead, PostUpdate
from app.services.gemini_service import summarize_post
from app.services.notification_service import create_notification
from app.services.post_service import (
    post_query_with_relations,
    replace_post_images,
    replace_post_tags,
    serialize_post_brief,
    serialize_post_detail,
)
from app.services.restaurant_service import haversine_meters


router = APIRouter(prefix="/posts", tags=["posts"])


# ─────────────────────────── 헬퍼 ───────────────────────────


def _get_post_or_404(db: Session, post_id: int) -> Post:
    p = post_query_with_relations(db).filter(Post.post_id == post_id).first()
    if p is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="글을 찾을 수 없습니다."
        )
    return p


def _ensure_owner(post: Post, user: User) -> None:
    if post.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="작성자만 수정/삭제할 수 있습니다.",
        )


# ─────────────────────────── 목록/상세 ───────────────────────────


@router.get(
    "",
    response_model=list[PostBrief],
    summary="글 목록 (sort=latest|popular|nearby, type=blog|simple)",
    description=(
        "- `latest`: 최신순 (created_at desc)\n"
        "- `popular`: 좋아요 많은 순 → 같으면 최신\n"
        "- `nearby`: 사용자 위치 기준 식당 좌표 가까운 순 (`lat`, `lng` 필수)\n"
        "  - 선택 `radius`(미터)로 반경 컷\n"
        "- `type`: blog 또는 simple 필터 (생략 시 전체)"
    ),
)
def list_posts(
    sort: str = Query("latest", pattern="^(latest|popular|nearby)$"),
    type: str | None = Query(default=None, pattern="^(blog|simple)$", description="글 유형 필터"),
    lat: float | None = Query(default=None, description="nearby 정렬용 중심 위도"),
    lng: float | None = Query(default=None, description="nearby 정렬용 중심 경도"),
    radius: float | None = Query(
        default=None,
        ge=10.0,
        le=50_000.0,
        description="nearby 정렬 시 선택적 반경 컷(m)",
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    # ── popular: POST_LIKES 카운트 desc + tie breaker created_at desc ──
    if sort == "popular":
        like_count_subq = (
            db.query(
                PostLike.post_id,
                func.count(PostLike.post_id).label("cnt"),
            )
            .group_by(PostLike.post_id)
            .subquery()
        )
        q = (
            post_query_with_relations(db)
            .outerjoin(
                like_count_subq,
                Post.post_id == like_count_subq.c.post_id,
            )
            .order_by(
                func.coalesce(like_count_subq.c.cnt, 0).desc(),
                Post.created_at.desc(),
            )
        )
        if type is not None:
            q = q.filter(Post.type == type)
        q = q.offset(offset).limit(limit)
        return [
            PostBrief.model_validate(
                serialize_post_brief(p, current_user=current_user)
            )
            for p in q.all()
        ]

    # ── nearby: lat/lng 기준 식당 좌표 가까운 순 ──
    if sort == "nearby":
        if lat is None or lng is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="nearby 정렬은 lat, lng query가 필요합니다.",
            )

        q = (
            post_query_with_relations(db)
            .join(Restaurant, Post.restaurant_id == Restaurant.restaurant_id)
            .join(Address, Restaurant.address_id == Address.address_id)
        )
        if type is not None:
            q = q.filter(Post.type == type)
        # 1차: bounding box 필터 (radius 있을 때만)
        if radius is not None:
            deg = radius / 111_000.0
            lat_min = Decimal(str(lat - deg))
            lat_max = Decimal(str(lat + deg))
            lng_min = Decimal(str(lng - deg))
            lng_max = Decimal(str(lng + deg))
            q = q.filter(
                Address.latitude.between(lat_min, lat_max),
                Address.longitude.between(lng_min, lng_max),
            )
        candidates = q.all()

        # 2차: Haversine 정밀 거리
        with_dist: list[tuple[Post, float]] = []
        for p in candidates:
            if not (p.restaurant and p.restaurant.address):
                continue
            d = haversine_meters(
                lat,
                lng,
                float(p.restaurant.address.latitude),
                float(p.restaurant.address.longitude),
            )
            if radius is None or d <= radius:
                with_dist.append((p, d))

        with_dist.sort(key=lambda x: x[1])
        sliced = with_dist[offset : offset + limit]
        return [
            PostBrief.model_validate(
                serialize_post_brief(p, current_user=current_user)
            )
            for p, _ in sliced
        ]

    # ── latest (default) ──
    q = post_query_with_relations(db).order_by(Post.created_at.desc())
    if type is not None:
        q = q.filter(Post.type == type)
    q = q.offset(offset).limit(limit)
    return [
        PostBrief.model_validate(
            serialize_post_brief(p, current_user=current_user)
        )
        for p in q.all()
    ]


@router.get("/{post_id}", response_model=PostRead, summary="글 상세")
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    post = _get_post_or_404(db, post_id)
    return PostRead.model_validate(
        serialize_post_detail(post, current_user=current_user)
    )


# ─────────────────────────── 작성/수정/삭제 ───────────────────────────


@router.post(
    "",
    response_model=PostRead,
    status_code=status.HTTP_201_CREATED,
    summary="글 작성 (인증 필요)",
)
def create_post(
    body: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = (
        db.query(Restaurant)
        .filter(Restaurant.restaurant_id == body.restaurant_id)
        .first()
    )
    if r is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"식당을 찾을 수 없습니다: {body.restaurant_id}",
        )

    thumbnail = body.thumbnail_url or (body.image_urls[0] if body.image_urls else None)

    post = Post(
        user_id=current_user.user_id,
        restaurant_id=body.restaurant_id,
        type=body.type,
        score=body.score,
        title=body.title,
        content=body.content,
        thumbnail_url=thumbnail,
    )
    db.add(post)
    db.flush()

    if body.image_urls:
        replace_post_images(db, post.post_id, body.image_urls)
    if body.hashtags:
        replace_post_tags(db, post.post_id, body.hashtags)

    # ── 그룹 멤버 알림 hook: 작성자가 속한 그룹들의 멤버에게 알림 ──
    # 작성자 자신 제외 + 중복 user_id 제거(여러 그룹 동시 가입 케이스).
    member_ids = (
        db.query(GroupMember.user_id)
        .filter(
            GroupMember.group_id.in_(
                db.query(GroupMember.group_id).filter(
                    GroupMember.user_id == current_user.user_id
                )
            ),
            GroupMember.user_id != current_user.user_id,
        )
        .distinct()
        .all()
    )
    for (uid,) in member_ids:
        create_notification(
            db,
            user_id=uid,
            type="group_invite",
            related_id=post.post_id,
            actor_id=current_user.user_id,
        )

    db.commit()
    fresh = _get_post_or_404(db, post.post_id)
    return PostRead.model_validate(
        serialize_post_detail(fresh, current_user=current_user)
    )


@router.put(
    "/{post_id}",
    response_model=PostRead,
    summary="글 수정 (작성자만)",
)
def update_post(
    post_id: int,
    body: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = _get_post_or_404(db, post_id)
    _ensure_owner(post, current_user)

    if body.title is not None:
        post.title = body.title
    if body.content is not None:
        post.content = body.content
    if body.score is not None:
        post.score = body.score
    if body.image_urls is not None:
        replace_post_images(db, post.post_id, body.image_urls)
        # 썸네일이 명시되지 않았으면 새 첫 이미지로 갱신.
        if body.thumbnail_url is None:
            post.thumbnail_url = body.image_urls[0] if body.image_urls else None
    if body.thumbnail_url is not None:
        post.thumbnail_url = body.thumbnail_url
    if body.hashtags is not None:
        replace_post_tags(db, post.post_id, body.hashtags)

    db.commit()
    fresh = _get_post_or_404(db, post_id)
    return PostRead.model_validate(
        serialize_post_detail(fresh, current_user=current_user)
    )


@router.delete(
    "/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="글 삭제 (작성자만)",
)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = _get_post_or_404(db, post_id)
    _ensure_owner(post, current_user)
    db.delete(post)
    db.commit()


# ─────────────────────────── 좋아요 ───────────────────────────


@router.post(
    "/{post_id}/like",
    response_model=LikeStatus,
    summary="글 좋아요 (멱등, 작성자에게 자동 알림)",
)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 작성자 정보까지 가져와서 알림 hook 판정
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="글을 찾을 수 없습니다."
        )

    already = (
        db.query(PostLike)
        .filter(
            PostLike.post_id == post_id,
            PostLike.user_id == current_user.user_id,
        )
        .first()
    )
    if already is None:
        db.add(PostLike(post_id=post_id, user_id=current_user.user_id))
        # 자기 자신 좋아요는 알림 X, 작성자 NULL이어도 X
        if post.user_id is not None and post.user_id != current_user.user_id:
            create_notification(
                db,
                user_id=post.user_id,
                type="like",
                related_id=post_id,
                actor_id=current_user.user_id,
            )
        db.commit()

    cnt = db.query(PostLike).filter(PostLike.post_id == post_id).count()
    return LikeStatus(is_liked=True, like_count=cnt)


@router.delete(
    "/{post_id}/like",
    response_model=LikeStatus,
    summary="글 좋아요 취소",
)
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.user_id,
    ).delete(synchronize_session=False)
    db.commit()
    cnt = db.query(PostLike).filter(PostLike.post_id == post_id).count()
    return LikeStatus(is_liked=False, like_count=cnt)


# ─────────────────────────── AI 요약 ───────────────────────────


@router.post(
    "/{post_id}/summary",
    response_model=AISummaryOut,
    summary="AI 3줄 요약 생성 (Gemini)",
    description=(
        "글의 title + content를 Gemini에 보내 한국어 3줄 요약 생성.\n"
        "결과는 `POSTS.ai_summary` 컬럼에 캐시됨.\n"
        "`force=true`로 호출하면 기존 캐시 무시하고 재생성.\n"
        "Rate limit: 5/minute per IP (Gemini quota 보호)."
    ),
)
@limiter.limit("5/minute")
def generate_post_summary(
    post_id: int,
    request: Request,
    force: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = _get_post_or_404(db, post_id)

    if post.ai_summary and not force:
        return AISummaryOut(
            post_id=post.post_id,
            summary=post.ai_summary,
            cached=True,
        )

    if not (post.content or "").strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="본문이 비어있어 요약을 만들 수 없습니다.",
        )

    summary = summarize_post(post.title, post.content or "")
    post.ai_summary = summary
    db.commit()

    return AISummaryOut(
        post_id=post.post_id,
        summary=summary,
        cached=False,
    )
