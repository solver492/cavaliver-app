import sqlite3
import os

def migrate_facture_tables():
    """
    Script pour créer les tables facture et ligne_facture dans la base de données
    """
    print("Début de la migration pour les tables de facturation...")
    
    # Connexion à la base de données
    conn = sqlite3.connect('demenage.db')
    cursor = conn.cursor()
    
    # Vérifier si la table facture existe déjà
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='facture'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        print("Création de la table 'facture'...")
        cursor.execute('''
        CREATE TABLE facture (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero VARCHAR(50) NOT NULL UNIQUE,
            prestation_id INTEGER NOT NULL,
            client_id INTEGER NOT NULL,
            montant_ht FLOAT NOT NULL,
            taux_tva FLOAT DEFAULT 20.0,
            montant_ttc FLOAT NOT NULL,
            date_emission DATETIME DEFAULT CURRENT_TIMESTAMP,
            date_echeance DATETIME,
            statut VARCHAR(20) DEFAULT 'en_attente',
            mode_paiement VARCHAR(50),
            date_paiement DATETIME,
            notes TEXT,
            created_by_id INTEGER NOT NULL,
            date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (prestation_id) REFERENCES prestation (id),
            FOREIGN KEY (client_id) REFERENCES client (id),
            FOREIGN KEY (created_by_id) REFERENCES user (id)
        )
        ''')
        print("Table 'facture' créée avec succès.")
    else:
        print("La table 'facture' existe déjà.")
    
    # Vérifier si la table ligne_facture existe déjà
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ligne_facture'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        print("Création de la table 'ligne_facture'...")
        cursor.execute('''
        CREATE TABLE ligne_facture (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            facture_id INTEGER NOT NULL,
            description VARCHAR(255) NOT NULL,
            quantite FLOAT DEFAULT 1,
            prix_unitaire FLOAT NOT NULL,
            montant FLOAT NOT NULL,
            FOREIGN KEY (facture_id) REFERENCES facture (id)
        )
        ''')
        print("Table 'ligne_facture' créée avec succès.")
    else:
        print("La table 'ligne_facture' existe déjà.")
    
    # Créer un index sur les clés étrangères pour améliorer les performances
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_facture_prestation ON facture (prestation_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_facture_client ON facture (client_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ligne_facture_facture ON ligne_facture (facture_id)")
    
    # Valider les modifications
    conn.commit()
    
    # Fermer la connexion
    conn.close()
    print("Migration des tables de facturation terminée avec succès.")

if __name__ == "__main__":
    migrate_facture_tables()
