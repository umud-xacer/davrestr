import uuid

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


def log_action(
    db: Session,
    *,
    actor: User | None,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    ip_address: str | None = None,
    details: dict | None = None,
) -> AuditLog:
    entry = AuditLog(
        id=uuid.uuid4(),
        actor_id=actor.id if actor else None,
        actor_username=actor.username if actor else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        details=details or {},
    )
    db.add(entry)
    db.commit()
    return entry


def log_security_alert(
    db: Session,
    *,
    alert_type: str,
    ip_address: str | None,
    details: dict | None = None,
) -> AuditLog:
    """Avtomatik xavfsizlik tizimlari (scraping bloklash, login lockout) uchun.

    Mavjud audit jurnaliga yoziladi (actor yo'q — tizim o'zi yozadi), shuning
    uchun admin panel'dagi /admin/audit-logs?entity_type=security orqali
    qo'shimcha ekran yaratmasdan darhol ko'rinadi.
    """
    return log_action(
        db,
        actor=None,
        action=f"security.{alert_type}",
        entity_type="security",
        ip_address=ip_address,
        details=details,
    )
