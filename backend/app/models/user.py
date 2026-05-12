"""USERS 테이블 모델 (사용자 마스터)."""
from __future__ import annotations

from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "USERS"

    user_id = Column(Integer, primary_key=True, autoincrement=True, comment="사용자 ID")
    username = Column(String(50), nullable=False, comment="닉네임")
    email = Column(String(100), unique=True, comment="이메일")
    ci = Column(String(88), unique=True, comment="인증서 연계정보 (본인확인)")
    di = Column(String(64), comment="중복가입 방지 식별값")
    verified_at = Column(TIMESTAMP, nullable=True, comment="인증 완료 시각")
    profile_image = Column(String(255), comment="프로필 이미지 URL")
    bio = Column(String(500), nullable=True, comment="자기소개 (마이페이지)")
    points = Column(
        Integer,
        nullable=False,
        server_default="0",
        comment="활동 포인트 (level은 동적 계산)",
    )
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="가입일")

    @property
    def level(self) -> int:
        """포인트 기반 레벨 (250P당 1레벨, 최소 1)."""
        return max(1, (self.points or 0) // 250 + 1)

    # ── 등록한 식당 (탈퇴 시 식당은 보존, registered_by → NULL) ──
    registered_restaurants = relationship(
        "Restaurant",
        foreign_keys="Restaurant.registered_by",
        back_populates="registrar",
    )

    # ── 콘텐츠 ──
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="author", cascade="all, delete-orphan")

    # ── 인터랙션 ──
    scraps = relationship("Scrap", back_populates="user", cascade="all, delete-orphan")
    post_likes = relationship("PostLike", back_populates="user", cascade="all, delete-orphan")
    review_likes = relationship("ReviewLike", back_populates="user", cascade="all, delete-orphan")

    # ── 알림 ──
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    notification_settings = relationship(
        "NotificationSetting",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # ── 그룹 ──
    owned_groups = relationship(
        "Group",
        foreign_keys="Group.owner_id",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
    group_memberships = relationship(
        "GroupMember",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # ── 친구 ──
    friends_initiated = relationship(
        "Friend",
        foreign_keys="Friend.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    friends_received = relationship(
        "Friend",
        foreign_keys="Friend.friend_id",
        back_populates="friend",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User user_id={self.user_id} username={self.username!r}>"
