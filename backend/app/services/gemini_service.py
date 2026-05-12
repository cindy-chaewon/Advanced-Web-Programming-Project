"""Gemini API 호출 헬퍼.

- 모델: gemini-2.5-flash (2026-05 기준 안정 최신, 무료 tier 가용)
- 키: .env의 GEMINI_API_KEY
"""
import google.generativeai as genai
from fastapi import HTTPException, status

from app.core.config import settings


MODEL_NAME = "gemini-2.5-flash"

_configured = False


def _ensure_configured() -> None:
    global _configured
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY가 .env에 설정되지 않았습니다.",
        )
    if not _configured:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _configured = True


def _call_gemini(prompt: str) -> str:
    """Gemini 호출 + 안전 필터·빈 응답 처리."""
    _ensure_configured()
    model = genai.GenerativeModel(MODEL_NAME)
    try:
        resp = model.generate_content(prompt)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini 호출 실패: {exc}",
        ) from exc

    # 안전 필터 또는 빈 응답
    try:
        text = (resp.text or "").strip()
    except Exception:
        text = ""
    if not text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini가 응답을 생성하지 못했습니다 (안전 필터 또는 빈 응답).",
        )
    return text


def summarize_post(title: str | None, content: str) -> str:
    """블로그 글을 한국어 3줄로 요약."""
    prompt = f"""다음은 맛집 블로그 글이다. 한국어로 3줄 이내로 요약해줘.
각 줄은 50자 이내, 핵심 정보(맛/가격/분위기/추천 메뉴)에 집중.
줄바꿈으로 구분하고, 다른 설명은 붙이지 마.

제목: {title or "(제목 없음)"}

본문:
{content}

요약:"""
    return _call_gemini(prompt)


def review_summary(
    restaurant_name: str,
    review_texts: list[str],
    post_excerpts: list[str],
) -> str:
    """식당 리뷰·블로그를 종합한 AI 평."""
    reviews_block = "\n".join(f"- {t}" for t in review_texts) if review_texts else "(없음)"
    posts_block = "\n".join(f"- {t}" for t in post_excerpts) if post_excerpts else "(없음)"

    prompt = f""""{restaurant_name}" 식당에 대한 사용자 리뷰와 블로그 글이 아래에 있다.
이를 종합해 한국어로 3~4줄 식당 종합평을 작성해줘.
- 장점·단점을 균형있게 다룰 것
- 객관적이고 자연스러운 톤
- 마지막 줄은 "이런 분께 추천:" 형식으로 추천 대상 한 줄

[사용자 리뷰]
{reviews_block}

[블로그 글 요약]
{posts_block}

종합평:"""
    return _call_gemini(prompt)
