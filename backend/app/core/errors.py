"""표준 에러 응답 핸들러.

API.md 명세:
    {"error": {"code": "...", "message": "...", ...}}

- HTTPException → HTTP_{status_code} (예: HTTP_404)
- RequestValidationError → VALIDATION_ERROR + fields[]
- 그 외 Exception → INTERNAL_ERROR (DEBUG=False에서만 wrap)

라우터가 `HTTPException(detail={"code": "RESTAURANT_NOT_FOUND", "message": "..."})`
형태로 던지면, 그 code/message를 그대로 사용한다.
"""
from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR


def _error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    **extras: Any,
) -> JSONResponse:
    body: dict[str, Any] = {"error": {"code": code, "message": message, **extras}}
    return JSONResponse(status_code=status_code, content=body)


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    detail = exc.detail
    # 라우터가 이미 {"code": "...", "message": "..."} 형식으로 던진 경우 그대로 사용
    if isinstance(detail, dict) and "code" in detail:
        extras = {k: v for k, v in detail.items() if k not in ("code", "message")}
        return _error_response(
            status_code=exc.status_code,
            code=str(detail["code"]),
            message=str(detail.get("message", "")),
            **extras,
        )
    return _error_response(
        status_code=exc.status_code,
        code=f"HTTP_{exc.status_code}",
        message=str(detail) if detail else "",
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    fields = [
        {
            "loc": [str(p) for p in e.get("loc", [])],
            "msg": e.get("msg", ""),
            "type": e.get("type", ""),
        }
        for e in exc.errors()
    ]
    return _error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="요청 본문이 유효하지 않습니다.",
        fields=fields,
    )


async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    return _error_response(
        status_code=HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_ERROR",
        message="internal server error",
    )
