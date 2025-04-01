#!/usr/bin/env python
import os
import sys
import sqlite3
import logging
from datetime import datetime
from werkzeug.security import generate_password_hash

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("direct_db_fix.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DIRECT_DB_FIX")

# Déterminer le chemin de la base de données
if os.environ.get('RENDER'):
    # Sur Render
    db_path = '/opt/render/project/src/instance/demenage.db'
else:
    # En local
    db_path = 'instance/demenage.db'

def log_info(message):
    """Log un message d'information"""
    logger.info(message)
    print(f"[INFO] {message}")

def log_error(message):
    """Log un message d'erreur"""
    logger.error(message)
    print(f"[ERROR] {message}")

def execute_sql(conn, sql, params=None):
    """Exécute une requête SQL avec gestion d'erreur"""
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        conn.commit()
        return True
    except Exception as e:
        log_error(f"Erreur lors de l'exécution de la requête SQL: {e}")
        return False

def check_table_exists(conn, table_name):
    """Vérifie si une table existe dans la base de données"""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    return cursor.fetchone() is not None

def check_column_exists(conn, table_name, column_name):
    """Vérifie si une colonne existe dans une table"""
    if not check_table_exists(conn, table_name):
        return False
    
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT {column_name} FROM {table_name} LIMIT 1")
        return True
    except sqlite3.OperationalError:
        return False

def add_column_if_not_exists(conn, table_name, column_name, column_type):
    """Ajoute une colonne à une table si elle n'existe pas déjà"""
    if not check_column_exists(conn, table_name, column_name):
        log_info(f"Ajout de la colonne '{column_name}' à la table '{table_name}'")
        return execute_sql(conn, f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
    else:
        log_info(f"La colonne '{column_name}' existe déjà dans la table '{table_name}'")
        return True

def create_facture_table(conn):
    """Crée la table facture si elle n'existe pas"""
    if check_table_exists(conn, 'facture'):
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
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """
    
    if execute_sql(conn, sql):
        log_info("Table 'facture' créée avec succès")
        return True
    else:
        log_error("Échec de la création de la table 'facture'")
        return False

def create_ligne_facture_table(conn):
    """Crée la table ligne_facture si elle n'existe pas"""
    if check_table_exists(conn, 'ligne_facture'):
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
        prestation_id INTEGER
    )
    """
    
    if execute_sql(conn, sql):
        log_info("Table 'ligne_facture' créée avec succès")
        return True
    else:
        log_error("Échec de la création de la table 'ligne_facture'")
        return False

def add_columns_to_prestation(conn):
    """Ajoute les colonnes manquantes à la table prestation"""
    if not check_table_exists(conn, 'prestation'):
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
        if not add_column_if_not_exists(conn, 'prestation', column_name, column_type):
            success = False
    
    return success

def add_columns_to_client(conn):
    """Ajoute les colonnes manquantes à la table client"""
    if not check_table_exists(conn, 'client'):
        log_error("La table 'client' n'existe pas")
        return False
    
    columns_to_add = {
        'tags': 'TEXT',
        'client_type': 'VARCHAR(50) DEFAULT "particulier"'
    }
    
    success = True
    for column_name, column_type in columns_to_add.items():
        if not add_column_if_not_exists(conn, 'client', column_name, column_type):
            success = False
    
    return success

def create_prestation_transporter_table(conn):
    """Crée la table prestation_transporter si elle n'existe pas"""
    if check_table_exists(conn, 'prestation_transporter'):
        log_info("La table 'prestation_transporter' existe déjà")
        return True
    
    log_info("Création de la table 'prestation_transporter'...")
    
    sql = """
    CREATE TABLE prestation_transporter (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prestation_id INTEGER NOT NULL,
        transporter_id INTEGER NOT NULL
    )
    """
    
    if execute_sql(conn, sql):
        log_info("Table 'prestation_transporter' créée avec succès")
        return True
    else:
        log_error("Échec de la création de la table 'prestation_transporter'")
        return False

def create_admin_user(conn):
    """Crée un utilisateur admin si aucun n'existe"""
    if not check_table_exists(conn, 'user'):
        log_error("La table 'user' n'existe pas")
        return False
    
    # Vérifier si un admin existe déjà
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM user WHERE role = 'admin'")
    admin_count = cursor.fetchone()[0]
    
    if admin_count > 0:
        log_info("Un utilisateur admin existe déjà")
        return True
    
    # Créer un utilisateur admin
    log_info("Création d'un utilisateur admin...")
    
    # Utiliser l'algorithme pbkdf2 au lieu de scrypt (qui n'est pas supporté sur Render)
    admin_password = generate_password_hash('admin123', method='pbkdf2:sha256')
    
    sql = """
    INSERT INTO user (username, password_hash, email, nom, prenom, role, statut, date_creation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    params = (
        'admin',
        admin_password,
        'admin@cavalier.com',
        'Admin',
        'Cavalier',
        'admin',
        'actif',
        datetime.utcnow()
    )
    
    if execute_sql(conn, sql, params):
        log_info("Utilisateur admin créé avec succès (identifiant: admin, mot de passe: admin123)")
        return True
    else:
        log_error("Échec de la création de l'utilisateur admin")
        return False

def fix_database():
    """Fonction principale pour corriger la base de données"""
    log_info("Démarrage de la correction directe de la base de données...")
    
    # Vérifier que le répertoire de la base de données existe
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    log_info(f"Répertoire de base de données: {os.path.dirname(db_path)}")
    
    # Afficher le chemin complet de la base de données
    abs_path = os.path.abspath(db_path)
    log_info(f"Chemin absolu de la base de données: {abs_path}")
    
    # Vérifier si le fichier de base de données existe
    if not os.path.exists(db_path):
        log_info(f"Le fichier de base de données n'existe pas encore: {db_path}")
    else:
        log_info(f"Le fichier de base de données existe: {db_path}")
        log_info(f"Taille du fichier: {os.path.getsize(db_path)} octets")
    
    # Connexion à la base de données
    try:
        conn = sqlite3.connect(db_path)
        log_info("Connexion à la base de données établie avec succès")
        
        # Lister les tables existantes
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        log_info(f"Tables existantes: {tables}")
        
        # Créer les tables manquantes
        create_facture_table(conn)
        create_ligne_facture_table(conn)
        create_prestation_transporter_table(conn)
        
        # Ajouter les colonnes manquantes
        add_columns_to_prestation(conn)
        add_columns_to_client(conn)
        
        # Créer un utilisateur admin si nécessaire
        create_admin_user(conn)
        
        # Lister les tables après correction
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables_after = [row[0] for row in cursor.fetchall()]
        log_info(f"Tables après correction: {tables_after}")
        
        # Fermer la connexion
        conn.close()
        log_info("Correction de la base de données terminée avec succès")
        return True
    except Exception as e:
        log_error(f"Erreur lors de la correction de la base de données: {e}")
        return False

if __name__ == "__main__":
    success = fix_database()
    sys.exit(0 if success else 1)