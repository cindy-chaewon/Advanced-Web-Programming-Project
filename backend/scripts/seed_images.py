"""시드 식당과 시드 글에 카테고리별 placeholder 이미지를 채운다.

사용법 (backend/ 디렉토리에서):
    .venv/bin/python scripts/seed_images.py

수행 작업:
1. PIL로 카테고리 8개의 400x300 단색 PNG를 backend/uploads/seed/ 에 생성
2. 모든 RESTAURANTS.thumbnail_url 을 카테고리에 맞는 이미지 URL로 채움
   (이미 채워진 행은 덮어쓰지 않음 — None인 행만)
3. 모든 POSTS.thumbnail_url 을 식당 카테고리 이미지로 채움 (None인 행만)
4. 시드 글 일부(101, 103, 105, 109)에 IMAGES 행 2장씩 추가 (없을 때만)
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image as PILImage, ImageDraw, ImageFont

_THIS = Path(__file__).resolve()
_BACKEND_ROOT = _THIS.parents[1]
sys.path.insert(0, str(_BACKEND_ROOT))
os.chdir(_BACKEND_ROOT)

from app.core.database import SessionLocal  # noqa: E402
from app.models.category import Category  # noqa: E402
from app.models.image import Image as ImageModel  # noqa: E402
from app.models.post import Post  # noqa: E402
from app.models.restaurant import Restaurant  # noqa: E402

UPLOAD_DIR = _BACKEND_ROOT / "uploads"
SEED_DIR = UPLOAD_DIR / "seed"

# 카테고리 ID → (영문 슬러그, RGB 색상, 한글 라벨)
CATEGORY_IMAGES: dict[int, tuple[str, tuple[int, int, int], str]] = {
    1: ("korean",   (217,  83,  79), "한식"),     # 빨강
    2: ("western",  (240, 173,  78), "양식"),     # 주황
    3: ("japanese", (240, 153, 175), "일식"),     # 분홍
    4: ("chinese",  (142,  68, 173), "중식"),     # 보라
    5: ("cafe",     (139,  90,  43), "카페"),     # 브라운
    6: ("bar",      ( 68,  46,  95), "술집"),     # 어두운 보라
    7: ("dessert",  (160, 217, 117), "디저트"),    # 연두
    8: ("etc",      (149, 165, 166), "기타"),     # 회색
}

IMG_W, IMG_H = 400, 300


def _load_font(size: int) -> ImageFont.ImageFont:
    """가능하면 한글 지원 폰트, 아니면 기본 폰트."""
    candidates = [
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def generate_placeholders() -> list[Path]:
    """카테고리별 PNG 8개 생성."""
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    created: list[Path] = []
    font_large = _load_font(64)
    font_small = _load_font(28)

    for cat_id, (slug, rgb, label) in CATEGORY_IMAGES.items():
        out = SEED_DIR / f"{slug}.png"
        img = PILImage.new("RGB", (IMG_W, IMG_H), rgb)
        draw = ImageDraw.Draw(img)

        # 살짝 어두운 하단 띠 (카드 느낌)
        band_h = 60
        darker = tuple(max(0, int(c * 0.78)) for c in rgb)
        draw.rectangle([(0, IMG_H - band_h), (IMG_W, IMG_H)], fill=darker)

        # 중앙 한글 라벨
        try:
            bbox = draw.textbbox((0, 0), label, font=font_large)
            tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        except Exception:
            tw, th = font_large.getsize(label) if hasattr(font_large, "getsize") else (120, 60)
        draw.text(
            ((IMG_W - tw) / 2, (IMG_H - band_h - th) / 2 - 10),
            label,
            fill=(255, 255, 255),
            font=font_large,
        )

        # 하단 영문 슬러그
        try:
            bbox2 = draw.textbbox((0, 0), slug.upper(), font=font_small)
            sw = bbox2[2] - bbox2[0]
            sh = bbox2[3] - bbox2[1]
        except Exception:
            sw, sh = 60, 20
        draw.text(
            ((IMG_W - sw) / 2, IMG_H - band_h + (band_h - sh) / 2 - 4),
            slug.upper(),
            fill=(255, 255, 255),
            font=font_small,
        )

        img.save(out, format="PNG", optimize=True)
        created.append(out)
    return created


def url_for(cat_id: int) -> str:
    slug = CATEGORY_IMAGES[cat_id][0]
    return f"/uploads/seed/{slug}.png"


def main() -> None:
    print("[1/4] Placeholder PNG 생성 중…")
    created = generate_placeholders()
    for p in created:
        print(f"    - {p.relative_to(_BACKEND_ROOT)}")
    print(f"    총 {len(created)}개 생성")

    db = SessionLocal()
    try:
        # 2) RESTAURANTS.thumbnail_url 채우기
        print("[2/4] RESTAURANTS.thumbnail_url 채우는 중…")
        rest_updated = 0
        for r in db.query(Restaurant).all():
            if r.thumbnail_url:
                continue
            cat = r.category_id if r.category_id in CATEGORY_IMAGES else 8
            r.thumbnail_url = url_for(cat)
            rest_updated += 1
        print(f"    RESTAURANTS updated: {rest_updated}")

        # 3) POSTS.thumbnail_url 채우기
        print("[3/4] POSTS.thumbnail_url 채우는 중…")
        post_updated = 0
        for p in db.query(Post).all():
            if p.thumbnail_url:
                continue
            cat = 8
            if p.restaurant_id:
                rest = db.get(Restaurant, p.restaurant_id)
                if rest and rest.category_id in CATEGORY_IMAGES:
                    cat = rest.category_id
            p.thumbnail_url = url_for(cat)
            post_updated += 1
        print(f"    POSTS updated: {post_updated}")

        # 4) 시드 글 일부에 IMAGES 2장씩 추가
        print("[4/4] IMAGES 시드 추가 중…")
        target_post_ids = [101, 103, 105, 109]
        images_added = 0
        for pid in target_post_ids:
            post = db.get(Post, pid)
            if post is None:
                continue
            existing = (
                db.query(ImageModel).filter(ImageModel.post_id == pid).count()
            )
            if existing > 0:
                continue
            cat = 8
            if post.restaurant_id:
                rest = db.get(Restaurant, post.restaurant_id)
                if rest and rest.category_id in CATEGORY_IMAGES:
                    cat = rest.category_id
            primary = url_for(cat)
            # 두 번째 이미지는 "기타" placeholder 로 변주 (단일 컬러 갤러리 느낌)
            secondary = url_for(8)
            db.add(ImageModel(url=primary, post_id=pid))
            db.add(ImageModel(url=secondary, post_id=pid))
            images_added += 2
        print(f"    IMAGES inserted: {images_added}")

        db.commit()
        print("DONE — commit 완료")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
