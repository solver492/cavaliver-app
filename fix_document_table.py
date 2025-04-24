#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour corriger la table document en ajoutant la colonne observations_supplementaires
"""

import os
import sys
import logging
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def fix_document_table():
    """
    Ajoute toutes les colonnes manquantes à la table document
    en utilisant le contexte de l'application Flask
    """
    try:
        # Importer l'application et le contexte
        from app import app
        from extensions import db
        
        logger.info("Initialisation du contexte de l'application Flask...")
        
        with app.app_context():
            # Vérifier si la table document existe
            try:
                # Tenter d'exécuter une requête sur la table document
                result = db.session.execute(text("SELECT 1 FROM document LIMIT 1"))
                logger.info("La table document existe.")
            except OperationalError:
                logger.info("La table document n'existe pas. Création de toutes les tables...")
                db.create_all()
                logger.info("Tables créées avec succès.")
                return True
            
            # Vérifier et ajouter la colonne observations_supplementaires
            try:
                # Tenter d'exécuter une requête avec la colonne observations_supplementaires
                result = db.session.execute(text("SELECT observations_supplementaires FROM document LIMIT 1"))
                logger.info("La colonne observations_supplementaires existe déjà dans la table document.")
            except OperationalError:
                # La colonne n'existe pas, on l'ajoute
                logger.info("La colonne observations_supplementaires n'existe pas, ajout en cours...")
                db.session.execute(text("ALTER TABLE document ADD COLUMN observations_supplementaires TEXT"))
                db.session.commit()
                logger.info("Colonne observations_supplementaires ajoutée avec succès.")
            
            # Vérifier et ajouter la colonne prestation_id
            try:
                # Tenter d'exécuter une requête avec la colonne prestation_id
                result = db.session.execute(text("SELECT prestation_id FROM document LIMIT 1"))
                logger.info("La colonne prestation_id existe déjà dans la table document.")
            except OperationalError:
                # La colonne n'existe pas, on l'ajoute
                logger.info("La colonne prestation_id n'existe pas, ajout en cours...")
                db.session.execute(text("ALTER TABLE document ADD COLUMN prestation_id INTEGER REFERENCES prestation(id)"))
                db.session.commit()
                logger.info("Colonne prestation_id ajoutée avec succès.")
            
            # Vérifier et ajouter la colonne stockage_id
            try:
                # Tenter d'exécuter une requête avec la colonne stockage_id
                result = db.session.execute(text("SELECT stockage_id FROM document LIMIT 1"))
                logger.info("La colonne stockage_id existe déjà dans la table document.")
            except OperationalError:
                # La colonne n'existe pas, on l'ajoute
                logger.info("La colonne stockage_id n'existe pas, ajout en cours...")
                db.session.execute(text("ALTER TABLE document ADD COLUMN stockage_id INTEGER REFERENCES stockage(id)"))
                db.session.commit()
                logger.info("Colonne stockage_id ajoutée avec succès.")
            
            # Vérifier et ajouter la colonne user_id
            try:
                # Tenter d'exécuter une requête avec la colonne user_id
                result = db.session.execute(text("SELECT user_id FROM document LIMIT 1"))
                logger.info("La colonne user_id existe déjà dans la table document.")
            except OperationalError:
                # La colonne n'existe pas, on l'ajoute
                logger.info("La colonne user_id n'existe pas, ajout en cours...")
                db.session.execute(text("ALTER TABLE document ADD COLUMN user_id INTEGER REFERENCES user(id)"))
                db.session.commit()
                logger.info("Colonne user_id ajoutée avec succès.")
                
            return True
    
    except Exception as e:
        logger.error(f"Erreur lors de la correction de la table document: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Démarrage du script de correction de la table document...")
    success = fix_document_table()
    
    if success:
        logger.info("Correction terminée avec succès.")
    else:
        logger.error("Échec de la correction.")
