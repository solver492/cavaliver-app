
from app import create_app
from extensions import db
from sqlalchemy import text

def add_agenda_columns():
    app = create_app()
    with app.app_context():
        try:
            print("Ajout de colonnes à la table agenda...")
            db.session.execute(text("ALTER TABLE agenda ADD COLUMN couleur VARCHAR(7) DEFAULT '#3498db'"))
            db.session.execute(text("ALTER TABLE agenda ADD COLUMN observations JSON"))
            db.session.commit()
            print("Colonnes ajoutées avec succès")
        except Exception as e:
            print(f"Erreur: {e}")
            db.session.rollback()

if __name__ == "__main__":
    add_agenda_columns()
