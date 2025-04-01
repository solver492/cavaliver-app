from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, TextAreaField, SelectField, DateField, FileField, HiddenField, FloatField, FieldList, FormField, DateTimeField, SelectMultipleField, MultipleFileField
from wtforms.validators import DataRequired, Email, Length, EqualTo, Optional
from wtforms.fields import DateTimeLocalField
from datetime import datetime, date, time, timedelta
from sqlalchemy import func, or_, and_
# from weasyprint import HTML, CSS
from io import BytesIO
import os
# Suppression de l'import 'time' inutile qui crée un conflit

# Importer les formulaires nécessaires
from forms import LoginForm, UserForm, ClientForm, PrestationForm
from models import db, User, Client, Prestation, Document, Notification, Facture, LigneFacture, PrestationTransporter
from db_config import get_db_uri

app = Flask(__name__)
app.config['SECRET_KEY'] = 'votre_clef_secrete'
app.config['SQLALCHEMY_DATABASE_URI'] = get_db_uri()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            flash('Identifiants incorrects. Veuillez réessayer.', 'danger')
            return redirect(url_for('login'))
        
        login_user(user, remember=remember)
        return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/clients/<int:client_id>/documents/delete/<int:document_id>', methods=['GET'])
@login_required
def client_delete_document(client_id, document_id):
    document = Document.query.get_or_404(document_id)
    if document.client_id != client_id:
        flash('Ce document n\'appartient pas à ce client.', 'danger')
        return redirect(url_for('client_documents_list', id=client_id))
    
    try:
        # Supprimer le fichier physique
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], document.filename))
    except Exception as e:
        flash(f'Erreur lors de la suppression du fichier: {str(e)}', 'warning')
    
    # Supprimer l'entrée de la base de données
    db.session.delete(document)
    db.session.commit()
    
    flash('Document supprimé avec succès.', 'success')
    return redirect(url_for('client_documents_list', id=client_id))

# Routes pour le module de facturation
class FactureForm(FlaskForm):
    client_id = SelectField('Client', coerce=int, validators=[DataRequired()])
    prestation_id = SelectField('Prestation', coerce=int, validators=[DataRequired()], default='')
    numero = StringField('Numéro de facture', validators=[DataRequired()])
    date_emission = DateField('Date d\'émission', validators=[DataRequired()])
    date_echeance = DateField('Date d\'échéance', validators=[Optional()])
    statut = SelectField('Statut', choices=[
        ('en_attente', 'En attente'),
        ('payee', 'Payée'),
        ('retard', 'En retard'),
        ('annulee', 'Annulée')
    ], validators=[DataRequired()])
    mode_paiement = SelectField('Mode de paiement', choices=[
        ('', 'Sélectionnez un mode de paiement'),
        ('virement', 'Virement bancaire'),
        ('carte', 'Carte bancaire'),
        ('especes', 'Espèces'),
        ('cheque', 'Chèque')
    ], validators=[Optional()])
    date_paiement = DateField('Date de paiement', validators=[Optional()])
    montant_ht = FloatField('Montant HT', validators=[DataRequired()])
    taux_tva = FloatField('Taux de TVA (%)', default=20.0, validators=[DataRequired()])
    montant_ttc = FloatField('Montant TTC', validators=[DataRequired()])
    notes = TextAreaField('Notes', validators=[Optional()])

class LigneFactureForm(FlaskForm):
    description = StringField('Description', validators=[DataRequired()])
    quantite = FloatField('Quantité', default=1, validators=[DataRequired()])
    prix_unitaire = FloatField('Prix unitaire', validators=[DataRequired()])

class FactureWithLignesForm(FactureForm):
    lignes = FieldList(FormField(LigneFactureForm), min_entries=1)

@app.route('/factures')
@login_required
def factures_list():
    factures = Facture.query.order_by(Facture.date_creation.desc()).all()
    return render_template('factures/list.html', factures=factures, title="Liste des factures")

