from datetime import datetime, timedelta
from app import create_app, db
from models import Prestation, Client, User, Agenda, Document # Import all models

app = create_app()

def create_test_data():
    with app.app_context():
        # Création d'un agenda test
        agenda = Agenda(
            nom="Agenda principal",
            description="Agenda pour la gestion des prestations",
            user_id=1  # L'admin créé précédemment - Assumes admin with ID 1 exists
        )
        db.session.add(agenda)

        # Création d'un client test
        client = Client(
            nom="Dupont",
            prenom="Jean",
            telephone="0123456789",
            email="jean.dupont@example.com",
            adresse="123 Rue Test"
        )
        db.session.add(client)

        # Création d'une prestation test
        prestation = Prestation(
            client_id=1, # client_id refers to the client just added above.
            date_debut=datetime.now(),
            date_fin=datetime.now() + timedelta(hours=2),
            adresse_depart="1 Rue Départ",
            adresse_arrivee="2 Rue Arrivée",
            type_demenagement="Standard"
        )
        db.session.add(prestation)

        # Création d'un document test
        document = Document(
            nom="Document test",
            chemin="/uploads/test.pdf",
            agenda_id=1 # agenda_id refers to the agenda just added above.
        )
        db.session.add(document)

        db.session.commit()
        print("Données de test créées avec succès")

with app.app_context():
    # Vérifier combien de prestations existent
    prestation_count = Prestation.query.count()
    print(f'Nombre de prestations existantes: {prestation_count}')
    
    if prestation_count == 0:
        print("Création de prestations de test...")
        create_test_data() # Call the new function to create test data
    else:
        print("Des prestations existent déjà dans la base de données.  Existing data will not be overwritten.")

    # Vérifier à nouveau le nombre de prestations
    updated_count = Prestation.query.count()
    print(f'Nombre final de prestations: {updated_count}')
    
    # Afficher les prestations actuelles
    print("\nListe des prestations:")
    for p in Prestation.query.all():
        print(f"ID: {p.id}, Client: {p.client.nom if p.client else 'Aucun'}, Date: {p.date_debut.strftime('%Y-%m-%d')}, Statut: {p.statut}")