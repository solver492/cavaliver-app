from app import create_app, db
from flask_migrate import upgrade
import os

def reset_and_create_db():
    app = create_app()

    with app.app_context():
        # Supprimer la base de données existante
        if os.path.exists('instance/cavalier.db'):
            os.remove('instance/cavalier.db')
            print("Base de données existante supprimée.")

        # Créer toutes les tables
        db.create_all()
        print("Tables créées avec succès.")

        # Appliquer les migrations
        try:
            upgrade()
            print("Migrations appliquées avec succès.")
        except Exception as e:
            print(f"Erreur lors de l'application des migrations: {e}")
            # Continuer même si les migrations échouent
            pass

if __name__ == "__main__":
    reset_and_create_db()