@app.route('/factures/add', methods=['GET', 'POST'])
@login_required
def facture_add():
    if current_user.role not in ['admin', 'super_admin', 'commercial']:
        flash('Vous n\'avez pas les permissions nécessaires pour créer une facture.', 'danger')
        return redirect(url_for('dashboard'))
    
    clients = Client.query.filter_by(archived=False).order_by(Client.nom).all()
    current_date = datetime.now()
    
    # Générer le prochain numéro de facture
    last_facture = Facture.query.order_by(Facture.id.desc()).first()
    next_number = str(int(last_facture.numero.split('-')[-1]) + 1).zfill(3) if last_facture else '001'
    
    if request.method == 'POST':
        client_id = request.form.get('client_id')
        prestation_id = request.form.get('prestation_id')
        tva = float(request.form.get('tva', 20.0))
        
        if not client_id or not prestation_id:
            flash('Veuillez sélectionner un client et une prestation.', 'danger')
            return render_template('factures/add.html', 
                                 title='Ajouter une facture',
                                 clients=clients,
                                 current_date=current_date,
                                 next_invoice_number=next_number,
                                 timedelta=timedelta)
        
        # Récupérer la prestation pour obtenir le montant
        prestation = Prestation.query.get(prestation_id)
        montant_ht = prestation.montant or 0
        montant_ttc = montant_ht * (1 + tva / 100)
        
        # Créer la facture en utilisant le modèle existant
        facture = Facture(
            numero=f"FAC-{current_date.strftime('%Y%m%d')}-{next_number}",
            client_id=client_id,
            prestation_id=prestation_id,
            montant_ht=montant_ht,
            taux_tva=tva,
            montant_ttc=montant_ttc,
            date_emission=datetime.strptime(request.form.get('date_emission'), '%Y-%m-%d'),
            date_echeance=datetime.strptime(request.form.get('date_echeance'), '%Y-%m-%d'),
            statut=request.form.get('statut'),
            mode_paiement=request.form.get('mode_paiement'),
            notes=request.form.get('notes'),
            created_by_id=current_user.id
        )
        
        try:
            db.session.add(facture)
            db.session.commit()
            flash('Facture créée avec succès!', 'success')
            return redirect(url_for('factures_list'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la création de la facture: {str(e)}', 'danger')
    
    return render_template('factures/add.html',
                         title='Ajouter une facture',
                         clients=clients,
                         current_date=current_date,
                         next_invoice_number=next_number,
                         timedelta=timedelta)

@app.route('/factures/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def facture_edit(id):
    facture = Facture.query.get_or_404(id)
    
    if request.method == 'GET':
        form = FactureWithLignesForm(obj=facture)
        # Ajouter les lignes existantes
        form.lignes = []
        for ligne in facture.lignes:
            ligne_form = LigneFactureForm(
                description=ligne.description,
                quantite=ligne.quantite,
                prix_unitaire=ligne.prix_unitaire
            )
            form.lignes.append_entry(ligne_form.data)
    else:
        form = FactureWithLignesForm()
    
    # Remplir les choix pour les clients
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in Client.query.order_by(Client.nom).all()]
    
    # Remplir les choix pour les prestations
    prestations = Prestation.query.filter_by(client_id=facture.client_id).all()
    form.prestation_id.choices = [(p.id, f"{p.adresse_depart} → {p.adresse_arrivee}") for p in prestations]
    
    if form.validate_on_submit():
        # Mettre à jour la facture
        facture.numero = form.numero.data
        facture.client_id = form.client_id.data
        facture.prestation_id = form.prestation_id.data
        facture.date_emission = form.date_emission.data
        facture.date_echeance = form.date_echeance.data
        facture.statut = form.statut.data
        facture.mode_paiement = form.mode_paiement.data
        facture.date_paiement = form.date_paiement.data if form.statut.data == 'payee' else None
        facture.montant_ht = form.montant_ht.data
        facture.taux_tva = form.taux_tva.data
        facture.montant_ttc = form.montant_ttc.data
        facture.notes = form.notes.data
        
        # Supprimer les anciennes lignes
        for ligne in facture.lignes:
            db.session.delete(ligne)
        
        # Ajouter les nouvelles lignes
        for ligne_data in request.form.getlist('lignes-description[]'):
            index = request.form.getlist('lignes-description[]').index(ligne_data)
            quantite = float(request.form.getlist('lignes-quantite[]')[index])
            prix_unitaire = float(request.form.getlist('lignes-prix_unitaire[]')[index])
            
            ligne = LigneFacture(
                facture_id=facture.id,
                description=ligne_data,
                quantite=quantite,
                prix_unitaire=prix_unitaire,
                montant=quantite * prix_unitaire
            )
            db.session.add(ligne)
        
        db.session.commit()
        
        flash(f'Facture {facture.numero} mise à jour avec succès', 'success')
        return redirect(url_for('facture_details', id=facture.id))
    
    return render_template('factures/form.html', form=form, facture=facture)

@app.route('/factures/details/<int:id>')
@login_required
def facture_details(id):
    facture = Facture.query.get_or_404(id)
    today = datetime.utcnow().date()
    return render_template('factures/details.html', facture=facture, today=today)

@app.route('/factures/pdf/<int:id>')
@login_required
def facture_pdf(id):
    facture = Facture.query.get_or_404(id)
    
    # Générer le HTML de la facture dans une version imprimable
    return render_template('factures/pdf_template.html', facture=facture, print_view=True)

@app.route('/factures/marquer-payee/<int:id>')
@login_required
def facture_marquer_payee(id):
    facture = Facture.query.get_or_404(id)
    
    if facture.statut == 'annulee':
        flash('Impossible de marquer comme payée une facture annulée', 'danger')
    else:
        facture.statut = 'payee'
        facture.date_paiement = datetime.utcnow()
        db.session.commit()
        
        # Créer une notification
        notification = Notification(
            user_id=current_user.id,
            message=f"Facture {facture.numero} marquée comme payée",
            type='success',
            related_prestation_id=facture.prestation_id
        )
        db.session.add(notification)
        db.session.commit()
        
        flash('Facture marquée comme payée avec succès', 'success')
    
    return redirect(url_for('facture_details', id=facture.id))

@app.route('/factures/annuler/<int:id>')
@login_required
def facture_annuler(id):
    facture = Facture.query.get_or_404(id)
    facture.statut = 'annulee'
    db.session.commit()
    
    # Créer une notification
    notification = Notification(
        user_id=current_user.id,
        message=f"Facture {facture.numero} annulée",
        type='warning',
        related_prestation_id=facture.prestation_id
    )
    db.session.add(notification)
    db.session.commit()
    
    flash('Facture annulée avec succès', 'success')
    return redirect(url_for('facture_details', id=facture.id))

@app.route('/factures/envoyer-email/<int:id>')
@login_required
def facture_envoyer_email(id):
    facture = Facture.query.get_or_404(id)
    
    # Cette fonction est un exemple et devrait être adaptée pour envoyer réellement un email
    # avec la facture en pièce jointe
    
    flash(f'Fonctionnalité d\'envoi d\'email non implémentée. La facture serait envoyée à {facture.client.email}', 'info')
    return redirect(url_for('facture_details', id=facture.id))

@app.route('/api/prestations-by-client', methods=['GET'])
@login_required
def get_prestations_by_client():
    client_id = request.args.get('client_id', type=int)
    if not client_id:
        return jsonify({'error': 'Client ID is required'}), 400
    
    prestations = Prestation.query.filter_by(client_id=client_id).all()
    prestations_data = [
        {
            'id': p.id,
            'adresse_depart': p.adresse_depart,
            'adresse_arrivee': p.adresse_arrivee,
            'date_debut': p.date_debut.strftime('%d/%m/%Y') if p.date_debut else None
        }
        for p in prestations
    ]
    
    return jsonify({'prestations': prestations_data})

@app.route('/prestations')
@login_required
def prestations_list():
    # Option pour afficher ou non les prestations archivées
    show_archived = request.args.get('show_archived', 'false') == 'true'
    
    # Filtre de recherche
    search_query = request.args.get('q', '')
    
    query = Prestation.query
    
    # Filtrer selon le statut d'archivage
    if not show_archived:
        query = query.filter_by(archived=False)
    
    # Filtrer selon la recherche
    if search_query:
        search = f"%{search_query}%"
        # Joindre avec la table client pour faire la recherche sur les noms des clients
        query = query.join(Client).filter(or_(
            Client.nom.ilike(search),
            Client.prenom.ilike(search),
            Prestation.adresse_depart.ilike(search),
            Prestation.adresse_arrivee.ilike(search),
            Prestation.demenagement_type.ilike(search),
            Prestation.statut.ilike(search),
            Prestation.observation.ilike(search)
        ))
    
    # Afficher d'abord les prestations non archivées, puis par date de début
    prestations = query.order_by(Prestation.archived, Prestation.date_debut.desc()).all()
    
    return render_template('prestations/list.html', 
                          prestations=prestations,
                          show_archived=show_archived,
                          search_query=search_query)

@app.route('/prestations/<int:id>')
@login_required
def prestation_details(id):
    prestation = Prestation.query.get_or_404(id)
    
    # Récupérer les transporteurs assignés à cette prestation
    transporters = User.query.join(PrestationTransporter).filter(
        PrestationTransporter.prestation_id == id,
        User.role == 'transporteur'
    ).all()
    
    return render_template('prestations/details.html', prestation=prestation, transporters=transporters)

@app.route('/prestations/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def prestation_edit(id):
    prestation = Prestation.query.get_or_404(id)
    form = PrestationForm()
    
    # Pré-remplir les choix pour les clients
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in Client.query.order_by(Client.nom).all()]
    
    # Pré-remplir les choix pour les transporteurs
    transporters = User.query.filter(
        User.role == 'transporteur',
        User.statut == 'actif'
    ).order_by(User.nom).all()
    
    # Filtrer les transporteurs disponibles (qui ne sont pas déjà assignés à d'autres prestations en cours)
    # Pour l'instant, nous affichons tous les transporteurs - la logique de disponibilité sera ajoutée plus tard
    available_transporters = []
    for transporter in transporters:
        # Vérifier si le transporteur a des prestations confirmées qui se chevauchent
        # Cette logique peut être étendue en fonction des besoins spécifiques
        available_transporters.append(transporter)
    
    form.transporteur_ids.choices = [(t.id, f"{t.nom} {t.prenom}") for t in available_transporters]
    
    # Récupérer les suggestions d'adresses des prestations existantes
    try:
        adresses_depart = db.session.query(Prestation.adresse_depart).distinct().all()
        adresses_arrivee = db.session.query(Prestation.adresse_arrivee).distinct().all()
        
        # Essayer d'obtenir les trajets également, mais gérer l'erreur si les colonnes n'existent pas
        try:
            points_depart = db.session.query(Prestation.trajet_depart).filter(Prestation.trajet_depart != None, Prestation.trajet_depart != '').distinct().all()
            destinations = db.session.query(Prestation.trajet_destination).filter(Prestation.trajet_destination != None, Prestation.trajet_destination != '').distinct().all()
        except Exception as e:
            print(f"Erreur lors de la récupération des trajets (normal si colonnes manquantes): {e}")
            points_depart = []
            destinations = []
    except Exception as e:
        print(f"Erreur lors de la récupération des adresses: {e}")
        adresses_depart = []
        adresses_arrivee = []
        points_depart = []
        destinations = []
    
    # Convertir les résultats en listes plates
    suggestions_depart = [addr[0] for addr in adresses_depart if addr[0]]
    suggestions_arrivee = [addr[0] for addr in adresses_arrivee if addr[0]]
    suggestions_points = [point[0] for point in points_depart if point[0]]
    suggestions_destinations = [dest[0] for dest in destinations if dest[0]]
    
    # Ajouter quelques villes françaises pour les suggestions initiales
    villes_francaises = ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", 
                         "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Caen", "Rouen", "Amiens", "Metz"]
    
    # Fusionner avec les villes françaises et éliminer les doublons
    suggestions_points.extend(villes_francaises)
    suggestions_destinations.extend(villes_francaises)
    suggestions_points = list(set(suggestions_points))
    suggestions_destinations = list(set(suggestions_destinations))
    
    if form.validate_on_submit():
        # Mettre à jour la prestation existante
        prestation.client_id = form.client_id.data
        prestation.date_debut = form.date_debut.data
        prestation.date_fin = form.date_fin.data
        prestation.adresse_depart = form.adresse_depart.data
        prestation.adresse_arrivee = form.adresse_arrivee.data
        
        # Essayer d'assigner les champs trajet_depart et trajet_destination si disponibles
        try:
            prestation.trajet_depart = form.trajet_depart.data
            prestation.trajet_destination = form.trajet_destination.data
        except Exception as e:
            print(f"Impossible d'assigner les trajets: {e}")
            # Si les colonnes n'existent pas, stocker les valeurs dans les champs adresse
            if form.trajet_depart.data and form.trajet_depart.data != prestation.adresse_depart:
                prestation.adresse_depart = form.trajet_depart.data
            if form.trajet_destination.data and form.trajet_destination.data != prestation.adresse_arrivee:
                prestation.adresse_arrivee = form.trajet_destination.data
        
        prestation.observation = form.observation.data
        prestation.statut = form.statut.data
        # Ne plus utiliser les colonnes manquantes
        # prestation.demenagement_type = form.demenagement_type.data
        # prestation.camion_type = form.camion_type.data
        prestation.societe = form.societe.data
        prestation.montant = form.montant.data
        # prestation.priorite = form.priorite.data
        prestation.tags = form.tags.data
        
        # Enregistrer les modifications de la prestation
        db.session.commit()
        
        # Gérer les transporteurs assignés
        if form.transporteur_ids.data:
            # Obtenir la liste des nouveaux transporteurs
            new_transporters = form.transporteur_ids.data
            
            # Supprimer les assignations existantes des transporteurs qui ne sont plus assignés
            PrestationTransporter.query.filter(
                PrestationTransporter.prestation_id == prestation.id,
                ~PrestationTransporter.transporter_id.in_(new_transporters)
            ).delete(synchronize_session=False)
            
            # Ajouter les nouveaux transporteurs et créer des notifications
            for transporter_id in new_transporters:
                # Vérifier si ce transporteur est déjà assigné
                existing_assignment = PrestationTransporter.query.filter_by(
                    prestation_id=prestation.id, 
                    transporter_id=transporter_id
                ).first()
                
                if not existing_assignment:
                    # Créer une nouvelle assignation
                    pt = PrestationTransporter(
                        prestation_id=prestation.id, 
                        transporter_id=transporter_id,
                        statut='en_attente'
                    )
                    db.session.add(pt)
                    
                    # Créer une notification pour ce transporteur
                    notification_transporteur = Notification(
                        user_id=transporter_id,
                        type='info',
                        message=f"Vous avez été assigné à une prestation (#{prestation.id}): {prestation.adresse_depart} → {prestation.adresse_arrivee}",
                        is_read=False,
                        related_prestation_id=prestation.id
                    )
                    db.session.add(notification_transporteur)
            
            # Enregistrer les modifications
            db.session.commit()
        else:
            # Si aucun transporteur n'est sélectionné, supprimer toutes les assignations pour cette prestation
            PrestationTransporter.query.filter_by(prestation_id=prestation.id).delete()
            db.session.commit()
        
        flash('Prestation mise à jour avec succès!', 'success')
        return redirect(url_for('prestation_details', id=prestation.id))
    
    return render_template('prestations/form.html', form=form, 
                          title='Éditer une prestation',
                          suggestions_depart=suggestions_depart,
                          suggestions_arrivee=suggestions_arrivee,
                          suggestions_points=suggestions_points,
                          suggestions_destinations=suggestions_destinations,
                          prestation=prestation)

@app.route('/prestations/<int:id>/mission')
@login_required
def generate_mission(id):
    prestation = Prestation.query.get_or_404(id)
    
    # Générer une fiche de mission au format HTML
    rendered_template = render_template('prestations/mission.html', prestation=prestation)
    
    # Convertir en PDF (commenté car weasyprint n'est peut-être pas installé)
    # pdf = HTML(string=rendered_template).write_pdf()
    # buffer = BytesIO(pdf)
    # buffer.seek(0)
    # return send_file(buffer, download_name=f"mission_{prestation.id}.pdf", as_attachment=True, mimetype='application/pdf')
    
    # Pour le moment, retourner juste le HTML
    return rendered_template

@app.route('/clients')
@login_required
def clients_list():
    # Vérifier si l'utilisateur a le droit d'accéder au module clients
    if current_user.role == 'transporteur':
        flash('Vous n\'avez pas les permissions nécessaires pour accéder au module clients.', 'danger')
        return redirect(url_for('dashboard'))
    
    # Option pour afficher ou non les clients archivés
    show_archived = request.args.get('show_archived', 'false') == 'true'
    
    # Filtre de recherche
    search_query = request.args.get('q', '')
    
    query = Client.query
    
    # Filtrer selon le statut d'archivage
    if not show_archived:
        query = query.filter_by(archived=False)
    
    # Filtrer selon la recherche
    if search_query:
        search = f"%{search_query}%"
        query = query.filter(or_(
            Client.nom.ilike(search),
            Client.prenom.ilike(search),
            Client.email.ilike(search),
            Client.telephone.ilike(search),
            Client.adresse.ilike(search)
        ))
    
    # Trier par nom
    clients = query.order_by(Client.nom).all()
    
    return render_template('clients/list.html', 
                          clients=clients, 
                          show_archived=show_archived,
                          search_query=search_query)

@app.route('/users')
@login_required
def users_list():
    # Vérifier si l'utilisateur est admin ou super_admin
    if current_user.role not in ['admin', 'super_admin', 'commercial']:
        flash('Vous n\'avez pas les permissions nécessaires pour accéder à cette page.', 'danger')
        return redirect(url_for('dashboard'))
    
    # Récupérer les paramètres de recherche
    search_query = request.args.get('q', '')
    role_filter = request.args.get('role', '')
    statut_filter = request.args.get('statut', '')
    
    # Construire la requête de base
    query = User.query
    
    # Appliquer le filtre de recherche
    if search_query:
        search = f"%{search_query}%"
        query = query.filter(or_(
            User.nom.ilike(search),
            User.prenom.ilike(search),
            User.username.ilike(search),
            User.email.ilike(search)
        ))
    
    # Appliquer le filtre par rôle
    if role_filter:
        query = query.filter(User.role == role_filter)
    
    # Appliquer le filtre par statut
    if statut_filter:
        query = query.filter(User.statut == statut_filter)
    
    # Récupérer les utilisateurs
    users = query.order_by(User.nom).all()
    
    return render_template('users/list.html', 
                          users=users,
                          search_query=search_query, 
                          role_filter=role_filter,
                          statut_filter=statut_filter)

@app.route('/notifications')
@login_required
def notifications():
    # Récupérer toutes les notifications non lues de l'utilisateur
    notifications = Notification.query.filter_by(user_id=current_user.id, is_read=False).order_by(Notification.date_creation.desc()).all()
    
    return render_template('notifications.html', notifications=notifications)

@app.route('/notifications/mark-read/<int:id>')
@login_required
def mark_notification_read(id):
    # Récupérer la notification
    notification = Notification.query.get_or_404(id)
    
    # Vérifier que l'utilisateur actuel est bien le destinataire de la notification
    if notification.user_id != current_user.id:
        flash('Vous n\'êtes pas autorisé à accéder à cette notification.', 'danger')
        return redirect(url_for('notifications'))
    
    # Marquer la notification comme lue
    notification.is_read = True
    db.session.commit()
    
    flash('Notification marquée comme lue', 'success')
    return redirect(url_for('notifications'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Récupérer le nombre d'opérations en attente
    today = datetime.utcnow().date()
    
    # Récupérer les prestations à venir sans essayer d'accéder aux colonnes problématiques
    prestations_a_venir = []
    try:
        # Utiliser une sélection explicite de colonnes pour éviter les colonnes inexistantes
        prestations_a_venir = db.session.query(
            Prestation.id,
            Prestation.client_id,
            Prestation.date_debut,
            Prestation.date_fin,
            Prestation.adresse_depart,
            Prestation.adresse_arrivee,
            Prestation.observation,
            Prestation.statut,
            # Ne plus sélectionner les colonnes manquantes
            # Prestation.demenagement_type,
            # Prestation.camion_type,
            Prestation.societe,
            Prestation.montant,
            Prestation.tags,
            Prestation.created_by_id,
            Prestation.id_user_commercial,
            Prestation.planning_id,
            Prestation.date_creation,
            Prestation.archived
        ).filter(Prestation.date_debut >= today).order_by(Prestation.date_debut).limit(5).all()
    except Exception as e:
        print(f"Erreur lors de la récupération des prestations: {e}")
        # En cas d'erreur, utiliser une requête plus simple qui ne fait pas référence à des colonnes spécifiques
        prestations_a_venir = []
        try:
            # Tenter avec une requête minimale pour récupérer juste les objets sans filtrer par colonnes
            prestations_a_venir = db.session.query(Prestation).filter(Prestation.date_debut >= today).order_by(Prestation.date_debut).limit(5).all()
        except Exception as e2:
            print(f"Erreur lors de la tentative alternative: {e2}")
            # En cas d'échec total, renvoyer une liste vide
            prestations_a_venir = []
    
    # Récupérer les factures en attente - Gérer l'absence de la table facture
    factures_en_attente = []
    try:
        factures_en_attente = Facture.query.filter_by(statut='en_attente').order_by(Facture.date_emission.desc()).limit(5).all()
    except Exception as e:
        print(f"Erreur lors de la récupération des factures: {e}")
        # Si la table n'existe pas, on continue avec une liste vide
        factures_en_attente = []
    
    # Récupérer les factures en retard
    factures_en_retard = []
    try:
        factures_en_retard = Facture.query.filter_by(statut='retard').order_by(Facture.date_emission).limit(5).all()
    except Exception as e:
        print(f"Erreur lors de la récupération des factures en retard: {e}")
        # Si la table n'existe pas, on continue avec une liste vide
        factures_en_retard = []
    
    # Calculer les statistiques
    try:
        total_clients = Client.query.count()
    except Exception as e:
        print(f"Erreur lors du comptage des clients: {e}")
        # Utiliser une requête plus basique qui évite les colonnes manquantes
        try:
            total_clients = db.session.query(func.count(Client.id)).scalar() or 0
        except Exception as e2:
            print(f"Erreur lors du comptage alternatif des clients: {e2}")
            total_clients = 0
    
    try:
        total_prestations = Prestation.query.count()
    except Exception as e:
        print(f"Erreur lors du comptage des prestations: {e}")
        # Utiliser une requête plus basique qui évite les colonnes manquantes
        try:
            total_prestations = db.session.query(func.count(Prestation.id)).scalar() or 0
        except Exception as e2:
            print(f"Erreur lors du comptage alternatif des prestations: {e2}")
            total_prestations = 0
    
    # Gérer l'absence de la table facture
    try:
        total_factures = Facture.query.count()
    except Exception as e:
        print(f"Erreur lors du comptage des factures: {e}")
        total_factures = 0
    
    # Calculer le chiffre d'affaires
    ca_total = db.session.query(func.sum(Facture.montant_ttc)).filter(Facture.statut == 'payee').scalar() or 0
    
    # Calculer le montant des factures impayées
    montant_impaye = db.session.query(func.sum(Facture.montant_ttc)).filter(Facture.statut.in_(['en_attente', 'retard'])).scalar() or 0
    
    # Récupérer les notifications non lues
    notifications = Notification.query.filter_by(user_id=current_user.id, is_read=False).order_by(Notification.date_creation.desc()).limit(5).all()
    
    return render_template('dashboard.html', 
                           prestations_a_venir=prestations_a_venir,
                           factures_en_attente=factures_en_attente,
                           factures_en_retard=factures_en_retard,
                           total_clients=total_clients,
                           total_prestations=total_prestations,
                           total_factures=total_factures,
                           ca_total=ca_total,
                           montant_impaye=montant_impaye,
                           notifications=notifications)

class ClientForm(FlaskForm):
    nom = StringField('Nom', validators=[DataRequired()])
    prenom = StringField('Prénom', validators=[DataRequired()])
    email = StringField('Email', validators=[Optional(), Email()])
    telephone = StringField('Téléphone', validators=[Optional()])
    adresse = TextAreaField('Adresse', validators=[Optional()])
    # Champ retiré car la colonne client_type n'existe pas dans la base de données
    # client_type = SelectField('Type de client', choices=[('particulier', 'Particulier'), ('entreprise', 'Entreprise')], default='particulier')
    tags = StringField('Tags (séparés par des virgules)', validators=[Optional()])
    documents = MultipleFileField('Documents', validators=[Optional()])

@app.route('/clients/add', methods=['GET', 'POST'])
@login_required
def client_add():
    # Vérifier si l'utilisateur est au moins un admin
    if current_user.role == 'transporteur':
        flash('Vous n\'avez pas les droits pour ajouter un client. Cette action est réservée aux administrateurs.', 'danger')
        return redirect(url_for('clients_list'))
    
    form = ClientForm()
    
    if form.validate_on_submit():
        client = Client(
            nom=form.nom.data,
            prenom=form.prenom.data,
            email=form.email.data,
            telephone=form.telephone.data,
            adresse=form.adresse.data,
            # client_type=form.client_type.data,
            tags=form.tags.data,
            created_by_id=current_user.id
        )
        db.session.add(client)
        db.session.commit()
        
        # Gérer les documents téléchargés
        if form.documents.data and form.documents.data[0].filename:
            for uploaded_file in form.documents.data:
                if uploaded_file.filename:
                    filename = secure_filename(uploaded_file.filename)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    uploaded_file.save(file_path)
                    
                    document = Document(
                        filename=filename,
                        original_filename=uploaded_file.filename,
                        file_type=os.path.splitext(filename)[1].strip('.').lower(),
                        document_type='autre',
                        description=f"Document pour {client.nom} {client.prenom}",
                        client_id=client.id,
                        created_by_id=current_user.id
                    )
                    db.session.add(document)
            
            db.session.commit()
        
        flash('Client ajouté avec succès!', 'success')
        return redirect(url_for('clients_list'))
    
    return render_template('clients/form.html', form=form, title='Ajouter un client')

class PrestationForm(FlaskForm):
    client_id = SelectField('Client', coerce=int, validators=[DataRequired()])
    date_debut = DateTimeLocalField('Date de début', format='%Y-%m-%dT%H:%M', validators=[DataRequired()])
    date_fin = DateTimeLocalField('Date de fin', format='%Y-%m-%dT%H:%M', validators=[DataRequired()])
    adresse_depart = TextAreaField('Adresse de départ', validators=[DataRequired()])
    adresse_arrivee = TextAreaField('Adresse d\'arrivée', validators=[DataRequired()])
    observation = TextAreaField('Observations', validators=[Optional()])
    statut = SelectField('Statut', choices=[
        ('en_attente', 'En attente'), 
        ('en_cours', 'En cours'), 
        ('todo', 'À faire'), 
        ('done', 'Terminé'), 
        ('mod', 'Modifié'),
        ('canceled', 'Annulé')
    ], default='en_attente')
    # Ne plus utiliser les colonnes manquantes
    # demenagement_type = SelectField('Type de déménagement', choices=[
    #     ('residence', 'Déménagement Résidentiel'),
    #     ('entreprise', 'Déménagement d\'Entreprise'),
    #     ('industriel', 'Transport d\'Équipements Industriels'),
    #     ('partiel', 'Déménagement Partiel'),
    #     ('total', 'Déménagement Total')
    # ], validators=[Optional()])
    societe = SelectField('Société', choices=[
        ('NASSALI RAFIK', 'NASSALI RAFIK - Déménagement'),
        ('Écuyer', 'Écuyer - Déménagement'),
        ('Cavalier', 'Cavalier - Déménagement')
    ], validators=[Optional()])
    montant = FloatField('Montant', validators=[Optional()])
    # Suppression du champ priorite qui est absent sur Render
    # priorite = SelectField('Priorité', choices=[
    #     ('basse', 'Basse'),
    #     ('normale', 'Normale'),
    #     ('haute', 'Haute'),
    #     ('urgente', 'Urgente')
    # ], default='normale')
    transporteur_ids = SelectMultipleField('Transporteurs', coerce=int, validators=[Optional()])
    # Suppression des champs trajet_depart et trajet_destination qui sont absents sur Render
    # trajet_depart = StringField('Point de départ', validators=[Optional()])
    # trajet_destination = StringField('Destination', validators=[Optional()])
    # Ne plus utiliser les colonnes manquantes
    # camion_type = SelectField('Type de camion', choices=[
    #     ('fourgon_12', 'Fourgon 12m³'),
    #     ('caisse_20', 'Camion Caisse 20m³ avec Hayon'),
    #     ('camion_5t', 'Camion 5 Tonnes (30-40m³)'),
    #     ('camion_10t', 'Camion 10 Tonnes (50m³)'),
    #     ('semi', 'Semi-Remorque (80-100m³)')
    # ], default='fourgon_12', validators=[Optional()])
    tags = StringField('Tags', validators=[Optional()])

@app.route('/prestations/add', methods=['GET', 'POST'])
@login_required
def prestation_add():
    form = PrestationForm()
    
    # Remplir les choix pour les clients
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in Client.query.order_by(Client.nom).all()]
    
    # Récupérer uniquement les transporteurs (pas d'admin ni de commercial)
    transporters = User.query.filter(
        User.role == 'transporteur',
        User.statut == 'actif'
    ).order_by(User.nom).all()
    
    # Filtrer les transporteurs disponibles (qui ne sont pas déjà assignés à d'autres prestations en cours)
    # Pour l'instant, nous affichons tous les transporteurs - la logique de disponibilité sera ajoutée plus tard
    available_transporters = []
    for transporter in transporters:
        # Vérifier si le transporteur a des prestations confirmées qui se chevauchent
        # Cette logique peut être étendue en fonction des besoins spécifiques
        available_transporters.append(transporter)
    
    form.transporteur_ids.choices = [(t.id, f"{t.nom} {t.prenom}") for t in available_transporters]
    
    # Récupérer les suggestions d'adresses des prestations existantes
    try:
        adresses_depart = db.session.query(Prestation.adresse_depart).distinct().all()
        adresses_arrivee = db.session.query(Prestation.adresse_arrivee).distinct().all()
        
        # Essayer d'obtenir les trajets également, mais gérer l'erreur si les colonnes n'existent pas
        try:
            points_depart = db.session.query(Prestation.trajet_depart).filter(Prestation.trajet_depart != None, Prestation.trajet_depart != '').distinct().all()
            destinations = db.session.query(Prestation.trajet_destination).filter(Prestation.trajet_destination != None, Prestation.trajet_destination != '').distinct().all()
        except Exception as e:
            print(f"Erreur lors de la récupération des trajets (normal si colonnes manquantes): {e}")
            points_depart = []
            destinations = []
    except Exception as e:
        print(f"Erreur lors de la récupération des adresses: {e}")
        adresses_depart = []
        adresses_arrivee = []
        points_depart = []
        destinations = []
    
    # Convertir les résultats en listes plates
    suggestions_depart = [addr[0] for addr in adresses_depart if addr[0]]
    suggestions_arrivee = [addr[0] for addr in adresses_arrivee if addr[0]]
    suggestions_points = [point[0] for point in points_depart if point[0]]
    suggestions_destinations = [dest[0] for dest in destinations if dest[0]]
    
    # Ajouter quelques villes françaises pour les suggestions initiales
    villes_francaises = ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", 
                         "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Caen", "Rouen", "Amiens", "Metz"]
    
    # Fusionner avec les villes françaises et éliminer les doublons
    suggestions_points.extend(villes_francaises)
    suggestions_destinations.extend(villes_francaises)
    suggestions_points = list(set(suggestions_points))
    suggestions_destinations = list(set(suggestions_destinations))
    
    if form.validate_on_submit():
        # Créer une nouvelle prestation avec les valeurs obligatoires
        prestation_args = {
            'client_id': form.client_id.data,
            'date_debut': form.date_debut.data,
            'date_fin': form.date_fin.data,
            'adresse_depart': form.adresse_depart.data,
            'adresse_arrivee': form.adresse_arrivee.data,
            'observation': form.observation.data,
            'statut': form.statut.data,
            # Ne plus utiliser les colonnes manquantes
            # 'demenagement_type': form.demenagement_type.data,
            'societe': form.societe.data,
            'montant': form.montant.data,
            # 'camion_type': form.camion_type.data,
            'tags': form.tags.data,
            # 'priorite': form.priorite.data,
            'created_by_id': current_user.id
        }
        
        # Si les champs trajet sont remplis, utiliser leurs valeurs dans les adresses correspondantes
        # if form.trajet_depart.data:
        #     prestation_args['adresse_depart'] = form.trajet_depart.data
        # if form.trajet_destination.data:
        #     prestation_args['adresse_arrivee'] = form.trajet_destination.data
        
        # Ajouter l'ID du commercial si présent
        # if form.id_user_commercial.data:
        #     prestation_args['id_user_commercial'] = form.id_user_commercial.data
        
        # Créer la prestation
        prestation = Prestation(**prestation_args)
        db.session.add(prestation)
        db.session.commit()
        
        # Ajouter les transporteurs à la prestation
        if form.transporteur_ids.data:
            for transporter_id in form.transporteur_ids.data:
                pt = PrestationTransporter(prestation_id=prestation.id, transporter_id=transporter_id)
                db.session.add(pt)
                
                # Créer une notification pour chaque transporteur
                notification_transporteur = Notification(
                    user_id=transporter_id,
                    type='info',
                    message=f"Vous avez été assigné à une nouvelle prestation (#{prestation.id}): {prestation.adresse_depart} → {prestation.adresse_arrivee}",
                    is_read=False,
                    related_prestation_id=prestation.id
                )
                db.session.add(notification_transporteur)
            db.session.commit()
        
        # Créer une notification
        notification = Notification(
            user_id=current_user.id,
            type='info',
            message=f"Nouvelle prestation créée pour {prestation.client.nom} {prestation.client.prenom}",
            is_read=False
        )
        db.session.add(notification)
        db.session.commit()
        
        flash('Prestation ajoutée avec succès!', 'success')
        return redirect(url_for('prestations_list'))
    
    return render_template('prestations/form.html', form=form, 
                          title='Ajouter une prestation',
                          suggestions_depart=suggestions_depart,
                          suggestions_arrivee=suggestions_arrivee,
                          suggestions_points=suggestions_points,
                          suggestions_destinations=suggestions_destinations)

@app.route('/clients/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def client_edit(id):
    # Vérifier si l'utilisateur est au moins un admin
    if current_user.role == 'transporteur':
        flash('Vous n\'avez pas les droits pour modifier un client. Cette action est réservée aux administrateurs.', 'danger')
        return redirect(url_for('clients_list'))
    
    client = Client.query.get_or_404(id)
    form = ClientForm()
    
    if request.method == 'GET':
        form.nom.data = client.nom
        form.prenom.data = client.prenom
        form.email.data = client.email
        form.telephone.data = client.telephone
        form.adresse.data = client.adresse
        # form.client_type.data = client.client_type
        form.tags.data = client.tags
    
    if form.validate_on_submit():
        client.nom = form.nom.data
        client.prenom = form.prenom.data
        client.email = form.email.data
        client.telephone = form.telephone.data
        client.adresse = form.adresse.data
        # client.client_type = form.client_type.data
        client.tags = form.tags.data
        
        db.session.commit()
        
        # Gérer les documents téléchargés
        if form.documents.data and form.documents.data[0].filename:
            for uploaded_file in form.documents.data:
                if uploaded_file.filename:
                    filename = secure_filename(uploaded_file.filename)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    uploaded_file.save(file_path)
                    
                    document = Document(
                        filename=filename,
                        original_filename=uploaded_file.filename,
                        file_type=os.path.splitext(filename)[1].strip('.').lower(),
                        document_type='autre',
                        description=f"Document pour {client.nom} {client.prenom}",
                        client_id=client.id,
                        created_by_id=current_user.id
                    )
                    db.session.add(document)
            
            db.session.commit()
        
        flash('Client mis à jour avec succès!', 'success')
        return redirect(url_for('clients_list'))
    
    return render_template('clients/form.html', form=form, title='Modifier le client', client=client)

@app.route('/clients/<int:id>/documents')
@login_required
def client_documents_list(id):
    client = Client.query.get_or_404(id)
    documents = Document.query.filter_by(client_id=id).all()
    return render_template('clients/documents.html', client=client, documents=documents)

@app.route('/clients/<int:id>/documents/upload', methods=['POST'])
@login_required
def client_upload_document(id):
    client = Client.query.get_or_404(id)
    
    if 'document' not in request.files:
        flash('Aucun fichier sélectionné', 'danger')
        return redirect(url_for('client_documents_list', id=id))
    
    file = request.files['document']
    
    if file.filename == '':
        flash('Aucun fichier sélectionné', 'danger')
        return redirect(url_for('client_documents_list', id=id))
    
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        document = Document(
            filename=filename,
            original_filename=file.filename,
            file_type=os.path.splitext(filename)[1].strip('.').lower(),
            document_type='autre',
            description=f"Document pour {client.nom} {client.prenom}",
            client_id=client.id,
            created_by_id=current_user.id
        )
        db.session.add(document)
        db.session.commit()
        
        flash('Document ajouté avec succès', 'success')
        
    return redirect(url_for('client_documents_list', id=id))

@app.route('/clients/<int:id>/fiche')
@login_required
def generate_fiche_client(id):
    client = Client.query.get_or_404(id)
    
    # Récupérer les prestations liées à ce client
    prestations = Prestation.query.filter_by(client_id=id).order_by(Prestation.date_debut.desc()).all()
    
    # Récupérer les documents liés à ce client
    documents = Document.query.filter_by(client_id=id).all()
    
    # Générer la fiche client au format HTML
    rendered_template = render_template('clients/fiche.html', 
                                       client=client, 
                                       prestations=prestations, 
                                       documents=documents,
                                       date_generation=datetime.utcnow())
    
    # Convertir en PDF (commenté car weasyprint n'est peut-être pas installé)
    # pdf = HTML(string=rendered_template).write_pdf()
    # buffer = BytesIO(pdf)
    # buffer.seek(0)
    # return send_file(buffer, download_name=f"fiche_client_{client.id}.pdf", as_attachment=True, mimetype='application/pdf')
    
    # Pour le moment, retourner juste le HTML
    return rendered_template

@app.route('/clients/<int:client_id>/documents/<int:document_id>/download')
@login_required
def client_download_document(client_id, document_id):
    # Vérifier si le client existe
    client = Client.query.get_or_404(client_id)
    
    # Vérifier si le document existe et appartient au client
    document = Document.query.filter_by(id=document_id, client_id=client_id).first_or_404()
    
    # Vérifier si l'utilisateur a le droit d'accéder à ce document
    # (admin ou créateur du document)
    if current_user.role != 'admin' and document.created_by_id != current_user.id:
        flash('Vous n\'avez pas les droits pour télécharger ce document', 'danger')
        return redirect(url_for('dashboard'))
    
    # Chemin complet du fichier
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], document.filename)
    
    # Vérifier si le fichier existe
    if not os.path.exists(file_path):
        flash('Le fichier n\'existe pas', 'danger')
        return redirect(url_for('client_documents_list', id=client_id))
    
    # Envoyer le fichier
    return send_file(file_path, as_attachment=True, download_name=document.original_filename)

