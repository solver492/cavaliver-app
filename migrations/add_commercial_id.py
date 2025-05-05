"""Ajout de la relation commercial_id dans la table client

Revision ID: add_commercial_id
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_commercial_id'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Ajout de la colonne commercial_id
    op.add_column('client', sa.Column('commercial_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_client_commercial',
        'client', 'user',
        ['commercial_id'], ['id']
    )

def downgrade():
    # Suppression de la colonne commercial_id
    op.drop_constraint('fk_client_commercial', 'client', type_='foreignkey')
    op.drop_column('client', 'commercial_id')
