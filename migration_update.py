import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError, OperationalError
from extensions import db
from app import create_app

def run_migrations():
    """
    Exécute les migrations nécessaires pour ajouter les colonnes de dernière modification
    """
    app = create_app()
    
    with app.app_context():
        print("Démarrage des migrations spécifiques...")
        
        # Liste des migrations à exécuter pour les nouvelles colonnes seulement
        migrations = [
            # Ajout de la colonne derniere_modification_par à la table prestation
            """
            ALTER TABLE prestation 
            ADD COLUMN derniere_modification_par INTEGER
            """,
            
            # Ajout de la colonne date_derniere_modification à la table prestation
            """
            ALTER TABLE prestation 
            ADD COLUMN date_derniere_modification TIMESTAMP
            """
        ]
        
        for migration in migrations:
            try:
                print(f"Exécution de: {migration[:10]}...")
                db.session.execute(text(migration))
                db.session.commit()
                print("Migration réussie!")
            except (ProgrammingError, OperationalError) as e:
                db.session.rollback()
                print(f"Information: {e}")
        
        print("Migrations spécifiques terminées!")

if __name__ == "__main__":
    run_migrations()
