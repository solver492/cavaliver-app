#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script de débogage pour l'application R-Cavalier
"""

import logging
import sys
import traceback

# Configuration du logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

try:
    logger.info("Démarrage de l'application en mode débogage...")
    
    # Import des modules nécessaires
    from app import create_app
    
    logger.info("Création de l'application Flask...")
    app = create_app()
    
    if __name__ == '__main__':
        logger.info("Lancement du serveur Flask sur le port 5000...")
        app.run(debug=True, host='0.0.0.0', port=5000)
        
except Exception as e:
    logger.error(f"Erreur lors du démarrage de l'application: {e}")
    logger.error(traceback.format_exc())
