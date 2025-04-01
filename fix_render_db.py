import os
import sqlite3
from flask import Flask
from models import db, User, Client, Prestation, Facture, LigneFacture
from werkzeug.security import generate_password_hash
from datetime import datetime

# Configuration de l'application Flask
app = Flask(__name__)

# Définir l'URI de la base de données pour Render
db_path = '/opt/render/project/src/instance/demenage.db'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialiser l'extension
db.init_app(app)

def fix_database():
    print("Correction de la base de données sur Render...")
    
    # S'assurer que le répertoire existe
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Connexion directe à SQLite pour les opérations de bas niveau
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Vérifier si les tables existent
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [table[0] for table in cursor.fetchall()]
    
    print(f"Tables existantes: {tables}")
    
    # Si la base de données est vide ou corrompue, recréer toutes les tables
    if 'user' not in tables or 'client' not in tables or 'prestation' not in tables:
        print("Tables principales manquantes, création de toutes les tables...")
        with app.app_context():
            db.drop_all()  # Supprimer toutes les tables existantes
            db.create_all()  # Créer toutes les tables selon les modèles
            
            # Créer un utilisateur admin par défaut
            admin = User.query.filter_by(username='admin').first()
            if not admin:
                admin = User(
                    username='admin',
                    email='admin@cavalier.com',
                    nom='Admin',
                    prenom='Cavalier',
                    role='admin',
                    statut='actif',
                    date_creation=datetime.utcnow()
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                print('Utilisateur admin créé avec succès!')
        
        print("Toutes les tables ont été créées avec succès!")
        return
    
    # Vérifier et ajouter les colonnes manquantes dans la table client
    try:
        cursor.execute("PRAGMA table_info(client);")
        client_columns = [column[1] for column in cursor.fetchall()]
        
        if 'tags' not in client_columns:
            print("Ajout de la colonne 'tags' à la table 'client'...")
            cursor.execute("ALTER TABLE client ADD COLUMN tags TEXT;")
            conn.commit()
    except Exception as e:
        print(f"Erreur lors de la modification de la table client: {e}")
    
    # Vérifier et ajouter les colonnes manquantes dans la table prestation
    try:
        cursor.execute("PRAGMA table_info(prestation);")
        prestation_columns = [column[1] for column in cursor.fetchall()]
        
        if 'societe' not in prestation_columns:
            print("Ajout de la colonne 'societe' à la table 'prestation'...")
            cursor.execute("ALTER TABLE prestation ADD COLUMN societe TEXT;")
            conn.commit()
        
        if 'montant' not in prestation_columns:
            print("Ajout de la colonne 'montant' à la table 'prestation'...")
            cursor.execute("ALTER TABLE prestation ADD COLUMN montant FLOAT;")
            conn.commit()
        
        if 'tags' not in prestation_columns:
            print("Ajout de la colonne 'tags' à la table 'prestation'...")
            cursor.execute("ALTER TABLE prestation ADD COLUMN tags TEXT;")
            conn.commit()
    except Exception as e:
        print(f"Erreur lors de la modification de la table prestation: {e}")
    
    # Créer la table facture si elle n'existe pas
    if 'facture' not in tables:
        print("Création de la table 'facture'...")
        try:
            with app.app_context():
                # Utiliser SQLAlchemy pour créer uniquement la table facture
                Facture.__table__.create(db.engine)
                LigneFacture.__table__.create(db.engine)
                print("Table 'facture' créée avec succès!")
        except Exception as e:
            print(f"Erreur lors de la création de la table facture: {e}")
            
            # Si SQLAlchemy échoue, essayer avec SQLite directement
            try:
                cursor.execute('''
                CREATE TABLE facture (
                    id INTEGER PRIMARY KEY,
                    numero TEXT NOT NULL UNIQUE,
                    prestation_id INTEGER NOT NULL,
                    client_id INTEGER NOT NULL,
                    montant_ht FLOAT NOT NULL,
                    taux_tva FLOAT DEFAULT 20.0,
                    montant_ttc FLOAT NOT NULL,
                    date_emission TIMESTAMP,
                    date_echeance TIMESTAMP,
                    statut TEXT DEFAULT 'en_attente',
                    mode_paiement TEXT,
                    date_paiement TIMESTAMP,
                    notes TEXT,
                    created_by_id INTEGER NOT NULL,
                    date_creation TIMESTAMP,
                    FOREIGN KEY (prestation_id) REFERENCES prestation (id),
                    FOREIGN KEY (client_id) REFERENCES client (id),
                    FOREIGN KEY (created_by_id) REFERENCES user (id)
                );
                ''')
                
                cursor.execute('''
                CREATE TABLE ligne_facture (
                    id INTEGER PRIMARY KEY,
                    facture_id INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    quantite FLOAT DEFAULT 1,
                    prix_unitaire FLOAT NOT NULL,
                    montant FLOAT NOT NULL,
                    FOREIGN KEY (facture_id) REFERENCES facture (id)
                );
                ''')
                
                conn.commit()
                print("Tables 'facture' et 'ligne_facture' créées manuellement avec succès!")
            except Exception as e2:
                print(f"Erreur lors de la création manuelle des tables: {e2}")
    
    # Fermer la connexion
    cursor.close()
    conn.close()
    
    print("Correction de la base de données terminée!")

if __name__ == '__main__':
    fix_database()
