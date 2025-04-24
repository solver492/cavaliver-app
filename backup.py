#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script de sauvegarde automatique pour l'application R-cavalier
Ce script crée une sauvegarde complète de l'application et de sa base de données
"""

import os
import sys
import shutil
import datetime
import zipfile
import sqlite3
import logging
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('backup_log.txt')
    ]
)

# Répertoire racine de l'application (répertoire courant)
APP_ROOT = os.path.dirname(os.path.abspath(__file__))

# Répertoire de destination des sauvegardes
BACKUP_ROOT = os.path.join(APP_ROOT, 'backups')

# Fichier de base de données
DB_FILE = os.path.join(APP_ROOT, 'database.db')

def create_backup_folder():
    """Crée le répertoire de sauvegarde s'il n'existe pas"""
    if not os.path.exists(BACKUP_ROOT):
        os.makedirs(BACKUP_ROOT)
        logging.info(f"Répertoire de sauvegarde créé: {BACKUP_ROOT}")

def get_backup_filename():
    """Génère un nom de fichier pour la sauvegarde basé sur la date et l'heure actuelles"""
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    return f"rcavalier_backup_{timestamp}.zip"

def backup_database():
    """Sauvegarde la base de données SQLite"""
    if not os.path.exists(DB_FILE):
        logging.error(f"Fichier de base de données non trouvé: {DB_FILE}")
        return None
    
    # Créer une copie de la base de données pour la sauvegarde
    backup_db_file = os.path.join(APP_ROOT, 'database_backup.db')
    
    try:
        # Connecter à la base de données
        conn = sqlite3.connect(DB_FILE)
        # Créer une copie de sauvegarde
        with sqlite3.connect(backup_db_file) as backup_conn:
            conn.backup(backup_conn)
        conn.close()
        
        logging.info(f"Base de données sauvegardée avec succès dans {backup_db_file}")
        return backup_db_file
    except Exception as e:
        logging.error(f"Erreur lors de la sauvegarde de la base de données: {str(e)}")
        return None

def create_zip_backup(db_backup_file):
    """Crée une archive ZIP contenant tous les fichiers de l'application"""
    backup_file = os.path.join(BACKUP_ROOT, get_backup_filename())
    
    try:
        with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Ajouter tous les fichiers du répertoire de l'application
            for root, dirs, files in os.walk(APP_ROOT):
                # Exclure le répertoire de sauvegarde et les environnements virtuels
                if 'backups' in root or 'venv' in root or '__pycache__' in root:
                    continue
                
                for file in files:
                    # Éviter d'ajouter le fichier de sauvegarde de la base de données
                    if file == 'database_backup.db':
                        continue
                    
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, APP_ROOT)
                    
                    try:
                        zipf.write(file_path, arcname)
                    except Exception as e:
                        logging.warning(f"Impossible d'ajouter le fichier {file_path}: {str(e)}")
            
            # Ajouter la sauvegarde de la base de données si disponible
            if db_backup_file and os.path.exists(db_backup_file):
                zipf.write(db_backup_file, 'database.db')
        
        logging.info(f"Sauvegarde complète créée: {backup_file}")
        return backup_file
    except Exception as e:
        logging.error(f"Erreur lors de la création de la sauvegarde ZIP: {str(e)}")
        return None
    finally:
        # Supprimer le fichier de sauvegarde temporaire de la base de données
        if db_backup_file and os.path.exists(db_backup_file):
            os.remove(db_backup_file)

def cleanup_old_backups(max_backups=5):
    """Supprime les anciennes sauvegardes si le nombre dépasse la limite"""
    if not os.path.exists(BACKUP_ROOT):
        return
    
    backups = sorted([
        os.path.join(BACKUP_ROOT, f) 
        for f in os.listdir(BACKUP_ROOT) 
        if f.startswith('rcavalier_backup_') and f.endswith('.zip')
    ])
    
    if len(backups) > max_backups:
        for old_backup in backups[:-max_backups]:
            try:
                os.remove(old_backup)
                logging.info(f"Ancienne sauvegarde supprimée: {old_backup}")
            except Exception as e:
                logging.error(f"Erreur lors de la suppression de {old_backup}: {str(e)}")

def main():
    """Fonction principale qui exécute la sauvegarde complète"""
    logging.info("=== DÉBUT DE LA SAUVEGARDE ===")
    
    try:
        # Créer le répertoire de sauvegarde
        create_backup_folder()
        
        # Sauvegarder la base de données
        db_backup = backup_database()
        
        # Créer l'archive ZIP
        backup_file = create_zip_backup(db_backup)
        
        # Nettoyer les anciennes sauvegardes
        cleanup_old_backups()
        
        if backup_file:
            logging.info("=== SAUVEGARDE TERMINÉE AVEC SUCCÈS ===")
            print(f"\nSauvegarde créée avec succès: {backup_file}")
            return True
        else:
            logging.error("=== ÉCHEC DE LA SAUVEGARDE ===")
            return False
            
    except Exception as e:
        logging.critical(f"Erreur critique lors de la sauvegarde: {str(e)}")
        logging.error("=== ÉCHEC DE LA SAUVEGARDE ===")
        return False

if __name__ == "__main__":
    main()
