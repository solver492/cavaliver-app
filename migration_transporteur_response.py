import sqlite3
import os
from datetime import datetime

def add_transporteur_response_columns():
    """
    Ajoute les colonnes raison_refus et date_reponse à la table prestation
    """
    # Chemin de la base de données
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cavalier.db')
    
    # Vérifier si la base de données existe
    if not os.path.exists(db_path):
        print(f"Base de données non trouvée à l'emplacement : {db_path}")
        return False
    
    # Se connecter à la base de données
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Vérifier si les colonnes existent déjà
        cursor.execute("PRAGMA table_info(prestation)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Ajouter la colonne raison_refus si elle n'existe pas
        if 'raison_refus' not in columns:
            cursor.execute("ALTER TABLE prestation ADD COLUMN raison_refus TEXT")
            print("Colonne 'raison_refus' ajoutée avec succès.")
        else:
            print("La colonne 'raison_refus' existe déjà.")
        
        # Ajouter la colonne date_reponse si elle n'existe pas
        if 'date_reponse' not in columns:
            cursor.execute("ALTER TABLE prestation ADD COLUMN date_reponse TIMESTAMP")
            print("Colonne 'date_reponse' ajoutée avec succès.")
        else:
            print("La colonne 'date_reponse' existe déjà.")
        
        # Valider les modifications
        conn.commit()
        print("Migration terminée avec succès.")
        return True
    
    except Exception as e:
        # Annuler les modifications en cas d'erreur
        conn.rollback()
        print(f"Erreur lors de la migration : {str(e)}")
        return False
    
    finally:
        # Fermer la connexion
        conn.close()

if __name__ == "__main__":
    print("Début de la migration pour ajouter les colonnes de réponse des transporteurs...")
    success = add_transporteur_response_columns()
    
    if success:
        print("Migration terminée avec succès.")
    else:
        print("La migration a échoué.")
