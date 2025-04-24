# Script pour diagnostiquer le problu00e8me des prestations u00e0 confirmer
from app import create_app, db
from models import User, Prestation, Client

app = create_app()

with app.app_context():
    print("\n=== Du00e9bogage des prestations u00e0 confirmer ===\n")
    
    # Vu00e9rifier les transporteurs disponibles
    transporteurs = User.query.filter_by(role='transporteur').all()
    print(f"Nombre de transporteurs: {len(transporteurs)}")
    
    for t in transporteurs:
        print(f"\nTransporteur: {t.nom} {t.prenom} (ID: {t.id})")
        
        # Prestations assignu00e9es au transporteur
        prestations = Prestation.query.filter(
            Prestation.transporteurs.any(id=t.id)
        ).all()
        
        print(f"Nombre total de prestations assignu00e9es: {len(prestations)}")
        
        # Prestations en attente de confirmation
        prestations_a_confirmer = Prestation.query.filter(
            Prestation.statut == 'En attente',
            Prestation.transporteurs.any(id=t.id),
            Prestation.archive == False
        ).all()
        
        print(f"Prestations en attente de confirmation: {len(prestations_a_confirmer)}")
        
        # Du00e9tails des prestations
        if prestations:
            print("\nDu00e9tails des prestations:")
            for p in prestations:
                client_nom = f"{p.client.nom} {p.client.prenom}" if p.client else "Client inconnu"
                print(f"- ID: {p.id}, Client: {client_nom}, Statut: {p.statut}, Date: {p.date_debut.strftime('%d/%m/%Y')}")
        
    # Solution: cru00e9er une prestation en attente si aucune n'existe
    if not prestations_a_confirmer and transporteurs:
        print("\n=== Cru00e9ation d'une prestation de test u00e0 confirmer ===\n")
        
        # Trouver un client existant
        client = Client.query.first()
        if not client:
            print("Aucun client disponible pour cru00e9er une prestation de test")
        else:
            print(f"Utilisation du client: {client.nom} {client.prenom}")
            
            # Cru00e9er une prestation de test
            from datetime import datetime, timedelta
            
            nouvelle_prestation = Prestation(
                client_id=client.id,
                date_debut=datetime.now() + timedelta(days=1),
                date_fin=datetime.now() + timedelta(days=2),
                adresse_depart="1 Rue du Test",
                adresse_arrivee="2 Avenue de Du00e9mo",
                type_demenagement="Du00e9mu00e9nagement standard",
                statut="En attente"
            )
            
            # Assigner le premier transporteur
            nouvelle_prestation.transporteurs.append(transporteurs[0])
            
            # Enregistrer la prestation
            db.session.add(nouvelle_prestation)
            db.session.commit()
            
            print(f"Prestation de test cru00e9u00e9e avec l'ID {nouvelle_prestation.id} et assignu00e9e au transporteur {transporteurs[0].nom} {transporteurs[0].prenom}")
