import base64
from io import BytesIO

import qrcode

from app.core.config import settings


def generate_qr_base64(verify_code: str) -> str:
    url = f"{settings.QR_VERIFY_BASE_URL}/{verify_code}"
    img = qrcode.make(url)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")
