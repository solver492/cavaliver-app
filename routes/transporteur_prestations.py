"""
Route pour afficher et gérer les prestations assignées à un transporteur.
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app
from flask_login import login_required, current_user
from models import Prestation, User, Notification
from utils import accepter_prestation, refuser_prestation
from extensions import db
from datetime import datetime

transporteur_prestations = Blueprint('transporteur_prestations', __name__)

@transporteur_prestations.route('/notifications/<int:notification_id>/terminer', methods=['POST'])
@login_required
def terminer_prestation(notification_id):
    """Marquer une prestation comme terminée par le transporteur."""
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas accès à cette fonctionnalité.", "danger")
        return redirect(url_for('dashboard.index'))
    
    try:
        # Récupérer la notification
        notification = Notification.query.get_or_404(notification_id)
        
        # Vérifier que la notification est associée à une prestation
        if not notification.prestation_id:
            flash("Cette notification n'est pas associée à une prestation.", "danger")
            return redirect(url_for('transporteur_prestations.notifications'))
        
        # Récupérer la prestation
        prestation = Prestation.query.get(notification.prestation_id)
        if not prestation:
            flash("La prestation associée n'existe plus.", "danger")
            return redirect(url_for('transporteur_prestations.notifications'))
        
        # Vérifier que le transporteur est bien assigné à cette prestation
        if current_user not in prestation.transporteurs:
            flash("Vous n'êtes pas assigné à cette prestation.", "danger")
            return redirect(url_for('transporteur_prestations.notifications'))
        
        # Mettre à jour le statut de la prestation
        prestation.statut = 'terminee'
        prestation.date_fin_reelle = datetime.utcnow()
        
        # Créer des notifications pour l'admin et le commercial
        admin_notification = Notification(
            message=f"Le transporteur {current_user.nom} {current_user.prenom} a terminé la prestation #{prestation.id} - {prestation.type_demenagement}",
            type='success',
            statut='non_lue',
            role_destinataire='admin',
            prestation_id=prestation.id
        )
        
        commercial_notification = Notification(
            message=f"Le transporteur {current_user.nom} {current_user.prenom} a terminé la prestation #{prestation.id} - {prestation.type_demenagement}",
            type='success',
            statut='non_lue',
            role_destinataire='commercial',
            prestation_id=prestation.id
        )
        
        # Mettre à jour le statut de la notification originale
        notification.statut = 'terminee'
        
        db.session.add(admin_notification)
        db.session.add(commercial_notification)
        db.session.commit()
        
        flash(f"La prestation #{prestation.id} a été marquée comme terminée.", "success")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la terminaison de la prestation: {str(e)}")
        flash("Une erreur est survenue lors de la terminaison de la prestation.", "danger")
    
    return redirect(url_for('transporteur_prestations.notifications'))

@transporteur_prestations.route('/mes-prestations')
@login_required
def mes_prestations():
    """Affiche les prestations assignées au transporteur connecté."""
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas accès à cette page.", "danger")
        return redirect(url_for('dashboard.index'))
    
    # Récupérer les prestations assignées au transporteur
    prestations = current_user.prestations
    
    # Récupérer le statut de chaque prestation pour ce transporteur depuis la table d'association
    prestations_avec_statut = []
    for prestation in prestations:
        # Récupérer le statut depuis la table d'association
        from sqlalchemy import text
        query = text("""
            SELECT statut, date_reponse, commentaire
            FROM prestation_transporteurs
            WHERE prestation_id = :prestation_id AND user_id = :user_id
        """)
        
        result = db.session.execute(query, {
            'prestation_id': prestation.id,
            'user_id': current_user.id
        }).fetchone()
        
        statut = result[0] if result else 'en_attente'
        date_reponse = result[1] if result else None
        commentaire = result[2] if result else None
        
        prestations_avec_statut.append({
            'prestation': prestation,
            'statut': statut,
            'date_reponse': date_reponse,
            'commentaire': commentaire
        })
    
    return render_template('transporteur/mes_prestations.html', 
                           prestations=prestations_avec_statut,
                           now=datetime.utcnow())

@transporteur_prestations.route('/prestation/<int:prestation_id>/accepter', methods=['POST'])
@login_required
def accepter(prestation_id):
    """Accepte une prestation."""
    if current_user.role != 'transporteur':
        return jsonify({'success': False, 'message': "Vous n'avez pas accès à cette fonctionnalité."}), 403
    
    commentaire = request.form.get('commentaire', '')
    
    if accepter_prestation(prestation_id, current_user.id, commentaire):
        return jsonify({'success': True, 'message': "Prestation acceptée avec succès."})
    else:
        return jsonify({'success': False, 'message': "Erreur lors de l'acceptation de la prestation."}), 500

@transporteur_prestations.route('/prestation/<int:prestation_id>/refuser', methods=['POST'])
@login_required
def refuser(prestation_id):
    """Refuse une prestation."""
    if current_user.role != 'transporteur':
        return jsonify({'success': False, 'message': "Vous n'avez pas accès à cette fonctionnalité."}), 403
    
    raison = request.form.get('raison', '')
    
    if refuser_prestation(prestation_id, current_user.id, raison):
        return jsonify({'success': True, 'message': "Prestation refusée avec succès."})
    else:
        return jsonify({'success': False, 'message': "Erreur lors du refus de la prestation."}), 500

@transporteur_prestations.route('/notifications')
@login_required
def notifications():
    """Afficher les notifications pour le transporteur."""
    if not (current_user.is_transporteur() or current_user.is_admin() or current_user.role in ['commercial', 'superadmin']):
        flash('Accès non autorisé.', 'danger')
        return redirect(url_for('dashboard.index'))

    try:
        # Récupérer les notifications selon le rôle
        if current_user.is_admin() or current_user.role == 'superadmin':
            # Les admins voient toutes les notifications
            notifications = Notification.query.order_by(Notification.date_creation.desc()).all()
        elif current_user.role == 'commercial':
            # Les commerciaux voient les notifications liées à leurs prestations
            notifications = Notification.query.join(Prestation).filter(
                Prestation.commercial_id == current_user.id
            ).order_by(Notification.date_creation.desc()).all()
        else:
            # Les transporteurs voient leurs propres notifications
            notifications = Notification.query.filter_by(
                user_id=current_user.id,
                role_destinataire='transporteur'
            ).order_by(Notification.date_creation.desc()).all()

        # Marquer les notifications non lues comme lues
        for notif in notifications:
            if not notif.lu:
                notif.lu = True
                current_app.logger.info(f"Notification {notif.id} marquée comme lue pour {current_user.username}")

        db.session.commit()

        return render_template(
            'transporteur/notifications.html',
            title='Notifications',
            notifications=notifications
        )

    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'affichage des notifications: {e}")
        db.session.rollback()
        flash("Une erreur s'est produite lors du chargement des notifications.", 'danger')
        return redirect(url_for('dashboard.index'))

@transporteur_prestations.route('/notification/<int:notification_id>/accepter')
@login_required
def accepter_notification(notification_id):
    """Accepte une prestation via une notification."""
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas accès à cette fonctionnalité.", "danger")
        return redirect(url_for('dashboard.index'))
    
    try:
        # Récupérer la notification
        notification = Notification.query.get_or_404(notification_id)
        
        # Vérifier que la notification appartient au transporteur
        if notification.user_id != current_user.id:
            flash("Cette notification ne vous appartient pas.", "danger")
            return redirect(url_for('transporteur_prestations.notifications'))
        
        # Vérifier que la notification est non lue
        if notification.statut != 'non_lue':
            flash("Cette notification a déjà été traitée.", "warning")
            return redirect(url_for('transporteur_prestations.notifications'))
        
        # Accepter la prestation
        if accepter_prestation(notification.prestation_id, current_user.id):
            # Mettre à jour le statut de la notification
            notification.statut = 'acceptee'
            db.session.commit()
            
            flash("Prestation acceptée avec succès.", "success")
        else:
            flash("Erreur lors de l'acceptation de la prestation.", "danger")
            
    except Exception as e:
        flash(f"Une erreur est survenue : {str(e)}", "danger")
        
    return redirect(url_for('transporteur_prestations.notifications'))

@transporteur_prestations.route('/notification/<int:notification_id>/refuser')
@login_required
def refuser_notification(notification_id):
    """Refuse une prestation via une notification."""
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas accès à cette fonctionnalité.", "danger")
        return redirect(url_for('dashboard.index'))
    
    try:
        # Récupérer la notification
        notification = Notification.query.get_or_404(notification_id)
        
        # Vérifier que la notification appartient au transporteur
        if notification.user_id != current_user.id:
            flash("Cette notification ne vous appartient pas.", "danger")
            return redirect(url_for('transporteur_prestations.notifications'))
        
        # Vérifier que la notification est non lue
        if notification.statut != 'non_lue':
            flash("Cette notification a déjà été traitée.", "warning")
            return redirect(url_for('transporteur_prestations.notifications'))
        
        # Refuser la prestation
        if refuser_prestation(notification.prestation_id, current_user.id):
            # Mettre à jour le statut de la notification
            notification.statut = 'refusee'
            db.session.commit()
            
            flash("Prestation refusée avec succès.", "success")
        else:
            flash("Erreur lors du refus de la prestation.", "danger")
            
    except Exception as e:
        flash(f"Une erreur est survenue : {str(e)}", "danger")
        
    return redirect(url_for('transporteur_prestations.notifications'))

@transporteur_prestations.route('/notifications/accepter/<int:notification_id>')
@login_required
def accepter_notification_old(notification_id):
    """Accepter une prestation via une notification"""
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas accès à cette page.", "danger")
        return redirect(url_for('dashboard.index'))
    
    # Récupérer la notification
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=current_user.id,
        role_destinataire='transporteur'
    ).first_or_404()
    
    # Vérifier que la notification concerne une prestation
    if not notification.prestation_id:
        flash("Cette notification ne concerne pas une prestation.", "warning")
        return redirect(url_for('transporteur_prestations.notifications'))
    
    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(notification.prestation_id)
    
    # Mettre à jour le statut de la notification
    notification.statut = 'acceptee'
    
    # Créer une notification pour informer l'administrateur et le commercial
    admin_notification = Notification(
        message=f"Le transporteur {current_user.nom} {current_user.prenom} a accepté la prestation #{prestation.id} - {prestation.type_demenagement} - {prestation.date_debut.strftime('%d/%m/%Y')}",
        type='success',
        statut='non_lue',
        role_destinataire='admin',
        prestation_id=prestation.id
    )
    
    commercial_notification = Notification(
        message=f"Le transporteur {current_user.nom} {current_user.prenom} a accepté la prestation #{prestation.id} - {prestation.type_demenagement} - {prestation.date_debut.strftime('%d/%m/%Y')}",
        type='success',
        statut='non_lue',
        role_destinataire='commercial',
        prestation_id=prestation.id
    )
    
    db.session.add(admin_notification)
    db.session.add(commercial_notification)
    db.session.commit()
    
    flash(f"Vous avez accepté la prestation #{prestation.id}.", "success")
    return redirect(url_for('transporteur_prestations.notifications'))

@transporteur_prestations.route('/notifications/refuser/<int:notification_id>')
@login_required
def refuser_notification_old(notification_id):
    """Refuser une prestation via une notification"""
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas accès à cette page.", "danger")
        return redirect(url_for('dashboard.index'))
    
    # Récupérer la notification
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=current_user.id,
        role_destinataire='transporteur'
    ).first_or_404()
    
    # Vérifier que la notification concerne une prestation
    if not notification.prestation_id:
        flash("Cette notification ne concerne pas une prestation.", "warning")
        return redirect(url_for('transporteur_prestations.notifications'))
    
    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(notification.prestation_id)
    
    # Mettre à jour le statut de la notification
    notification.statut = 'refusee'
    
    # Supprimer le transporteur de la prestation
    if current_user in prestation.transporteurs:
        prestation.transporteurs.remove(current_user)
    
    # Créer une notification pour informer l'administrateur et le commercial
    admin_notification = Notification(
        message=f"Le transporteur {current_user.nom} {current_user.prenom} a refusé la prestation #{prestation.id} - {prestation.type_demenagement} - {prestation.date_debut.strftime('%d/%m/%Y')}",
        type='warning',
        statut='non_lue',
        role_destinataire='admin',
        prestation_id=prestation.id
    )
    
    commercial_notification = Notification(
        message=f"Le transporteur {current_user.nom} {current_user.prenom} a refusé la prestation #{prestation.id} - {prestation.type_demenagement} - {prestation.date_debut.strftime('%d/%m/%Y')}",
        type='warning',
        statut='non_lue',
        role_destinataire='commercial',
        prestation_id=prestation.id
    )
    
    db.session.add(admin_notification)
    db.session.add(commercial_notification)
    db.session.commit()
    
    flash(f"Vous avez refusé la prestation #{prestation.id}.", "success")
    return redirect(url_for('transporteur_prestations.notifications'))

@transporteur_prestations.route('/notifications/voir_prestation/<int:prestation_id>')
@login_required
def voir_prestation(prestation_id):
    """Voir les détails d'une prestation depuis une notification"""
    if current_user.role != 'transporteur':
        flash("Vous n'avez pas accès à cette page.", "danger")
        return redirect(url_for('dashboard.index'))
    
    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(prestation_id)
    
    # Vérifier que le transporteur est assigné à cette prestation
    if current_user not in prestation.transporteurs:
        flash("Vous n'êtes pas assigné à cette prestation.", "warning")
        return redirect(url_for('transporteur_prestations.notifications'))
    
    return render_template('transporteur/voir_prestation.html', prestation=prestation)

