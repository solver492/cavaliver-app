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
    demenagement_type = SelectField('Type de déménagement', choices=[
        ('demenagement_residence', 'Déménagement résidentiel'),
        ('demenagement_entreprise', 'Déménagement d\'entreprise'),
        ('transport_equipement_industriel', 'Transport d\'équipements industriels'),
        ('demenagement_partiel', 'Déménagement partiel'),
        ('demenagement_total', 'Déménagement total'),
        ('montage_meubles', 'Avec montage de meubles'),
        ('stockage', 'Avec stockage temporaire')
    ])
    camion_type = SelectField('Type de camion', choices=[
        ('fourgon_12m3', 'Fourgon 12 m³ (petit déménagement)'),
        ('camion_20m3', 'Camion spécial 20 m³ avec hayon'),
        ('petit_camion', 'Petit camion 20-23 m³ (logements < 50 m²)'),
        ('camion_5t', 'Camion 5 tonnes 30-40 m³ (logements 50-80 m²)'),
        ('camion_10t', 'Camion 10 tonnes 50 m³ (logements 80-100 m²)'),
        ('semi_remorque', 'Semi-remorque 80-100 m³ (très grands déménagements)')
    ])
    tags = StringField('Tags (séparés par des virgules)')
    priorite = SelectField('Priorité', choices=[
        (1, 'Basse'),
        (2, 'Moyenne-basse'),
        (3, 'Moyenne'),
        (4, 'Moyenne-haute'),
        (5, 'Haute')
    ], coerce=int)
    statut = SelectField('Statut', choices=[
        ('en attente', 'En attente'),
        ('en cours', 'En cours'),
        ('todo', 'À faire'),
        ('mod', 'Modifié'),
        ('done', 'Terminé'),
        ('payé', 'Payé'),
        ('del', 'Annulé')
    ])
