import sqlite3
import os

def apply_migration():
    # Chemin vers la base de données
    db_path = os.path.join('instance', 'app.db')
    
    # Connexion directe à SQLite
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Vérifier si la colonne existe déjà
        cursor.execute("PRAGMA table_info(prestation_clients)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'montant' not in columns:
            print("Ajout de la colonne montant...")
            cursor.execute("ALTER TABLE prestation_clients ADD COLUMN montant FLOAT")
            conn.commit()
            print("Migration terminée avec succès!")
        else:
            print("La colonne montant existe déjà.")
            
    except Exception as e:
        conn.rollback()
        print(f"Erreur lors de la migration : {str(e)}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    apply_migration()
