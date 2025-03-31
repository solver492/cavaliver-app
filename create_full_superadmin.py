from app import app, db
from models import User
from werkzeug.security import generate_password_hash

def create_full_superadmin():
    with app.app_context():
        # Vérifier si un superadmin "boss" existe déjà
        boss = User.query.filter_by(username='boss').first()
        if boss:
            print('Un utilisateur "boss" existe déjà.')
            return

        # Créer le super admin avec tous les pouvoirs
        superadmin = User(
            username='boss',
            email='boss@example.com',
            password_hash=generate_password_hash('boss123'),
            role='superadmin',
            nom='Super',
            prenom='Admin',
            statut='actif'
        )
        db.session.add(superadmin)
        db.session.commit()
        print('Super administrateur "boss" créé avec succès.')

if __name__ == '__main__':
    create_full_superadmin()
