from datetime import datetime
from app import db

class Facture(db.Model):
    __tablename__ = 'facture'
    
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(50), nullable=False, unique=True)
    date_emission = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    date_echeance = db.Column(db.Date, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'))
    montant = db.Column(db.Float, nullable=False, default=0.0)
    statut = db.Column(db.String(20), nullable=False, default='en_attente')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    lignes = db.relationship('LigneFacture', backref='facture', lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<Facture {self.id}: {self.numero}>'
    
    def calculer_montant_total(self):
        """Calcule le montant total de la facture à partir des lignes"""
        total = 0
        for ligne in self.lignes:
            total += ligne.montant
        return total
    
    def mettre_a_jour_montant(self):
        """Met à jour le montant total de la facture"""
        self.montant = self.calculer_montant_total()
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour l'API"""
        return {
            'id': self.id,
            'numero': self.numero,
            'date_emission': self.date_emission.strftime('%Y-%m-%d'),
            'date_echeance': self.date_echeance.strftime('%Y-%m-%d'),
            'client_id': self.client_id,
            'montant': self.montant,
            'statut': self.statut,
            'notes': self.notes,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'lignes': [ligne.to_dict() for ligne in self.lignes]
        }


class LigneFacture(db.Model):
    __tablename__ = 'ligne_facture'
    
    id = db.Column(db.Integer, primary_key=True)
    facture_id = db.Column(db.Integer, db.ForeignKey('facture.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    quantite = db.Column(db.Integer, nullable=False, default=1)
    prix_unitaire = db.Column(db.Float, nullable=False)
    montant = db.Column(db.Float, nullable=False)
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'))
    
    def __repr__(self):
        return f'<LigneFacture {self.id}: {self.description}>'
    
    def calculer_montant(self):
        """Calcule le montant de la ligne"""
        return self.quantite * self.prix_unitaire
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour l'API"""
        return {
            'id': self.id,
            'facture_id': self.facture_id,
            'description': self.description,
            'quantite': self.quantite,
            'prix_unitaire': self.prix_unitaire,
            'montant': self.montant,
            'prestation_id': self.prestation_id
        }