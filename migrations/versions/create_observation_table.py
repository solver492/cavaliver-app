"""Create observation table

Revision ID: create_observation_table
Revises: 1d303b78b865
Create Date: 2025-05-03 22:14:10.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision = 'create_observation_table'
down_revision = '1d303b78b865'
branch_labels = None
depends_on = None


def upgrade():
    # Créer la nouvelle table observation_evenement
    op.create_table('observation_evenement',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('evenement_id', sa.Integer(), nullable=False),
        sa.Column('contenu', sa.Text(), nullable=False),
        sa.Column('date_creation', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['evenement_id'], ['evenement.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Créer un index pour accélérer les recherches par evenement_id
    op.create_index(op.f('ix_observation_evenement_evenement_id'), 'observation_evenement', ['evenement_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_observation_evenement_evenement_id'), table_name='observation_evenement')
    op.drop_table('observation_evenement')
