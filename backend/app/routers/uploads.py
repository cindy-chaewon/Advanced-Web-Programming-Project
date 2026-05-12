"""이미지 업로드 라우터."""
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile

from app.core.deps import get_current_user
from app.models.user import User
from app.services.image_service import save_uploaded_image


router = APIRouter(prefix="/upload", tags=["upload"])


@router.post(
    "/image",
    summary="이미지 업로드 (multipart) → URL 반환",
    description=(
        "프론트엔드 이미지 업로드 흐름:\n"
        "1. 이 엔드포인트에 multipart로 파일 전송 → `url` 반환\n"
        "2. 글/리뷰 작성 시 받은 URL을 `image_urls` 배열에 넣어 전송\n\n"
        "최대 크기 / 허용 확장자는 .env의 MAX_UPLOAD_SIZE 참조."
    ),
)
async def upload_image(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
):
    url, size = await save_uploaded_image(file)
    return {
        "url": url,
        "filename": Path(url).name,
        "size_bytes": size,
    }
