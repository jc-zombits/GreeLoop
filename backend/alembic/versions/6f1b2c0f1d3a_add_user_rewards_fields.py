"""Add user rewards fields

Revision ID: 6f1b2c0f1d3a
Revises: 2626bc3e4cf2
Create Date: 2025-12-10 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f1b2c0f1d3a'
down_revision: Union[str, Sequence[str], None] = '2626bc3e4cf2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('reward_points', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('reward_tier', sa.String(length=20), nullable=False, server_default='Bronce'))

    op.execute("UPDATE users SET reward_points = 0 WHERE reward_points IS NULL")
    op.execute("UPDATE users SET reward_tier = 'Bronce' WHERE reward_tier IS NULL")

    op.alter_column('users', 'reward_points', server_default=None)
    op.alter_column('users', 'reward_tier', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'reward_tier')
    op.drop_column('users', 'reward_points')

