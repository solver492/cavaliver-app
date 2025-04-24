import sqlite3
import os
from datetime import datetime

# Chemin de la base de données (mise à jour pour le dossier instance)
db_path = 'instance/cavalier.db'

# Vérifier si la base de données existe
if not os.path.exists(db_path):
    db_path = 'cavalier.db'  # Essayer l'ancien chemin
    if not os.path.exists(db_path):
        print(f"Erreur: La base de données n'existe pas.")
        exit(1)

print(f"Utilisation de la base de données : {db_path}")

# Se connecter à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Vérifier si la table facture_old existe (cela signifie que notre script précédent a échoué)
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='facture_old'")
if cursor.fetchone():
    print("La table facture_old existe. Vérification de la structure...")
    # Vérifier les colonnes de facture_old
    cursor.execute("PRAGMA table_info(facture_old)")
    old_columns = cursor.fetchall()
    old_column_names = [column[1] for column in old_columns]
    print(f"Colonnes dans facture_old: {old_column_names}")
    
    # Vérifier si la table facture existe aussi
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='facture'")
    if cursor.fetchone():
        print("La table facture existe aussi. Suppression...")
        cursor.execute("DROP TABLE facture")
else:
    # Vérifier si la table facture existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='facture'")
    if cursor.fetchone():
        print("La table facture existe. Renommage en facture_old...")
        cursor.execute("ALTER TABLE facture RENAME TO facture_old")
    else:
        print("Ni facture ni facture_old n'existent. Impossible de continuer.")
        conn.close()
        exit(1)

# Maintenant, vérifions les colonnes de facture_old
cursor.execute("PRAGMA table_info(facture_old)")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]
print(f"Colonnes disponibles dans la table facture_old: {column_names}")

# Créer la nouvelle table avec la structure correcte
print("Création de la nouvelle table facture...")
cursor.execute("""
CREATE TABLE facture (
    id INTEGER PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    client_id INTEGER NOT NULL,
    prestation_id INTEGER,
    stockage_id INTEGER,
    date_emission DATETIME NOT NULL,
    date_echeance DATETIME,
    montant_ht FLOAT NOT NULL,
    tva FLOAT NOT NULL DEFAULT 20.0,
    montant_ttc FLOAT NOT NULL,
    statut VARCHAR(50) DEFAULT 'Non payée',
    date_paiement DATETIME,
    mode_paiement VARCHAR(50),
    observations TEXT,
    commercial_id INTEGER,
    FOREIGN KEY (client_id) REFERENCES client (id),
    FOREIGN KEY (prestation_id) REFERENCES prestation (id),
    FOREIGN KEY (stockage_id) REFERENCES stockage (id),
    FOREIGN KEY (commercial_id) REFERENCES user (id)
)
""")

# Construire dynamiquement la requête SQL en fonction des colonnes disponibles
select_columns = []
for col in ['id', 'numero', 'client_id', 'prestation_id', 'stockage_id', 'date_emission', 'date_echeance', 'montant_ht', 'montant_ttc', 'statut', 'mode_paiement', 'commercial_id']:
    if col in column_names:
        select_columns.append(col)
    else:
        if col == 'date_emission':
            select_columns.append("date_creation as date_emission")
        elif col == 'date_echeance':
            select_columns.append("NULL as date_echeance")
        elif col == 'statut':
            select_columns.append("'Non payée' as statut")
        else:
            select_columns.append("NULL as " + col)

# Gérer le cas spécial de tva/taux_tva
if 'taux_tva' in column_names:
    select_columns.append('taux_tva as tva')
else:
    select_columns.append('20.0 as tva')

# Gérer le cas de observations/notes
if 'notes' in column_names:
    select_columns.append('notes as observations')
else:
    select_columns.append("'' as observations")

# Gérer date_paiement
select_columns.append("NULL as date_paiement")

# Construire la requête SELECT
select_sql = ", ".join(select_columns)

# Construire la requête d'insertion complète
insert_sql = f"""
INSERT INTO facture (
    id, numero, client_id, prestation_id, stockage_id, date_emission, date_echeance,
    montant_ht, tva, montant_ttc, statut, date_paiement, mode_paiement, observations, commercial_id
)
SELECT 
    {select_sql}
FROM facture_old
"""

try:
    cursor.execute(insert_sql)
    
    # Vérifier que les données ont été insérées
    cursor.execute("SELECT COUNT(*) FROM facture")
    facture_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM facture_old")
    facture_old_count = cursor.fetchone()[0]
    
    print(f"Nombre d'enregistrements dans facture_old: {facture_old_count}")
    print(f"Nombre d'enregistrements migrés vers facture: {facture_count}")
    
    if facture_count == facture_old_count:
        # Supprimer l'ancienne table uniquement si nous avons le même nombre d'enregistrements
        cursor.execute("DROP TABLE facture_old")
        print("Table facture_old supprimée.")
    else:
        print("ATTENTION: Le nombre d'enregistrements ne correspond pas. facture_old conservée.")
    
    # Valider les modifications
    conn.commit()
    print("La table facture a été mise à jour avec succès!")
except Exception as e:
    print(f"Erreur lors de la migration des données: {e}")
    conn.rollback()
    print("ATTENTION: Opération annulée.")

# Vérifier les colonnes après la mise à jour
cursor.execute("PRAGMA table_info(facture)")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]
print(f"Nouvelles colonnes dans la table facture: {column_names}")

# Fermer la connexion
conn.close()
