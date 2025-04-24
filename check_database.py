#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour vérifier le contenu des tables dans la base de données
"""

from app import create_app
from models import TypeDemenagement, TypeVehicule, type_demenagement_vehicule
import sqlite3
import os

app = create_app()

def check_database():
    """
    Vérifie le contenu des tables importantes et leurs relations
    """
    with app.app_context():
        print("=== VÉRIFICATION DE LA BASE DE DONNÉES ===\n")
        
        # 1. Vérifier la table type_demenagement
        print("1. Types de déménagement disponibles:")
        types = TypeDemenagement.query.all()
        if not types:
            print("   AUCUN TYPE DE DÉMÉNAGEMENT TROUVÉ!")
        else:
            for t in types:
                print(f"   ID: {t.id}, Nom: {t.nom}")
        print()
        
        # 2. Vérifier la table type_vehicule
        print("2. Types de véhicules disponibles:")
        vehicules = TypeVehicule.query.all()
        if not vehicules:
            print("   AUCUN TYPE DE VÉHICULE TROUVÉ!")
        else:
            for v in vehicules:
                print(f"   ID: {v.id}, Nom: {v.nom}")
        print()
        
        # 3. Vérifier les relations entre types de déménagement et types de véhicules
        print("3. Relations entre types de déménagement et types de véhicules:")
        
        # Connexion directe à SQLite pour vérifier la table d'association
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'cavalier.db')
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT type_demenagement_id, type_vehicule_id FROM type_demenagement_vehicule")
            relations = cursor.fetchall()
            
            if not relations:
                print("   AUCUNE RELATION TROUVÉE!")
            else:
                for r in relations:
                    type_dem_id, type_veh_id = r
                    type_dem = TypeDemenagement.query.get(type_dem_id)
                    type_veh = TypeVehicule.query.get(type_veh_id)
                    if type_dem and type_veh:
                        print(f"   Type de déménagement '{type_dem.nom}' est associé au véhicule '{type_veh.nom}'")
                    else:
                        print(f"   RELATION INVALIDE: type_dem_id={type_dem_id}, type_veh_id={type_veh_id}")
            
            print("\n4. Structure de la table type_demenagement:")
            cursor.execute("PRAGMA table_info(type_demenagement)")
            for col in cursor.fetchall():
                print(f"   {col}")
                
            print("\n5. Structure de la table type_demenagement_vehicule:")
            cursor.execute("PRAGMA table_info(type_demenagement_vehicule)")
            for col in cursor.fetchall():
                print(f"   {col}")
            
            conn.close()
        except Exception as e:
            print(f"Erreur lors de l'accès à la base de données: {e}")
        
        # Si aucun type de déménagement, proposer d'en créer
        if not types:
            print("\n=== RECOMMANDATION ===")
            print("La table des types de déménagement est vide. Vous devriez créer des types de déménagement.")
            print("Exemple: exécutez le script init_db.py pour initialiser les données de base.")

if __name__ == "__main__":
    check_database()
