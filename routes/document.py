from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import uuid

from extensions import db
from models import Document, Client, Prestation, Stockage
from utils import requires_roles
from forms import DocumentForm

# Création des blueprints
documents_bp = Blueprint('documents', __name__, url_prefix='/documents')

@documents_bp.route('/')
@login_required
@requires_roles('admin', 'superadmin')
def index():
    """Liste des documents"""
    # Récupérer les paramètres de recherche
    query = request.args.get('query', '')
    type_doc = request.args.get('type', '')
    statut = request.args.get('statut', '')
    date_debut = request.args.get('date_debut', '')
    date_fin = request.args.get('date_fin', '')
    
    # Construire la requête
    documents_query = Document.query
    
    # Appliquer les filtres
    if query:
        search = f"%{query}%"
        documents_query = documents_query.filter(
            (Document.nom.ilike(search)) |
            (Document.notes.ilike(search)) |
            (Document.tags.ilike(search))
        )
    
    if type_doc:
        documents_query = documents_query.filter(Document.type == type_doc)
    
    if statut:
        documents_query = documents_query.filter(Document.statut == statut)
    
    # Convertir et filtrer par dates
    if date_debut:
        try:
            date_debut_obj = datetime.strptime(date_debut, '%Y-%m-%d')
            documents_query = documents_query.filter(Document.date_upload >= date_debut_obj)
        except ValueError:
            pass
    
    if date_fin:
        try:
            date_fin_obj = datetime.strptime(date_fin, '%Y-%m-%d')
            documents_query = documents_query.filter(Document.date_upload <= date_fin_obj)
        except ValueError:
            pass
    
    # Exécuter la requête
    documents = documents_query.order_by(Document.date_upload.desc()).all()
    
    return render_template('documents/index.html', documents=documents)

@documents_bp.route('/upload', methods=['POST'])
@login_required
def upload():
    """Téléverser un document"""
    if 'fichier' not in request.files:
        flash('Aucun fichier sélectionné.', 'danger')
        return redirect(request.referrer)
    
    fichier = request.files['fichier']
    if fichier.filename == '':
        flash('Aucun fichier sélectionné.', 'danger')
        return redirect(request.referrer)
    
    # Récupérer les données du formulaire
    nom = request.form.get('nom')
    type_doc = request.form.get('type')
    notes = request.form.get('notes')
    tags = request.form.get('tags')
    client_id = request.form.get('client_id')
    
    # Validation de base
    if not nom:
        flash('Le nom du document est obligatoire.', 'danger')
        return redirect(request.referrer)
    
    # Sécurisation du nom de fichier et création d'un nom unique
    filename = secure_filename(fichier.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    
    # Créer le dossier uploads s'il n'existe pas
    uploads_dir = os.path.join(current_app.root_path, 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    # Chemin complet du fichier
    filepath = os.path.join(uploads_dir, unique_filename)
    
    try:
        # Enregistrer le fichier
        fichier.save(filepath)
        
        # Déterminer le format (extension) du fichier
        format_fichier = os.path.splitext(filename)[1][1:].lower()
        
        # Obtenir la taille du fichier
        taille_fichier = os.path.getsize(filepath)
        
        # Créer le document dans la base de données
        document = Document(
            nom=nom,
            chemin=unique_filename,
            type=type_doc,
            format=format_fichier,
            taille=taille_fichier,
            notes=notes,
            tags=tags,
            date_upload=datetime.utcnow(),
            user_id=current_user.id
        )
        
        if client_id:
            document.client_id = int(client_id)
        
        db.session.add(document)
        db.session.commit()
        
        flash('Document téléversé avec succès.', 'success')
        
    except Exception as e:
        flash(f'Erreur lors du téléversement du document : {str(e)}', 'danger')
        if os.path.exists(filepath):
            os.remove(filepath)
    
    return redirect(request.referrer)

@documents_bp.route('/view/<int:document_id>')
@login_required
def view_document(document_id):
    """Afficher un document"""
    document = Document.query.get_or_404(document_id)
    client = None
    if document.client_id:
        client = Client.query.get(document.client_id)
    return render_template('documents/view.html', document=document, client=client)

@documents_bp.route('/edit/<int:document_id>', methods=['GET', 'POST'])
@login_required
@requires_roles('admin', 'superadmin')
def edit_document(document_id):
    """Modifier un document"""
    document = Document.query.get_or_404(document_id)
    # Récupérer la liste des clients pour le select field
    clients = Client.query.filter_by(statut='actif').all()
    form = DocumentForm(obj=document)
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    
    if request.method == 'POST' and form.validate_on_submit():
        form.populate_obj(document)
        
        if 'fichier' in request.files and request.files['fichier'].filename != '':
            fichier = request.files['fichier']
            filename = secure_filename(fichier.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            
            # Supprimer l'ancien fichier
            old_filepath = os.path.join(current_app.root_path, 'uploads', document.chemin)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)
            
            # Enregistrer le nouveau fichier
            filepath = os.path.join(current_app.root_path, 'uploads', unique_filename)
            fichier.save(filepath)
            
            document.chemin = unique_filename
            document.format = os.path.splitext(filename)[1][1:].lower()
            document.taille = os.path.getsize(filepath)
        
        try:
            db.session.commit()
            flash('Document modifié avec succès.', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la modification du document : {str(e)}', 'danger')
        
        return redirect(url_for('documents.client_documents', client_id=document.client_id))
    
    return render_template('documents/edit.html', document=document, form=form)

@documents_bp.route('/delete/<int:document_id>', methods=['POST'])
@login_required
@requires_roles('admin', 'superadmin')
def delete_document(document_id):
    """Supprimer un document"""
    document = Document.query.get_or_404(document_id)
    client_id = document.client_id
    
    try:
        # Supprimer le fichier physique
        filepath = os.path.join(current_app.root_path, 'uploads', document.chemin)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # Supprimer l'entrée dans la base de données
        db.session.delete(document)
        db.session.commit()
        
        flash('Document supprimé avec succès.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erreur lors de la suppression du document : {str(e)}', 'danger')
    
    return redirect(url_for('documents.client_documents', client_id=client_id))

@documents_bp.route('/download/<int:document_id>')
@login_required
def download_document(document_id):
    """Télécharger un document"""
    document = Document.query.get_or_404(document_id)
    filepath = os.path.join(current_app.root_path, 'uploads', document.chemin)
    
    if not os.path.exists(filepath):
        flash('Le fichier n\'existe plus sur le serveur.', 'danger')
        return redirect(request.referrer)
    
    return send_file(
        filepath,
        as_attachment=True,
        download_name=f"{document.nom}.{document.format}"
    )

@documents_bp.route('/client/<int:client_id>')
@login_required
def client_documents(client_id):
    """Afficher les documents d'un client"""
    client = Client.query.get_or_404(client_id)
    documents = Document.query.filter_by(client_id=client_id).order_by(Document.date_upload.desc()).all()
    form = DocumentForm()
    return render_template('documents/client_documents.html', client=client, documents=documents, form=form)

@documents_bp.route('/prestation/<int:prestation_id>')
@login_required
def prestation_documents(prestation_id):
    """Afficher les documents d'une prestation"""
    prestation = Prestation.query.get_or_404(prestation_id)
    documents = Document.query.filter_by(prestation_id=prestation_id).order_by(Document.date_upload.desc()).all()
    return render_template('documents/prestation_documents.html', prestation=prestation, documents=documents)