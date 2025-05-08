
class FactureSearchForm(FlaskForm):
    client_id = SelectField('Client', coerce=int, choices=[])
    statut = SelectField('Statut', choices=[
        ('', 'Tous'),
        ('En attente', 'En attente'),
        ('Payée', 'Payée'),
        ('Retard', 'Retard'),
        ('Annulée', 'Annulée')
    ])
    date_debut = DateField('Date début')
    date_fin = DateField('Date fin')
    submit = SubmitField('Rechercher')
    reset = SubmitField('Réinitialiser')

from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import (
    StringField, PasswordField, SubmitField, TextAreaField, 
    SelectField, DateField, FloatField, BooleanField, 
    SelectMultipleField, HiddenField, IntegerField
)
from wtforms.validators import DataRequired, Email, Length, Optional, EqualTo
from datetime import datetime, timedelta
from flask_login import current_user

# Fonction de coercion personnalisu00e9e pour les select fields
def optional_int(value):
    if value == '' or value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

class LoginForm(FlaskForm):
    username = StringField('Nom d\'utilisateur', validators=[DataRequired()])
    password = PasswordField('Mot de passe', validators=[DataRequired()])
    submit = SubmitField('Se connecter')

class ClientForm(FlaskForm):
    nom = StringField('Nom', validators=[DataRequired()])
    prenom = StringField('Prénom', validators=[DataRequired()])
    adresse = TextAreaField('Adresse')
    code_postal = StringField('Code Postal')
    ville = StringField('Ville')
    pays = SelectField('Pays', choices=[
        ('France', 'France'),
        ('Belgique', 'Belgique'),
        ('Suisse', 'Suisse'),
        ('Luxembourg', 'Luxembourg'),
        ('Allemagne', 'Allemagne'),
        ('Espagne', 'Espagne'),
        ('Italie', 'Italie'),
        ('Royaume-Uni', 'Royaume-Uni'),
        ('Autre', 'Autre pays européen')
    ], default='France')
    telephone = StringField('Téléphone')
    email = StringField('Email', validators=[Optional(), Email()])
    type_client = SelectField('Type de client', choices=[
        ('', 'Sélectionnez un type...'),
        ('Particulier', 'Particulier'),
        ('Professionnel', 'Professionnel'),
        ('Entreprise', 'Entreprise'),
        ('Association', 'Association'),
        ('Administration', 'Administration')
    ])
    tags = StringField('Tags (séparés par des virgules)')
    observations = TextAreaField('Observations')
    documents = FileField('Documents (PDF uniquement)', validators=[
        FileAllowed(['pdf'], 'PDF uniquement')
    ])
    submit = SubmitField('Enregistrer')

class PrestationForm(FlaskForm):
    client_id = SelectField('Client', coerce=optional_int, validators=[DataRequired()])
    transporteurs = SelectMultipleField('Transporteurs', coerce=optional_int)
    date_debut = DateField('Date de début', validators=[DataRequired()], default=datetime.now)
    date_fin = DateField('Date de fin', validators=[DataRequired()], default=datetime.now() + timedelta(days=1))
    adresse_depart = TextAreaField('Adresse de départ', validators=[DataRequired()])
    adresse_arrivee = TextAreaField('Adresse d\'arrivée', validators=[DataRequired()])
    type_demenagement = SelectField('Type de déménagement', coerce=optional_int, validators=[DataRequired()])
    mode_groupage = BooleanField('Mode Groupage', default=False)
    tags = StringField('Tags (séparés par des virgules)')
    societe = SelectField('Société', choices=[
        ('', 'Sélectionner une société'),
        ('Cavalier', 'Cavalier'),
        ('L\'écuyer', 'L\'écuyer'),
        ('Nassali', 'Nassali')
    ])
    montant = FloatField('Montant')
    priorite = SelectField('Priorité', choices=[
        ('Normale', 'Normale'),
        ('Haute', 'Haute'),
        ('Urgente', 'Urgente')
    ], default='Normale')
    statut = SelectField('Statut', choices=[
        ('En attente', 'En attente'),
        ('Confirmée', 'Confirmée'),
        ('En cours', 'En cours'),
        ('Terminée', 'Terminée'),
        ('Annulée', 'Annulée')
    ], default='En attente')
    observations = TextAreaField('Observations')
    vehicules_suggeres = TextAreaField('Véhicules suggérés', render_kw={'readonly': True})
    submit = SubmitField('Enregistrer')

class FactureForm(FlaskForm):
    client_id = SelectField('Client', coerce=optional_int, validators=[DataRequired()])
    prestation_id = SelectField('Prestation', coerce=optional_int, validators=[Optional()])
    societe = SelectField('Société', choices=[
        ('', 'Sélectionner une société'),
        ('Cavalier', 'Cavalier'),
        ('L\'écuyer', 'L\'écuyer'),
        ('Nassali', 'Nassali')
    ])
    numero = StringField('Numéro de facture', validators=[DataRequired()])
    date_emission = DateField('Date d\'émission', validators=[DataRequired()], default=datetime.now)
    date_echeance = DateField('Date d\'échéance', validators=[DataRequired()], default=datetime.now() + timedelta(days=30))

    # Montants
    montant_ht = FloatField('Montant TTC de la prestation', validators=[DataRequired()])
    taux_tva = FloatField('Montant de l\'acompte', default=0)
    montant_ttc = FloatField('Montant Commission commerciale', default=0)
    montant_acompte = FloatField('Montant de l\'acompte', default=0)

    # Champs commission
    commission_pourcentage = FloatField('Pourcentage de commission (%)', default=0)
    commission_montant = FloatField('Montant de la commission (€)', default=0)

    # Champ caché pour le commercial
    commercial_id = HiddenField('Commercial')

    mode_paiement = SelectField('Mode de paiement', choices=[
        ('', 'Sélectionner un mode de paiement'),
        ('Virement', 'Virement bancaire'),
        ('Chèque', 'Chèque'),
        ('Espèces', 'Espèces'),
        ('Carte bancaire', 'Carte bancaire'),
        ('Autre', 'Autre')
    ])
    statut = SelectField('Statut', choices=[
        ('En attente', 'En attente'),
        ('Payée', 'Payée'),
        ('Retard', 'Retard'),
        ('Annulée', 'Annulée')
    ])
    notes = TextAreaField('Notes')
    submit = SubmitField('Enregistrer la facture')

class TypeVehiculeForm(FlaskForm):
    nom = StringField('Nom', validators=[DataRequired()])
    description = TextAreaField('Description')
    capacite = StringField('Capacité')
    types_demenagement = SelectMultipleField('Types de déménagement adaptés', coerce=optional_int)
    submit = SubmitField('Enregistrer')

class TypeDemenagementForm(FlaskForm):
    nom = StringField('Nom', validators=[DataRequired()])
    description = TextAreaField('Description')
    submit = SubmitField('Enregistrer')

class UserForm(FlaskForm):
    nom = StringField('Nom', validators=[DataRequired()])
    prenom = StringField('Prénom', validators=[DataRequired()])
    username = StringField('Nom d\'utilisateur', validators=[DataRequired()])
    email = StringField('Email', validators=[Optional(), Email()])
    password = PasswordField('Mot de passe', validators=[
        Optional(),
        Length(min=6, message='Le mot de passe doit contenir au moins 6 caractères')
    ])
    confirm_password = PasswordField('Confirmer le mot de passe', validators=[
        Optional(),
        EqualTo('password', message='Les mots de passe doivent correspondre')
    ])
    role = SelectField('Rôle', choices=[])
    statut = SelectField('Statut', choices=[
        ('actif', 'Actif'),
        ('inactif', 'Inactif')
    ])
    permis_conduire = StringField('Numéro de permis de conduire')
    vehicule = StringField('Véhicule (description)')
    type_vehicule_id = SelectField('Type de véhicule', coerce=optional_int, validators=[Optional()])
    notes = TextAreaField('Notes')
    submit = SubmitField('Enregistrer')

    def __init__(self, *args, **kwargs):
        super(UserForm, self).__init__(*args, **kwargs)
        # Définir les choix de rôles en fonction du rôle de l'utilisateur actuel
        if current_user.role == 'superadmin':
            self.role.choices = [
                ('transporteur', 'Transporteur'),
                ('commercial', 'Commercial'),
                ('admin', 'Admin'),
                ('superadmin', 'Super Admin')
            ]
        elif current_user.role == 'admin':
            self.role.choices = [
                ('transporteur', 'Transporteur'),
                ('commercial', 'Commercial'),
                ('admin', 'Admin')
            ]
        else:
            self.role.choices = [
                ('transporteur', 'Transporteur'),
                ('commercial', 'Commercial')
            ]

    def validate_password(self, field):
        if self.password.data and not self.confirm_password.data:
            self.confirm_password.errors.append('Veuillez confirmer le mot de passe')
            return False
        return True

class SearchClientForm(FlaskForm):
    query = StringField('Rechercher un client...')
    archives = BooleanField('Afficher les clients archivés')
    submit = SubmitField('Rechercher')

class SearchPrestationForm(FlaskForm):
    query = StringField('Rechercher une prestation (client, adresse, type...)')
    archives = BooleanField('Afficher les prestations archivées')
    submit = SubmitField('Rechercher')

class SearchFactureForm(FlaskForm):
    client_id = SelectField('Client', coerce=optional_int)
    statut = SelectField('Statut')
    date_debut = DateField('Date début')
    date_fin = DateField('Date fin')
    submit = SubmitField('Filtrer')
    reset = SubmitField('Réinitialiser')

class SearchUserForm(FlaskForm):
    query = StringField('Rechercher un utilisateur (nom, prénom, username)')
    role = SelectField('Rôle', choices=[])
    statut = SelectField('Statut', choices=[
        ('', 'Tous les statuts'),
        ('actif', 'Actif'),
        ('inactif', 'Inactif')
    ])
    submit = SubmitField('Rechercher')

    def __init__(self, *args, **kwargs):
        super(SearchUserForm, self).__init__(*args, **kwargs)
        # Définir les choix de rôles en fonction du rôle de l'utilisateur actuel
        base_choices = [('', 'Tous les rôles')]
        role_choices = [
            ('transporteur', 'Transporteur'),
            ('commercial', 'Commercial'),
            ('admin', 'Admin')
        ]
        
        if current_user.role == 'superadmin':
            role_choices.append(('superadmin', 'Super Admin'))
            
        self.role.choices = base_choices + role_choices

class StockageForm(FlaskForm):
    client_id = SelectField('Client', coerce=optional_int, validators=[DataRequired()])
    reference = StringField('Référence', validators=[DataRequired()])
    date_debut = DateField('Date de début', validators=[DataRequired()], default=datetime.now)
    date_fin = DateField('Date de fin (facultative)', validators=[Optional()])
    montant_mensuel = FloatField('Montant mensuel', validators=[DataRequired()])
    caution = FloatField('Caution', validators=[Optional()])
    emplacement = StringField('Emplacement', validators=[DataRequired()])
    volume_total = FloatField('Volume total (m³)', validators=[Optional()])
    poids_total = FloatField('Poids total (kg)', validators=[Optional()])
    statut = SelectField('Statut', choices=[
        ('Actif', 'Actif'),
        ('En attente', 'En attente'),
        ('Terminé', 'Terminé')
    ])
    observations = TextAreaField('Observations')
    submit = SubmitField('Enregistrer')

class ArticleStockageForm(FlaskForm):
    nom = StringField('Nom', validators=[DataRequired()])
    description = TextAreaField('Description')
    categorie = SelectField('Catégorie', choices=[
        ('Meubles', 'Meubles'),
        ('Cartons', 'Cartons'),
        ('Électroménager', 'Électroménager'),
        ('Vêtements', 'Vêtements'),
        ('Vaisselle', 'Vaisselle'),
        ('Matériel professionnel', 'Matériel professionnel'),
        ('Divers', 'Divers')
    ])
    dimensions = StringField('Dimensions (LxlxH cm)')
    volume = FloatField('Volume (m³)', validators=[Optional()])
    poids = FloatField('Poids (kg)', validators=[Optional()])
    valeur_declaree = FloatField('Valeur déclarée (€)', validators=[Optional()])
    code_barre = StringField('Code barre')
    photo = FileField('Photo')
    fragile = BooleanField('Article fragile')
    quantite = IntegerField('Quantité', default=1)
    submit = SubmitField('Ajouter cet article')

