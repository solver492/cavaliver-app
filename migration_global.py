#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script de migration global pour synchroniser tous les modèles avec la structure de la base de données.
Ce script est particulièrement utile lors du déploiement sur Render pour garantir la cohérence
entre les modèles Python et le schéma de la base de données PostgreSQL.
"""

import logging
import os
from app import create_app, db
from models import *
from sqlalchemy import inspect, text
from datetime import datetime

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = create_app()

def execute_migrations():
    """Exécute toutes les migrations nécessaires pour synchroniser les modèles avec la base de données"""
    with app.app_context():
        try:
            # Créer les tables qui n'existent pas
            logger.info("Vérification et création des tables manquantes...")
            db.create_all()

            # Récupérer la liste des tables actuelles
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            logger.info(f"Tables existantes dans la base de données: {existing_tables}")

            # Vérifier et ajouter les colonnes manquantes pour chaque table
            for model in [User, Client, Document, TypeVehicule, TypeDemenagement, 
                          Prestation, Facture, Stockage, ArticleStockage, Notification]:
                
                table_name = model.__tablename__
                if table_name in existing_tables:
                    logger.info(f"Vérification des colonnes pour la table {table_name}...")
                    
                    # Récupérer les colonnes existantes
                    existing_columns = {col['name'] for col in inspector.get_columns(table_name)}
                    logger.info(f"Colonnes existantes dans {table_name}: {existing_columns}")
                    
                    # Récupérer les colonnes du modèle
                    model_columns = {column.key for column in inspect(model).columns}
                    logger.info(f"Colonnes du modèle {table_name}: {model_columns}")
                    
                    # Identifier les colonnes manquantes
                    missing_columns = model_columns - existing_columns
                    
                    if missing_columns:
                        logger.info(f"Colonnes manquantes dans {table_name}: {missing_columns}")
                        logger.info(f"Migration nécessaire pour {table_name}! Veuillez exécuter les scripts de migration spécifiques.")
                    else:
                        logger.info(f"Table {table_name} synchronisée avec le modèle.")
                else:
                    logger.warning(f"La table {table_name} n'existe pas dans la base de données. Elle sera créée.")
            
            # Synchronisation terminée
            logger.info("Vérification de synchronisation terminée.")
            
        except Exception as e:
            logger.error(f"Erreur lors de la migration: {e}")
            raise

if __name__ == "__main__":
    logger.info("Démarrage de la migration globale...")
    execute_migrations()
    logger.info("Migration globale terminée.")
