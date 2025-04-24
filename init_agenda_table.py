
from app import create_app, db
from models import Agenda

def init_agenda_table():
    app = create_app()
    with app.app_context():
        # Create tables
        db.create_all()
        print("Agenda table created successfully!")

if __name__ == "__main__":
    init_agenda_table()
