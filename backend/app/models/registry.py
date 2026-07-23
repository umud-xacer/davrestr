import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, ForeignKey, DateTime, func, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RegistryStatus(str, enum.Enum):
    DRAFT = "draft"  # xodim tomonidan yaratilgan, hali tasdiqlanmagan
    ACTIVE = "active"  # Faol
    SUSPENDED = "suspended"  # To'xtatilgan
    TERMINATED = "terminated"  # Tugatilgan
    VIOLATED = "violated"  # Muxlat buzilgan


class RegistryType(Base):
    """Dynamic Form Builder: SuperAdmin dasturchisiz yangi reestr turini shu yerda yaratadi.

    `schema` maydonlari JSON Schema shaklida saqlanadi:
    [{"key": "kadastr_qiymati", "label": "Kadastr qiymati", "type": "number", "required": true}, ...]
    """

    __tablename__ = "registry_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    field_schema: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Qaysi maydonlar public qidiruvda umumiy ko'rinishda chiqadi (nozik ma'lumotlarni yashirish uchun)
    public_fields: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization: Mapped["Organization"] = relationship(back_populates="registry_types")
    records: Mapped[list["RegistryRecord"]] = relationship(back_populates="registry_type")


class RegistryRecord(Base):
    """Har bir aniq reestr yozuvi (masalan bitta ko'chmas mulk obyekti)."""

    __tablename__ = "registry_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registry_type_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("registry_types.id"))

    record_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    subject_pinfl: Mapped[str | None] = mapped_column(String(14), nullable=True, index=True)
    subject_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[RegistryStatus] = mapped_column(
        SAEnum(RegistryStatus, name="registry_status"), default=RegistryStatus.DRAFT, nullable=False
    )

    # Kirish kanali: api / manual / batch_import
    source_channel: Mapped[str] = mapped_column(String(20), default="manual")

    created_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    signed_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    signature_hash: Mapped[str | None] = mapped_column(String(512), nullable=True)  # E-IMZO simulyatsiyasi
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    verify_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    registry_type: Mapped["RegistryType"] = relationship(back_populates="records")
