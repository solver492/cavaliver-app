import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, inspect
from datetime import datetime

# Initialisation de l'application Flask
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///demenage.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

def log_migration(message):
    """Enregistre un message de migration avec horodatage"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[MIGRATION {timestamp}] {message}")

def create_migrations_table():
    """Crée la table de suivi des migrations si elle n'existe pas"""
    inspector = inspect(db.engine)
    if 'migrations' not in inspector.get_table_names():
        log_migration("Création de la table de suivi des migrations")
        with db.engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    migration_name VARCHAR(255) NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()

def migration_applied(migration_name):
    """Vérifie si une migration a déjà été appliquée"""
    with db.engine.connect() as conn:
        result = conn.execute(text(
            "SELECT COUNT(*) FROM migrations WHERE migration_name = :name"
        ), {"name": migration_name})
        return result.scalar() > 0

def record_migration(migration_name):
    """Enregistre qu'une migration a été appliquée"""
    with db.engine.connect() as conn:
        conn.execute(text(
            "INSERT INTO migrations (migration_name) VALUES (:name)"
        ), {"name": migration_name})
        conn.commit()

def check_column_exists(table_name, column_name):
    """Vérifie si une colonne existe dans une table"""
    inspector = inspect(db.engine)
    if table_name not in inspector.get_table_names():
        return False
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def add_column(table_name, column_name, column_type):
    """Ajoute une colonne à une table"""
    if not check_column_exists(table_name, column_name):
        log_migration(f"Ajout de la colonne {column_name} à la table {table_name}")
        with db.engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
            conn.commit()
        return True
    return False

def migration_001_add_prestation_columns():
    """Migration 001: Ajoute les colonnes manquantes à la table prestation"""
    migration_name = "001_add_prestation_columns"
    
    if migration_applied(migration_name):
        log_migration(f"Migration {migration_name} déjà appliquée")
        return
    
    log_migration(f"Application de la migration {migration_name}")
    
    # Colonnes à ajouter
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
        add_column('prestation', column_name, column_type)
    
    record_migration(migration_name)
    log_migration(f"Migration {migration_name} appliquée avec succès")

def migration_002_add_client_columns():
    """Migration 002: Ajoute les colonnes manquantes à la table client"""
    migration_name = "002_add_client_columns"
    
    if migration_applied(migration_name):
        log_migration(f"Migration {migration_name} déjà appliquée")
        return
    
    log_migration(f"Application de la migration {migration_name}")
    
    # Colonnes à ajouter
    columns = [
        ('tags', 'TEXT'),
        ('client_type', 'VARCHAR(50)')
    ]
    
    for column_name, column_type in columns:
        add_column('client', column_name, column_type)
    
    record_migration(migration_name)
    log_migration(f"Migration {migration_name} appliquée avec succès")

def migration_003_create_facture_tables():
    """Migration 003: Crée les tables facture et ligne_facture"""
    migration_name = "003_create_facture_tables"
    
    if migration_applied(migration_name):
        log_migration(f"Migration {migration_name} déjà appliquée")
        return
    
    log_migration(f"Application de la migration {migration_name}")
    
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    
    # Création de la table facture
    if 'facture' not in tables:
        log_migration("Création de la table facture")
        with db.engine.connect() as conn:
            conn.execute(text("""
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
            """))
            conn.commit()
    
    # Création de la table ligne_facture
    if 'ligne_facture' not in tables:
        log_migration("Création de la table ligne_facture")
        with db.engine.connect() as conn:
            conn.execute(text("""
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
            """))
            conn.commit()
    
    record_migration(migration_name)
    log_migration(f"Migration {migration_name} appliquée avec succès")

def run_migrations():
    """Exécute toutes les migrations dans l'ordre"""
    with app.app_context():
        try:
            # Créer la table de suivi des migrations
            create_migrations_table()
            
            # Exécuter les migrations dans l'ordre
            migration_001_add_prestation_columns()
            migration_002_add_client_columns()
            migration_003_create_facture_tables()
            
            log_migration("Toutes les migrations ont été appliquées avec succès")
            return 0
        except Exception as e:
            log_migration(f"ERREUR lors de la migration: {str(e)}")
            return 1

if __name__ == "__main__":
    sys.exit(run_migrations())