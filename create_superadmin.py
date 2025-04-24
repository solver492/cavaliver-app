from app import create_app
from extensions import db
from models import User

def create_superadmin():
    app = create_app()
    with app.app_context():
        # Vérifier si le super admin existe déjà
        user = User.query.filter_by(username='superadmin').first()
        if not user:
            super_admin = User(
                username='superadmin',
                email='super@admin.com',
                nom='Super',
                prenom='Admin',
                role='superadmin',
                statut='actif'
            )
            super_admin.set_password('superadmin123')
            db.session.add(super_admin)
            db.session.commit()
            print("Super Admin créé avec succès")
            print("Username: superadmin")
            print("Password: superadmin123")
        else:
            user.role = 'superadmin'
            user.statut = 'actif'
            user.set_password('superadmin123')
            db.session.commit()
            print("Le compte Super Admin a été réinitialisé avec succès")
            print("Username: superadmin")
            print("Password: superadmin123")

if __name__ == '__main__':
    create_superadmin()
