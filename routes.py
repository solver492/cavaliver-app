import os
from datetime import datetime
from flask import (
    Blueprint, render_template, redirect, url_for, 
    flash, request, jsonify, send_from_directory, abort
)
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from models import User, Client, Prestation, Facture, Document, Transporteur, Vehicule
from forms import (
    LoginForm, ClientForm, PrestationForm, FactureForm, UserForm,
    SearchClientForm, SearchPrestationForm, SearchFactureForm, SearchUserForm
)
from app import db
from utils import (
    save_document, generate_invoice_number, 
    calculate_dashboard_stats, is_authorized
)

# Blueprints
auth_bp = Blueprint('auth', __name__)
dashboard_bp = Blueprint('dashboard', __name__)
client_bp = Blueprint('client', __name__)
prestation_bp = Blueprint('prestation', __name__)
facture_bp = Blueprint('facture', __name__)
user_bp = Blueprint('user', __name__)
api_bp = Blueprint('api', __name__)

# Auth routes
@auth_bp.route('/', methods=['GET', 'POST'])
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            user.derniere_connexion = datetime.utcnow()
            db.session.commit()
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard.index'))
        else:
            flash('Nom d\'utilisateur ou mot de passe incorrect.', 'danger')
    
    return render_template('login.html', form=form, title='Connexion')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

# Dashboard routes
@dashboard_bp.route('/dashboard')
@login_required
def index():
    stats = calculate_dashboard_stats()
    return render_template('dashboard.html', stats=stats, title='Tableau de bord')

# Client routes
@client_bp.route('/')
@login_required
def index():
    form = SearchClientForm()
    
    # Get filter parameters
    show_archived = request.args.get('archives', False) == 'true'
    search_query = request.args.get('query', '')
    
    # Base query
    query = Client.query
    
    # Apply filters
    if not show_archived:
        query = query.filter_by(archive=False)
    
    if search_query:
        query = query.filter(
            (Client.nom.ilike(f'%{search_query}%')) |
            (Client.prenom.ilike(f'%{search_query}%')) |
            (Client.email.ilike(f'%{search_query}%')) |
            (Client.telephone.ilike(f'%{search_query}%'))
        )
    
    # Execute query
    clients = query.order_by(Client.date_creation.desc()).all()
    
    return render_template('clients/index.html', 
                           clients=clients, 
                           form=form, 
                           show_archived=show_archived,
                           search_query=search_query,
                           title='Gestion des clients')

@client_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    form = ClientForm()
    
    if form.validate_on_submit():
        client = Client(
            nom=form.nom.data,
            prenom=form.prenom.data,
            adresse=form.adresse.data,
            telephone=form.telephone.data,
            email=form.email.data,
            type_client=form.type_client.data,
            tags=form.tags.data
        )
        
        db.session.add(client)
        db.session.commit()
        
        # Handle document upload
        if form.documents.data:
            for document in request.files.getlist('documents'):
                doc_path = save_document(document, client.id)
                if doc_path:
                    new_doc = Document(
                        nom=document.filename,
                        chemin=doc_path,
                        type='client_document',
                        client_id=client.id
                    )
                    db.session.add(new_doc)
            db.session.commit()
        
        flash('Client ajouté avec succès.', 'success')
        return redirect(url_for('client.index'))
    
    return render_template('clients/add.html', form=form, title='Ajouter un client')

@client_bp.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit(id):
    client = Client.query.get_or_404(id)
    form = ClientForm(obj=client)
    
    if form.validate_on_submit():
        client.nom = form.nom.data
        client.prenom = form.prenom.data
        client.adresse = form.adresse.data
        client.telephone = form.telephone.data
        client.email = form.email.data
        client.type_client = form.type_client.data
        client.tags = form.tags.data
        
        # Handle document upload
        if form.documents.data:
            for document in request.files.getlist('documents'):
                if document.filename:
                    doc_path = save_document(document, client.id)
                    if doc_path:
                        new_doc = Document(
                            nom=document.filename,
                            chemin=doc_path,
                            type='client_document',
                            client_id=client.id
                        )
                        db.session.add(new_doc)
        
        db.session.commit()
        flash('Client mis à jour avec succès.', 'success')
        return redirect(url_for('client.index'))
    
    documents = Document.query.filter_by(client_id=client.id).all()
    
    return render_template('clients/edit.html', 
                          form=form, 
                          client=client, 
                          documents=documents,
                          title='Modifier un client')

