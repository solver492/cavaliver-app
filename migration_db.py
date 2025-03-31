import os
import sys
from app import app, db
import sqlite3

def run_migration():
    print("Début de la migration de la base de données...")
    
    try:
        # Utiliser le contexte de l'application pour accéder à la base de données
        with app.app_context():
            # Connexion directe à SQLite pour exécuter des commandes ALTER TABLE
            conn = sqlite3.connect('demenage.db')
            cursor = conn.cursor()
            
            # Ajouter les colonnes manquantes à la table prestation_transporter
            print("Ajout des colonnes à la table prestation_transporter...")
            
            # Vérifier si les colonnes existent déjà
            columns = [col[1] for col in cursor.execute('PRAGMA table_info(prestation_transporter)').fetchall()]
            
            # Ajouter statut s'il n'existe pas
            if 'statut' not in columns:
                cursor.execute('ALTER TABLE prestation_transporter ADD COLUMN statut VARCHAR(20) DEFAULT "en_attente"')
                print("- Colonne 'statut' ajoutée")
            
            # Ajouter date_assignation s'il n'existe pas
            if 'date_assignation' not in columns:
                cursor.execute('ALTER TABLE prestation_transporter ADD COLUMN date_assignation DATETIME DEFAULT CURRENT_TIMESTAMP')
                print("- Colonne 'date_assignation' ajoutée")
            
            # Ajouter date_acceptation s'il n'existe pas
            if 'date_acceptation' not in columns:
                cursor.execute('ALTER TABLE prestation_transporter ADD COLUMN date_acceptation DATETIME')
                print("- Colonne 'date_acceptation' ajoutée")
            
            # Ajouter date_refus s'il n'existe pas
            if 'date_refus' not in columns:
                cursor.execute('ALTER TABLE prestation_transporter ADD COLUMN date_refus DATETIME')
                print("- Colonne 'date_refus' ajoutée")
            
            # Ajouter date_finalisation s'il n'existe pas
            if 'date_finalisation' not in columns:
                cursor.execute('ALTER TABLE prestation_transporter ADD COLUMN date_finalisation DATETIME')
                print("- Colonne 'date_finalisation' ajoutée")
            
            # Si l'ancienne colonne status existe, copier ses valeurs dans la nouvelle colonne statut
            if 'status' in columns:
                cursor.execute('UPDATE prestation_transporter SET statut = status WHERE status IS NOT NULL')
                print("- Valeurs de 'status' copiées dans 'statut'")
            
            # Si l'ancienne colonne date_assigned existe, copier ses valeurs dans la nouvelle colonne date_assignation
            if 'date_assigned' in columns:
                cursor.execute('UPDATE prestation_transporter SET date_assignation = date_assigned WHERE date_assigned IS NOT NULL')
                print("- Valeurs de 'date_assigned' copiées dans 'date_assignation'")
            
            # Enregistrer les modifications
            conn.commit()
            conn.close()
            
            print("Migration terminée avec succès!")
            return True
            
    except Exception as e:
        print(f"Erreur lors de la migration: {str(e)}")
        return False

if __name__ == "__main__":
    run_migration()
