"""식당 점수 자동 계산.

`RESTAURANT_SCORES`는 캐시 테이블. 리뷰/스크랩이 변경될 때마다
원본 테이블에서 집계해 갱신한다.
"""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.restaurant_score import RestaurantScore
from app.models.review import Review
from app.models.scrap import Scrap
from app.services.restaurant_service import ensure_score_row


def compute_total_score(
    avg_rating: float, review_count: int, scrap_count: int
) -> float:
    """0~100 점 단순 가중치.

    - 별점 기여 (max 70): avg * 14
    - 리뷰 수 기여 (max 20): min(count, 50) * 0.4
    - 스크랩 수 기여 (max 10): min(count, 100) * 0.1
    """
    s = (avg_rating or 0.0) * 14.0
    s += min(review_count or 0, 50) * 0.4
    s += min(scrap_count or 0, 100) * 0.1
    return min(round(s, 1), 100.0)


def recompute_restaurant_score(db: Session, restaurant_id: int) -> RestaurantScore:
    """REVIEWS·SCRAPS에서 집계해 RESTAURANT_SCORES 갱신.

    ⚠️ seed 데이터로 미리 설정된 점수도 이 호출로 덮어쓰여진다.
       seed의 가짜 점수는 첫 실제 mutation 시 실데이터 기반으로 재계산됨.
    """
    score = ensure_score_row(db, restaurant_id)

    review_stats = (
        db.query(
            func.avg(Review.score).label("avg_score"),
            func.count(Review.review_id).label("cnt"),
        )
        .filter(Review.restaurant_id == restaurant_id)
        .filter(Review.score.isnot(None))
        .one()
    )
    avg = float(review_stats.avg_score) if review_stats.avg_score is not None else 0.0
    cnt = int(review_stats.cnt or 0)

    scrap_cnt = (
        db.query(func.count(Scrap.user_id))
        .filter(Scrap.restaurant_id == restaurant_id)
        .scalar()
    ) or 0
    scrap_cnt = int(scrap_cnt)

    score.avg_review_score = round(avg, 2)
    score.review_count = cnt
    score.scrap_count = scrap_cnt
    score.total_score = compute_total_score(avg, cnt, scrap_cnt)
    db.flush()
    return score
