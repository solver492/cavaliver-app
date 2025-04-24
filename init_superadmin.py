from app import create_app
from extensions import db
from models import User
from datetime import datetime

def create_superadmin():
    """Crée un compte superadmin s'il n'existe pas déjà"""
    app = create_app()
    
    with app.app_context():
        # Vérifier si un superadmin existe déjà
        existing_superadmin = User.query.filter_by(username='superadmin').first()
        
        if not existing_superadmin:
            # Créer le superadmin
            superadmin = User(
                username='superadmin',
                email='superadmin@cavapp.com',
                role='superadmin',  # Rôle spécifique pour le superadmin
                nom='Super',
                prenom='Admin',
                notes='Compte superadmin avec tous les droits',
                date_creation=datetime.utcnow(),
                statut='actif'
            )
            
            # Définir le mot de passe
            superadmin.set_password('Superadmin123!')
            
            try:
                db.session.add(superadmin)
                db.session.commit()
                print("Compte superadmin créé avec succès!")
                print("Username: superadmin")
                print("Password: Superadmin123!")
            except Exception as e:
                db.session.rollback()
                print(f"Erreur lors de la création du superadmin: {str(e)}")
        else:
            print("Un compte superadmin existe déjà.")
            print("Si vous avez oublié le mot de passe, utilisez la fonction de réinitialisation.")

if __name__ == '__main__':
    create_superadmin()
