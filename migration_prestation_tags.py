#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour migrer la table prestation en s'assurant que tous les champs
nécessaires sont correctement synchronisés avec le modèle Python.
Ce script suit la règle essentielle de développement pour l'application R-cavalier:
toujours synchroniser les modèles Python et la structure de la base de données.
"""

from app import create_app, db
import sqlite3
import os
import sys

app = create_app()

def migrate_prestation_table():
    """
    Ajoute ou met à jour les colonnes nécessaires dans la table prestation
    pour assurer la synchronisation avec le modèle Python.
    """
    try:
        # Chemin de la base de données SQLite
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'cavalier.db')
        
        # Connexion directe à SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Vérification de la table prestation...")
        cursor.execute("PRAGMA table_info(prestation)")
        columns = {column[1]: column for column in cursor.fetchall()}
        
        # Liste des colonnes à vérifier/ajouter avec leurs types et valeurs par défaut
        columns_to_check = [
            ('tags', 'TEXT', None),
            ('vehicules_suggeres', 'TEXT', None),
            ('priorite', 'TEXT', "'Normal'"),
            ('societe', 'TEXT', None),
            ('observations', 'TEXT', None),
            ('archive', 'BOOLEAN', '0')
        ]
        
        # Vérifier et ajouter les colonnes manquantes
        for column_name, column_type, default_value in columns_to_check:
            if column_name not in columns:
                default_clause = f"DEFAULT {default_value}" if default_value is not None else ""
                cursor.execute(f"ALTER TABLE prestation ADD COLUMN {column_name} {column_type} {default_clause}")
                print(f"Colonne '{column_name}' ajoutée à la table prestation avec le type {column_type}")
        
        # Création ou mise à jour d'index pour améliorer les performances
        print("Optimisation des index pour la table prestation...")
        
        # Index sur les champs fréquemment utilisés pour les recherches
        indexes_to_create = [
            ('idx_prestation_client', 'client_id'),
            ('idx_prestation_dates', 'date_debut, date_fin'),
            ('idx_prestation_statut', 'statut'),
            ('idx_prestation_archive', 'archive'),
            ('idx_prestation_tags', 'tags')
        ]
        
        for index_name, columns in indexes_to_create:
            # Vérifier si l'index existe déjà
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='index' AND name='{index_name}'")
            if not cursor.fetchone():
                cursor.execute(f"CREATE INDEX {index_name} ON prestation({columns})")
                print(f"Index '{index_name}' créé sur la colonne(s) {columns}")
        
        # Vérifier la cohérence des données
        print("Vérification de la cohérence des données...")
        
        # S'assurer que tous les enregistrements ont une valeur pour 'archive'
        cursor.execute("UPDATE prestation SET archive = 0 WHERE archive IS NULL")
        rows_updated = cursor.rowcount
        if rows_updated > 0:
            print(f"{rows_updated} prestation(s) mises à jour avec archive = 0")
        
        # S'assurer que tous les enregistrements ont une valeur pour 'priorite'
        cursor.execute("UPDATE prestation SET priorite = 'Normal' WHERE priorite IS NULL")
        rows_updated = cursor.rowcount
        if rows_updated > 0:
            print(f"{rows_updated} prestation(s) mises à jour avec priorite = 'Normal'")
        
        # Sauvegarder les modifications
        conn.commit()
        print("Migration de la table prestation terminée avec succès!")
        
    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        # Fermer la connexion
        if conn:
            conn.close()

if __name__ == "__main__":
    with app.app_context():
        migrate_prestation_table()
