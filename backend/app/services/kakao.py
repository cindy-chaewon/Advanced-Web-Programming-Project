from __future__ import annotations
"""카카오 OAuth + 사용자 정보 API 클라이언트."""
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me"
KAKAO_LOGOUT_URL = "https://kapi.kakao.com/v1/user/logout"

_HTTP_TIMEOUT = 10.0


async def exchange_code_for_token(
    code: str,
    redirect_uri: str | None = None,
) -> dict[str, Any]:
    """카카오 인가 코드를 access_token으로 교환.

    참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#request-token
    """
    if not settings.KAKAO_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="서버에 KAKAO_CLIENT_ID가 설정되어 있지 않습니다.",
        )

    payload: dict[str, str] = {
        "grant_type": "authorization_code",
        "client_id": settings.KAKAO_CLIENT_ID,
        "redirect_uri": redirect_uri or settings.KAKAO_REDIRECT_URI,
        "code": code,
    }
    if settings.KAKAO_CLIENT_SECRET:
        payload["client_secret"] = settings.KAKAO_CLIENT_SECRET

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.post(
            KAKAO_TOKEN_URL,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"카카오 토큰 발급 실패: {response.text}",
        )
    return response.json()


async def get_kakao_user_info(access_token: str) -> dict[str, Any]:
    """access_token으로 카카오 사용자 프로필 조회.

    응답 예시:
        {
            "id": 1234567890,
            "properties": {"nickname": "...", "profile_image": "..."},
            "kakao_account": {
                "email": "...",
                "profile": {"nickname": "...", "profile_image_url": "..."}
            }
        }
    """
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            KAKAO_USER_INFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"카카오 사용자 정보 조회 실패: {response.text}",
        )
    return response.json()


async def kakao_logout(access_token: str) -> None:
    """카카오 측 세션 만료 (best-effort, 실패해도 무시)."""
    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            await client.post(
                KAKAO_LOGOUT_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
    except httpx.HTTPError:
        pass
