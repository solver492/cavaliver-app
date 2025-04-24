"""
Script pour ajouter manuellement les colonnes transporteur_id et vehicule_id à la table prestation
"""
import os
import sys
from sqlalchemy import create_engine, text

# Chemin de la base de données
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.db')
print(f"Connexion à la base de données: {db_path}")

# Créer la connexion
engine = create_engine(f"sqlite:///{db_path}")

# Vérifier si les colonnes existent déjà
with engine.connect() as conn:
    # PRAGMA table_info renvoie les informations sur les colonnes d'une table
    result = conn.execute(text("PRAGMA table_info(prestation)"))
    columns = [row[1] for row in result.fetchall()]  # Le nom de la colonne est à l'index 1
    
    needs_transporteur = "transporteur_id" not in columns
    needs_vehicule = "vehicule_id" not in columns

    if needs_transporteur or needs_vehicule:
        print("Ajout des colonnes manquantes à la table prestation...")
        
        # Ajout des colonnes manquantes
        if needs_transporteur:
            conn.execute(text("ALTER TABLE prestation ADD COLUMN transporteur_id INTEGER"))
            print("Colonne transporteur_id ajoutée")
            
        if needs_vehicule:
            conn.execute(text("ALTER TABLE prestation ADD COLUMN vehicule_id INTEGER"))
            print("Colonne vehicule_id ajoutée")
        
        print("Modification de la base de données terminée avec succès")
    else:
        print("Les colonnes existent déjà dans la table prestation")
