import os
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app, abort, send_file
from werkzeug.utils import secure_filename
from flask_login import login_required, current_user
from sqlalchemy import and_
from datetime import datetime, timedelta
from forms import AgendaForm
from sqlalchemy import and_
import logging

from extensions import db
from models import Prestation, Stockage, Agenda, Document, Evenement, User, TypeVehicule, EvenementVersion

calendrier_bp = Blueprint('calendrier', __name__, url_prefix='/calendrier')

@calendrier_bp.app_template_filter('format_date')
def format_date(date):
    if date:
        return date.strftime('%d/%m/%Y')
    return ''


@calendrier_bp.route('/agendas')
@login_required
def liste_agendas():
    try:
        form = AgendaForm()
        form.user_id.data = current_user.id

        # Récupérer les agendas dont l'utilisateur est propriétaire
        agendas_propres = Agenda.query.filter_by(user_id=current_user.id, archive=False).all()
        
        # Récupérer les agendas partagés avec l'utilisateur
        agendas_partages = current_user.agendas_partages.filter_by(archive=False).all()
        
        # Combiner les deux listes
        agendas = agendas_propres + agendas_partages
        
        return render_template(
            'calendrier/agendas.html',
            agendas=agendas,
            agendas_propres=len(agendas_propres),
            agendas_partages=len(agendas_partages),
            form=form,
            now=datetime.utcnow,
            Evenement=Evenement,
            and_=and_,
            est_proprietaire=lambda a: a.user_id == current_user.id
        )
    except Exception as e:
        current_app.logger.error(f'Erreur lors de l\'affichage des agendas: {str(e)}')
        flash('Une erreur est survenue lors du chargement des agendas.', 'danger')
        return redirect(url_for('dashboard.index'))


@calendrier_bp.route('/api/agendas/<int:agenda_id>', methods=['GET'])
@login_required
def get_agenda_details(agenda_id):
    agenda = Agenda.query.get_or_404(agenda_id)
    
    # Vérifier que l'utilisateur a accès à cet agenda
    if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
    return jsonify({
        'success': True,
        'agenda': {
            'id': agenda.id,
            'nom': agenda.nom,
            'type_agenda': agenda.type_agenda,
            'description': agenda.description,
            'couleur': agenda.couleur,
            'observations': agenda.observations or []
        }
    })

@calendrier_bp.route('/agendas/<int:agenda_id>/partage', methods=['GET', 'POST'])
@login_required
def partager_agenda(agenda_id):
    agenda = Agenda.query.get_or_404(agenda_id)
    
    # Vérifier que l'utilisateur est le propriétaire de l'agenda
    if agenda.user_id != current_user.id:
        flash('Vous n\'avez pas les droits pour partager cet agenda.', 'danger')
        return redirect(url_for('calendrier.liste_agendas'))
    
    # Récupérer la liste des commerciaux
    commerciaux = User.query.filter(User.role == 'commercial').all()
    
    if request.method == 'POST':
        user_id = request.form.get('user_id')
        if user_id:
            user = User.query.get(user_id)
            if user and user.role == 'commercial':
                # Vérifier si l'agenda n'est pas déjà partagé avec cet utilisateur
                if user not in agenda.utilisateurs_partages:
                    agenda.utilisateurs_partages.append(user)
                    db.session.commit()
                    flash(f'Agenda partagé avec {user.prenom} {user.nom}', 'success')
                else:
                    flash('L\'agenda est déjà partagé avec cet utilisateur', 'warning')
            else:
                flash('Utilisateur invalide', 'danger')
        else:
            flash('Veuillez sélectionner un utilisateur', 'warning')
        return redirect(url_for('calendrier.liste_agendas'))
    
    return render_template('calendrier/partage_agenda.html', agenda=agenda, commerciaux=commerciaux)

@calendrier_bp.route('/agendas/<int:agenda_id>/modifier', methods=['GET', 'POST'])
@login_required
def modifier_agenda(agenda_id):
    agenda = Agenda.query.get_or_404(agenda_id)
    
    # Vérifier que l'utilisateur a accès à cet agenda
    if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
        flash('Accès non autorisé', 'danger')
        return redirect(url_for('calendrier.liste_agendas'))
    
    # Créer une instance du formulaire AgendaForm
    form = AgendaForm(obj=agenda)
    form.user_id.data = current_user.id
    
    if request.method == 'POST':
        try:
            agenda.nom = request.form.get('nom')
            agenda.type_agenda = request.form.get('type_agenda')
            agenda.description = request.form.get('description')
            agenda.couleur = request.form.get('couleur', '#3498db')
            
            # Gérer les observations
            observations = [obs.strip() for obs in request.form.getlist('observations[]') if obs.strip()]
            agenda.observations = observations
            
            # Gérer les documents
            files = request.files.getlist('documents[]')
            for file in files:
                if file and file.filename:
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'agendas', str(agenda_id), filename)
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    file.save(file_path)
                    
                    document = Document(
                        nom=filename,
                        chemin=file_path,
                        type='agenda_document',
                        agenda_id=agenda.id
                    )
                    db.session.add(document)
            
            db.session.commit()
            flash('Agenda modifié avec succès!', 'success')
            return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la modification de l\'agenda: {str(e)}', 'danger')
    
    return render_template('calendrier/modifier_agenda.html', agenda=agenda, form=form)

