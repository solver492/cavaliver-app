#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour migrer la table client en ajoutant les nouvelles colonnes.
"""

from app import create_app, db
import sqlite3
import os

app = create_app()

def migrate_client_table():
    """Ajoute les nouvelles colonnes à la table client"""
    try:
        # Chemin de la base de données SQLite
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'cavalier.db')
        
        # Connexion directe à SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Vérifier si les colonnes existent déjà
        cursor.execute("PRAGMA table_info(client)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Ajouter les colonnes manquantes
        if 'code_postal' not in columns:
            cursor.execute("ALTER TABLE client ADD COLUMN code_postal TEXT")
            print("Colonne 'code_postal' ajoutée à la table client")
            
        if 'ville' not in columns:
            cursor.execute("ALTER TABLE client ADD COLUMN ville TEXT")
            print("Colonne 'ville' ajoutée à la table client")
            
        if 'pays' not in columns:
            cursor.execute("ALTER TABLE client ADD COLUMN pays TEXT DEFAULT 'France'")
            print("Colonne 'pays' ajoutée à la table client")
        
        # Sauvegarder les modifications
        conn.commit()
        print("Migration de la table client terminée avec succès!")
        
    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
    finally:
        # Fermer la connexion
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate_client_table()
