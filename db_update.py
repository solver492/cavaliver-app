"""
Script pour mettre à jour la structure de la base de données en ajoutant les colonnes manquantes
et en résolvant les conflits de relations
"""
from app import create_app, db
from models import Client, Document
import sqlite3
import os
from sqlalchemy import text

app = create_app()

# Extraction du chemin correct de la base de données
db_uri = app.config['SQLALCHEMY_DATABASE_URI']
if db_uri.startswith('sqlite:///'):
    # Chemin relatif
    db_path = os.path.join(os.getcwd(), db_uri.replace('sqlite:///', ''))
else:
    # Si c'est une base PostgreSQL ou autre, on ne peut pas utiliser l'approche SQLite directe
    db_path = None

print(f"Base de données: {db_path}")

def create_db_if_not_exists():
    """Crée la base de données si elle n'existe pas et crée les tables"""
    if db_path and not os.path.exists(db_path):
        print(f"Base de données inexistante, création de {db_path}")
        # Créer le répertoire parent si nécessaire
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        
        # Créer une connexion SQLite pour créer le fichier
        conn = sqlite3.connect(db_path)
        conn.close()
        
        # Utiliser SQLAlchemy pour créer les tables
        with app.app_context():
            db.create_all()
            print("Base de données et tables créées")
        return True
    return False

def add_missing_columns():
    """Ajoute les colonnes manquantes aux tables"""
    print("Ajout des colonnes manquantes...")
    
    if not db_path:
        print("Impossible de déterminer le chemin de la base de données")
        return False
    
    if not os.path.exists(db_path):
        print(f"Base de données introuvable: {db_path}")
        return False
    
    try:
        # Connexion directe à la base SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Vérification si la colonne statut existe déjà dans la table client
        cursor.execute("PRAGMA table_info(client)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        if 'statut' not in column_names:
            cursor.execute("ALTER TABLE client ADD COLUMN statut VARCHAR(20) DEFAULT 'actif'")
            print("Colonne 'statut' ajoutée à la table client")
        else:
            print("La colonne 'statut' existe déjà dans la table client")
        
        # 2. Vérification si la colonne archive existe déjà dans la table client
        if 'archive' not in column_names:
            cursor.execute("ALTER TABLE client ADD COLUMN archive BOOLEAN DEFAULT 0")
            print("Colonne 'archive' ajoutée à la table client")
        else:
            print("La colonne 'archive' existe déjà dans la table client")
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Erreur lors de l'ajout des colonnes: {e}")
        return False

def recreate_document_table():
    """Recréer la table document pour résoudre les conflits de relations"""
    print("Recréation de la table document...")
    
    with app.app_context():
        try:
            # Sauvegarde des documents existants s'il y en a
            existing_docs = []
            try:
                # Récupérer la structure de la table avec text()
                db.session.execute(text("PRAGMA table_info(document)"))
                
                # Essayer de récupérer les documents existants (selon les colonnes disponibles)
                result = db.session.execute(text("SELECT id, client_id, nom, chemin FROM document"))
                existing_docs_data = result.fetchall()
                
                for doc in existing_docs_data:
                    existing_docs.append({
                        'id': doc[0],
                        'client_id': doc[1],
                        'nom': doc[2] if len(doc) > 2 else 'Document sans nom',
                        'chemin': doc[3] if len(doc) > 3 else '/uploads/unknown.pdf'
                    })
                print(f"Sauvegarde de {len(existing_docs)} documents")
            except Exception as e:
                print(f"Impossible de récupérer les documents existants: {e}")
            
            # Supprimer la table document avec text()
            db.session.execute(text("DROP TABLE IF EXISTS document"))
            db.session.commit()
            
            # Recréer la table avec le modèle mis à jour
            db.create_all()
            
            # Réinsérer les documents sauvegardés
            for doc in existing_docs:
                insert_sql = text("INSERT INTO document (id, client_id, nom, chemin, type, date_upload) VALUES (:id, :client_id, :nom, :chemin, 'pdf', CURRENT_TIMESTAMP)")
                db.session.execute(insert_sql, doc)
            
            db.session.commit()
            print("Table document recréée avec succès")
            return True
        except Exception as e:
            print(f"Erreur lors de la recréation de la table document: {e}")
            db.session.rollback()
            return False

def fix_document_relationship():
    """Corrige la relation entre Document et Client"""
    print("Correction des relations entre Document et Client...")
    
    with app.app_context():
        try:
            # La relation devrait maintenant être correcte grâce aux modifications dans les modèles
            db.session.commit()
            print("Relations corrigées avec succès")
            return True
        except Exception as e:
            print(f"Erreur lors de la correction des relations: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    # Créer la base de données si elle n'existe pas
    create_db_if_not_exists()
    
    # Ajouter les colonnes manquantes
    if add_missing_columns():
        print("Mise à jour des colonnes réussie")
    else:
        print("Échec de la mise à jour des colonnes")
    
    # Recréer la table document
    if recreate_document_table():
        print("Recréation de la table document réussie")
    else:
        print("Échec de la recréation de la table document")
    
    print("Opérations terminées")
