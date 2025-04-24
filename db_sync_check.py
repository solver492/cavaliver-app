#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script de vérification et correction de la synchronisation entre les modèles Python et la structure de la base de données
"""

import os
import sys
import logging
import sqlite3
from datetime import datetime

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("DB_SYNC_CHECK")

# Importer les dépendances de l'application
from app import create_app, db
from models import *  # Importer tous les modèles pour pouvoir les inspecter

app = create_app()

def get_db_tables_info():
    """Récupère les informations sur les tables de la base de données SQLite"""
    db_path = app.config.get('SQLALCHEMY_DATABASE_URI').replace('sqlite:///', '')
    
    if not os.path.exists(db_path):
        logger.error(f"Base de données non trouvée: {db_path}")
        return None
    
    logger.info(f"Connexion à la base de données: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Récupérer la liste des tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = cursor.fetchall()
    
    tables_info = {}
    for table in tables:
        table_name = table[0]
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        tables_info[table_name] = columns
    
    conn.close()
    return tables_info

def get_model_info():
    """Extrait les informations sur les modèles Python définis dans l'application"""
    models_info = {}
    
    # Parcourir tous les attributs du module models
    import models
    for attr_name in dir(models):
        attr = getattr(models, attr_name)
        
        # Vérifier si c'est une classe et si c'est un modèle SQLAlchemy
        if isinstance(attr, type) and hasattr(attr, '__tablename__'):
            table_name = attr.__tablename__
            if not table_name:
                # Si __tablename__ n'est pas défini explicitement, SQLAlchemy utilise le nom de la classe en minuscules
                table_name = attr.__name__.lower()
            
            # Récupérer les colonnes du modèle
            columns = {}
            for key, column in attr.__dict__.items():
                if isinstance(column, db.Column):
                    columns[key] = column
            
            models_info[table_name] = {
                'model': attr,
                'columns': columns
            }
    
    return models_info

def check_db_sync():
    """Vérifie la synchronisation entre les modèles Python et la structure de la base de données"""
    with app.app_context():
        # Récupérer les informations de la base de données et des modèles
        db_tables = get_db_tables_info()
        models_info = get_model_info()
        
        if not db_tables:
            logger.error("Impossible de récupérer les informations de la base de données")
            return False
        
        # Vérifier que toutes les tables définies dans les modèles existent dans la base de données
        missing_tables = []
        for table_name in models_info:
            if table_name not in db_tables:
                missing_tables.append(table_name)
        
        if missing_tables:
            logger.error(f"Tables manquantes dans la base de données: {', '.join(missing_tables)}")
        else:
            logger.info("Toutes les tables définies dans les modèles existent dans la base de données.")
        
        # Vérifier les colonnes pour chaque table
        column_issues = []
        
        # Pour chaque table dans la base de données
        for table_name, table_columns in db_tables.items():
            # Si la table correspond à un modèle
            if table_name in models_info:
                model_info = models_info[table_name]
                
                # Créer un dictionnaire des colonnes de la base de données
                db_column_names = [col[1] for col in table_columns]  # col[1] est le nom de la colonne
                
                # Colonnes du modèle Python qui ne sont pas dans la base de données
                model_columns = []
                for attr_name, attr in model_info['model'].__dict__.items():
                    if isinstance(attr, db.Column):
                        if hasattr(attr, 'name') and attr.name:
                            model_columns.append(attr.name)
                        else:
                            model_columns.append(attr_name)
                
                # Trouver les colonnes qui sont dans le modèle mais pas dans la base de données
                for col_name in model_columns:
                    if col_name.startswith('_'):  # Ignorer les attributs privés
                        continue
                    if col_name not in db_column_names:
                        column_issues.append(f"Colonne '{col_name}' du modèle '{table_name}' manquante dans la base de données")
                
                # Trouver les colonnes qui sont dans la base de données mais pas dans le modèle
                for col_name in db_column_names:
                    if col_name not in model_columns and col_name != 'id':  # Ignorer la colonne id qui est souvent gérée automatiquement
                        column_issues.append(f"Colonne '{col_name}' dans la base de données mais absente du modèle '{table_name}'")
        
        if column_issues:
            logger.error("Problèmes de synchronisation des colonnes détectés:")
            for issue in column_issues:
                logger.error(f"  - {issue}")
        else:
            logger.info("Toutes les colonnes des modèles sont correctement synchronisées avec la base de données.")
        
        # Retourner True si aucun problème n'a été détecté
        return not (missing_tables or column_issues)

def create_migration_script(issues):
    """Crée un script de migration pour résoudre les problèmes de synchronisation"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"migration_{timestamp}.py"
    
    with open(filename, 'w') as f:
        f.write(f"""#!/usr/bin/env python
# -*- coding: utf-8 -*-

\"\"\"
Script de migration généré automatiquement pour résoudre les problèmes de synchronisation
Date de création: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
\"\"\"

from app import create_app, db
import sqlite3
import os

app = create_app()

def run_migration():
    \"\"\"Exécute les opérations de migration pour corriger les problèmes de synchronisation\"\"\"
    print("Exécution de la migration pour synchroniser la base de données...")
    
    # Connexion à la base de données
    db_path = app.config.get('SQLALCHEMY_DATABASE_URI').replace('sqlite:///', '')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Début de la transaction
        cursor.execute("BEGIN TRANSACTION;")
        
        # Liste des opérations à effectuer
        operations = [
            # Les opérations seront ajoutées ici
        ]
        
        # Exécuter les opérations
        for operation in operations:
            try:
                print(f"Exécution: {operation}")
                cursor.execute(operation)
            except Exception as e:
                print(f"Erreur lors de l'exécution de: {operation}")
                print(f"Détail: {e}")
                raise
        
        # Valider les modifications
        conn.commit()
        print("Migration terminée avec succès")
        
    except Exception as e:
        # En cas d'erreur, annuler les modifications
        conn.rollback()
        print(f"Erreur lors de la migration: {e}")
        raise
    finally:
        # Fermer la connexion
        conn.close()

if __name__ == "__main__":
    with app.app_context():
        run_migration()
""")
    
    logger.info(f"Script de migration créé: {filename}")
    return filename

def main():
    """Fonction principale du script"""
    logger.info("Démarrage de la vérification de synchronisation de la base de données...")
    
    with app.app_context():
        # Vérifier la synchronisation
        is_synced = check_db_sync()
        
        if is_synced:
            logger.info("La base de données est correctement synchronisée avec les modèles Python.")
        else:
            logger.warning("Des problèmes de synchronisation ont été détectés. Un script de migration doit être créé.")
            filename = create_migration_script([])  # TODO: Passer les problèmes détectés
            logger.info(f"Veuillez éditer le script de migration '{filename}' pour ajouter les opérations nécessaires.")

if __name__ == "__main__":
    main()
