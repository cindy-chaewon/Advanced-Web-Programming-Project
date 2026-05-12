"""해시태그 Pydantic 스키마."""
from pydantic import BaseModel, ConfigDict


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tag_id: int
    name: str


class PopularTagOut(BaseModel):
    tag_id: int
    name: str
    usage_count: int
