import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1 import admin, auth, cabinet, public
from app.core.anti_scrape import is_ip_blocked
from app.core.config import settings
from app.core.net import get_client_ip

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def reject_blocked_ips(request: Request, call_next):
    """Scraping uchun avtomatik bloklangan IP'larni BARCHA endpoint'larda rad etadi
    (faqat app/core/anti_scrape.scrape_guard qo'llangan yo'llarda emas)."""
    ip = get_client_ip(request)
    if ip and is_ip_blocked(ip):
        return JSONResponse(status_code=403, content={"detail": "IP-manzil bloklangan"})
    return await call_next(request)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount(f"{settings.API_V1_PREFIX}/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(public.router, prefix=settings.API_V1_PREFIX)
app.include_router(cabinet.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check():
    return {"status": "ok"}