@calendrier_bp.route('/agendas/nouveau', methods=['POST'])
@login_required
def nouveau_agenda():
    form = AgendaForm()

    if not form.csrf_token.data:
        form.csrf_token.data = request.cookies.get('csrf_token')

    try:
        if form.validate_on_submit():
            observations = [obs.strip() for obs in request.form.getlist('observations[]') if obs.strip()]
            
            # Vérifier si un agenda avec le même nom existe déjà pour cet utilisateur
            existing_agenda = Agenda.query.filter_by(
                user_id=current_user.id,
                nom=form.nom.data,
                archive=False
            ).first()
            
            if existing_agenda:
                flash('Un agenda avec ce nom existe déjà.', 'danger')
                return redirect(url_for('calendrier.liste_agendas'))
            
            agenda = Agenda(
                nom=form.nom.data,
                type_agenda=form.type_agenda.data,
                description=form.description.data or '',
                couleur=request.form.get('couleur', '#3498db'),
                observations=observations if observations else None,
                user_id=current_user.id
            )
            db.session.add(agenda)
            db.session.flush()  # Pour obtenir l'ID de l'agenda sans faire un commit complet
            
            # Gérer les documents uploadés
            files = request.files.getlist('documents[]')
            for file in files:
                if file and file.filename:
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'agendas', str(agenda.id), filename)
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    file.save(file_path)
                    
                    document = Document(
                        nom=filename,
                        chemin=file_path,
                        type='agenda_document',
                        agenda_id=agenda.id,
                        user_id=current_user.id
                    )
                    db.session.add(document)
            
            db.session.commit()
            flash('Agenda créé avec succès!', 'success')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    flash(f'Erreur dans le champ {field}: {error}', 'danger')
    except Exception as e:
        db.session.rollback()
        flash(f'Erreur lors de la création de l\'agenda: {str(e)}', 'danger')

    return redirect(url_for('calendrier.liste_agendas'))


@calendrier_bp.route('/agendas/<int:agenda_id>')
@login_required
def voir_agenda(agenda_id):
    try:
        agenda = Agenda.query.get_or_404(agenda_id)
        
        # Vérifier que l'utilisateur a accès à cet agenda
        if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
            flash('Accès non autorisé', 'danger')
            return redirect(url_for('calendrier.liste_agendas'))
        
        # Récupérer les événements non archivés
        evenements = Evenement.query.filter_by(agenda_id=agenda_id, archive=False).order_by(Evenement.date_debut.desc()).all()
        
        # Formater les événements pour FullCalendar - Version simplifiée sans utiliser l'attribut version
        events_data = []
        for evt in evenements:
            # Créer un dictionnaire avec les données de base de l'événement
            event = {
                'id': evt.id,
                'title': evt.titre,
                'start': evt.date_debut.isoformat(),
                'end': evt.date_fin.isoformat() if evt.date_fin else None,
                'observations': evt.observations,
                'type': evt.type_evenement,
                'backgroundColor': '#3498db',
                'borderColor': '#3498db',
                'textColor': '#ffffff',
                'extendedProps': {
                    'type': evt.type_evenement,
                    'observations': evt.observations if hasattr(evt, 'observations') else '',
                    'prestation': None,
                    'prestation_id': evt.prestation_id if hasattr(evt, 'prestation_id') else None,
                    # Utiliser la valeur réelle de l'attribut archive
                    'archive': evt.archive,
                    'version': evt.version if hasattr(evt, 'version') else 1
                }
            }
            
            # Si l'événement a une prestation assignée, ajouter les détails de la prestation
            if hasattr(evt, 'prestation_id') and evt.prestation_id:
                prestation = Prestation.query.get(evt.prestation_id)
                if prestation:
                    event['extendedProps']['prestation'] = {
                        'id': prestation.id,
                        'type_demenagement': prestation.type_demenagement,
                        'client_nom': prestation.client.nom if prestation.client else 'Non spécifié',
                        'client_prenom': prestation.client.prenom if prestation.client else '',
                        'date_debut': prestation.date_debut.isoformat() if prestation.date_debut else None
                    }
            
            events_data.append(event)
        
        # Récupérer les prestations non archivées où l'utilisateur est soit le commercial, soit le créateur
        # ou si l'utilisateur est admin/superadmin
        prestations = Prestation.query.filter(
            (Prestation.commercial_id == current_user.id) | 
            (Prestation.createur_id == current_user.id) |
            (current_user.role in ['admin', 'superadmin'])
        ).filter(
            Prestation.archive == False
        ).order_by(Prestation.date_debut.desc()).all()
        
        # Log pour le débogage
        current_app.logger.info(f"Nombre de prestations récupérées: {len(prestations)}")

        return render_template('calendrier/agenda_detail.html', 
                            agenda=agenda, 
                            evenements= events_data,
                            prestations=prestations,
                            config=current_app.config)
    except Exception as e:
        flash(f"Erreur lors du chargement de l'agenda: {str(e)}", 'danger')
        return redirect(url_for('calendrier.liste_agendas'))


