import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.core.rbac import APPROVER_ROLES, STAFF_ROLES, Role
from app.models.registry import RegistryRecord, RegistryStatus, RegistryType
from app.models.user import User
from app.schemas.registry import RegistryRecordCreate, RegistryRecordOut, RegistryRecordUpdate, RegistryTypeOut
from app.services.audit_service import log_action
from app.services.record_service import compute_signature_hash, generate_record_number, generate_verify_code

router = APIRouter(prefix="/cabinet", tags=["cabinet"])


def _ensure_same_org(user: User, registry_type: RegistryType):
    if user.role != Role.SUPERADMIN and registry_type.organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Bu reestr turi sizning tashkilotingizga tegishli emas")


@router.get("/registry-types", response_model=list[RegistryTypeOut])
def list_registry_types(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*STAFF_ROLES)),
):
    query = db.query(RegistryType).filter(RegistryType.is_active.is_(True))
    if user.role != Role.SUPERADMIN:
        query = query.filter(RegistryType.organization_id == user.organization_id)
    return query.all()


@router.get("/records", response_model=list[RegistryRecordOut])
def list_records(
    status_filter: RegistryStatus | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*STAFF_ROLES)),
):
    query = db.query(RegistryRecord).join(RegistryType)
    if user.role != Role.SUPERADMIN:
        query = query.filter(RegistryType.organization_id == user.organization_id)
    if status_filter:
        query = query.filter(RegistryRecord.status == status_filter)
    return query.order_by(RegistryRecord.created_at.desc()).limit(200).all()


@router.get("/records/{record_id}", response_model=RegistryRecordOut)
def get_record(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*STAFF_ROLES)),
):
    record = db.get(RegistryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Yozuv topilmadi")
    _ensure_same_org(user, record.registry_type)
    return record


@router.post("/records", response_model=RegistryRecordOut, status_code=201)
def create_record(
    payload: RegistryRecordCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*STAFF_ROLES)),
):
    registry_type = db.get(RegistryType, payload.registry_type_id)
    if not registry_type:
        raise HTTPException(status_code=404, detail="Reestr turi topilmadi")
    _ensure_same_org(user, registry_type)

    missing = [
        f["key"]
        for f in registry_type.field_schema
        if f.get("required") and payload.data.get(f["key"]) in (None, "")
    ]
    if missing:
        raise HTTPException(status_code=422, detail=f"Majburiy maydonlar to'ldirilmagan: {', '.join(missing)}")

    record_number = payload.record_number.strip() if payload.record_number else None
    if record_number:
        if db.query(RegistryRecord).filter(RegistryRecord.record_number == record_number).first():
            raise HTTPException(status_code=409, detail="Bu raqam bilan yozuv allaqachon mavjud")
    else:
        record_number = generate_record_number(registry_type.code)

    record = RegistryRecord(
        id=uuid.uuid4(),
        registry_type_id=registry_type.id,
        record_number=record_number,
        subject_pinfl=payload.subject_pinfl,
        subject_name=payload.subject_name,
        data=payload.data,
        status=RegistryStatus.DRAFT,
        source_channel="manual",
        created_by_id=user.id,
        verify_code=generate_verify_code(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    log_action(
        db,
        actor=user,
        action="record.create",
        entity_type="registry_record",
        entity_id=str(record.id),
        ip_address=request.client.host if request.client else None,
        details={"registry_type": registry_type.code},
    )
    return record


@router.put("/records/{record_id}", response_model=RegistryRecordOut)
def update_record(
    record_id: uuid.UUID,
    payload: RegistryRecordUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*STAFF_ROLES)),
):
    record = db.get(RegistryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Yozuv topilmadi")
    _ensure_same_org(user, record.registry_type)

    if record.status != RegistryStatus.DRAFT:
        raise HTTPException(status_code=409, detail="Faqat 'draft' holatidagi yozuvlarni tahrirlash mumkin")

    if payload.subject_pinfl is not None:
        record.subject_pinfl = payload.subject_pinfl
    if payload.subject_name is not None:
        record.subject_name = payload.subject_name
    if payload.data is not None:
        record.data = payload.data

    db.commit()
    db.refresh(record)

    log_action(
        db,
        actor=user,
        action="record.update",
        entity_type="registry_record",
        entity_id=str(record.id),
        ip_address=request.client.host if request.client else None,
    )
    return record


@router.post("/records/{record_id}/sign", response_model=RegistryRecordOut)
def sign_and_publish(
    record_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*APPROVER_ROLES)),
):
    """E-IMZO bilan tasdiqlash va reestrga e'lon qilish (lifecycle: C -> D)."""
    record = db.get(RegistryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Yozuv topilmadi")
    _ensure_same_org(user, record.registry_type)

    if record.status != RegistryStatus.DRAFT:
        raise HTTPException(status_code=409, detail="Yozuv allaqachon tasdiqlangan yoki noto'g'ri holatda")

    now = datetime.now(timezone.utc)
    record.signed_by_id = user.id
    record.signed_at = now
    record.signature_hash = compute_signature_hash(record, user.id)
    record.status = RegistryStatus.ACTIVE
    record.published_at = now

    db.commit()
    db.refresh(record)

    log_action(
        db,
        actor=user,
        action="record.sign_and_publish",
        entity_type="registry_record",
        entity_id=str(record.id),
        ip_address=request.client.host if request.client else None,
        details={"signature_hash": record.signature_hash},
    )
    return record


@router.post("/records/{record_id}/status/{new_status}", response_model=RegistryRecordOut)
def change_status(
    record_id: uuid.UUID,
    new_status: RegistryStatus,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*APPROVER_ROLES)),
):
    """Faol yozuvni To'xtatilgan/Tugatilgan/Muxlat buzilgan holatiga o'tkazish."""
    if new_status == RegistryStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Yozuvni qayta 'draft' holatiga qaytarib bo'lmaydi")

    record = db.get(RegistryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Yozuv topilmadi")
    _ensure_same_org(user, record.registry_type)

    if record.status == RegistryStatus.DRAFT:
        raise HTTPException(status_code=409, detail="Avval yozuvni imzolab e'lon qiling")

    old_status = record.status
    record.status = new_status
    db.commit()
    db.refresh(record)

    log_action(
        db,
        actor=user,
        action="record.status_change",
        entity_type="registry_record",
        entity_id=str(record.id),
        ip_address=request.client.host if request.client else None,
        details={"from": old_status, "to": new_status},
    )
    return record
