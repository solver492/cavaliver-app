from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'votre_clé_secrète_ici'

# Configurer la base de données pour fonctionner sur Render.com
if os.environ.get('RENDER'):
    # Nous sommes sur Render.com, utiliser le volume persistant
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////etc/render/database/demenage.db'
else:
    # Nous sommes en local, utiliser le chemin normal
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/demenage.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads')

# Créer le dossier uploads s'il n'existe pas
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Import des modèles
from models import db, User, Client, Prestation, CustomField, CustomFieldValue, Planning, Document, PlanningEvent

# Initialisation des extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def requires_roles(*roles):
    def wrapper(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role not in roles:
                return 'Accès non autorisé', 403
            return f(*args, **kwargs)
        return wrapped
    return wrapper

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            flash('Connexion réussie!', 'success')
            return redirect(url_for('index'))
        
        flash('Nom d\'utilisateur ou mot de passe incorrect.', 'danger')
    
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    # Récupérer les statistiques
    prestations_count = Prestation.query.count()
    clients_count = Client.query.count()
    plannings_count = Planning.query.count()
    
    # Récupérer les 5 dernières prestations
    recent_prestations = Prestation.query.order_by(Prestation.date_creation.desc()).limit(5).all()
    
    return render_template('dashboard.html',
                         prestations_count=prestations_count,
                         clients_count=clients_count,
                         plannings_count=plannings_count,
                         recent_prestations=recent_prestations)

@app.route('/users')
@login_required
@requires_roles('superadmin', 'admin')
def users_list():
    users = User.query.all()
    return render_template('users/list.html', users=users)

@app.route('/user/add', methods=['GET', 'POST'])
@login_required
@requires_roles('superadmin', 'admin')
def user_add():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        nom = request.form.get('nom')
        prenom = request.form.get('prenom')
        role = request.form.get('role')
        vehicule = request.form.get('vehicule')
        statut = request.form.get('statut', 'actif')

        # Vérifier si l'utilisateur existe déjà
        if User.query.filter_by(username=username).first():
            flash('Ce nom d\'utilisateur existe déjà.', 'danger')
            return redirect(url_for('user_add'))

        # Vérifier les permissions de création de rôle
        if role == 'superadmin' and current_user.role != 'superadmin':
            flash('Seul un super administrateur peut créer un autre super administrateur.', 'danger')
            return redirect(url_for('users_list'))

        user = User(
            username=username,
            password_hash=generate_password_hash(password),
            nom=nom,
            prenom=prenom,
            role=role,
            vehicule=vehicule,
            statut=statut,
            created_by_id=current_user.id
        )
        db.session.add(user)
        db.session.commit()
        flash('Utilisateur créé avec succès.', 'success')
        return redirect(url_for('users_list'))

    return render_template('users/form.html')

@app.route('/user/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@requires_roles('superadmin', 'admin')
def user_edit(id):
    user = User.query.get_or_404(id)
    
    # Vérifier les permissions d'édition
    if current_user.role != 'superadmin':
        if user.role == 'superadmin' or (user.role == 'admin' and current_user.role == 'admin'):
            flash('Vous n\'avez pas la permission de modifier cet utilisateur.', 'danger')
            return redirect(url_for('users_list'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        nom = request.form.get('nom')
        prenom = request.form.get('prenom')
        role = request.form.get('role')
        vehicule = request.form.get('vehicule')
        statut = request.form.get('statut')

        # Vérifier si le nouveau nom d'utilisateur existe déjà
        existing_user = User.query.filter_by(username=username).first()
        if existing_user and existing_user.id != id:
            flash('Ce nom d\'utilisateur existe déjà.', 'danger')
            return redirect(url_for('user_edit', id=id))

        # Vérifier les permissions de modification de rôle
        if user.role == 'superadmin' and current_user.role != 'superadmin':
            flash('Seul un super administrateur peut modifier un super administrateur.', 'danger')
            return redirect(url_for('users_list'))

        user.username = username
        if password:
            user.password_hash = generate_password_hash(password)
        user.nom = nom
        user.prenom = prenom
        if current_user.role == 'superadmin' or (current_user.role == 'admin' and role != 'superadmin'):
            user.role = role
        user.vehicule = vehicule
        user.statut = statut

        db.session.commit()
        flash('Utilisateur modifié avec succès.', 'success')
        return redirect(url_for('users_list'))

    return render_template('users/form.html', user=user)

@app.route('/custom-fields', methods=['GET'])
@login_required
@requires_roles('superadmin', 'admin')
def custom_fields_list():
    fields = CustomField.query.all()
    return render_template('custom_fields/list.html', fields=fields)

@app.route('/custom-field/add', methods=['GET', 'POST'])
@login_required
@requires_roles('superadmin', 'admin')
def custom_field_add():
    if request.method == 'POST':
        field = CustomField(
            entity_type=request.form['entity_type'],
            name=request.form['name'],
            field_type=request.form['field_type'],
            options=request.form.get('options'),
            created_by=current_user,
            is_locked=current_user.role == 'superadmin' and request.form.get('is_locked') == 'true'
        )
        db.session.add(field)
        db.session.commit()
        flash('Champ personnalisé créé avec succès.')
        return redirect(url_for('custom_fields_list'))
    return render_template('custom_fields/form.html')

@app.route('/plannings', methods=['GET'])
@login_required
def plannings_list():
    plannings = Planning.query.all()
    return render_template('plannings/list.html', plannings=plannings)

@app.route('/planning/add', methods=['GET', 'POST'])
@login_required
@requires_roles('superadmin', 'admin')
def planning_add():
    if request.method == 'POST':
        planning = Planning(
            name=request.form['name'],
            created_by=current_user,
            is_default=request.form.get('is_default') == 'true'
        )
        if planning.is_default:
            # Désactiver l'attribut is_default des autres plannings
            Planning.query.filter_by(is_default=True).update({'is_default': False})
        db.session.add(planning)
        db.session.commit()
        flash('Planning créé avec succès.')
        return redirect(url_for('plannings_list'))
    return render_template('plannings/form.html')

@app.route('/planning/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@requires_roles('superadmin', 'admin')
def planning_edit(id):
    planning = Planning.query.get_or_404(id)
    
    if request.method == 'POST':
        name = request.form.get('name')
        
        # Vérifier si le nom existe déjà pour un autre planning
        existing_planning = Planning.query.filter(Planning.name == name, Planning.id != id).first()
        if existing_planning:
            flash('Un planning avec ce nom existe déjà.', 'danger')
            return redirect(url_for('planning_edit', id=id))
        
        planning.name = name
        db.session.commit()
        flash('Planning modifié avec succès.', 'success')
        return redirect(url_for('plannings_list'))
    
    return render_template('plannings/form.html', planning=planning)

@app.route('/planning/<int:id>/set-default', methods=['POST'])
@login_required
@requires_roles('superadmin', 'admin')
def planning_set_default(id):
    planning = Planning.query.get_or_404(id)
    
    # Retirer le statut par défaut de tous les plannings
    Planning.query.update({Planning.is_default: False})
    
    # Définir ce planning comme par défaut
    planning.is_default = True
    db.session.commit()
    
    flash('Planning défini comme planning par défaut.', 'success')
    return redirect(url_for('plannings_list'))

@app.route('/planning/<int:id>/events')
@login_required
def planning_events(id):
    planning = Planning.query.get_or_404(id)
    events = []
    
    # Récupérer les événements personnalisés
    custom_events = PlanningEvent.query.filter_by(planning_id=id).all()
    for event in custom_events:
        events.append({
            'id': f'event_{event.id}',
            'title': event.title,
            'description': event.description,
            'start': event.start_time.strftime('%Y-%m-%d %H:%M'),
            'end': event.end_time.strftime('%Y-%m-%d %H:%M'),
            'backgroundColor': event.color,
            'type': event.type,
            'editable': True
        })
    
    # Récupérer les prestations liées
    prestations = Prestation.query.filter_by(planning_id=id).all()
    for prestation in prestations:
        color = {
            'todo': '#0d6efd',
            'done': '#198754',
            'mod': '#ffc107',
            'canceled': '#dc3545'
        }.get(prestation.statut, '#0d6efd')
        
        events.append({
            'id': f'prestation_{prestation.id}',
            'title': f"{prestation.client.nom} {prestation.client.prenom}",
            'description': prestation.observation,
            'start': prestation.date_debut.strftime('%Y-%m-%d %H:%M'),
            'end': prestation.date_fin.strftime('%Y-%m-%d %H:%M'),
            'backgroundColor': color,
            'type': 'prestation',
            'editable': False
        })
    
    return jsonify(events)

@app.route('/planning/<int:id>/event', methods=['POST'])
@login_required
def add_planning_event(id):
    planning = Planning.query.get_or_404(id)
    data = request.json
    
    try:
        # Convertir les dates du format ISO au format datetime
        start_str = data['start'].replace('T', ' ')
        end_str = data['end'].replace('T', ' ')
        
        event = PlanningEvent(
            planning_id=id,
            title=data['title'],
            description=data.get('description', ''),
            start_time=datetime.strptime(start_str, '%Y-%m-%d %H:%M'),
            end_time=datetime.strptime(end_str, '%Y-%m-%d %H:%M'),
            color=data.get('color', '#0d6efd'),
            type='custom',
            created_by_id=current_user.id
        )
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'id': f'event_{event.id}',
            'title': event.title,
            'description': event.description,
            'start': event.start_time.strftime('%Y-%m-%d %H:%M'),
            'end': event.end_time.strftime('%Y-%m-%d %H:%M'),
            'backgroundColor': event.color,
            'type': 'custom',
            'editable': True
        })
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la création de l'événement : {str(e)}")  # Pour le débogage
        return jsonify({'error': str(e)}), 400

@app.route('/planning/event/<int:event_id>', methods=['PUT', 'DELETE'])
@login_required
@requires_roles('superadmin', 'admin', 'commercial')
def manage_planning_event(event_id):
    event = PlanningEvent.query.get_or_404(event_id)
    
    if request.method == 'DELETE':
        db.session.delete(event)
        db.session.commit()
        return '', 204
    
    data = request.json
    event.title = data['title']
    event.description = data.get('description', '')
    event.start_time = datetime.strptime(data['start'].replace('T', ' '), '%Y-%m-%d %H:%M')
    event.end_time = datetime.strptime(data['end'].replace('T', ' '), '%Y-%m-%d %H:%M')
    event.color = data.get('color', event.color)
    db.session.commit()
    
    return jsonify({
        'id': f'event_{event.id}',
        'title': event.title,
        'description': event.description,
        'start': event.start_time.strftime('%Y-%m-%d %H:%M'),
        'end': event.end_time.strftime('%Y-%m-%d %H:%M'),
        'backgroundColor': event.color,
        'type': 'custom',
        'editable': True
    })

@app.route('/planning/<int:id>/import-prestations', methods=['POST'])
@login_required
@requires_roles('superadmin', 'admin')
def import_prestations_to_planning(id):
    planning = Planning.query.get_or_404(id)
    data = request.json
    prestation_ids = data.get('prestations', [])
    
    # Mettre à jour les prestations sélectionnées
    Prestation.query.filter(Prestation.id.in_(prestation_ids)).update(
        {Prestation.planning_id: id},
        synchronize_session=False
    )
    db.session.commit()
    
    return '', 204

@app.route('/client/<int:client_id>/documents', methods=['GET', 'POST'])
@login_required
def client_documents(client_id):
    client = Client.query.get_or_404(client_id)
    if request.method == 'POST':
        if 'document' not in request.files:
            flash('Aucun fichier sélectionné.')
            return redirect(request.url)
        
        file = request.files['document']
        if file.filename == '':
            flash('Aucun fichier sélectionné.')
            return redirect(request.url)
        
        if file:
            filename = file.filename
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            document = Document(
                client_id=client_id,
                file_name=filename,
                file_path=file_path,
                uploaded_by=current_user
            )
            db.session.add(document)
            db.session.commit()
            flash('Document téléchargé avec succès.')
            
    return render_template('clients/documents.html', client=client)

@app.route('/document/<int:document_id>')
@login_required
def document_download(document_id):
    document = Document.query.get_or_404(document_id)
    return send_file(document.file_path, as_attachment=True)

@app.route('/clients')
@login_required
def clients_list():
    if current_user.role == 'transporteur':
        flash('Accès non autorisé.')
        return redirect(url_for('dashboard'))
    clients = Client.query.all()
    return render_template('clients/list.html', clients=clients)

@app.route('/clients/add', methods=['GET', 'POST'])
@login_required
def client_add():
    if current_user.role == 'transporteur':
        flash('Accès non autorisé.')
        return redirect(url_for('dashboard'))
    
    form = ClientForm()
    if form.validate_on_submit():
        client = Client(
            nom=form.nom.data,
            prenom=form.prenom.data,
            adresse=form.adresse.data,
            telephone=form.telephone.data,
            email=form.email.data,
            created_by_id=current_user.id  # Ajout de l'ID de l'utilisateur connecté
        )
        db.session.add(client)
        db.session.commit()
        flash('Client ajouté avec succès.')
        return redirect(url_for('clients_list'))
    return render_template('clients/form.html', form=form, title="Ajouter un client")

@app.route('/clients/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def client_edit(id):
    if current_user.role == 'transporteur':
        flash('Accès non autorisé.')
        return redirect(url_for('dashboard'))
    
    client = Client.query.get_or_404(id)
    form = ClientForm(obj=client)
    if form.validate_on_submit():
        client.nom = form.nom.data
        client.prenom = form.prenom.data
        client.adresse = form.adresse.data
        client.telephone = form.telephone.data
        client.email = form.email.data
        db.session.commit()
        flash('Client modifié avec succès.')
        return redirect(url_for('clients_list'))
    return render_template('clients/form.html', form=form, client=client, title="Modifier un client")

@app.route('/prestations')
@login_required
def prestations_list():
    if current_user.role == 'admin':
        prestations = Prestation.query.all()
    elif current_user.role == 'commercial':
        prestations = Prestation.query.filter_by(id_user_commercial=current_user.id).all()
    else:
        prestations = Prestation.query.filter_by(id_user_transporteur=current_user.id).all()
    return render_template('prestations/list.html', prestations=prestations)

@app.route('/prestations/add', methods=['GET', 'POST'])
@login_required
def prestation_add():
    if current_user.role == 'transporteur':
        flash('Accès non autorisé.')
        return redirect(url_for('dashboard'))
    
    form = PrestationForm()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in Client.query.all()]
    form.transporteur_id.choices = [(0, 'Non assigné')] + [
        (u.id, f"{u.nom} {u.prenom}") 
        for u in User.query.filter_by(role='transporteur', statut='actif').all()
    ]
    
    if form.validate_on_submit():
        prestation = Prestation(
            client_id=form.client_id.data,
            id_user_commercial=current_user.id,
            id_user_transporteur=form.transporteur_id.data if form.transporteur_id.data != 0 else None,
            date_debut=form.date_debut.data,
            date_fin=form.date_fin.data,
            adresse_depart=form.trajet_depart.data,
            adresse_arrivee=form.trajet_destination.data,
            observation=form.observation.data,
            statut=form.statut.data,
            created_by_id=current_user.id
        )
        db.session.add(prestation)
        db.session.commit()
        flash('Prestation ajoutée avec succès.')
        return redirect(url_for('prestations_list'))
    return render_template('prestations/form.html', form=form, title="Ajouter une prestation")

@app.route('/prestations/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def prestation_edit(id):
    prestation = Prestation.query.get_or_404(id)
    
    if current_user.role == 'transporteur' and prestation.id_user_transporteur != current_user.id:
        flash('Accès non autorisé.')
        return redirect(url_for('dashboard'))
    
    form = PrestationForm(obj=prestation)
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in Client.query.all()]
    form.transporteur_id.choices = [(0, 'Non assigné')] + [
        (u.id, f"{u.nom} {u.prenom}") 
        for u in User.query.filter_by(role='transporteur', statut='actif').all()
    ]
    
    if form.validate_on_submit():
        prestation.client_id = form.client_id.data
        prestation.id_user_transporteur = form.transporteur_id.data if form.transporteur_id.data != 0 else None
        prestation.date_debut = form.date_debut.data
        prestation.date_fin = form.date_fin.data
        prestation.adresse_depart = form.trajet_depart.data
        prestation.adresse_arrivee = form.trajet_destination.data
        prestation.observation = form.observation.data
        prestation.statut = form.statut.data
        db.session.commit()
        flash('Prestation modifiée avec succès.')
        return redirect(url_for('prestations_list'))
    return render_template('prestations/form.html', form=form, prestation=prestation, title="Modifier une prestation")

@app.route('/generate_mission/<int:id>')
@login_required
def generate_mission(id):
    prestation = Prestation.query.get_or_404(id)
    pdf_path = generate_mission_pdf(prestation)
    return send_file(pdf_path, as_attachment=True, download_name=f'mission_{id}.pdf')

@app.route('/clients/fiche/<int:id>')
@login_required
def generate_fiche_client(id):
    client = Client.query.get_or_404(id)
    return send_file(generate_client_pdf(client), as_attachment=True)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Déconnexion réussie.')
    return redirect(url_for('login'))

@app.route('/prestations/json')
@login_required
def get_prestations():
    prestations = Prestation.query.all()
    return jsonify([{
        'id': p.id,
        'client_nom': p.client.nom,
        'client_prenom': p.client.prenom,
        'date_debut': p.date_debut.strftime('%Y-%m-%d %H:%M'),
        'date_fin': p.date_fin.strftime('%Y-%m-%d %H:%M'),
        'statut': p.statut
    } for p in prestations])

# Import des formulaires
from forms import LoginForm, UserForm, ClientForm, PrestationForm
from utils import generate_mission_pdf, generate_client_pdf, format_date_for_input

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Créer toutes les tables
        
        # Créer un utilisateur admin par défaut s'il n'existe pas
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@example.com',
                role='superadmin'
            )
            admin.set_password('admin')
            db.session.add(admin)
            db.session.commit()
            print('Utilisateur admin créé avec succès')
    
    print('Démarrage du serveur sur http://localhost:8000')
    app.run(host='localhost', port=8000, debug=True)
