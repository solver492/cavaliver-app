
"""Remove agenda_id from document table

Revision ID: remove_agenda_id_document
Create Date: 2024-04-16 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Supprimer la colonne agenda_id de la table document
    with op.batch_alter_table('document') as batch_op:
        batch_op.drop_column('agenda_id')

def downgrade():
    # Recréer la colonne agenda_id si nécessaire
    with op.batch_alter_table('document') as batch_op:
        batch_op.add_column(sa.Column('agenda_id', sa.Integer(), nullable=True))
