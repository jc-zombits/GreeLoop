"""Add company rewards fields

Revision ID: 7a3b1c2d4e5f
Revises: 6f1b2c0f1d3a
Create Date: 2025-12-10 12:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a3b1c2d4e5f'
down_revision: Union[str, Sequence[str], None] = '6f1b2c0f1d3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('reward_points', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('companies', sa.Column('reward_tier', sa.String(length=20), nullable=False, server_default='Bronce'))

    op.execute("UPDATE companies SET reward_points = 0 WHERE reward_points IS NULL")
    op.execute("UPDATE companies SET reward_tier = 'Bronce' WHERE reward_tier IS NULL")

    op.alter_column('companies', 'reward_points', server_default=None)
    op.alter_column('companies', 'reward_tier', server_default=None)


def downgrade() -> None:
    op.drop_column('companies', 'reward_tier')
    op.drop_column('companies', 'reward_points')

