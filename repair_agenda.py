
from app import create_app
from extensions import db
from sqlalchemy import text

def repair_agenda_column():
    app = create_app()
    with app.app_context():
        try:
            # Vérifier si la colonne existe déjà
            try:
                db.session.execute(text("SELECT agenda_id FROM prestation LIMIT 1"))
                print("La colonne agenda_id existe déjà")
                return
            except:
                print("Ajout de la colonne agenda_id...")
                
            # Ajouter la colonne
            db.session.execute(text("ALTER TABLE prestation ADD COLUMN agenda_id INTEGER REFERENCES agenda(id)"))
            db.session.commit()
            print("Colonne agenda_id ajoutée avec succès")
            
        except Exception as e:
            print(f"Erreur: {e}")
            db.session.rollback()

if __name__ == "__main__":
    repair_agenda_column()