@client_bp.route('/toggle_archive/<int:id>')
@login_required
def toggle_archive(id):
    client = Client.query.get_or_404(id)
    client.archive = not client.archive
    db.session.commit()
    
    status = 'archivé' if client.archive else 'désarchivé'
    flash(f'Client {status} avec succès.', 'success')
    return redirect(url_for('client.index'))

@client_bp.route('/delete/<int:id>')
@login_required
def delete(id):
    if not is_authorized(current_user, 'admin'):
        flash('Vous n\'avez pas les droits nécessaires.', 'danger')
        return redirect(url_for('client.index'))
    
    client = Client.query.get_or_404(id)
    
    # Check if client has prestations or factures
    if client.prestations or client.factures:
        flash('Impossible de supprimer ce client car il a des prestations ou factures associées.', 'danger')
        return redirect(url_for('client.index'))
    
    # Delete associated documents
    for doc in client.documents:
        if os.path.exists(doc.chemin):
            os.remove(doc.chemin)
        db.session.delete(doc)
    
    db.session.delete(client)
    db.session.commit()
    
    flash('Client supprimé avec succès.', 'success')
    return redirect(url_for('client.index'))

@client_bp.route('/download/<int:doc_id>')
@login_required
def download_document(doc_id):
    document = Document.query.get_or_404(doc_id)
    
    if not os.path.exists(document.chemin):
        flash('Le document demandé n\'existe plus.', 'danger')
        return redirect(url_for('client.index'))
    
    directory = os.path.dirname(document.chemin)
    filename = os.path.basename(document.chemin)
    
    return send_from_directory(directory, filename, as_attachment=True)

# Prestation routes
@prestation_bp.route('/')
@login_required
def index():
    form = SearchPrestationForm()
    
    # Get filter parameters
    show_archived = request.args.get('archives', False) == 'true'
    search_query = request.args.get('query', '')
    
    # Base query
    query = Prestation.query
    
    # Apply filters
    if not show_archived:
        query = query.filter_by(archive=False)
    
    if search_query:
        query = query.join(Client).filter(
            (Client.nom.ilike(f'%{search_query}%')) |
            (Client.prenom.ilike(f'%{search_query}%')) |
            (Prestation.adresse_depart.ilike(f'%{search_query}%')) |
            (Prestation.adresse_arrivee.ilike(f'%{search_query}%')) |
            (Prestation.type_demenagement.ilike(f'%{search_query}%'))
        )
    
    # Execute query
    prestations = query.order_by(Prestation.date_debut.desc()).all()
    
    return render_template('prestations/index.html', 
                          prestations=prestations, 
                          form=form, 
                          show_archived=show_archived,
                          search_query=search_query,
                          title='Liste des prestations')

@prestation_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    form = PrestationForm()
    
    # Populate client dropdown
    clients = Client.query.filter_by(archive=False).order_by(Client.nom).all()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    
    # Populate transporteurs dropdown
    transporteurs = User.query.filter(
        (User.role == 'transporteur') | (User.role == 'admin')
    ).all()
    form.transporteurs.choices = [(t.id, f"{t.prenom} {t.nom}") for t in transporteurs]
    
    if form.validate_on_submit():
        prestation = Prestation(
            client_id=form.client_id.data,
            date_debut=form.date_debut.data,
            date_fin=form.date_fin.data,
            adresse_depart=form.adresse_depart.data,
            adresse_arrivee=form.adresse_arrivee.data,
            type_demenagement=form.type_demenagement.data,
            tags=form.tags.data,
            societe=form.societe.data,
            montant=form.montant.data,
            priorite=form.priorite.data,
            statut=form.statut.data,
            observations=form.observations.data
        )
        
        db.session.add(prestation)
        
        # Add assigned transporteurs
        for transporteur_id in form.transporteurs.data:
            transporteur = User.query.get(transporteur_id)
            if transporteur:
                prestation.transporteurs.append(transporteur)
        
        db.session.commit()
        flash('Prestation ajoutée avec succès.', 'success')
        return redirect(url_for('prestation.index'))
    
    return render_template('prestations/add.html', form=form, title='Ajouter une prestation')

