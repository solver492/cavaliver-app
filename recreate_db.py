from flask import Flask
from models import db, User, Client, Prestation, Document, Notification, Planning, PrestationTransporter
from werkzeug.security import generate_password_hash
from datetime import datetime
import os
from db_config import get_db_uri

# Configuration de l'application Flask
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = get_db_uri()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialiser l'extension
db.init_app(app)

def init_db():
    with app.app_context():
        print("Suppression de toutes les tables existantes...")
        db.drop_all()
        
        print("Création des nouvelles tables...")
        db.create_all()
        
        # Création d'un utilisateur super_admin par défaut
        super_admin = User.query.filter_by(username='superadmin').first()
        if not super_admin:
            print("Création de l'utilisateur super_admin...")
            super_admin = User(
                username='superadmin',
                email='superadmin@cavalier.com',
                nom='Super',
                prenom='Admin',
                role='super_admin',
                statut='actif',
                date_creation=datetime.utcnow()
            )
            super_admin.set_password('superadmin123')
            db.session.add(super_admin)
            print("Utilisateur super_admin créé avec succès!")
        else:
            print('Un utilisateur super_admin existe déjà.')
        
        # Création d'un utilisateur admin par défaut
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            print("Création de l'utilisateur admin...")
            admin = User(
                username='admin',
                email='admin@cavalier.com',
                nom='Admin',
                prenom='Cavalier',
                role='admin',
                statut='actif',
                date_creation=datetime.utcnow()
            )
            admin.set_password('admin123')
            db.session.add(admin)
            print("Utilisateur admin créé avec succès!")
        else:
            print('Un utilisateur admin existe déjà.')
        
        # Créer un utilisateur commercial
        commercial = User.query.filter_by(username='commercial').first()
        if not commercial:
            commercial = User(
                username='commercial',
                email='commercial@cavalier.com',
                nom='Commercial',
                prenom='Cavalier',
                role='commercial',
                statut='actif',
                date_creation=datetime.utcnow()
            )
            commercial.set_password('commercial123')
            db.session.add(commercial)
            print('Utilisateur commercial créé avec succès!')
        else:
            print('Un utilisateur commercial existe déjà.')
        
        # Créer un utilisateur transporteur
        transporteur = User.query.filter_by(username='transporteur').first()
        if not transporteur:
            transporteur = User(
                username='transporteur',
                email='transporteur@cavalier.com',
                nom='Transporteur',
                prenom='Cavalier',
                role='transporteur',
                statut='actif',
                vehicule='Fourgon 12m³',
                date_creation=datetime.utcnow()
            )
            transporteur.set_password('transporteur123')
            db.session.add(transporteur)
            print('Utilisateur transporteur créé avec succès!')
        else:
            print('Un utilisateur transporteur existe déjà.')
        
        db.session.commit()
        print("Base de données initialisée avec succès!")
        print("Super Admin: username='superadmin', password='superadmin123'")
        print("Admin: username='admin', password='admin123'")
        print("Commercial: username='commercial', password='commercial123'")
        print("Transporteur: username='transporteur', password='transporteur123'")

if __name__ == '__main__':
    print("Initialisation de la base de données...")
    init_db()
    print("Base de données réinitialisée avec succès!")
