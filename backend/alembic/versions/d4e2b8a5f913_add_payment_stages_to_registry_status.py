"""add_payment_stages_to_registry_status

Revision ID: d4e2b8a5f913
Revises: c1a9f0d3e7b2
Create Date: 2026-07-27 09:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd4e2b8a5f913'
down_revision: Union[str, None] = 'c1a9f0d3e7b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE registry_status ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING' AFTER 'DRAFT'")
    op.execute("ALTER TYPE registry_status ADD VALUE IF NOT EXISTS 'PAID' AFTER 'PAYMENT_PENDING'")


def downgrade() -> None:
    # Postgres enum qiymatlarini olib tashlab bo'lmaydi (faqat qo'shish mumkin) —
    # downgrade uchun butun enum turini qayta yaratish kerak bo'lardi, bu yerda amalga oshirilmagan.
    pass
