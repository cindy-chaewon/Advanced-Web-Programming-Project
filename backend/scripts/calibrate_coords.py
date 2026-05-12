"""카카오맵 키워드 검색으로 시드 식당(ID 100~199) 좌표를 정확화.

사용법 (backend/ 디렉토리에서):
    .venv/bin/python scripts/calibrate_coords.py             # DB 적용 + SQL 파일 export
    .venv/bin/python scripts/calibrate_coords.py --dry-run   # 검색만, 변경 없음
    .venv/bin/python scripts/calibrate_coords.py --max-distance 3000  # 5km → 3km 컷

흐름:
1. ADDRESSES JOIN RESTAURANTS (시드 범위)
2. 식당 이름으로 카카오 로컬 키워드 검색 (가천대 기준 거리순)
3. 첫 결과의 (x=lng, y=lat) 추출
4. 가천대에서 max_distance 미만이면 채택 (오인 매칭 방지)
5. DB 적용 + `database/migrations/2026-05-12_calibrated_coords.sql` 자동 생성
"""
from __future__ import annotations

import argparse
import os
import sys
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

import httpx

# backend 루트를 import path에 추가
_THIS = Path(__file__).resolve()
_BACKEND_ROOT = _THIS.parents[1]
sys.path.insert(0, str(_BACKEND_ROOT))

# .env 위치 보장 (스크립트가 다른 cwd에서 실행돼도 OK)
os.chdir(_BACKEND_ROOT)

from sqlalchemy import update  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.models.address import Address  # noqa: E402
from app.models.restaurant import Restaurant  # noqa: E402


KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"
GACHON_LAT = 37.4516
GACHON_LNG = 127.1306

# 시드 마이그레이션 파일 출력 위치
_MIGRATION_OUT = (
    _BACKEND_ROOT.parent / "database" / "migrations" / "2026-05-12_calibrated_coords.sql"
)


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r1, n1, r2, n2 = map(radians, (lat1, lng1, lat2, lng2))
    a = sin((r2 - r1) / 2) ** 2 + cos(r1) * cos(r2) * sin((n2 - n1) / 2) ** 2
    return 2 * 6_371_000 * asin(sqrt(a))


def _kakao_query(query: str, ref_lat: float, ref_lng: float, radius_m: int) -> list[dict]:
    headers = {"Authorization": f"KakaoAK {settings.KAKAO_CLIENT_ID}"}
    params = {
        "query": query,
        "x": str(ref_lng),
        "y": str(ref_lat),
        "radius": radius_m,
        "sort": "distance",
        "size": 5,
    }
    resp = httpx.get(KAKAO_KEYWORD_URL, headers=headers, params=params, timeout=10.0)
    resp.raise_for_status()
    return resp.json().get("documents", [])


def _is_food_category(category_name: str) -> bool:
    """카카오 category_name에 '음식점' 또는 '카페'가 들어가면 음식 카테고리."""
    if not category_name:
        return False
    return "음식점" in category_name or "카페" in category_name


def _search_place(name: str, ref_lat: float, ref_lng: float, radius_m: int = 5000) -> dict | None:
    """음식점 카테고리 결과를 우선 반환.

    검색 순서:
    1. "{name} 가천대" — 가천대 한정 시도
    2. "{name} 복정" — 복정역 권역
    3. "{name}" — 원본 이름만
    각 검색에서 카카오 category_name에 '음식점' 또는 '카페'가 포함된 결과만 채택.
    """
    queries = [f"{name} 가천대", f"{name} 복정", name]
    for q in queries:
        try:
            docs = _kakao_query(q, ref_lat, ref_lng, radius_m)
        except httpx.HTTPError:
            continue
        for doc in docs:
            if _is_food_category(doc.get("category_name", "")):
                return doc
        # 카테고리 매칭 실패 시 다음 쿼리로
    # 마지막 시도: 카테고리 무시하고 원본 검색 첫 결과
    try:
        docs = _kakao_query(name, ref_lat, ref_lng, radius_m)
        return docs[0] if docs else None
    except httpx.HTTPError:
        return None


