from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

# Table d'association pour le partage d'agenda
agenda_partage = db.Table('agenda_partage',
    db.Column('agenda_id', db.Integer, db.ForeignKey('agenda.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('date_partage', db.DateTime, nullable=False, default=datetime.utcnow)
)

# Association tables
prestation_transporteurs = db.Table('prestation_transporteurs',
    db.Column('prestation_id', db.Integer, db.ForeignKey('prestation.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('statut', db.String(20), default='en_attente'),  # en_attente, accepte, refuse
    db.Column('date_reponse', db.DateTime, nullable=True),
    db.Column('commentaire', db.Text, nullable=True)
)

prestation_clients = db.Table('prestation_clients',
    db.Column('prestation_id', db.Integer, db.ForeignKey('prestation.id'), primary_key=True),
    db.Column('client_id', db.Integer, db.ForeignKey('client.id'), primary_key=True)
)

type_demenagement_vehicule = db.Table('type_demenagement_vehicule',
    db.Column('type_demenagement_id', db.Integer, db.ForeignKey('type_demenagement.id'), primary_key=True),
    db.Column('type_vehicule_id', db.Integer, db.ForeignKey('type_vehicule.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(64), nullable=False)
    prenom = db.Column(db.String(64), nullable=False)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='transporteur')
    statut = db.Column(db.String(20), nullable=False, default='actif')
    vehicule = db.Column(db.String(100), nullable=True)
    type_vehicule_id = db.Column(db.Integer, db.ForeignKey('type_vehicule.id'), nullable=True)
    permis_conduire = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    derniere_connexion = db.Column(db.DateTime, nullable=True)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    prestations = db.relationship('Prestation', secondary=prestation_transporteurs, back_populates='transporteurs')
    type_vehicule = db.relationship('TypeVehicule', backref='transporteurs')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role in ['admin', 'superadmin']
        
    def is_superadmin(self):
        return self.role == 'superadmin'

    def is_commercial(self):
        return self.role == 'commercial' or self.is_admin()

    def is_transporteur(self):
        return self.role == 'transporteur' or self.is_admin()
        
    def can_access_module(self, module_name):
        """Détermine si l'utilisateur peut accéder à un module spécifique"""
        # Le superadmin peut tout faire
        if self.role == 'superadmin':
            return True
            
        # L'admin peut tout faire sauf gérer les superadmins
        if self.role == 'admin':
            # L'admin ne peut pas créer/supprimer des superadmins
            if module_name == 'superadmin_management':
                return False
            return True
            
        # Le commercial a des accès limités
        if self.role == 'commercial':
            # Le commercial ne peut pas accéder à la gestion des utilisateurs
            # sauf pour créer des clients et les assigner avec des transporteurs
            if module_name == 'user_management':
                return False
            # Le commercial ne peut pas accéder à la gestion des stocks
            if module_name == 'stock_management':
                return False
            # Le commercial peut accéder aux autres modules
            return True
            
        # Le transporteur ne peut accéder qu'à son tableau de bord et ses notifications
        if self.role == 'transporteur':
            return module_name in ['dashboard', 'notifications', 'view_prestation']
            
        # Par défaut, refuser l'accès
        return False

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(64), nullable=False)
    prenom = db.Column(db.String(64), nullable=False)
    adresse = db.Column(db.Text, nullable=True)
    code_postal = db.Column(db.String(10), nullable=True)
    ville = db.Column(db.String(64), nullable=True)
    pays = db.Column(db.String(64), default='France')
    telephone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    type_client = db.Column(db.String(50), nullable=True)
    tags = db.Column(db.Text, nullable=True)
    observations = db.Column(db.Text, nullable=True)
    statut = db.Column(db.String(20), default='actif')
    archive = db.Column(db.Boolean, default=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    prestations_principales = db.relationship('Prestation', backref=db.backref('client_principal', lazy=True), lazy=True, foreign_keys="Prestation.client_id")
    prestations_supplementaires = db.relationship('Prestation', secondary=prestation_clients, back_populates='clients_supplementaires')
    factures = db.relationship('Facture', backref='client', lazy=True)

    def __repr__(self):
        return f"{self.nom} {self.prenom}"

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255), nullable=False)
    chemin = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=True)  # Type de document (facture, contrat, etc.)
    taille = db.Column(db.Integer, nullable=True)   # Taille en octets
    format = db.Column(db.String(20), nullable=True)  # Extension du fichier (pdf, jpg, etc.)
    notes = db.Column(db.Text, nullable=True)  # Notes sur le document
    observations_supplementaires = db.Column(db.Text, nullable=True)  # Observations supplémentaires (texte enrichi)
    tags = db.Column(db.String(200), nullable=True)  # Tags pour faciliter la recherche
    statut = db.Column(db.String(50), default='Actif')  # Actif, Archivé, Supprimé
    date_upload = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)  # Date de dernière modification
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'), nullable=True)
    evenement_id = db.Column(db.Integer, db.ForeignKey('evenement.id'), nullable=True)
    evenement = db.relationship('Evenement', backref=db.backref('documents', lazy=True))
    stockage_id = db.Column(db.Integer, db.ForeignKey('stockage.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Utilisateur qui a uploadé
    agenda_id = db.Column(db.Integer, db.ForeignKey('agenda.id'), nullable=True)  # Ajout de la relation avec Agenda

    stockage = db.relationship('Stockage', backref=db.backref('documents', lazy=True))
    user = db.relationship('User', backref=db.backref('documents_uploaded', lazy=True))
    prestation = db.relationship('Prestation', backref=db.backref('documents', lazy=True))
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=True)
    client = db.relationship('Client', backref=db.backref('documents', lazy=True), foreign_keys=[client_id])
    agenda = db.relationship('Agenda', backref=db.backref('documents', lazy=True))  # Relation avec Agenda

    def __repr__(self):
        return f"<Document {self.nom}>"

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'chemin': self.chemin,
            'type': self.type,
            'taille': self.taille,
            'format': self.format,
            'notes': self.notes,
            'statut': self.statut,
            'date_upload': self.date_upload.strftime('%d/%m/%Y %H:%M'),
            'prestation_id': self.prestation_id,
            'client_id': self.client_id,
            'stockage_id': self.stockage_id,
            'agenda_id': self.agenda_id
        }

class TypeVehicule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    capacite = db.Column(db.String(50), nullable=True)
    image = db.Column(db.String(255), nullable=True)

    types_demenagement = db.relationship('TypeDemenagement', secondary=type_demenagement_vehicule, 
                                        back_populates='types_vehicule')

    def __repr__(self):
        return f"<TypeVehicule {self.nom}>"

class TypeDemenagement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    types_vehicule = db.relationship('TypeVehicule', secondary=type_demenagement_vehicule, 
                                    back_populates='types_demenagement')

    def __repr__(self):
        return f"<TypeDemenagement {self.nom}>"

class Transporteur(db.Model):
    __tablename__ = 'transporteurs'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=True)
    telephone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    vehicule = db.Column(db.String(100), nullable=True)
    type_vehicule = db.Column(db.String(100), nullable=True)
    disponibilite = db.Column(db.String(255), nullable=True)  # Format JSON ou texte
    notes = db.Column(db.Text, nullable=True)
    statut = db.Column(db.String(20), default='actif')
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=True)

    prestations = db.relationship('Prestation', backref='transporteur_assigne', lazy=True, foreign_keys="Prestation.transporteur_id")

    def __repr__(self):
        return f"<Transporteur {self.nom} {self.prenom}>"

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'prenom': self.prenom,
            'telephone': self.telephone,
            'email': self.email,
            'vehicule': self.vehicule,
            'type_vehicule': self.type_vehicule
        }

