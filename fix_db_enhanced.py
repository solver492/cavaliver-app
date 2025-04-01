#!/usr/bin/env python
import os
import sys
import sqlite3
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from datetime import datetime

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("db_fix.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DB_FIX")

# Initialisation de l'application Flask
app = Flask(__name__)

# Déterminer le chemin de la base de données
if os.environ.get('RENDER'):
    # Sur Render
    db_path = '/opt/render/project/src/instance/demenage.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
else:
    # En local
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///demenage.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

def log_info(message):
    """Log un message d'information"""
    logger.info(message)
    print(f"[INFO] {message}")

def log_error(message):
    """Log un message d'erreur"""
    logger.error(message)
    print(f"[ERROR] {message}")

def check_table_exists(table_name):
    """Vérifie si une table existe dans la base de données"""
    inspector = inspect(db.engine)
    return table_name in inspector.get_table_names()

def check_column_exists(table_name, column_name):
    """Vérifie si une colonne existe dans une table"""
    if not check_table_exists(table_name):
        return False
    
    inspector = inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def execute_sql(sql, params=None):
    """Exécute une requête SQL avec gestion d'erreur"""
    try:
        with db.engine.connect() as conn:
            if params:
                conn.execute(text(sql), params)
            else:
                conn.execute(text(sql))
            conn.commit()
        return True
    except Exception as e:
        log_error(f"Erreur lors de l'exécution de la requête SQL: {e}")
        return False

def create_facture_table():
    """Crée la table facture si elle n'existe pas"""
    if check_table_exists('facture'):
        log_info("La table 'facture' existe déjà")
        return True
    
    log_info("Création de la table 'facture'...")
    
    sql = """
    CREATE TABLE facture (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero VARCHAR(50) NOT NULL UNIQUE,
        prestation_id INTEGER,
        client_id INTEGER NOT NULL,
        montant_ht FLOAT NOT NULL,
        taux_tva FLOAT DEFAULT 20.0,
        montant_ttc FLOAT NOT NULL,
        date_emission DATETIME,
        date_echeance DATETIME,
        statut VARCHAR(20) DEFAULT 'en_attente',
        mode_paiement VARCHAR(50),
        date_paiement DATETIME,
        notes TEXT,
        created_by_id INTEGER,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prestation_id) REFERENCES prestation (id),
        FOREIGN KEY (client_id) REFERENCES client (id),
        FOREIGN KEY (created_by_id) REFERENCES user (id)
    )
    """
    
    if execute_sql(sql):
        log_info("Table 'facture' créée avec succès")
        return True
    else:
        log_error("Échec de la création de la table 'facture'")
        return False

def create_ligne_facture_table():
    """Crée la table ligne_facture si elle n'existe pas"""
    if check_table_exists('ligne_facture'):
        log_info("La table 'ligne_facture' existe déjà")
        return True
    
    log_info("Création de la table 'ligne_facture'...")
    
    sql = """
    CREATE TABLE ligne_facture (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facture_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantite INTEGER NOT NULL DEFAULT 1,
        prix_unitaire FLOAT NOT NULL,
        montant FLOAT NOT NULL,
        prestation_id INTEGER,
        FOREIGN KEY (facture_id) REFERENCES facture (id),
        FOREIGN KEY (prestation_id) REFERENCES prestation (id)
    )
    """
    
    if execute_sql(sql):
        log_info("Table 'ligne_facture' créée avec succès")
        return True
    else:
        log_error("Échec de la création de la table 'ligne_facture'")
        return False

def add_columns_to_prestation():
    """Ajoute les colonnes manquantes à la table prestation"""
    if not check_table_exists('prestation'):
        log_error("La table 'prestation' n'existe pas")
        return False
    
    columns_to_add = {
        'societe': 'VARCHAR(255)',
        'montant': 'FLOAT DEFAULT 0',
        'tags': 'TEXT',
        'trajet_depart': 'TEXT',
        'trajet_destination': 'TEXT',
        'requires_packaging': 'BOOLEAN DEFAULT 0',
        'demenagement_type': 'VARCHAR(50)',
        'camion_type': 'VARCHAR(50)',
        'priorite': 'INTEGER DEFAULT 0'
    }
    
    success = True
    for column_name, column_type in columns_to_add.items():
        if not check_column_exists('prestation', column_name):
            log_info(f"Ajout de la colonne '{column_name}' à la table 'prestation'...")
            sql = f"ALTER TABLE prestation ADD COLUMN {column_name} {column_type}"
            if not execute_sql(sql):
                log_error(f"Échec de l'ajout de la colonne '{column_name}'")
                success = False
        else:
            log_info(f"La colonne '{column_name}' existe déjà dans la table 'prestation'")
    
    return success

