# Script pour corriger l'encodage des types de déménagement
from app import create_app, db
from models import TypeDemenagement

app = create_app()

with app.app_context():
    # Identifier les types de déménagement mal encodés
    types = TypeDemenagement.query.all()
    
    print("Types de déménagement avant correction:")
    for t in types:
        print(f"ID: {t.id}, Nom: {t.nom}")
        
    # Corriger les noms
    type_to_fix = TypeDemenagement.query.filter_by(id=6).first()
    if type_to_fix:
        type_to_fix.nom = "Déménagement d'entreprise"
        print(f"Correction du type ID 6: {type_to_fix.nom}")
    
    type_to_fix = TypeDemenagement.query.filter_by(id=7).first()
    if type_to_fix:
        type_to_fix.nom = "Transport d'objets volumineux"
        print(f"Correction du type ID 7: {type_to_fix.nom}")
    
    # Sauvegarder les changements
    db.session.commit()
    
    # Vérifier les résultats
    print("\nTypes de déménagement après correction:")
    for t in TypeDemenagement.query.all():
        print(f"ID: {t.id}, Nom: {t.nom}")
