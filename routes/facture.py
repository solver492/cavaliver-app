from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename

from extensions import db
from models import Facture, Client, Prestation, FichierFacture
from forms import FactureForm, SearchFactureForm
from utils import generate_invoice_number
from config import Config

facture_bp = Blueprint('facture', __name__)

@facture_bp.route('/factures')
@login_required
def index():
    # Vérifier si l'utilisateur peut accéder au module facture
    if not current_user.can_access_module('facture'):
        flash('Vous n\'avez pas l\'autorisation d\'accéder aux factures.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    form = SearchFactureForm()
    
    # Populate client dropdown for filter
    all_clients = [(c.id, f"{c.nom} {c.prenom}") for c in Client.query.order_by(Client.nom).all()]
    form.client_id.choices = [('', 'Tous les clients')] + all_clients
    
    # Populate statut dropdown for filter
    statut_choices = [
        ('', 'Tous les statuts'),
        ('En attente', 'En attente'),
        ('Payée', 'Payée'),
        ('Retard', 'Retard'),
        ('Annulée', 'Annulée')
    ]
    form.statut.choices = statut_choices
    
    # Get filters
    client_id = request.args.get('client_id', type=int)
    statut = request.args.get('statut')
    date_debut_str = request.args.get('date_debut')
    date_fin_str = request.args.get('date_fin')
    
    # Parse dates if provided
    date_debut = None
    date_fin = None
    
    if date_debut_str:
        try:
            date_debut = datetime.strptime(date_debut_str, '%Y-%m-%d')
            form.date_debut.data = date_debut
        except ValueError:
            pass
        
    if date_fin_str:
        try:
            date_fin = datetime.strptime(date_fin_str, '%Y-%m-%d')
            form.date_fin.data = date_fin
        except ValueError:
            pass
    
    # Build query
    factures_query = Facture.query
    
    if client_id:
        factures_query = factures_query.filter_by(client_id=client_id)
        form.client_id.data = client_id
        
    if statut:
        factures_query = factures_query.filter_by(statut=statut)
        form.statut.data = statut
        
    if date_debut:
        factures_query = factures_query.filter(Facture.date_emission >= date_debut)
        
    if date_fin:
        # Add one day to include end date
        next_day = date_fin + timedelta(days=1)
        factures_query = factures_query.filter(Facture.date_emission < next_day)
    
    # Order by most recent first
    factures = factures_query.order_by(Facture.date_emission.desc()).all()
    
    # Calculate totals
    total_ht = sum(f.montant_ht for f in factures)
    total_ttc = sum(f.montant_ttc for f in factures)
    
    # Count by status
    status_counts = {
        'En attente': sum(1 for f in factures if f.statut == 'En attente'),
        'Payée': sum(1 for f in factures if f.statut == 'Payée'),
        'Retard': sum(1 for f in factures if f.statut == 'Retard'),
        'Annulée': sum(1 for f in factures if f.statut == 'Annulée')
    }
    
    return render_template(
        'factures/index.html',
        title='Gestion des Factures',
        factures=factures,
        form=form,
        total_ht=total_ht,
        total_ttc=total_ttc,
        status_counts=status_counts
    )

@facture_bp.route('/factures/add', methods=['GET', 'POST'])
@login_required
def add():
    # Vérifier si l'utilisateur peut créer des factures
    if not current_user.can_access_module('facture'):
        flash('Vous n\'avez pas l\'autorisation de créer des factures.', 'danger')
        return redirect(url_for('facture.index'))
    
    form = FactureForm()
    
    # Generate a new invoice number
    suggested_numero = generate_invoice_number()
    
    # Populate client dropdown
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in 
                             Client.query.filter_by(archive=False).order_by(Client.nom).all()]
    
    # Empty prestation dropdown initially
    form.prestation_id.choices = [('', 'Sélectionner une prestation (facultatif)')]
    
    # Set default date values
    if not form.date_emission.data:
        form.date_emission.data = datetime.now()
    if not form.date_echeance.data:
        form.date_echeance.data = datetime.now() + timedelta(days=30)
    
    # Set the suggested invoice number
    if not form.numero.data:
        form.numero.data = suggested_numero
    
    if form.validate_on_submit():
        # Calculate commission amount if percentage is provided
        commission_montant = form.commission_montant.data
        if form.commission_pourcentage.data and form.montant_ht.data:
            commission_montant = form.montant_ht.data * (form.commission_pourcentage.data / 100)
        
        facture = Facture(
            numero=form.numero.data,
            client_id=form.client_id.data,
            prestation_id=form.prestation_id.data if form.prestation_id.data else None,
            commercial_id=form.commercial_id.data,
            montant_ht=form.montant_ht.data,
            taux_tva=form.taux_tva.data,
            montant_ttc=form.montant_ttc.data,
            date_emission=form.date_emission.data,
            date_echeance=form.date_echeance.data,
            societe=form.societe.data,
            mode_paiement=form.mode_paiement.data,
            statut=form.statut.data,
            notes=form.notes.data,
            montant_acompte=form.montant_acompte.data,
            commission_pourcentage=form.commission_pourcentage.data,
            commission_montant=commission_montant
        )
        
        db.session.add(facture)
        db.session.commit()
        
        flash('Facture ajoutée avec succès!', 'success')
        return redirect(url_for('facture.index'))
    
    return render_template(
        'factures/add.html',
        title='Ajouter une Facture',
        form=form
    )

