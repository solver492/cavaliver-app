#!/bin/bash

echo "======= Début du processus de démarrage sur Render.com ======="

echo "[1] Affichage des fichiers dans le répertoire courant :"
ls -la

echo "\n[2] Installation des dépendances nécessaires"
pip install flask flask-login flask-sqlalchemy werkzeug gunicorn

echo "\n[3] Création du répertoire d'instance si nécessaire"
mkdir -p instance
mkdir -p uploads

echo "\n[4] Initialisation de la base de données"
python init_render_db.py

echo "\n[5] Création des notifications pour les transporteurs déjà assignés"
python create_missing_notifications.py

echo "\n[6] Affichage des fichiers après initialisation:"
ls -la

echo "\n[7] Démarrage de l'application avec Gunicorn (en mode debug)"
export FLASK_APP=app.py
export FLASK_ENV=production 
export SECRET_KEY=votre_clef_secrete
gunicorn app:app --bind=0.0.0.0:$PORT --log-level debug
