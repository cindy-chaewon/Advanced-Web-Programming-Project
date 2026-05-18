from __future__ import annotations
"""구글 OAuth + 사용자 정보 API 클라이언트."""
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

_HTTP_TIMEOUT = 10.0


async def exchange_code_for_token(
    code: str,
    redirect_uri: str | None = None,
) -> dict[str, Any]:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="서버에 GOOGLE_CLIENT_ID가 설정되어 있지 않습니다.",
        )

    payload = {
        "grant_type": "authorization_code",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri or settings.GOOGLE_REDIRECT_URI,
        "code": code,
    }

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.post(GOOGLE_TOKEN_URL, json=payload)

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"구글 토큰 발급 실패: {response.text}",
        )
    return response.json()


async def get_google_user_info(access_token: str) -> dict[str, Any]:
    """access_token으로 구글 사용자 프로필 조회.

    응답 예시:
        {
            "id": "1234567890",
            "email": "user@gmail.com",
            "name": "홍길동",
            "picture": "https://..."
        }
    """
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            GOOGLE_USER_INFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"구글 사용자 정보 조회 실패: {response.text}",
        )
    return response.json()
