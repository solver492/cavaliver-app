#!/bin/bash
# Script d'installation et de configuration pour Replit
# Ce script est exécuté automatiquement lors du démarrage de l'environnement Replit

echo "=== Configuration de l'environnement R-Cavalier App sur Replit ==="

# Mise à jour des packages
echo "Mise à jour des packages..."
pip install --upgrade pip

# Installation des dépendances
echo "Installation des dépendances..."
pip install -r requirements.txt

# Initialisation de la base de données
echo "Initialisation de la base de données..."
python init_db.py

# Exécution des scripts de migration
echo "Exécution des scripts de migration..."
python migration_client.py
python migration_prestation.py
python migration_facture_societe.py
python migration_prestation_tags.py
python migration_vehicule_prestation.py
python migration_global.py

echo "=== Configuration terminée ! ==="
echo "Pour lancer l'application, cliquez sur le bouton 'Run'"
echo "L'application sera accessible à l'URL fournie par Replit"
