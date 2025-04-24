from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
import json

from extensions import db
from models import Prestation, Client, User, prestation_transporteurs

transporteur_bp = Blueprint('transporteur', __name__)

@transporteur_bp.route('/prestations-a-confirmer')
@login_required
def prestations_a_confirmer():
    # Vu00e9rifier que l'utilisateur est bien un transporteur
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas l'autorisation d'accu00e9der u00e0 cette page.", 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Ru00e9cupu00e9rer les prestations qui sont en attente de confirmation
    # et ou00f9 le transporteur est assignu00e9 mais n'a pas encore confirmu00e9
    prestations_a_confirmer = Prestation.query.filter(
        Prestation.statut == 'En attente',
        Prestation.transporteurs.any(id=current_user.id),
        Prestation.archive == False
    ).order_by(Prestation.date_debut).all()
    
    return render_template(
        'transporteur/prestations_a_confirmer.html',
        title='Prestations u00e0 confirmer',
        prestations=prestations_a_confirmer
    )


@transporteur_bp.route('/view-prestation/<int:id>')
@login_required
def view_prestation(id):
    # Vu00e9rifier que l'utilisateur est bien un transporteur
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas l'autorisation d'accu00e9der u00e0 cette page.", 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Ru00e9cupu00e9rer la prestation
    prestation = Prestation.query.filter_by(id=id).first_or_404()
    
    # Vu00e9rifier que le transporteur est bien assignu00e9 u00e0 cette prestation
    if current_user not in prestation.transporteurs:
        flash("Vous n'u00eates pas assignu00e9 u00e0 cette prestation.", 'danger')
        return redirect(url_for('transporteur.prestations_a_confirmer'))
    
    return render_template(
        'transporteur/view_prestation.html',
        title='Du00e9tails de la prestation',
        prestation=prestation
    )


@transporteur_bp.route('/confirmer-prestation/<int:id>', methods=['POST'])
@login_required
def confirmer_prestation(id):
    # Vu00e9rifier que l'utilisateur est bien un transporteur
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas l'autorisation d'effectuer cette action.", 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Ru00e9cupu00e9rer la prestation
    prestation = Prestation.query.filter_by(id=id).first_or_404()
    
    # Vu00e9rifier que le transporteur est bien assignu00e9 u00e0 cette prestation
    if current_user not in prestation.transporteurs:
        flash("Vous n'u00eates pas assignu00e9 u00e0 cette prestation.", 'danger')
        return redirect(url_for('transporteur.prestations_a_confirmer'))
    
    # Vu00e9rifier que la prestation est bien en attente de confirmation
    if prestation.statut != 'En attente':
        flash("Cette prestation n'est plus en attente de confirmation.", 'warning')
        return redirect(url_for('transporteur.prestations_a_confirmer'))
    
    # Action (accept ou refuse)
    action = request.form.get('action', 'accept')
    
    if action == 'accept':
        # Accepter la prestation
        prestation.statut = 'Confirmu00e9e'
        message = f"La prestation pour {prestation.client.nom} {prestation.client.prenom} a u00e9tu00e9 confirmu00e9e avec succu00e8s."
        message_type = 'success'
        
        # TODO: Ajouter notification plus tard
        # Une fois que le modu00e8le Notification sera correctement importu00e9
    else:
        # Refuser la prestation
        prestation.statut = 'Refusu00e9e'
        message = f"La prestation pour {prestation.client.nom} {prestation.client.prenom} a u00e9tu00e9 refusu00e9e."
        message_type = 'warning'
        
        # TODO: Ajouter notification plus tard
        # Une fois que le modu00e8le Notification sera correctement importu00e9
    
    db.session.commit()
    
    # Notifier l'utilisateur
    flash(message, message_type)
    
    return redirect(url_for('transporteur.prestations_a_confirmer'))


