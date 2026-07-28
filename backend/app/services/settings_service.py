from sqlalchemy.orm import Session

from app.models.settings import SiteSettings


def get_settings(db: Session) -> SiteSettings:
    """Yagona (singleton) sozlamalar qatorini qaytaradi — birinchi chaqiruvda yaratadi."""
    settings = db.query(SiteSettings).first()
    if not settings:
        settings = SiteSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings
