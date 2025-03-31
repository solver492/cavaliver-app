from app import app, db
from models import User

def fix_boss_role():
    with app.app_context():
        # Trouver l'utilisateur boss
        boss = User.query.filter_by(username='boss').first()
        if boss:
            # Modifier le rôle
            boss.role = 'super_admin'  # Avec underscore pour correspondre aux vérifications dans les templates
            db.session.commit()
            print('Le rôle de l\'utilisateur boss a été mis à jour avec succès (superadmin -> super_admin).')
        else:
            print('Utilisateur boss non trouvé.')

if __name__ == '__main__':
    fix_boss_role()
