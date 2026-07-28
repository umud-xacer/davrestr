"""add_applications_and_content_image

Revision ID: c1a9f0d3e7b2
Revises: b3122a57b9f8
Create Date: 2026-07-27 06:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'c1a9f0d3e7b2'
down_revision: Union[str, None] = 'b3122a57b9f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('content_items', sa.Column('image_url', sa.String(length=500), nullable=True))

    op.create_table(
        'applications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('service_title', sa.String(length=500), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=32), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column(
            'status',
            sa.Enum('SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'PAID', 'APPROVED', 'REJECTED', name='application_status'),
            nullable=False,
        ),
        sa.Column('admin_note', sa.Text(), nullable=True),
        sa.Column('reviewed_by_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_applications_status'), 'applications', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_applications_status'), table_name='applications')
    op.drop_table('applications')
    sa.Enum(name='application_status').drop(op.get_bind(), checkfirst=True)
    op.drop_column('content_items', 'image_url')
