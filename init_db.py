import os
import sys
from datetime import datetime, timedelta
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import random

# Initialisation de l'application Flask
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///demenage.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

def log_init(message):
    """Affiche un message de log formaté"""
    print(f"[INIT DB] {message}")

def check_if_initialized():
    """Vérifie si la base de données a déjà été initialisée"""
    try:
        # Vérifier si la table user existe et contient des données
        with db.engine.connect() as conn:
            result = conn.execute("SELECT COUNT(*) FROM user")
            user_count = result.scalar()
            
            if user_count > 0:
                log_init("La base de données a déjà été initialisée")
                return True
    except Exception:
        # Si la requête échoue, c'est probablement parce que la table n'existe pas
        pass
    
    return False

def create_admin_user():
    """Crée un utilisateur administrateur"""
    log_init("Création de l'utilisateur administrateur...")
    
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    with db.engine.connect() as conn:
        conn.execute("""
            INSERT INTO user (username, password_hash, email, role)
            VALUES (:username, :password, :email, :role)
        """, {
            'username': 'admin',
            'password': generate_password_hash(admin_password),
            'email': 'admin@example.com',
            'role': 'admin'
        })
        conn.commit()
    
    log_init(f"Utilisateur admin créé avec succès (mot de passe: {admin_password})")

