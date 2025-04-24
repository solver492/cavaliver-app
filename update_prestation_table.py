"""
Script pour mettre à jour la structure de la table prestation
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
    
    # Vérifier si les colonnes requises existent
    cursor.execute("PRAGMA table_info(prestation)")
    columns = {row[1]: row for row in cursor.fetchall()}
    
    # Colonnes à ajouter
    missing_columns = []
    if 'transporteur_id' not in columns:
        missing_columns.append(('transporteur_id', 'INTEGER'))
    
    if 'vehicule_id' not in columns:
        missing_columns.append(('vehicule_id', 'INTEGER'))
    
    # Ajouter les colonnes manquantes
    for column_name, column_type in missing_columns:
        try:
            cursor.execute(f"ALTER TABLE prestation ADD COLUMN {column_name} {column_type}")
            print(f"Colonne {column_name} ajoutée avec succès")
        except Exception as e:
            print(f"Erreur lors de l'ajout de la colonne {column_name}: {e}")
    
    # Gérer les colonnes renommées
    rename_map = {
        'derniere_modification_par': 'modifie_par',
        'date_derniere_modification': 'date_modification'
    }
    
    # Pour SQLite, nous ne pouvons pas renommer les colonnes facilement,
    # donc nous créons une nouvelle table avec la structure correcte
    
    # 1. Vérifier si une migration est nécessaire
    need_migration = False
    for old_col, new_col in rename_map.items():
        if old_col in columns and new_col not in columns:
            need_migration = True
            break
    
    if need_migration:
        print("Migration des données nécessaire en raison des colonnes renommées...")
        
        # 2. Créer une table temporaire avec la nouvelle structure
        column_names = [col for col in columns.keys() if col not in rename_map]
        for old_col, new_col in rename_map.items():
            if old_col in columns:
                column_names.append(new_col)  # Ajouter la nouvelle colonne avec le nouveau nom
            else:
                column_names.append(new_col)  # Ajouter la nouvelle colonne si elle n'existe pas déjà
        
        column_defs = []
        for col in column_names:
            if col in columns:
                # Utiliser la définition existante
                col_info = columns[col]
                col_def = f"{col} {col_info[2]}"
                if col_info[3]:  # NOT NULL
                    col_def += " NOT NULL"
                if col_info[4] is not None:  # DEFAULT
                    col_def += f" DEFAULT {col_info[4]}"
                if col_info[5]:  # PRIMARY KEY
                    col_def += " PRIMARY KEY"
                column_defs.append(col_def)
            elif col in ['transporteur_id', 'vehicule_id', 'modifie_par']:
                column_defs.append(f"{col} INTEGER")
            elif col == 'date_modification':
                column_defs.append(f"{col} DATETIME")
            else:
                # Si nous ne savons pas comment définir cette colonne, utilisez TEXT
                column_defs.append(f"{col} TEXT")
        
        # 3. Créer la nouvelle table
        cursor.execute(f"""
        CREATE TABLE prestation_new (
            {', '.join(column_defs)}
        )
        """)
        
        # 4. Copier les données de l'ancienne table vers la nouvelle
        # Construction de la requête d'insertion
        old_cols = [col for col in columns.keys()]
        new_cols = []
        select_cols = []
        
        for col in old_cols:
            if col in rename_map:
                # Utiliser le nouveau nom de colonne dans la table destination
                new_cols.append(rename_map[col])
                select_cols.append(col)
            else:
                new_cols.append(col)
                select_cols.append(col)
        
        # Ajouter les nouvelles colonnes sans équivalent dans l'ancienne table
        for col in column_names:
            if col not in new_cols:
                new_cols.append(col)
                select_cols.append("NULL")
        
        # Construire et exécuter la requête d'insertion
        cursor.execute(f"""
        INSERT INTO prestation_new ({', '.join(new_cols)})
        SELECT {', '.join(select_cols)} FROM prestation
        """)
        
        # 5. Supprimer l'ancienne table
        cursor.execute("DROP TABLE prestation")
        
        # 6. Renommer la nouvelle table
        cursor.execute("ALTER TABLE prestation_new RENAME TO prestation")
        
        print("Migration des données terminée")
    
    # Valider les modifications
    conn.commit()
    
    # Afficher les colonnes actuelles pour vérification
    cursor.execute("PRAGMA table_info(prestation)")
    current_columns = [row[1] for row in cursor.fetchall()]
    print(f"Colonnes actuelles de la table prestation: {', '.join(current_columns)}")
    
except Exception as e:
    print(f"Erreur lors de la modification de la base de données: {e}")
    if 'conn' in locals():
        conn.rollback()
    sys.exit(1)
finally:
    if 'conn' in locals():
        conn.close()
        print("Connexion à la base de données fermée")

print("Opération terminée avec succès")
