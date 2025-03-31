import sqlite3

def check_table_structure():
    """
    Script pour vérifier la structure actuelle de la table prestation
    """
    print("Vérification de la structure de la table prestation...")
    
    # Connexion à la base de données
    conn = sqlite3.connect('demenage.db')
    cursor = conn.cursor()
    
    # Vérifier la structure de la table prestation
    cursor.execute("PRAGMA table_info(prestation)")
    columns = cursor.fetchall()
    
    print("Structure actuelle de la table prestation:")
    for column in columns:
        print(f"- {column[1]} ({column[2]})")
    
    # Fermer la connexion
    conn.close()

if __name__ == "__main__":
    check_table_structure()