class UserForm(FlaskForm):
    username = StringField('Nom d\'utilisateur', validators=[DataRequired(), Length(min=3, max=80)])
    password = PasswordField('Mot de passe', validators=[Optional()])
    email = StringField('Email', validators=[Optional(), Email()])
    nom = StringField('Nom', validators=[DataRequired()])
    prenom = StringField('Prénom', validators=[DataRequired()])
    role = SelectField('Rôle', choices=[
        ('commercial', 'Commercial'),
        ('transporteur', 'Transporteur'),
        ('admin', 'Administrateur'),
        ('super_admin', 'Super Administrateur')
    ], validators=[DataRequired()])
    vehicule = StringField('Véhicule', validators=[Optional()])
    statut = SelectField('Statut', choices=[
        ('actif', 'Actif'),
        ('inactif', 'Inactif')
    ], default='actif', validators=[DataRequired()])

@app.route('/users/add', methods=['GET', 'POST'])
@login_required
def user_add():
    # Vérifier les permissions selon le rôle
    if current_user.role not in ['admin', 'super_admin', 'commercial']:
        flash('Vous n\'avez pas les permissions nécessaires pour ajouter un utilisateur.', 'danger')
        return redirect(url_for('dashboard'))
    
    form = UserForm()
    
    # Limiter les choix selon le rôle de l'utilisateur
    if current_user.role == 'super_admin':
        # Le super_admin peut créer n'importe quel type d'utilisateur
        pass  # Aucune restriction, toutes les options sont disponibles
    elif current_user.role == 'admin':
        # L'admin peut créer des commerciaux et transporteurs, mais pas des admin ou super_admin
        form.role.choices = [
            ('commercial', 'Commercial'),
            ('transporteur', 'Transporteur')
        ]
    elif current_user.role == 'commercial':
        # Le commercial peut créer des transporteurs uniquement
        form.role.choices = [
            ('transporteur', 'Transporteur')
        ]
    
    if form.validate_on_submit():
        try:
            # Vérifier si le nom d'utilisateur existe déjà
            existing_user = User.query.filter_by(username=form.username.data).first()
            if existing_user:
                flash('Ce nom d\'utilisateur est déjà utilisé.', 'danger')
                return render_template('users/form.html', form=form, title="Ajouter un utilisateur")
            
            # Créer un nouvel utilisateur
            user = User(
                username=form.username.data,
                email=form.email.data,
                nom=form.nom.data,
                prenom=form.prenom.data,
                role=form.role.data,
                vehicule=form.vehicule.data if form.role.data == 'transporteur' else None,
                statut=form.statut.data,
                created_by_id=current_user.id
            )
            
            # Définir le mot de passe si fourni
            if form.password.data:
                user.set_password(form.password.data)
            else:
                # Mot de passe par défaut basé sur le nom d'utilisateur
                user.set_password(form.username.data)
            
            db.session.add(user)
            db.session.commit()
            
            flash(f'L\'utilisateur {user.username} a été créé avec succès.', 'success')
            return redirect(url_for('users_list'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la création de l\'utilisateur: {str(e)}', 'danger')
    
    return render_template('users/form.html', form=form, title="Ajouter un utilisateur")

@app.route('/users/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def user_edit(id):
    # Vérifier les permissions selon le rôle
    if current_user.role not in ['admin', 'super_admin', 'commercial']:
        flash('Vous n\'avez pas les permissions nécessaires pour modifier un utilisateur.', 'danger')
        return redirect(url_for('dashboard'))
    
    user = User.query.get_or_404(id)
    
    # Vérifier que l'utilisateur a le droit de modifier cet utilisateur
    if current_user.role == 'commercial' and user.role not in ['transporteur']:
        flash('Vous n\'avez pas les permissions nécessaires pour modifier ce type d\'utilisateur.', 'danger')
        return redirect(url_for('users_list'))
    
    # Admin ne peut pas modifier un super_admin
    if current_user.role == 'admin' and user.role == 'super_admin':
        flash('Vous n\'avez pas les permissions nécessaires pour modifier ce super_admin.', 'danger')
        return redirect(url_for('users_list'))
    
    # Admin ne peut pas modifier un autre admin
    if current_user.role == 'admin' and user.role == 'admin' and user.id != current_user.id:
        flash('Vous n\'avez pas les permissions nécessaires pour modifier un autre administrateur.', 'danger')
        return redirect(url_for('users_list'))
    
    # Créer et pré-remplir le formulaire
    form = UserForm(obj=user)
    
    # Limiter les choix selon le rôle de l'utilisateur connecté
    if current_user.role == 'super_admin':
        # Le super_admin peut modifier n'importe quel type d'utilisateur
        pass
    elif current_user.role == 'admin':
        # L'admin ne peut pas promouvoir un utilisateur en admin ou super_admin
        form.role.choices = [
            ('commercial', 'Commercial'),
            ('transporteur', 'Transporteur')
        ]
        # Si l'admin modifie son propre compte, il peut garder son rôle d'admin
        if user.id == current_user.id:
            form.role.choices.append(('admin', 'Administrateur'))
    
    if form.validate_on_submit():
        try:
            # Vérifier si le nom d'utilisateur existe déjà (pour un autre utilisateur)
            existing_user = User.query.filter(User.username == form.username.data, User.id != id).first()
            if existing_user:
                flash('Ce nom d\'utilisateur est déjà utilisé par un autre utilisateur.', 'danger')
                return render_template('users/form.html', form=form, title="Modifier l'utilisateur", user=user)
            
            # Mettre à jour les données de l'utilisateur
            user.username = form.username.data
            user.email = form.email.data
            user.nom = form.nom.data
            user.prenom = form.prenom.data
            
            # Si l'utilisateur n'essaie pas de changer le rôle d'un super_admin ou si c'est un super_admin qui fait la modification
            if user.role != 'super_admin' or current_user.role == 'super_admin':
                user.role = form.role.data
            
            user.vehicule = form.vehicule.data if form.role.data == 'transporteur' else None
            user.statut = form.statut.data
            
            # Mettre à jour le mot de passe si fourni
            if form.password.data:
                user.set_password(form.password.data)
            
            db.session.commit()
            
            flash(f'L\'utilisateur {user.username} a été modifié avec succès.', 'success')
            return redirect(url_for('users_list'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la modification de l\'utilisateur: {str(e)}', 'danger')
    
    return render_template('users/form.html', form=form, title="Modifier l'utilisateur", user=user)

@app.template_filter('now')
def filter_now(unused_arg=None):
    return datetime.now()

@app.route('/documents/<int:document_id>/download')
@login_required
def download_document(document_id):
    document = Document.query.get_or_404(document_id)
    
    # Vérifier si l'utilisateur a le droit d'accéder à ce document
    # (admin ou créateur du document ou en charge du client)
    if current_user.role != 'admin' and document.created_by_id != current_user.id:
        flash('Vous n\'avez pas les droits pour télécharger ce document', 'danger')
        return redirect(url_for('dashboard'))
    
    # Chemin complet du fichier
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], document.filename)
    
    # Vérifier si le fichier existe
    if not os.path.exists(file_path):
        flash('Le fichier n\'existe pas', 'danger')
        return redirect(url_for('clients'))
    
    # Envoyer le fichier
    return send_file(file_path, as_attachment=True, download_name=document.original_filename)

def is_super_admin():
    return current_user.role == 'super_admin'

def is_admin_or_higher():
    return current_user.role in ['admin', 'super_admin']

@app.route('/users/<int:id>/delete', methods=['GET', 'POST'])
@login_required
def user_delete(id):
    # Vérifier les permissions
    if current_user.role not in ['admin', 'super_admin', 'commercial']:
        flash('Vous n\'avez pas les permissions nécessaires pour supprimer un utilisateur.', 'danger')
        return redirect(url_for('dashboard'))
    
    user = User.query.get_or_404(id)
    
    # Vérifier que l'utilisateur a le droit de supprimer cet utilisateur
    if current_user.role == 'commercial' and user.role not in ['transporteur']:
        flash('Vous n\'avez pas les permissions nécessaires pour supprimer ce type d\'utilisateur.', 'danger')
        return redirect(url_for('users_list'))
    
    # Empêcher la suppression de son propre compte
    if id == current_user.id:
        flash('Vous ne pouvez pas supprimer votre propre compte.', 'danger')
        return redirect(url_for('users_list'))
    
    # Si une demande POST est reçue, on procède à la suppression
    if request.method == 'POST':
        try:
            # Stocker les informations pour le message flash
            username = user.username
            
            # Supprimer l'utilisateur
            db.session.delete(user)
            db.session.commit()
            
            flash(f'L\'utilisateur {username} a été supprimé avec succès.', 'success')
            return redirect(url_for('users_list'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la suppression de l\'utilisateur: {str(e)}', 'danger')
    
    # Afficher la page de confirmation
    return render_template('users/delete_confirm.html', user=user)

@app.route('/user_info')
@login_required
def user_info():
    return render_template('user_debug.html')

@app.route('/prestations/<int:id>/accepter', methods=['POST'])
@login_required
def prestation_accepter(id):
    # Vérifier si l'utilisateur est un transporteur
    if current_user.role != 'transporteur':
        flash('Vous n\'avez pas les permissions nécessaires pour accepter cette prestation.', 'danger')
        return redirect(url_for('dashboard'))
    
    prestation = Prestation.query.get_or_404(id)
    
    # Vérifier si le transporteur est assigné à cette prestation
    transporteur_assigne = PrestationTransporter.query.filter_by(
        prestation_id=id, 
        transporter_id=current_user.id
    ).first()
    
    if not transporteur_assigne:
        flash('Vous n\'êtes pas assigné à cette prestation.', 'danger')
        return redirect(url_for('dashboard'))
    
    # Mettre à jour le statut de la prestation
    prestation.statut = 'en_cours'
    
    # Enregistrer l'acceptation dans la base de données
    transporteur_assigne.statut = 'acceptee'
    transporteur_assigne.date_acceptation = datetime.utcnow()
    
    # Créer une notification pour le commercial qui a créé la prestation
    notification = Notification(
        user_id=prestation.created_by_id,
        type='info',
        message=f"Le transporteur {current_user.prenom} {current_user.nom} a accepté la prestation #{prestation.id}",
        is_read=False,
        related_prestation_id=prestation.id
    )
    
    db.session.add(notification)
    db.session.commit()
    
    flash('Vous avez accepté la prestation avec succès.', 'success')
    return redirect(url_for('prestation_details', id=id))

@app.route('/prestations/<int:id>/refuser', methods=['POST'])
@login_required
def prestation_refuser(id):
    # Vérifier si l'utilisateur est un transporteur
    if current_user.role != 'transporteur':
        flash('Vous n\'avez pas les permissions nécessaires pour refuser cette prestation.', 'danger')
        return redirect(url_for('dashboard'))
    
    prestation = Prestation.query.get_or_404(id)
    
    # Vérifier si le transporteur est assigné à cette prestation
    transporteur_assigne = PrestationTransporter.query.filter_by(
        prestation_id=id, 
        transporter_id=current_user.id
    ).first()
    
    if not transporteur_assigne:
        flash('Vous n\'êtes pas assigné à cette prestation.', 'danger')
        return redirect(url_for('dashboard'))
    
    # Enregistrer le refus dans la base de données
    transporteur_assigne.statut = 'refusee'
    transporteur_assigne.date_refus = datetime.utcnow()
    
    # Créer une notification pour le commercial qui a créé la prestation
    notification = Notification(
        user_id=prestation.created_by_id,
        type='warning',
        message=f"Le transporteur {current_user.prenom} {current_user.nom} a refusé la prestation #{prestation.id}",
        is_read=False
    )
    
    db.session.add(notification)
    db.session.commit()
    
    flash('Vous avez refusé la prestation. Le commercial en sera notifié.', 'warning')
    return redirect(url_for('dashboard'))

@app.route('/prestations/<int:id>/terminer', methods=['POST'])
@login_required
def prestation_terminer(id):
    # Vérifier si l'utilisateur est un transporteur
    if current_user.role != 'transporteur':
        flash('Vous n\'avez pas les permissions nécessaires pour marquer cette prestation comme terminée.', 'danger')
        return redirect(url_for('dashboard'))
    
    prestation = Prestation.query.get_or_404(id)
    
    # Vérifier si le transporteur est assigné à cette prestation
    transporteur_assigne = PrestationTransporter.query.filter_by(
        prestation_id=id, 
        transporter_id=current_user.id
    ).first()
    
    if not transporteur_assigne:
        flash('Vous n\'êtes pas assigné à cette prestation.', 'danger')
        return redirect(url_for('dashboard'))
    
    # Vérifier si la prestation est en cours
    if prestation.statut != 'en_cours':
        flash('Cette prestation n\'est pas en cours. Impossible de la marquer comme terminée.', 'danger')
        return redirect(url_for('prestation_details', id=id))
    
    # Mettre à jour le statut de la prestation
    prestation.statut = 'terminee'
    
    # Enregistrer la finalisation dans la base de données
    transporteur_assigne.statut = 'terminee'
    transporteur_assigne.date_finalisation = datetime.utcnow()
    
    # Créer une notification pour le commercial qui a créé la prestation
    notification = Notification(
        user_id=prestation.created_by_id,
        type='success',
        message=f"Le transporteur {current_user.prenom} {current_user.nom} a terminé la prestation #{prestation.id}",
        is_read=False
    )
    
    db.session.add(notification)
    db.session.commit()
    
    flash('Vous avez marqué cette prestation comme terminée. Le commercial en sera notifié.', 'success')
    return redirect(url_for('dashboard'))

@app.route('/api/calendar-events')
@login_required
def calendar_events():
    # Récupérer toutes les prestations
    prestations = Prestation.query.all()
    
    # Formatter les prestations pour le calendrier
    events = []
    for prestation in prestations:
        # Créer l'événement de début (départ)
        # S'assurer que date_debut inclut l'heure et est correctement formatée
        start_datetime = prestation.date_debut
        
        # Utiliser l'heure par défaut (8h00) si l'heure n'est pas spécifiée
        if start_datetime.hour == 0 and start_datetime.minute == 0 and start_datetime.second == 0:
            start_datetime = datetime.combine(start_datetime.date(), time(8, 0, 0))
        
        # Pour les vues jour/semaine, nous devons spécifier à la fois start et end
        end_datetime = datetime.combine(start_datetime.date(), 
                                      time(start_datetime.hour + 2, start_datetime.minute, 0))
        
        start_event = {
            'id': f'start_{prestation.id}',
            'title': f'{prestation.client.nom} - Départ',
            'start': start_datetime.strftime('%Y-%m-%dT%H:%M:%S'),
            'end': end_datetime.strftime('%Y-%m-%dT%H:%M:%S'),  # Ajout d'une fin (2h après le début)
            'description': f'Déménagement de {prestation.adresse_depart} à {prestation.adresse_arrivee}',
            'prestation_id': prestation.id,
            'color': '#4e73df',  # Bleu pour les départs
            'allDay': False
        }
        events.append(start_event)
        
        # Si la date de fin est différente de la date de début, créer un événement d'arrivée
        if prestation.date_fin and prestation.date_fin != prestation.date_debut:
            # S'assurer que date_fin inclut l'heure et est correctement formatée
            end_datetime = prestation.date_fin
            
            # Utiliser l'heure par défaut (18h00) si l'heure n'est pas spécifiée
            if end_datetime.hour == 0 and end_datetime.minute == 0 and end_datetime.second == 0:
                end_datetime = datetime.combine(end_datetime.date(), time(18, 0, 0))
            
            # Pour les vues jour/semaine, nous devons spécifier à la fois start et end
            arrival_end_datetime = datetime.combine(end_datetime.date(), 
                                                  time(end_datetime.hour + 1, end_datetime.minute, 0))
            
            end_event = {
                'id': f'end_{prestation.id}',
                'title': f'{prestation.client.nom} - Arrivée',
                'start': end_datetime.strftime('%Y-%m-%dT%H:%M:%S'),
                'end': arrival_end_datetime.strftime('%Y-%m-%dT%H:%M:%S'),  # Ajout d'une fin (1h après l'arrivée)
                'description': f'Arrivée à {prestation.adresse_arrivee}',
                'prestation_id': prestation.id,
                'color': '#1cc88a',  # Vert pour les arrivées
                'allDay': False
            }
            events.append(end_event)
    
    return jsonify(events)

@app.route('/suggest_depart')
@login_required
def suggest_depart():
    try:
        # Essayer d'utiliser trajet_depart d'abord
        points_depart = db.session.query(Prestation.trajet_depart).filter(
            Prestation.trajet_depart != None, 
            Prestation.trajet_depart != ''
        ).distinct().all()
        
        # Convertir les tuples en liste de valeurs
        suggestions = [point[0] for point in points_depart]
        
    except Exception as e:
        print(f"Erreur lors de la récupération des trajets de départ: {e}")
        # Utiliser adresse_depart comme alternative
        points_depart = db.session.query(Prestation.adresse_depart).filter(
            Prestation.adresse_depart != None, 
            Prestation.adresse_depart != ''
        ).distinct().all()
        
        # Convertir les tuples en liste de valeurs
        suggestions = [point[0] for point in points_depart]
    
    return jsonify(suggestions)

@app.route('/suggest_destination')
@login_required
def suggest_destination():
    try:
        # Essayer d'utiliser trajet_destination d'abord
        points_destination = db.session.query(Prestation.trajet_destination).filter(
            Prestation.trajet_destination != None, 
            Prestation.trajet_destination != ''
        ).distinct().all()
        
        # Convertir les tuples en liste de valeurs
        suggestions = [point[0] for point in points_destination]
        
    except Exception as e:
        print(f"Erreur lors de la récupération des trajets de destination: {e}")
        # Utiliser adresse_arrivee comme alternative
        points_destination = db.session.query(Prestation.adresse_arrivee).filter(
            Prestation.adresse_arrivee != None, 
            Prestation.adresse_arrivee != ''
        ).distinct().all()
        
        # Convertir les tuples en liste de valeurs
        suggestions = [point[0] for point in points_destination]
    
    return jsonify(suggestions)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Créer les tables si elles n'existent pas
    app.run(debug=True, host='0.0.0.0')
