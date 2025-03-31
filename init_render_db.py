from models import db, User, Notification
from werkzeug.security import generate_password_hash
from flask import Flask
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
                email='admin@example.com',
                nom='Admin',
                prenom='Super',
                role='super_admin',
                statut='actif'
            )
            admin.set_password('admin')  # Utilise la méthode set_password du modèle User
            
            db.session.add(admin)
            db.session.commit()
            print('Utilisateur admin créé avec succès!')
        else:
            print('Un utilisateur admin existe déjà.')
        
        # Vérifier si un utilisateur boss existe déjà
        boss = User.query.filter_by(username='boss').first()
        if not boss:
            # Créer l'utilisateur boss
            boss = User(
                username='boss', 
                email='boss@example.com',
                nom='Boss',
                prenom='Cavalier',
                role='admin',
                statut='actif'
            )
            boss.set_password('boss')  # Mot de passe simple pour les tests
            
            db.session.add(boss)
            db.session.commit()
            print('Utilisateur boss créé avec succès!')
        else:
            print('Un utilisateur boss existe déjà.')
        
        print("Base de données initialisée avec succès!")

# Exécuter la fonction si le script est exécuté directement
if __name__ == '__main__':
    init_db()
