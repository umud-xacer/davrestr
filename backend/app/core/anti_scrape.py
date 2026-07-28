from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.net import get_client_ip
from app.core.redis_client import redis_client
from app.services.audit_service import log_security_alert

_BLOCK_PREFIX = "ipblock"


def is_ip_blocked(ip: str) -> bool:
    try:
        return redis_client.exists(f"{_BLOCK_PREFIX}:{ip}") == 1
    except Exception:
        # Redis vaqtincha ishlamasa ham butun sayt to'xtab qolmasin (fail-open,
        # xuddi app/core/rate_limit.py'dagi kabi)
        return False


def block_ip(ip: str, ttl_seconds: int) -> None:
    try:
        redis_client.setex(f"{_BLOCK_PREFIX}:{ip}", ttl_seconds, "1")
    except Exception:
        pass


def scrape_guard(scope: str, threshold: int, window_seconds: int = 3600, block_seconds: int = 86400):
    """Ommaviy ma'lumot olib chiqish (scraping)dan himoya.

    Har bir endpoint'dagi bir daqiqalik rate-limit (app/core/rate_limit.py)
    faqat portlash tezligini cheklaydi — kimdir shu limit ostida (masalan
    daqiqasiga 10-20 so'rov bilan) soatlab/kunlab davom etib, butun reestrni
    birma-bir yig'ib chiqishi mumkin. Bu guard uzoqroq oyna (standart: 1 soat)
    davomida so'rovlar sonini kuzatadi; chegaradan oshsa IP butunlay
    bloklanadi (app/main.py'dagi global middleware barcha endpoint'larda buni
    tekshiradi) va admin panelga (Audit jurnal → entity_type=security)
    ko'rinadigan ogohlantirish yoziladi.
    """

    def dependency(request: Request, db: Session = Depends(get_db)):
        ip = get_client_ip(request) or "unknown"
        if is_ip_blocked(ip):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="IP-manzil bloklangan")

        try:
            key = f"scrapewatch:{scope}:{ip}"
            count = redis_client.incr(key)
            if count == 1:
                redis_client.expire(key, window_seconds)
        except Exception:
            return

        if count >= threshold:
            block_ip(ip, block_seconds)
            log_security_alert(
                db,
                alert_type="auto_block_scraping",
                ip_address=ip,
                details={
                    "scope": scope,
                    "request_count": count,
                    "window_seconds": window_seconds,
                    "block_seconds": block_seconds,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shubhali ommaviy so'rovlar aniqlandi, IP-manzil bloklandi",
            )

    return dependency
