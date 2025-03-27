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

class PrestationForm(FlaskForm):
    client_id = SelectField('Client', coerce=int)
    transporteur_id = SelectField('Transporteur', coerce=int)
    date_debut = DateTimeLocalField('Date et heure de début', format='%Y-%m-%dT%H:%M')
    date_fin = DateTimeLocalField('Date et heure de fin', format='%Y-%m-%dT%H:%M')
    trajet_depart = TextAreaField('Adresse de départ', validators=[DataRequired()])
    trajet_destination = TextAreaField('Adresse de destination', validators=[DataRequired()])
    societe = StringField('Société')
    montant = FloatField('Montant')
    observation = TextAreaField('Observations')
    priorite = SelectField('Priorité', choices=[
        (1, 'Basse'),
        (2, 'Moyenne-basse'),
        (3, 'Moyenne'),
        (4, 'Moyenne-haute'),
        (5, 'Haute')
    ], coerce=int)
    statut = SelectField('Statut', choices=[
        ('todo', 'À faire'),
        ('mod', 'Modifié'),
        ('done', 'Terminé'),
        ('payé', 'Payé'),
        ('del', 'Annulé')
    ])
