import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    service_title: str = Field(..., min_length=2, max_length=500)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=5, max_length=32)
    message: str | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    admin_note: str | None = None


class ApplicationOut(BaseModel):
    id: uuid.UUID
    service_title: str
    full_name: str
    phone: str
    message: str | None
    status: ApplicationStatus
    admin_note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
