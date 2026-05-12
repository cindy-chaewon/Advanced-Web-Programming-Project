"""`friend_service.compute_friend_statuses` 단위 테스트.

쿼리 로직이라 in-memory mock으로는 부족 → 실제 MySQL 세션 사용 (DB 통합형).
하지만 도메인 함수 자체의 입출력 검증만 하므로 unit 카테고리로 분류.
"""
from __future__ import annotations

import uuid

import pytest

from app.core.database import SessionLocal
from app.models.friend import Friend
from app.models.user import User
from app.services.friend_service import (
    compute_friend_statuses,
    find_friendship,
)


@pytest.fixture
def db_session():
    """테스트 종료 시 rollback."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture
def four_test_users(db_session):
    """4명의 테스트 사용자 — 종료 시 모두 삭제."""
    tag = uuid.uuid4().hex[:6]
    users = []
    for i in range(4):
        u = User(
            ci=f"pytest_friend_{tag}_{i}",
            username=f"pytest_friend_{tag}_{i}",
        )
        db_session.add(u)
        users.append(u)
    db_session.flush()
    for u in users:
        db_session.refresh(u)

    yield users

    # cleanup: 친구 관계도 cascade로 같이 삭제됨
    for u in users:
        db_session.delete(u)
    db_session.commit()


def test_empty_input_returns_empty(db_session):
    assert compute_friend_statuses(db_session, 1, []) == {}


def test_no_relations_all_none(db_session, four_test_users):
    me, a, b, _ = four_test_users
    result = compute_friend_statuses(
        db_session, me.user_id, [a.user_id, b.user_id]
    )
    assert result == {a.user_id: "none", b.user_id: "none"}


def test_self_is_self(db_session, four_test_users):
    me = four_test_users[0]
    result = compute_friend_statuses(db_session, me.user_id, [me.user_id])
    assert result == {me.user_id: "self"}


def test_pending_sent(db_session, four_test_users):
    me, a, _, _ = four_test_users
    # me → a 친구 요청
    db_session.add(Friend(user_id=me.user_id, friend_id=a.user_id, status="pending"))
    db_session.flush()

    result = compute_friend_statuses(db_session, me.user_id, [a.user_id])
    assert result == {a.user_id: "pending_sent"}


def test_pending_received(db_session, four_test_users):
    me, a, _, _ = four_test_users
    # a → me 친구 요청 (내가 받은 쪽)
    db_session.add(Friend(user_id=a.user_id, friend_id=me.user_id, status="pending"))
    db_session.flush()

    result = compute_friend_statuses(db_session, me.user_id, [a.user_id])
    assert result == {a.user_id: "pending_received"}


def test_accepted_friendship(db_session, four_test_users):
    me, a, _, _ = four_test_users
    db_session.add(
        Friend(user_id=me.user_id, friend_id=a.user_id, status="accepted")
    )
    db_session.flush()

    result = compute_friend_statuses(db_session, me.user_id, [a.user_id])
    assert result == {a.user_id: "accepted"}


def test_accepted_reverse_direction(db_session, four_test_users):
    # FRIENDS row가 (a, me)로 저장돼 있어도 me 입장에서 accepted 봐야 함
    me, a, _, _ = four_test_users
    db_session.add(
        Friend(user_id=a.user_id, friend_id=me.user_id, status="accepted")
    )
    db_session.flush()

    result = compute_friend_statuses(db_session, me.user_id, [a.user_id])
    assert result == {a.user_id: "accepted"}


def test_mixed_statuses(db_session, four_test_users):
    me, a, b, c = four_test_users
    # me → a accepted, b → me pending, c는 관계 없음
    db_session.add_all(
        [
            Friend(user_id=me.user_id, friend_id=a.user_id, status="accepted"),
            Friend(user_id=b.user_id, friend_id=me.user_id, status="pending"),
        ]
    )
    db_session.flush()

    result = compute_friend_statuses(
        db_session, me.user_id, [a.user_id, b.user_id, c.user_id, me.user_id]
    )
    assert result == {
        a.user_id: "accepted",
        b.user_id: "pending_received",
        c.user_id: "none",
        me.user_id: "self",
    }


def test_find_friendship_bidirectional(db_session, four_test_users):
    me, a, _, _ = four_test_users
    db_session.add(Friend(user_id=me.user_id, friend_id=a.user_id, status="accepted"))
    db_session.flush()

    # 양쪽 방향으로 모두 찾을 수 있어야 함
    f1 = find_friendship(db_session, me.user_id, a.user_id)
    f2 = find_friendship(db_session, a.user_id, me.user_id)
    assert f1 is not None
    assert f2 is not None
    assert (f1.user_id, f1.friend_id) == (f2.user_id, f2.friend_id)
