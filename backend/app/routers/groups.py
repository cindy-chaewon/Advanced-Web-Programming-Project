"""그룹 라우터: CRUD + 멤버 관리 + 통합 지도 + 그룹원 글."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.post import Post
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupMemberInvite,
    GroupMemberOut,
    GroupOut,
    GroupUpdate,
)
from app.schemas.post import PostBrief
from app.schemas.restaurant import RestaurantBrief
from app.services.group_service import (
    add_member,
    is_member,
    is_owner,
    member_count,
    serialize_group,
)
from app.services.post_service import (
    post_query_with_relations,
    serialize_post_brief,
)
from app.services.restaurant_service import (
    restaurants_query_with_relations,
    serialize_brief,
)


router = APIRouter(prefix="/groups", tags=["groups"])


# ─────────────────────────── 헬퍼 ───────────────────────────


def _get_group_or_404(db: Session, group_id: int) -> Group:
    g = db.query(Group).filter(Group.group_id == group_id).first()
    if g is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="그룹을 찾을 수 없습니다.",
        )
    return g


def _ensure_member(db: Session, group_id: int, user_id: int) -> None:
    if not is_member(db, group_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="그룹 멤버만 접근 가능합니다.",
        )


def _ensure_owner(db: Session, group_id: int, user_id: int) -> None:
    if not is_owner(db, group_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="방장만 가능합니다.",
        )


def _member_user_ids(db: Session, group_id: int) -> list[int]:
    return [
        r[0]
        for r in db.query(GroupMember.user_id)
        .filter(GroupMember.group_id == group_id)
        .all()
    ]


# ─────────────────────────── 그룹 CRUD ───────────────────────────


@router.get("", response_model=list[GroupOut], summary="내 그룹 목록")
def list_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    groups = (
        db.query(Group)
        .join(GroupMember, GroupMember.group_id == Group.group_id)
        .filter(GroupMember.user_id == current_user.user_id)
        .order_by(Group.created_at.desc())
        .all()
    )
    return [
        GroupOut.model_validate(serialize_group(g, member_count(db, g.group_id)))
        for g in groups
    ]


@router.post(
    "",
    response_model=GroupOut,
    status_code=status.HTTP_201_CREATED,
    summary="그룹 생성 (방장 자동 등록, 초대 자동 알림)",
)
def create_group(
    body: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = Group(
        name=body.name,
        owner_id=current_user.user_id,
        color=body.color,
        icon=body.icon,
    )
    db.add(group)
    db.flush()

    # 방장을 멤버로 등록
    db.add(
        GroupMember(
            group_id=group.group_id,
            user_id=current_user.user_id,
            role="owner",
        )
    )
    db.flush()

    # 초대 멤버 추가 + 알림
    for uid in body.invite_user_ids:
        if uid == current_user.user_id:
            continue
        if not db.query(User.user_id).filter(User.user_id == uid).first():
            continue
        add_member(db, group_id=group.group_id, user_id=uid, role="member")

    db.commit()
    db.refresh(group)
    return GroupOut.model_validate(
        serialize_group(group, member_count(db, group.group_id))
    )


@router.get("/{group_id}", response_model=GroupOut, summary="그룹 상세 (멤버만)")
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    g = _get_group_or_404(db, group_id)
    _ensure_member(db, group_id, current_user.user_id)
    return GroupOut.model_validate(serialize_group(g, member_count(db, group_id)))


@router.put(
    "/{group_id}",
    response_model=GroupOut,
    summary="그룹 정보 수정 (방장만)",
)
def update_group(
    group_id: int,
    body: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    g = _get_group_or_404(db, group_id)
    _ensure_owner(db, group_id, current_user.user_id)

    if body.name is not None:
        g.name = body.name
    if body.color is not None:
        g.color = body.color
    if body.icon is not None:
        g.icon = body.icon

    db.commit()
    return GroupOut.model_validate(serialize_group(g, member_count(db, group_id)))


@router.delete(
    "/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="그룹 삭제 (방장만)",
)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    g = _get_group_or_404(db, group_id)
    _ensure_owner(db, group_id, current_user.user_id)
    db.delete(g)
    db.commit()


# ─────────────────────────── 멤버 ───────────────────────────


@router.get(
    "/{group_id}/members",
    response_model=list[GroupMemberOut],
    summary="그룹 멤버 목록",
)
def list_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_group_or_404(db, group_id)
    _ensure_member(db, group_id, current_user.user_id)

    rows = (
        db.query(GroupMember, User)
        .join(User, GroupMember.user_id == User.user_id)
        .filter(GroupMember.group_id == group_id)
        .order_by(GroupMember.joined_at)
        .all()
    )
    return [
        GroupMemberOut(
            user_id=u.user_id,
            username=u.username,
            profile_image=u.profile_image,
            role=gm.role,
            joined_at=gm.joined_at,
        )
        for gm, u in rows
    ]


@router.post(
    "/{group_id}/members",
    summary="멤버 초대 (방장만)",
)
def invite_members(
    group_id: int,
    body: GroupMemberInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_group_or_404(db, group_id)
    _ensure_owner(db, group_id, current_user.user_id)

    added: list[int] = []
    for uid in body.user_ids:
        if uid == current_user.user_id:
            continue
        if not db.query(User.user_id).filter(User.user_id == uid).first():
            continue
        if add_member(db, group_id=group_id, user_id=uid):
            added.append(uid)
    db.commit()
    return {"added_user_ids": added}


@router.delete(
    "/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="멤버 추방 (방장) 또는 본인 탈퇴",
)
def remove_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_group_or_404(db, group_id)

    if current_user.user_id == user_id:
        # 본인 탈퇴 — 방장이면 차단 (그룹 삭제하거나 owner 위임 필요)
        if is_owner(db, group_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="방장은 그룹을 탈퇴할 수 없습니다. 그룹을 삭제하거나 owner를 위임하세요.",
            )
    else:
        # 다른 멤버 추방 — 방장만 가능, 다른 owner는 추방 못함
        _ensure_owner(db, group_id, current_user.user_id)
        if is_owner(db, group_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="방장은 추방할 수 없습니다.",
            )

    deleted = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
        )
        .delete(synchronize_session=False)
    )
    if deleted == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="그룹 멤버가 아닙니다.",
        )
    db.commit()


# ─────────────────────────── 통합 지도 + 그룹원 글 ───────────────────────────


@router.get(
    "/{group_id}/restaurants",
    response_model=list[RestaurantBrief],
    summary="그룹 통합 지도 — 멤버들이 등록한 식당 모음",
)
def group_restaurants(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_group_or_404(db, group_id)
    _ensure_member(db, group_id, current_user.user_id)

    member_ids = _member_user_ids(db, group_id)
    if not member_ids:
        return []

    restaurants = (
        restaurants_query_with_relations(db)
        .filter(Restaurant.registered_by.in_(member_ids))
        .order_by(Restaurant.created_at.desc())
        .all()
    )
    return [RestaurantBrief.model_validate(serialize_brief(r)) for r in restaurants]


@router.get(
    "/{group_id}/posts",
    response_model=list[PostBrief],
    summary="그룹원들이 쓴 글 모음",
)
def group_posts(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_group_or_404(db, group_id)
    _ensure_member(db, group_id, current_user.user_id)

    member_ids = _member_user_ids(db, group_id)
    if not member_ids:
        return []

    posts = (
        post_query_with_relations(db)
        .filter(Post.user_id.in_(member_ids))
        .order_by(Post.created_at.desc())
        .all()
    )
    return [PostBrief.model_validate(serialize_post_brief(p)) for p in posts]