@prestation_bp.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit(id):
    prestation = Prestation.query.get_or_404(id)
    form = PrestationForm(obj=prestation)
    
    # Populate client dropdown
    clients = Client.query.filter_by(archive=False).order_by(Client.nom).all()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    
    # Populate transporteurs dropdown
    transporteurs = User.query.filter(
        (User.role == 'transporteur') | (User.role == 'admin')
    ).all()
    form.transporteurs.choices = [(t.id, f"{t.prenom} {t.nom}") for t in transporteurs]
    
    # Pre-select current transporteurs
    if request.method == 'GET':
        form.transporteurs.data = [t.id for t in prestation.transporteurs]
    
    if form.validate_on_submit():
        prestation.client_id = form.client_id.data
        prestation.date_debut = form.date_debut.data
        prestation.date_fin = form.date_fin.data
        prestation.adresse_depart = form.adresse_depart.data
        prestation.adresse_arrivee = form.adresse_arrivee.data
        prestation.type_demenagement = form.type_demenagement.data
        prestation.tags = form.tags.data
        prestation.societe = form.societe.data
        prestation.montant = form.montant.data
        prestation.priorite = form.priorite.data
        prestation.statut = form.statut.data
        prestation.observations = form.observations.data
        
        # Update transporteurs
        prestation.transporteurs = []
        for transporteur_id in form.transporteurs.data:
            transporteur = User.query.get(transporteur_id)
            if transporteur:
                prestation.transporteurs.append(transporteur)
        
        db.session.commit()
        flash('Prestation mise à jour avec succès.', 'success')
        return redirect(url_for('prestation.index'))
    
    return render_template('prestations/edit.html', form=form, prestation=prestation, title='Modifier une prestation')

@prestation_bp.route('/toggle_archive/<int:id>')
@login_required
def toggle_archive(id):
    prestation = Prestation.query.get_or_404(id)
    prestation.archive = not prestation.archive
    db.session.commit()
    
    status = 'archivée' if prestation.archive else 'désarchivée'
    flash(f'Prestation {status} avec succès.', 'success')
    return redirect(url_for('prestation.index'))

@prestation_bp.route('/delete/<int:id>')
@login_required
def delete(id):
    if not is_authorized(current_user, 'admin'):
        flash('Vous n\'avez pas les droits nécessaires.', 'danger')
        return redirect(url_for('prestation.index'))
    
    prestation = Prestation.query.get_or_404(id)
    
    # Check if prestation has factures
    if prestation.factures:
        flash('Impossible de supprimer cette prestation car elle a des factures associées.', 'danger')
        return redirect(url_for('prestation.index'))
    
    db.session.delete(prestation)
    db.session.commit()
    
    flash('Prestation supprimée avec succès.', 'success')
    return redirect(url_for('prestation.index'))

# Facture routes
@facture_bp.route('/')
@login_required
def index():
    form = SearchFactureForm()
    
    # Populate form select fields
    form.client_id.choices = [(0, 'Tous les clients')] + [
        (c.id, f"{c.nom} {c.prenom}") for c in Client.query.filter_by(archive=False).all()
    ]
    form.statut.choices = [('', 'Tous les statuts')] + [
        ('En attente', 'En attente'),
        ('Payée', 'Payée'),
        ('Retard', 'Retard'),
        ('Annulée', 'Annulée')
    ]
    
    # Get filter parameters
    client_id = request.args.get('client_id', type=int)
    statut = request.args.get('statut', '')
    date_debut = request.args.get('date_debut')
    date_fin = request.args.get('date_fin')
    
    # Base query
    query = Facture.query
    
    # Apply filters
    if client_id and client_id > 0:
        query = query.filter_by(client_id=client_id)
    
    if statut:
        query = query.filter_by(statut=statut)
    
    if date_debut:
        try:
            date_obj = datetime.strptime(date_debut, '%Y-%m-%d')
            query = query.filter(Facture.date_emission >= date_obj)
        except ValueError:
            pass
    
    if date_fin:
        try:
            date_obj = datetime.strptime(date_fin, '%Y-%m-%d')
            query = query.filter(Facture.date_emission <= date_obj)
        except ValueError:
            pass
    
    # Execute query
    factures = query.order_by(Facture.date_emission.desc()).all()
    
    return render_template('factures/index.html', 
                          factures=factures, 
                          form=form,
                          title='Gestion des factures')