@calendrier_bp.route('/agendas/<int:agenda_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_agenda(agenda_id):
    agenda = Agenda.query.get_or_404(agenda_id)
    if agenda.user_id != current_user.id:
        abort(403)

    if request.method == 'POST':
        try:
            agenda.nom = request.form.get('nom')
            agenda.type_agenda = request.form.get('type_agenda')
            agenda.couleur = request.form.get('couleur')
            agenda.description = request.form.get('description')
            db.session.commit()
            flash('Agenda modifié avec succès!', 'success')
            return redirect(url_for('calendrier.liste_agendas'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la modification: {str(e)}', 'danger')

    return jsonify({
        'nom': agenda.nom,
        'type_agenda': agenda.type_agenda,
        'couleur': agenda.couleur,
        'description': agenda.description
    })





@calendrier_bp.route('/agendas/<int:agenda_id>/archive', methods=['POST'])
@login_required
def archive_agenda(agenda_id):
    agenda = Agenda.query.get_or_404(agenda_id)
    if agenda.user_id != current_user.id:
        abort(403)
    agenda.archive = True
    db.session.commit()
    return jsonify({'success': True})


@calendrier_bp.route('/agendas/<int:agenda_id>/delete', methods=['POST'])
@login_required
def supprimer_agenda(agenda_id):
    try:
        agenda = Agenda.query.get_or_404(agenda_id)
        if agenda.user_id != current_user.id:
            flash('Vous n\'avez pas la permission de supprimer cet agenda.', 'danger')
            return redirect(url_for('calendrier.liste_agendas'))
            
        # Supprimer tous les événements associés
        Evenement.query.filter_by(agenda_id=agenda_id).delete()
        
        # Supprimer l'agenda
        db.session.delete(agenda)
        db.session.commit()
        
        flash('L\'agenda a été supprimé avec succès.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Une erreur est survenue lors de la suppression : {str(e)}', 'danger')
        
    return redirect(url_for('calendrier.liste_agendas'))


@calendrier_bp.route('/agendas/<int:agenda_id>/evenements/creer', methods=['POST'])
@login_required
def creer_evenement(agenda_id):
    agenda = Agenda.query.get_or_404(agenda_id)
    # Vérifier si l'utilisateur est le propriétaire ou si l'agenda est partagé avec lui
    if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages.all():
        abort(403)

    try:
        date_debut = datetime.fromisoformat(request.form.get('date_debut'))
        date_fin = None
        if request.form.get('date_fin'):
            date_fin = datetime.fromisoformat(request.form.get('date_fin'))

        # Gérer les observations comme une liste
        observations = request.form.getlist('observations[]')
        if not observations:
            observations = [request.form.get('observations')] if request.form.get('observations') else []
        
        # Filtrer les observations vides
        observations = [obs for obs in observations if obs and obs.strip()]
        
        # Joindre les observations avec le séparateur spécial
        observations_text = '|||'.join(observations)

        evenement = Evenement(
            agenda_id=agenda_id,
            titre=request.form.get('titre'),
            type_evenement=request.form.get('type_evenement'),
            date_debut=date_debut,
            date_fin=date_fin,
            observations=observations_text,
            user_id=current_user.id
        )
        db.session.add(evenement)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@calendrier_bp.route('/documents/<int:doc_id>/telecharger')
@login_required
def telecharger_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    return send_file(doc.chemin, as_attachment=True)

@calendrier_bp.route('/documents/<int:doc_id>/supprimer', methods=['DELETE'])
@login_required
def supprimer_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    evenement_id = doc.evenement_id
    
    try:
        # Supprimer le fichier physique
        if os.path.exists(doc.chemin):
            os.remove(doc.chemin)
        
        # Supprimer l'entrée en base
        db.session.delete(doc)
        db.session.commit()
        
        return jsonify({'success': True, 'evenement_id': evenement_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/evenements/<int:event_id>/details')
@login_required
def voir_details_evenement(event_id):
    evt = Evenement.query.get_or_404(event_id)
    # Convertir les observations en liste
    observations = evt.observations.split('|||') if evt.observations else []
    return jsonify({
        'id': evt.id,
        'titre': evt.titre,
        'type_evenement': evt.type_evenement,
        'date_debut': evt.date_debut.strftime('%d/%m/%Y %H:%M'),
        'date_fin': evt.date_fin.strftime('%d/%m/%Y %H:%M') if evt.date_fin else None,
        'observations': observations,
        'prestation': {'reference': evt.prestation.reference} if evt.prestation else None
    })

@calendrier_bp.route('/evenements/<int:event_id>/documents')
@login_required
def liste_documents_evenement(event_id):
    evt = Evenement.query.get_or_404(event_id)
    documents = [{
        'id': doc.id,
        'nom': doc.nom,
        'type': doc.type,
        'date_upload': doc.date_upload.strftime('%d/%m/%Y %H:%M')
    } for doc in evt.documents]
    return jsonify({'documents': documents})

@calendrier_bp.route('/documents/upload', methods=['POST'])
@login_required
def upload_document():
    if 'document' not in request.files:
        return jsonify({'success': False, 'error': 'Aucun fichier fourni'})
    
    file = request.files['document']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Nom de fichier invalide'})
    
    evenement_id = request.form.get('evenement_id')
    if not evenement_id:
        return jsonify({'success': False, 'error': 'ID d\'événement manquant'})
    
    evt = Evenement.query.get_or_404(evenement_id)
    
    try:
        # Sauvegarder le fichier
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Créer le document en base
        doc = Document(
            nom=filename,
            chemin=filepath,
            type=request.form.get('type'),
            notes=request.form.get('notes'),
            evenement_id=evenement_id,
            user_id=current_user.id
        )
        db.session.add(doc)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/evenements/<int:event_id>/assigner-prestation', methods=['POST'])
@login_required
def assigner_prestation(event_id):
    evenement = Evenement.query.get_or_404(event_id)
    if evenement.user_id != current_user.id:
        abort(403)

    prestation_id = request.form.get('prestation_id')
    if not prestation_id:
        return jsonify({'success': False, 'error': 'ID de prestation manquant'})

    try:
        prestation = Prestation.query.get_or_404(prestation_id)
        # Vérifier si l'utilisateur est autorisé à assigner cette prestation
        if not current_user.is_admin() and prestation.commercial_id != current_user.id:
            abort(403)

        evenement.prestation = prestation
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/agendas/<int:agenda_id>/evenements', methods=['GET'])
@login_required
def get_evenements(agenda_id):
    evenements = Evenement.query.filter_by(
        agenda_id=agenda_id,
        user_id=current_user.id
    ).all()
    
    events_data = [{
        'id': evt.id,
        'title': evt.titre,
        'start': evt.date_debut.isoformat(),
        'end': evt.date_fin.isoformat() if evt.date_fin else None,
        'archive': evt.archive,
        'backgroundColor': '#FF0000' if evt.archive else '#3498db'
    } for evt in evenements]
    
    return jsonify({'success': True, 'evenements': events_data})

@calendrier_bp.route('/agendas/<int:agenda_id>/evenements/<int:event_id>/desarchiver', methods=['POST'])
@login_required
def desarchiver_evenement(agenda_id, event_id):
    evenement = Evenement.query.get_or_404(event_id)
    if evenement.user_id != current_user.id or evenement.agenda_id != agenda_id:
        abort(403)
    
    evenement.archive = False
    db.session.commit()
    return jsonify({'success': True})


@calendrier_bp.route('/agendas/<int:agenda_id>/evenements/<int:event_id>/supprimer', methods=['DELETE'])
@login_required
def supprimer_evenement(agenda_id, event_id):
    evenement = Evenement.query.get_or_404(event_id)
    if evenement.user_id != current_user.id or evenement.agenda_id != agenda_id:
        abort(403)
    
    db.session.delete(evenement)
    db.session.commit()
    return jsonify({'success': True})

@calendrier_bp.route('/evenements/<int:evenement_id>/details')
@login_required
def details_evenement(evenement_id):
    evenement = Evenement.query.get_or_404(evenement_id)
    if evenement.agenda.user_id != current_user.id:
        abort(403)
    
    data = evenement.to_dict()
    if evenement.prestation:
        data['prestation'] = {
            'id': evenement.prestation.id,
            'reference': evenement.prestation.reference
        }
    return jsonify(data)

@calendrier_bp.route('/evenements/<int:evenement_id>/modifier', methods=['POST'])
@login_required
def modifier_evenement(evenement_id):
    evenement = Evenement.query.get_or_404(evenement_id)
    if evenement.agenda.user_id != current_user.id:
        abort(403)
    
    try:
        date_debut = datetime.fromisoformat(request.form.get('date_debut'))
        date_fin = None
        if request.form.get('date_fin'):
            date_fin = datetime.fromisoformat(request.form.get('date_fin'))
        
        evenement.titre = request.form.get('titre')
        evenement.type_evenement = request.form.get('type_evenement')
        evenement.date_debut = date_debut
        evenement.date_fin = date_fin
        
        # Gérer les observations comme une liste
        observations = request.form.getlist('observations[]')
        if not observations:
            observations = [request.form.get('observations')] if request.form.get('observations') else []
        
        # Filtrer les observations vides
        observations = [obs for obs in observations if obs and obs.strip()]
        
        # Joindre les observations avec le séparateur spécial
        evenement.observations = " ||| ".join(observations) if observations else None
        
        db.session.commit()

        evenement_afficher = Evenement.query.get_or_404(evenement_id)
        agenda = Agenda.query.get_or_404(evenement.agenda_id)
        
        versions = EvenementVersion.query.filter_by(evenement_id=evenement.id).order_by(EvenementVersion.version.desc()).all()
        
        return render_template(
        'calendrier/modifier_evenement.html',
        evenement=evenement_afficher,
        agenda=agenda,
        versions=versions
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/agendas/<int:agenda_id>/evenements/<int:event_id>/archiver', methods=['POST'])
@login_required
def archiver_evenement(agenda_id, event_id):
    evenement = Evenement.query.get_or_404(event_id)
    if evenement.user_id != current_user.id or evenement.agenda_id != agenda_id:
        abort(403)
    
    evenement.archive = True
    db.session.commit()
    return jsonify({'success': True})


@calendrier_bp.route('/api/prestations/calendrier')
@login_required
def get_prestations_calendrier():
    """Récupère les prestations pour le calendrier avec toutes les informations nécessaires"""
    try:
        # Récupérer les prestations où l'utilisateur est soit le commercial, soit le créateur
        prestations = Prestation.query.filter(
            (Prestation.commercial_id == current_user.id) | 
            (Prestation.createur_id == current_user.id) |
            (current_user.role == 'admin')  # Les admins voient toutes les prestations
        ).all()
        
        # Formater les prestations pour le calendrier avec toutes les informations nécessaires
        events = []
        for prestation in prestations:
            # Récupérer les informations du client
            client_nom = prestation.client.nom if prestation.client else 'Client non défini'
            client_prenom = prestation.client.prenom if prestation.client else ''
            
            events.append({
                'id': prestation.id,
                'title': f"{prestation.type_demenagement} - {client_nom} - ID:{prestation.id}",
                'start': prestation.date_debut.isoformat(),
                'end': prestation.date_fin.isoformat() if prestation.date_fin else None,
                'description': prestation.observations,
                'location': f"De: {prestation.adresse_depart} À: {prestation.adresse_arrivee}",
                'status': prestation.statut,
                'className': f"prestation-status-{prestation.statut.lower()}",
                # Ajouter toutes les informations nécessaires dans extendedProps
                'extendedProps': {
                    'statut': prestation.statut,
                    'type_demenagement': prestation.type_demenagement,
                    'adresse_depart': prestation.adresse_depart,
                    'adresse_arrivee': prestation.adresse_arrivee,
                    'observations': prestation.observations,
                    'client_nom': client_nom,
                    'client_prenom': client_prenom,
                    'client_id': prestation.client_id if prestation.client else None,
                    'commercial_id': prestation.commercial_id,
                    'createur_id': prestation.createur_id,
                    'date_creation': prestation.date_creation.isoformat() if prestation.date_creation else None,
                    'date_modification': prestation.date_modification.isoformat() if prestation.date_modification else None
                }
            })
        
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calendrier_bp.route('/fullscreen')
@login_required
def fullscreen():
    return render_template(
        'calendrier/fullscreen.html',
        title='Calendrier des prestations'
    )


@calendrier_bp.route('/api/evenements/<int:evenement_id>', methods=['PATCH', 'DELETE'])
@login_required
def api_evenement(evenement_id):
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        
        if request.method == 'PATCH':
            data = request.json
            if 'observations' in data:
                evenement.observations = data['observations']
            db.session.commit()
            return jsonify({'success': True})
            
        elif request.method == 'DELETE':
            db.session.delete(evenement)
            db.session.commit()
            return jsonify({'success': True})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@calendrier_bp.route('/api/evenements/<int:evenement_id>/prestation', methods=['GET'])
@login_required
def get_prestation_evenement(evenement_id):
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        if evenement.prestation:
            return jsonify({
                'success': True,
                'prestation': {
                    'id': evenement.prestation.id,
                    'client': f"{evenement.prestation.client.nom} {evenement.prestation.client.prenom}",
                    'date_debut': evenement.prestation.date_debut.strftime('%d/%m/%Y'),
                    'date_fin': evenement.prestation.date_fin.strftime('%d/%m/%Y'),
                    'adresse_depart': evenement.prestation.adresse_depart,
                    'adresse_arrivee': evenement.prestation.adresse_arrivee,
                    'type_demenagement': evenement.prestation.type_demenagement,
                    'statut': evenement.prestation.statut,
                    'montant': evenement.prestation.montant,
                    'societe': evenement.prestation.societe,
                    'date_creation': evenement.prestation.date_creation.strftime('%d/%m/%Y'),
                    'tags': evenement.prestation.tags,
                    'mode_groupage': evenement.prestation.mode_groupage
                }
            })
        return jsonify({'success': False, 'message': 'Aucune prestation assignée à cet événement'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@calendrier_bp.route('/api/evenements/<int:evenement_id>/documents', methods=['GET', 'POST'])
@login_required
def api_documents_evenement(evenement_id):
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        
        if request.method == 'GET':
            documents = []
            for doc in evenement.documents:
                documents.append({
                    'id': doc.id,
                    'nom': doc.nom,
                    'type': doc.type,
                    'date_creation': doc.date_creation.isoformat()
                })
            return jsonify({'documents': documents})
            
        elif request.method == 'POST':
            if 'document' not in request.files:
                return jsonify({'success': False, 'error': 'Aucun fichier fourni'})
                
            fichier = request.files['document']
            if fichier.filename == '':
                return jsonify({'success': False, 'error': 'Nom de fichier vide'})
                
            if fichier and allowed_file(fichier.filename):
                filename = secure_filename(fichier.filename)
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                fichier.save(filepath)
                
                document = Document(
                    nom=filename,
                    chemin=filepath,
                    type='autre',
                    evenement_id=evenement_id
                )
                db.session.add(document)
                db.session.commit()
                
                return jsonify({'success': True, 'document': {
                    'id': document.id,
                    'nom': document.nom
                }})
            
            return jsonify({'success': False, 'error': 'Type de fichier non autorisé'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/api/documents/<int:document_id>', methods=['DELETE'])
@login_required
def api_document(document_id):
    try:
        document = Document.query.get_or_404(document_id)
        
        # Supprimer le fichier physique
        if os.path.exists(document.chemin):
            os.remove(document.chemin)
            
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/api/evenements/<int:evenement_id>/<action>', methods=['POST'])
@login_required
def api_evenement_action(evenement_id, action):
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        
        if action == 'archiver':
            evenement.archive = True
        elif action == 'desarchiver':
            evenement.archive = False
        else:
            return jsonify({'success': False, 'error': 'Action non valide'})
            
        db.session.commit()
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/api/prestations/liste', methods=['GET'])
@login_required
def api_prestations_disponibles():
    try:
        # Récupérer toutes les prestations accessibles par l'utilisateur
        if current_user.role in ['admin', 'superadmin']:
            prestations = Prestation.query.all()
        else:
            prestations = Prestation.query.filter(
                (Prestation.commercial_id == current_user.id) | 
                (Prestation.createur_id == current_user.id)
            ).all()
        
        prestations_list = [{
            'id': p.id,
            'type': p.type_prestation,
            'client': f"{p.client.nom} {p.client.prenom}" if p.client and hasattr(p.client, 'nom') and hasattr(p.client, 'prenom') else "Client inconnu",
            'date_debut': p.date_debut.strftime('%d/%m/%Y') if p.date_debut else "Date inconnue"
        } for p in prestations]
        
        return jsonify({
            'success': True,
            'prestations': prestations_list
        })
    except Exception as e:
        print(f"Erreur API prestations: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/api/evenements/<int:evenement_id>', methods=['PATCH'])
@login_required
def api_modifier_evenement(evenement_id):
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        data = request.json
        
        if 'titre' in data:
            evenement.titre = data['titre']
        if 'date_debut' in data:
            evenement.date_debut = datetime.fromisoformat(data['date_debut'])
        if 'date_fin' in data:
            evenement.date_fin = datetime.fromisoformat(data['date_fin']) if data['date_fin'] else None
        if 'type_evenement' in data:
            evenement.type_evenement = data['type_evenement']
        if 'observations' in data:
            # Convertir en liste si ce n'est pas déjà le cas
            observations_list = data['observations']
            if not isinstance(observations_list, list):
                observations_list = [observations_list]
            
            # Filtrer les observations vides
            observations_list = [obs for obs in observations_list if obs and obs.strip()]
            
            # Joindre les observations avec le séparateur spécial
            observations_text = '|||'.join(observations_list)
            evenement.observations = observations_text
            
        # Incrémenter la version
        evenement.version = (evenement.version or 1) + 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'version': evenement.version
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/api/evenements/<int:evenement_id>/observations', methods=['POST'])
@login_required
def api_modifier_observations(evenement_id):
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        data = request.json
        
        if 'observations' in data:
            # Convertir en liste si ce n'est pas déjà le cas
            observations_list = data['observations']
            if not isinstance(observations_list, list):
                observations_list = [observations_list]
            
            # Filtrer les observations vides
            observations_list = [obs for obs in observations_list if obs and obs.strip()]
            
            # Joindre les observations avec le séparateur spécial ou mettre à None si pas d'observations
            evenement.observations = '|||'.join(observations_list) if observations_list else None
            
        # Incrémenter la version
        evenement.version = (evenement.version or 1) + 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'version': evenement.version
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/agendas/<int:agenda_id>/evenements/<int:evenement_id>/assigner-prestation')
@login_required
def assigner_prestation_page(agenda_id, evenement_id):
    try:
        # Vérifier que l'événement existe
        evenement = Evenement.query.get_or_404(evenement_id)
        
        # Récupérer les prestations non archivées où l'utilisateur est soit le commercial, soit le créateur
        # ou si l'utilisateur est admin/superadmin
        prestations = Prestation.query.filter(
            (Prestation.commercial_id == current_user.id) | 
            (Prestation.createur_id == current_user.id) |
            (current_user.role in ['admin', 'superadmin'])
        ).filter(
            Prestation.archive == False
        ).order_by(Prestation.date_debut.desc()).all()
        
        # Log pour le débogage
        current_app.logger.info(f"Nombre de prestations récupérées pour la page d'assignation: {len(prestations)}")
        
        return render_template('calendrier/assigner_prestation.html', 
                           evenement_id=evenement_id,
                           prestations=prestations)
    except Exception as e:
        flash(f"Erreur lors du chargement de la page d'assignation: {str(e)}", 'danger')
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda_id))

@calendrier_bp.route('/api/evenements/<int:evenement_id>/assigner-prestation', methods=['POST'])
@login_required
def api_assigner_prestation(evenement_id):
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        
        # Accepter à la fois les données JSON et les données de formulaire
        if request.is_json:
            data = request.json
            prestation_id = data.get('prestation_id')
        else:
            prestation_id = request.form.get('prestation_id')
        
        if not prestation_id:
            return jsonify({'success': False, 'error': 'ID de prestation manquant'})
            
        prestation = Prestation.query.get_or_404(prestation_id)
        
        # Vérifier que l'utilisateur a le droit d'accéder à cette prestation
        if not (current_user.role in ['admin', 'superadmin'] or
                prestation.commercial_id == current_user.id or
                prestation.createur_id == current_user.id):
            return jsonify({'success': False, 'error': 'Accès non autorisé'})
            
        evenement.prestation_id = prestation.id
        db.session.commit()
        
        # Récupérer le client de manière sécurisée
        client_info = "Non défini"
        if prestation.client:
            client_info = f"{prestation.client.nom} {prestation.client.prenom}"
        
        return jsonify({
            'success': True,
            'prestation': {
                'id': prestation.id,
                'type': prestation.type_prestation,
                'client': client_info,
                'date_debut': prestation.date_debut.isoformat() if prestation.date_debut else None
            }
        })
        
    except Exception as e:
        logging.error(f"Erreur lors de l'assignation de prestation: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/api/evenements/<int:evenement_id>/documents', methods=['POST'])
@login_required
def api_ajouter_document(evenement_id):
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        
        if 'document' not in request.files:
            return jsonify({'success': False, 'error': 'Aucun fichier fourni'})
            
        fichier = request.files['document']
        if fichier.filename == '':
            return jsonify({'success': False, 'error': 'Nom de fichier vide'})
            
        if fichier and allowed_file(fichier.filename):
            # Créer un nom de fichier sécurisé avec timestamp pour éviter les doublons
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            filename = secure_filename(f"{timestamp}_{fichier.filename}")
            
            # Créer le dossier d'upload s'il n'existe pas
            upload_folder = os.path.join(os.getcwd(), current_app.config['UPLOAD_FOLDER'])
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
        
            # Créer un sous-dossier pour l'événement si nécessaire
            event_folder = os.path.join(upload_folder, f'event_{evenement_id}')
            os.makedirs(event_folder, exist_ok=True)
            
            # Chemin complet du fichier
            filepath = os.path.join(event_folder, filename)
            
            try:
                # Sauvegarder le fichier
                fichier.save(filepath)
                
                # Créer l'entrée dans la base de données
                document = Document(
                    nom=fichier.filename,  # Nom original pour l'affichage
                    chemin=filepath,
                    type='autre',
                    evenement_id=evenement_id
                )
                db.session.add(document)
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'document': {
                        'id': document.id,
                        'nom': document.nom,
                        'date_creation': document.date_creation.isoformat()
                    }
                })
            
            except Exception as e:
                db.session.rollback()
                return jsonify({'success': False, 'error': str(e)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@calendrier_bp.route('/assigner-prestation-direct', methods=['POST'])
@login_required
def assigner_prestation_direct():
    """Route simplifiée pour assigner une prestation à un événement via un formulaire HTML standard."""
    try:
        # Récupérer les données du formulaire
        evenement_id = request.form.get('evenement_id')
        prestation_id = request.form.get('prestation_id')
        agenda_id = request.form.get('agenda_id')
        
        # Vérifier que les données nécessaires sont présentes
        if not evenement_id or not prestation_id:
            flash('Erreur: Identifiants manquants', 'danger')
            return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda_id))
        
        # Récupérer l'événement et la prestation
        evenement = Evenement.query.get_or_404(evenement_id)
        prestation = Prestation.query.get_or_404(prestation_id)
        
        # Vérifier que l'utilisateur a le droit d'accéder à cette prestation
        if not (current_user.role in ['admin', 'superadmin'] or
                prestation.commercial_id == current_user.id or
                prestation.createur_id == current_user.id):
            flash('Accès non autorisé à cette prestation', 'danger')
            return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda_id))
        
        # Assigner la prestation à l'événement
        evenement.prestation_id = prestation.id
        db.session.commit()
        
        # Afficher un message de succès
        flash(f'Prestation "{prestation.type_demenagement}" assignée avec succès à l\'événement', 'success')
        
        # Rediriger vers la page de l'agenda
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda_id))
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de l'assignation directe de prestation: {str(e)}")
        flash(f'Erreur lors de l\'assignation: {str(e)}', 'danger')
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda_id))

    # Récupérer l'historique des versions
    versions = EvenementVersion.query.filter_by(evenement_id=evenement.id).order_by(EvenementVersion.version.desc()).all()
    
    # Pour l'affichage GET, préparer les données
    return render_template(
        'calendrier/modifier_evenement.html',
        evenement=evenement,
        agenda=agenda,
        versions=versions
    )

@calendrier_bp.route('/evenements/<int:evenement_id>/traiter-modification', methods=['POST'])
@login_required
def traiter_modification_evenement(evenement_id):
    """Traite le formulaire de modification d'un événement et gère le versionnage."""
    evenement = Evenement.query.get_or_404(evenement_id)
    agenda = Agenda.query.get_or_404(evenement.agenda_id)
    
    # Vérifier que l'utilisateur a le droit de modifier cet événement
    if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
        flash("Vous n'avez pas les droits pour modifier cet événement.", 'danger')
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))
    
    try:
        # Créer une version de l'événement avant modification
        version = EvenementVersion(
            evenement_id=evenement.id,
            version=evenement.version or 1,
            titre=evenement.titre,
            type_evenement=evenement.type_evenement,
            date_debut=evenement.date_debut,
            date_fin=evenement.date_fin,
            observations=evenement.observations,
            modifie_par=current_user.id,
            date_modification=datetime.now()
        )
        db.session.add(version)
        
        # Récupérer les données du formulaire
        titre = request.form.get('titre')
        date_debut = datetime.fromisoformat(request.form.get('date_debut'))
        date_fin_str = request.form.get('date_fin')
        date_fin = datetime.fromisoformat(date_fin_str) if date_fin_str and date_fin_str.strip() else None
        type_evenement = request.form.get('type_evenement')
        observations = request.form.getlist('observations[]')
        observations = [obs for obs in observations if obs and obs.strip()]
        observations_text = '|||'.join(observations) if observations else None
        
        # Mettre à jour l'événement
        evenement.titre = titre
        evenement.date_debut = date_debut
        evenement.date_fin = date_fin
        evenement.type_evenement = type_evenement
        evenement.observations = observations_text
        
        # Incrémenter la version
        evenement.version = (evenement.version or 1) + 1
        
        db.session.commit()
        flash('Événement modifié avec succès!', 'success')
        
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))
        
    except Exception as e:
        db.session.rollback()
        flash(f'Erreur lors de la modification: {str(e)}', 'danger')
        return redirect(url_for('calendrier.modifier_evenement_page', evenement_id=evenement_id))
    """Traite le formulaire de modification d'un événement et redirige vers la page de l'agenda."""
    evenement = Evenement.query.get_or_404(evenement_id)
    agenda = Agenda.query.get_or_404(evenement.agenda_id)
    
    # Vérifier que l'utilisateur a le droit de modifier cet événement
    if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
        flash("Vous n'avez pas les droits pour modifier cet événement.", 'danger')
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))
    
    try:
        # Récupérer les données du formulaire
        titre = request.form.get('titre')
        date_debut = datetime.fromisoformat(request.form.get('date_debut'))
        date_fin_str = request.form.get('date_fin')
        date_fin = datetime.fromisoformat(date_fin_str) if date_fin_str and date_fin_str.strip() else None
        type_evenement = request.form.get('type_evenement')
        
        # Récupérer toutes les observations (format array)
        observations = request.form.getlist('observations[]')
        
        # Filtrer les observations vides
        observations = [obs for obs in observations if obs and obs.strip()]
        
        # Joindre les observations avec le séparateur spécial
        observations_text = '|||'.join(observations) if observations else None
        
        # Créer une version de l'événement avant modification
        version = EvenementVersion(
            evenement_id=evenement.id,
            version=evenement.version,
            titre=evenement.titre,
            type_evenement=evenement.type_evenement,
            date_debut=evenement.date_debut,
            date_fin=evenement.date_fin,
            observations=evenement.observations,
            modifie_par=current_user.id,
            date_modification=datetime.now()
        )
        db.session.add(version)
        
        # Mettre à jour l'événement
        evenement.titre = titre
        evenement.date_debut = date_debut
        evenement.date_fin = date_fin
        evenement.type_evenement = type_evenement
        evenement.observations = observations_text
        
        # Incrémenter la version
        evenement.version = (evenement.version or 1) + 1
        
        # Mettre à jour la date de modification
        evenement.date_modification = datetime.now()
        
        db.session.commit()
        
        flash('Événement modifié avec succès!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erreur lors de la modification: {str(e)}', 'danger')
    
    # Rediriger vers la page de l'agenda dans tous les cas
    return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))

