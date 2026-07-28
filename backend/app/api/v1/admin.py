import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from datetime import datetime, timezone

from app.api.deps import require_roles
from app.core.config import settings
from app.core.database import get_db
from app.core.net import get_client_ip
from app.core.rbac import ADMIN_ROLES, Role
from app.core.security import hash_password
from app.models.application import Application
from app.models.audit import AuditLog
from app.models.content import ContentItem
from app.models.document import Document
from app.models.organization import Organization
from app.models.registry import RegistryRecord, RegistryType
from app.models.user import User
from app.schemas.application import ApplicationOut, ApplicationStatusUpdate
from app.schemas.audit import AuditLogOut
from app.schemas.content import ContentItemCreate, ContentItemOut, ContentItemUpdate, ImageUploadOut
from app.schemas.document import DocumentOut
from app.schemas.registry import RegistryRecordOut, RegistryRecordUpdate, RegistryTypeCreate, RegistryTypeOut
from app.schemas.settings import SiteSettingsOut, SiteSettingsUpdate
from app.schemas.user import OrganizationCreate, OrganizationOut, UserCreate, UserUpdate
from app.schemas.auth import UserOut
from app.services.document_service import to_document_out
from app.services.pdf_stamp_service import stamp_pdf_with_qr
from app.services.record_service import compute_signature_hash
from app.services.settings_service import get_settings
from app.services.audit_service import log_action

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024
DOCUMENTS_SUBDIR = "documents"


def _scope_org_id(current: User, requested: uuid.UUID | None) -> uuid.UUID:
    """org_admin faqat o'z tashkiloti doirasida ishlay oladi; superadmin istalgan tashkilotni belgilay oladi."""
    if current.role == Role.SUPERADMIN:
        if not requested:
            raise HTTPException(status_code=422, detail="organization_id ko'rsatilishi shart")
        return requested
    return current.organization_id


# ---------- Registry Type Builder (Dynamic Form Builder) ----------

@router.get("/registry-types", response_model=list[RegistryTypeOut])
def list_registry_types(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    query = db.query(RegistryType)
    if user.role != Role.SUPERADMIN:
        query = query.filter(RegistryType.organization_id == user.organization_id)
    return query.all()


@router.post("/registry-types", response_model=RegistryTypeOut, status_code=201)
def create_registry_type(
    payload: RegistryTypeCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    org_id = _scope_org_id(user, payload.organization_id or user.organization_id)
    if db.query(RegistryType).filter(RegistryType.code == payload.code).first():
        raise HTTPException(status_code=409, detail="Bu kod bilan reestr turi allaqachon mavjud")

    registry_type = RegistryType(
        id=uuid.uuid4(),
        code=payload.code,
        name=payload.name,
        description=payload.description,
        organization_id=org_id,
        field_schema=[f.model_dump() for f in payload.field_schema],
        public_fields=payload.public_fields,
    )
    db.add(registry_type)
    db.commit()
    db.refresh(registry_type)

    log_action(
        db, actor=user, action="registry_type.create", entity_type="registry_type",
        entity_id=str(registry_type.id), ip_address=get_client_ip(request),
    )
    return registry_type


@router.patch("/registry-types/{type_id}/deactivate", response_model=RegistryTypeOut)
def deactivate_registry_type(
    type_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    registry_type = db.get(RegistryType, type_id)
    if not registry_type:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if user.role != Role.SUPERADMIN and registry_type.organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    registry_type.is_active = False
    db.commit()
    db.refresh(registry_type)

    log_action(
        db, actor=user, action="registry_type.deactivate", entity_type="registry_type",
        entity_id=str(registry_type.id), ip_address=get_client_ip(request),
    )
    return registry_type


# ---------- Kadastr yozuvlarini to'liq tahrirlash ----------
# Cabinet'dagi PUT /cabinet/records/{id} faqat "draft" holatidagi yozuvlarni tahrirlashga
# ruxsat beradi (oddiy xodim ish oqimi). Bu yerdagi endpoint'lar faqat ADMIN_ROLES uchun —
# yozuv holati qanday bo'lishidan qat'iy nazar (shu jumladan allaqachon e'lon
# qilingan/imzolangan) tuzatish imkonini beradi, lekin har bir o'zgarish to'liq
# before/after audit yozuvi bilan qayd etiladi.

@router.get("/records", response_model=list[RegistryRecordOut])
def search_records_admin(
    q: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    query = db.query(RegistryRecord).join(RegistryType)
    if user.role != Role.SUPERADMIN:
        query = query.filter(RegistryType.organization_id == user.organization_id)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                RegistryRecord.record_number.ilike(like),
                RegistryRecord.subject_name.ilike(like),
                RegistryRecord.subject_pinfl == q,
            )
        )
    return query.order_by(RegistryRecord.updated_at.desc()).limit(50).all()


@router.get("/records/{record_id}", response_model=RegistryRecordOut)
def get_record_admin(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    record = db.get(RegistryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Yozuv topilmadi")
    if user.role != Role.SUPERADMIN and record.registry_type.organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    return record


@router.put("/records/{record_id}", response_model=RegistryRecordOut)
def update_record_admin(
    record_id: uuid.UUID,
    payload: RegistryRecordUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    record = db.get(RegistryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Yozuv topilmadi")
    if user.role != Role.SUPERADMIN and record.registry_type.organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    before = {"subject_pinfl": record.subject_pinfl, "subject_name": record.subject_name, "data": record.data}

    if payload.subject_pinfl is not None:
        record.subject_pinfl = payload.subject_pinfl
    if payload.subject_name is not None:
        record.subject_name = payload.subject_name
    if payload.data is not None:
        record.data = payload.data

    # Yozuv allaqachon imzolangan bo'lsa, signature_hash ma'lumotdan hisoblanadi — tuzatishdan
    # keyin qayta hisoblanmasa, /public/verify eski, endi mos kelmaydigan hash'ni ko'rsatib qolardi.
    if record.signed_at is not None:
        record.signature_hash = compute_signature_hash(record, record.signed_by_id or user.id)

    db.commit()
    db.refresh(record)

    log_action(
        db,
        actor=user,
        action="record.admin_full_edit",
        entity_type="registry_record",
        entity_id=str(record.id),
        ip_address=get_client_ip(request),
        details={
            "before": before,
            "after": {"subject_pinfl": record.subject_pinfl, "subject_name": record.subject_name, "data": record.data},
        },
    )
    return record


# ---------- Organizations (faqat superadmin) ----------

@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.SUPERADMIN))):
    return db.query(Organization).all()


@router.post("/organizations", response_model=OrganizationOut, status_code=201)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.SUPERADMIN)),
):
    if db.query(Organization).filter(Organization.code == payload.code).first():
        raise HTTPException(status_code=409, detail="Bu kod bilan tashkilot allaqachon mavjud")
    org = Organization(id=uuid.uuid4(), name=payload.name, code=payload.code)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


