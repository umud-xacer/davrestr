"""add_content_items

Revision ID: b3122a57b9f8
Revises: 967ac3945387
Create Date: 2026-07-24 10:24:55.122775

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3122a57b9f8'
down_revision: Union[str, None] = '967ac3945387'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'content_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('type', sa.Enum('NEWS', 'SERVICE', 'ANNOUNCEMENT', name='content_type'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_by_id', sa.UUID(), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_content_items_type'), 'content_items', ['type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_content_items_type'), table_name='content_items')
    op.drop_table('content_items')
    sa.Enum(name='content_type').drop(op.get_bind(), checkfirst=True)
