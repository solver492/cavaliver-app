from app import app, db
from models import User
from werkzeug.security import generate_password_hash

def init_database():
    with app.app_context():
        # Créer toutes les tables
        db.create_all()
        
        # Vérifier si le super admin existe déjà
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            # Créer le super admin
            superadmin = User(
                username='admin',
                password_hash=generate_password_hash('admin'),
                email='admin@example.com',
                role='superadmin',
                nom='Super',
                prenom='Admin',
                statut='actif'
            )
            db.session.add(superadmin)
            db.session.commit()
            print('Super administrateur créé avec succès.')
        else:
            print('Un super administrateur existe déjà.')

if __name__ == '__main__':
    init_database()
