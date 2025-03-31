import sqlite3
import os

def migrate_document_table():
    """
    Script pour migrer la table document et ajouter les colonnes document_type et description
    """
    print("Début de la migration de la table document...")
    
    # Connexion à la base de données
    conn = sqlite3.connect('demenage.db')
    cursor = conn.cursor()
    
    # Vérifier la structure de la table document
    cursor.execute("PRAGMA table_info(document)")
    columns = cursor.fetchall()
    column_names = [column[1] for column in columns]
    
    print("Structure actuelle de la table document:")
    for column in columns:
        print(f"- {column[1]} ({column[2]})")
    
    # Ajouter la colonne document_type si elle n'existe pas
    if 'document_type' not in column_names:
        print("Ajout de la colonne 'document_type' à la table 'document'...")
        cursor.execute("ALTER TABLE document ADD COLUMN document_type TEXT DEFAULT 'autre'")
        conn.commit()
        print("Colonne 'document_type' ajoutée avec succès.")
    else:
        print("La colonne 'document_type' existe déjà dans la table 'document'.")
    
    # Ajouter la colonne description si elle n'existe pas
    if 'description' not in column_names:
        print("Ajout de la colonne 'description' à la table 'document'...")
        cursor.execute("ALTER TABLE document ADD COLUMN description TEXT")
        conn.commit()
        print("Colonne 'description' ajoutée avec succès.")
    else:
        print("La colonne 'description' existe déjà dans la table 'document'.")
    
    # Fermer la connexion
    conn.close()
    print("Migration terminée avec succès.")

if __name__ == "__main__":
    migrate_document_table()
