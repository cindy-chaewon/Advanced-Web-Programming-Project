"""카카오맵 카테고리 검색으로 가천대 인근 실제 음식점·카페를 가져와
시드 식당으로 추가할 INSERT SQL을 생성한다.

사용법 (backend/ 디렉토리에서):
    .venv/bin/python scripts/fetch_kakao_restaurants.py --dry-run
    .venv/bin/python scripts/fetch_kakao_restaurants.py --apply

출력:
- dry-run: 후보 식당 목록 표시 (DB/파일 변경 X)
- apply: database/migrations/2026-05-13_kakao_seed_restaurants.sql 생성
         + 가짜 시드 가게(121 가천호프, 122 막걸리한잔, 129 청룡원) 제거 SQL 포함
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import httpx

_THIS = Path(__file__).resolve()
_BACKEND_ROOT = _THIS.parents[1]
sys.path.insert(0, str(_BACKEND_ROOT))
os.chdir(_BACKEND_ROOT)

from math import asin, cos, radians, sin, sqrt  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.models.address import Address  # noqa: E402
from app.models.restaurant import Restaurant  # noqa: E402

# 카카오맵 검색 파라미터
CATEGORY_URL = "https://dapi.kakao.com/v2/local/search/category.json"
GACHON_LAT = 37.4516
GACHON_LNG = 127.1306
SEARCH_RADIUS_M = 1500

# 시드 새 식당 시작 ID (기존: 101~130 사용 중, 가짜 121/122/129 자리도 재사용)
NEW_ID_START = 131
NEW_ID_END = 199
MAX_NEW_PER_CAT = 5  # 카테고리당 최대 추가 수
FAKE_IDS_TO_REPLACE = [121, 122, 129]  # 임의로 만든 가짜 가게 자리

_MIGRATION_OUT = (
    _BACKEND_ROOT.parent / "database" / "migrations" / "2026-05-13_kakao_seed_restaurants.sql"
)


# 카카오 category_name → 우리 category_id 매핑
def _map_category(kakao_cat: str) -> int | None:
    """`음식점 > 한식 > ...` → 1 (한식). 매칭 안 되면 None."""
    if not kakao_cat:
        return None
    parts = [p.strip() for p in kakao_cat.split(">")]
    if len(parts) < 2:
        if "카페" in kakao_cat:
            return 5
        return None

    main = parts[1]
    if main == "한식":
        return 1
    if main in ("양식", "패스트푸드", "아시아음식", "유럽음식", "인도음식", "분식"):
        # 분식은 한식이라는 의견도 있지만 카카오에서 양식·분식 따로 → 한식으로
        if main == "분식":
            return 1
        return 2
    if main == "일식":
        return 3
    if main == "중식":
        return 4
    if main == "카페" or "카페" in main:
        # 디저트카페는 디저트로
        if any("디저트" in p or "베이커리" in p or "빵" in p for p in parts):
            return 7
        return 5
    if main in ("술집", "주점"):
        return 6
    if "디저트" in main or "베이커리" in main or "빵" in main:
        return 7
    return 8  # 기타


def _fetch_category(group_code: str, page: int = 1, size: int = 15) -> list[dict]:
    headers = {"Authorization": f"KakaoAK {settings.KAKAO_CLIENT_ID}"}
    params = {
        "category_group_code": group_code,
        "x": str(GACHON_LNG),
        "y": str(GACHON_LAT),
        "radius": SEARCH_RADIUS_M,
        "size": size,
        "page": page,
        "sort": "distance",
    }
    resp = httpx.get(CATEGORY_URL, headers=headers, params=params, timeout=10.0)
    resp.raise_for_status()
    return resp.json().get("documents", [])


def _normalize(s: str) -> str:
    return "".join(s.lower().split())


def _haversine_m(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    r1, n1, r2, n2 = map(radians, (a_lat, a_lng, b_lat, b_lng))
    a = sin((r2 - r1) / 2) ** 2 + cos(r1) * cos(r2) * sin((n2 - n1) / 2) ** 2
    return 2 * 6_371_000 * asin(sqrt(a))


def _existing_seed_data() -> list[tuple[str, float, float]]:
    """DB에서 시드 식당 + 좌표를 가져옴 (가짜 가게는 제외)."""
    db = SessionLocal()
    try:
        rows = (
            db.query(Restaurant, Address)
            .join(Address, Restaurant.address_id == Address.address_id)
            .filter(Restaurant.restaurant_id.between(100, 199))
            .filter(~Restaurant.restaurant_id.in_(FAKE_IDS_TO_REPLACE))
            .all()
        )
        return [(r.name, float(a.latitude), float(a.longitude)) for r, a in rows]
    finally:
        db.close()


def _is_duplicate_by_coords(
    new_lat: float, new_lng: float, existing: list[tuple[str, float, float]],
    threshold_m: float = 30.0,
) -> str | None:
    """기존 식당과 좌표가 threshold_m 이내면 중복으로 보고 매칭된 이름 반환."""
    for name, lat, lng in existing:
        if _haversine_m(new_lat, new_lng, lat, lng) <= threshold_m:
            return name
    return None


def _sql_escape(s: str | None) -> str:
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def fetch_candidates() -> list[dict]:
    """가천대 1.5km 내 음식점(FD6) + 카페(CE7) 페이지네이션 수집 + 중복/카테고리 처리."""
    docs: list[dict] = []
    # FD6 (음식점): 5페이지 × 15 = 최대 75개
    for page in range(1, 6):
        try:
            d = _fetch_category("FD6", page=page, size=15)
            if not d:
                break
            docs.extend(d)
            time.sleep(0.2)  # rate limit 여유
        except httpx.HTTPError as exc:
            print(f"⚠️ FD6 page {page} 호출 실패: {exc}")
            break
    # CE7 (카페): 3페이지 = 최대 45개
    for page in range(1, 4):
        try:
            d = _fetch_category("CE7", page=page, size=15)
            if not d:
                break
            docs.extend(d)
            time.sleep(0.2)
        except httpx.HTTPError as exc:
            print(f"⚠️ CE7 page {page} 호출 실패: {exc}")
            break

    existing_seed = _existing_seed_data()
    print(f"   기존 시드 식당 (중복 검사용): {len(existing_seed)}곳")

    # 중복 제거 + 카테고리 매핑
    out: list[dict] = []
    seen: set[str] = set()
    for doc in docs:
        name = doc.get("place_name", "").strip()
        if not name:
            continue
        # 이름 길이 100자 한도 (DB VARCHAR(100))
        if len(name) > 100:
            name = name[:100]
        key = _normalize(name)
        if key in seen:
            continue
        seen.add(key)

        cat_name = doc.get("category_name", "")
        cat_id = _map_category(cat_name)
        if cat_id is None:
            continue

        new_lat = float(doc.get("y", 0))
        new_lng = float(doc.get("x", 0))

        dup_name = _is_duplicate_by_coords(new_lat, new_lng, existing_seed)
        if dup_name:
            continue  # 기존 시드와 같은 가게 (좌표 일치)

        out.append({
            "name": name,
            "phone": doc.get("phone") or None,
            "address": (doc.get("road_address_name") or doc.get("address_name") or "")[:200],
            "lat": new_lat,
            "lng": new_lng,
            "category_id": cat_id,
            "kakao_category": cat_name,
            "distance_m": int(doc.get("distance") or 0),
        })

    return out


def select_balanced(candidates: list[dict], per_cat: int = MAX_NEW_PER_CAT) -> list[dict]:
    """카테고리별로 최대 per_cat 개씩 균형 있게 선정. 가까운 순."""
    by_cat: dict[int, list[dict]] = {}
    for c in sorted(candidates, key=lambda x: x["distance_m"]):
        by_cat.setdefault(c["category_id"], []).append(c)
    out: list[dict] = []
    for cat_id, items in by_cat.items():
        out.extend(items[:per_cat])
    return sorted(out, key=lambda x: x["distance_m"])


def write_migration(selected: list[dict]) -> None:
    """선택된 식당을 적용할 SQL 마이그레이션 파일 생성."""
    cat_names = {1: "한식", 2: "양식", 3: "일식", 4: "중식", 5: "카페", 6: "술집", 7: "디저트", 8: "기타"}

    lines = [
        "-- =============================================================",
        "-- Auto-generated: 카카오맵 카테고리 검색 결과로 시드 식당 보강",
        "-- 출처: scripts/fetch_kakao_restaurants.py",
        "-- 적용: sudo mysql < database/migrations/2026-05-13_kakao_seed_restaurants.sql",
        "-- =============================================================",
        "USE mapweb;",
        "",
        "-- 가짜 시드 가게(121, 122, 129) + 이전 카카오 시드(131~199) 정리",
        "-- 123~128, 130은 기존 seed.sql 시드라 보존",
        "DELETE FROM RESTAURANTS WHERE restaurant_id IN (121, 122, 129)",
        "                           OR restaurant_id BETWEEN 131 AND 199;",
        "DELETE FROM ADDRESSES   WHERE address_id IN (121, 122, 129)",
        "                           OR address_id BETWEEN 131 AND 199;",
        "",
        "-- 새 ADDRESSES",
        "INSERT INTO ADDRESSES (address_id, full_address, district, city, latitude, longitude) VALUES",
    ]

    addr_rows = []
    rest_rows = []
    score_rows = []

    # ID 풀: 가짜 자리(121, 122, 129) + 131~199
    available_ids = sorted(FAKE_IDS_TO_REPLACE + list(range(NEW_ID_START, NEW_ID_END + 1)))
    used_ids: list[int] = []
    for c, rid in zip(selected, available_ids):
        used_ids.append(rid)
        addr_rows.append(
            f"    ({rid}, {_sql_escape(c['address'])}, '수정구', '성남시', {c['lat']:.7f}, {c['lng']:.7f})"
        )
        cat = cat_names.get(c["category_id"], "기타")
        # 주석을 별도 라인으로 두면 SQL syntax 깨지지 않음
        rest_rows.append(
            f"    -- {cat} ({c['distance_m']}m, {c['kakao_category']})\n"
            f"    ({rid}, {_sql_escape(c['name'])}, {_sql_escape(c['phone'])}, NULL, NULL, NULL,"
            f" {rid}, {c['category_id']}, NULL)"
        )
        score_rows.append(f"    ({rid})")

    lines.append(",\n".join(addr_rows) + ";")
    lines.append("")
    lines.append("-- 새 RESTAURANTS (registered_by=NULL — 시스템 시드)")
    lines.append(
        "INSERT INTO RESTAURANTS (restaurant_id, name, phone, opening_hours, break_time, thumbnail_url,"
        " address_id, category_id, registered_by) VALUES"
    )
    lines.append(",\n".join(rest_rows) + ";")
    lines.append("")
    lines.append("-- 점수 row 초기화 (자동 계산은 호출 시)")
    lines.append("INSERT INTO RESTAURANT_SCORES (restaurant_id) VALUES")
    lines.append(",\n".join(score_rows) + ";")
    lines.append("")
    lines.append(f"-- 총 {len(used_ids)}곳 추가 (ID {used_ids[0]}~{used_ids[-1]} 중 일부)")

    _MIGRATION_OUT.parent.mkdir(parents=True, exist_ok=True)
    _MIGRATION_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="후보 출력만")
    parser.add_argument("--per-cat", type=int, default=MAX_NEW_PER_CAT)
    args = parser.parse_args()

    if not settings.KAKAO_CLIENT_ID:
        print("❌ ERROR: KAKAO_CLIENT_ID 미설정")
        sys.exit(1)

    print(f"🔍 카카오맵 카테고리 검색 (가천대 ±{SEARCH_RADIUS_M}m, FD6+CE7)")
    candidates = fetch_candidates()
    print(f"📊 후보 식당 (중복·기존 시드 제외): {len(candidates)}개")

    selected = select_balanced(candidates, per_cat=args.per_cat)
    cat_names = {1: "한식", 2: "양식", 3: "일식", 4: "중식", 5: "카페", 6: "술집", 7: "디저트", 8: "기타"}

    # 카테고리별 분포 출력
    by_cat: dict[int, list[dict]] = {}
    for c in selected:
        by_cat.setdefault(c["category_id"], []).append(c)

    print(f"\n✅ 선정 {len(selected)}곳 (카테고리당 최대 {args.per_cat}개):")
    for cat_id in sorted(by_cat):
        items = by_cat[cat_id]
        print(f"\n  [{cat_names[cat_id]}] {len(items)}곳:")
        for c in items:
            phone = c["phone"] or "전화 X"
            print(
                f"    {c['name']:30} ({c['distance_m']}m, {phone})"
                f" — {c['kakao_category']}"
            )

    if args.dry_run:
        print("\n✅ dry-run — 파일 생성 안 함.")
        return

    write_migration(selected)
    print(f"\n✅ 마이그레이션 파일 생성: {_MIGRATION_OUT.relative_to(_BACKEND_ROOT.parent)}")
    print("   적용: sudo mysql < database/migrations/2026-05-13_kakao_seed_restaurants.sql")


if __name__ == "__main__":
    main()
