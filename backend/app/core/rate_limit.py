"""Rate limiting (slowapi) - IP 기반.

기본 한도: 60/minute per IP
- AI 엔드포인트(`@limiter.limit("5/minute")`): Gemini quota 보호
- 인증 엔드포인트(`@limiter.limit("10/minute")`): 브루트포스 방지
"""
from slowapi import Limiter
from slowapi.util import get_remote_address


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
)
