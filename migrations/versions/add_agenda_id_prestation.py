
"""Add agenda_id to prestation table

Revision ID: add_agenda_id_prestation
Create Date: 2024-04-16 10:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Ajouter la colonne agenda_id
    with op.batch_alter_table('prestation') as batch_op:
        batch_op.add_column(sa.Column('agenda_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_prestation_agenda', 'agenda', ['agenda_id'], ['id'])

def downgrade():
    # Supprimer la colonne agenda_id
    with op.batch_alter_table('prestation') as batch_op:
        batch_op.drop_constraint('fk_prestation_agenda', type_='foreignkey')
        batch_op.drop_column('agenda_id')
