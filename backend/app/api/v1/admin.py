import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.core.rbac import ADMIN_ROLES, Role
from app.core.security import hash_password
from app.models.audit import AuditLog
from app.models.organization import Organization
from app.models.registry import RegistryType
from app.models.user import User
from app.schemas.audit import AuditLogOut
from app.schemas.registry import RegistryTypeCreate, RegistryTypeOut
from app.schemas.user import OrganizationCreate, OrganizationOut, UserCreate, UserUpdate
from app.schemas.auth import UserOut
from app.services.audit_service import log_action

router = APIRouter(prefix="/admin", tags=["admin"])


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
        entity_id=str(registry_type.id), ip_address=request.client.host if request.client else None,
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
        entity_id=str(registry_type.id), ip_address=request.client.host if request.client else None,
    )
    return registry_type


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
        entity_id=str(new_user.id), ip_address=request.client.host if request.client else None,
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
        entity_id=str(target.id), ip_address=request.client.host if request.client else None,
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
