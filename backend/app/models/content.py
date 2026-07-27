import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, ForeignKey, DateTime, func, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ContentType(str, enum.Enum):
    NEWS = "news"  # Bosh sahifadagi "So'nggi yangiliklar"
    SERVICE = "service"  # Bosh sahifadagi "Elektron xizmatlar"
    ANNOUNCEMENT = "announcement"  # E'lonlar


class ContentItem(Base):
    """Admin panel orqali boshqariladigan sayt kontenti (yangiliklar/xizmatlar/e'lonlar).

    Bitta jadval barcha uch turni ham qamrab oladi — ularning shakli (sarlavha + qisqa matn +
    tartib raqami) bir xil bo'lgani uchun uchta alohida jadval yaratish ortiqcha bo'lardi.
    """

    __tablename__ = "content_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[ContentType] = mapped_column(SAEnum(ContentType, name="content_type"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
