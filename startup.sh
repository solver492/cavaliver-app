#!/bin/bash

# Créer le répertoire pour la base de données sur Render si nécessaire
if [ ! -z "$RENDER" ]; then
    mkdir -p /etc/render/database
    echo "Répertoire de base de données créé sur Render"
fi

# Initialiser la base de données
python init_db.py

# Démarrer l'application
gunicorn app:app
