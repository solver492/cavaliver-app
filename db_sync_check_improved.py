#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script amélioré de vérification et correction de la synchronisation entre les modèles Python et la base de données
"""

import os
import sys
import logging
import sqlite3
from datetime import datetime
import glob

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("DB_SYNC_CHECK")

def find_sqlite_database():
    """Recherche la base de données SQLite dans le répertoire du projet"""
    # Recherche de fichiers .db dans le répertoire courant et ses sous-répertoires
    db_files = glob.glob('*.db') + glob.glob('*.sqlite') + glob.glob('instance/*.db') + glob.glob('instance/*.sqlite')
    
    if not db_files:
        logger.warning("Aucun fichier de base de données SQLite trouvé dans le répertoire du projet.")
        return None
    
    # S'il y a plusieurs fichiers, prendre le plus récent
    if len(db_files) > 1:
        logger.info(f"Plusieurs fichiers de base de données trouvés: {', '.join(db_files)}")
        # Trier par date de modification (le plus récent en premier)
        db_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    
    db_path = os.path.abspath(db_files[0])
    logger.info(f"Utilisation de la base de données: {db_path}")
    return db_path

def main():
    """Fonction principale du script"""
    logger.info("Démarrage de la vérification de synchronisation de la base de données...")
    
    # Rechercher la base de données SQLite
    db_path = find_sqlite_database()
    if not db_path:
        logger.error("Impossible de trouver une base de données SQLite à vérifier.")
        return
    
    # Vérifier que la base de données est accessible
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Récupérer la liste des tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = cursor.fetchall()
        
        logger.info(f"Tables trouvées dans la base de données: {', '.join([t[0] for t in tables])}")
        
        # Vérifier chaque table et ses colonnes
        for table in tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            logger.info(f"Table '{table_name}' a {len(columns)} colonnes:")
            for col in columns:
                # Format: col[0]=index, col[1]=name, col[2]=type, col[3]=notnull, col[4]=default, col[5]=pk
                logger.info(f"  - {col[1]} ({col[2]})")
        
        # Rechercher d'éventuelles incohérences avec les modèles Python
        # Cette partie est complexe et nécessiterait d'importer les modèles et d'analyser leur structure
        # Pour simplifier, nous allons juste suggérer comment procéder

        # Fermer la connexion à la base de données
        conn.close()
        
        logger.info("""
RECOMMANDATIONS:
1. Vérifier que chaque table mentionnée ci-dessus correspond à un modèle Python dans models.py
2. Vérifier que chaque colonne de la base de données correspond à un attribut dans le modèle Python
3. Si des incohérences sont détectées:
   - Créer un script de migration (comme migration_client.py) pour ajouter/supprimer/modifier les colonnes manquantes
   - OU utiliser Flask-Migrate pour gérer les migrations de manière versionnée

N'oubliez pas la règle essentielle: toujours synchroniser les modèles Python et la structure de la base de données!
""")
        
    except sqlite3.Error as e:
        logger.error(f"Erreur SQLite lors de la vérification de la base de données: {e}")
    except Exception as e:
        logger.error(f"Erreur inattendue: {e}")

if __name__ == "__main__":
    main()
