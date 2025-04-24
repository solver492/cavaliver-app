
"""fix agenda tables

Revision ID: fix_agenda_tables
Revises: None
Create Date: 2024-04-16 04:55:00.000000

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Ensure agenda table exists and has correct columns
    op.create_table('agenda',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nom', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_agenda', sa.String(50), nullable=False),
        sa.Column('couleur', sa.String(7), nullable=False, server_default="#3498db"),
        sa.Column('date_creation', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('vehicule_id', sa.Integer(), nullable=True),
        sa.Column('observations', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.ForeignKeyConstraint(['vehicule_id'], ['vehicules.id']),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('agenda')
