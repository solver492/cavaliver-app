#!/usr/bin/env python
import os
import sys
import sqlite3
import logging
import shutil
from datetime import datetime
from werkzeug.security import generate_password_hash

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("reset_superadmin.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("RESET_SUPERADMIN")

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

def create_backup():
    """Crée une sauvegarde de la base de données"""
    if not os.path.exists(db_path):
        log_error(f"La base de données {db_path} n'existe pas")
        return False
    
    backup_dir = "backups"
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    backup_path = os.path.join(backup_dir, f"demenage_backup_{timestamp}.db")
    
    try:
        shutil.copy2(db_path, backup_path)
        log_info(f"Sauvegarde créée: {backup_path}")
        return True
    except Exception as e:
        log_error(f"Erreur lors de la création de la sauvegarde: {e}")
        return False

def reset_superadmin_password(new_password="superuser123"):
    """Réinitialise le mot de passe du superadmin"""
    log_info("Démarrage de la réinitialisation du mot de passe superadmin...")
    
    # Créer une sauvegarde avant tout
    if not create_backup():
        log_error("Impossible de continuer sans sauvegarde")
        return False
    
    # Vérifier que le fichier de base de données existe
    if not os.path.exists(db_path):
        log_error(f"Le fichier de base de données n'existe pas: {db_path}")
        return False
    
    # Connexion à la base de données
    try:
        conn = sqlite3.connect(db_path)
        log_info("Connexion à la base de données établie avec succès")
        
        # Vérifier si le superadmin existe
        cursor = conn.cursor()
        cursor.execute("SELECT id, username FROM user WHERE username = 'superadmin' OR role = 'super_admin'")
        super_admin = cursor.fetchone()
        
        if not super_admin:
            cursor.execute("SELECT id, username FROM user WHERE username LIKE '%super%' OR role LIKE '%super%'")
            possible_matches = cursor.fetchall()
            
            if possible_matches:
                log_info(f"Superadmin non trouvé, mais correspondances possibles: {possible_matches}")
                # Utilisons la première correspondance trouvée
                super_admin_id = possible_matches[0][0]
                super_admin_username = possible_matches[0][1]
                log_info(f"Utilisation de l'utilisateur: {super_admin_username} (ID: {super_admin_id})")
            else:
                log_error("Impossible de trouver un compte superadmin")
                return False
        else:
            super_admin_id = super_admin[0]
            super_admin_username = super_admin[1]
            log_info(f"Superadmin trouvé: {super_admin_username} (ID: {super_admin_id})")
        
        # Générer un nouveau hash avec pbkdf2:sha256
        new_password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
        
        # Mettre à jour le mot de passe
        cursor.execute("UPDATE user SET password_hash = ? WHERE id = ?", (new_password_hash, super_admin_id))
        conn.commit()
        
        log_info(f"Mot de passe de {super_admin_username} réinitialisé avec succès à '{new_password}'")
        
        # Fermer la connexion
        conn.close()
        return True
    except Exception as e:
        log_error(f"Erreur lors de la réinitialisation du mot de passe: {e}")
        return False

if __name__ == "__main__":
    # Si un mot de passe est spécifié en argument, l'utiliser
    if len(sys.argv) > 1:
        password = sys.argv[1]
        success = reset_superadmin_password(password)
    else:
        # Sinon, utiliser le mot de passe par défaut
        success = reset_superadmin_password()
    
    if success:
        log_info("Réinitialisation du mot de passe superadmin terminée avec succès")
    else:
        log_error("Échec de la réinitialisation du mot de passe superadmin")
    
    sys.exit(0 if success else 1)
