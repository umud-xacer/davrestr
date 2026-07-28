"""Stateless captcha: kodni serverda saqlamasdan HMAC-imzolangan token ichida tashiydi.

Redis yoki sessiya bo'lmasa ham ishlaydi (fail-safe), chunki tekshiruv token ichidagi
imzoni qayta hisoblash orqali amalga oshadi.
"""

import base64
import hashlib
import hmac
import random
import secrets
import time
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings

CAPTCHA_TTL_SECONDS = 180


def _sign(code: str, issued_at: int) -> str:
    payload = f"{code}:{issued_at}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), payload, hashlib.sha256).hexdigest()


def generate_captcha() -> dict:
    code = "".join(secrets.choice("0123456789") for _ in range(4))
    issued_at = int(time.time())
    signature = _sign(code, issued_at)
    token = base64.urlsafe_b64encode(f"{code}:{issued_at}:{signature}".encode()).decode()

    image = _render_captcha_image(code)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    image_base64 = base64.b64encode(buffer.getvalue()).decode("ascii")

    return {"token": token, "image_base64": image_base64}


def generate_reveal_code() -> dict:
    """Rasmsiz, ochiq matnli tasdiqlash kodi.

    Public qidiruv natijasini (kadastr ma'lumotlarini) ko'rsatishdan oldin foydalanuvchidan
    ekranda chiqqan kodni qayta kiritishni talab qiladigan qo'shimcha bosqich uchun — bir martalik
    avtomatlashtirilgan skanerlashni sekinlashtiradi. Token generate_captcha bilan bir xil
    HMAC mexanizmidan foydalanadi, shuning uchun verify_captcha orqali tekshiriladi.
    """
    code = "".join(secrets.choice("0123456789") for _ in range(4))
    issued_at = int(time.time())
    signature = _sign(code, issued_at)
    token = base64.urlsafe_b64encode(f"{code}:{issued_at}:{signature}".encode()).decode()
    return {"token": token, "code": code}


def verify_captcha(token: str, answer: str) -> bool:
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        code, issued_at_str, signature = decoded.split(":")
        issued_at = int(issued_at_str)
    except (ValueError, UnicodeDecodeError):
        return False

    if time.time() - issued_at > CAPTCHA_TTL_SECONDS:
        return False
    if not hmac.compare_digest(_sign(code, issued_at), signature):
        return False
    return hmac.compare_digest(code.strip(), (answer or "").strip())


def _render_captcha_image(code: str) -> Image.Image:
    width, height = 140, 56
    bg = (243, 244, 246)
    image = Image.new("RGB", (width, height), bg)
    draw = ImageDraw.Draw(image)

    try:
        font = ImageFont.truetype("arial.ttf", 30)
    except OSError:
        font = ImageFont.load_default()

    for _ in range(6):
        x1, y1 = random.randint(0, width), random.randint(0, height)
        x2, y2 = random.randint(0, width), random.randint(0, height)
        draw.line((x1, y1, x2, y2), fill=(200, 200, 205), width=1)

    x = 15
    for ch in code:
        y = random.randint(5, 15)
        draw.text((x, y), ch, font=font, fill=(60, 60, 70))
        x += 28

    return image
