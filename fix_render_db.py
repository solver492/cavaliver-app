import os
import sys
import sqlite3
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Initialisation minimale de l'application Flask
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///demenage.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

def log_message(message):
    """Affiche un message de log formaté"""
    print(f"[FIX DB] {message}")

def check_column_exists(table_name, column_name):
    """Vérifie si une colonne existe dans une table"""
    inspector = inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def check_table_exists(table_name):
    """Vérifie si une table existe dans la base de données"""
    inspector = inspect(db.engine)
    return table_name in inspector.get_table_names()

def add_column_if_not_exists(table_name, column_name, column_type):
    """Ajoute une colonne à une table si elle n'existe pas déjà"""
    if not check_column_exists(table_name, column_name):
        log_message(f"Ajout de la colonne {column_name} à la table {table_name}")
        with db.engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
            conn.commit()
        return True
    return False

def create_table_if_not_exists(table_name, create_statement):
    """Crée une table si elle n'existe pas déjà"""
    if not check_table_exists(table_name):
        log_message(f"Création de la table {table_name}")
        with db.engine.connect() as conn:
            conn.execute(text(create_statement))
            conn.commit()
        return True
    return False

def fix_prestation_table():
    """Corrige la structure de la table prestation"""
    log_message("Vérification de la table prestation...")
    
    # Liste des colonnes à ajouter avec leur type
    columns = [
        ('societe', 'VARCHAR(255)'),
        ('montant', 'FLOAT'),
        ('tags', 'TEXT'),
        ('trajet_depart', 'TEXT'),
        ('trajet_destination', 'TEXT'),
        ('requires_packaging', 'BOOLEAN'),
        ('demenagement_type', 'VARCHAR(50)'),
        ('camion_type', 'VARCHAR(50)'),
        ('priorite', 'INTEGER')
    ]
    
    for column_name, column_type in columns:
        add_column_if_not_exists('prestation', column_name, column_type)

def fix_client_table():
    """Corrige la structure de la table client"""
    log_message("Vérification de la table client...")
    
    # Liste des colonnes à ajouter avec leur type
    columns = [
        ('tags', 'TEXT'),
        ('client_type', 'VARCHAR(50)')
    ]
    
    for column_name, column_type in columns:
        add_column_if_not_exists('client', column_name, column_type)

def create_facture_tables():
    """Crée les tables facture et ligne_facture si elles n'existent pas"""
    log_message("Vérification des tables facture et ligne_facture...")
    
    # Création de la table facture
    facture_table = """
    CREATE TABLE facture (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero VARCHAR(50) NOT NULL,
        date_emission DATE NOT NULL,
        date_echeance DATE NOT NULL,
        client_id INTEGER,
        montant FLOAT NOT NULL,
        statut VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES client (id)
    )
    """
    create_table_if_not_exists('facture', facture_table)
    
    # Création de la table ligne_facture
    ligne_facture_table = """
    CREATE TABLE ligne_facture (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facture_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantite INTEGER NOT NULL,
        prix_unitaire FLOAT NOT NULL,
        montant FLOAT NOT NULL,
        prestation_id INTEGER,
        FOREIGN KEY (facture_id) REFERENCES facture (id),
        FOREIGN KEY (prestation_id) REFERENCES prestation (id)
    )
    """
    create_table_if_not_exists('ligne_facture', ligne_facture_table)

def ensure_admin_user():
    """S'assure qu'un utilisateur admin existe"""
    log_message("Vérification de l'utilisateur admin...")
    
    # Vérifier si la table user existe
    if not check_table_exists('user'):
        log_message("Création de la table user...")
        user_table = """
        CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(200) NOT NULL,
            email VARCHAR(100),
            role VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        create_table_if_not_exists('user', user_table)
    
    # Vérifier si un admin existe déjà
    with db.engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM user WHERE role = 'admin'"))
        admin_count = result.scalar()
    
    if admin_count == 0:
        from werkzeug.security import generate_password_hash
        
        log_message("Création d'un utilisateur admin par défaut...")
        admin_password = generate_password_hash('admin123')
        
        with db.engine.connect() as conn:
            conn.execute(text(
                "INSERT INTO user (username, password_hash, email, role) VALUES (:username, :password, :email, :role)"
            ), {
                'username': 'admin',
                'password': admin_password,
                'email': 'admin@example.com',
                'role': 'admin'
            })
            conn.commit()
        log_message("Utilisateur admin créé avec succès (identifiant: admin, mot de passe: admin123)")

def main():
    """Fonction principale qui exécute toutes les corrections"""
    log_message("Démarrage de la correction de la base de données...")
    
    try:
        with app.app_context():
            # Vérifier la connexion à la base de données
            db.engine.connect()
            log_message("Connexion à la base de données établie avec succès")
            
            # Appliquer les corrections
            fix_prestation_table()
            fix_client_table()
            create_facture_tables()
            ensure_admin_user()
            
            log_message("Correction de la base de données terminée avec succès")
    except Exception as e:
        log_message(f"ERREUR: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())