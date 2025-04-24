"""
Script de migration pour ajouter la colonne agenda_id à la table document.
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

def add_agenda_id_column():
    """Ajoute la colonne agenda_id à la table document."""
    try:
        with app.app_context():
            # Vérifier si la colonne existe déjà
            inspector = db.inspect(db.engine)
            columns = [column['name'] for column in inspector.get_columns('document')]
            
            if 'agenda_id' not in columns:
                print("Ajout de la colonne agenda_id à la table document...")
                # Utiliser text() pour exécuter du SQL brut
                db.session.execute(text("ALTER TABLE document ADD COLUMN agenda_id INTEGER REFERENCES agenda(id)"))
                db.session.commit()
                print("Colonne agenda_id ajoutée avec succès.")
            else:
                print("La colonne agenda_id existe déjà dans la table document.")
                
            print("Migration terminée avec succès.")
    except Exception as e:
        print(f"Erreur lors de la migration: {str(e)}")
        db.session.rollback()

if __name__ == "__main__":
    add_agenda_id_column()
