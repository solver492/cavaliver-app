import sqlite3
import os

# Chemin de la base de données (mise à jour pour le dossier instance)
db_path = 'instance/cavalier.db'

# Vérifier si la base de données existe
if not os.path.exists(db_path):
    print(f"Erreur: La base de données {db_path} n'existe pas.")
    exit(1)

# Se connecter à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Vérifier si la colonne existe déjà
cursor.execute("PRAGMA table_info(facture)")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]

if 'commercial_id' not in column_names:
    print("Ajout de la colonne commercial_id à la table facture...")
    
    # En SQLite, nous devons:
    # 1. Renommer la table existante
    # 2. Créer une nouvelle table avec la structure souhaitée
    # 3. Copier les données
    # 4. Supprimer l'ancienne table
    
    # 1. Renommer la table existante
    cursor.execute("ALTER TABLE facture RENAME TO facture_old")
    
    # 2. Créer une nouvelle table avec la structure souhaitée
    cursor.execute("""
    CREATE TABLE facture (
        id INTEGER PRIMARY KEY,
        numero VARCHAR(50) NOT NULL UNIQUE,
        client_id INTEGER NOT NULL,
        prestation_id INTEGER,
        stockage_id INTEGER,
        commercial_id INTEGER,
        societe VARCHAR(50),
        montant_ht FLOAT NOT NULL,
        taux_tva FLOAT NOT NULL,
        montant_ttc FLOAT NOT NULL,
        date_emission DATETIME NOT NULL,
        date_echeance DATETIME NOT NULL,
        mode_paiement VARCHAR(50),
        statut VARCHAR(50) DEFAULT 'En attente',
        notes TEXT,
        date_creation DATETIME NOT NULL,
        FOREIGN KEY (client_id) REFERENCES client (id),
        FOREIGN KEY (prestation_id) REFERENCES prestation (id),
        FOREIGN KEY (stockage_id) REFERENCES stockage (id),
        FOREIGN KEY (commercial_id) REFERENCES user (id)
    )
    """)
    
    # 3. Copier les données
    cursor.execute("""
    INSERT INTO facture (
        id, numero, client_id, prestation_id, stockage_id, societe, 
        montant_ht, taux_tva, montant_ttc, date_emission, date_echeance, 
        mode_paiement, statut, notes, date_creation
    )
    SELECT 
        id, numero, client_id, prestation_id, stockage_id, societe, 
        montant_ht, taux_tva, montant_ttc, date_emission, date_echeance, 
        mode_paiement, statut, notes, date_creation
    FROM facture_old
    """)
    
    # 4. Supprimer l'ancienne table
    cursor.execute("DROP TABLE facture_old")
    
    # Valider les modifications
    conn.commit()
    print("La colonne commercial_id a été ajoutée avec succès!")
else:
    print("La colonne commercial_id existe déjà dans la table facture.")

# Fermer la connexion
conn.close()
