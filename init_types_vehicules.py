from app import create_app
from models import TypeVehicule
from extensions import db

app = create_app()
with app.app_context():
    # Vérifier si des types de véhicules existent déjà
    if TypeVehicule.query.count() == 0:
        # Créer les types de véhicules
        types = [
            TypeVehicule(nom='Fourgon 3m³', description='Petit fourgon pour petits déménagements'),
            TypeVehicule(nom='Fourgon 6m³', description='Fourgon moyen'),
            TypeVehicule(nom='Fourgon 12m³', description='Grand fourgon'),
            TypeVehicule(nom='Fourgon 20m³', description='Très grand fourgon'),
            TypeVehicule(nom='Camion 30m³', description='Petit camion'),
            TypeVehicule(nom='Camion 40m³', description='Camion moyen'),
            TypeVehicule(nom='Camion 50m³', description='Grand camion'),
            TypeVehicule(nom='Camion 60m³', description='Très grand camion'),
            TypeVehicule(nom='Camionnette', description='Petite camionnette pour livraisons'),
        ]
        for t in types:
            db.session.add(t)
        db.session.commit()
        print('Types de véhicules créés avec succès!')
    else:
        print('Types de véhicules déjà existants:', [t.nom for t in TypeVehicule.query.all()])
