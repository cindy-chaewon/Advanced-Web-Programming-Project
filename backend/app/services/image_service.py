"""이미지 업로드 서비스 (로컬 파일시스템)."""
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings


ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
# PIL이 인식하는 format 이름 (대문자)
ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}
# 확장자 → 허용되는 PIL format 매핑 (확장자 spoof 방지)
EXT_TO_PIL_FORMAT = {
    ".jpg": {"JPEG"},
    ".jpeg": {"JPEG"},
    ".png": {"PNG"},
    ".webp": {"WEBP"},
    ".gif": {"GIF"},
}


def _ensure_upload_dir() -> Path:
    base = Path(settings.UPLOAD_DIR).resolve()
    base.mkdir(parents=True, exist_ok=True)
    return base


async def save_uploaded_image(file: UploadFile) -> tuple[str, int]:
    """업로드된 이미지를 `uploads/{YYYY}/{MM}/<uuid>.<ext>`에 저장.

    Returns:
        (public_url, size_bytes) — URL은 `/uploads/...` 형태
    """
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"지원하지 않는 이미지 타입: {file.content_type}",
        )

    raw_ext = Path(file.filename or "").suffix.lower()
    if raw_ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"지원하지 않는 확장자: {raw_ext or '(없음)'}",
        )

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"파일 크기가 최대치({settings.MAX_UPLOAD_SIZE} bytes)를 초과합니다.",
        )

    # PIL로 실제 이미지 검증 (mime/확장자 spoof 차단)
    try:
        img = Image.open(BytesIO(contents))
        img.verify()  # verify() 호출 후 img는 unusable — format만 사용
        pil_format = img.format
    except (UnidentifiedImageError, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효한 이미지 파일이 아닙니다.",
        )

    if pil_format not in ALLOWED_PIL_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"지원하지 않는 이미지 포맷: {pil_format}",
        )

    # 확장자와 실제 포맷이 일치하는지 확인 (예: .png인데 실제는 JPEG → 거부)
    expected_formats = EXT_TO_PIL_FORMAT.get(raw_ext, set())
    if pil_format not in expected_formats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"확장자({raw_ext})와 실제 이미지 포맷({pil_format})이 일치하지 않습니다.",
        )

    now = datetime.now(timezone.utc)
    base = _ensure_upload_dir()
    sub = base / f"{now.year:04d}" / f"{now.month:02d}"
    sub.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{raw_ext}"
    (sub / filename).write_bytes(contents)

    rel_url = f"/uploads/{now.year:04d}/{now.month:02d}/{filename}"
    return rel_url, len(contents)
