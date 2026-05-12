"""공용 fixture: TestClient + 인증 토큰."""
from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

import pytest

# backend/ 를 import path에 추가 (`tests/` 하위에서 `app.*` import 가능하도록)
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

# rate limiter가 테스트 중 영향 주지 않도록 환경변수로 비활성화 시도
os.environ.setdefault("PYTEST_RUNNING", "1")


@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient — 세션 전체에서 한 번만 생성."""
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def test_ci():
    """테스트 전용 CI (한 세션 내 고정 사용자)."""
    return f"pytest_user_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="session")
def auth_login(client, test_ci):
    """cert-login으로 발급된 (token, user_id) 튜플."""
    resp = client.post(
        "/api/v1/auth/cert-login",
        json={"ci": test_ci, "username": "pytest"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    return data["access_token"], data["user_id"]


@pytest.fixture(scope="session")
def auth_token(auth_login):
    return auth_login[0]


@pytest.fixture(scope="session")
def auth_user_id(auth_login):
    return auth_login[1]


@pytest.fixture(scope="session")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