class Vehicule(db.Model):
    __tablename__ = 'vehicules'
    id = db.Column(db.Integer, primary_key=True)
    marque = db.Column(db.String(50), nullable=False)
    modele = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # Fourgon, Camion, Semi-remorque, etc.
    annee = db.Column(db.Integer, nullable=True)
    immatriculation = db.Column(db.String(20), nullable=True)
    capacite = db.Column(db.String(50), nullable=True)
    statut = db.Column(db.String(20), default='actif')  # actif, en maintenance, hors service
    notes = db.Column(db.Text, nullable=True)
    transporteur_id = db.Column(db.Integer, db.ForeignKey('transporteurs.id'), nullable=True)

    transporteur = db.relationship('Transporteur', backref='vehicules', lazy=True, foreign_keys=[transporteur_id])
    prestations = db.relationship('Prestation', backref='vehicule_assigne', lazy=True, foreign_keys="Prestation.vehicule_id")

    def __repr__(self):
        return f"<Vehicule {self.marque} {self.modele}>"

    def to_dict(self):
        return {
            'id': self.id,
            'marque': self.marque,
            'modele': self.modele,
            'type': self.type,
            'immatriculation': self.immatriculation,
            'capacite': self.capacite
        }

class Prestation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    commercial_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    transporteur_id = db.Column(db.Integer, db.ForeignKey('transporteurs.id'), nullable=True)
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=True)

    client = db.relationship('Client', foreign_keys=[client_id], backref=db.backref('prestations', lazy=True))
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=False)
    adresse_depart = db.Column(db.Text, nullable=False)
    adresse_arrivee = db.Column(db.Text, nullable=False)
    type_demenagement = db.Column(db.String(100), nullable=False)
    type_demenagement_id = db.Column(db.Integer, db.ForeignKey('type_demenagement.id'), nullable=True)
    statut = db.Column(db.String(50), default='En attente')  # En attente, Confirmé, En cours, Terminé, Annulé
    priorite = db.Column(db.String(20), default='Normale')  # Basse, Normale, Haute, Urgente
    status_transporteur = db.Column(db.String(20), default='en_attente')  # en_attente, accepte, refuse
    raison_refus = db.Column(db.Text, nullable=True)  # Raison du refus par le transporteur
    date_reponse = db.Column(db.DateTime, nullable=True)  # Date de réponse du transporteur
    observations = db.Column(db.Text, nullable=True)
    archive = db.Column(db.Boolean, default=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, nullable=True)
    createur_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    modificateur_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    stockage_id = db.Column(db.Integer, db.ForeignKey('stockage.id'), nullable=True)
    mode_groupage = db.Column(db.Boolean, default=False)
    tags = db.Column(db.Text, nullable=True)
    societe = db.Column(db.String(100), nullable=True)
    montant = db.Column(db.Float, nullable=True, default=0)
    etapes_depart = db.Column(db.Text, nullable=True)  # Étapes supplémentaires de départ (format: adresse1||adresse2||...)
    etapes_arrivee = db.Column(db.Text, nullable=True)  # Étapes supplémentaires d'arrivée (format: adresse1||adresse2||...)
    
    commercial = db.relationship('User', foreign_keys=[commercial_id], backref='prestations_commercial')
    createur = db.relationship('User', foreign_keys=[createur_id], backref='prestations_creees')
    modificateur = db.relationship('User', foreign_keys=[modificateur_id], backref='prestations_modifiees')
    transporteurs = db.relationship('User', secondary=prestation_transporteurs, back_populates='prestations')
    clients_supplementaires = db.relationship('Client', secondary=prestation_clients, back_populates='prestations_supplementaires')
    type_demenagement_obj = db.relationship('TypeDemenagement', backref='prestations')
    versions = db.relationship('PrestationVersion', backref='prestation_courante', lazy=True, foreign_keys="PrestationVersion.prestation_id")

    def __repr__(self):
        return f"Prestation {self.id} - {self.client_principal.nom} {self.client_principal.prenom}"

    @property
    def est_groupage(self):
        """Retourne True si la prestation est de type groupage, False sinon"""
        return self.mode_groupage or self.type_demenagement == 'Groupage'

    # Retourne la liste des étapes de départ
    def get_etapes_depart(self):
        if not self.etapes_depart or not self.etapes_depart.strip():
            return []
        return [etape for etape in self.etapes_depart.split('||') if etape.strip()]
        
    # Retourne la liste des étapes d'arrivée
    def get_etapes_arrivee(self):
        if not self.etapes_arrivee or not self.etapes_arrivee.strip():
            return []
        return [etape for etape in self.etapes_arrivee.split('||') if etape.strip()]
        
    # Retourne True si la prestation a des étapes de départ, False sinon
    def has_etapes_depart(self):
        return bool(self.get_etapes_depart())
        
    # Retourne True si la prestation a des étapes d'arrivée, False sinon
    def has_etapes_arrivee(self):
        return bool(self.get_etapes_arrivee())
        
    # Retourne le nombre total d'étapes (départ + arrivée)
    def count_etapes(self):
        return len(self.get_etapes_depart()) + len(self.get_etapes_arrivee())

