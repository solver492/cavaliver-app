
"""Fix agenda-prestation relation

Revision ID: fix_agenda_prestation_relation
Create Date: 2024-04-17 09:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Assurez-vous que la colonne agenda_id existe dans la table prestation
    with op.batch_alter_table('prestation') as batch_op:
        batch_op.alter_column('agenda_id',
                            existing_type=sa.Integer(),
                            nullable=True)
        batch_op.create_foreign_key(
            'fk_prestation_agenda',
            'agenda',
            ['agenda_id'],
            ['id'],
            ondelete='SET NULL'
        )

def downgrade():
    with op.batch_alter_table('prestation') as batch_op:
        batch_op.drop_constraint('fk_prestation_agenda', type_='foreignkey')
