from fastapi import Request


def get_client_ip(request: Request) -> str | None:
    """Haqiqiy tashrif buyuruvchi IP-manzilini aniqlaydi.

    Backend hech qachon to'g'ridan-to'g'ri internetdan kirish qilinmaydi
    (docker-compose.prod.yml'da porti hostga chiqarilmagan) — yagona kiruvchi
    ulanish Caddy'dan keladi. Shuning uchun Caddy qo'shgan X-Forwarded-For'ga
    ishonish xavfsiz; aks holda request.client.host doim Caddy konteynerining
    ichki docker IP'i bo'lib qoladi va rate-limit/audit-log ma'nosiz bo'lib qoladi.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None