class Evenement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(255), nullable=False)
    type_evenement = db.Column(db.String(50), nullable=False)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=True)
    observations = db.Column(db.Text, nullable=True)
    archive = db.Column(db.Boolean, default=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    agenda_id = db.Column(db.Integer, db.ForeignKey('agenda.id'), nullable=False)
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'), nullable=True)
    version = db.Column(db.Integer, default=1)

    user = db.relationship('User', backref='evenements')
    agenda = db.relationship('Agenda', back_populates='evenements')
    prestation = db.relationship('Prestation', backref=db.backref('evenement', uselist=False))

    def __repr__(self):
        return f"<Evenement {self.titre}>"

    def to_dict(self):
        return {
            'id': self.id,
            'titre': self.titre,
            'type_evenement': self.type_evenement,
            'date_debut': self.date_debut.isoformat(),
            'date_fin': self.date_fin.isoformat() if self.date_fin else None,
            'observations': self.observations,
            'archive': self.archive,
            'user_id': self.user_id,
            'agenda_id': self.agenda_id,
            'prestation_id': self.prestation_id,
            'version': self.version
        }

class PrestationVersion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'), nullable=False)
    version = db.Column(db.Integer, nullable=False)
    donnees = db.Column(db.Text, nullable=False)  # JSON avec toutes les données de la prestation
    modifie_par = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    date_modification = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    modificateur = db.relationship('User', backref='versions_prestations')

    def __repr__(self):
        return f"Version {self.version} de Prestation {self.prestation_id}"

class Facture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(50), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'), nullable=True)
    stockage_id = db.Column(db.Integer, db.ForeignKey('stockage.id'), nullable=True)
    date_emission = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date_echeance = db.Column(db.DateTime, nullable=True)
    montant_ht = db.Column(db.Float, nullable=False)
    tva = db.Column(db.Float, nullable=False, default=20.0)
    montant_ttc = db.Column(db.Float, nullable=False)
    statut = db.Column(db.String(50), default='Non payée')  # Non payée, Payée, Annulée, Retard
    date_paiement = db.Column(db.DateTime, nullable=True)
    mode_paiement = db.Column(db.String(50), nullable=True)
    observations = db.Column(db.Text, nullable=True)
    commercial_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    commercial = db.relationship('User', foreign_keys=[commercial_id], backref='factures_creees')
    fichiers = db.relationship('FichierFacture', backref='facture', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"Facture {self.numero} - {self.client.nom} {self.client.prenom}"

class FichierFacture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    facture_id = db.Column(db.Integer, db.ForeignKey('facture.id'), nullable=False)
    nom_fichier = db.Column(db.String(255), nullable=False)
    chemin_fichier = db.Column(db.String(255), nullable=False)
    type_fichier = db.Column(db.String(50), nullable=False)
    date_upload = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f"<FichierFacture {self.nom_fichier}>"

class StockageArticle(db.Model):
    stockage_id = db.Column(db.Integer, db.ForeignKey('stockage.id'), primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('article_stockage.id'), primary_key=True)
    quantite = db.Column(db.Integer, default=1)
    date_ajout = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    stockage = db.relationship('Stockage', backref='stockage_articles')
    article = db.relationship('ArticleStockage', backref='stockage_articles')

    def __repr__(self):
        return f"<StockageArticle: {self.article.nom} ({self.quantite}) dans Stockage {self.stockage.reference}>"

class Stockage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    reference = db.Column(db.String(50), unique=True, nullable=False)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=True)  # Peut être indéfinie pour un stockage sans date de fin
    statut = db.Column(db.String(50), default='Actif')  # Actif, Terminé, En attente
    montant_mensuel = db.Column(db.Float, nullable=False)
    caution = db.Column(db.Float, nullable=True)
    emplacement = db.Column(db.String(100), nullable=False)  # Ex: "Zone A, Étagère 3, Case 12"
    volume_total = db.Column(db.Float, nullable=True)  # Volume total en m³
    poids_total = db.Column(db.Float, nullable=True)  # Poids total en kg
    observations = db.Column(db.Text, nullable=True)
    archive = db.Column(db.Boolean, default=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    client = db.relationship('Client', backref='stockages')
    factures = db.relationship('Facture', backref='stockage', lazy=True)
    prestations = db.relationship('Prestation', backref='stockage', lazy=True, foreign_keys="Prestation.stockage_id")

    def __repr__(self):
        return f"Stockage {self.reference} - {self.client.nom} {self.client.prenom}"

    def calculer_cout_total(self):
        """Calcule le coût total depuis le début du stockage jusqu'à maintenant ou la date de fin"""
        debut = self.date_debut
        fin = self.date_fin if self.date_fin else datetime.utcnow()

        # Calculer le nombre de mois de stockage
        mois = (fin.year - debut.year) * 12 + fin.month - debut.month
        if fin.day < debut.day:
            mois -= 1

        # Si moins d'un mois, compter comme un mois
        mois = max(1, mois)

        return self.montant_mensuel * mois

class ArticleStockage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    categorie = db.Column(db.String(50), nullable=True)  # Meubles, Cartons, Électroménager, etc.
    dimensions = db.Column(db.String(100), nullable=True)  # Format LxlxH en cm
    volume = db.Column(db.Float, nullable=True)  # En m³
    poids = db.Column(db.Float, nullable=True)  # En kg
    valeur_declaree = db.Column(db.Float, nullable=True)  # Valeur déclarée pour l'assurance
    code_barre = db.Column(db.String(100), nullable=True)  # Code barre pour le suivi
    photo = db.Column(db.String(255), nullable=True)  # Chemin vers la photo
    fragile = db.Column(db.Boolean, default=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f"<ArticleStockage {self.nom}>"

class Agenda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    type_agenda = db.Column(db.String(50), nullable=False)
    couleur = db.Column(db.String(7), nullable=False, default="#3498db")  # Format: #RRGGBB
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vehicule_id = db.Column(db.Integer, db.ForeignKey('vehicules.id'), nullable=True)
    observations = db.Column(db.JSON, nullable=True)  # Pour stocker plusieurs observations
    archive = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='agendas')
    vehicule = db.relationship('Vehicule', backref='agendas', lazy=True)
    evenements = db.relationship('Evenement', back_populates='agenda', lazy='dynamic')
    utilisateurs_partages = db.relationship('User',
        secondary=agenda_partage,
        backref=db.backref('agendas_partages', lazy='dynamic'),
        lazy='dynamic')

    def __repr__(self):
        return f"<Agenda {self.nom}>"

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'description': self.description,
            'type_agenda': self.type_agenda,
            'couleur': self.couleur,
            'user_id': self.user_id,
            'vehicule_id': self.vehicule_id,
            'observations': self.observations,
            'archive': self.archive
        }

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False, default='info')  # info, success, warning, danger
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    lu = db.Column(db.Boolean, default=False)
    statut = db.Column(db.String(50), nullable=False, default='non_lue')  # non_lue, lue, acceptee, refusee
    role_destinataire = db.Column(db.String(50), nullable=False)  # admin, commercial, transporteur
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Si destiné à un utilisateur spécifique
    prestation_id = db.Column(db.Integer, db.ForeignKey('prestation.id'), nullable=True)
    stockage_id = db.Column(db.Integer, db.ForeignKey('stockage.id'), nullable=True)

    user = db.relationship('User', backref='notifications')
    prestation = db.relationship('Prestation', backref='notifications')
    stockage = db.relationship('Stockage', backref='notifications')

    def __repr__(self):
        return f"<Notification {self.id}: {self.message[:30]}...>"

    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'type': self.type,
            'date_creation': self.date_creation.strftime('%d/%m/%Y %H:%M'),
            'lu': self.lu,
            'statut': self.statut,
            'role_destinataire': self.role_destinataire,
            'prestation_id': self.prestation_id,
            'stockage_id': self.stockage_id
        }

