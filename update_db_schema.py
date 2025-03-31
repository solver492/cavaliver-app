from app import app, db
import sqlite3
import os
from db_config import get_db_uri

def update_db_schema():
    with app.app_context():
        # Utiliser la même URI de base de données que l'application
        db_uri = get_db_uri()
        
        # Extraire le chemin de la base de données depuis l'URI SQLAlchemy
        # Format: sqlite:///path/to/database.db ou sqlite:////absolute/path/database.db
        if db_uri.startswith('sqlite:////'):
            db_path = db_uri[10:]  # Skip 'sqlite:////'
        else:
            db_path = db_uri[10:]  # Skip 'sqlite:///'
            # Si le chemin n'est pas absolu, le rendre absolu
            if not os.path.isabs(db_path):
                db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), db_path)
        
        print(f"Mise à jour de la base de données: {db_path}")
        
        # Connexion à la base de données SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Vérifier si les colonnes existent déjà
        cursor.execute("PRAGMA table_info(prestation)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Ajouter les colonnes manquantes
        if 'trajet_depart' not in columns:
            print("Ajout de la colonne 'trajet_depart'")
            cursor.execute("ALTER TABLE prestation ADD COLUMN trajet_depart TEXT")
        
        if 'trajet_destination' not in columns:
            print("Ajout de la colonne 'trajet_destination'")
            cursor.execute("ALTER TABLE prestation ADD COLUMN trajet_destination TEXT")
        
        # Sauvegarder les modifications
        conn.commit()
        conn.close()
        
        print("Mise à jour du schéma terminée avec succès!")

if __name__ == "__main__":
    update_db_schema()
