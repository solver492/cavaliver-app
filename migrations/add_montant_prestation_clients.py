"""Ajout de la colonne montant dans la table prestation_clients

Revision ID: add_montant_prestation_clients
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Ajout de la colonne montant
    op.add_column('prestation_clients', sa.Column('montant', sa.Float(), nullable=True))

def downgrade():
    # Suppression de la colonne montant
    op.drop_column('prestation_clients', 'montant')