class EvenementVersion(db.Model):
    """Modèle pour stocker l'historique des versions d'un événement."""
    id = db.Column(db.Integer, primary_key=True)
    evenement_id = db.Column(db.Integer, db.ForeignKey('evenement.id'), nullable=False)
    version = db.Column(db.Integer, nullable=False)
    titre = db.Column(db.String(255), nullable=False)
    type_evenement = db.Column(db.String(50), nullable=False)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=True)
    observations = db.Column(db.Text, nullable=True)
    modifie_par = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_modification = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relations
    evenement = db.relationship('Evenement', backref=db.backref('versions', lazy=True, order_by='EvenementVersion.version.desc()'))
    modificateur = db.relationship('User', backref=db.backref('evenements_modifies', lazy=True))
    
    def __repr__(self):
        return f'<EvenementVersion {self.evenement_id}-v{self.version}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'evenement_id': self.evenement_id,
            'version': self.version,
            'titre': self.titre,
            'type_evenement': self.type_evenement,
            'date_debut': self.date_debut.strftime('%d/%m/%Y %H:%M'),
            'date_fin': self.date_fin.strftime('%d/%m/%Y %H:%M') if self.date_fin else None,
            'observations': self.observations,
            'modifie_par': self.modifie_par,
            'date_modification': self.date_modification.strftime('%d/%m/%Y %H:%M')
        }