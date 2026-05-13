"""식당 라우터: 지도 검색, 검색, CRUD, 점수, 메뉴(중첩)."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.rate_limit import limiter
from app.models.address import Address
from app.models.category import Category
from app.models.image import Image
from app.models.menu import Menu
from app.models.post import Post
from app.models.restaurant import Restaurant
from app.models.restaurant_tag import RestaurantTag
from app.models.review import Review
from app.models.scrap import Scrap
from app.models.tag import Tag
from app.models.user import User
from app.schemas.ai import AIReviewOut
from app.schemas.common import ScrapStatus
from app.schemas.menu import MenuCreate, MenuOut
from app.schemas.restaurant import (
    RestaurantBrief,
    RestaurantCreate,
    RestaurantRead,
    RestaurantScoreOut,
    RestaurantUpdate,
)
from app.services.restaurant_service import (
    ensure_score_row,
    find_or_create_address,
    find_or_create_tags,
    haversine_meters,
    replace_restaurant_images,
    restaurants_query_with_relations,
    serialize_brief,
    serialize_detail,
    set_restaurant_tags,
)
from app.services.gemini_service import review_summary
from app.services.score_service import recompute_restaurant_score


router = APIRouter(prefix="/restaurants", tags=["restaurants"])


# ─────────────────────────── 헬퍼 ───────────────────────────


def _get_restaurant_or_404(db: Session, restaurant_id: int) -> Restaurant:
    r = (
        restaurants_query_with_relations(db)
        .filter(Restaurant.restaurant_id == restaurant_id)
        .first()
    )
    if r is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="식당을 찾을 수 없습니다.",
        )
    return r


def _ensure_owner(restaurant: Restaurant, user: User) -> None:
    """등록자 본인이거나, 등록자가 NULL(탈퇴)인 경우 허용."""
    if restaurant.registered_by is None:
        return
    if restaurant.registered_by != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="등록자만 수정/추가할 수 있습니다.",
        )


def _ensure_category(db: Session, category_id: int) -> Category:
    cat = db.query(Category).filter(Category.category_id == category_id).first()
    if cat is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"존재하지 않는 카테고리: {category_id}",
        )
    return cat


# ─────────────────────────── GET /restaurants (지도) ───────────────────────────


@router.get(
    "",
    response_model=list[RestaurantBrief],
    summary="지도 범위 내 식당 (위치 기반)",
    description=(
        "중심 좌표 기준 `radius`(미터) 이내 식당을 거리순 반환.\n"
        "bounding box로 1차 필터 → Haversine으로 정밀 거리 계산."
    ),
)
def list_restaurants_nearby(
    lat: float = Query(..., description="중심 위도"),
    lng: float = Query(..., description="중심 경도"),
    radius: float = Query(2000.0, ge=10.0, le=50_000.0, description="반경 (미터)"),
    category_id: int | None = Query(default=None, description="카테고리 필터"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    # 1차: bounding box 필터 (인덱스 활용)
    deg = radius / 111_000.0  # 위도 1° ≈ 111km, 경도는 근사
    lat_min = Decimal(str(lat - deg))
    lat_max = Decimal(str(lat + deg))
    lng_min = Decimal(str(lng - deg))
    lng_max = Decimal(str(lng + deg))

    q = (
        restaurants_query_with_relations(db)
        .join(Address, Restaurant.address_id == Address.address_id)
        .filter(Address.latitude.between(lat_min, lat_max))
        .filter(Address.longitude.between(lng_min, lng_max))
    )
    if category_id is not None:
        q = q.filter(Restaurant.category_id == category_id)
    candidates = q.all()

    # 2차: Haversine 정밀 거리 + radius 컷
    with_dist: list[tuple[Restaurant, float]] = []
    for r in candidates:
        if r.address is None:
            continue
        d = haversine_meters(
            lat, lng, float(r.address.latitude), float(r.address.longitude)
        )
        if d <= radius:
            with_dist.append((r, d))

    with_dist.sort(key=lambda x: x[1])
    sliced = with_dist[offset : offset + limit]
    return [RestaurantBrief.model_validate(serialize_brief(r, d)) for r, d in sliced]


# ─────────────────────────── GET /restaurants/search ───────────────────────────


@router.get(
    "/search",
    response_model=list[RestaurantBrief],
    summary="식당 검색 (이름 / 해시태그 / 카테고리)",
)
def search_restaurants(
    q: str | None = Query(default=None, description="식당명 LIKE 검색"),
    tag: str | None = Query(default=None, description="해시태그 (# 제외)"),
    category_id: int | None = Query(default=None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = restaurants_query_with_relations(db)

    if q:
        query = query.filter(Restaurant.name.like(f"%{q}%"))
    if category_id is not None:
        query = query.filter(Restaurant.category_id == category_id)
    if tag:
        clean = tag.strip().lstrip("#")
        query = (
            query.join(RestaurantTag, RestaurantTag.restaurant_id == Restaurant.restaurant_id)
            .join(Tag, Tag.tag_id == RestaurantTag.tag_id)
            .filter(Tag.name == clean)
        )

    query = (
        query.order_by(Restaurant.restaurant_id.desc())
        .offset(offset)
        .limit(limit)
    )
    return [RestaurantBrief.model_validate(serialize_brief(r)) for r in query.all()]


# ─────────────────────────── POST /restaurants (등록) ───────────────────────────


@router.post(
    "",
    response_model=RestaurantRead,
    status_code=status.HTTP_201_CREATED,
    summary="식당 등록 (인증 필요)",
)
def create_restaurant(
    body: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_category(db, body.category_id)
    address = find_or_create_address(db, body.address)

    restaurant = Restaurant(
        name=body.name,
        description=body.description,
        phone=body.phone,
        opening_hours=body.opening_hours,
        break_time=body.break_time,
        thumbnail_url=body.thumbnail_url,
        address_id=address.address_id,
        category_id=body.category_id,
        registered_by=current_user.user_id,
    )
    db.add(restaurant)
    db.flush()  # restaurant_id 확보

    if body.hashtags:
        tags = find_or_create_tags(db, body.hashtags)
        set_restaurant_tags(
            db, restaurant.restaurant_id, [t.tag_id for t in tags], replace=False
        )

    if body.image_urls:
        replace_restaurant_images(db, restaurant.restaurant_id, body.image_urls)

    ensure_score_row(db, restaurant.restaurant_id)
    db.commit()

    fresh = _get_restaurant_or_404(db, restaurant.restaurant_id)
    return RestaurantRead.model_validate(serialize_detail(fresh))


# ─────────────────────────── GET /restaurants/:id ───────────────────────────


@router.get(
    "/{restaurant_id}",
    response_model=RestaurantRead,
    summary="식당 상세",
)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    r = _get_restaurant_or_404(db, restaurant_id)
    return RestaurantRead.model_validate(serialize_detail(r))


# ─────────────────────────── PUT /restaurants/:id ───────────────────────────


@router.put(
    "/{restaurant_id}",
    response_model=RestaurantRead,
    summary="식당 정보 수정 (등록자만)",
)
def update_restaurant(
    restaurant_id: int,
    body: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = _get_restaurant_or_404(db, restaurant_id)
    _ensure_owner(r, current_user)

    if body.name is not None:
        r.name = body.name
    if body.description is not None:
        r.description = body.description
    if body.phone is not None:
        r.phone = body.phone
    if body.opening_hours is not None:
        r.opening_hours = body.opening_hours
    if body.break_time is not None:
        r.break_time = body.break_time
    if body.thumbnail_url is not None:
        r.thumbnail_url = body.thumbnail_url
    if body.image_urls is not None:
        replace_restaurant_images(db, r.restaurant_id, body.image_urls)
    if body.category_id is not None:
        _ensure_category(db, body.category_id)
        r.category_id = body.category_id
    if body.address is not None:
        new_addr = find_or_create_address(db, body.address)
        r.address_id = new_addr.address_id
    if body.hashtags is not None:
        tags = find_or_create_tags(db, body.hashtags)
        set_restaurant_tags(
            db, r.restaurant_id, [t.tag_id for t in tags], replace=True
        )

    db.commit()
    fresh = _get_restaurant_or_404(db, restaurant_id)
    return RestaurantRead.model_validate(serialize_detail(fresh))


# ─────────────────────────── GET /restaurants/:id/score ───────────────────────────


@router.get(
    "/{restaurant_id}/score",
    response_model=RestaurantScoreOut,
    summary="식당 점수 조회 (없으면 0점으로 초기화)",
)
def get_restaurant_score(restaurant_id: int, db: Session = Depends(get_db)):
    exists = (
        db.query(Restaurant.restaurant_id)
        .filter(Restaurant.restaurant_id == restaurant_id)
        .first()
    )
    if exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="식당을 찾을 수 없습니다.",
        )
    score = ensure_score_row(db, restaurant_id)
    db.commit()
    return score


# ─────────────────────────── 메뉴 (중첩) ───────────────────────────


@router.get(
    "/{restaurant_id}/menus",
    response_model=list[MenuOut],
    summary="식당 메뉴 목록",
)
def list_menus(restaurant_id: int, db: Session = Depends(get_db)):
    exists = (
        db.query(Restaurant.restaurant_id)
        .filter(Restaurant.restaurant_id == restaurant_id)
        .first()
    )
    if exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="식당을 찾을 수 없습니다.",
        )
    return (
        db.query(Menu)
        .filter(Menu.restaurant_id == restaurant_id)
        .order_by(Menu.is_signature.desc(), Menu.menu_id)
        .all()
    )


@router.post(
    "/{restaurant_id}/menus",
    response_model=MenuOut,
    status_code=status.HTTP_201_CREATED,
    summary="메뉴 추가 (등록자만)",
)
def create_menu(
    restaurant_id: int,
    body: MenuCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = _get_restaurant_or_404(db, restaurant_id)
    _ensure_owner(r, current_user)
    menu = Menu(
        restaurant_id=restaurant_id,
        name=body.name,
        description=body.description,
        price=body.price,
        is_signature=body.is_signature,
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return menu


# ─────────────────────────── 스크랩 (북마크) ───────────────────────────


@router.post(
    "/{restaurant_id}/scrap",
    response_model=ScrapStatus,
    status_code=status.HTTP_201_CREATED,
    summary="식당 스크랩 (멱등)",
)
def scrap_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    existing = (
        db.query(Scrap)
        .filter(
            Scrap.restaurant_id == restaurant_id,
            Scrap.user_id == current_user.user_id,
        )
        .first()
    )
    if existing is None:
        db.add(Scrap(restaurant_id=restaurant_id, user_id=current_user.user_id))
        db.flush()
        recompute_restaurant_score(db, restaurant_id)
        db.commit()

    cnt = (
        db.query(Scrap).filter(Scrap.restaurant_id == restaurant_id).count()
    )
    return ScrapStatus(is_scrapped=True, scrap_count=cnt)


@router.delete(
    "/{restaurant_id}/scrap",
    response_model=ScrapStatus,
    summary="식당 스크랩 취소",
)
def unscrap_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = (
        db.query(Scrap)
        .filter(
            Scrap.restaurant_id == restaurant_id,
            Scrap.user_id == current_user.user_id,
        )
        .delete(synchronize_session=False)
    )
    if deleted:
        db.flush()
        recompute_restaurant_score(db, restaurant_id)
    db.commit()
    cnt = (
        db.query(Scrap).filter(Scrap.restaurant_id == restaurant_id).count()
    )
    return ScrapStatus(is_scrapped=False, scrap_count=cnt)


# ─────────────────────────── AI 종합 평 ───────────────────────────


@router.get(
    "/{restaurant_id}/ai-review",
    response_model=AIReviewOut,
    summary="식당 종합 AI 평 (Gemini)",
    description=(
        "최근 리뷰 10개 + 블로그 글 5개를 모아 Gemini에 보내 종합평 생성.\n"
        "캐시 없음 — 매 호출마다 새로 생성 (분당 15 요청 제한 주의).\n"
        "Rate limit: 5/minute per IP (Gemini quota 보호)."
    ),
)
@limiter.limit("5/minute")
def restaurant_ai_review(
    restaurant_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    r = (
        db.query(Restaurant)
        .filter(Restaurant.restaurant_id == restaurant_id)
        .first()
    )
    if r is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="식당을 찾을 수 없습니다.",
        )

    reviews = (
        db.query(Review)
        .filter(Review.restaurant_id == restaurant_id)
        .filter(Review.content.isnot(None))
        .order_by(Review.created_at.desc())
        .limit(10)
        .all()
    )
    posts = (
        db.query(Post)
        .filter(Post.restaurant_id == restaurant_id)
        .order_by(Post.created_at.desc())
        .limit(5)
        .all()
    )

    if not reviews and not posts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="리뷰나 글이 없어 종합평을 생성할 수 없습니다.",
        )

    review_texts = [rv.content for rv in reviews if rv.content]
    post_excerpts = [
        (p.ai_summary or (p.content or "")[:200]) for p in posts
    ]

    summary = review_summary(r.name, review_texts, post_excerpts)
    return AIReviewOut(
        restaurant_id=restaurant_id,
        review=summary,
        review_count=len(reviews),
        post_count=len(posts),
    )
