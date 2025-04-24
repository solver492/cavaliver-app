from app import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash
from datetime import datetime

def reset_admin_password():
    """Réinitialise le mot de passe du compte admin"""
    app = create_app()
    
    with app.app_context():
        # Trouver le compte admin
        admin = User.query.filter_by(role='admin').first()
        
        if admin:
            # Réinitialiser le mot de passe
            admin.password = generate_password_hash('Admin123!')
            
            try:
                db.session.commit()
                print("Mot de passe admin réinitialisé avec succès!")
                print("Username:", admin.username)
                print("Nouveau mot de passe: Admin123!")
            except Exception as e:
                db.session.rollback()
                print(f"Erreur lors de la réinitialisation du mot de passe: {str(e)}")
        else:
            print("Aucun compte admin trouvé.")

if __name__ == '__main__':
    reset_admin_password()
