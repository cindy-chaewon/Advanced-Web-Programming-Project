"""인증 라우터: 카카오 OAuth + 인증서 로그인 + 로그아웃."""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.rate_limit import limiter
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import (
    CertLoginRequest,
    KakaoLogin,
    TokenResponse,
    UserPublic,
)
from app.services.auth_service import (
    get_or_create_cert_user,
    get_or_create_kakao_user,
)
from app.services.kakao import (
    exchange_code_for_token,
    get_kakao_user_info,
)


router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_token(user: User, is_new: bool) -> TokenResponse:
    """User → JWT 발급 헬퍼."""
    token = create_access_token(subject=user.user_id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.user_id,
        username=user.username,
        profile_image=user.profile_image,
        is_new=is_new,
    )


# ─────────────────────────── 카카오 OAuth ───────────────────────────


@router.post(
    "/kakao",
    response_model=TokenResponse,
    summary="카카오 로그인 (code 또는 access_token)",
    description=(
        "두 가지 방식 지원:\n"
        "- `code`: 백엔드가 카카오 토큰 엔드포인트와 통신 (server-side)\n"
        "- `access_token`: 프론트 JS SDK로 이미 받은 토큰을 검증 (client-side)\n\n"
        "신규 사용자는 자동 가입되며, 응답의 `is_new=true`로 식별 가능.\n"
        "Rate limit: 10/minute per IP (브루트포스 방지)."
    ),
)
@limiter.limit("10/minute")
async def kakao_login(request: Request, body: KakaoLogin, db: Session = Depends(get_db)):
    if body.access_token:
        kakao_token = body.access_token
    else:
        token_data = await exchange_code_for_token(
            code=body.code,  # type: ignore[arg-type]
            redirect_uri=body.redirect_uri,
        )
        kakao_token = token_data.get("access_token")
        if not kakao_token:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="카카오에서 access_token을 받지 못했습니다.",
            )

    kakao_profile = await get_kakao_user_info(kakao_token)
    user, is_new = get_or_create_kakao_user(db, kakao_profile)
    return _issue_token(user, is_new=is_new)


@router.get(
    "/kakao/callback",
    summary="카카오 OAuth 콜백 (백엔드 redirect_uri 패턴)",
    description=(
        "카카오 인증 페이지의 redirect_uri를 백엔드로 설정한 경우 사용.\n"
        "코드 → 토큰 교환 후 프론트엔드로 JWT를 쿼리에 담아 리다이렉트."
    ),
)
async def kakao_callback(
    code: str = Query(..., description="카카오에서 전달한 인가 코드"),
    state: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    token_data = await exchange_code_for_token(code=code)
    kakao_token = token_data.get("access_token")
    if not kakao_token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="카카오에서 access_token을 받지 못했습니다.",
        )

    kakao_profile = await get_kakao_user_info(kakao_token)
    user, is_new = get_or_create_kakao_user(db, kakao_profile)
    jwt_token = create_access_token(subject=user.user_id)

    # 프론트엔드 콜백 페이지로 리다이렉트.
    # ⚠️ URL 쿼리에 토큰을 노출하므로 운영 환경에서는 더 안전한 방식을 권장 (httponly 쿠키 등).
    frontend_origin = settings.cors_origins_list[0] if settings.cors_origins_list else "http://localhost:3000"
    redirect_url = (
        f"{frontend_origin}/auth/callback?token={jwt_token}"
        f"&is_new={'true' if is_new else 'false'}"
    )
    if state:
        redirect_url += f"&state={state}"
    return RedirectResponse(url=redirect_url)


# ─────────────────────────── 인증서 로그인 ───────────────────────────


@router.post(
    "/cert-login",
    response_model=TokenResponse,
    summary="인증서 로그인 (CI/DI 기반)",
    description=(
        "프론트(또는 별도 인증 SDK)에서 본인확인을 거친 후 CI/DI를 백엔드로 전송.\n"
        "동일 CI가 이미 있으면 로그인, 없으면 신규 가입.\n"
        "Rate limit: 10/minute per IP (브루트포스 방지)."
    ),
)
@limiter.limit("10/minute")
def cert_login(request: Request, body: CertLoginRequest, db: Session = Depends(get_db)):
    user, is_new = get_or_create_cert_user(
        db=db,
        ci=body.ci,
        di=body.di,
        username=body.username,
        email=body.email,
    )
    return _issue_token(user, is_new=is_new)


# ─────────────────────────── 로그아웃 / 현재 사용자 ───────────────────────────


@router.post(
    "/logout",
    summary="로그아웃 (클라이언트가 토큰 폐기)",
    description=(
        "JWT는 stateless이므로 서버 측 무효화는 하지 않습니다.\n"
        "클라이언트가 저장된 토큰을 삭제해야 합니다."
    ),
)
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "로그아웃되었습니다.", "user_id": current_user.user_id}


@router.get(
    "/me",
    response_model=UserPublic,
    summary="현재 로그인 사용자 정보 (JWT 검증용)",
)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user
