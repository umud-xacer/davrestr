import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.content import ContentType


class ContentItemCreate(BaseModel):
    type: ContentType
    title: str
    description: str | None = None
    image_url: str | None = None
    is_published: bool = True
    sort_order: int = 0
    published_at: datetime | None = None


class ContentItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    is_published: bool | None = None
    sort_order: int | None = None
    published_at: datetime | None = None


class ContentItemOut(BaseModel):
    id: uuid.UUID
    type: ContentType
    title: str
    description: str | None
    image_url: str | None
    is_published: bool
    sort_order: int
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicContentItemOut(BaseModel):
    """Ochiq portalda ko'rinadigan qism — faqat e'lon qilingan kontent."""

    id: uuid.UUID
    type: ContentType
    title: str
    description: str | None
    image_url: str | None
    published_at: datetime | None

    model_config = {"from_attributes": True}


class ImageUploadOut(BaseModel):
    url: str
