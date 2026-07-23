from fastapi import HTTPException, Request, status

from app.core.redis_client import redis_client


def rate_limiter(max_requests: int, window_seconds: int):
    """Ommaviy scraping/DDoS'dan himoya uchun oddiy fixed-window rate limiter.

    Har bir IP uchun `window_seconds` oynada `max_requests` dan ortiq so'rov
    yuborilsa 429 qaytaradi. Redis mavjud bo'lmasa (masalan lokal dev muhitida
    o'chirilgan bo'lsa) limiter jim o'tkazib yuboradi — bu fail-open siyosat,
    lekin production'da Redis har doim mavjud bo'lishi shart.
    """

    def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{request.url.path}:{client_ip}"
        try:
            current = redis_client.incr(key)
            if current == 1:
                redis_client.expire(key, window_seconds)
            if current > max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Juda ko'p so'rov yuborildi. Iltimos birozdan so'ng qayta urinib ko'ring.",
                )
        except HTTPException:
            raise
        except Exception:
            # Redis vaqtincha ishlamasa ham public qidiruv butunlay to'xtab qolmasin
            return

    return dependency
