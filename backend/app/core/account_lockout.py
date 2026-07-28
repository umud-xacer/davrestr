from app.core.redis_client import redis_client

MAX_FAILED_ATTEMPTS = 5
FAILED_WINDOW_SECONDS = 900  # 15 daqiqa
LOCKOUT_SECONDS = 900  # 15 daqiqa

_FAIL_PREFIX = "loginfail"
_LOCK_PREFIX = "loginlock"


def is_account_locked(username: str) -> bool:
    """IP-asosli rate-limit'dan farqli — bu username bo'yicha, turli IP'lardan
    tarqatilgan (distributed) brute-force'ga qarshi. Admin/superadmin kabi
    yuqori imtiyozli hisoblar shu orqali ham himoyalanadi."""
    try:
        return redis_client.exists(f"{_LOCK_PREFIX}:{username}") == 1
    except Exception:
        return False


def register_failed_login(username: str) -> bool:
    """Muvaffaqiyatsiz urinishni hisoblaydi; agar shu urinish hisobni
    bloklashga sabab bo'lsa True qaytaradi."""
    try:
        key = f"{_FAIL_PREFIX}:{username}"
        count = redis_client.incr(key)
        if count == 1:
            redis_client.expire(key, FAILED_WINDOW_SECONDS)
        if count >= MAX_FAILED_ATTEMPTS:
            redis_client.setex(f"{_LOCK_PREFIX}:{username}", LOCKOUT_SECONDS, "1")
            return True
        return False
    except Exception:
        return False


def clear_failed_logins(username: str) -> None:
    try:
        redis_client.delete(f"{_FAIL_PREFIX}:{username}")
        redis_client.delete(f"{_LOCK_PREFIX}:{username}")
    except Exception:
        pass
