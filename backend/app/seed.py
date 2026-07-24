"""Dastlabki demo ma'lumotlarni yaratish uchun skript.

Ishlatish: python -m app.seed
Diqqat: bu yerdagi barcha PINFL/manzil/qiymatlar TO'QIB CHIQARILGAN (fake) demo
ma'lumotlar, hech qanday real fuqaro yoki mulkka tegishli emas.

Bu skript KOCHMAS_MULK reestr turini va uning demo yozuvini har safar
qayta yaratadi (eskisini o'chirib) — shu bilan schema o'zgarganda ham
DB doim yangilangan holatda bo'ladi.
"""

import argparse
import os
import uuid
from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.core.rbac import Role
from app.core.security import hash_password
from app.models.content import ContentItem, ContentType
from app.models.organization import Organization
from app.models.registry import RegistryRecord, RegistryType
from app.models.user import User
from app.services.record_service import compute_signature_hash, generate_verify_code

CHEKLOV_ITEM_FIELDS = [
    {"key": "raqami", "label": "Taqiq/cheklov raqami", "type": "text", "required": True},
    {"key": "turi", "label": "Taqiq/cheklov turi", "type": "select", "required": True,
     "options": ["Ipoteka", "Xatlov", "Hibsga olish", "Sud taqiqi"]},
    {"key": "kim_tomonidan", "label": "Kim tomonidan", "type": "text", "required": True},
    {"key": "sana", "label": "Sana", "type": "date", "required": True},
    {"key": "ijro_raqami", "label": "Ijro xujjatining raqami", "type": "text", "required": False},
    {"key": "almashuv_kodi", "label": "Ma'lumot almashuv orqali qo'yilganligi (almashuv kodi)", "type": "text", "required": False},
]

FIELD_SCHEMA = [
    {"key": "obyekt_turi", "label": "Ob'ekt turi", "type": "select", "required": True,
     "options": ["Yakka tartibdagi uy-joy", "Ko'p qavatli uy xonadoni", "Tijorat obyekti", "Yer uchastkasi"]},
    {"key": "manzil", "label": "Manzil", "type": "text", "required": True},
    {"key": "hujjat_yer_maydoni", "label": "Hujjat bo'yicha umumiy yer maydoni (m²)", "type": "number", "required": True},
    {"key": "amaldagi_yer_maydoni", "label": "Amaldagi yer maydoni (m²)", "type": "number", "required": False},
    {"key": "ozboshimcha_maydon", "label": "O'zboshimcha egallangan yer maydoni (m²)", "type": "number", "required": False},
    {"key": "qurilish_osti_maydoni", "label": "Qurilish osti maydoni (m²)", "type": "number", "required": False},
    {"key": "umumiy_foydali_maydoni", "label": "Umumiy foydali maydoni (m²)", "type": "number", "required": False},
    {"key": "yashash_maydoni", "label": "Yashash maydoni (m²)", "type": "number", "required": False},
    {"key": "mulkdorlar_soni", "label": "Mulkdorlar soni", "type": "number", "required": True},
    {"key": "kadastr_qiymati", "label": "Kadastr qiymati (so'm)", "type": "number", "required": False},
    {"key": "royxatdan_otkazish_sanasi", "label": "Ro'yxatdan o'tkazish sanasi", "type": "date", "required": True},
    {"key": "kochirma_raqami", "label": "Ko'chirma raqami", "type": "text", "required": False},
    {"key": "cheklovlar", "label": "Taqiq va cheklovlar", "type": "list", "required": False,
     "item_fields": CHEKLOV_ITEM_FIELDS},
]

# Diqqat: bu ro'yxat real davreestr.uz saytidagi ko'rinishga moslab TO'LIQ ochiq
# qilingan (kadastr_qiymati ham public), chunki mavjud production tizim ham shu
# maydonlarni avtorizatsiyasiz ko'rsatadi. Bu — mahsulot egasi tomonidan qabul
# qilingan qaror; shaxsiy ma'lumot (subject_name/subject_pinfl) hech qachon
# public javobga chiqmaydi (PublicRecordOut'da umuman yo'q).
PUBLIC_FIELDS = [f["key"] for f in FIELD_SCHEMA]

