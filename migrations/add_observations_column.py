"""
Script de migration pour ajouter la colonne observations_supplementaires à la table document
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from extensions import db
from models import Document

# Créer une application Flask temporaire
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///cavalier.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialiser les extensions
db.init_app(app)
migrate = Migrate(app, db)

def run_migration():
    """
    Exécute la migration pour ajouter la colonne observations_supplementaires
    """
    with app.app_context():
        # Vérifier si la table document existe
        if not db.engine.dialect.has_table(db.engine, 'document'):
            print("La table document n'existe pas. Création de toutes les tables...")
            db.create_all()
            print("Tables créées avec succès.")
            return
        
        # Vérifier si la colonne existe déjà
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        columns = [column['name'] for column in inspector.get_columns('document')]
        
        if 'observations_supplementaires' in columns:
            print("La colonne observations_supplementaires existe déjà dans la table document.")
            return
        
        # Ajouter la colonne
        print("Ajout de la colonne observations_supplementaires à la table document...")
        db.engine.execute('ALTER TABLE document ADD COLUMN observations_supplementaires TEXT')
        print("Colonne ajoutée avec succès.")

if __name__ == '__main__':
    run_migration()
