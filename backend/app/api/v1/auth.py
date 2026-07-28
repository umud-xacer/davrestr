from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.account_lockout import clear_failed_logins, is_account_locked, register_failed_login
from app.core.database import get_db
from app.core.net import get_client_ip
from app.core.rate_limit import rate_limiter
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.services.audit_service import log_action, log_security_alert

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limiter(max_requests=10, window_seconds=60))],
)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """OneID (E-GOV OAuth2) integratsiyasi ulanguncha login/parol orqali autentifikatsiya.

    Ishlab chiqarishda bu endpoint OneID OAuth2 authorization code flow bilan
    almashtiriladi; login/parol faqat dasturchi/test muhiti uchun qoldiriladi.

    IP bo'yicha rate-limit'dan tashqari, username bo'yicha ham lockout bor
    (app/core/account_lockout.py) — turli IP'lardan tarqatilgan (distributed)
    brute-force'dan himoya uchun, ayniqsa admin/superadmin kabi yuqori
    imtiyozli hisoblarni nishonga olgan hujumlarda.
    """
    ip = get_client_ip(request)

    if is_account_locked(payload.username):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Ko'p noto'g'ri urinish tufayli hisob vaqtincha bloklangan, birozdan so'ng qayta urinib ko'ring",
        )

    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        locked = register_failed_login(payload.username)
        log_security_alert(
            db,
            alert_type="login_lockout" if locked else "login_failed",
            ip_address=ip,
            details={"username": payload.username},
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login yoki parol noto'g'ri")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Foydalanuvchi bloklangan")

    clear_failed_logins(payload.username)

    access_token = create_access_token(str(user.id), extra_claims={"role": user.role.value})
    refresh_token = create_refresh_token(str(user.id))

    log_action(
        db,
        actor=user,
        action="auth.login",
        entity_type="user",
        entity_id=str(user.id),
        ip_address=ip,
    )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limiter(max_requests=20, window_seconds=60))],
)
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token yaroqsiz")

    user = db.get(User, payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Foydalanuvchi topilmadi")

    access_token = create_access_token(str(user.id), extra_claims={"role": user.role.value})
    new_refresh_token = create_refresh_token(str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
