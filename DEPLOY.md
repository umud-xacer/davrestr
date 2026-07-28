# Production'ga joylashtirish qo'llanmasi

Bu qo'llanma loyihani Linux VPS serverga, domen (masalan `davrestr.uz`) bilan, HTTPS yoqilgan holda joylashtirish uchun.

## 0. Talablar

- Ubuntu 22.04+ (yoki shunga o'xshash) VPS, root/sudo huquqi bilan
- Domenning DNS boshqaruviga kirish (A-record qo'shish uchun)
- Kamida 2 GB RAM (Postgres + Redis + backend + frontend + Caddy uchun yetarli)

## 1. DNS sozlash

Domen provayderingizda (masalan domen ro'yxatdan o'tkazilgan joyda) quyidagi yozuvni qo'shing:

| Turi | Nomi | Qiymati |
|---|---|---|
| A | `@` (yoki `davrestr.uz`) | server IP manzili |
| A | `www` | server IP manzili (ixtiyoriy) |

DNS tarqalishi bir necha daqiqadan bir necha soatgacha vaqt olishi mumkin — `nslookup davrestr.uz` orqali tekshiring.

## 2. Serverda Docker o'rnatish

Serverga SSH orqali kiring (`ssh root@SERVER_IP`), so'ng:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# (yangi guruh kuchga kirishi uchun qayta login qiling yoki: newgrp docker)
```

## 3. Loyihani serverga yuklash

```bash
git clone <sizning-git-repo-manzilingiz> davreestr
cd davreestr
```

Agar git repo hali yo'q bo'lsa, lokal kompyuteringizdan `scp -r` yoki `rsync` orqali `CODERLAR` papkasini serverga ko'chiring.

## 4. Maxfiy sozlamalarni (.env) tayyorlash

```bash
cp .env.prod.example .env
```

`.env` faylini oching va quyidagilarni albatta o'zgartiring:

```bash
# Kuchli tasodifiy SECRET_KEY generatsiya qilish:
openssl rand -hex 32
```

- `DOMAIN=davrestr.uz` — haqiqiy domeningiz
- `POSTGRES_PASSWORD` — kuchli, tasodifiy parol
- `SECRET_KEY` — yuqoridagi buyruq natijasi

**Diqqat:** `.env` faylni hech qachon git'ga commit qilmang (`.gitignore`da allaqachon istisno qilingan).

**Eslatma:** agar `SECRET_KEY` `.env.prod.example`dagi placeholder qiymatida qoldirilsa (yoki 32 belgidan qisqa bo'lsa) va `ENVIRONMENT=production` bo'lsa, backend konteyner ataylab ishga tushmaydi (xatolik bilan to'xtaydi) — bu SECRET_KEY almashtirilishini unutishning oldini olish uchun qo'yilgan himoya.

## 5. Ishga tushirish

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Bu quyidagilarni ko'taradi: PostgreSQL, Redis, backend (FastAPI), frontend (statik build, nginx), Caddy (avtomatik HTTPS bilan reverse proxy). PostgreSQL/Redis/backend portlari hostga chiqarilmagan — faqat Caddy orqali (80/443) tashqariga ochiq.

## 6. Ma'lumotlar bazasi migratsiyasi

Migratsiya fayllari (`backend/alembic/versions/`) allaqachon repo ichida commit qilingan — serverda faqat mavjud migratsiyalarni qo'llash kerak, yangisini generatsiya qilish shart emas (`--autogenerate` faqat lokal ishlab chiqish paytida, schema o'zgarganda ishlatiladi):

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 7. Boshlang'ich foydalanuvchilarni yaratish (production rejimida)

**Muhim:** oddiy `python -m app.seed` ishlatmang — u fake demo yozuv (soxta mulk obyekti) yaratadi va standart `Demo12345!` parolidan foydalanadi, bu parol ushbu suhbatda ochiq yozilgan va production uchun yaroqsiz.

O'rniga `--production` rejimida, kuchli parol bilan:

```bash
docker compose -f docker-compose.prod.yml exec -e SEED_PASSWORD='O$zingizning-Kuchli-Parolingiz-2026!' backend python -m app.seed --production
```

Bu faqat tashkilot va 4 ta xizmat foydalanuvchisini (`superadmin`, `orgadmin_kadastr`, `xodim_kadastr`, `tasdiqlovchi_kadastr`) yaratadi — hech qanday fake reestr yozuvisiz. **Barchasi bitta umumiy parol bilan yaratilgani uchun**, tizimga kirib, Admin panel → Foydalanuvchilar orqali darhol har biriga alohida, boshqa parol bilan yangi hisob yarating va vaqtinchalik hisoblarni bloklang.

## 8. Tekshirish

Brauzerda `https://davrestr.uz` oching. Caddy avtomatik ravishda Let's Encrypt orqali SSL sertifikat oladi (birinchi so'rovda bir necha soniya vaqt olishi mumkin). `/cabinet/login` orqali `superadmin` bilan kiring.

## 9. Xavfsizlik devori (firewall)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

PostgreSQL (5432), Redis (6379) va backend (8000) portlari `docker-compose.prod.yml`da hostga chiqarilmagani uchun ular allaqachon tashqi internetdan ko'rinmaydi — bu qo'shimcha himoya qatlami.

## 9.1. fail2ban (brute-force himoyasi)

Caddy `./caddy-logs/access.log`ga har bir so'rovni JSON ko'rinishda yozadi
(Caddyfile'da sozlangan). Bu fayl bilan fail2ban'ni ulash uchun:

```bash
sudo apt install -y fail2ban
sudo cp deploy/fail2ban/filter.d/caddy-auth.conf /etc/fail2ban/filter.d/
sudo cp deploy/fail2ban/jail.d/caddy-auth.conf /etc/fail2ban/jail.d/
```

`/etc/fail2ban/jail.d/caddy-auth.conf` ichidagi `logpath`ni serverdagi haqiqiy
loyiha yo'liga moslang (3-qadamda `git clone` qilingan papka, backup cron
qatoridagi yo'l bilan bir xil bo'lishi kerak), so'ng:

```bash
sudo systemctl enable --now fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status caddy-auth
```

**Muhim:** bu login/refresh'dagi 401 va rate-limit'dagi 429 javoblarni
kuzatib, takrorlanuvchi IP'ni ufw orqali bloklaydi — lekin faqat Caddy
`client_ip`ni to'g'ri aniqlasa ishlaydi. Caddyfile'dagi global
`trusted_proxies` ro'yxati Cloudflare'ning IP oralig'i — bu ro'yxat
vaqti-vaqti bilan (https://www.cloudflare.com/ips-v4, /ips-v6) yangilanishi
kerak, aks holda `client_ip` noto'g'ri chiqib, fail2ban ishlamay qoladi.

## 10. Zaxira nusxa (backup)

Kunlik avtomatik backup uchun serverda cron qo'shing:

```bash
mkdir -p ~/backups
crontab -e
```

Quyidagi qatorni qo'shing (har kuni soat 03:00da backup oladi va 30 kundan eski nusxalarni o'chiradi). `-U`/DB nomini qo'lda yozish o'rniga konteyner ichidagi `$POSTGRES_USER`/`$POSTGRES_DB` muhit o'zgaruvchilaridan foydalaniladi — shunda `.env`da parol/nom o'zgartirilsa ham bu qator yangilanishi shart bo'lmaydi:

```
0 3 * * * cd /root/davreestr && docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > ~/backups/davreestr-$(date +\%Y\%m\%d).sql.gz && find ~/backups -name "davreestr-*.sql.gz" -mtime +30 -delete
```

`/root/davreestr` — loyiha serverdagi haqiqiy joylashuv yo'liga mos kelishi kerak (3-qadamda `git clone` qilingan papka).

## 11. Yangilash (redeploy)

Kod o'zgarganda:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Keyingi bosqichlar (hali qo'lda qilinmagan)

- OneID/E-IMZO real integratsiyasi (hozir login/parol va hash-simulyatsiya)
- Monitoring/log yig'ish (masalan Grafana+Loki yoki Sentry)
- Yuqori yuklama uchun backend'ni bir nechta worker/replika bilan ishga tushirish
