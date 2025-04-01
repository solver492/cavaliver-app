from datetime import datetime
from app import db

class Client(db.Model):
    __tablename__ = 'client'
    
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100))
    email = db.Column(db.String(100))
    telephone = db.Column(db.String(20))
    adresse = db.Column(db.Text)
    ville = db.Column(db.String(100))
    code_postal = db.Column(db.String(20))
    pays = db.Column(db.String(50), default='France')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Colonnes ajoutées pour corriger les erreurs
    tags = db.Column(db.Text)
    client_type = db.Column(db.String(50), default='particulier')
    
    # Relations
    prestations = db.relationship('Prestation', backref='client', lazy=True)
    factures = db.relationship('Facture', backref='client', lazy=True)
    
    def __repr__(self):
        return f'<Client {self.id}: {self.nom} {self.prenom}>'
    
    def nom_complet(self):
        """Retourne le nom complet du client"""
        if self.prenom:
            return f"{self.prenom} {self.nom}"
        return self.nom
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour l'API"""
        return {
            'id': self.id,
            'nom': self.nom,
            'prenom': self.prenom,
            'email': self.email,
            'telephone': self.telephone,
            'adresse': self.adresse,
            'ville': self.ville,
            'code_postal': self.code_postal,
            'pays': self.pays,
            'notes': self.notes,
            'tags': self.tags,
            'client_type': self.client_type,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }