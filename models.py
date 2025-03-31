from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True)  
    password_hash = db.Column(db.String(128))
    nom = db.Column(db.String(100))
    prenom = db.Column(db.String(100))
    role = db.Column(db.String(20), default='user')
    vehicule = db.Column(db.String(100))
    statut = db.Column(db.String(20), default='actif')
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    telephone = db.Column(db.String(20))
    adresse = db.Column(db.Text)
    client_type = db.Column(db.String(20), default='particulier')  # 'particulier' or 'entreprise'
    tags = db.Column(db.Text)  # Store tags as comma-separated values
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    archived = db.Column(db.Boolean, default=False)  # Pour indiquer si le client est archivé
    
    created_by = db.relationship('User', backref='clients', foreign_keys=[created_by_id])

class Prestation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'))
    date_debut = db.Column(db.DateTime)
    date_fin = db.Column(db.DateTime)
    adresse_depart = db.Column(db.Text)
    adresse_arrivee = db.Column(db.Text)
    trajet_depart = db.Column(db.Text)
    trajet_destination = db.Column(db.Text)
    observation = db.Column(db.Text)
    statut = db.Column(db.String(20), default='en attente')  # en attente, en cours, todo, done, mod, canceled
    requires_packaging = db.Column(db.Boolean, default=False)
    demenagement_type = db.Column(db.String(50))  # furniture, fragile items, etc.
    camion_type = db.Column(db.String(100))
    priorite = db.Column(db.Integer, default=0)  # Priorité de la prestation
    societe = db.Column(db.String(100))  # Nom de la société
    montant = db.Column(db.Float)  # Montant en euros
    tags = db.Column(db.Text)  # Store tags as comma-separated values
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    id_user_commercial = db.Column(db.Integer, db.ForeignKey('user.id'))
    planning_id = db.Column(db.Integer, db.ForeignKey('planning.id'), nullable=True)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    archived = db.Column(db.Boolean, default=False)  # Pour indiquer si la prestation est archivée
    
    # Relations
    client = db.relationship('Client', backref='prestations')
    commercial = db.relationship('User', backref='prestations_commerciales', foreign_keys=[id_user_commercial])
    created_by = db.relationship('User', backref='prestations_created', foreign_keys=[created_by_id])
    planning = db.relationship('Planning', backref='prestations')
    
    # Relation many-to-many avec les transporteurs via la table d'association
    transporters = db.relationship(
        'User',
        secondary='prestation_transporter',
        backref=db.backref('prestations_transporteur', lazy='dynamic'),
        lazy='dynamic'
    )

class PrestationTransporter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'), nullable=False)
    transporter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    statut = db.Column(db.String(20), default='en_attente')  # en_attente, acceptee, refusee, terminee
    date_assignation = db.Column(db.DateTime, default=datetime.utcnow)
    date_acceptation = db.Column(db.DateTime, nullable=True)
    date_refus = db.Column(db.DateTime, nullable=True)
    date_finalisation = db.Column(db.DateTime, nullable=True)
    
    # Relations
    prestation = db.relationship('Prestation', backref=db.backref('prestation_transporters', lazy='dynamic'))
    transporter = db.relationship('User', backref=db.backref('transporter_prestations', lazy='dynamic'))

class CustomField(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    field_type = db.Column(db.String(20), nullable=False)  # text, number, date, etc.
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    created_by = db.relationship('User', backref='created_fields', foreign_keys=[created_by_id])

class CustomFieldValue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    field_id = db.Column(db.Integer, db.ForeignKey('custom_field.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    value = db.Column(db.Text)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    field = db.relationship('CustomField', backref='values')
    client = db.relationship('Client', backref='custom_values')
    created_by = db.relationship('User', backref='created_values', foreign_keys=[created_by_id])

class Planning(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_update = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    created_by = db.relationship('User', backref='created_plannings', foreign_keys=[created_by_id])

class PlanningEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    planning_id = db.Column(db.Integer, db.ForeignKey('planning.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    color = db.Column(db.String(20), default='#0d6efd')
    type = db.Column(db.String(20), default='custom')
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'))
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    planning = db.relationship('Planning', backref='events')
    prestation = db.relationship('Prestation', backref='planning_events')
    created_by = db.relationship('User', backref='created_events', foreign_keys=[created_by_id])

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50))
    document_type = db.Column(db.String(50), default='autre')  # facture, contrat, devis, autre
    description = db.Column(db.Text)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    client = db.relationship('Client', backref='documents')
    created_by = db.relationship('User', backref='uploaded_documents', foreign_keys=[created_by_id])

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info')  # info, warning, success, error
    is_read = db.Column(db.Boolean, default=False)
    related_prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'))
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')
    related_prestation = db.relationship('Prestation', backref='notifications')

class Facture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(50), unique=True, nullable=False)
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    montant_ht = db.Column(db.Float, nullable=False)
    taux_tva = db.Column(db.Float, default=20.0)  # Taux de TVA en pourcentage
    montant_ttc = db.Column(db.Float, nullable=False)
    date_emission = db.Column(db.DateTime, default=datetime.utcnow)
    date_echeance = db.Column(db.DateTime)
    statut = db.Column(db.String(20), default='en_attente')  # en_attente, payee, annulee, retard
    mode_paiement = db.Column(db.String(50))  # virement, carte, espèces, chèque
    date_paiement = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    prestation = db.relationship('Prestation', backref='factures')
    client = db.relationship('Client', backref='factures')
    created_by = db.relationship('User', backref='factures_created', foreign_keys=[created_by_id])

class LigneFacture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    facture_id = db.Column(db.Integer, db.ForeignKey('facture.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    quantite = db.Column(db.Float, default=1)
    prix_unitaire = db.Column(db.Float, nullable=False)
    montant = db.Column(db.Float, nullable=False)
    
    # Relation
    facture = db.relationship('Facture', backref='lignes')
