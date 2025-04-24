"""Add agenda sharing table

Revision ID: add_agenda_sharing
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Création de la table de partage d'agenda
    op.create_table('agenda_partage',
        sa.Column('agenda_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date_partage', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['agenda_id'], ['agenda.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('agenda_id', 'user_id')
    )

def downgrade():
    op.drop_table('agenda_partage')
