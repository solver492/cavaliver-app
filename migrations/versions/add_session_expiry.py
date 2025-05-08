
"""Add session_expiry column to user table

Revision ID: add_session_expiry
Revises: None
Create Date: 2024-05-08
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Ajouter la colonne session_expiry à la table user
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('session_expiry', sa.DateTime(), nullable=True))

def downgrade():
    # Supprimer la colonne session_expiry de la table user
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('session_expiry')
