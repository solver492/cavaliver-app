#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script d'initialisation pour les types de déménagement et les types de véhicules
"""

from app import create_app
from extensions import db
from models import TypeDemenagement, TypeVehicule
from datetime import datetime

app = create_app()

def initialize_types():
    """
    Ajoute des types de déménagement et de véhicules de base à la base de données
    et établit les relations entre eux
    """
    with app.app_context():
        print("Initialisation des types de déménagement et des types de véhicules...")
        
        # Vérifier si des données existent déjà
        existing_demenagements = TypeDemenagement.query.count()
        existing_vehicules = TypeVehicule.query.count()
        
        if existing_demenagements > 0 or existing_vehicules > 0:
            print(f"Des données existent déjà: {existing_demenagements} types de déménagement, {existing_vehicules} types de véhicules")
            confirm = input("Voulez-vous réinitialiser ces données? (o/n): ")
            if confirm.lower() != 'o':
                print("Initialisation annulée.")
                return
            
            # Supprimer les associations existantes
            db.session.execute(db.delete(db.Table('type_demenagement_vehicule')))
            
            # Supprimer les données existantes
            TypeDemenagement.query.delete()
            TypeVehicule.query.delete()
            db.session.commit()
            print("Données existantes supprimées.")
        
        # 1. Créer les types de déménagement
        types_demenagement = [
            {'nom': 'Déménagement local (< 50km)', 'description': 'Déménagement dans la même ville ou région proche'},
            {'nom': 'Déménagement régional (50-200km)', 'description': 'Déménagement à moyenne distance'},
            {'nom': 'Déménagement national (> 200km)', 'description': 'Déménagement longue distance au sein du pays'},
            {'nom': 'Déménagement international', 'description': 'Déménagement vers un autre pays'},
            {'nom': 'Déménagement d\'entreprise', 'description': 'Déménagement de bureaux ou locaux professionnels'},
            {'nom': 'Déménagement d\'appartement', 'description': 'Spécifique aux appartements (escaliers, ascenseurs)'},
            {'nom': 'Déménagement de maison', 'description': 'Spécifique aux maisons individuelles'},
            {'nom': 'Déménagement de piano/objets lourds', 'description': 'Transport spécialisé pour objets volumineux ou lourds'},
            {'nom': 'Garde-meuble/Stockage', 'description': 'Transport vers un lieu de stockage temporaire ou permanent'}
        ]
        
        demenagement_objects = []
        for td in types_demenagement:
            type_d = TypeDemenagement(
                nom=td['nom'], 
                description=td['description'],
                date_creation=datetime.utcnow()
            )
            db.session.add(type_d)
            demenagement_objects.append(type_d)
        
        # 2. Créer les types de véhicules
        types_vehicule = [
            {'nom': 'Fourgonnette (3m³)', 'description': 'Petit véhicule pour petit volume', 'capacite': '3m³'},
            {'nom': 'Camionnette (8m³)', 'description': 'Véhicule moyen pour studio ou T1', 'capacite': '8m³'},
            {'nom': 'Camion 12m³', 'description': 'Pour appartement T2', 'capacite': '12m³'},
            {'nom': 'Camion 20m³', 'description': 'Pour appartement T3', 'capacite': '20m³'},
            {'nom': 'Camion 30m³', 'description': 'Pour appartement T4 ou petite maison', 'capacite': '30m³'},
            {'nom': 'Camion 40m³', 'description': 'Pour grande maison', 'capacite': '40m³'},
            {'nom': 'Camion avec hayon', 'description': 'Facilite le chargement d\'objets lourds', 'capacite': 'Variable'},
            {'nom': 'Semi-remorque', 'description': 'Très grande capacité pour déménagements importants', 'capacite': '60-90m³'},
            {'nom': 'Véhicule spécial piano', 'description': 'Équipé pour le transport de pianos', 'capacite': 'Spécifique'}
        ]
        
        vehicule_objects = []
        for tv in types_vehicule:
            type_v = TypeVehicule(
                nom=tv['nom'], 
                description=tv['description'],
                capacite=tv['capacite']
            )
            db.session.add(type_v)
            vehicule_objects.append(type_v)
        
        # Enregistrer pour obtenir les IDs
        db.session.flush()
        
        # 3. Établir les relations entre types de déménagement et types de véhicules
        relations = [
            # Déménagement local
            (0, [0, 1, 2, 3, 4]),  # Compatible avec fourgonnette jusqu'à camion 30m³
            
            # Déménagement régional
            (1, [1, 2, 3, 4, 5]),  # Compatible avec camionnette jusqu'à camion 40m³
            
            # Déménagement national
            (2, [3, 4, 5, 7]),  # Compatible avec grands camions et semi-remorque
            
            # Déménagement international
            (3, [4, 5, 7]),  # Compatible avec grands camions et semi-remorque
            
            # Déménagement d'entreprise
            (4, [3, 4, 5, 6, 7]),  # Compatible avec grands camions, hayon et semi-remorque
            
            # Déménagement d'appartement
            (5, [0, 1, 2, 3, 4]),  # Petits à moyens véhicules
            
            # Déménagement de maison
            (6, [3, 4, 5, 7]),  # Grands véhicules
            
            # Déménagement de piano/objets lourds
            (7, [6, 8]),  # Camion avec hayon et véhicule spécial piano
            
            # Garde-meuble/Stockage
            (8, [0, 1, 2, 3, 4, 5])  # Tous types de camions standards
        ]
        
        # Établir les relations
        for demenagement_idx, vehicule_indices in relations:
            if demenagement_idx < len(demenagement_objects):
                demenagement = demenagement_objects[demenagement_idx]
                for vehicule_idx in vehicule_indices:
                    if vehicule_idx < len(vehicule_objects):
                        vehicule = vehicule_objects[vehicule_idx]
                        demenagement.types_vehicule.append(vehicule)
                        print(f"Association: '{demenagement.nom}' avec '{vehicule.nom}'")
        
        # Sauvegarder toutes les modifications
        db.session.commit()
        print("Initialisation terminée avec succès!")
        
        # Afficher un résumé
        print(f"\nRésumé: {len(types_demenagement)} types de déménagement et {len(types_vehicule)} types de véhicules créés")
        print(f"Avec {sum(len(vehicule_indices) for _, vehicule_indices in relations)} associations entre eux")

if __name__ == "__main__":
    initialize_types()
