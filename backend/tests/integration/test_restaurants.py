"""식당 골든 패스: 목록(지도) / 검색 / 등록 / 상세 / 점수."""
from __future__ import annotations

import uuid

import pytest


# 가천대 글로벌캠퍼스 좌표
GACHON_LAT = 37.4516
GACHON_LNG = 127.1306


def test_list_nearby_restaurants_returns_seed_data(client):
    """반경 2km로 시드 식당이 한 곳 이상 잡혀야 함."""
    resp = client.get(
        "/api/v1/restaurants",
        params={"lat": GACHON_LAT, "lng": GACHON_LNG, "radius": 2000},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # 거리순 정렬 보장 (단조 증가)
    distances = [r.get("distance_meters") for r in data if r.get("distance_meters") is not None]
    assert distances == sorted(distances)


def test_list_nearby_requires_lat_lng(client):
    resp = client.get("/api/v1/restaurants")
    assert resp.status_code == 422


def test_search_restaurants_by_name(client):
    """시드에 있는 식당 일부 이름으로 검색."""
    resp = client.get("/api/v1/restaurants/search", params={"q": "라곰"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    # 데이터가 있을 수도 없을 수도 있지만 응답 구조는 항상 list


def test_search_restaurants_by_category(client):
    resp = client.get("/api/v1/restaurants/search", params={"category_id": 1})
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    for r in items:
        assert r["category"]["category_id"] == 1


def test_create_restaurant_requires_auth(client):
    resp = client.post(
        "/api/v1/restaurants",
        json={
            "name": "pytest_no_auth",
            "category_id": 1,
            "address": {"latitude": "37.45", "longitude": "127.13"},
        },
    )
    assert resp.status_code in (401, 403)


@pytest.fixture(scope="module")
def created_restaurant(client, auth_headers):
    """등록한 식당 — 모듈 내 여러 테스트가 공유."""
    name = f"pytest_restaurant_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/restaurants",
        headers=auth_headers,
        json={
            "name": name,
            "phone": "031-000-0000",
            "category_id": 1,
            "address": {
                "full_address": "경기도 성남시 수정구 pytest",
                "latitude": "37.45160",
                "longitude": "127.13060",
            },
            "hashtags": ["pytest_tag", "test_only"],
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_create_restaurant_returns_detail(created_restaurant):
    assert created_restaurant["restaurant_id"] > 0
    assert created_restaurant["name"].startswith("pytest_restaurant_")
    assert created_restaurant["category"]["category_id"] == 1
    assert "pytest_tag" in created_restaurant["hashtags"]


def test_get_created_restaurant_detail(client, created_restaurant):
    rid = created_restaurant["restaurant_id"]
    resp = client.get(f"/api/v1/restaurants/{rid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["restaurant_id"] == rid
    assert data["name"] == created_restaurant["name"]
    assert "score" in data


def test_get_score_returns_default_zero(client, created_restaurant):
    rid = created_restaurant["restaurant_id"]
    resp = client.get(f"/api/v1/restaurants/{rid}/score")
    assert resp.status_code == 200
    data = resp.json()
    # 리뷰/스크랩 없음 → 0
    assert data["review_count"] == 0
    assert data["scrap_count"] == 0
    assert data["total_score"] == 0.0


def test_get_nonexistent_restaurant_returns_404(client):
    resp = client.get("/api/v1/restaurants/99999999")
    assert resp.status_code == 404


def test_search_by_hashtag_finds_created(client, created_restaurant):
    resp = client.get("/api/v1/restaurants/search", params={"tag": "pytest_tag"})
    assert resp.status_code == 200
    ids = [r["restaurant_id"] for r in resp.json()]
    assert created_restaurant["restaurant_id"] in ids
