#!/bin/bash

echo "======= Début du processus de démarrage sur Render.com ======="

echo "[1] Affichage des fichiers dans le répertoire courant :"
ls -la

echo "\n[2] Installation des dépendances nécessaires"
pip install flask flask-login flask-sqlalchemy werkzeug gunicorn flask-wtf email_validator pillow weasyprint

echo "\n[3] Création du répertoire d'instance si nécessaire"
mkdir -p instance
mkdir -p uploads

echo "\n[4] Recréation complète de la base de données"
python recreate_db.py

echo "\n[5] Vérification des utilisateurs créés (debug)"
python -c "from app import app; from models import User; with app.app_context(): users = User.query.all(); print('Utilisateurs dans la base:'); [print(f'- {u.username} (rôle: {u.role})') for u in users];"

echo "\n[6] Création des notifications pour les transporteurs déjà assignés"
python create_missing_notifications.py

echo "\n[7] Affichage des fichiers après initialisation:"
ls -la

echo "\n[8] Démarrage de l'application avec Gunicorn (en mode production)"
export FLASK_APP=app.py
export FLASK_ENV=production 
export SECRET_KEY=votre_clef_secrete
gunicorn app:app --bind=0.0.0.0:$PORT --log-level debug
