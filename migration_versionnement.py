import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError, OperationalError
from extensions import db
from app import create_app

def run_migrations_versionnement():
    """
    Exécute les migrations nécessaires pour ajouter les colonnes de versionnement des prestations
    """
    app = create_app()
    
    with app.app_context():
        print("Démarrage des migrations pour le système de versionnement...")
        
        # Liste des migrations à exécuter pour les nouvelles colonnes de versionnement
        migrations = [
            # Ajout de la colonne version à la table prestation
            """
            ALTER TABLE prestation 
            ADD COLUMN version INTEGER DEFAULT 1
            """,
            
            # Ajout de la colonne id_original à la table prestation
            """
            ALTER TABLE prestation 
            ADD COLUMN id_original INTEGER
            """,
            
            # Ajout de la colonne modifie_par à la table prestation
            """
            ALTER TABLE prestation 
            ADD COLUMN modifie_par INTEGER
            """,
            
            # Ajout de la colonne date_modification à la table prestation
            """
            ALTER TABLE prestation 
            ADD COLUMN date_modification TIMESTAMP
            """
        ]
        
        # Exécution des migrations
        for migration in migrations:
            try:
                print(f"Exécution de: {migration.strip()[:50]}...")
                db.session.execute(text(migration))
                db.session.commit()
                print("Migration réussie!")
            except (ProgrammingError, OperationalError) as e:
                db.session.rollback()
                print(f"Information: {e}")
        
        # Mise à jour des prestations existantes pour initialiser la version
        try:
            print("Initialisation des versions pour les prestations existantes...")
            db.session.execute(text("""
                UPDATE prestation
                SET version = 1
                WHERE version IS NULL
            """))
            db.session.commit()
            print("Initialisation des versions réussie!")
        except (ProgrammingError, OperationalError) as e:
            db.session.rollback()
            print(f"Information: {e}")
            
        print("Migrations pour le système de versionnement terminées!")

def verifier_base_donnees():
    """
    Vérifie l'intégrité de la base de données et effectue les réparations nécessaires
    """
    app = create_app()
    
    with app.app_context():
        print("\nVérification de l'intégrité de la base de données...")
        
        # Vérifier la présence des colonnes de versionnement
        colonnes_requises = [
            "version", "id_original", "modifie_par", "date_modification"
        ]
        
        # Récupérer la structure de la table prestation
        try:
            result = db.session.execute(text("PRAGMA table_info(prestation)")).fetchall()
            
            # Extraire les noms de colonnes
            colonnes_existantes = [row[1] for row in result]
            
            # Vérifier chaque colonne requise
            colonnes_manquantes = []
            for colonne in colonnes_requises:
                if colonne not in colonnes_existantes:
                    colonnes_manquantes.append(colonne)
            
            if colonnes_manquantes:
                print(f"Colonnes manquantes dans la table prestation: {', '.join(colonnes_manquantes)}")
                print("Veuillez exécuter le script de migration.")
            else:
                print("Toutes les colonnes de versionnement sont présentes dans la table prestation.")
                
            # Vérifier la cohérence des données de versionnement
            prestations_sans_version = db.session.execute(text("""
                SELECT COUNT(*) FROM prestation WHERE version IS NULL
            """)).scalar()
            
            if prestations_sans_version > 0:
                print(f"{prestations_sans_version} prestations n'ont pas de numéro de version défini.")
                print("Réparation en cours...")
                
                db.session.execute(text("""
                    UPDATE prestation
                    SET version = 1
                    WHERE version IS NULL
                """))
                db.session.commit()
                print("Réparation terminée!")
            else:
                print("Toutes les prestations ont un numéro de version valide.")
                
        except (ProgrammingError, OperationalError) as e:
            print(f"Erreur lors de la vérification de la structure de la table: {e}")
        
        print("Vérification de l'intégrité terminée!")

if __name__ == "__main__":
    # Exécuter les migrations pour le système de versionnement
    run_migrations_versionnement()
    
    # Vérifier l'intégrité de la base de données
    verifier_base_donnees()
