#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour corriger la table type_vehicule en ajoutant la colonne image
"""

from app import create_app
import sqlite3
import os

app = create_app()

def fix_type_vehicule_table():
    """
    Ajoute la colonne 'image' à la table type_vehicule si elle n'existe pas
    """
    with app.app_context():
        print("=== CORRECTION DE LA TABLE TYPE_VEHICULE ===\n")
        
        # Chemin vers la base de données
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'cavalier.db')
        
        try:
            # Connexion à la base de données
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Vérifier si la colonne 'image' existe déjà
            cursor.execute("PRAGMA table_info(type_vehicule)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            if 'image' not in column_names:
                print("La colonne 'image' n'existe pas dans la table type_vehicule. Ajout en cours...")
                
                # Ajouter la colonne 'image'
                cursor.execute("ALTER TABLE type_vehicule ADD COLUMN image VARCHAR(255)")
                conn.commit()
                
                print("Colonne 'image' ajoutée avec succès à la table type_vehicule.")
            else:
                print("La colonne 'image' existe déjà dans la table type_vehicule.")
            
            # Vérifier la structure de la table après modification
            cursor.execute("PRAGMA table_info(type_vehicule)")
            columns = cursor.fetchall()
            print("\nStructure actuelle de la table type_vehicule:")
            for col in columns:
                print(f"   {col[1]} ({col[2]})")
            
            # Fermer la connexion
            conn.close()
            
            print("\nCorrection de la table type_vehicule terminée.")
            
        except Exception as e:
            print(f"Erreur lors de la correction de la table type_vehicule: {e}")
            if 'conn' in locals():
                conn.close()

if __name__ == "__main__":
    fix_type_vehicule_table()
