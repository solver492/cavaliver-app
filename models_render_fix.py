#!/usr/bin/env python
import os
import sys
import re
import logging
from datetime import datetime

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("models_fix.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MODELS_FIX")

def log_info(message):
    """Log un message d'information"""
    logger.info(message)
    print(f"[INFO] {message}")

def log_error(message):
    """Log un message d'erreur"""
    logger.error(message)
    print(f"[ERROR] {message}")

def backup_file(file_path):
    """Crée une sauvegarde du fichier"""
    backup_path = f"{file_path}.bak.{datetime.now().strftime('%Y%m%d%H%M%S')}"
    try:
        with open(file_path, 'r', encoding='utf-8') as src:
            with open(backup_path, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
        log_info(f"Sauvegarde créée: {backup_path}")
        return True
    except Exception as e:
        log_error(f"Erreur lors de la création de la sauvegarde: {e}")
        return False

def patch_check_password_method(file_path):
    """Modifie la méthode check_password pour gérer l'algorithme scrypt non supporté sur Render"""
    if not os.path.exists(file_path):
        log_error(f"Le fichier {file_path} n'existe pas")
        return False
    
    # Créer une sauvegarde
    if not backup_file(file_path):
        return False
    
    try:
        # Lire le contenu du fichier
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Trouver la méthode check_password
        pattern = r'def check_password\(self, password\):\s+return check_password_hash\(self\.password_hash, password\)'
        if not re.search(pattern, content):
            log_error("Méthode check_password non trouvée dans le format attendu")
            return False
        
        # Nouvelle méthode check_password avec gestion des erreurs pour scrypt
        new_method = '''def check_password(self, password):
        try:
            return check_password_hash(self.password_hash, password)
        except ValueError as e:
            # Si l'erreur concerne l'algorithme scrypt non supporté
            if "unsupported hash type scrypt" in str(e):
                # Réinitialiser le mot de passe avec un algorithme supporté (pbkdf2)
                print(f"[WARNING] Algorithme non supporté pour l'utilisateur {self.username}, réinitialisation...")
                if self.username == 'admin':
                    # Pour l'admin, on sait que le mot de passe est 'admin123' (mot de passe par défaut)
                    if password == 'admin123':
                        # Mettre à jour le hash avec pbkdf2
                        from werkzeug.security import generate_password_hash
                        self.password_hash = generate_password_hash('admin123', method='pbkdf2:sha256')
                        db.session.commit()
                        return True
                # Pour les autres utilisateurs, on ne peut pas vérifier sans connaître leur mot de passe
                return False
            # Pour tout autre type d'erreur, propager l'exception
            raise'''
        
        # Remplacer l'ancienne méthode par la nouvelle
        new_content = re.sub(pattern, new_method, content)
        
        # Écrire le contenu modifié dans le fichier
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        log_info(f"Patch appliqué avec succès à {file_path}")
        return True
    
    except Exception as e:
        log_error(f"Erreur lors de l'application du patch: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <chemin_vers_models.py>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    success = patch_check_password_method(file_path)
    sys.exit(0 if success else 1)
