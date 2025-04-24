#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour initialiser la base de données en production.
À exécuter après le premier déploiement sur Render.
"""

from app import create_app, db
from models import User, Agenda, Vehicule, Document # Added imports for new models
from werkzeug.security import generate_password_hash
import os

def init_database():
    app = create_app()
    with app.app_context():
        print("Création des tables...")
        db.create_all()
        print("Tables créées avec succès!")

if __name__ == "__main__":
    init_database()

    # Vérifier si des utilisateurs existent déjà
    with app.app_context(): #Ensuring app context for User query
        if User.query.count() == 0:
            # Création d'un utilisateur admin par défaut
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            admin_user = User(
                username='admin',
                email='admin@cavalier-demenagement.fr',
                password_hash=generate_password_hash(admin_password),
                nom='Administrateur',
                prenom='Système',
                role='admin',
                actif=True
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Utilisateur admin créé avec succès")

    print("Initialisation de la base de données terminée")