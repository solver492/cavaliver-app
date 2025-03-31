from app import app, db
from models import User, Client, Prestation, Document, Notification, Planning, PrestationTransporter
from werkzeug.security import generate_password_hash

def init_db():
    with app.app_context():
        print("Suppression de toutes les tables existantes...")
        db.drop_all()
        
        print("Création des nouvelles tables...")
        db.create_all()
        
        # Création d'un utilisateur admin par défaut
        if User.query.filter_by(username='admin').first() is None:
            print("Création de l'utilisateur admin...")
            admin = User(
                username='admin',
                email='admin@example.com',
                nom='Administrateur',
                prenom='Système',
                role='superadmin',
                statut='actif'
            )
            admin.password_hash = generate_password_hash('admin')
            db.session.add(admin)
            db.session.commit()
            print("Utilisateur admin créé avec succès!")

if __name__ == '__main__':
    print("Initialisation de la base de données...")
    init_db()
    print("Base de données initialisée avec succès!")
