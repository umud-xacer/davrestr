import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: uuid.UUID
    actor_username: str | None
    action: str
    entity_type: str
    entity_id: str | None
    ip_address: str | None
    details: dict
    created_at: datetime

    model_config = {"from_attributes": True}
