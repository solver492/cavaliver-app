"""
Script de migration pour ajouter les champs statut, date_reponse et commentaire à la table prestation_transporteurs.
"""
import sqlite3
import os

# Chemin vers la base de données
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'instance', 'rcavalier.db')

def upgrade_prestation_transporteurs():
    """Ajouter les colonnes statut, date_reponse et commentaire à la table prestation_transporteurs."""
    try:
        # Connexion à la base de données
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Vérifier si la table existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='prestation_transporteurs'")
        if not cursor.fetchone():
            print("La table prestation_transporteurs n'existe pas encore.")
            return False
        
        # Vérifier si les colonnes existent déjà
        cursor.execute("PRAGMA table_info(prestation_transporteurs)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Ajouter les colonnes si elles n'existent pas
        if 'statut' not in columns:
            cursor.execute("ALTER TABLE prestation_transporteurs ADD COLUMN statut VARCHAR(20) DEFAULT 'en_attente'")
            print("Colonne 'statut' ajoutée à la table prestation_transporteurs.")
            
        if 'date_reponse' not in columns:
            cursor.execute("ALTER TABLE prestation_transporteurs ADD COLUMN date_reponse DATETIME")
            print("Colonne 'date_reponse' ajoutée à la table prestation_transporteurs.")
            
        if 'commentaire' not in columns:
            cursor.execute("ALTER TABLE prestation_transporteurs ADD COLUMN commentaire TEXT")
            print("Colonne 'commentaire' ajoutée à la table prestation_transporteurs.")
            
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Erreur lors de la mise à jour de la table prestation_transporteurs: {str(e)}")
        return False

if __name__ == '__main__':
    upgrade_prestation_transporteurs()
