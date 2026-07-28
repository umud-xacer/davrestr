import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SiteSettings(Base):
    """Bitta qatorli (singleton) sayt sozlamalari — admin panel orqali boshqariladi."""

    __tablename__ = "site_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Qidiruv/yozuv sahifasida ko'rsatiladigan "texnik ishlar" ogohlantirishi —
    # rasmiy ma'lumotnoma berilishi belgilangan soatgacha kechikishi mumkinligi haqida.
    maintenance_notice_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    maintenance_notice_hours: Mapped[int] = mapped_column(Integer, default=36, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
