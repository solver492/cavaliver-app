
from alembic import op
import sqlalchemy as sa

revision = '2d404b78c965'
down_revision = '79fd06475ab1'  # ID de la dernière migration
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('prestation', sa.Column('agenda_id', sa.Integer(), sa.ForeignKey('agenda.id'), nullable=True))

def downgrade():
    op.drop_column('prestation', 'agenda_id')
