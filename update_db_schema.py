from app import app, db
import sqlite3
import os
from db_config import get_db_uri
from sqlalchemy import text

def update_db_schema():
    with app.app_context():
        # Utiliser la même URI de base de données que l'application
        db_uri = get_db_uri()
        
        # Extraire le chemin de la base de données depuis l'URI SQLAlchemy
        if db_uri.startswith('sqlite:////'):
            db_path = db_uri[10:]  # Skip 'sqlite:////'
        else:
            db_path = db_uri[10:]  # Skip 'sqlite:///'
            # Si le chemin n'est pas absolu, le rendre absolu
            if not os.path.isabs(db_path):
                db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), db_path)
        
        print(f"Mise à jour de la base de données: {db_path}")
        
        # Utiliser directement la connexion Flask-SQLAlchemy
        engine = db.engine
        conn = engine.connect()
        
        try:
            # Vérifier si les colonnes existent déjà en utilisant SQLAlchemy
            inspector = db.inspect(engine)
            columns = [column['name'] for column in inspector.get_columns('prestation')]
            
            # Ajouter les colonnes manquantes en utilisant SQLAlchemy
            if 'trajet_depart' not in columns:
                print("Ajout de la colonne 'trajet_depart'")
                conn.execute(text("ALTER TABLE prestation ADD COLUMN trajet_depart TEXT"))
            
            if 'trajet_destination' not in columns:
                print("Ajout de la colonne 'trajet_destination'")
                conn.execute(text("ALTER TABLE prestation ADD COLUMN trajet_destination TEXT"))
            
            # Valider les modifications
            conn.commit()
            print("Mise à jour du schéma terminée avec succès!")
        except Exception as e:
            print(f"Erreur lors de la mise à jour du schéma: {e}")
            # En cas d'erreur, on va recréer la table prestation complètement
            print("Tentative de correction en recréant la table prestation...")
            try:
                # Créer une table temporaire avec la structure correcte
                conn.execute(text("""
                CREATE TABLE prestation_new (
                    id INTEGER PRIMARY KEY,
                    client_id INTEGER REFERENCES client(id),
                    date_debut DATETIME,
                    date_fin DATETIME,
                    adresse_depart TEXT,
                    adresse_arrivee TEXT,
                    trajet_depart TEXT,
                    trajet_destination TEXT,
                    observation TEXT,
                    statut VARCHAR(20) DEFAULT 'en attente',
                    requires_packaging BOOLEAN DEFAULT 0,
                    demenagement_type VARCHAR(50),
                    camion_type VARCHAR(100),
                    priorite INTEGER DEFAULT 0,
                    societe VARCHAR(100),
                    montant FLOAT,
                    tags TEXT,
                    created_by_id INTEGER NOT NULL REFERENCES user(id),
                    id_user_commercial INTEGER REFERENCES user(id),
                    planning_id INTEGER REFERENCES planning(id),
                    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                    archived BOOLEAN DEFAULT 0
                )
                """))
                
                # Copier les données de l'ancienne table à la nouvelle
                conn.execute(text("""
                INSERT INTO prestation_new (
                    id, client_id, date_debut, date_fin, adresse_depart, adresse_arrivee,
                    observation, statut, requires_packaging, demenagement_type, camion_type,
                    priorite, societe, montant, tags, created_by_id, id_user_commercial,
                    planning_id, date_creation, archived
                )
                SELECT id, client_id, date_debut, date_fin, adresse_depart, adresse_arrivee,
                    observation, statut, requires_packaging, demenagement_type, camion_type,
                    priorite, societe, montant, tags, created_by_id, id_user_commercial,
                    planning_id, date_creation, archived
                FROM prestation
                """))
                
                # Supprimer l'ancienne table et renommer la nouvelle
                conn.execute(text("DROP TABLE prestation"))
                conn.execute(text("ALTER TABLE prestation_new RENAME TO prestation"))
                
                # Valider les modifications
                conn.commit()
                print("Recréation de la table prestation terminée avec succès!")
            except Exception as e2:
                print(f"Erreur lors de la recréation de la table: {e2}")
        finally:
            conn.close()

if __name__ == "__main__":
    update_db_schema()
