from __future__ import annotations
"""검색 자동완성·추천 Pydantic 스키마."""
from pydantic import BaseModel, Field


class RestaurantHit(BaseModel):
    restaurant_id: int
    name: str


class TagHit(BaseModel):
    tag_id: int
    name: str


class AutocompleteOut(BaseModel):
    restaurants: list[RestaurantHit] = Field(default_factory=list)
    hashtags: list[TagHit] = Field(default_factory=list)


class SuggestionsOut(BaseModel):
    popular_hashtags: list[TagHit] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
