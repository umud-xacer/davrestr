# Davlat Reestrlari Portali — MVP

TZ (DR-PORTAL-2026) asosida qurilgan 4 modulli tizim: Ochiq Portal, Idora Kabineti (Cabinet), Admin Panel, va Public Verify API. Integration Gateway (tashqi davlat tizimlari bilan real sinxronizatsiya) keyingi bosqichda ulanadi — hozircha manual va admin orqali kiritish ishlaydi.

## Stack

- **Backend:** FastAPI, SQLAlchemy 2.0, PostgreSQL, Redis (rate-limiting), Alembic
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + React Router

> **Production'ga (real server + domen) joylashtirish uchun [DEPLOY.md](./DEPLOY.md)ga qarang.**
> Bu yerdagi ko'rsatmalar faqat lokal ishlab chiqish (development) muhiti uchun — jumladan pastdagi
> `Demo12345!` paroli faqat lokal test uchun, production'da HECH QACHON ishlatilmasligi kerak.

## Ishga tushirish (Docker bilan, tavsiya etiladi)

```powershell
docker compose up --build
```

- Backend: http://localhost:8000 (Swagger docs: http://localhost:8000/docs)
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432, Redis: localhost:6379

Birinchi marta ko'tarilgandan so'ng migratsiya va demo ma'lumotlarni yuklash:

```powershell
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

## Demo login ma'lumotlari (seed skriptidan keyin)

Barchasi uchun parol: `Demo12345!`

| Username | Rol |
|---|---|
| `superadmin` | SuperAdministrator |
| `orgadmin_kadastr` | Tashkilot administratori |
| `xodim_kadastr` | Idora xodimi (yozuv kiritadi) |
| `tasdiqlovchi_kadastr` | Mas'ul shaxs (E-IMZO bilan tasdiqlaydi) |

`/cabinet/login` orqali kiring.

## Docker'siz lokal ishga tushirish

**Backend:**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# PostgreSQL va Redis'ni alohida ishga tushiring, .env'da URL'larni moslang
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

## Arxitektura qisqacha

- **Dynamic Form Builder**: `registry_types` jadvalidagi `field_schema` (JSONB) orqali SuperAdmin/org_admin dasturchisiz yangi reestr turi (maydonlar, tiplar, majburiylik) yaratadi. Har bir yozuv (`registry_records.data`) shu sxemaga mos JSON sifatida saqlanadi.
- **Lifecycle**: `draft → active (E-IMZO bilan imzolanganda) → suspended/terminated/violated`. Faqat `cabinet_approver`/`org_admin`/`superadmin` imzolashi va statusni o'zgartirishi mumkin.
- **RBAC**: `citizen`, `cabinet_employee`, `cabinet_approver`, `org_admin`, `superadmin` — `app/core/rbac.py`.
- **Ochiq ma'lumotlar filtri**: Public API faqat `registry_type.public_fields` ro'yxatidagi maydonlarni qaytaradi — moliyaviy/nozik maydonlar (masalan kadastr qiymati) sukut bo'yicha yopiq.
- **Audit**: har bir yaratish/tahrirlash/imzolash/status o'zgarishi `audit_logs`ga append-only yoziladi.
- **Rate limiting**: public qidiruv/detail endpointlari Redis asosida IP bo'yicha cheklangan (scraping'dan himoya).
- **QR-kod / verify**: `record.verify_code` orqali `/api/v1/public/verify/{code}` — hujjat haqiqiyligini tashqi tomondan tekshirish uchun ochiq.

## Keyingi bosqichlar (production uchun)

1. OneID (E-GOV OAuth2) va E-IMZO SDK real integratsiyasi — hozir login/parol va hash-simulyatsiya bilan almashtirilgan.
2. ElasticSearch orqali to'liq matnli qidiruv (hozir PostgreSQL `ILIKE` bilan ishlaydi — kichik/o'rta hajm uchun yetarli, katta reestrlarda ES kerak).
3. Excel/CSV batch import moduli (validation engine bilan).
4. Tashqi davlat tizimlari (E-Qaror, Soliq, Adliya) bilan REST/SOAP Integration Gateway.
5. Fuqarolarga SMS/email bildirishnoma (mulk holatiga cheklov qo'yilganda).
6. QR-kodli PDF generatsiyasi (`qrcode`/`reportlab` kutubxonalari `requirements.txt`ga qo'shilgan, endpoint hali yozilmagan).
7. TZ tahlilidagi boshqa kamchiliklar (shaxsiy ma'lumotlarni himoyalash siyosati, to'lov integratsiyasi, WCAG accessibility) — suhbatda alohida ro'yxat sifatida taqdim etilgan.
