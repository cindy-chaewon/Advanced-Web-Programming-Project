"""SQLAlchemy 모델 패키지.

`database/schema.sql`의 20개 테이블에 1:1 매핑.
"""
from app.models.user import User
from app.models.friend import Friend
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.address import Address
from app.models.category import Category
from app.models.restaurant import Restaurant
from app.models.restaurant_score import RestaurantScore
from app.models.menu import Menu
from app.models.tag import Tag
from app.models.restaurant_tag import RestaurantTag
from app.models.post import Post
from app.models.post_tag import PostTag
from app.models.review import Review
from app.models.image import Image
from app.models.post_like import PostLike
from app.models.review_like import ReviewLike
from app.models.scrap import Scrap
from app.models.notification import Notification
from app.models.notification_setting import NotificationSetting
from app.models.comment import Comment

__all__ = [
    "User",
    "Friend",
    "Group",
    "GroupMember",
    "Address",
    "Category",
    "Restaurant",
    "RestaurantScore",
    "Menu",
    "Tag",
    "RestaurantTag",
    "Post",
    "PostTag",
    "Review",
    "Image",
    "PostLike",
    "ReviewLike",
    "Scrap",
    "Notification",
    "NotificationSetting",
    "Comment",
]
