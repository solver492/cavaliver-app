"""
Script pour corriger la base de données en ajoutant les colonnes manquantes à la table prestation
"""
import sqlite3
import os
import sys

# Chemin vers la base de données SQLite
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.db')
print(f"Connexion à la base de données: {db_path}")

try:
    # Établir une connexion à la base de données
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Vérifier si les colonnes existent déjà
    cursor.execute("PRAGMA table_info(prestation)")
    columns = [row[1] for row in cursor.fetchall()]
    
    # Ajouter les colonnes manquantes si elles n'existent pas
    columns_to_add = []
    
    if 'transporteur_id' not in columns:
        columns_to_add.append(('transporteur_id', 'INTEGER'))
        print("La colonne transporteur_id n'existe pas et sera ajoutée")
    
    if 'vehicule_id' not in columns:
        columns_to_add.append(('vehicule_id', 'INTEGER'))
        print("La colonne vehicule_id n'existe pas et sera ajoutée")
    
    if 'modifie_par' not in columns:
        columns_to_add.append(('modifie_par', 'INTEGER'))
        print("La colonne modifie_par n'existe pas et sera ajoutée")
    
    if 'date_modification' not in columns:
        columns_to_add.append(('date_modification', 'DATETIME'))
        print("La colonne date_modification n'existe pas et sera ajoutée")
    
    # Exécuter les commandes ALTER TABLE pour chaque colonne manquante
    for column_name, column_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE prestation ADD COLUMN {column_name} {column_type}")
            print(f"Colonne {column_name} ajoutée avec succès")
        except Exception as e:
            print(f"Erreur lors de l'ajout de la colonne {column_name}: {e}")
    
    # Valider les modifications
    conn.commit()
    print("Modifications enregistrées dans la base de données")
    
    # Afficher les colonnes actuelles pour vérification
    cursor.execute("PRAGMA table_info(prestation)")
    current_columns = [row[1] for row in cursor.fetchall()]
    print(f"Colonnes actuelles de la table prestation: {', '.join(current_columns)}")
    
except Exception as e:
    print(f"Erreur lors de la modification de la base de données: {e}")
    sys.exit(1)
finally:
    if 'conn' in locals():
        conn.close()
        print("Connexion à la base de données fermée")

print("Opération terminée avec succès")
