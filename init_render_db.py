from app import app, db
from models import User
from werkzeug.security import generate_password_hash

# Fonction pour initialiser la base de donnu00e9es
def init_db():
    with app.app_context():
        # Cru00e9er toutes les tables
        db.create_all()
        
        # Vu00e9rifier si un utilisateur admin existe du00e9ju00e0
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            # Cru00e9er l'utilisateur admin
            admin = User(
                username='admin',
                password_hash=generate_password_hash('admin'),
                email='admin@example.com',
                role='superadmin',
                nom='Admin',
                prenom='Super',
                statut='actif'
            )
            db.session.add(admin)
            db.session.commit()
            print('Utilisateur admin cru00e9u00e9 avec succu00e8s.')
        else:
            print('Un utilisateur admin existe du00e9ju00e0.')

# Exu00e9cuter la fonction si le script est exu00e9cutu00e9 directement
if __name__ == '__main__':
    init_db()
