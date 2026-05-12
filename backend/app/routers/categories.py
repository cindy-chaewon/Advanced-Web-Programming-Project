"""카테고리 라우터."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.schemas.restaurant import CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut], summary="전체 카테고리 목록")
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.category_id).all()