@facture_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    form = FactureForm()
    
    # Populate client dropdown
    clients = Client.query.filter_by(archive=False).order_by(Client.nom).all()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    
    # Initialize prestation dropdown (will be updated by JS)
    form.prestation_id.choices = [(0, 'Sélectionnez d\'abord un client')]
    
    # Auto-generate invoice number
    if request.method == 'GET':
        form.numero.data = generate_invoice_number()
    
    if form.validate_on_submit():
        facture = Facture(
            numero=form.numero.data,
            client_id=form.client_id.data,
            date_emission=form.date_emission.data,
            date_echeance=form.date_echeance.data,
            montant_ht=form.montant_ht.data,
            taux_tva=form.taux_tva.data,
            montant_ttc=form.montant_ttc.data,
            mode_paiement=form.mode_paiement.data,
            statut=form.statut.data,
            notes=form.notes.data
        )
        
        if form.prestation_id.data and form.prestation_id.data > 0:
            facture.prestation_id = form.prestation_id.data
        
        db.session.add(facture)
        db.session.commit()
        flash('Facture créée avec succès.', 'success')
        return redirect(url_for('facture.index'))
    
    return render_template('factures/add.html', form=form, title='Ajouter une facture')

@facture_bp.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit(id):
    facture = Facture.query.get_or_404(id)
    form = FactureForm(obj=facture)
    
    # Populate client dropdown
    clients = Client.query.filter_by(archive=False).order_by(Client.nom).all()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    
    # Populate prestation dropdown based on the client
    prestations = Prestation.query.filter_by(client_id=facture.client_id).all()
    form.prestation_id.choices = [(0, 'Aucune prestation')] + [
        (p.id, f"Prestation du {p.date_debut.strftime('%d/%m/%Y')}") for p in prestations
    ]
    
    if form.validate_on_submit():
        facture.numero = form.numero.data
        facture.client_id = form.client_id.data
        facture.date_emission = form.date_emission.data
        facture.date_echeance = form.date_echeance.data
        facture.montant_ht = form.montant_ht.data
        facture.taux_tva = form.taux_tva.data
        facture.montant_ttc = form.montant_ttc.data
        facture.mode_paiement = form.mode_paiement.data
        facture.statut = form.statut.data
        facture.notes = form.notes.data
        
        if form.prestation_id.data and form.prestation_id.data > 0:
            facture.prestation_id = form.prestation_id.data
        else:
            facture.prestation_id = None
        
        db.session.commit()
        flash('Facture mise à jour avec succès.', 'success')
        return redirect(url_for('facture.index'))
    
    return render_template('factures/edit.html', form=form, facture=facture, title='Modifier une facture')

@facture_bp.route('/delete/<int:id>')
@login_required
def delete(id):
    if not is_authorized(current_user, 'admin'):
        flash('Vous n\'avez pas les droits nécessaires.', 'danger')
        return redirect(url_for('facture.index'))
    
    facture = Facture.query.get_or_404(id)
    db.session.delete(facture)
    db.session.commit()
    
    flash('Facture supprimée avec succès.', 'success')
    return redirect(url_for('facture.index'))

@facture_bp.route('/get_prestations/<int:client_id>')
@login_required
def get_prestations(client_id):
    prestations = Prestation.query.filter_by(client_id=client_id, archive=False).all()
    prestation_list = [{'id': 0, 'text': 'Aucune prestation'}]
    
    for p in prestations:
        prestation_list.append({
            'id': p.id,
            'text': f"Prestation du {p.date_debut.strftime('%d/%m/%Y')} - {p.type_demenagement}"
        })
    
    return jsonify(prestation_list)

