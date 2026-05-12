"""`scripts/fetch_kakao_restaurants._map_category` 단위 테스트.

카카오 category_name 문자열 → 우리 category_id (1~8) 매핑 규칙 검증.
1=한식, 2=양식, 3=일식, 4=중식, 5=카페, 6=술집, 7=디저트, 8=기타
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

# scripts/fetch_kakao_restaurants.py는 import 시점에 sys.path/os.chdir 변경 부수효과가 있어
# importlib.util.spec_from_file_location로 모듈 단위만 격리 로드.
_SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "fetch_kakao_restaurants.py"
)


@pytest.fixture(scope="module")
def map_category():
    """script 모듈을 격리 로드해 `_map_category`만 추출."""
    spec = importlib.util.spec_from_file_location(
        "fetch_kakao_restaurants_for_test", _SCRIPT_PATH
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    # import 시 working dir 변경 부수효과를 막기 위해 cwd 보존
    import os
    prev_cwd = os.getcwd()
    try:
        spec.loader.exec_module(module)
    finally:
        os.chdir(prev_cwd)
    return module._map_category


def test_empty_returns_none(map_category):
    assert map_category("") is None
    assert map_category(None) is None  # type: ignore[arg-type]


def test_only_one_part_returns_none_if_no_cafe(map_category):
    # "음식점" 하나만은 분류 불가
    assert map_category("음식점") is None


def test_one_part_with_cafe(map_category):
    # 1단계 카테고리에 "카페"가 포함되면 5(카페)
    assert map_category("카페") == 5


def test_korean(map_category):
    assert map_category("음식점 > 한식") == 1
    assert map_category("음식점 > 한식 > 백반/한정식") == 1


def test_bunsik_is_korean(map_category):
    # 분식은 한식으로 매핑
    assert map_category("음식점 > 분식") == 1


def test_western(map_category):
    assert map_category("음식점 > 양식") == 2
    assert map_category("음식점 > 패스트푸드") == 2
    assert map_category("음식점 > 아시아음식") == 2


def test_japanese(map_category):
    assert map_category("음식점 > 일식") == 3
    assert map_category("음식점 > 일식 > 초밥") == 3


def test_chinese(map_category):
    assert map_category("음식점 > 중식") == 4


def test_cafe(map_category):
    assert map_category("음식점 > 카페") == 5
    assert map_category("카페 > 테마카페") == 5


def test_dessert_via_cafe_branch(map_category):
    # 디저트카페/베이커리 - 카페 메인 아래 디저트 키워드면 7
    assert map_category("음식점 > 카페 > 디저트카페") == 7
    assert map_category("음식점 > 카페 > 베이커리") == 7


def test_pub(map_category):
    assert map_category("음식점 > 술집") == 6
    assert map_category("음식점 > 주점") == 6


def test_dessert_main(map_category):
    assert map_category("음식점 > 디저트") == 7
    assert map_category("음식점 > 베이커리") == 7


def test_unknown_falls_back_to_etc(map_category):
    # 매핑되지 않은 main 카테고리 → 8 (기타)
    assert map_category("음식점 > 무국적요리") == 8
