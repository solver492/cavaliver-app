from flask import Flask
from models import db, User, Notification, PrestationTransporter, Prestation
from datetime import datetime
from db_config import get_db_uri

def create_missing_notifications():
    """
    Ce script vérifie toutes les assignations de transporteurs aux prestations et
    crée les notifications manquantes pour les transporteurs.
    """
    # Créer une instance d'application Flask
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = get_db_uri()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialiser la base de données avec l'application
    db.init_app(app)
    
    # Utiliser le contexte de l'application
    with app.app_context():
        print("=== CRÉATION DES NOTIFICATIONS MANQUANTES ===")
        
        # Récupérer toutes les assignations de transporteurs
        assignations = PrestationTransporter.query.all()
        count = 0
        
        for assignation in assignations:
            # Vérifier si une notification existe déjà pour cette assignation
            existing_notification = Notification.query.filter_by(
                user_id=assignation.transporter_id,
                related_prestation_id=assignation.prestation_id
            ).first()
            
            if not existing_notification:
                # Récupérer les informations sur la prestation
                prestation = Prestation.query.get(assignation.prestation_id)
                if prestation:
                    # Créer une nouvelle notification
                    notification = Notification(
                        user_id=assignation.transporter_id,
                        type='info',
                        message=f"Vous avez été assigné à une prestation (#{prestation.id}): {prestation.adresse_depart} → {prestation.adresse_arrivee}",
                        is_read=False,
                        related_prestation_id=prestation.id,
                        date_creation=datetime.utcnow()
                    )
                    db.session.add(notification)
                    count += 1
        
        if count > 0:
            db.session.commit()
            print(f"✅ {count} notifications ont été créées avec succès!")
        else:
            print("✅ Aucune notification manquante trouvée.")

if __name__ == "__main__":
    create_missing_notifications()
