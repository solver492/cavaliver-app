
from alembic import op
import sqlalchemy as sa
from datetime import datetime

revision = '79fd06475ab1'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('agenda',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nom', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_agenda', sa.String(50), nullable=False),
        sa.Column('date_creation', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('vehicule_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['vehicule_id'], ['vehicules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('agenda')