def create_sample_clients():
    """Crée des clients d'exemple"""
    log_init("Création de clients d'exemple...")
    
    clients = [
        {
            'nom': 'Dupont',
            'prenom': 'Jean',
            'email': 'jean.dupont@example.com',
            'telephone': '0123456789',
            'adresse': '123 Rue de Paris',
            'ville': 'Paris',
            'code_postal': '75001',
            'pays': 'France',
            'notes': 'Client régulier',
            'tags': 'vip,régulier',
            'client_type': 'particulier'
        },
        {
            'nom': 'Martin',
            'prenom': 'Sophie',
            'email': 'sophie.martin@example.com',
            'telephone': '0987654321',
            'adresse': '456 Avenue des Champs-Élysées',
            'ville': 'Paris',
            'code_postal': '75008',
            'pays': 'France',
            'notes': 'Préfère être contactée par email',
            'tags': 'email,nouveau',
            'client_type': 'particulier'
        },
        {
            'nom': 'Entreprise ABC',
            'prenom': '',
            'email': 'contact@entrepriseabc.com',
            'telephone': '0123789456',
            'adresse': '789 Boulevard Haussmann',
            'ville': 'Paris',
            'code_postal': '75009',
            'pays': 'France',
            'notes': 'Entreprise avec plusieurs sites',
            'tags': 'entreprise,multiple',
            'client_type': 'entreprise'
        }
    ]
    
    for client in clients:
        with db.engine.connect() as conn:
            conn.execute("""
                INSERT INTO client (nom, prenom, email, telephone, adresse, ville, code_postal, pays, notes, tags, client_type, created_at, updated_at)
                VALUES (:nom, :prenom, :email, :telephone, :adresse, :ville, :code_postal, :pays, :notes, :tags, :client_type, :created_at, :updated_at)
            """, {
                **client,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
            conn.commit()
    
    log_init(f"Création de {len(clients)} clients d'exemple terminée")

def create_sample_prestations():
    """Crée des prestations d'exemple"""
    log_init("Création de prestations d'exemple...")
    
    # Récupérer les IDs des clients
    with db.engine.connect() as conn:
        result = conn.execute("SELECT id FROM client")
        client_ids = [row[0] for row in result]
    
    if not client_ids:
        log_init("Aucun client trouvé, impossible de créer des prestations")
        return
    
    today = datetime.utcnow().date()
    
    prestations = [
        {
            'client_id': client_ids[0],
            'titre': 'Déménagement appartement',
            'description': 'Déménagement d\'un appartement de 3 pièces',
            'date_debut': today + timedelta(days=7),
            'date_fin': today + timedelta(days=8),
            'statut': 'confirmé',
            'societe': 'Déménageurs Pro',
            'montant': 1200.0,
            'tags': 'urgent,fragile',
            'trajet_depart': 'Paris',
            'trajet_destination': 'Lyon',
            'requires_packaging': True,
            'demenagement_type': 'résidentiel',
            'camion_type': 'moyen',
            'priorite': 2
        },
        {
            'client_id': client_ids[1],
            'titre': 'Transport de piano',
            'description': 'Transport d\'un piano à queue',
            'date_debut': today + timedelta(days=14),
            'date_fin': today + timedelta(days=14),
            'statut': 'en_attente',
            'societe': 'Spécialistes Piano',
            'montant': 800.0,
            'tags': 'fragile,spécial',
            'trajet_depart': 'Paris',
            'trajet_destination': 'Versailles',
            'requires_packaging': True,
            'demenagement_type': 'spécial',
            'camion_type': 'petit',
            'priorite': 1
        },
        {
            'client_id': client_ids[2],
            'titre': 'Déménagement bureaux',
            'description': 'Déménagement des bureaux de l\'entreprise',
            'date_debut': today + timedelta(days=30),
            'date_fin': today + timedelta(days=32),
            'statut': 'en_attente',
            'societe': 'Déménageurs Entreprise',
            'montant': 5000.0,
            'tags': 'entreprise,volumineux',
            'trajet_depart': 'Paris',
            'trajet_destination': 'Nantes',
            'requires_packaging': False,
            'demenagement_type': 'commercial',
            'camion_type': 'grand',
            'priorite': 3
        }
    ]
    
    for prestation in prestations:
        with db.engine.connect() as conn:
            conn.execute("""
                INSERT INTO prestation (client_id, titre, description, date_debut, date_fin, statut, societe, montant, tags, 
                                       trajet_depart, trajet_destination, requires_packaging, demenagement_type, camion_type, 
                                       priorite, created_at, updated_at)
                VALUES (:client_id, :titre, :description, :date_debut, :date_fin, :statut, :societe, :montant, :tags, 
                        :trajet_depart, :trajet_destination, :requires_packaging, :demenagement_type, :camion_type, 
                        :priorite, :created_at, :updated_at)
            """, {
                **prestation,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
            conn.commit()
    
    log_init(f"Création de {len(prestations)} prestations d'exemple terminée")

def create_sample_factures():
    """Crée des factures d'exemple"""
    log_init("Création de factures d'exemple...")
    
    # Récupérer les prestations
    with db.engine.connect() as conn:
        result = conn.execute("""
            SELECT p.id, p.client_id, p.titre, p.montant 
            FROM prestation p
            WHERE p.statut = 'confirmé'
        """)
        prestations = [dict(zip(['id', 'client_id', 'titre', 'montant'], row)) for row in result]
    
    if not prestations:
        log_init("Aucune prestation confirmée trouvée, impossible de créer des factures")
        return
    
    today = datetime.utcnow().date()
    
    for i, prestation in enumerate(prestations):
        # Créer la facture
        facture_numero = f"FACT-{datetime.utcnow().strftime('%Y%m')}-{i+1:03d}"
        
        with db.engine.connect() as conn:
            # Insérer la facture
            conn.execute("""
                INSERT INTO facture (numero, date_emission, date_echeance, client_id, montant, statut, notes, created_at)
                VALUES (:numero, :date_emission, :date_echeance, :client_id, :montant, :statut, :notes, :created_at)
            """, {
                'numero': facture_numero,
                'date_emission': today,
                'date_echeance': today + timedelta(days=30),
                'client_id': prestation['client_id'],
                'montant': prestation['montant'],
                'statut': 'en_attente',
                'notes': f"Facture pour la prestation: {prestation['titre']}",
                'created_at': datetime.utcnow()
            })
            
            # Récupérer l'ID de la facture créée
            result = conn.execute("SELECT id FROM facture WHERE numero = :numero", {'numero': facture_numero})
            facture_id = result.scalar()
            
            # Insérer la ligne de facture
            conn.execute("""
                INSERT INTO ligne_facture (facture_id, description, quantite, prix_unitaire, montant, prestation_id)
                VALUES (:facture_id, :description, :quantite, :prix_unitaire, :montant, :prestation_id)
            """, {
                'facture_id': facture_id,
                'description': f"Prestation: {prestation['titre']}",
                'quantite': 1,
                'prix_unitaire': prestation['montant'],
                'montant': prestation['montant'],
                'prestation_id': prestation['id']
            })
            
            conn.commit()
    
    log_init(f"Création de {len(prestations)} factures d'exemple terminée")

def initialize_database():
    """Initialise la base de données avec des données de base"""
    log_init("Démarrage de l'initialisation de la base de données...")
    
    try:
        # Vérifier si la base de données est déjà initialisée
        if check_if_initialized():
            log_init("La base de données est déjà initialisée, aucune action nécessaire")
            return 0
        
        # Créer l'utilisateur administrateur
        create_admin_user()
        
        # Créer des données d'exemple
        create_sample_clients()
        create_sample_prestations()
        create_sample_factures()
        
        log_init("Initialisation de la base de données terminée avec succès")
        return 0
    except Exception as e:
        log_init(f"ERREUR lors de l'initialisation de la base de données: {str(e)}")
        return 1

if __name__ == "__main__":
    with app.app_context():
        sys.exit(initialize_database())