@transporteur_prestations.route('/api/transporteur/<int:transporteur_id>/prestations')
@login_required
def api_prestations_transporteur(transporteur_id):
    """API pour récupérer les prestations d'un transporteur."""
    # Vérifier que l'utilisateur est bien le transporteur ou un admin/commercial
    if current_user.id != transporteur_id and current_user.role not in ['admin', 'commercial', 'superadmin']:
        return jsonify({'success': False, 'message': "Vous n'avez pas accès à ces informations."}), 403
    
    # Récupérer le transporteur
    transporteur = User.query.get_or_404(transporteur_id)
    if transporteur.role != 'transporteur':
        return jsonify({'success': False, 'message': "Cet utilisateur n'est pas un transporteur."}), 400
    
    # Récupérer les prestations assignées au transporteur
    prestations = []
    for prestation in transporteur.prestations:
        # Récupérer le statut depuis la table d'association
        from sqlalchemy import text
        query = text("""
            SELECT statut, date_reponse, commentaire
            FROM prestation_transporteurs
            WHERE prestation_id = :prestation_id AND user_id = :user_id
        """)
        
        result = db.session.execute(query, {
            'prestation_id': prestation.id,
            'user_id': transporteur_id
        }).fetchone()
        
        statut = result[0] if result else 'en_attente'
        date_reponse = result[1].isoformat() if result and result[1] else None
        commentaire = result[2] if result else None
        
        prestations.append({
            'id': prestation.id,
            'reference': prestation.reference,
            'client': f"{prestation.client.nom} {prestation.client.prenom}",
            'date_debut': prestation.date_debut.isoformat(),
            'date_fin': prestation.date_fin.isoformat(),
            'adresse_depart': prestation.adresse_depart,
            'adresse_arrivee': prestation.adresse_arrivee,
            'type_demenagement': prestation.type_demenagement,
            'statut_transporteur': statut,
            'date_reponse': date_reponse,
            'commentaire': commentaire
        })
    
    return jsonify({
        'success': True,
        'prestations': prestations
    })