@facture_bp.route('/factures/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit(id):
    # Vérifier si l'utilisateur peut modifier des factures
    if not current_user.can_access_module('facture'):
        flash('Vous n\'avez pas l\'autorisation de modifier des factures.', 'danger')
        return redirect(url_for('facture.index'))
    
    facture = Facture.query.get_or_404(id)
    form = FactureForm(obj=facture)
    
    # Populate client dropdown
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in 
                             Client.query.filter_by(archive=False).order_by(Client.nom).all()]
    
    # Populate prestation dropdown
    client_prestations = Prestation.query.filter_by(
        client_id=facture.client_id, 
        archive=False
    ).order_by(Prestation.date_debut.desc()).all()
    
    form.prestation_id.choices = [('', 'Sélectionner une prestation (facultatif)')] + [
        (p.id, f"{p.type_demenagement} - {p.adresse_depart} à {p.adresse_arrivee}") 
        for p in client_prestations
    ]
    
    if form.validate_on_submit():
        # Calculate commission amount if percentage is provided
        commission_montant = form.commission_montant.data
        if form.commission_pourcentage.data and form.montant_ht.data:
            commission_montant = form.montant_ht.data * (form.commission_pourcentage.data / 100)
            
        facture.numero = form.numero.data
        facture.client_id = form.client_id.data
        facture.prestation_id = form.prestation_id.data if form.prestation_id.data else None
        facture.montant_ht = form.montant_ht.data
        facture.tva = form.taux_tva.data  # Utiliser le champ tva du modèle
        facture.montant_ttc = form.montant_ttc.data
        facture.date_emission = form.date_emission.data
        facture.date_echeance = form.date_echeance.data
        facture.mode_paiement = form.mode_paiement.data
        facture.statut = form.statut.data
        facture.notes = form.notes.data
        facture.societe = form.societe.data
        facture.montant_acompte = form.montant_acompte.data
        facture.commission_pourcentage = form.commission_pourcentage.data
        facture.commission_montant = commission_montant
        
        db.session.commit()
        
        flash('Facture mise à jour avec succès!', 'success')
        return redirect(url_for('facture.index'))
    
    return render_template(
        'factures/edit.html',
        title='Modifier une Facture',
        form=form,
        facture=facture
    )

@facture_bp.route('/factures/delete/<int:id>')
@login_required
def delete(id):
    if current_user.role not in ['admin', 'super_admin']:
        flash('Vous n\'avez pas l\'autorisation de supprimer des factures.', 'danger')
        return redirect(url_for('facture.index'))
    
    facture = Facture.query.get_or_404(id)
    db.session.delete(facture)
    db.session.commit()
    
    flash('Facture supprimée avec succès!', 'success')
    return redirect(url_for('facture.index'))