@calendrier_bp.route('/evenements/<int:evenement_id>/modifier', methods=['GET'])
@login_required
def modifier_evenement_page(evenement_id):
    """Page dédiée à la modification d'un événement."""
    evenement = Evenement.query.get_or_404(evenement_id)
    agenda = Agenda.query.get_or_404(evenement.agenda_id)
    
    # Vérifier que l'utilisateur a le droit de modifier cet événement
    if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
        flash("Vous n'avez pas les droits pour modifier cet événement.", 'danger')
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))
    
    # Récupérer l'historique des versions
    versions = EvenementVersion.query.filter_by(evenement_id=evenement.id).order_by(EvenementVersion.version.desc()).all()
    
    # Pour l'affichage GET, préparer les données
    return render_template(
        'calendrier/modifier_evenement.html',
        evenement=evenement,
        agenda=agenda,
        versions=versions
    )

@calendrier_bp.route('/evenements/<int:evenement_id>/ajouter-document', methods=['POST'])
@login_required
def ajouter_document_evenement(evenement_id):
    """Ajouter un document à un événement depuis la page de modification."""
    evenement = Evenement.query.get_or_404(evenement_id)
    agenda = Agenda.query.get_or_404(evenement.agenda_id)
    
    # Vérifier que l'utilisateur a le droit de modifier cet événement
    if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
        flash("Vous n'avez pas les droits pour ajouter un document à cet événement.", 'danger')
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))
    
    if 'document' not in request.files:
        flash('Aucun fichier fourni', 'danger')
        return redirect(url_for('calendrier.modifier_evenement_page', evenement_id=evenement_id))
        
    fichier = request.files['document']
    if fichier.filename == '':
        flash('Nom de fichier vide', 'danger')
        return redirect(url_for('calendrier.modifier_evenement_page', evenement_id=evenement_id))
        
    from utils import allowed_file
    
    if fichier and allowed_file(fichier.filename):
        # Créer un nom de fichier sécurisé avec timestamp pour éviter les doublons
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = secure_filename(f"{timestamp}_{fichier.filename}")
        
        # Créer le dossier d'upload s'il n'existe pas
        upload_folder = os.path.join(os.getcwd(), current_app.config['UPLOAD_FOLDER'])
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        # Créer un sous-dossier pour l'événement si nécessaire
        event_folder = os.path.join(upload_folder, f'event_{evenement_id}')
        os.makedirs(event_folder, exist_ok=True)
        
        # Chemin complet du fichier
        filepath = os.path.join(event_folder, filename)
        
        try:
            # Sauvegarder le fichier
            fichier.save(filepath)
            
            # Créer l'entrée dans la base de données
            document = Document(
                nom=fichier.filename,  # Nom original pour l'affichage
                chemin=filepath,
                type='autre',
                evenement_id=evenement_id,
                user_id=current_user.id,
                agenda_id=agenda.id
            )
            db.session.add(document)
            db.session.commit()
            
            flash('Document ajouté avec succès!', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de l\'ajout du document: {str(e)}', 'danger')
    else:
        flash('Type de fichier non autorisé', 'danger')
    
    return redirect(url_for('calendrier.modifier_evenement_page', evenement_id=evenement_id))