# Bosh sahifadagi "Elektron xizmatlar" bo'limi uchun boshlang'ich kontent (davreestr.uz'dagi
# xizmatlar ro'yxatiga mos). Admin panel (/admin/content) orqali keyinchalik tahrirlanadi.
SEED_SERVICES = [
    "Ulush kiritish asosida ishtirok etish shartnomasini davlat ro'yhatidan o'tkazish",
    "Obyektning eski kadastr raqamini kiritish orqali yangi kadastr raqamini aniqlash",
    "Ariza va shikoyatlarni ko'rib chiqish xizmati",
    "Kadastr obyektiga taqiqni tekshirish",
    "Ko'p yillik dov-daraxtlarga kadastr pasporti",
    "Ko'chmas mulk ma'lumotlarini tahrirlash uchun ariza berish",
    "Bino va inshootlarni ijara shartnomasini davlat ro'yxatidan o'tkazish",
    "Bino va inshootlarning mansubligi va tarkibi to'g'risida ma'lumotnoma berish",
    "Ko'chmas mulk tarixi haqida ma'lumot olish",
    "Davlat kadastr reyestridan ko'chmas mulk bo'yicha ko'chirmani tekshirish",
    "Shaxsiy uy-joyi to'g'risida ma'lumotnoma",
    "Qurilish-montaj ishlari tugallangan obyektdan foydalanish uchun ruxsatnoma berish",
    "Noturar obyektlarini kadastr pasportini shakllantirish",
    "Turar-joy obyektlariga bo'lgan huquqlarni davlat ro'yxatidan o'tkazishga ariza yuborish",
    "Turar-joy obyektlarini kadastr pasportini shakllantirish",
    "Servitutni ro'yxatdan o'tkazish",
]

SEED_NEWS = [
    ("Andijon viloyatida xatlov jarayonlari yakunlandi", "Rejalashtirilgan xatlov ishlari doirasida hudud bo'yicha ma'lumotlar yangilandi."),
    ("O'zbekiston Respublikasi qonun hujjatlariga oid yangiliklar", "Ko'chmas mulk reyestri sohasidagi qonunchilikka kiritilgan so'nggi o'zgarishlar."),
    ("Rejali profilaktika ishlari", "Tizimda rejalashtirilgan texnik profilaktika ishlari o'tkazildi."),
]

SEED_ANNOUNCEMENTS = [
    ("Ariza qabul qilish tartibi o'zgardi", "Elektron xizmatlar orqali ariza topshirish tartibi bilan tanishib chiqishingizni so'raymiz."),
]


