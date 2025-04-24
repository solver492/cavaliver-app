"""
Script pour initialiser correctement la base de données
"""
from app import app
from extensions import db
from models import *

# Créer toutes les tables dans la base de données
with app.app_context():
    print("Création de toutes les tables dans la base de données...")
    db.create_all()
    print("Tables créées avec succès")

    # Vérification des tables créées
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"Tables dans la base de données: {', '.join(tables)}")

    # Vérification des colonnes dans la table prestation
    if 'prestation' in tables:
        columns = [column['name'] for column in inspector.get_columns('prestation')]
        print(f"Colonnes de la table prestation: {', '.join(columns)}")
    else:
        print("La table prestation n'a pas été créée correctement")

print("Initialisation de la base de données terminée")