@calendrier_bp.route('/documents/<int:document_id>/telecharger-evenement')
@login_required
def telecharger_document_evenement(document_id):
    """Télécharger un document associé à un événement."""
    document = Document.query.get_or_404(document_id)
    
    # Vérifier les droits d'accès
    if document.evenement_id:
        evenement = Evenement.query.get_or_404(document.evenement_id)
        agenda = Agenda.query.get_or_404(evenement.agenda_id)
        if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
            flash("Vous n'avez pas les droits pour télécharger ce document.", 'danger')
            return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))
    
    # Vérifier que le fichier existe
    if not os.path.exists(document.chemin):
        flash('Le fichier demandé n\'existe pas.', 'danger')
        return redirect(url_for('calendrier.voir_agenda', agenda_id=agenda.id))
    
    # Envoyer le fichier
    return send_file(document.chemin, as_attachment=True, download_name=document.nom)

@calendrier_bp.route('/api/evenements/<int:evenement_id>/archiver', methods=['POST'])
@login_required
def api_archiver_evenement(evenement_id):
    """Archive ou désarchive un événement."""
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        agenda = Agenda.query.get_or_404(evenement.agenda_id)
        
        # Vérifier que l'utilisateur a le droit de modifier cet événement
        if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
            return jsonify({'success': False, 'error': "Vous n'avez pas les droits pour archiver cet événement."}), 403
        
        # Archiver l'événement
        evenement.archive = True
        evenement.date_modification = datetime.now()
        
        # Si l'événement est lié à une prestation, ne pas toucher à la prestation
        # Cela permet de maintenir la relation tout en archivant l'événement
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Événement archivé avec succès'})
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de l'archivage de l'événement: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@calendrier_bp.route('/api/evenements/<int:evenement_id>/desarchiver', methods=['POST'])
@login_required
def api_desarchiver_evenement(evenement_id):
    """Désarchive un événement."""
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        agenda = Agenda.query.get_or_404(evenement.agenda_id)
        
        # Vérifier que l'utilisateur a le droit de modifier cet événement
        if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
            return jsonify({'success': False, 'error': "Vous n'avez pas les droits pour désarchiver cet événement."}), 403
        
        # Désarchiver l'événement
        evenement.archive = False
        evenement.date_modification = datetime.now()
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Événement désarchivé avec succès'})
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de la désarchivage de l'événement: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@calendrier_bp.route('/api/evenements/<int:evenement_id>', methods=['DELETE'])
@login_required
def api_supprimer_evenement(evenement_id):
    """Supprime un événement."""
    try:
        evenement = Evenement.query.get_or_404(evenement_id)
        agenda = Agenda.query.get_or_404(evenement.agenda_id)
        
        # Vérifier que l'utilisateur a le droit de supprimer cet événement
        if agenda.user_id != current_user.id and current_user not in agenda.utilisateurs_partages:
            return jsonify({'success': False, 'error': "Vous n'avez pas les droits pour supprimer cet événement."}), 403
        
        # Vérifier si l'événement est lié à une prestation
        if evenement.prestation_id:
            # Ne pas supprimer l'événement, mais le marquer comme archivé
            evenement.archive = True
            evenement.date_modification = datetime.now()
            db.session.commit()
            return jsonify({
                'success': True, 
                'message': "L'événement a été archivé car il est lié à une prestation. Pour le supprimer complètement, veuillez d'abord supprimer la relation avec la prestation."
            })
        
        # Récupérer les documents liés à l'événement
        documents = Document.query.filter_by(evenement_id=evenement_id).all()
        
        # Supprimer les documents liés
        for document in documents:
            # Supprimer le fichier physique si possible
            try:
                if os.path.exists(document.chemin):
                    os.remove(document.chemin)
            except Exception as e:
                logging.error(f"Erreur lors de la suppression du fichier {document.chemin}: {str(e)}")
            
            # Supprimer l'entrée dans la base de données
            db.session.delete(document)
        
        # Supprimer les versions de l'événement
        versions = EvenementVersion.query.filter_by(evenement_id=evenement_id).all()
        for version in versions:
            db.session.delete(version)
        
        # Supprimer l'événement
        db.session.delete(evenement)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Événement supprimé avec succès'})
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de la suppression de l'événement: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500