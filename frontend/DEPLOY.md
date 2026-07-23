# Frontend'ni Vercel'ga deploy qilish

Bu loyihada backend (`backend/`) va frontend (`frontend/`) alohida joylashadi:
backend `docker-compose.prod.yml` orqali o'z serverida (Caddy + Postgres + Redis bilan)
ishlaydi, **faqat frontend Vercel'ga chiqariladi**. Frontend build vaqtida backend API
manzilini `VITE_API_BASE_URL` environment variable orqali oladi (`frontend/src/api/client.ts`).

## 1. Vercel loyihasini ulash

1. [vercel.com](https://vercel.com) da "Add New… → Project" tugmasini bosing va ushbu
   repozitoriyni tanlang.
2. **Root Directory** maydonida `frontend` ni ko'rsating (repo tuzilishida frontend va
   backend alohida papkalarda bo'lgani uchun bu muhim — aks holda Vercel repo ildizidan
   `package.json` topa olmaydi).
3. Framework Preset avtomatik "Vite" deb aniqlanadi. `frontend/vercel.json` fayli build
   buyrug'i (`npm run build`), chiqish papkasi (`dist`) va SPA routing uchun rewrite
   qoidalarini allaqachon belgilaydi — qo'shimcha sozlash shart emas.

## 2. Environment Variables (Vercel Dashboard → Project Settings → Environment Variables)

| Nomi | Qiymat (misol) | Muhit |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api.sizning-domeningiz.uz/api/v1` | Production |
| `VITE_API_BASE_URL` | `https://staging-api.sizning-domeningiz.uz/api/v1` | Preview (ixtiyoriy) |

Eslatma: `VITE_*` o'zgaruvchilari **build vaqtida** JS bundle ichiga qattiq yoziladi
(Vite shunday ishlaydi), ya'ni qiymatni o'zgartirgandan so'ng Vercel'da qayta deploy
(Redeploy) qilish kerak — runtime'da o'zgarmaydi.

To'liq ro'yxat uchun `frontend/.env.example` fayliga qarang.

## 3. Backend tomonida qilinishi kerak bo'lgan sozlash (CORS)

Frontend boshqa domenda (`*.vercel.app` yoki custom domen) joylashgani uchun backend
`BACKEND_CORS_ORIGINS` ro'yxatiga Vercel domenini qo'shish kerak, aks holda brauzer
so'rovlarni CORS xatosi bilan bloklaydi:

```
# backend/.env (production serverda)
BACKEND_CORS_ORIGINS=["https://sizning-domeningiz.uz","https://loyiha-nomi.vercel.app"]
```

`docker-compose.prod.yml` da bu qiymat `${DOMAIN}` orqali avtomatik hosil qilinadi —
agar frontend endi shu domenning bir qismi bo'lmasa (Vercel'da alohida domenda bo'lsa),
`docker-compose.prod.yml` dagi `BACKEND_CORS_ORIGINS` qatorini qo'lda kengaytirish yoki
`.env` orqali qo'shimcha domen(lar)ni uzatish kerak bo'ladi.

## 4. Lokal tekshirish

```bash
cd frontend
npm install
npm run build     # tsc -b && vite build — Vercel ham aynan shu buyruqni ishlatadi
npm run preview   # dist/ papkasini production rejimida lokal ko'rish uchun
```

Agar Vercel CLI o'rnatilgan bo'lsa, real muhitni yaqinroq simulyatsiya qilish uchun:

```bash
npm i -g vercel
cd frontend
vercel build       # .vercel/output papkasida Vercel formatidagi build hosil qiladi
vercel dev         # lokal Vercel dev server (ixtiyoriy)
```

## 5. Statik fayllar (davlat gerbi, hero rasm)

`frontend/public/images/gerb.png` va `frontend/public/images/building.png` — bular
`public/` papkasida bo'lgani uchun Vite ularni o'zgartirmasdan `dist/images/` ga
nusxalaydi va Vercel'da ham xuddi shu yo'l (`/images/gerb.png`) orqali xizmat qiladi,
qo'shimcha sozlash talab qilinmaydi.
