from __future__ import annotations
"""식당 도메인 비즈니스 로직."""
from collections.abc import Sequence
from decimal import Decimal
from math import asin, cos, radians, sin, sqrt
from typing import Any

from sqlalchemy.orm import Query, Session, selectinload

from app.models.address import Address
from app.models.image import Image
from app.models.restaurant import Restaurant
from app.models.restaurant_score import RestaurantScore
from app.models.restaurant_tag import RestaurantTag
from app.models.tag import Tag
from app.schemas.restaurant import AddressIn

EARTH_RADIUS_M = 6_371_000.0


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """두 좌표 사이의 대원 거리(미터). Haversine 공식."""
    rlat1, rlng1, rlat2, rlng2 = map(radians, (lat1, lng1, lat2, lng2))
    dlat = rlat2 - rlat1
    dlng = rlng2 - rlng1
    a = sin(dlat / 2) ** 2 + cos(rlat1) * cos(rlat2) * sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_M * asin(sqrt(a))


def find_or_create_address(db: Session, addr: AddressIn) -> Address:
    """위경도가 매우 가까운(약 1m 이내) 주소가 있으면 재사용, 없으면 생성.

    DECIMAL(10,7) 정밀도 한계 고려한 epsilon 매칭.
    빈 필드는 새 값으로 보완.
    """
    epsilon = Decimal("0.0000100")  # ≈ 약 1m
    existing = (
        db.query(Address)
        .filter(
            Address.latitude.between(addr.latitude - epsilon, addr.latitude + epsilon),
            Address.longitude.between(addr.longitude - epsilon, addr.longitude + epsilon),
        )
        .first()
    )
    if existing is not None:
        if addr.full_address and not existing.full_address:
            existing.full_address = addr.full_address
        if addr.district and not existing.district:
            existing.district = addr.district
        if addr.city and not existing.city:
            existing.city = addr.city
        return existing

    new_addr = Address(
        full_address=addr.full_address,
        district=addr.district,
        city=addr.city,
        latitude=addr.latitude,
        longitude=addr.longitude,
    )
    db.add(new_addr)
    db.flush()
    return new_addr


def find_or_create_tags(db: Session, names: Sequence[str]) -> list[Tag]:
    """해시태그 이름 목록 → Tag row 목록 (없으면 자동 생성). 중복·공백·`#` 제거."""
    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in names:
        if not raw:
            continue
        name = raw.strip().lstrip("#").strip()
        if not name:
            continue
        if len(name) > 50:
            name = name[:50]
        if name in seen:
            continue
        cleaned.append(name)
        seen.add(name)

    if not cleaned:
        return []

    existing = db.query(Tag).filter(Tag.name.in_(cleaned)).all()
    existing_names = {t.name for t in existing}
    new_tags = [Tag(name=n) for n in cleaned if n not in existing_names]
    if new_tags:
        db.add_all(new_tags)
        db.flush()
    return existing + new_tags


def set_restaurant_tags(
    db: Session,
    restaurant_id: int,
    tag_ids: Sequence[int],
    *,
    replace: bool,
) -> None:
    """식당의 RESTAURANT_TAGS 갱신.

    replace=True: 기존 태그 모두 삭제 후 새로 추가.
    replace=False: 없는 태그만 추가 (등록 시 사용).
    """
    if replace:
        db.query(RestaurantTag).filter(
            RestaurantTag.restaurant_id == restaurant_id
        ).delete(synchronize_session=False)
        db.flush()

    existing_ids = {
        rt.tag_id
        for rt in db.query(RestaurantTag)
        .filter(RestaurantTag.restaurant_id == restaurant_id)
        .all()
    }
    for tid in tag_ids:
        if tid not in existing_ids:
            db.add(RestaurantTag(restaurant_id=restaurant_id, tag_id=tid))
    db.flush()


def ensure_score_row(db: Session, restaurant_id: int) -> RestaurantScore:
    """RESTAURANT_SCORES row가 없으면 zeros로 생성."""
    score = (
        db.query(RestaurantScore)
        .filter(RestaurantScore.restaurant_id == restaurant_id)
        .first()
    )
    if score is None:
        score = RestaurantScore(restaurant_id=restaurant_id)
        db.add(score)
        db.flush()
        db.refresh(score)
    return score


def replace_restaurant_images(db: Session, restaurant_id: int, urls: list[str]) -> None:
    """식당 기존 이미지 삭제 후 새 URL 목록으로 교체."""
    db.query(Image).filter(Image.restaurant_id == restaurant_id).delete(
        synchronize_session=False
    )
    db.flush()
    seen: set[str] = set()
    for url in urls:
        if not url or url in seen:
            continue
        seen.add(url)
        db.add(Image(url=url, restaurant_id=restaurant_id))
    db.flush()


def restaurants_query_with_relations(db: Session) -> Query:
    """공통 eager load 옵션."""
    return (
        db.query(Restaurant)
        .options(selectinload(Restaurant.address))
        .options(selectinload(Restaurant.category))
        .options(selectinload(Restaurant.score))
        .options(
            selectinload(Restaurant.tags).selectinload(RestaurantTag.tag)
        )
        .options(selectinload(Restaurant.images))
    )


def serialize_brief(r: Restaurant, distance: float | None = None) -> dict[str, Any]:
    """Restaurant ORM → RestaurantBrief 응답용 dict."""
    s = r.score
    return {
        "restaurant_id": r.restaurant_id,
        "name": r.name,
        "phone": r.phone,
        "opening_hours": r.opening_hours,
        "category": r.category,
        "address": r.address,
        "hashtags": [rt.tag.name for rt in r.tags if rt.tag is not None],
        "avg_review_score": float(s.avg_review_score) if s else 0.0,
        "review_count": s.review_count if s else 0,
        "scrap_count": s.scrap_count if s else 0,
        "distance_meters": distance,
        "thumbnail_url": r.thumbnail_url,
    }


def serialize_detail(r: Restaurant) -> dict[str, Any]:
    """Restaurant ORM → RestaurantRead 응답용 dict."""
    return {
        "restaurant_id": r.restaurant_id,
        "name": r.name,
        "description": r.description,
        "phone": r.phone,
        "opening_hours": r.opening_hours,
        "break_time": r.break_time,
        "thumbnail_url": r.thumbnail_url,
        "images": [img.url for img in r.images if img.restaurant_id == r.restaurant_id],
        "category": r.category,
        "address": r.address,
        "hashtags": [rt.tag.name for rt in r.tags if rt.tag is not None],
        "score": r.score,
        "registered_by": r.registered_by,
        "created_at": r.created_at,
    }
