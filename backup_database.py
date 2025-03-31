import os
import shutil
import datetime
import sqlite3
import zipfile

def create_backup():
    """Crée une sauvegarde de la base de données et des fichiers importants"""
    # Créer le dossier de sauvegarde s'il n'existe pas
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backups')
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    # Générer un nom de fichier avec la date et l'heure
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f'backup_{timestamp}'
    backup_path = os.path.join(backup_dir, backup_filename)
    
    # Créer un dossier pour cette sauvegarde spécifique
    os.makedirs(backup_path)
    
    # Sauvegarder la base de données
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'demenage.db')
    
    if os.path.exists(db_path):
        # Créer une copie de la base de données
        db_backup_path = os.path.join(backup_path, 'demenage.db')
        
        # Connexion à la base de données source
        conn = sqlite3.connect(db_path)
        # Sauvegarde de la base de données
        backup = sqlite3.connect(db_backup_path)
        conn.backup(backup)
        backup.close()
        conn.close()
        
        print(f"Base de données sauvegardée: {db_backup_path}")
    else:
        print(f"Base de données non trouvée à: {db_path}")
    
    # Créer une archive ZIP
    zip_path = f"{backup_path}.zip"
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Ajouter la base de données
        db_backup_path = os.path.join(backup_path, 'demenage.db')
        if os.path.exists(db_backup_path):
            zipf.write(db_backup_path, os.path.basename(db_backup_path))
    
    # Supprimer le dossier temporaire
    shutil.rmtree(backup_path)
    
    print(f"Sauvegarde terminée: {zip_path}")
    return zip_path

if __name__ == "__main__":
    backup_path = create_backup()
    print(f"Sauvegarde créée à: {backup_path}")
