"""
Script pour créer la table EvenementVersion dans la base de données.
"""
import os
import sys
from sqlalchemy import text
from flask import Flask
from extensions import db

# Ajouter le répertoire parent au chemin Python pour pouvoir importer app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Importer l'application Flask
from app import app
from models import EvenementVersion

def create_evenement_version_table():
    """Crée la table EvenementVersion dans la base de données."""
    try:
        with app.app_context():
            # Vérifier si la table existe déjà
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'evenement_version' not in tables:
                print("Création de la table evenement_version...")
                # Créer la table en utilisant le modèle
                db.create_all(tables=[EvenementVersion.__table__])
                print("Table evenement_version créée avec succès.")
            else:
                print("La table evenement_version existe déjà.")
                
            print("Opération terminée avec succès.")
    except Exception as e:
        print(f"Erreur lors de la création de la table: {str(e)}")
        db.session.rollback()

if __name__ == "__main__":
    create_evenement_version_table()
