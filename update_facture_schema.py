import sqlite3
import os

# Chemin de la base de données
db_path = 'instance/cavalier.db'

# Vérifier si la base de données existe
if not os.path.exists(db_path):
    print(f"Erreur: La base de données {db_path} n'existe pas.")
    exit(1)

# Se connecter à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Vérifier si les colonnes existent déjà
cursor.execute("PRAGMA table_info(facture)")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]

# Ajouter les nouvelles colonnes à la table facture
new_columns = [
    ("montant_acompte", "FLOAT"),
    ("commission_montant", "FLOAT"),
    ("commission_pourcentage", "FLOAT")
]

for col_name, col_type in new_columns:
    if col_name not in column_names:
        print(f"Ajout de la colonne {col_name} à la table facture...")
        cursor.execute(f"ALTER TABLE facture ADD COLUMN {col_name} {col_type}")
        print(f"La colonne {col_name} a été ajoutée avec succès!")
    else:
        print(f"La colonne {col_name} existe déjà dans la table facture.")

# Vérifier si la table fichier_facture existe déjà
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='fichier_facture'")
if not cursor.fetchone():
    print("Création de la table fichier_facture...")
    cursor.execute("""
    CREATE TABLE fichier_facture (
        id INTEGER PRIMARY KEY,
        facture_id INTEGER NOT NULL,
        nom_fichier VARCHAR(255) NOT NULL,
        chemin_fichier VARCHAR(255) NOT NULL,
        type_fichier VARCHAR(50) NOT NULL,
        date_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facture_id) REFERENCES facture (id)
    )
    """)
    print("La table fichier_facture a été créée avec succès!")
else:
    print("La table fichier_facture existe déjà.")

# Valider les modifications
conn.commit()
print("Toutes les modifications ont été appliquées avec succès!")

# Fermer la connexion
conn.close()
