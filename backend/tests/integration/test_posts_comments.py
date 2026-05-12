"""글/댓글/좋아요 골든 패스 + 알림 hook 검증."""
from __future__ import annotations

import uuid

import pytest


# ─────────────────────────── 보조 사용자 (다른 계정으로 댓글·좋아요) ───────────────────────────


@pytest.fixture(scope="module")
def second_user(client):
    """주 사용자와 다른 두 번째 사용자 (좋아요/댓글 알림 트리거용)."""
    ci = f"pytest_second_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/auth/cert-login",
        json={"ci": ci, "username": "pytest_second"},
    )
    assert resp.status_code == 200
    data = resp.json()
    return {
        "token": data["access_token"],
        "user_id": data["user_id"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


# ─────────────────────────── 식당 (글 작성 대상) ───────────────────────────


@pytest.fixture(scope="module")
def post_restaurant(client, auth_headers):
    """글 테스트용 식당."""
    name = f"pytest_post_rest_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/restaurants",
        headers=auth_headers,
        json={
            "name": name,
            "category_id": 1,
            "address": {
                "latitude": "37.45160",
                "longitude": "127.13060",
            },
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ─────────────────────────── 글 작성 ───────────────────────────


@pytest.fixture(scope="module")
def created_post(client, auth_headers, post_restaurant):
    title = f"pytest_post_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/posts",
        headers=auth_headers,
        json={
            "restaurant_id": post_restaurant["restaurant_id"],
            "title": title,
            "content": "pytest 테스트 본문입니다.",
            "hashtags": ["pytest_post_tag"],
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_post_created_with_owner_and_restaurant(created_post, auth_user_id, post_restaurant):
    assert created_post["post_id"] > 0
    assert created_post["author"]["user_id"] == auth_user_id
    assert created_post["restaurant"]["restaurant_id"] == post_restaurant["restaurant_id"]
    assert created_post["like_count"] == 0
    assert created_post["comment_count"] == 0
    assert created_post["is_liked"] is False


def test_get_post_detail(client, created_post):
    resp = client.get(f"/api/v1/posts/{created_post['post_id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["post_id"] == created_post["post_id"]
    assert "pytest_post_tag" in data["hashtags"]


def test_create_post_requires_auth(client, post_restaurant):
    resp = client.post(
        "/api/v1/posts",
        json={
            "restaurant_id": post_restaurant["restaurant_id"],
            "title": "no_auth",
            "content": "x",
        },
    )
    assert resp.status_code in (401, 403)


# ─────────────────────────── 댓글 ───────────────────────────


def test_create_and_list_comments(client, created_post, second_user):
    """두 번째 사용자가 댓글 작성 → 목록 반영."""
    post_id = created_post["post_id"]
    resp = client.post(
        f"/api/v1/posts/{post_id}/comments",
        headers=second_user["headers"],
        json={"content": "pytest 댓글입니다"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["content"] == "pytest 댓글입니다"
    assert body["author"]["user_id"] == second_user["user_id"]

    list_resp = client.get(f"/api/v1/posts/{post_id}/comments")
    assert list_resp.status_code == 200
    comments = list_resp.json()
    assert any(c["comment_id"] == body["comment_id"] for c in comments)


def test_comment_creates_notification_to_author(client, auth_headers, created_post, second_user):
    """다른 유저가 댓글 → 글 작성자에게 'comment' 알림 생성 hook 검증."""
    post_id = created_post["post_id"]
    # 새 댓글
    r = client.post(
        f"/api/v1/posts/{post_id}/comments",
        headers=second_user["headers"],
        json={"content": "알림 hook 검증 댓글"},
    )
    assert r.status_code == 201

    # 글 작성자의 알림 목록에 type=comment + related_id=post_id 가 있어야 함
    nresp = client.get(
        "/api/v1/notifications",
        headers=auth_headers,
        params={"limit": 50},
    )
    assert nresp.status_code == 200
    notes = nresp.json()
    has_comment_note = any(
        n["type"] == "comment" and n["related_id"] == post_id for n in notes
    )
    assert has_comment_note, f"comment 알림이 생성되지 않았습니다: {notes}"


# ─────────────────────────── 좋아요 + 알림 hook ───────────────────────────


def test_like_post_idempotent_and_creates_notification(
    client, auth_headers, created_post, second_user
):
    """다른 유저가 좋아요 → 좋아요 멱등 + 작성자 알림 hook."""
    post_id = created_post["post_id"]

    # 두 번째 사용자가 좋아요
    r1 = client.post(f"/api/v1/posts/{post_id}/like", headers=second_user["headers"])
    assert r1.status_code == 200, r1.text
    data1 = r1.json()
    assert data1["is_liked"] is True
    assert data1["like_count"] >= 1

    # 다시 좋아요 (멱등) — count 그대로
    r2 = client.post(f"/api/v1/posts/{post_id}/like", headers=second_user["headers"])
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2["like_count"] == data1["like_count"]

    # 작성자 알림에 like 가 있어야 함
    nresp = client.get(
        "/api/v1/notifications",
        headers=auth_headers,
        params={"limit": 100},
    )
    assert nresp.status_code == 200
    notes = nresp.json()
    assert any(
        n["type"] == "like" and n["related_id"] == post_id for n in notes
    ), "like 알림이 생성되지 않았습니다."


def test_unlike_post(client, second_user, created_post):
    post_id = created_post["post_id"]
    # 보장: 좋아요 누른 상태 만들기
    client.post(f"/api/v1/posts/{post_id}/like", headers=second_user["headers"])

    r = client.delete(f"/api/v1/posts/{post_id}/like", headers=second_user["headers"])
    assert r.status_code == 200
    data = r.json()
    assert data["is_liked"] is False
