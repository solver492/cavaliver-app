from app import create_app, db
import sqlite3
import os

def check_tables():
    app = create_app()
    with app.app_context():
        try:
            # Vérifier si la table agenda existe
            result = db.session.execute(db.text("SELECT name FROM sqlite_master WHERE type='table' AND name='agenda'"))
            if result.fetchone() is None:
                print("La table 'agenda' n'existe pas, création en cours...")
                db.create_all()
            else:
                print("La table 'agenda' existe!")
        except Exception as e:
            print(f"Erreur lors de la vérification: {e}")
            db.create_all()

if __name__ == "__main__":
    check_tables()