# User routes
@user_bp.route('/')
@login_required
def index():
    # Check if user has admin rights
    if not is_authorized(current_user, 'admin'):
        flash('Vous n\'avez pas les droits nécessaires.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    form = SearchUserForm()
    
    # Populate form select fields
    form.role.choices = [('', 'Tous les rôles')] + [
        ('transporteur', 'Transporteur'),
        ('commercial', 'Commercial'),
        ('admin', 'Admin'),
        ('super_admin', 'Super Admin')
    ]
    
    form.statut.choices = [('', 'Tous les statuts')] + [
        ('actif', 'Actif'),
        ('inactif', 'Inactif')
    ]
    
    # Get filter parameters
    search_query = request.args.get('query', '')
    role = request.args.get('role', '')
    statut = request.args.get('statut', '')
    
    # Base query
    query = User.query
    
    # Apply filters
    if search_query:
        query = query.filter(
            (User.nom.ilike(f'%{search_query}%')) |
            (User.prenom.ilike(f'%{search_query}%')) |
            (User.username.ilike(f'%{search_query}%'))
        )
    
    if role:
        query = query.filter_by(role=role)
    
    if statut:
        query = query.filter_by(statut=statut)
    
    # Execute query
    users = query.order_by(User.nom).all()
    
    return render_template('users/index.html', 
                          users=users, 
                          form=form,
                          title='Gestion des utilisateurs')

@user_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    # Check if user has admin rights
    if not is_authorized(current_user, 'admin'):
        flash('Vous n\'avez pas les droits nécessaires.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    form = UserForm()
    
    if form.validate_on_submit():
        # Check if username already exists
        if User.query.filter_by(username=form.username.data).first():
            flash('Ce nom d\'utilisateur existe déjà.', 'danger')
            return render_template('users/add.html', form=form, title='Nouvel utilisateur')
        
        user = User(
            nom=form.nom.data,
            prenom=form.prenom.data,
            username=form.username.data,
            email=form.email.data,
            role=form.role.data,
            statut=form.statut.data,
            vehicule=form.vehicule.data if form.role.data == 'transporteur' else None
        )
        
        if form.password.data:
            user.set_password(form.password.data)
        else:
            # Default password is username + first 3 chars of lastname
            default_password = f"{form.username.data}{form.nom.data[:3].lower()}"
            user.set_password(default_password)
            flash(f'Mot de passe par défaut créé: {default_password}', 'info')
        
        db.session.add(user)
        db.session.commit()
        flash('Utilisateur créé avec succès.', 'success')
        return redirect(url_for('user.index'))
    
    return render_template('users/add.html', form=form, title='Nouvel utilisateur')

@user_bp.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit(id):
    # Check if user has admin rights or is editing their own profile
    if not (is_authorized(current_user, 'admin') or current_user.id == id):
        flash('Vous n\'avez pas les droits nécessaires.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    user = User.query.get_or_404(id)
    form = UserForm(obj=user)
    
    # Restrict role changes based on current user's role
    if not is_authorized(current_user, 'super_admin') and user.role == 'super_admin':
        flash('Vous ne pouvez pas modifier un super admin.', 'danger')
        return redirect(url_for('user.index'))
    
    if form.validate_on_submit():
        # Check if username changed and already exists
        if user.username != form.username.data and User.query.filter_by(username=form.username.data).first():
            flash('Ce nom d\'utilisateur existe déjà.', 'danger')
            return render_template('users/edit.html', form=form, user=user, title='Modifier utilisateur')
        
        user.nom = form.nom.data
        user.prenom = form.prenom.data
        user.username = form.username.data
        user.email = form.email.data
        
        # Only admins can change roles and status
        if is_authorized(current_user, 'admin'):
            user.role = form.role.data
            user.statut = form.statut.data
            user.vehicule = form.vehicule.data if form.role.data == 'transporteur' else None
        
        if form.password.data:
            user.set_password(form.password.data)
        
        db.session.commit()
        flash('Utilisateur mis à jour avec succès.', 'success')
        
        # Redirect to profile if user edited their own profile
        if current_user.id == id and not is_authorized(current_user, 'admin'):
            return redirect(url_for('dashboard.index'))
        
        return redirect(url_for('user.index'))
    
    return render_template('users/edit.html', form=form, user=user, title='Modifier utilisateur')

@user_bp.route('/delete/<int:id>')
@login_required
def delete(id):
    # Check if user has admin rights
    if not is_authorized(current_user, 'super_admin'):
        flash('Vous n\'avez pas les droits nécessaires pour supprimer un utilisateur.', 'danger')
        return redirect(url_for('user.index'))
    
    user = User.query.get_or_404(id)
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        flash('Vous ne pouvez pas supprimer votre propre compte.', 'danger')
        return redirect(url_for('user.index'))
    
    # Prevent deleting the last admin
    if user.role in ['admin', 'super_admin']:
        admin_count = User.query.filter(User.role.in_(['admin', 'super_admin'])).count()
        if admin_count <= 1:
            flash('Impossible de supprimer le dernier administrateur.', 'danger')
            return redirect(url_for('user.index'))
    
    db.session.delete(user)
    db.session.commit()
    
    flash('Utilisateur supprimé avec succès.', 'success')
    return redirect(url_for('user.index'))

# API routes
@api_bp.route('/check_disponibilite', methods=['POST'])
def check_disponibilite():
    # Récupérer les paramètres de la requête
    date_debut = request.form.get('date_debut')
    date_fin = request.form.get('date_fin')
    type_prestation = request.form.get('type_prestation')
    prestation_id = request.form.get('prestation_id')
    
    # Vérification des paramètres
    if not date_debut or not date_fin:
        return jsonify({
            'error': 'Les dates de début et de fin sont requises'
        }), 400
    
    # Convertir les dates en objets datetime
    try:
        date_debut_obj = datetime.strptime(date_debut, '%Y-%m-%d')
        date_fin_obj = datetime.strptime(date_fin, '%Y-%m-%d')
    except ValueError:
        return jsonify({
            'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD.'
        }), 400
    
    # Requête pour trouver les transporteurs disponibles
    # Un transporteur est disponible s'il n'a pas de prestation qui chevauche la période demandée
    transporteurs_disponibles = Transporteur.query.filter(
        Transporteur.statut == 'actif'
    ).all()
    
    # Filtrer les transporteurs qui ont déjà des prestations durant cette période
    transporteurs_occupes_ids = []
    
    prestations_periode = Prestation.query.filter(
        Prestation.date_debut < date_fin_obj,
        Prestation.date_fin > date_debut_obj
    )
    
    # Exclure la prestation en cours d'édition
    if prestation_id and prestation_id != 'null':
        prestations_periode = prestations_periode.filter(Prestation.id != int(prestation_id))
    
    for prestation in prestations_periode.all():
        if prestation.transporteur_id:
            transporteurs_occupes_ids.append(prestation.transporteur_id)
    
    # Filtrer les transporteurs disponibles
    transporteurs_disponibles = [t for t in transporteurs_disponibles if t.id not in transporteurs_occupes_ids]
    
    # Pour les transporteurs bientôt disponibles (dans les 30 jours après la date de fin demandée)
    date_fin_plus_30 = date_fin_obj.replace(day=date_fin_obj.day + 30)
    transporteurs_bientot_disponibles = []
    
    transporteurs_occupes = Transporteur.query.filter(
        Transporteur.id.in_(transporteurs_occupes_ids),
        Transporteur.statut == 'actif'
    ).all()
    
    for transporteur in transporteurs_occupes:
        # Trouver la prochaine date de disponibilité
        derniere_prestation = Prestation.query.filter(
            Prestation.transporteur_id == transporteur.id,
            Prestation.date_fin > date_debut_obj
        ).order_by(Prestation.date_fin.asc()).first()
        
        if derniere_prestation and derniere_prestation.date_fin < date_fin_plus_30:
            transporteurs_bientot_disponibles.append({
                'id': transporteur.id,
                'nom': transporteur.nom,
                'email': transporteur.email,
                'type_vehicule': transporteur.type_vehicule,
                'disponible_le': derniere_prestation.date_fin.strftime('%d/%m/%Y')
            })
    
    # Véhicules suggérés selon le type de prestation
    vehicules_suggeres = []
    if type_prestation:
        vehicules_suggeres = Vehicule.query.filter(
            Vehicule.type_prestation_id == type_prestation,
            Vehicule.statut == 'disponible'
        ).all()
    
    # Formater les résultats
    result = {
        'transporteurs_disponibles': [t.to_dict() for t in transporteurs_disponibles],
        'transporteurs_bientot_disponibles': transporteurs_bientot_disponibles,
        'vehicules_suggeres': [v.to_dict() for v in vehicules_suggeres]
    }
    
    return jsonify(result)

# Fonction pour enregistrer le blueprint API dans l'application
def register_api_routes(app):
    app.register_blueprint(api_bp, url_prefix='/api')
