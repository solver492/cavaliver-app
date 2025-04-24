from app import create_app
from extensions import db
from models import agenda_partage

app = create_app()

with app.app_context():
    # Créer la table de partage d'agenda
    db.create_all()
    print("Table de partage d'agenda créée avec succès!")
