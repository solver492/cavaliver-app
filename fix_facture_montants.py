from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import Facture
from extensions import db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cavalier.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def fix_facture_montants():
    with app.app_context():
        try:
            factures = Facture.query.all()
            fixed_count = 0
            for facture in factures:
                # Fix montant_ht
                if isinstance(facture.montant_ht, str):
                    try:
                        facture.montant_ht = float(facture.montant_ht.replace(',', '.'))
                        fixed_count += 1
                    except (ValueError, AttributeError):
                        print(f"Erreur de conversion pour montant_ht de la facture {facture.numero}")
                        facture.montant_ht = 0.0

                # Fix montant_ttc
                if isinstance(facture.montant_ttc, str):
                    try:
                        facture.montant_ttc = float(facture.montant_ttc.replace(',', '.'))
                        fixed_count += 1
                    except (ValueError, AttributeError):
                        print(f"Erreur de conversion pour montant_ttc de la facture {facture.numero}")
                        facture.montant_ttc = 0.0

            db.session.commit()
            print(f"Correction des montants terminée. {fixed_count} montants corrigés.")
        except Exception as e:
            print(f"Une erreur est survenue : {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    fix_facture_montants()
