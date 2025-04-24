#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script de migration pour synchroniser le modèle Prestation avec la structure de la base de données
"""

import logging
from app import create_app, db
from models import Prestation

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = create_app()

def update_prestation_model():
    """
    Met à jour le modèle Prestation pour inclure le champ vehicules_suggeres
    qui existe déjà dans la base de données
    """
    with app.app_context():
        try:
            # Vérifier si la colonne vehicules_suggeres existe déjà dans le modèle
            if hasattr(Prestation, 'vehicules_suggeres'):
                logger.info("Le champ 'vehicules_suggeres' existe déjà dans le modèle Prestation.")
                return
            
            # Ajouter la colonne vehicules_suggeres au modèle Python pour synchroniser avec la base de données
            logger.info("Ajout du champ 'vehicules_suggeres' au modèle Prestation dans models.py...")
            logger.info("Veuillez ajouter la ligne suivante au modèle Prestation dans le fichier models.py:")
            logger.info("vehicules_suggeres = db.Column(db.Text, nullable=True)")
        
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du modèle Prestation: {e}")

if __name__ == "__main__":
    logger.info("Démarrage de la migration pour le modèle Prestation...")
    update_prestation_model()
    logger.info("Migration terminée.")