# ---------- User management ----------

@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    query = db.query(User)
    if user.role != Role.SUPERADMIN:
        query = query.filter(User.organization_id == user.organization_id)
    return query.all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    if user.role != Role.SUPERADMIN and payload.role == Role.SUPERADMIN:
        raise HTTPException(status_code=403, detail="org_admin superadmin yarata olmaydi")

    org_id = _scope_org_id(user, payload.organization_id)
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=409, detail="Bu username band")

    new_user = User(
        id=uuid.uuid4(),
        full_name=payload.full_name,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        organization_id=org_id,
        pinfl=payload.pinfl,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(
        db, actor=user, action="user.create", entity_type="user",
        entity_id=str(new_user.id), ip_address=get_client_ip(request),
        details={"role": payload.role},
    )
    return new_user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(*ADMIN_ROLES)),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    if admin.role != Role.SUPERADMIN and target.organization_id != admin.organization_id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    if payload.full_name is not None:
        target.full_name = payload.full_name
    if payload.role is not None:
        target.role = payload.role
    if payload.organization_id is not None and admin.role == Role.SUPERADMIN:
        target.organization_id = payload.organization_id
    if payload.is_active is not None:
        target.is_active = payload.is_active

    db.commit()
    db.refresh(target)

    log_action(
        db, actor=admin, action="user.update", entity_type="user",
        entity_id=str(target.id), ip_address=get_client_ip(request),
    )
    return target


# ---------- Audit log ----------

