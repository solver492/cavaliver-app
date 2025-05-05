import sqlite3
import os

def add_commercial_column():
    # Chemin vers la base de données
    db_path = os.path.join('instance', 'app.db')
    
    # Connexion directe à SQLite
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Vérifier si la colonne existe déjà
        cursor.execute("PRAGMA table_info(client)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'commercial_id' not in columns:
            print("Ajout de la colonne commercial_id...")
            
            # Créer une sauvegarde de la table
            cursor.execute("CREATE TABLE client_backup AS SELECT * FROM client")
            
            # Supprimer la table originale
            cursor.execute("DROP TABLE client")
            
            # Créer la nouvelle table avec la colonne commercial_id
            cursor.execute("""
                CREATE TABLE client (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nom VARCHAR(64) NOT NULL,
                    prenom VARCHAR(64) NOT NULL,
                    adresse TEXT,
                    code_postal VARCHAR(10),
                    ville VARCHAR(64),
                    pays VARCHAR(64) DEFAULT 'France',
                    telephone VARCHAR(20),
                    email VARCHAR(120),
                    type_client VARCHAR(50),
                    tags TEXT,
                    observations TEXT,
                    statut VARCHAR(20) DEFAULT 'actif',
                    archive BOOLEAN DEFAULT 0,
                    date_creation DATETIME NOT NULL,
                    commercial_id INTEGER REFERENCES user(id)
                )
            """)
            
            # Copier les données de la sauvegarde
            cursor.execute("""
                INSERT INTO client (
                    id, nom, prenom, adresse, code_postal, ville, pays,
                    telephone, email, type_client, tags, observations,
                    statut, archive, date_creation
                )
                SELECT id, nom, prenom, adresse, code_postal, ville, pays,
                       telephone, email, type_client, tags, observations,
                       statut, archive, date_creation
                FROM client_backup
            """)
            
            # Supprimer la table de sauvegarde
            cursor.execute("DROP TABLE client_backup")
            
            # Mettre à jour commercial_id pour les clients existants
            # Trouver un admin/superadmin
            cursor.execute("SELECT id FROM user WHERE role IN ('admin', 'superadmin') LIMIT 1")
            admin = cursor.fetchone()
            if admin:
                cursor.execute("UPDATE client SET commercial_id = ? WHERE commercial_id IS NULL", (admin[0],))
            
            conn.commit()
            print("Migration terminée avec succès!")
        else:
            print("La colonne commercial_id existe déjà.")
            
    except Exception as e:
        conn.rollback()
        print(f"Erreur lors de la migration : {str(e)}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    add_commercial_column()
