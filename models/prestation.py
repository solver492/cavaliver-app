from datetime import datetime
from app import db

class Prestation(db.Model):
    __tablename__ = 'prestation'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'))
    titre = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    date_debut = db.Column(db.Date, nullable=False)
    date_fin = db.Column(db.Date)
    statut = db.Column(db.String(50), default='en_attente')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    archived = db.Column(db.Boolean, default=False)
    
    # Colonnes ajoutées pour corriger les erreurs
    societe = db.Column(db.String(255))
    montant = db.Column(db.Float, default=0.0)
    tags = db.Column(db.Text)
    trajet_depart = db.Column(db.Text)
    trajet_destination = db.Column(db.Text)
    requires_packaging = db.Column(db.Boolean, default=False)
    demenagement_type = db.Column(db.String(50))
    camion_type = db.Column(db.String(50))
    priorite = db.Column(db.Integer, default=0)
    
    # Relations
    client = db.relationship('Client', backref=db.backref('prestations', lazy=True))
    facture_lignes = db.relationship('LigneFacture', backref='prestation', lazy=True)
    
    def __repr__(self):
        return f'<Prestation {self.id}: {self.titre}>'
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour l'API"""
        return {
            'id': self.id,
            'client_id': self.client_id,
            'titre': self.titre,
            'description': self.description,
            'date_debut': self.date_debut.strftime('%Y-%m-%d') if self.date_debut else None,
            'date_fin': self.date_fin.strftime('%Y-%m-%d') if self.date_fin else None,
            'statut': self.statut,
            'societe': self.societe,
            'montant': self.montant,
            'tags': self.tags,
            'trajet_depart': self.trajet_depart,
            'trajet_destination': self.trajet_destination,
            'requires_packaging': self.requires_packaging,
            'demenagement_type': self.demenagement_type,
            'camion_type': self.camion_type,
            'priorite': self.priorite,
            'archived': self.archived,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }