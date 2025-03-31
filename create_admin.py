from app import app, db, User
from datetime import datetime

def create_admin_user():
    """Créer un utilisateur admin par défaut si aucun n'existe"""
    with app.app_context():
        # Vérifier si un utilisateur admin existe déjà
        admin = User.query.filter_by(role='admin').first()
        
        if not admin:
            # Créer un utilisateur admin
            admin = User(
                username='admin',
                email='admin@cavalier.com',
                nom='Admin',
                prenom='Cavalier',
                role='admin',
                statut='actif',
                date_creation=datetime.utcnow()
            )
            admin.set_password('admin123')
            
            db.session.add(admin)
            
            # Créer un utilisateur commercial
            commercial = User(
                username='commercial',
                email='commercial@cavalier.com',
                nom='Commercial',
                prenom='Cavalier',
                role='commercial',
                statut='actif',
                date_creation=datetime.utcnow()
            )
            commercial.set_password('commercial123')
            
            db.session.add(commercial)
            
            # Créer un utilisateur transporteur
            transporteur = User(
                username='transporteur',
                email='transporteur@cavalier.com',
                nom='Transporteur',
                prenom='Cavalier',
                role='transporteur',
                statut='actif',
                vehicule='Fourgon 12m³',
                date_creation=datetime.utcnow()
            )
            transporteur.set_password('transporteur123')
            
            db.session.add(transporteur)
            
            db.session.commit()
            print("Utilisateurs par défaut créés avec succès!")
            print("Admin: username='admin', password='admin123'")
            print("Commercial: username='commercial', password='commercial123'")
            print("Transporteur: username='transporteur', password='transporteur123'")
        else:
            print("Un utilisateur admin existe déjà.")

if __name__ == '__main__':
    create_admin_user()
