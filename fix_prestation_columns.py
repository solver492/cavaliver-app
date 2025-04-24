"""
Script pour ajouter directement les colonnes manquantes à la table prestation
en utilisant SQLAlchemy
"""
from app import app
from extensions import db
import sqlalchemy as sa
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, ForeignKey

print("Ajout des colonnes manquantes à la table prestation...")

# Connexion à la base de données avec SQLAlchemy
with app.app_context():
    # Utiliser l'engine de l'application
    engine = db.engine
    
    try:
        # Vérifier si les colonnes existent déjà
        insp = sa.inspect(engine)
        prestation_columns = [c['name'] for c in insp.get_columns('prestation')]
        
        print(f"Colonnes existantes: {', '.join(prestation_columns)}")
        
        # Liste des colonnes à ajouter
        columns_to_add = []
        
        if 'transporteur_id' not in prestation_columns:
            columns_to_add.append(Column('transporteur_id', Integer, ForeignKey('transporteurs.id')))
            print("La colonne transporteur_id sera ajoutée")
        
        if 'vehicule_id' not in prestation_columns:
            columns_to_add.append(Column('vehicule_id', Integer, ForeignKey('vehicules.id')))
            print("La colonne vehicule_id sera ajoutée")
        
        # Ajouter les colonnes manquantes
        if columns_to_add:
            # Utiliser SQL brut car l'API SQLAlchemy ne supporte pas bien ALTER TABLE
            with engine.begin() as conn:
                for col in columns_to_add:
                    try:
                        conn.execute(sa.text(f"ALTER TABLE prestation ADD COLUMN {col.name} {col.type}"))
                        print(f"Colonne {col.name} ajoutée avec succès")
                    except Exception as e:
                        print(f"Erreur lors de l'ajout de la colonne {col.name}: {e}")
                        raise
        else:
            print("Aucune colonne à ajouter")
        
        # Vérifier les colonnes après modification
        insp = sa.inspect(engine)
        updated_columns = [c['name'] for c in insp.get_columns('prestation')]
        print(f"Colonnes après modification: {', '.join(updated_columns)}")
        
        print("Mise à jour terminée avec succès")
    
    except Exception as e:
        print(f"Erreur lors de la mise à jour de la base de données: {e}")
        raise
