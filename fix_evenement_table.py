import os
import sys
import sqlite3
from flask import Flask
from extensions import db
from sqlalchemy import text, inspect

app = Flask(__name__)
app.config.from_object('config.Config')
db.init_app(app)

def get_db_path():
    """Récupère le chemin de la base de données depuis la configuration."""
    with app.app_context():
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        if db_uri.startswith('sqlite:///'):
            # Chemin relatif
            return db_uri[10:]
        elif db_uri.startswith('sqlite:////'):
            # Chemin absolu
            return db_uri[11:]
        else:
            raise ValueError(f"Base de données non supportée: {db_uri}")

def check_table_exists(conn, table_name):
    """Vérifie si une table existe dans la base de données."""
    cursor = conn.cursor()
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    return cursor.fetchone() is not None

def check_column_exists(conn, table_name, column_name):
    """Vérifie si une colonne existe dans une table."""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    return any(column[1] == column_name for column in columns)

def add_column_if_not_exists(conn, table_name, column_name, column_type):
    """Ajoute une colonne à une table si elle n'existe pas déjà."""
    if not check_column_exists(conn, table_name, column_name):
        print(f"Ajout de la colonne '{column_name}' à la table '{table_name}'...")
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
        print(f"Colonne '{column_name}' ajoutée avec succès!")
        return True
    else:
        print(f"La colonne '{column_name}' existe déjà dans la table '{table_name}'.")
        return False

def update_null_values(conn, table_name, column_name, default_value):
    """Met à jour les valeurs NULL d'une colonne avec une valeur par défaut."""
    print(f"Mise à jour des valeurs NULL dans la colonne '{column_name}' de la table '{table_name}'...")
    conn.execute(f"UPDATE {table_name} SET {column_name} = ? WHERE {column_name} IS NULL", (default_value,))
    print(f"Valeurs NULL mises à jour avec succès!")

def fix_evenement_table():
    """Corrige la table Evenement en ajoutant les colonnes manquantes."""
    try:
        db_path = get_db_path()
        print(f"Connexion à la base de données: {db_path}")
        
        # Connexion directe à la base de données SQLite
        conn = sqlite3.connect(db_path)
        
        # Vérifier si la table evenement existe
        if not check_table_exists(conn, 'evenement'):
            print("ERREUR: La table 'evenement' n'existe pas dans la base de données!")
            return False
        
        # Ajouter la colonne version si elle n'existe pas
        version_added = add_column_if_not_exists(conn, 'evenement', 'version', 'INTEGER DEFAULT 1')
        
        # Ajouter la colonne archive si elle n'existe pas
        archive_added = add_column_if_not_exists(conn, 'evenement', 'archive', 'BOOLEAN DEFAULT 0')
        
        # Mettre à jour les valeurs NULL
        if version_added:
            update_null_values(conn, 'evenement', 'version', 1)
        
        if archive_added:
            update_null_values(conn, 'evenement', 'archive', 0)
        
        # Valider les modifications
        conn.commit()
        conn.close()
        
        print("Correction de la table 'evenement' terminée avec succès!")
        return True
    
    except Exception as e:
        print(f"ERREUR lors de la correction de la table 'evenement': {str(e)}")
        return False

def verify_model_columns():
    """Vérifie les colonnes du modèle Evenement dans la base de données."""
    with app.app_context():
        try:
            inspector = inspect(db.engine)
            columns = inspector.get_columns('evenement')
            
            print("\nColonnes de la table 'evenement':")
            for column in columns:
                print(f"- {column['name']} ({column['type']})")
            
            # Vérifier si les colonnes nécessaires existent
            column_names = [column['name'] for column in columns]
            if 'version' in column_names and 'archive' in column_names:
                print("\nLa table 'evenement' contient maintenant toutes les colonnes nécessaires!")
            else:
                print("\nATTENTION: Certaines colonnes nécessaires sont toujours manquantes!")
                if 'version' not in column_names:
                    print("- La colonne 'version' est manquante!")
                if 'archive' not in column_names:
                    print("- La colonne 'archive' est manquante!")
        
        except Exception as e:
            print(f"ERREUR lors de la vérification des colonnes: {str(e)}")

if __name__ == '__main__':
    print("=== Script de correction de la table Evenement ===")
    
    # Corriger la table Evenement
    success = fix_evenement_table()
    
    if success:
        # Vérifier les colonnes du modèle
        verify_model_columns()
        
        print("\nScript terminé avec succès! Redémarrez l'application pour que les modifications prennent effet.")
    else:
        print("\nLe script a rencontré des erreurs. Veuillez vérifier les messages ci-dessus.")
