from app import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash

def create_super_admin():
    app = create_app()
    with app.app_context():
        # Vérifier si l'admin existe déjà
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                nom='Admin',
                prenom='Super',
                email='admin@example.com',
                role='admin',
                statut='actif'
            )
            admin.password_hash = generate_password_hash('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Super admin créé avec succès!")
        else:
            print("L'admin existe déjà!")

if __name__ == '__main__':
    create_super_admin()
