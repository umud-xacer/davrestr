import uuid

from pydantic import BaseModel

from app.core.rbac import Role


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    username: str
    role: Role
    organization_id: uuid.UUID | None = None
    oneid_verified: bool

    model_config = {"from_attributes": True}
