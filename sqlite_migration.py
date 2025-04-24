import sqlite3
import os
from app import create_app

def fix_database():
    """
    Corriger directement la base de données SQLite
    """
    app = create_app()
    db_uri = app.config['SQLALCHEMY_DATABASE_URI']
    
    # Si c'est un chemin SQLite relatif (sqlite:///cavalier.db)
    if db_uri.startswith('sqlite:///'):  
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), db_uri.replace('sqlite:///', ''))
    # Si c'est un chemin SQLite absolu (sqlite:////chemin/absolu/cavalier.db)  
    elif db_uri.startswith('sqlite:////'):  
        db_path = db_uri.replace('sqlite:////', '')
    else:
        print(f"Base de données non SQLite: {db_uri}")
        return
    
    print(f"Base de données: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"Erreur: La base de données n'existe pas à {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Vérifier la structure actuelle de la table
    print("Structure actuelle de la table prestation:")
    cursor.execute("PRAGMA table_info(prestation)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
    
    # Vérifier si les colonnes existent déjà
    column_names = [col[1] for col in columns]
    
    # Ajouter les colonnes manquantes
    try:
        if "derniere_modification_par" not in column_names:
            print("Ajout de la colonne derniere_modification_par...")
            cursor.execute("ALTER TABLE prestation ADD COLUMN derniere_modification_par INTEGER")
        else:
            print("La colonne derniere_modification_par existe déjà")
        
        if "date_derniere_modification" not in column_names:
            print("Ajout de la colonne date_derniere_modification...")
            cursor.execute("ALTER TABLE prestation ADD COLUMN date_derniere_modification TIMESTAMP")
        else:
            print("La colonne date_derniere_modification existe déjà")
        
        conn.commit()
        print("Modifications terminées avec succès")
    except Exception as e:
        print(f"Erreur lors de la modification: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database()
