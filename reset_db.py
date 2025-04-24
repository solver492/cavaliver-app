
"""
Script pour supprimer et recréer la base de données
"""
import os
from app import create_app, db
from models import *
from datetime import datetime, timedelta

app = create_app()

def reset_database():
    """Supprime et recrée la base de données avec toutes les tables"""
    with app.app_context():
        # Suppression de toutes les tables
        db.drop_all()
        print("Tables supprimées avec succès")
        
        # Création des nouvelles tables
        db.create_all()
        print("Nouvelles tables créées avec succès")
        
        # Création d'un utilisateur admin par défaut
        admin = User(
            username='admin',
            email='admin@example.com',
            nom='Admin',
            prenom='User',
            role='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        
        # Commit des changements
        db.session.commit()
        print("Utilisateur admin créé avec succès")
        
        return True

if __name__ == "__main__":
    print("Réinitialisation de la base de données...")
    if reset_database():
        print("Base de données réinitialisée avec succès")
    else:
        print("Échec de la réinitialisation de la base de données")
