from app import app, db
from models import User

def fix_admin_role():
    with app.app_context():
        # Mettre à jour l'administrateur existant
        admin = User.query.filter_by(username='admin').first()
        if admin:
            admin.role = 'super_admin'
            db.session.commit()
            print(f"Le rôle de l'utilisateur {admin.username} a été mis à jour vers 'super_admin'")
        else:
            print("Aucun utilisateur admin trouvé")

if __name__ == '__main__':
    fix_admin_role()
