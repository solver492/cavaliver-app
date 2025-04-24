"""
Script de migration pour ajouter le champ statut à la table Notification.
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import sys
import os

# Ajouter le répertoire parent au chemin de recherche Python
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importer l'application
from app import app, db

# Configurer la migration
migrate = Migrate(app, db)

def upgrade():
    """Ajouter la colonne statut à la table notification."""
    with app.app_context():
        # Vérifier si la colonne existe déjà
        from sqlalchemy import text
        result = db.session.execute(text("PRAGMA table_info(notification)"))
        columns = [row[1] for row in result]
        
        if 'statut' not in columns:
            # Ajouter la colonne statut
            db.session.execute(text("ALTER TABLE notification ADD COLUMN statut VARCHAR(50) NOT NULL DEFAULT 'non_lue'"))
            db.session.commit()
            print("Colonne 'statut' ajoutée à la table notification avec succès.")
        else:
            print("La colonne 'statut' existe déjà dans la table notification.")

if __name__ == '__main__':
    upgrade()
