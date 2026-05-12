"""메뉴 단독 라우터 (PUT, DELETE - id 직접 지정)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.menu import Menu
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.menu import MenuOut, MenuUpdate

router = APIRouter(prefix="/menus", tags=["menus"])


def _get_menu_and_restaurant(db: Session, menu_id: int) -> tuple[Menu, Restaurant]:
    menu = db.query(Menu).filter(Menu.menu_id == menu_id).first()
    if menu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="메뉴를 찾을 수 없습니다."
        )
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.restaurant_id == menu.restaurant_id)
        .first()
    )
    if restaurant is None:  # 데이터 불일치 (CASCADE가 있어서 거의 불가능)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="식당 데이터 불일치.",
        )
    return menu, restaurant


def _ensure_menu_owner(restaurant: Restaurant, user: User) -> None:
    if restaurant.registered_by is None:
        return
    if restaurant.registered_by != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="등록자만 수정/삭제할 수 있습니다.",
        )


@router.put("/{menu_id}", response_model=MenuOut, summary="메뉴 수정")
def update_menu(
    menu_id: int,
    body: MenuUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    menu, restaurant = _get_menu_and_restaurant(db, menu_id)
    _ensure_menu_owner(restaurant, current_user)

    if body.name is not None:
        menu.name = body.name
    if body.description is not None:
        menu.description = body.description
    if body.price is not None:
        menu.price = body.price
    if body.is_signature is not None:
        menu.is_signature = body.is_signature

    db.commit()
    db.refresh(menu)
    return menu


@router.delete(
    "/{menu_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="메뉴 삭제",
)
def delete_menu(
    menu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    menu, restaurant = _get_menu_and_restaurant(db, menu_id)
    _ensure_menu_owner(restaurant, current_user)
    db.delete(menu)
    db.commit()
