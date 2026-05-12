"""FastAPI 애플리케이션 진입점."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.errors import (
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.rate_limit import limiter
from app.routers import (
    auth,
    categories,
    comments,
    friends,
    groups,
    hashtags,
    health,
    menus,
    notifications,
    posts,
    restaurants,
    reviews,
    search,
    uploads,
    users,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: 필요 시 초기화 (DB 핑, 캐시 등)
    yield
    # shutdown: 정리 작업


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Hi-Five — 지도 기반 맛집 리뷰 블로그 커뮤니티 API",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# ── Rate limit (IP 기반, slowapi) ──
# 기본 60/minute per IP. AI/auth는 라우터 데코레이터로 더 엄격하게.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# ── 표준 에러 응답 핸들러 (API.md: {"error": {"code","message"}}) ──
# slowapi의 RateLimitExceeded 핸들러는 위에서 별도 등록됨 (덮어쓰지 않음).
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
# DEBUG=False(운영)에서만 일반 Exception을 500으로 wrap.
# DEBUG=True(개발)에서는 FastAPI 기본 traceback이 보이도록 둔다.
if not settings.DEBUG:
    app.add_exception_handler(Exception, generic_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 이미지 정적 파일 서빙 (POST /upload/image → /uploads/... 접근) ──
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads",
)


# ── 헬스체크 & 루트 ──
app.include_router(health.router)


# ── /api/v1 라우터 등록 ──
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(categories.router, prefix=settings.API_V1_PREFIX)
app.include_router(restaurants.router, prefix=settings.API_V1_PREFIX)
app.include_router(menus.router, prefix=settings.API_V1_PREFIX)
app.include_router(posts.router, prefix=settings.API_V1_PREFIX)
app.include_router(reviews.router, prefix=settings.API_V1_PREFIX)
app.include_router(uploads.router, prefix=settings.API_V1_PREFIX)
app.include_router(friends.router, prefix=settings.API_V1_PREFIX)
app.include_router(groups.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(hashtags.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)
app.include_router(comments.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": app.version,
        "docs": f"{settings.API_V1_PREFIX}/docs",
    }