@transporteur_bp.route('/update-status/<int:id>', methods=['POST'])
@login_required
def update_status(id):
    # Vu00e9rifier que l'utilisateur est bien un transporteur
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas l'autorisation d'effectuer cette action.", 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Ru00e9cupu00e9rer la prestation
    prestation = Prestation.query.filter_by(id=id).first_or_404()
    
    # Vu00e9rifier que le transporteur est bien assignu00e9 u00e0 cette prestation
    if current_user not in prestation.transporteurs:
        flash("Vous n'u00eates pas assignu00e9 u00e0 cette prestation.", 'danger')
        return redirect(url_for('transporteur.prestations_a_confirmer'))
    
    # Action (start ou complete)
    action = request.form.get('action', '')
    message = ""
    
    if action == 'start' and (prestation.statut == 'Confirmu00e9e' or prestation.statut == 'En attente'):
        # Du00e9marrer la prestation
        prestation.statut = 'En cours'
        message = f"Le transport pour {prestation.client.nom} {prestation.client.prenom} a u00e9tu00e9 du00e9marru00e9."
        message_type = 'info'
        
        # TODO: Ajouter notification plus tard
        # Une fois que le modu00e8le Notification sera correctement importu00e9
    
    elif action == 'complete' and prestation.statut == 'En cours':
        # Terminer la prestation
        prestation.statut = 'Terminu00e9e'
        message = f"Le transport pour {prestation.client.nom} {prestation.client.prenom} a u00e9tu00e9 terminu00e9 avec succu00e8s."
        message_type = 'success'
        
        # TODO: Ajouter notification plus tard
        # Une fois que le modu00e8le Notification sera correctement importu00e9
    
    db.session.commit()
    
    # Notifier l'utilisateur
    if message:
        flash(message, message_type)
    
    # Rediriger vers la page de du00e9tails de la prestation
    return redirect(url_for('transporteur.view_prestation', id=prestation.id))


@transporteur_bp.route('/prestation/response', methods=['POST'])
@login_required
def transporteur_prestation_response():
    """
    Gère les réponses des transporteurs aux prestations qui leur sont assignées
    (acceptation, refus, documentation)
    """
    # Vérifier que l'utilisateur est un transporteur
    if current_user.role != 'transporteur':
        flash('Vous n\'êtes pas autorisé à effectuer cette action.', 'danger')
        return redirect(url_for('main.index'))
    
    try:
        # Récupérer les données du formulaire
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'Aucune donnée reçue'
            }), 400
        
        prestation_id = data.get('prestation_id')
        status = data.get('status')  # 'accepte', 'refuse', 'documente'
        raison_refus = data.get('raison_refus', '')
        
        # Validation des données
        if not prestation_id or not status:
            return jsonify({
                'success': False,
                'message': 'ID de prestation et statut requis'
            }), 400
        
        # Récupérer la prestation
        prestation = Prestation.query.get(prestation_id)
        
        if not prestation:
            return jsonify({
                'success': False,
                'message': 'Prestation non trouvée'
            }), 404
        
        # Vérifier que le transporteur est bien assigné à cette prestation
        if current_user not in prestation.transporteurs:
            return jsonify({
                'success': False,
                'message': 'Vous n\'êtes pas assigné à cette prestation'
            }), 403
        
        # Mettre à jour le statut de la prestation pour ce transporteur
        # Nous allons utiliser une table d'association avec des attributs supplémentaires
        association = db.session.query(prestation_transporteurs).filter_by(
            prestation_id=prestation.id,
            transporteur_id=current_user.id
        ).first()
        
        if not association:
            # Créer l'association si elle n'existe pas
            association = prestation_transporteurs.insert().values(
                prestation_id=prestation.id,
                transporteur_id=current_user.id,
                status=status,
                raison_refus=raison_refus if status == 'refuse' else '',
                date_reponse=datetime.now()
            )
            db.session.execute(association)
        else:
            # Mettre à jour l'association existante
            association.status = status
            association.raison_refus = raison_refus if status == 'refuse' else ''
            association.date_reponse = datetime.now()
        
        # Si le transporteur refuse, mettre à jour le statut de la prestation
        if status == 'refuse':
            # Notifier l'administrateur et le commercial
            # TODO: Implémenter le système de notification
            pass
        
        # Enregistrer les modifications
        db.session.commit()
        
        # Créer un message de confirmation
        message = ''
        if status == 'accepte':
            message = 'Vous avez accepté la prestation avec succès.'
        elif status == 'refuse':
            message = 'Vous avez refusé la prestation. Merci pour votre réponse.'
        elif status == 'documente':
            message = 'Vous avez documenté la prestation avec succès.'
        
        return jsonify({
            'success': True,
            'message': message
        })
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la réponse à la prestation: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500
