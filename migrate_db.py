import sqlite3
import os

def migrate_database():
    """
    Script pour migrer la base de données et ajouter les colonnes manquantes à la table prestation
    """
    print("Début de la migration de la base de données...")
    
    # Connexion à la base de données
    conn = sqlite3.connect('demenage.db')
    cursor = conn.cursor()
    
    # Vérifier la structure de la table prestation
    cursor.execute("PRAGMA table_info(prestation)")
    columns = cursor.fetchall()
    column_names = [column[1] for column in columns]
    
    print("Structure actuelle de la table prestation:")
    for column in columns:
        print(f"- {column[1]} ({column[2]})")
    
    # Ajouter la colonne camion_type si elle n'existe pas
    if 'camion_type' not in column_names:
        print("Ajout de la colonne 'camion_type' à la table 'prestation'...")
        cursor.execute("ALTER TABLE prestation ADD COLUMN camion_type TEXT")
        conn.commit()
        print("Colonne 'camion_type' ajoutée avec succès.")
    else:
        print("La colonne 'camion_type' existe déjà dans la table 'prestation'.")
    
    # Ajouter la colonne priorite si elle n'existe pas
    if 'priorite' not in column_names:
        print("Ajout de la colonne 'priorite' à la table 'prestation'...")
        cursor.execute("ALTER TABLE prestation ADD COLUMN priorite INTEGER DEFAULT 0")
        conn.commit()
        print("Colonne 'priorite' ajoutée avec succès.")
    else:
        print("La colonne 'priorite' existe déjà dans la table 'prestation'.")
    
    # Fermer la connexion
    conn.close()
    print("Migration terminée avec succès.")

if __name__ == "__main__":
    migrate_database()
