#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour migrer les tables liées aux prestations et aux véhicules.
Ce script vérifie et corrige les problèmes de structure entre les modèles et la base de données.
"""

from app import create_app, db
import sqlite3
import os

app = create_app()

def migrate_tables():
    """
    Vérifie et met à jour la structure des tables liées aux prestations et aux véhicules
    """
    try:
        # Chemin de la base de données SQLite
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'cavalier.db')
        
        # Connexion directe à SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Migration de la table prestation
        print("Vérification de la table prestation...")
        cursor.execute("PRAGMA table_info(prestation)")
        prestation_columns = {column[1]: column for column in cursor.fetchall()}
        
        # Vérifier/ajouter les colonnes manquantes
        if 'vehicules_suggeres' not in prestation_columns:
            cursor.execute("ALTER TABLE prestation ADD COLUMN vehicules_suggeres TEXT")
            print("Colonne 'vehicules_suggeres' ajoutée à la table prestation")
        
        # 2. Vérification de la table type_demenagement_vehicule (association)
        print("Vérification de la table type_demenagement_vehicule...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='type_demenagement_vehicule'")
        if not cursor.fetchone():
            # Créer la table si elle n'existe pas
            cursor.execute("""
                CREATE TABLE type_demenagement_vehicule (
                    type_demenagement_id INTEGER NOT NULL,
                    type_vehicule_id INTEGER NOT NULL,
                    PRIMARY KEY (type_demenagement_id, type_vehicule_id),
                    FOREIGN KEY (type_demenagement_id) REFERENCES type_demenagement (id),
                    FOREIGN KEY (type_vehicule_id) REFERENCES type_vehicule (id)
                )
            """)
            print("Table 'type_demenagement_vehicule' créée")
        
        # 3. Vérification de la table prestation_transporteurs (association)
        print("Vérification de la table prestation_transporteurs...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='prestation_transporteurs'")
        if not cursor.fetchone():
            # Créer la table si elle n'existe pas
            cursor.execute("""
                CREATE TABLE prestation_transporteurs (
                    prestation_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    PRIMARY KEY (prestation_id, user_id),
                    FOREIGN KEY (prestation_id) REFERENCES prestation (id),
                    FOREIGN KEY (user_id) REFERENCES user (id)
                )
            """)
            print("Table 'prestation_transporteurs' créée")
        
        # 4. Mise à jour des transporteurs dans la table User
        print("Vérification des colonnes de la table user pour les transporteurs...")
        cursor.execute("PRAGMA table_info(user)")
        user_columns = {column[1]: column for column in cursor.fetchall()}
        
        if 'type_vehicule_id' not in user_columns:
            cursor.execute("ALTER TABLE user ADD COLUMN type_vehicule_id INTEGER REFERENCES type_vehicule(id)")
            print("Colonne 'type_vehicule_id' ajoutée à la table user")
        
        # 5. Optimisation des index pour améliorer les performances
        print("Optimisation des index pour améliorer les performances...")
        
        # Index pour la recherche rapide des véhicules par type
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_type_vehicule ON user(type_vehicule_id)")
        
        # Index pour la recherche rapide des prestations par type de déménagement
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_prestation_type_demenagement ON prestation(type_demenagement_id)")
        
        # Sauvegarder les modifications
        conn.commit()
        print("Migration des tables terminée avec succès!")
        
    except Exception as e:
        conn.rollback()
        print(f"Erreur lors de la migration: {e}")
    finally:
        # Fermer la connexion
        if conn:
            conn.close()

if __name__ == "__main__":
    with app.app_context():
        migrate_tables()
