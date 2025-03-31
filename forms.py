from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SelectField, TextAreaField, FloatField, DateTimeLocalField, IntegerField
from wtforms.validators import DataRequired, Email, Length, Optional

class LoginForm(FlaskForm):
    username = StringField('Nom d\'utilisateur', validators=[DataRequired()])
    password = PasswordField('Mot de passe', validators=[DataRequired()])

class UserForm(FlaskForm):
    username = StringField('Nom d\'utilisateur', validators=[DataRequired(), Length(min=3)])
    password = PasswordField('Mot de passe', validators=[Optional(), Length(min=6)])
    nom = StringField('Nom', validators=[DataRequired()])
    prenom = StringField('Prénom', validators=[DataRequired()])
    role = SelectField('Rôle', choices=[
        ('commercial', 'Commercial'),
        ('transporteur', 'Transporteur'),
        ('admin', 'Administrateur')
    ])
    statut = SelectField('Statut', choices=[
        ('actif', 'Actif'),
        ('inactif', 'Inactif')
    ])
    vehicule = StringField('Véhicule')

class ClientForm(FlaskForm):
    nom = StringField('Nom', validators=[DataRequired()])
    prenom = StringField('Prénom', validators=[DataRequired()])
    adresse = TextAreaField('Adresse')
    telephone = StringField('Téléphone')
    email = StringField('Email', validators=[Optional(), Email()])
    client_type = SelectField('Type de client', choices=[
        ('particulier', 'Client particulier'),
        ('entreprise', 'Entreprise')
    ])
    tags = StringField('Tags (séparés par des virgules)')

class PrestationForm(FlaskForm):
    client_id = SelectField('Client', coerce=int)
    transporteur_ids = SelectField('Transporteurs', coerce=int, validators=[Optional()])
    date_debut = DateTimeLocalField('Date et heure de début', format='%Y-%m-%dT%H:%M')
    date_fin = DateTimeLocalField('Date et heure de fin', format='%Y-%m-%dT%H:%M')
    adresse_depart = TextAreaField('Adresse de départ', validators=[DataRequired()])
    adresse_arrivee = TextAreaField('Adresse de destination', validators=[DataRequired()])
    # Ces champs sont conservés pour la compatibilité, mais ils seront stockés dans adresse_depart et adresse_arrivee
    trajet_depart = TextAreaField('Point de départ', validators=[Optional()])
    trajet_destination = TextAreaField('Point de destination', validators=[Optional()])
    societe = StringField('Société')
    montant = FloatField('Montant')
    observation = TextAreaField('Observations')
    # Le champ requires_packaging est retiré car il n'existe pas dans la base de données sur Render
    # Le champ demenagement_type est retiré car il n'existe pas dans la base de données sur Render
    # Le champ camion_type est retiré car il n'existe pas dans la base de données sur Render
    priorite = SelectField('Priorité', choices=[
        ('0', 'Normale'),
        ('1', 'Urgente'),
        ('2', 'Très urgente')
    ], coerce=int)
    tags = StringField('Tags (séparés par des virgules)')
    statut = SelectField('Statut', choices=[
        ('en attente', 'En attente'),
        ('en cours', 'En cours'),
        ('todo', 'À faire'),
        ('mod', 'Modifié'),
        ('done', 'Terminé'),
        ('payé', 'Payé'),
        ('del', 'Annulé')
    ])
