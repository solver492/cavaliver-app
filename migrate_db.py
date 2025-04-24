#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour ajouter les colonnes manquantes aux tables de la base de données
en utilisant SQLAlchemy
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text, MetaData, Table, Column, String, Text, DateTime, inspect
from sqlalchemy.exc import OperationalError
from app import create_app
from extensions import db

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def add_columns():
    """
    Ajoute les colonnes manquantes aux tables de la base de données
    en utilisant SQLAlchemy
    """
    try:
        # Créer l'application Flask pour accéder à la configuration de la base de données
        app = create_app()
        app.app_context().push()
        
        # Obtenir l'inspecteur pour vérifier les colonnes existantes
        inspector = inspect(db.engine)
        
        # Vérifier les colonnes existantes dans la table prestation
        columns = [col['name'] for col in inspector.get_columns('prestation')]
        
        # Liste des colonnes à ajouter à la table prestation
        prestation_columns = [
            {
                "name": "status_transporteur",
                "type": "VARCHAR(20)",
                "default": "'en_attente'"
            },
            {
                "name": "raison_refus",
                "type": "TEXT",
                "default": None
            },
            {
                "name": "date_reponse",
                "type": "DATETIME",
                "default": None
            },
            {
                "name": "createur_id",
                "type": "INTEGER",
                "default": None
            },
            {
                "name": "modificateur_id",
                "type": "INTEGER",
                "default": None
            },
            {
                "name": "stockage_id",
                "type": "INTEGER",
                "default": None
            },
            {
                "name": "mode_groupage",
                "type": "BOOLEAN",
                "default": "0"
            }
        ]
        
        # Ajouter les colonnes manquantes à la table prestation
        with db.engine.connect() as conn:
            for column in prestation_columns:
                name = column["name"]
                col_type = column["type"]
                default = column["default"]
                
                if name not in columns:
                    logger.info(f"Ajout de la colonne {name} à la table prestation...")
                    
                    # Construire la requête SQL avec ou sans valeur par défaut
                    if default is not None:
                        sql = f"ALTER TABLE prestation ADD COLUMN {name} {col_type} DEFAULT {default}"
                    else:
                        sql = f"ALTER TABLE prestation ADD COLUMN {name} {col_type}"
                    
                    conn.execute(text(sql))
                    conn.commit()
                    logger.info(f"Colonne {name} ajoutée avec succès à la table prestation")
                else:
                    logger.info(f"La colonne {name} existe déjà dans la table prestation")
        
        return True
    
    except Exception as e:
        logger.error(f"Erreur lors de l'ajout des colonnes: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Démarrage du script de migration...")
    success = add_columns()
    
    if success:
        logger.info("Migration terminée avec succès")
    else:
        logger.error("Échec de la migration")
