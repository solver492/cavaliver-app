import sqlite3
import os

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

# Vérifier si la table facture existe
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='facture'")
if not cursor.fetchone():
    print("La table facture n'existe pas.")
    conn.close()
    exit(1)

# Vérifier les colonnes existantes
cursor.execute("PRAGMA table_info(facture)")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]
print(f"Colonnes existantes dans la table facture: {column_names}")

# Vérifier si nous avons la colonne tva ou taux_tva
has_tva = 'tva' in column_names
has_taux_tva = 'taux_tva' in column_names

if has_tva:
    print("La colonne tva existe déjà.")
    conn.close()
    exit(0)

# Nous devons créer une nouvelle table et migrer les données
print("Mise à jour de la structure de la table facture...")

# 1. Renommer la table existante
cursor.execute("ALTER TABLE facture RENAME TO facture_old")

# 2. Créer une nouvelle table avec la structure correcte
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

# 3. Insérer les données avec mapping des colonnes
if has_taux_tva:
    # Si nous avions taux_tva, l'utiliser pour tva
    insert_sql = """
    INSERT INTO facture (
        id, numero, client_id, prestation_id, stockage_id, date_emission, date_echeance,
        montant_ht, tva, montant_ttc, statut, date_paiement, mode_paiement, observations, commercial_id
    )
    SELECT 
        id, numero, client_id, prestation_id, stockage_id, date_emission, date_echeance,
        montant_ht, taux_tva, montant_ttc, statut, date_paiement, mode_paiement, 
        COALESCE(notes, ''), commercial_id
    FROM facture_old
    """
else:
    # Si nous n'avions pas taux_tva, utiliser une valeur par défaut
    insert_sql = """
    INSERT INTO facture (
        id, numero, client_id, prestation_id, stockage_id, date_emission, date_echeance,
        montant_ht, tva, montant_ttc, statut, date_paiement, mode_paiement, observations, commercial_id
    )
    SELECT 
        id, numero, client_id, prestation_id, stockage_id, date_emission, date_echeance,
        montant_ht, 20.0, montant_ttc, statut, date_paiement, mode_paiement, 
        COALESCE(notes, ''), commercial_id
    FROM facture_old
    """

try:
    cursor.execute(insert_sql)
    # 4. Supprimer l'ancienne table
    cursor.execute("DROP TABLE facture_old")
    # Valider les modifications
    conn.commit()
    print("La table facture a été mise à jour avec succès!")
except Exception as e:
    print(f"Erreur lors de la migration des données: {e}")
    # En cas d'erreur, on peut vouloir annuler
    conn.rollback()
    print("ATTENTION: La table a été renommée en facture_old mais la nouvelle n'a pas été créée correctement.")

# Vérifier les colonnes après la mise à jour
cursor.execute("PRAGMA table_info(facture)")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]
print(f"Nouvelles colonnes dans la table facture: {column_names}")

# Fermer la connexion
conn.close()
