"""
Script de migration pour ajouter le champ statut à la table Notification.
"""
import sqlite3
import os

# Chemin vers la base de données
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'instance', 'rcavalier.db')

def add_statut_column():
    """Ajouter la colonne statut à la table notification."""
    try:
        # Connexion à la base de données
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Vérifier si la colonne existe déjà
        cursor.execute("PRAGMA table_info(notification)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'statut' not in columns:
            # Ajouter la colonne statut
            cursor.execute("ALTER TABLE notification ADD COLUMN statut VARCHAR(50) NOT NULL DEFAULT 'non_lue'")
            conn.commit()
            print("Colonne 'statut' ajoutée à la table notification avec succès.")
        else:
            print("La colonne 'statut' existe déjà dans la table notification.")
            
        # Fermer la connexion
        conn.close()
        return True
    except Exception as e:
        print(f"Erreur lors de l'ajout de la colonne 'statut': {str(e)}")
        return False

if __name__ == '__main__':
    add_statut_column()
