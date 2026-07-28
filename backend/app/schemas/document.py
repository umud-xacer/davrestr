import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: uuid.UUID
    title: str
    original_filename: str
    file_url: str  # QR-tamg'alangan PDF faylning to'g'ridan-to'g'ri (static) manzili
    page_url: str  # /documents/{id} — QR kod shu havolani ko'rsatadi
    created_at: datetime

    model_config = {"from_attributes": True}
