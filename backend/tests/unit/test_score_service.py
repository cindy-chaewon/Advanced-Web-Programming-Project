"""`score_service.compute_total_score` 단위 테스트.

순수 함수이므로 DB 없이 동작.
공식:
    total = avg*14 + min(reviews, 50)*0.4 + min(scraps, 100)*0.1
    범위: 0 ~ 100, round(_, 1)
"""
from __future__ import annotations

import pytest

from app.services.score_service import compute_total_score


def test_zero_score():
    assert compute_total_score(0, 0, 0) == 0.0


def test_max_score_with_caps():
    # avg=5 → 70 / reviews=100 (cap 50) → 20 / scraps=200 (cap 100) → 10  ⇒ 100.0
    assert compute_total_score(5.0, 100, 200) == 100.0


def test_capped_at_100_for_extreme_inputs():
    # 어떠한 입력에서도 100을 넘으면 안 됨
    assert compute_total_score(5.0, 1000, 1000) <= 100.0
    assert compute_total_score(4.5, 9999, 9999) <= 100.0


def test_avg_only():
    # avg=4 → 4 * 14 = 56
    assert compute_total_score(4.0, 0, 0) == 56.0


def test_review_only_within_cap():
    # avg=0, reviews=30 → 30 * 0.4 = 12.0
    assert compute_total_score(0.0, 30, 0) == 12.0


def test_review_cap_applied():
    # reviews=50, 51, 100 모두 동일하게 20.0 기여
    a = compute_total_score(0.0, 50, 0)
    b = compute_total_score(0.0, 51, 0)
    c = compute_total_score(0.0, 100, 0)
    assert a == b == c == 20.0


def test_scrap_only_within_cap():
    # scraps=50 → 50 * 0.1 = 5.0
    assert compute_total_score(0.0, 0, 50) == 5.0


def test_scrap_cap_applied():
    # scraps=100, 101, 500 모두 동일하게 10.0 기여
    a = compute_total_score(0.0, 0, 100)
    b = compute_total_score(0.0, 0, 101)
    c = compute_total_score(0.0, 0, 500)
    assert a == b == c == 10.0


def test_none_inputs_treated_as_zero():
    # 시드/리뷰 없는 신규 식당 케이스 (None → 0)
    assert compute_total_score(None, None, None) == 0.0  # type: ignore[arg-type]


@pytest.mark.parametrize(
    "avg, reviews, scraps, expected",
    [
        (3.0, 10, 5, round(3 * 14 + 10 * 0.4 + 5 * 0.1, 1)),  # 46.5
        (4.5, 20, 30, round(4.5 * 14 + 20 * 0.4 + 30 * 0.1, 1)),  # 74.0
        (2.5, 5, 0, round(2.5 * 14 + 5 * 0.4, 1)),  # 37.0
    ],
)
def test_formula_matches_spec(avg, reviews, scraps, expected):
    assert compute_total_score(avg, reviews, scraps) == expected
