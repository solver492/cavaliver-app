#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour ajouter la colonne observations à la table client
"""

import sqlite3
import os
import sys
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def add_observations_column():
    """
    Ajoute la colonne observations à la table client
    """
    try:
        # Chemin vers la base de données
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "instance", "app.db")
        
        logger.info(f"Connexion à la base de données: {db_path}")
        
        # Vérifier si le fichier de base de données existe
        if not os.path.exists(db_path):
            logger.error(f"La base de données n'existe pas à l'emplacement: {db_path}")
            return False
        
        # Connexion à la base de données
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Vérifier si la colonne existe déjà
        cursor.execute("PRAGMA table_info(client)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        if 'observations' in column_names:
            logger.info("La colonne observations existe déjà dans la table client")
            conn.close()
            return True
        
        # Ajouter la colonne
        logger.info("Ajout de la colonne observations à la table client")
        cursor.execute("ALTER TABLE client ADD COLUMN observations TEXT")
        
        # Valider les modifications
        conn.commit()
        logger.info("Colonne ajoutée avec succès")
        
        # Fermer la connexion
        conn.close()
        return True
    
    except Exception as e:
        logger.error(f"Erreur lors de l'ajout de la colonne: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Démarrage du script de migration...")
    success = add_observations_column()
    
    if success:
        logger.info("Migration terminée avec succès")
    else:
        logger.error("Échec de la migration")
