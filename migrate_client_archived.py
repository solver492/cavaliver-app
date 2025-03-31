import sqlite3
import os
from datetime import datetime

# Fichier de la base de données
DB_FILE = 'demenage.db'

def migrate_client_table():
    """
    Ajoute la colonne 'archived' à la table client
    """
    if not os.path.exists(DB_FILE):
        print(f"Le fichier de base de données {DB_FILE} n'existe pas.")
        return False
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Vérifier si la colonne existe déjà
        cursor.execute("PRAGMA table_info(client)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        if 'archived' not in column_names:
            print("Ajout de la colonne 'archived' à la table client...")
            cursor.execute("ALTER TABLE client ADD COLUMN archived BOOLEAN DEFAULT 0")
            conn.commit()
            print("Colonne 'archived' ajoutée avec succès!")
        else:
            print("La colonne 'archived' existe déjà dans la table client.")
        
        return True
    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print(f"Migration de la base de données {DB_FILE} démarrée à {datetime.now()}")
    success = migrate_client_table()
    print(f"Migration terminée à {datetime.now()}, Succès: {success}")
