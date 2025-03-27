from app import app, db
from models import User
from werkzeug.security import generate_password_hash

def create_superadmin():
    with app.app_context():
        # Vérifier si le super admin existe déjà
        admin = User.query.filter_by(username='admin').first()
        if admin:
            print('Un utilisateur avec ce nom existe déjà.')
            return

        # Créer le super admin
        superadmin = User(
            username='admin',
            password=generate_password_hash('superadmin123'),
            role='superadmin',
            nom='Super',
            prenom='Admin'
        )
        db.session.add(superadmin)
        db.session.commit()
        print('Super administrateur créé avec succès.')

if __name__ == '__main__':
    create_superadmin()
