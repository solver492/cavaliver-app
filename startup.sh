#!/bin/bash

# Afficher les informations de démarrage
echo "Démarrage de l'application..."
echo "Environnement: $FLASK_ENV"

# Créer le répertoire pour la base de données sur Render si nécessaire
if [ ! -z "$RENDER" ]; then
    echo "Environnement Render détecté"
    mkdir -p /opt/render/project/src/instance
    echo "Répertoire de base de données créé sur Render"
fi

# Exécuter les migrations de base de données
echo "Exécution des migrations de base de données..."
python migration_db.py

# Exécuter le script de correction de la base de données
echo "Vérification et correction de la structure de la base de données..."
python fix_db_enhanced.py

# Initialiser la base de données si nécessaire
echo "Initialisation de la base de données..."
python init_db.py

# Attendre que la base de données soit prête
echo "Attente de la disponibilité de la base de données..."
sleep 2

# Démarrer l'application avec Gunicorn
echo "Démarrage du serveur Gunicorn..."
PORT=${PORT:-10000}
gunicorn 'app:create_app()' --bind 0.0.0.0:$PORT --workers=2 --timeout=60
