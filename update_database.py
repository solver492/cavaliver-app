"""
Script pour mettre à jour la structure de la base de données
et corriger les problèmes liés aux prestations et aux transporteurs
"""

from flask import Flask
from extensions import db
from models import *
import os
import json
import logging
from datetime import datetime
from sqlalchemy import text, inspect

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Créer une application Flask minimale pour le contexte
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cavalier.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def check_if_table_exists(table_name):
    """Vérifie si une table existe dans la base de données"""
    with app.app_context():
        inspector = inspect(db.engine)
        return table_name in inspector.get_table_names()

def check_if_column_exists(table_name, column_name):
    """Vérifie si une colonne existe dans une table"""
    with app.app_context():
        inspector = inspect(db.engine)
        columns = [c['name'] for c in inspector.get_columns(table_name)]
        return column_name in columns

def create_missing_tables():
    """Crée les tables manquantes"""
    with app.app_context():
        # Vérifier et créer la table prestation_clients si elle n'existe pas
        if not check_if_table_exists('prestation_clients'):
            logger.info("Création de la table prestation_clients...")
            with db.engine.connect() as conn:
                conn.execute(text("""
                CREATE TABLE prestation_clients (
                    prestation_id INTEGER NOT NULL,
                    client_id INTEGER NOT NULL,
                    PRIMARY KEY (prestation_id, client_id),
                    FOREIGN KEY(prestation_id) REFERENCES prestation (id),
                    FOREIGN KEY(client_id) REFERENCES client (id)
                )
                """))
                conn.commit()
            logger.info("Table prestation_clients créée avec succès")
            
        # Vérifier et créer la table prestation_version si elle n'existe pas
        if not check_if_table_exists('prestation_version'):
            logger.info("Création de la table prestation_version...")
            with db.engine.connect() as conn:
                conn.execute(text("""
                CREATE TABLE prestation_version (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    prestation_id INTEGER NOT NULL,
                    version INTEGER NOT NULL,
                    donnees TEXT NOT NULL,
                    modifie_par INTEGER,
                    date_modification DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(prestation_id) REFERENCES prestation (id),
                    FOREIGN KEY(modifie_par) REFERENCES user (id)
                )
                """))
                conn.commit()
            logger.info("Table prestation_version créée avec succès")

def migrate_clients_supplementaires():
    """Migre les données de clients_supplementaires vers la table prestation_clients"""
    with app.app_context():
        prestations = Prestation.query.filter(Prestation.est_groupage == True, Prestation.clients_supplementaires != None).all()
        
        count = 0
        for prestation in prestations:
            try:
                # Convertir la chaîne clients_supplementaires en liste d'IDs
                if prestation.clients_supplementaires:
                    client_ids = [int(id.strip()) for id in prestation.clients_supplementaires.split(',') if id.strip()]
                    
                    # Insérer les relations dans la table prestation_clients
                    for client_id in client_ids:
                        # Vérifier si le client existe
                        client = Client.query.get(client_id)
                        if client:
                            # Vérifier si la relation existe déjà
                            exists = db.session.query(prestation_clients).filter_by(
                                prestation_id=prestation.id, client_id=client_id).count() > 0
                            
                            if not exists:
                                with db.engine.connect() as conn:
                                    conn.execute(text(f"""
                                        INSERT INTO prestation_clients (prestation_id, client_id)
                                        VALUES ({prestation.id}, {client_id})
                                    """))
                                    conn.commit()
                                    count += 1
            except Exception as e:
                logger.error(f"Erreur lors de la migration des clients pour la prestation {prestation.id}: {e}")
        
        # Après la migration, on peut supprimer la colonne clients_supplementaires
        # (Facultatif, car cela pourrait nécessiter une restructuration plus complexe de la table)
        logger.info(f"Migration des clients supplémentaires terminée. {count} relations créées.")

def backup_prestations():
    """Crée une copie de sauvegarde des prestations actuelles"""
    with app.app_context():
        prestations = Prestation.query.all()
        backup_data = []
        
        for prestation in prestations:
            # Créer un dictionnaire avec toutes les données de la prestation
            prestation_data = {column.name: getattr(prestation, column.name) 
                              for column in prestation.__table__.columns}
            
            # Convertir les objets datetime en chaînes
            for key, value in prestation_data.items():
                if isinstance(value, datetime):
                    prestation_data[key] = value.isoformat()
            
            backup_data.append(prestation_data)
        
        # Sauvegarder dans un fichier JSON
        with open('prestations_backup.json', 'w') as f:
            json.dump(backup_data, f, indent=4)
        
        logger.info(f"Sauvegarde de {len(backup_data)} prestations effectuée")

def create_prestation_versions():
    """Crée des versions pour toutes les prestations existantes"""
    with app.app_context():
        if check_if_table_exists('prestation_version'):
            prestations = Prestation.query.all()
            count = 0
            
            for prestation in prestations:
                try:
                    # Vérifier si une version existe déjà
                    existing = PrestationVersion.query.filter_by(prestation_id=prestation.id).first()
                    if not existing:
                        # Créer un dictionnaire avec toutes les données de la prestation
                        prestation_data = {column.name: str(getattr(prestation, column.name)) 
                                        for column in prestation.__table__.columns}
                        
                        # Supprimer les données qui ne sont pas nécessaires
                        for key in ['id', 'date_creation', 'date_modification']:
                            if key in prestation_data:
                                del prestation_data[key]
                        
                        # Créer la version
                        version = PrestationVersion(
                            prestation_id=prestation.id,
                            version=1,
                            donnees=json.dumps(prestation_data),
                            date_modification=datetime.utcnow()
                        )
                        db.session.add(version)
                        count += 1
                except Exception as e:
                    logger.error(f"Erreur lors de la création de la version pour la prestation {prestation.id}: {e}")
            
            db.session.commit()
            logger.info(f"Création de {count} versions de prestations effectuée")

def update_database():
    """Fonction principale pour mettre à jour la base de données"""
    try:
        logger.info("Début de la mise à jour de la base de données...")
        
        # Faire une sauvegarde des données actuelles
        backup_prestations()
        
        # Créer les tables manquantes
        create_missing_tables()
        
        # Migrer les données clients supplémentaires
        migrate_clients_supplementaires()
        
        # Créer des versions pour les prestations existantes
        create_prestation_versions()
        
        logger.info("Mise à jour de la base de données terminée avec succès!")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de la base de données: {e}")
        return False

if __name__ == "__main__":
    update_database()