@router.get("/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(
    entity_type: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    return query.order_by(AuditLog.created_at.desc()).limit(min(limit, 500)).all()


# ---------- Sayt sozlamalari (texnik ishlar ogohlantirishi) ----------

@router.get("/settings", response_model=SiteSettingsOut)
def get_site_settings(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    return get_settings(db)


@router.put("/settings", response_model=SiteSettingsOut)
def update_site_settings(
    payload: SiteSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    settings = get_settings(db)
    settings.maintenance_notice_enabled = payload.maintenance_notice_enabled
    settings.maintenance_notice_hours = payload.maintenance_notice_hours
    db.commit()
    db.refresh(settings)

    log_action(
        db,
        actor=user,
        action="settings.update",
        entity_type="site_settings",
        entity_id=str(settings.id),
        ip_address=get_client_ip(request),
        details=payload.model_dump(),
    )
    return settings


# ---------- Sayt kontenti (yangiliklar / xizmatlar / e'lonlar CMS) ----------

@router.get("/content", response_model=list[ContentItemOut])
def list_content(
    content_type: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    query = db.query(ContentItem)
    if content_type:
        query = query.filter(ContentItem.type == content_type)
    return query.order_by(ContentItem.type, ContentItem.sort_order, ContentItem.created_at.desc()).all()


@router.post("/content", response_model=ContentItemOut, status_code=201)
def create_content(
    payload: ContentItemCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    item = ContentItem(
        id=uuid.uuid4(),
        type=payload.type,
        title=payload.title,
        description=payload.description,
        image_url=payload.image_url,
        is_published=payload.is_published,
        sort_order=payload.sort_order,
        created_by_id=user.id,
        published_at=payload.published_at or (datetime.now(timezone.utc) if payload.is_published else None),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    log_action(
        db, actor=user, action="content.create", entity_type="content_item",
        entity_id=str(item.id), ip_address=get_client_ip(request),
        details={"type": payload.type},
    )
    return item


@router.patch("/content/{content_id}", response_model=ContentItemOut)
def update_content(
    content_id: uuid.UUID,
    payload: ContentItemUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    item = db.get(ContentItem, content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Kontent topilmadi")

    if payload.title is not None:
        item.title = payload.title
    if payload.description is not None:
        item.description = payload.description
    if payload.image_url is not None:
        item.image_url = payload.image_url
    if payload.sort_order is not None:
        item.sort_order = payload.sort_order
    if payload.published_at is not None:
        item.published_at = payload.published_at
    if payload.is_published is not None:
        item.is_published = payload.is_published
        if payload.is_published and not item.published_at:
            item.published_at = datetime.now(timezone.utc)
        elif not payload.is_published:
            item.published_at = None

    db.commit()
    db.refresh(item)

    log_action(
        db, actor=user, action="content.update", entity_type="content_item",
        entity_id=str(item.id), ip_address=get_client_ip(request),
    )
    return item


@router.delete("/content/{content_id}", status_code=204)
def delete_content(
    content_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    item = db.get(ContentItem, content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Kontent topilmadi")

    db.delete(item)
    db.commit()

    log_action(
        db, actor=user, action="content.delete", entity_type="content_item",
        entity_id=str(content_id), ip_address=get_client_ip(request),
    )


@router.post("/content/upload-image", response_model=ImageUploadOut)
async def upload_content_image(
    file: UploadFile = File(...),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    """Yangilik/xizmat kartochkasi uchun rasm yuklash — natijada qaytgan url ContentItem.image_url'ga yoziladi."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Faqat rasm fayllari (jpg, png, webp, gif) qabul qilinadi")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Fayl hajmi 5 MB dan oshmasligi kerak")

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(contents)

    return ImageUploadOut(url=f"{settings.API_V1_PREFIX}/uploads/{filename}")


# ---------- Hujjatlar (PDF yuklash + avtomatik QR tamg'a) ----------
# 1-usul (avtomatik): admin oddiy PDF (QR kodsiz) yuklaydi, tizim /documents/{id}
# sahifasiga yo'naltiruvchi QR kodni PDF'ning 1-sahifasiga o'zi chizib qo'shadi.

@router.post("/documents", response_model=DocumentOut, status_code=201)
async def upload_document(
    request: Request,
    title: str = File(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext != ".pdf" or file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Faqat PDF fayl qabul qilinadi")

    contents = await file.read()
    if len(contents) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Fayl hajmi 20 MB dan oshmasligi kerak")

    document_id = uuid.uuid4()
    qr_url = f"{settings.PUBLIC_SITE_BASE_URL}/documents/{document_id}"
    try:
        stamped_bytes = stamp_pdf_with_qr(contents, qr_url)
    except Exception:
        raise HTTPException(status_code=400, detail="PDF faylni o'qib bo'lmadi — fayl buzilgan yoki noto'g'ri formatda")

    stored_filename = f"{document_id}.pdf"
    documents_dir = os.path.join(settings.UPLOAD_DIR, DOCUMENTS_SUBDIR)
    os.makedirs(documents_dir, exist_ok=True)
    with open(os.path.join(documents_dir, stored_filename), "wb") as f:
        f.write(stamped_bytes)

    document = Document(
        id=document_id,
        title=title,
        original_filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        uploaded_by_id=user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    log_action(
        db, actor=user, action="document.upload", entity_type="document",
        entity_id=str(document.id), ip_address=get_client_ip(request),
        details={"title": title, "original_filename": document.original_filename},
    )
    return to_document_out(document)


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    documents = db.query(Document).order_by(Document.created_at.desc()).all()
    return [to_document_out(d) for d in documents]


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Hujjat topilmadi")

    filepath = os.path.join(settings.UPLOAD_DIR, DOCUMENTS_SUBDIR, document.stored_filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(document)
    db.commit()

    log_action(
        db, actor=user, action="document.delete", entity_type="document",
        entity_id=str(document_id), ip_address=get_client_ip(request),
    )


# ---------- Arizalar (fuqarolar tomonidan yuborilgan elektron xizmat arizalari) ----------

@router.get("/applications", response_model=list[ApplicationOut])
def list_applications(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    query = db.query(Application)
    if status_filter:
        query = query.filter(Application.status == status_filter)
    return query.order_by(Application.created_at.desc()).all()


@router.patch("/applications/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    """Ariza holatini (ko'rib chiqilmoqda / to'lov jarayonida / to'lov amalga oshirildi / tasdiqlandi /
    rad etildi) faqat Admin panel orqali o'zgartirish mumkin — fuqaro tomonidan emas."""
    application = db.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")

    old_status = application.status
    application.status = payload.status
    application.reviewed_by_id = user.id
    if payload.admin_note is not None:
        application.admin_note = payload.admin_note

    db.commit()
    db.refresh(application)

    log_action(
        db, actor=user, action="application.status_change", entity_type="application",
        entity_id=str(application.id), ip_address=get_client_ip(request),
        details={"from": old_status, "to": payload.status},
    )
    return application
