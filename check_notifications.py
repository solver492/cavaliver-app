from flask import Flask
from models import db, User, Notification, PrestationTransporter, Prestation

def check_notifications():
    """
    Script de diagnostic pour vérifier l'état des notifications dans la base de données
    """
    # Créer une instance d'application Flask
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///demenage.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialiser la base de données avec l'application
    db.init_app(app)
    
    # Utiliser le contexte de l'application
    with app.app_context():
        print("=== DIAGNOSTIC DES NOTIFICATIONS ===")
        
        # 1. Vérifier tous les utilisateurs avec rôle transporteur
        print("\n1. TRANSPORTEURS DANS LE SYSTÈME:")
        transporteurs = User.query.filter_by(role='transporteur').all()
        if transporteurs:
            for t in transporteurs:
                print(f"- ID: {t.id}, Nom: {t.nom} {t.prenom}, Username: {t.username}")
        else:
            print("Aucun transporteur trouvé dans la base de données.")
        
        # 2. Vérifier les assignations de transporteurs aux prestations
        print("\n2. ASSIGNATIONS DE TRANSPORTEURS AUX PRESTATIONS:")
        assignations = PrestationTransporter.query.all()
        if assignations:
            for a in assignations:
                transporteur = User.query.get(a.transporter_id)
                prestation = Prestation.query.get(a.prestation_id)
                if transporteur and prestation:
                    print(f"- Prestation #{a.prestation_id} assignée à {transporteur.nom} {transporteur.prenom} (ID: {transporteur.id})")
                    print(f"  Statut: {a.statut}, Date assignation: {a.date_assignation}")
                else:
                    print(f"- Assignation incomplète: transporter_id={a.transporter_id}, prestation_id={a.prestation_id}")
        else:
            print("Aucune assignation transporteur-prestation trouvée.")
        
        # 3. Vérifier les notifications pour les transporteurs
        print("\n3. NOTIFICATIONS POUR LES TRANSPORTEURS:")
        for t in transporteurs:
            notifications = Notification.query.filter_by(user_id=t.id).all()
            print(f"Transporteur {t.nom} {t.prenom} (ID: {t.id}):")
            if notifications:
                for n in notifications:
                    status = "Non lue" if not n.is_read else "Lue"
                    prestation_info = f"(Prestation #{n.related_prestation_id})" if n.related_prestation_id else ""
                    print(f"- {status}: {n.message} {prestation_info}")
            else:
                print("  Aucune notification.")
        
        # 4. Vérifier toutes les notifications
        print("\n4. TOUTES LES NOTIFICATIONS:")
        all_notifications = Notification.query.all()
        if all_notifications:
            for n in all_notifications:
                user = User.query.get(n.user_id)
                user_info = f"{user.nom} {user.prenom} (rôle: {user.role})" if user else f"Utilisateur inconnu (ID: {n.user_id})"
                status = "Non lue" if not n.is_read else "Lue"
                print(f"- {status} pour {user_info}: {n.message}")
        else:
            print("Aucune notification trouvée dans la base de données.")

if __name__ == "__main__":
    check_notifications()