class SearchStockageForm(FlaskForm):
    # Utiliser optional_int pour gérer les valeurs vides et autres cas problématiques
    client_id = SelectField('Client', coerce=optional_int, validators=[Optional()])
    statut = SelectField('Statut')
    date_debut = DateField('Date début', validators=[Optional()])
    date_fin = DateField('Date fin', validators=[Optional()])
    reference = StringField('Référence')
    archives = BooleanField('Afficher les stockages archivés')
    submit = SubmitField('Filtrer')
    reset = SubmitField('Réinitialiser')

class DocumentForm(FlaskForm):
    """Formulaire pour l'ajout et la modification de documents"""
    nom = StringField('Nom du document', validators=[DataRequired()])
    fichier = FileField('Fichier', validators=[
        FileAllowed(['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'txt'], 
                    'Formats acceptés: PDF, images, documents Office, texte')])
    type = SelectField('Type de document', choices=[
        ('', 'Sélectionnez un type...'),
        ('contrat', 'Contrat'),
        ('facture', 'Facture'),
        ('devis', 'Devis'),
        ('identite', 'Pièce d\'identité'),
        ('justificatif', 'Justificatif de domicile'),
        ('assurance', 'Attestation d\'assurance'),
        ('photo', 'Photo'),
        ('autre', 'Autre')
    ])
    notes = TextAreaField('Notes')
    tags = StringField('Tags')
    client_id = SelectField('Client', coerce=int, validators=[Optional()])
    statut = SelectField('Statut', choices=[
        ('actif', 'Actif'),
        ('archive', 'Archivé')
    ], default='actif')
    submit = SubmitField('Enregistrer')
    categorie = SelectField('Catégorie', choices=[
        ('', 'Sélectionnez une catégorie...'),
        ('administratif', 'Administratif'),
        ('financier', 'Financier'),
        ('technique', 'Technique'),
        ('personnel', 'Personnel'),
        ('autre', 'Autre')
    ])
    tags = StringField('Tags (séparés par des virgules)')
    notes = TextAreaField('Notes sur le document')
    submit = SubmitField('Enregistrer le document')

class SearchDocumentForm(FlaskForm):
    """Formulaire pour la recherche de documents"""
    query = StringField('Rechercher un document (nom, type, notes...)')
    client_id = SelectField('Client', coerce=optional_int, validators=[Optional()])
    type = SelectField('Type', choices=[
        ('', 'Tous les types'),
        ('contrat', 'Contrat'),
        ('facture', 'Facture'),
        ('devis', 'Devis'),
        ('identite', 'Pièce d\'identité'),
        ('justificatif', 'Justificatif de domicile'),
        ('assurance', 'Attestation d\'assurance'),
        ('photo', 'Photo'),
        ('autre', 'Autre')
    ], validators=[Optional()])
    categorie = SelectField('Catégorie', choices=[
        ('', 'Toutes les catégories'),
        ('administratif', 'Administratif'),
        ('financier', 'Financier'),
        ('technique', 'Technique'),
        ('personnel', 'Personnel'),
        ('autre', 'Autre')
    ], validators=[Optional()])
    date_debut = DateField('Uploadé entre', validators=[Optional()])
    date_fin = DateField('et', validators=[Optional()])
    submit = SubmitField('Rechercher')
class AgendaForm(FlaskForm):
    nom = StringField('Nom', validators=[DataRequired()])
    type_agenda = SelectField('Type d\'agenda', choices=[
        ('vehicule', 'Véhicule'),
        ('entreprise', 'Entreprise'),
        ('equipe', 'Équipe'),
        ('partenaire', 'Partenaire'),
        ('client-vip', 'Client VIP'),
        ('maintenance', 'Maintenance'),
        ('formation', 'Formation'),
        ('juridique', 'Juridique')
    ], validators=[DataRequired()], default='vehicule')
    couleur = StringField('Couleur', render_kw={"type": "color"}, default="#3498db")
    description = TextAreaField('Description')
    fichiers = FileField('Fichiers', render_kw={"multiple": True})
    observations = TextAreaField('Observations')
    tags = StringField('Tags')
    user_id = HiddenField('User ID', validators=[DataRequired()])
    submit = SubmitField('Créer')