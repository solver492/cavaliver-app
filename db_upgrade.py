from app import app, db
from models import Prestation
import sqlalchemy as sa
from sqlalchemy import create_engine
from sqlalchemy.schema import CreateTable

"""
Script pour mettre à jour la structure de la base de données.
Ce script ajoute la colonne 'archived' à la table 'prestation' si elle n'existe pas.
"""

def add_archived_column():
    with app.app_context():
        # Vérifier si la colonne existe déjà
        engine = db.engine
        inspector = sa.inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('prestation')]
        
        if 'archived' not in columns:
            print("Ajout de la colonne 'archived' à la table 'prestation'...")
            # Pour SQLite, nous devons utiliser une approche spécifique pour ajouter une colonne
            with engine.begin() as conn:
                conn.execute(sa.text("ALTER TABLE prestation ADD COLUMN archived BOOLEAN DEFAULT FALSE"))
            print("Colonne 'archived' ajoutée avec succès!")
        else:
            print("La colonne 'archived' existe déjà dans la table 'prestation'.")

if __name__ == '__main__':
    add_archived_column()
    print("Mise à jour de la base de données terminée.")
