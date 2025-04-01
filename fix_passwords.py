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
        logging.FileHandler("fix_passwords.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("FIX_PASSWORDS")

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

def reset_all_passwords(conn, default_password='password123'):
    """Réinitialise les mots de passe de tous les utilisateurs"""
    try:
        # Vérifier si la table user existe
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
        if not cursor.fetchone():
            log_error("La table 'user' n'existe pas")
            return False
        
        # Compter les utilisateurs
        cursor.execute("SELECT COUNT(*) FROM user")
        user_count = cursor.fetchone()[0]
        log_info(f"Nombre total d'utilisateurs: {user_count}")
        
        if user_count == 0:
            log_info("Aucun utilisateur à mettre à jour")
            return True
        
        # Générer un nouveau hash avec pbkdf2:sha256
        new_password_hash = generate_password_hash(default_password, method='pbkdf2:sha256')
        
        # Mettre à jour tous les utilisateurs
        cursor.execute("UPDATE user SET password_hash = ?", (new_password_hash,))
        conn.commit()
        
        log_info(f"Tous les mots de passe ont été réinitialisés à '{default_password}'")
        
        # Lister les utilisateurs mis à jour
        cursor.execute("SELECT id, username, role FROM user")
        users = cursor.fetchall()
        for user in users:
            log_info(f"Utilisateur mis à jour: ID={user[0]}, Username={user[1]}, Role={user[2]}")
        
        return True
    except Exception as e:
        log_error(f"Erreur lors de la réinitialisation des mots de passe: {e}")
        return False

def reset_admin_passwords(conn, admin_password='admin123'):
    """Réinitialise les mots de passe des administrateurs uniquement"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si la table user existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
        if not cursor.fetchone():
            log_error("La table 'user' n'existe pas")
            return False
        
        # Compter les administrateurs
        cursor.execute("SELECT COUNT(*) FROM user WHERE role = 'admin'")
        admin_count = cursor.fetchone()[0]
        log_info(f"Nombre d'administrateurs: {admin_count}")
        
        if admin_count == 0:
            log_info("Aucun administrateur à mettre à jour")
            return True
        
        # Générer un nouveau hash avec pbkdf2:sha256
        new_password_hash = generate_password_hash(admin_password, method='pbkdf2:sha256')
        
        # Mettre à jour les administrateurs
        cursor.execute("UPDATE user SET password_hash = ? WHERE role = 'admin'", (new_password_hash,))
        conn.commit()
        
        log_info(f"Les mots de passe des administrateurs ont été réinitialisés à '{admin_password}'")
        
        # Lister les administrateurs mis à jour
        cursor.execute("SELECT id, username FROM user WHERE role = 'admin'")
        admins = cursor.fetchall()
        for admin in admins:
            log_info(f"Administrateur mis à jour: ID={admin[0]}, Username={admin[1]}")
        
        return True
    except Exception as e:
        log_error(f"Erreur lors de la réinitialisation des mots de passe admin: {e}")
        return False

def fix_password_algorithm():
    """Fonction principale pour corriger les algorithmes de mot de passe"""
    log_info("Démarrage de la correction des algorithmes de mot de passe...")
    
    # Vérifier que le répertoire de la base de données existe
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    log_info(f"Répertoire de base de données: {os.path.dirname(db_path)}")
    
    # Vérifier si le fichier de base de données existe
    if not os.path.exists(db_path):
        log_error(f"Le fichier de base de données n'existe pas: {db_path}")
        return False
    
    # Connexion à la base de données
    try:
        conn = sqlite3.connect(db_path)
        log_info("Connexion à la base de données établie avec succès")
        
        # Réinitialiser les mots de passe des administrateurs
        success_admin = reset_admin_passwords(conn)
        
        # Si demandé, réinitialiser les mots de passe de tous les utilisateurs
        reset_all = os.environ.get('RESET_ALL_PASSWORDS', 'false').lower() == 'true'
        success_all = True
        if reset_all:
            success_all = reset_all_passwords(conn)
        
        # Fermer la connexion
        conn.close()
        
        if success_admin and success_all:
            log_info("Correction des algorithmes de mot de passe terminée avec succès")
            return True
        else:
            log_error("Des erreurs sont survenues lors de la correction des algorithmes de mot de passe")
            return False
    except Exception as e:
        log_error(f"Erreur lors de la correction des algorithmes de mot de passe: {e}")
        return False

if __name__ == "__main__":
    success = fix_password_algorithm()
    sys.exit(0 if success else 1)
