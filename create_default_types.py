# Script pour créer des types de déménagement par défaut
from app import create_app
from extensions import db
from models import TypeDemenagement

app = create_app()

with app.app_context():
    # Vérifier si des types existent déjà
    existing_types = TypeDemenagement.query.count()
    
    if existing_types == 0:
        print('Aucun type de déménagement trouvé. Création des types par défaut...')
        
        # Définir les types exacts comme dans l'application en production
        default_types = [
            TypeDemenagement(nom='Déménagement d\'appartement', description='Déménagement d\'un appartement'),
            TypeDemenagement(nom='Déménagement d\'entreprise', description='Déménagement de bureaux ou locaux professionnels'),
            TypeDemenagement(nom='Déménagement de maison', description='Déménagement d\'une maison'),
            TypeDemenagement(nom='Déménagement de piano/objets lourds', description='Transport de piano ou objets volumineux'),
            TypeDemenagement(nom='Déménagement international', description='Déménagement vers ou depuis l\'étranger'),
            TypeDemenagement(nom='Déménagement local (< 50km)', description='Déménagement dans la même région, moins de 50km'),
            TypeDemenagement(nom='Déménagement national (> 200km)', description='Déménagement longue distance, plus de 200km'),
            TypeDemenagement(nom='Déménagement régional (50-200km)', description='Déménagement moyenne distance, entre 50 et 200km'),
            TypeDemenagement(nom='Garde-meuble/Stockage', description='Service de stockage temporaire ou permanent')
        ]
        
        # Ajouter u00e0 la base de donnu00e9es
        for type_dem in default_types:
            db.session.add(type_dem)
        
        db.session.commit()
        print(f'{len(default_types)} types de du00e9mu00e9nagement cru00e9u00e9s avec succu00e8s!')
    else:
        print(f'{existing_types} types de du00e9mu00e9nagement du00e9ju00e0 pru00e9sents dans la base de donnu00e9es.')
