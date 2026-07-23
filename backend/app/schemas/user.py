import uuid

from pydantic import BaseModel

from app.core.rbac import Role


class UserCreate(BaseModel):
    full_name: str
    username: str
    password: str
    role: Role
    organization_id: uuid.UUID | None = None
    pinfl: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: Role | None = None
    organization_id: uuid.UUID | None = None
    is_active: bool | None = None


class OrganizationCreate(BaseModel):
    name: str
    code: str


class OrganizationOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    is_active: bool

    model_config = {"from_attributes": True}
