"""FastAPI 공용 의존성 (현재 로그인 사용자 등)."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import TokenError, decode_token
from app.models.user import User


bearer_scheme = HTTPBearer(auto_error=False)


def _credential_error(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """JWT 검증 후 USERS row 반환. 실패 시 401."""
    if credentials is None:
        raise _credential_error("Authorization 헤더가 필요합니다.")

    try:
        payload = decode_token(credentials.credentials)
    except TokenError as exc:
        raise _credential_error(f"유효하지 않은 토큰: {exc}") from exc

    raw_sub = payload.get("sub")
    if raw_sub is None:
        raise _credential_error("토큰에 sub 클레임이 없습니다.")
    try:
        user_id = int(raw_sub)
    except (TypeError, ValueError) as exc:
        raise _credential_error("sub 클레임 형식 오류.") from exc

    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise _credential_error("사용자를 찾을 수 없습니다.")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """로그인 사용자 있으면 반환, 없으면 None (선택적 인증용)."""
    if credentials is None:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
