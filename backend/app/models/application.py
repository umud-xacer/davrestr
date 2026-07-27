import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    """Fuqaro arizasining hayotiy sikli.

    submitted        - fuqaro tomonidan yuborildi, hali ko'rib chiqilmagan
    under_review      - admin ko'rib chiqmoqda
    payment_pending    - davlat boji/xizmat haqi to'lovi kutilmoqda
    paid             - to'lov amalga oshirildi
    approved          - ariza tasdiqlandi, xizmat ko'rsatildi
    rejected          - ariza rad etildi
    """

    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    PAYMENT_PENDING = "payment_pending"
    PAID = "paid"
    APPROVED = "approved"
    REJECTED = "rejected"


class Application(Base):
    """Ochiq Portal orqali fuqarolar tomonidan yuborilgan elektron xizmat arizalari.

    Statusni faqat Admin panel orqali (require_roles ADMIN_ROLES) o'zgartirish mumkin —
    fuqaro arizani yuborgandan keyin uning holatini kuzatib borishi mumkin, xolos.
    """

    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    service_title: Mapped[str] = mapped_column(String(500), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, name="application_status"),
        default=ApplicationStatus.SUBMITTED,
        nullable=False,
        index=True,
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
