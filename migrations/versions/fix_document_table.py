
"""Fix document table

Revision ID: fix_document_table
Create Date: 2024-04-16 07:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Supprimer la colonne agenda_id si elle existe
    try:
        op.drop_column('document', 'agenda_id')
    except:
        pass

def downgrade():
    # Ajouter la colonne agenda_id
    op.add_column('document',
        sa.Column('agenda_id', sa.Integer(), nullable=True)
    )
