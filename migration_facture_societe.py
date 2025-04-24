#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script de migration pour ajouter le champ 'societe' à la table 'facture'.
Ce script permet de synchroniser la structure de la base de données avec le modèle Python modifié.
"""

import os
import logging
import sqlite3
from app import create_app

# Configuration du logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = create_app()

def execute_migration():
    """
    Exécute la migration pour ajouter la colonne 'societe' à la table 'facture'
    """
    with app.app_context():
        # Le chemin spécifique à l'instance Flask
        db_path = "instance/cavalier.db"
        
        if not os.path.exists(db_path):
            logger.error(f"Base de données non trouvée: {db_path}")
            return
        
        logger.info(f"Connexion à la base de données: {db_path}")
        
        # Établir la connexion à la base de données
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Vérifier si la colonne existe déjà
            cursor.execute("PRAGMA table_info(facture)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            # Si la colonne n'existe pas, l'ajouter
            if 'societe' not in column_names:
                logger.info("Ajout de la colonne 'societe' à la table 'facture'")
                cursor.execute("ALTER TABLE facture ADD COLUMN societe VARCHAR(50)")
                conn.commit()
                logger.info("Colonne 'societe' ajoutée avec succès")
            else:
                logger.info("La colonne 'societe' existe déjà dans la table 'facture'")
            
            # Afficher la structure mise à jour
            cursor.execute("PRAGMA table_info(facture)")
            columns = cursor.fetchall()
            logger.info("Structure mise à jour de la table 'facture':")
            for column in columns:
                logger.info(f"  {column[1]} ({column[2]})")
                
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la migration: {e}")
            conn.rollback()
        finally:
            conn.close()

if __name__ == "__main__":
    logger.info("Démarrage de la migration pour ajouter le champ 'societe' à la table 'facture'...")
    execute_migration()
    logger.info("Migration terminée.")
