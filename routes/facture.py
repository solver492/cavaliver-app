import os
from flask import Blueprint, render_template, redirect, url_for, flash, request, send_file
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import Facture, Client, Prestation, FichierFacture
from extensions import db
from forms import FactureSearchForm, FactureForm
from utils_modules.notifications import is_authorized

facture_bp = Blueprint('facture', __name__)


@facture_bp.route('/')
@login_required
def index():
    factures = Facture.query.all()
    form = FactureSearchForm()
    return render_template('factures/index.html', factures=factures, form=form, title='Gestion des factures')

@facture_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    form = FactureForm()
    
    # Récupérer la liste des clients et prestations pour les champs select
    clients = Client.query.filter_by(archive=False).all()
    prestations = Prestation.query.filter_by(archive=False).all()
    
    # Mettre à jour les choix des champs select
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    form.prestation_id.choices = [(p.id, f"Prestation #{p.id} - {p.adresse_depart[:30]}...") for p in prestations]
    
    if form.validate_on_submit():
        facture = Facture(
            client_id=form.client_id.data,
            prestation_id=form.prestation_id.data,
            societe=form.societe.data,
            numero=form.numero.data,
            date_emission=form.date_emission.data,
            date_echeance=form.date_echeance.data,
            montant_ht=form.montant_ht.data,
            taux_tva=form.taux_tva.data,
            montant_ttc=form.montant_ttc.data,
            statut=form.statut.data,
            notes=form.notes.data,
            commercial_id=current_user.id,
            mode_paiement=form.mode_paiement.data
        )
        db.session.add(facture)
        db.session.commit()
        flash('Facture créée avec succès.', 'success')
        return redirect(url_for('facture.index'))
    return render_template('factures/add.html', form=form, title='Ajouter une facture')

@facture_bp.route('/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit(id):
    facture = Facture.query.get_or_404(id)
    form = FactureForm(obj=facture)
    
    # Récupérer la liste des clients et prestations pour les champs select
    clients = Client.query.filter_by(archive=False).all()
    prestations = Prestation.query.filter_by(archive=False).all()
    
    # Mettre à jour les choix des champs select
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    form.prestation_id.choices = [(p.id, f"Prestation #{p.id} - {p.adresse_depart[:30]}...") for p in prestations]
    
    if form.validate_on_submit():
        facture.client_id = form.client_id.data
        facture.prestation_id = form.prestation_id.data
        facture.societe = form.societe.data
        facture.numero = form.numero.data
        facture.date_emission = form.date_emission.data
        facture.date_echeance = form.date_echeance.data
        facture.montant_ht = form.montant_ht.data
        facture.taux_tva = form.taux_tva.data
        facture.montant_ttc = form.montant_ttc.data
        facture.statut = form.statut.data
        facture.notes = form.notes.data
        facture.mode_paiement = form.mode_paiement.data
        
        db.session.commit()
        flash('Facture modifiée avec succès.', 'success')
        return redirect(url_for('facture.index'))
        
    return render_template('factures/edit.html', form=form, facture=facture, title='Modifier une facture')

@facture_bp.route('/view/<int:id>')
@login_required
def view(id):
    facture = Facture.query.get_or_404(id)
    client = facture.client
    return render_template('factures/view.html', facture=facture, client=client, title='Détails de la facture')

@facture_bp.route('/delete/<int:id>', methods=['POST'])
@login_required
def delete(id):
    facture = Facture.query.get_or_404(id)
    db.session.delete(facture)
    db.session.commit()
    flash('Facture supprimée avec succès.', 'success')
    return redirect(url_for('facture.index'))

@facture_bp.route('/upload_file/<int:facture_id>', methods=['POST'])
@login_required
def upload_file(facture_id):
    facture = Facture.query.get_or_404(facture_id)
    if 'file' not in request.files:
        flash('Aucun fichier sélectionné', 'error')
        return redirect(url_for('facture.view', id=facture_id))

    file = request.files['file']
    if file.filename == '':
        flash('Aucun fichier sélectionné', 'error')
        return redirect(url_for('facture.view', id=facture_id))

    if file:
        type_fichier = request.form.get('type_fichier', 'autre')
        filename = secure_filename(file.filename)
        chemin = os.path.join('uploads', filename)
        fichier = FichierFacture(
            facture_id=facture_id,
            nom_fichier=filename,
            chemin_fichier=chemin,
            type_fichier=type_fichier
        )
        db.session.add(fichier)
        file.save(chemin)
        db.session.commit()
        flash('Fichier téléversé avec succès', 'success')

    return redirect(url_for('facture.view', id=facture_id))

@facture_bp.route('/download/<int:fichier_id>')
@login_required
def download_file(fichier_id):
    fichier = FichierFacture.query.get_or_404(fichier_id)
    if not os.path.exists(fichier.chemin_fichier):
        flash('Le fichier n\'existe pas sur le serveur', 'error')
        return redirect(url_for('facture.view', id=fichier.facture_id))
    return send_file(fichier.chemin_fichier, as_attachment=True, download_name=fichier.nom_fichier)

@facture_bp.route('/delete_file/<int:facture_id>', methods=['GET'])
@login_required
def delete_file(facture_id):
    file_id = request.args.get('file_id')
    if not file_id:
        flash('ID du fichier manquant', 'error')
        return redirect(url_for('facture.view', id=facture_id))

    fichier = FichierFacture.query.get_or_404(file_id)
    if fichier.facture_id != facture_id:
        flash('Fichier non autorisé', 'error')
        return redirect(url_for('facture.view', id=facture_id))

    try:
        # Supprimer le fichier physique
        os.remove(os.path.join('uploads', fichier.nom_fichier))
    except:
        pass # Ignorer si le fichier n'existe pas

    # Supprimer l'entrée de la base de données
    db.session.delete(fichier)
    db.session.commit()

    flash('Fichier supprimé avec succès', 'success')
    return redirect(url_for('facture.view', id=facture_id))