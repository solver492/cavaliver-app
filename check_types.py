# Script pour vérifier les types de véhicules
from app import create_app
from models import TypeVehicule

app = create_app()

with app.app_context():
    print('Types de véhicules disponibles:')
    types = TypeVehicule.query.all()
    
    if not types:
        print('Aucun type de véhicule trouvé dans la base de données!')
    else:
        for t in types:
            print(f'- ID: {t.id}, Nom: {t.nom}')
