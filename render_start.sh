#!/bin/bash

echo "======= Début du processus de démarrage sur Render.com ======="

echo "[1] Affichage des fichiers dans le répertoire courant :"
ls -la

echo "\n[2] Installation des dépendances nécessaires"
pip install flask flask-login flask-sqlalchemy werkzeug sqlalchemy gunicorn flask-wtf email_validator pillow

echo "\n[3] Création des répertoires nécessaires"
mkdir -p instance
mkdir -p uploads
chmod -R 777 instance
chmod -R 777 uploads

echo "\n[4] Création de la base de données avec les colonnes manquantes"
export FLASK_APP=app.py
export FLASK_ENV=production
export RENDER=true

# On force la recréation de la base de données
python recreate_db.py

# On s'assure que toutes les permissions sont correctes
chmod 666 /opt/render/project/src/instance/demenage.db

# On vérifie/met à jour le schéma pour s'assurer que toutes les colonnes existent
python update_db_schema.py

echo "\n[5] Vérification des utilisateurs créés (debug)"
python -c "from app import app; from models import User; with app.app_context(): users = User.query.all(); print('Utilisateurs dans la base:'); [print(f'- {u.username} (rôle: {u.role})') for u in users];"

echo "\n[6] Création des notifications pour les transporteurs déjà assignés"
python create_missing_notifications.py

echo "\n[7] Démarrage du serveur gunicorn"
export SECRET_KEY=votre_clef_secrete
gunicorn app:app --bind=0.0.0.0:$PORT --log-level debug
