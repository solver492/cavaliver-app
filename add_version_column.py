from flask import Flask
from extensions import db
from sqlalchemy import Column, Integer, Table, MetaData
from sqlalchemy.sql import text

app = Flask(__name__)
app.config.from_object('config.Config')
db.init_app(app)

def add_version_column():
    with app.app_context():
        # Vérifier si la colonne existe déjà
        conn = db.engine.connect()
        result = conn.execute(text("PRAGMA table_info(evenement)"))
        columns = [row[1] for row in result]
        
        if 'version' not in columns:
            print("Ajout de la colonne 'version' à la table 'evenement'...")
            conn.execute(text("ALTER TABLE evenement ADD COLUMN version INTEGER DEFAULT 1"))
            print("Colonne 'version' ajoutée avec succès!")
        else:
            print("La colonne 'version' existe déjà dans la table 'evenement'.")
        
        # Vérifier si la colonne archive existe déjà
        if 'archive' not in columns:
            print("Ajout de la colonne 'archive' à la table 'evenement'...")
            conn.execute(text("ALTER TABLE evenement ADD COLUMN archive BOOLEAN DEFAULT 0"))
            print("Colonne 'archive' ajoutée avec succès!")
        else:
            print("La colonne 'archive' existe déjà dans la table 'evenement'.")
        
        # Mettre à jour les valeurs NULL
        conn.execute(text("UPDATE evenement SET version = 1 WHERE version IS NULL"))
        conn.execute(text("UPDATE evenement SET archive = 0 WHERE archive IS NULL"))
        
        print("Mise à jour des valeurs NULL terminée.")
        conn.close()

if __name__ == '__main__':
    add_version_column()
    print("Script terminé avec succès!")
