from __future__ import annotations
"""인증 관련 Pydantic 스키마."""
from pydantic import BaseModel, ConfigDict, Field, model_validator


class KakaoLogin(BaseModel):
    """카카오 로그인 요청.

    `code`: 백엔드가 토큰 교환을 수행 (서버사이드 OAuth).
    `access_token`: 프론트엔드 JS SDK로 이미 access_token을 받은 경우.
    둘 중 하나만 보내야 함.
    """

    code: str | None = Field(default=None, description="카카오 OAuth 인가 코드")
    access_token: str | None = Field(default=None, description="카카오 access_token (JS SDK)")
    redirect_uri: str | None = Field(
        default=None,
        description="`code` 발급 시 사용한 redirect URI (생략 시 서버 설정 사용)",
    )

    @model_validator(mode="after")
    def _check_either(self) -> "KakaoLogin":
        if not self.code and not self.access_token:
            raise ValueError("`code` 또는 `access_token` 중 하나는 필수입니다.")
        if self.code and self.access_token:
            raise ValueError("`code`와 `access_token`은 동시에 사용할 수 없습니다.")
        return self


class CertLoginRequest(BaseModel):
    """인증서 로그인 요청.

    학교 프로젝트 — 실제 인증서 검증은 클라이언트(또는 별도 인증 SDK)가 하고,
    백엔드는 CI/DI를 받아 식별자로 사용합니다.
    """

    ci: str = Field(..., min_length=4, max_length=88, description="인증서 CI (본인확인)")
    di: str | None = Field(default=None, max_length=64, description="중복가입 방지 식별값")
    username: str | None = Field(
        default=None,
        max_length=50,
        description="첫 가입 시 사용할 닉네임 (생략 시 자동 생성)",
    )
    email: str | None = Field(default=None, max_length=100, description="이메일 (선택)")


class TokenResponse(BaseModel):
    """JWT 발급 응답."""

    access_token: str = Field(..., description="자체 JWT")
    token_type: str = Field(default="bearer")
    user_id: int
    username: str
    profile_image: str | None = None
    is_new: bool = Field(default=False, description="첫 가입 여부")


class UserPublic(BaseModel):
    """공개용 사용자 정보."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    username: str
    email: str | None = None
    profile_image: str | None = None
