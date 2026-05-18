from __future__ import annotations
"""메뉴 Pydantic 스키마."""
from pydantic import BaseModel, ConfigDict, Field


class MenuCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    price: int | None = Field(default=None, ge=0)
    is_signature: bool = False


class MenuUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    price: int | None = Field(default=None, ge=0)
    is_signature: bool | None = None


class MenuOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    menu_id: int
    restaurant_id: int
    name: str
    description: str | None = None
    price: int | None = None
    is_signature: bool = False
