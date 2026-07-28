"""add_site_settings

Revision ID: e5f1a2b3c4d6
Revises: d4e2b8a5f913
Create Date: 2026-07-28 06:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f1a2b3c4d6'
down_revision: Union[str, None] = 'd4e2b8a5f913'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'site_settings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('maintenance_notice_enabled', sa.Boolean(), nullable=False),
        sa.Column('maintenance_notice_hours', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('site_settings')
