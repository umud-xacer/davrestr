import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.registry import RegistryStatus


class FieldDef(BaseModel):
    key: str
    label: str
    type: str  # text | number | date | select | boolean | file | list
    required: bool = False
    options: list[str] | None = None
    item_fields: list["FieldDef"] | None = None  # faqat type == "list" uchun (masalan taqiq/cheklovlar)


FieldDef.model_rebuild()


class RegistryTypeCreate(BaseModel):
    code: str
    name: str
    description: str | None = None
    organization_id: uuid.UUID | None = None  # faqat superadmin uchun; org_admin o'z tashkilotiga bog'lanadi
    field_schema: list[FieldDef]
    public_fields: list[str] = []


class RegistryTypeOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: str | None
    field_schema: list[dict]
    public_fields: list[str]
    is_active: bool

    model_config = {"from_attributes": True}


class RegistryRecordCreate(BaseModel):
    registry_type_id: uuid.UUID
    record_number: str | None = None  # masalan kadastr raqami; bo'sh qoldirilsa avtomatik generatsiya qilinadi
    subject_pinfl: str | None = None
    subject_name: str | None = None
    data: dict[str, Any]


class RegistryRecordUpdate(BaseModel):
    subject_pinfl: str | None = None
    subject_name: str | None = None
    data: dict[str, Any] | None = None


class RegistryRecordOut(BaseModel):
    id: uuid.UUID
    registry_type_id: uuid.UUID
    record_number: str
    subject_pinfl: str | None
    subject_name: str | None
    data: dict
    status: RegistryStatus
    source_channel: str
    verify_code: str
    signed_at: datetime | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicRecordOut(BaseModel):
    """Public portalda ko'rinadigan qism — faqat registry_type.public_fields ro'yxatidagi maydonlar."""

    record_number: str
    registry_type_name: str
    status: RegistryStatus
    data: dict
    field_defs: list[FieldDef]  # data'dagi maydonlarni to'g'ri tartib/label bilan render qilish uchun
    published_at: datetime | None
    verify_code: str


class CaptchaOut(BaseModel):
    token: str
    image_base64: str
