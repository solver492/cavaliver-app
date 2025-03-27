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
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    created_by = db.relationship('User', backref='clients', foreign_keys=[created_by_id])

class Prestation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=False)
    adresse_depart = db.Column(db.Text, nullable=False)
    adresse_arrivee = db.Column(db.Text, nullable=False)
    observation = db.Column(db.Text)
    statut = db.Column(db.String(20), default='todo')  # todo, done, mod, canceled
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    id_user_transporteur = db.Column(db.Integer, db.ForeignKey('user.id'))
    id_user_commercial = db.Column(db.Integer, db.ForeignKey('user.id'))
    planning_id = db.Column(db.Integer, db.ForeignKey('planning.id'))
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    client = db.relationship('Client', backref='prestations')
    created_by = db.relationship('User', backref='created_prestations', foreign_keys=[created_by_id])
    planning = db.relationship('Planning', backref='prestations')
    transporteur = db.relationship('User', foreign_keys=[id_user_transporteur], backref='prestations_transporteur')
    commercial = db.relationship('User', foreign_keys=[id_user_commercial], backref='prestations_commercial')

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
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    client = db.relationship('Client', backref='documents')
    created_by = db.relationship('User', backref='uploaded_documents', foreign_keys=[created_by_id])
