import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from app.models.registry import RegistryRecord


def generate_record_number(registry_code: str) -> str:
    """Masalan: KAD-2026-8F3A9C21"""
    suffix = secrets.token_hex(4).upper()
    return f"{registry_code.upper()}-{datetime.now(timezone.utc).year}-{suffix}"


def generate_verify_code() -> str:
    return secrets.token_urlsafe(12)


def compute_signature_hash(record: RegistryRecord, signer_id: uuid.UUID) -> str:
    """E-IMZO integratsiyasi ulanmagunча signature hash simulyatsiyasi.

    Haqiqiy ishlab chiqarishda bu yerda E-IMZO SDK orqali PKCS#7 raqamli imzo
    hosil qilinadi va shu joyga real imzo qiymati saqlanadi.
    """
    payload = f"{record.id}:{record.record_number}:{signer_id}:{record.data}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def extract_public_data(record: RegistryRecord, public_fields: list[str]) -> dict:
    return {k: v for k, v in record.data.items() if k in public_fields}
