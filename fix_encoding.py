# Script pour corriger l'encodage des types de du00e9mu00e9nagement
from app import create_app, db
from models import TypeDemenagement

app = create_app()

with app.app_context():
    # Corriger les problu00e8mes d'encodage dans les noms de types de du00e9mu00e9nagement
    types_to_fix = {
        'Du00e9mu00e9nagement d\'entreprise': 'Du00e9mu00e9nagement d\'entreprise',
        'Transport d\'objets volumineux': 'Transport d\'objets volumineux'
    }
    
    for old_name, new_name in types_to_fix.items():
        type_to_update = TypeDemenagement.query.filter(TypeDemenagement.nom.like(f'%{old_name}%')).first()
        if type_to_update:
            print(f'Correction du type: {type_to_update.nom} -> {new_name}')
            type_to_update.nom = new_name
            db.session.commit()
        else:
            print(f'Type {old_name} non trouvu00e9')
    
    # Afficher les types mis u00e0 jour
    print('\nTypes de du00e9mu00e9nagement apru00e8s correction:')
    for t in TypeDemenagement.query.all():
        print(f'- ID: {t.id}, Nom: {t.nom}')
