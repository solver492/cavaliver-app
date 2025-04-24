from app import create_app, db

app = create_app()

with app.app_context():
    print("Mise u00e0 jour de la base de donnu00e9es...")
    db.create_all()
    print("Base de donnu00e9es mise u00e0 jour avec succu00e8s!")
