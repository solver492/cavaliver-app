#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import sqlite3

def migrate_prestation_groupage():
    """
    Ajoute les colonnes nécessaires pour le support de prestations de groupage:
    - clients_supplementaires
    - etapes_depart
    - etapes_arrivee
    """
    try:
        # Chemin de la base de données SQLite
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'cavalier.db')
        
        # Connexion directe à SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Vérifier les colonnes existantes dans la table prestation
        cursor.execute("PRAGMA table_info(prestation)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Définir les colonnes à ajouter si elles n'existent pas
        columns_to_add = [
            ('clients_supplementaires', 'TEXT'),
            ('etapes_depart', 'TEXT'),
            ('etapes_arrivee', 'TEXT'),
            ('est_groupage', 'BOOLEAN', 'DEFAULT 0')
        ]
        
        # Ajouter les colonnes manquantes
        for column_info in columns_to_add:
            column_name = column_info[0]
            column_type = column_info[1]
            default_clause = column_info[2] if len(column_info) > 2 else ''
            
            if column_name not in columns:
                print(f"Ajout de la colonne {column_name} à la table prestation...")
                cursor.execute(f"ALTER TABLE prestation ADD COLUMN {column_name} {column_type} {default_clause}")
                print(f"Colonne {column_name} ajoutée avec succès!")
            else:
                print(f"La colonne {column_name} existe déjà dans la table prestation.")
        
        # Sauvegarder les modifications
        conn.commit()
        print("Migration pour le support de prestations de groupage terminée avec succès!")
        
    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        # Fermer la connexion
        if conn:
            conn.close()

if __name__ == '__main__':
    print("Début de la migration pour le support de prestations de groupage...")
    migrate_prestation_groupage()
    print("Migration terminée.")
