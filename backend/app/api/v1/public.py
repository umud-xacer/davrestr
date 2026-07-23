from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import rate_limiter
from app.models.registry import RegistryRecord, RegistryType
from app.schemas.registry import CaptchaOut, FieldDef, PublicRecordOut
from app.services.captcha_service import generate_captcha, verify_captcha
from app.services.record_service import extract_public_data

router = APIRouter(prefix="/public", tags=["public"])


def _public_field_defs(registry_type: RegistryType) -> list[FieldDef]:
    return [
        FieldDef(**f)
        for f in registry_type.field_schema
        if f["key"] in registry_type.public_fields
    ]


def _to_public_record_out(record: RegistryRecord) -> PublicRecordOut:
    return PublicRecordOut(
        record_number=record.record_number,
        registry_type_name=record.registry_type.name,
        status=record.status,
        data=extract_public_data(record, record.registry_type.public_fields),
        field_defs=_public_field_defs(record.registry_type),
        published_at=record.published_at,
        verify_code=record.verify_code,
    )


@router.get("/captcha", response_model=CaptchaOut)
def get_captcha():
    return generate_captcha()


@router.get(
    "/search",
    response_model=list[PublicRecordOut],
    dependencies=[Depends(rate_limiter(max_requests=30, window_seconds=60))],
)
def search_records(
    q: str = Query(..., min_length=3, description="Kadastr/hujjat raqami, STIR, PINFL yoki kalit so'z"),
    captcha_token: str = Query(...),
    captcha_answer: str = Query(...),
    registry_type_code: str | None = None,
    db: Session = Depends(get_db),
):
    """Faqat e'lon qilingan (published) yozuvlar va faqat registry_type.public_fields
    ro'yxatidagi ochiq maydonlar qaytariladi — nozik ma'lumotlar shu yerda filtrlanadi.
    Ommaviy scraping'dan himoya uchun rate-limit va captcha talab qilinadi.
    """
    if not verify_captcha(captcha_token, captcha_answer):
        raise HTTPException(status_code=400, detail="Captcha kodi noto'g'ri yoki muddati o'tgan")

    query = (
        db.query(RegistryRecord)
        .join(RegistryType)
        .filter(RegistryRecord.published_at.isnot(None))
        .filter(
            or_(
                RegistryRecord.record_number.ilike(f"%{q}%"),
                RegistryRecord.subject_pinfl == q,
                RegistryRecord.subject_name.ilike(f"%{q}%"),
            )
        )
    )
    if registry_type_code:
        query = query.filter(RegistryType.code == registry_type_code)

    records = query.limit(50).all()
    return [_to_public_record_out(r) for r in records]


@router.get(
    "/records/{record_number}",
    response_model=PublicRecordOut,
    dependencies=[Depends(rate_limiter(max_requests=60, window_seconds=60))],
)
def get_public_record(record_number: str, db: Session = Depends(get_db)):
    record = (
        db.query(RegistryRecord)
        .filter(RegistryRecord.record_number == record_number, RegistryRecord.published_at.isnot(None))
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Yozuv topilmadi yoki hali e'lon qilinmagan")

    return _to_public_record_out(record)


@router.get("/verify/{verify_code}")
def verify_record(verify_code: str, db: Session = Depends(get_db)):
    """QR-kodli ko'chirmaning haqiqiyligini tashqi tomondan tekshirish uchun ochiq endpoint."""
    record = db.query(RegistryRecord).filter(RegistryRecord.verify_code == verify_code).first()
    if not record or not record.published_at:
        return {"valid": False}

    return {
        "valid": True,
        "record_number": record.record_number,
        "status": record.status,
        "signed_at": record.signed_at,
        "signature_hash": record.signature_hash,
    }
