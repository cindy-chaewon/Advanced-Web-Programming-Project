from __future__ import annotations
"""인증 비즈니스 로직: 사용자 조회/생성 + 알림 설정 초기화."""
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.notification_setting import NotificationSetting
from app.models.user import User


# 소셜 로그인 사용자의 USERS.ci prefix (인증서 CI와 충돌 방지).
KAKAO_CI_PREFIX = "kakao:"
GOOGLE_CI_PREFIX = "google:"


def _ensure_notification_settings(db: Session, user_id: int) -> None:
    """사용자에게 알림 설정 row가 없으면 기본값으로 생성."""
    exists = (
        db.query(NotificationSetting)
        .filter(NotificationSetting.user_id == user_id)
        .first()
    )
    if exists is None:
        db.add(NotificationSetting(user_id=user_id))


def find_kakao_user(db: Session, kakao_id: str | int) -> User | None:
    return (
        db.query(User)
        .filter(User.ci == f"{KAKAO_CI_PREFIX}{kakao_id}")
        .first()
    )


def get_or_create_kakao_user(
    db: Session,
    kakao_profile: dict[str, Any],
) -> tuple[User, bool]:
    """카카오 프로필로 사용자 찾거나 신규 가입.

    returns: (user, is_new)
    """
    kakao_id_raw = kakao_profile.get("id")
    if kakao_id_raw is None:
        raise ValueError("카카오 응답에 `id`가 없습니다.")
    kakao_id = str(kakao_id_raw)

    account: dict[str, Any] = kakao_profile.get("kakao_account") or {}
    profile: dict[str, Any] = account.get("profile") or {}
    properties: dict[str, Any] = kakao_profile.get("properties") or {}

    email: str | None = account.get("email")
    nickname: str = (
        profile.get("nickname")
        or properties.get("nickname")
        or f"kakao_{kakao_id[:8]}"
    )
    profile_image: str | None = (
        profile.get("profile_image_url")
        or properties.get("profile_image")
    )

    ci_value = f"{KAKAO_CI_PREFIX}{kakao_id}"

    user = db.query(User).filter(User.ci == ci_value).first()
    if user is not None:
        # 기존 사용자: 빈 프로필 필드만 보충 (사용자가 수정한 값은 보존).
        changed = False
        if email and not user.email:
            user.email = email
            changed = True
        if profile_image and not user.profile_image:
            user.profile_image = profile_image
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
        return user, False

    # 신규 가입
    user = User(
        username=nickname[:50],
        email=email,
        ci=ci_value,
        di=None,
        profile_image=profile_image,
        verified_at=func.now(),
    )
    db.add(user)
    db.flush()  # user_id 확보
    _ensure_notification_settings(db, user.user_id)
    db.commit()
    db.refresh(user)
    return user, True


def get_or_create_google_user(
    db: Session,
    google_profile: dict[str, Any],
) -> tuple[User, bool]:
    google_id = str(google_profile.get("id", ""))
    if not google_id:
        raise ValueError("구글 응답에 `id`가 없습니다.")

    email: str | None = google_profile.get("email")
    nickname: str = google_profile.get("name") or f"google_{google_id[:8]}"
    profile_image: str | None = google_profile.get("picture")

    ci_value = f"{GOOGLE_CI_PREFIX}{google_id}"

    user = db.query(User).filter(User.ci == ci_value).first()
    if user is not None:
        changed = False
        if email and not user.email:
            user.email = email
            changed = True
        if profile_image and not user.profile_image:
            user.profile_image = profile_image
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
        return user, False

    user = User(
        username=nickname[:50],
        email=email,
        ci=ci_value,
        di=None,
        profile_image=profile_image,
        verified_at=func.now(),
    )
    db.add(user)
    db.flush()
    _ensure_notification_settings(db, user.user_id)
    db.commit()
    db.refresh(user)
    return user, True


def get_or_create_cert_user(
    db: Session,
    ci: str,
    di: str | None,
    username: str | None,
    email: str | None,
) -> tuple[User, bool]:
    """인증서 CI로 사용자 찾거나 신규 가입.

    카카오 사용자와 구분하기 위해 ci 값에 prefix 없이 그대로 저장.
    (카카오 CI는 `kakao:` prefix이므로 자연스럽게 분리됨.)
    """
    user = db.query(User).filter(User.ci == ci).first()
    if user is not None:
        # 빈 필드만 보충
        changed = False
        if di and not user.di:
            user.di = di
            changed = True
        if email and not user.email:
            user.email = email
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
        return user, False

    final_username = (username or f"user_{ci[:8]}")[:50]
    user = User(
        username=final_username,
        email=email,
        ci=ci,
        di=di,
        verified_at=func.now(),
    )
    db.add(user)
    db.flush()
    _ensure_notification_settings(db, user.user_id)
    db.commit()
    db.refresh(user)
    return user, True