@facture_bp.route('/factures/view/<int:id>')
@login_required
def view(id):
    if current_user.role == 'transporteur':
        flash('Vous n\'avez pas l\'autorisation d\'accéder aux factures.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    facture = Facture.query.get_or_404(id)
    client = Client.query.get(facture.client_id)
    prestation = Prestation.query.get(facture.prestation_id) if facture.prestation_id else None
    
    # Récupérer les fichiers associés à cette facture
    fichiers = FichierFacture.query.filter_by(facture_id=id).order_by(FichierFacture.date_upload.desc()).all()
    
    # S'assurer que les montants ne sont pas None pour les calculs dans le template
    if facture.montant_acompte is None:
        facture.montant_acompte = 0
    if facture.montant_ttc is None:
        facture.montant_ttc = 0
    if facture.montant_ht is None:
        facture.montant_ht = 0
    if facture.commission_montant is None:
        facture.commission_montant = 0
    if facture.commission_pourcentage is None:
        facture.commission_pourcentage = 0
    
    return render_template(
        'factures/view.html',
        title=f'Facture {facture.numero}',
        facture=facture,
        client=client,
        prestation=prestation,
        fichiers=fichiers,
        is_admin=current_user.role in ['admin', 'super_admin'],
        is_commercial=(current_user.role == 'commercial' and current_user.id == facture.commercial_id) or current_user.role in ['admin', 'super_admin']
    )

@facture_bp.route('/factures/get-prestations/<int:client_id>')
@login_required
def get_prestations(client_id):
    """Récupère les prestations pour un client donné"""
    try:
        # Récupérer les prestations où l'utilisateur est soit le commercial, soit le créateur
        prestations = Prestation.query.filter(
            Prestation.client_id == client_id,
            Prestation.archive == False,
            (
                (Prestation.commercial_id == current_user.id) | 
                (Prestation.createur_id == current_user.id) |
                (current_user.role.in_(['admin', 'superadmin']))  # Les admins et superadmins voient toutes les prestations
            )
        ).order_by(Prestation.date_debut.desc()).all()
        
        # Formater les prestations pour le select
        prestation_list = [{'id': '', 'text': 'Sélectionner une prestation (facultatif)'}]
        
        for prestation in prestations:
            prestation_list.append({
                'id': prestation.id,
                'text': f"#{prestation.id} - {prestation.type_demenagement}",
                'description': f"De: {prestation.adresse_depart} à {prestation.adresse_arrivee}",
                'date': prestation.date_debut.strftime('%d/%m/%Y'),
                'status': prestation.statut
            })
        
        return jsonify(prestation_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@facture_bp.route('/factures/<int:facture_id>/upload-file', methods=['POST'])
@login_required
def upload_file(facture_id):
    if current_user.role not in ['admin', 'commercial', 'super_admin']:
        flash('Vous n\'avez pas l\'autorisation d\'ajouter des fichiers.', 'danger')
        return redirect(url_for('facture.view', id=facture_id))
    
    facture = Facture.query.get_or_404(facture_id)
    
    # Vérifier si un fichier a été fourni
    if 'file' not in request.files:
        flash('Aucun fichier n\'a été fourni.', 'danger')
        return redirect(url_for('facture.view', id=facture_id))
    
    file = request.files['file']
    
    # Vérifier si le fichier a un nom
    if file.filename == '':
        flash('Aucun fichier n\'a été sélectionné.', 'danger')
        return redirect(url_for('facture.view', id=facture_id))
    
    # Vérifier si le type de fichier est autorisé
    if not file.filename.endswith('.pdf'):
        flash('Seuls les fichiers PDF sont autorisés.', 'danger')
        return redirect(url_for('facture.view', id=facture_id))
    
    # Vérifier si le type de document a été fourni
    type_fichier = request.form.get('type_fichier')
    if not type_fichier:
        flash('Veuillez spécifier le type de document.', 'danger')
        return redirect(url_for('facture.view', id=facture_id))
    
    # Créer le répertoire de stockage s'il n'existe pas
    upload_folder = os.path.join(Config.UPLOAD_FOLDER, 'factures', str(facture_id))
    os.makedirs(upload_folder, exist_ok=True)
    
    # Sécuriser le nom du fichier et l'enregistrer
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    new_filename = f"{type_fichier}_{timestamp}_{filename}"
    file_path = os.path.join(upload_folder, new_filename)
    
    file.save(file_path)
    
    # Enregistrer les informations du fichier dans la base de données
    fichier = FichierFacture(
        facture_id=facture_id,
        nom_fichier=filename,
        chemin_fichier=file_path,
        type_fichier=type_fichier
    )
    
    db.session.add(fichier)
    db.session.commit()
    
    flash('Fichier ajouté avec succès!', 'success')
    return redirect(url_for('facture.view', id=facture_id))

@facture_bp.route('/factures/download-file/<int:fichier_id>')
@login_required
def download_file(fichier_id):
    fichier = FichierFacture.query.get_or_404(fichier_id)
    facture = Facture.query.get_or_404(fichier.facture_id)
    
    # Vérifier les autorisations (seuls les administrateurs, le commercial concerné et le client concerné)
    if current_user.role == 'transporteur':
        flash('Vous n\'avez pas l\'autorisation de télécharger ce fichier.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Vérifier si le fichier existe
    if not os.path.exists(fichier.chemin_fichier):
        flash('Le fichier demandé n\'existe pas.', 'danger')
        return redirect(url_for('facture.view', id=facture.id))
    
    return send_file(
        fichier.chemin_fichier,
        as_attachment=True,
        download_name=fichier.nom_fichier
    )

@facture_bp.route('/factures/<int:facture_id>/delete-file')
@login_required
def delete_file(facture_id):
    if current_user.role not in ['admin', 'super_admin']:
        flash('Vous n\'avez pas l\'autorisation de supprimer des fichiers.', 'danger')
        return redirect(url_for('facture.view', id=facture_id))
    
    file_id = request.args.get('file_id', type=int)
    if not file_id:
        flash('ID de fichier non spécifié.', 'danger')
        return redirect(url_for('facture.view', id=facture_id))
    
    fichier = FichierFacture.query.get_or_404(file_id)
    
    # Vérifier si le fichier existe et le supprimer du disque
    if os.path.exists(fichier.chemin_fichier):
        os.remove(fichier.chemin_fichier)
    
    # Supprimer l'entrée de la base de données
    db.session.delete(fichier)
    db.session.commit()
    
    flash('Fichier supprimé avec succès!', 'success')
    return redirect(url_for('facture.view', id=facture_id))