def run(skip_demo_record: bool = False, admin_password: str | None = None):
    password = admin_password or "Demo12345!"
    db = SessionLocal()
    try:
        org = db.query(Organization).filter(Organization.code == "KADASTR").first()
        if not org:
            org = Organization(id=uuid.uuid4(), name="Urbanizatsiya va uy-joy bozori qo'mitasi huzuridagi Kadastr agentligi", code="KADASTR")
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"Tashkilot yaratildi: {org.name}")

        users_to_create = [
            ("superadmin", "SuperAdmin", Role.SUPERADMIN, None),
            ("orgadmin_kadastr", "Kadastr Org Admin", Role.ORG_ADMIN, org.id),
            ("xodim_kadastr", "Kadastr Xodimi", Role.CABINET_EMPLOYEE, org.id),
            ("tasdiqlovchi_kadastr", "Kadastr Mas'ul Shaxsi", Role.CABINET_APPROVER, org.id),
        ]
        created_users = {}
        for username, full_name, role, org_id in users_to_create:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    full_name=full_name,
                    username=username,
                    hashed_password=hash_password(password),
                    role=role,
                    organization_id=org_id,
                    is_active=True,
                    oneid_verified=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"Foydalanuvchi yaratildi: {username}  (role={role.value})")
            created_users[username] = user

        registry_type = db.query(RegistryType).filter(RegistryType.code == "KOCHMAS_MULK").first()
        if registry_type:
            db.query(RegistryRecord).filter(RegistryRecord.registry_type_id == registry_type.id).delete()
            registry_type.field_schema = FIELD_SCHEMA
            registry_type.public_fields = PUBLIC_FIELDS
            db.commit()
            print(f"Reestr turi yangilandi: {registry_type.name}")
        else:
            registry_type = RegistryType(
                id=uuid.uuid4(),
                code="KOCHMAS_MULK",
                name="Ko'chmas mulk obyektlariga bo'lgan huquqlar reestri",
                description="Yakka tartibdagi va ko'p qavatli uy-joylar, tijorat obyektlari, yer uchastkalari reestri",
                organization_id=org.id,
                field_schema=FIELD_SCHEMA,
                public_fields=PUBLIC_FIELDS,
            )
            db.add(registry_type)
            db.commit()
            db.refresh(registry_type)
            print(f"Reestr turi yaratildi: {registry_type.name}")

        superadmin = created_users["superadmin"]
        if not db.query(ContentItem).count():
            now = datetime.now(timezone.utc)
            for i, title in enumerate(SEED_SERVICES):
                db.add(ContentItem(
                    id=uuid.uuid4(), type=ContentType.SERVICE, title=title, description=title,
                    is_published=True, sort_order=i, created_by_id=superadmin.id, published_at=now,
                ))
            for i, (title, desc) in enumerate(SEED_NEWS):
                db.add(ContentItem(
                    id=uuid.uuid4(), type=ContentType.NEWS, title=title, description=desc,
                    is_published=True, sort_order=i, created_by_id=superadmin.id, published_at=now,
                ))
            for i, (title, desc) in enumerate(SEED_ANNOUNCEMENTS):
                db.add(ContentItem(
                    id=uuid.uuid4(), type=ContentType.ANNOUNCEMENT, title=title, description=desc,
                    is_published=True, sort_order=i, created_by_id=superadmin.id, published_at=now,
                ))
            db.commit()
            print(f"Boshlang'ich kontent yaratildi: {len(SEED_SERVICES)} xizmat, {len(SEED_NEWS)} yangilik, {len(SEED_ANNOUNCEMENTS)} e'lon.")

        if skip_demo_record:
            print("Fake demo yozuv o'tkazib yuborildi (--production rejimi).")
            print("\nSeed muvaffaqiyatli yakunlandi.")
            print("Yaratilgan foydalanuvchilar:")
            for username, _, role, _ in users_to_create:
                print(f"  - {username}  ({role.value})")
            return

        approver = created_users["tasdiqlovchi_kadastr"]
        employee = created_users["xodim_kadastr"]

        demo_data = {
            "obyekt_turi": "Yakka tartibdagi uy-joy",
            "manzil": "Toshkent viloyati, Zangiota tumani, Namuna MFY, Bog'bon ko'chasi, 12-uy",
            "hujjat_yer_maydoni": 600,
            "amaldagi_yer_maydoni": 600,
            "ozboshimcha_maydon": 0,
            "qurilish_osti_maydoni": 357.42,
            "umumiy_foydali_maydoni": 267.19,
            "yashash_maydoni": 63.68,
            "mulkdorlar_soni": 1,
            "kadastr_qiymati": 29380197,
            "royxatdan_otkazish_sanasi": "2026-03-26",
            "kochirma_raqami": "1700105/Y-26001234",
            "cheklovlar": [
                {
                    "raqami": "GUZT-50100001",
                    "turi": "Ipoteka",
                    "kim_tomonidan": "Taqiqlar banki",
                    "sana": "2026-05-14",
                    "ijro_raqami": "202601314009001",
                    "almashuv_kodi": "11223344-A",
                },
            ],
        }
        record = RegistryRecord(
            id=uuid.uuid4(),
            registry_type_id=registry_type.id,
            record_number="10:11:22:33:44:5555",
            subject_pinfl="30001010000012",  # demo PINFL, real emas
            subject_name="Demo Foydalanuvchi",
            data=demo_data,
            source_channel="manual",
            created_by_id=employee.id,
            verify_code=generate_verify_code(),
        )
        record.signed_by_id = approver.id
        record.signature_hash = compute_signature_hash(record, approver.id)
        from app.models.registry import RegistryStatus
        record.status = RegistryStatus.ACTIVE
        now = datetime.now(timezone.utc)
        record.signed_at = now
        record.published_at = now

        db.add(record)
        db.commit()
        print(f"Demo yozuv yaratildi va e'lon qilindi: {record.record_number}")

        print("\nSeed muvaffaqiyatli yakunlandi.")
        print("Login ma'lumotlari (barchasi uchun parol: Demo12345!):")
        for username, _, role, _ in users_to_create:
            print(f"  - {username}  ({role.value})")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--production",
        action="store_true",
        help="Fake demo yozuvni yaratmaydi; SEED_PASSWORD environment o'zgaruvchisi majburiy.",
    )
    args = parser.parse_args()

    if args.production:
        env_password = os.environ.get("SEED_PASSWORD")
        if not env_password:
            raise SystemExit(
                "Production seed uchun SEED_PASSWORD environment o'zgaruvchisini kuchli parol bilan belgilang.\n"
                "Masalan: SEED_PASSWORD='...' python -m app.seed --production"
            )
        run(skip_demo_record=True, admin_password=env_password)
    else:
        run()
