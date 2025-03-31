from models import db, User, Notification
from werkzeug.security import generate_password_hash
from flask import Flask
from datetime import datetime
import os

# Configuration de l'application Flask
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///demenage.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialiser l'extension
db.init_app(app)

# Fonction pour initialiser la base de données
def init_db():
    print("Initialisation de la base de données...")
    
    # Créer toutes les tables
    with app.app_context():
        db.create_all()
        print("Tables créées avec succès!")
        
        # Vérifier si un utilisateur admin existe déjà
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            # Créer l'utilisateur admin
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
            print('Utilisateur admin créé avec succès!')
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
        print("Admin: username='admin', password='admin123'")
        print("Commercial: username='commercial', password='commercial123'")
        print("Transporteur: username='transporteur', password='transporteur123'")

# Exécuter la fonction si le script est exécuté directement
if __name__ == '__main__':
    init_db()
