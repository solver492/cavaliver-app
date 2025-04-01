#!/bin/bash

# Afficher les informations de démarrage
echo "Démarrage de l'application..."
echo "Environnement: $FLASK_ENV"

# Créer le répertoire pour la base de données sur Render si nécessaire
if [ ! -z "$RENDER" ]; then
    echo "Environnement Render détecté"
    mkdir -p /etc/render/database
    echo "Répertoire de base de données créé sur Render"
fi

# Exécuter les migrations de base de données
echo "Exécution des migrations de base de données..."
python migration_db.py

# Exécuter le script de correction de la base de données
echo "Vérification et correction de la structure de la base de données..."
python fix_render_db.py

# Initialiser la base de données si nécessaire
echo "Initialisation de la base de données..."
python init_db.py

# Démarrer l'application avec Gunicorn
echo "Démarrage du serveur Gunicorn..."
gunicorn app:app --bind=0.0.0.0:$PORT --workers=4 --timeout=120