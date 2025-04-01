#!/bin/bash

# Afficher les informations de build
echo "Démarrage du processus de build..."

# Installer les dépendances Python
echo "Installation des dépendances..."
pip install --upgrade pip
pip install -r requirements.txt

# Exécuter les migrations de base de données
echo "Préparation de la base de données..."
python migration_db.py

echo "Build terminé avec succès!"