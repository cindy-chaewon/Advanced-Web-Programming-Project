"""인증 골든 패스: cert-login → JWT → /me."""
from __future__ import annotations

import uuid


def test_cert_login_creates_user_and_returns_token(client):
    ci = f"pytest_authflow_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/auth/cert-login",
        json={"ci": ci, "username": "pytest_authflow"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "access_token" in data and isinstance(data["access_token"], str)
    assert data["token_type"] == "bearer"
    assert isinstance(data["user_id"], int) and data["user_id"] > 0
    assert data["is_new"] is True


def test_cert_login_existing_user_returns_same_user(client):
    ci = f"pytest_authdup_{uuid.uuid4().hex[:8]}"
    r1 = client.post("/api/v1/auth/cert-login", json={"ci": ci, "username": "x"})
    assert r1.status_code == 200
    uid1 = r1.json()["user_id"]

    r2 = client.post("/api/v1/auth/cert-login", json={"ci": ci})
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2["user_id"] == uid1
    assert data2["is_new"] is False


def test_me_with_valid_token(client, auth_headers, auth_user_id):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["user_id"] == auth_user_id
    assert "username" in data


def test_me_without_token_is_unauthorized(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)


def test_me_with_invalid_token_is_unauthorized(client):
    resp = client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer not.a.real.jwt"}
    )
    assert resp.status_code == 401


def test_cert_login_missing_ci_rejected(client):
    resp = client.post("/api/v1/auth/cert-login", json={})
    assert resp.status_code == 422


def test_logout_returns_ok(client, auth_headers, auth_user_id):
    resp = client.post("/api/v1/auth/logout", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["user_id"] == auth_user_id