def add_columns_to_client():
    """Ajoute les colonnes manquantes à la table client"""
    if not check_table_exists('client'):
        log_error("La table 'client' n'existe pas")
        return False
    
    columns_to_add = {
        'tags': 'TEXT',
        'client_type': 'VARCHAR(50) DEFAULT "particulier"'
    }
    
    success = True
    for column_name, column_type in columns_to_add.items():
        if not check_column_exists('client', column_name):
            log_info(f"Ajout de la colonne '{column_name}' à la table 'client'...")
            sql = f"ALTER TABLE client ADD COLUMN {column_name} {column_type}"
            if not execute_sql(sql):
                log_error(f"Échec de l'ajout de la colonne '{column_name}'")
                success = False
        else:
            log_info(f"La colonne '{column_name}' existe déjà dans la table 'client'")
    
    return success

def create_prestation_transporter_table():
    """Crée la table prestation_transporter si elle n'existe pas"""
    if check_table_exists('prestation_transporter'):
        log_info("La table 'prestation_transporter' existe déjà")
        return True
    
    log_info("Création de la table 'prestation_transporter'...")
    
    sql = """
    CREATE TABLE prestation_transporter (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prestation_id INTEGER NOT NULL,
        transporter_id INTEGER NOT NULL,
        FOREIGN KEY (prestation_id) REFERENCES prestation (id),
        FOREIGN KEY (transporter_id) REFERENCES user (id)
    )
    """
    
    if execute_sql(sql):
        log_info("Table 'prestation_transporter' créée avec succès")
        return True
    else:
        log_error("Échec de la création de la table 'prestation_transporter'")
        return False

def create_admin_user():
    """Crée un utilisateur admin si aucun n'existe"""
    if not check_table_exists('user'):
        log_error("La table 'user' n'existe pas")
        return False
    
    # Vérifier si un admin existe déjà
    try:
        with db.engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM user WHERE role = 'admin'"))
            admin_count = result.scalar()
            
            if admin_count > 0:
                log_info("Un utilisateur admin existe déjà")
                return True
    except Exception as e:
        log_error(f"Erreur lors de la vérification des utilisateurs admin: {e}")
        return False
    
    # Créer un utilisateur admin
    log_info("Création d'un utilisateur admin...")
    
    from werkzeug.security import generate_password_hash
    
    sql = """
    INSERT INTO user (username, password_hash, email, nom, prenom, role, statut, date_creation)
    VALUES (:username, :password_hash, :email, :nom, :prenom, :role, :statut, :date_creation)
    """
    
    params = {
        'username': 'admin',
        'password_hash': generate_password_hash('admin123'),
        'email': 'admin@cavalier.com',
        'nom': 'Admin',
        'prenom': 'Cavalier',
        'role': 'admin',
        'statut': 'actif',
        'date_creation': datetime.utcnow()
    }
    
    if execute_sql(sql, params):
        log_info("Utilisateur admin créé avec succès (identifiant: admin, mot de passe: admin123)")
        return True
    else:
        log_error("Échec de la création de l'utilisateur admin")
        return False

def fix_database():
    """Fonction principale pour corriger la base de données"""
    log_info("Démarrage de la correction de la base de données...")
    
    # Vérifier que le répertoire de la base de données existe
    if os.environ.get('RENDER'):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        log_info(f"Répertoire de base de données créé: {os.path.dirname(db_path)}")
    
    # Créer les tables manquantes
    create_facture_table()
    create_ligne_facture_table()
    create_prestation_transporter_table()
    
    # Ajouter les colonnes manquantes
    add_columns_to_prestation()
    add_columns_to_client()
    
    # Créer un utilisateur admin si nécessaire
    create_admin_user()
    
    log_info("Correction de la base de données terminée")
    return True

if __name__ == "__main__":
    with app.app_context():
        success = fix_database()
        sys.exit(0 if success else 1)