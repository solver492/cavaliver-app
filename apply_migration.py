from app import app, db
from models import Client, User
import sqlite3
import os

def apply_migration():
    with app.app_context():
        # Chemin vers la base de données
        db_path = os.path.join(app.instance_path, 'app.db')
        
        # Connexion directe à SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Vérifier si la colonne existe déjà
            cursor.execute("PRAGMA table_info(client)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'commercial_id' not in columns:
                print("Ajout de la colonne commercial_id...")
                cursor.execute("ALTER TABLE client ADD COLUMN commercial_id INTEGER REFERENCES user(id)")
                
                # Assigner les clients existants à un admin par défaut
                admin = User.query.filter(User.role.in_(['admin', 'superadmin'])).first()
                if admin:
                    cursor.execute("UPDATE client SET commercial_id = ? WHERE commercial_id IS NULL", (admin.id,))
                
                conn.commit()
                print("Migration terminée avec succès!")
            else:
                print("La colonne commercial_id existe déjà.")
                
        except Exception as e:
            conn.rollback()
            print(f"Erreur lors de la migration : {str(e)}")
            raise
        finally:
            conn.close()

if __name__ == '__main__':
    apply_migration()