def _write_migration_sql(updates: list[tuple]) -> None:
    """결과를 idempotent SQL 마이그레이션으로 저장."""
    lines = [
        "-- =============================================================",
        "-- Auto-generated: 카카오맵 키워드 검색 기반 시드 좌표 보정",
        "-- 출처: scripts/calibrate_coords.py 실행 결과",
        "-- 적용: sudo mysql < database/migrations/2026-05-12_calibrated_coords.sql",
        "-- =============================================================",
        "USE mapweb;",
        "",
    ]
    for addr_id, name, _, _, new_lat, new_lng, place_name in updates:
        lines.append(
            f"UPDATE ADDRESSES SET latitude={new_lat:.7f}, longitude={new_lng:.7f} "
            f"WHERE address_id={addr_id};  -- {name} → {place_name}"
        )
    _MIGRATION_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="시드 식당 좌표를 카카오맵으로 보정")
    parser.add_argument("--dry-run", action="store_true", help="검색만, DB/파일 변경 없음")
    parser.add_argument(
        "--max-distance",
        type=int,
        default=5000,
        help="가천대(기준점)에서 이 거리 초과 결과는 오인 매칭으로 보고 무시 (기본 5000m)",
    )
    parser.add_argument(
        "--max-shift",
        type=int,
        default=2500,
        help="원래 좌표 대비 이 거리 초과 이동은 의심으로 보고 무시 (기본 2500m)",
    )
    args = parser.parse_args()

    if not settings.KAKAO_CLIENT_ID:
        print("❌ ERROR: .env의 KAKAO_CLIENT_ID가 비어있습니다.", file=sys.stderr)
        sys.exit(1)

    db: Session = SessionLocal()
    try:
        rows = (
            db.query(Restaurant, Address)
            .join(Address, Restaurant.address_id == Address.address_id)
            .filter(Restaurant.restaurant_id.between(100, 199))
            .order_by(Restaurant.restaurant_id)
            .all()
        )
        if not rows:
            print("⚠️ 시드 식당이 없습니다 (ID 100~199).")
            return

        print(f"🔍 시드 식당 {len(rows)}곳 좌표 보정 시작 (가천대 ±{args.max_distance}m)\n")

        updates: list[tuple] = []
        skipped = 0
        for r, a in rows:
            old_lat = float(a.latitude)
            old_lng = float(a.longitude)
            try:
                hit = _search_place(r.name, GACHON_LAT, GACHON_LNG, radius_m=args.max_distance)
            except httpx.HTTPError as exc:
                print(f"[{r.restaurant_id}] {r.name}  ❌ HTTP 에러: {exc}")
                skipped += 1
                continue

            if hit is None:
                print(f"[{r.restaurant_id}] {r.name:25} ❌ 검색 결과 없음")
                skipped += 1
                continue

            place_name = hit.get("place_name", "?")
            new_lat = float(hit["y"])
            new_lng = float(hit["x"])
            dist_from_gachon = _haversine(GACHON_LAT, GACHON_LNG, new_lat, new_lng)
            if dist_from_gachon > args.max_distance:
                print(
                    f"[{r.restaurant_id}] {r.name:25} ⚠️  가천대에서 {dist_from_gachon:.0f}m"
                    f" (한도 {args.max_distance}m) — skip"
                )
                skipped += 1
                continue

            shift_m = _haversine(old_lat, old_lng, new_lat, new_lng)
            if shift_m > args.max_shift:
                print(
                    f"[{r.restaurant_id}] {r.name:25} ⚠️  shift {shift_m:.0f}m > 한도({args.max_shift}m)"
                    f" — {place_name} skip"
                )
                skipped += 1
                continue
            print(
                f"[{r.restaurant_id}] {r.name:25} → {place_name}  "
                f"({new_lat:.5f}, {new_lng:.5f}) shift={shift_m:.0f}m"
            )
            updates.append((a.address_id, r.name, old_lat, old_lng, new_lat, new_lng, place_name))

        print(f"\n📊 결과: 매칭 {len(updates)}곳 / 스킵 {skipped}곳")

        if args.dry_run:
            print("✅ dry-run 모드 — DB/파일 변경 안 함.")
            return

        if not updates:
            print("⚠️ 적용할 변경 없음.")
            return

        for addr_id, _, _, _, new_lat, new_lng, _ in updates:
            db.execute(
                update(Address)
                .where(Address.address_id == addr_id)
                .values(latitude=new_lat, longitude=new_lng)
            )
        db.commit()
        print(f"\n✅ DB ADDRESSES 갱신: {len(updates)}곳")

        _write_migration_sql(updates)
        print(f"✅ 마이그레이션 SQL 저장: {_MIGRATION_OUT.relative_to(_BACKEND_ROOT.parent)}")
        print("   → seed.sql 다시 적용 후엔 이 파일도 실행해 좌표 보정 유지.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
