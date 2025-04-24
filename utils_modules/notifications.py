from flask import flash
from models import Notification, User, Prestation
from extensions import db
from datetime import datetime

def notifier_transporteurs(prestation, transporteurs_ids, type_notification='assignation'):
    """
    Envoie des notifications aux transporteurs lorsqu'ils sont assignés à une prestation.
    
    Args:
        prestation: L'objet Prestation auquel les transporteurs sont assignés
        transporteurs_ids: Liste des IDs des transporteurs à notifier
        type_notification: Type de notification ('assignation', 'modification', 'annulation')
    
    Returns:
        bool: True si les notifications ont été envoyées avec succès, False sinon
    """
    try:
        for transporteur_id in transporteurs_ids:
            # Vérifier que le transporteur existe
            transporteur = User.query.filter_by(id=transporteur_id, role='transporteur').first()
            if not transporteur:
                continue
                
            # Créer le message approprié selon le type de notification
            if type_notification == 'assignation':
                message = f"Vous avez été assigné à une nouvelle prestation du {prestation.date_debut.strftime('%d/%m/%Y')} au {prestation.date_fin.strftime('%d/%m/%Y')}. Adresse de départ: {prestation.adresse_depart}. Adresse d'arrivée: {prestation.adresse_arrivee}."
            elif type_notification == 'modification':
                message = f"Une prestation à laquelle vous êtes assigné a été modifiée. Dates: du {prestation.date_debut.strftime('%d/%m/%Y')} au {prestation.date_fin.strftime('%d/%m/%Y')}."
            elif type_notification == 'annulation':
                message = f"Une prestation à laquelle vous étiez assigné a été annulée. Dates: du {prestation.date_debut.strftime('%d/%m/%Y')} au {prestation.date_fin.strftime('%d/%m/%Y')}."
            else:
                message = f"Mise à jour concernant une prestation. Dates: du {prestation.date_debut.strftime('%d/%m/%Y')} au {prestation.date_fin.strftime('%d/%m/%Y')}."
            
            # Créer la notification
            notification = Notification(
                message=message,
                type='info',
                role_destinataire='transporteur',
                user_id=transporteur_id,
                prestation_id=prestation.id,
                date_creation=datetime.utcnow()
            )
            
            db.session.add(notification)
        
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        flash(f"Erreur lors de l'envoi des notifications: {str(e)}", "danger")
        return False

def marquer_notification_comme_lue(notification_id, user_id):
    """
    Marque une notification comme lue pour un utilisateur spécifique.
    
    Args:
        notification_id: ID de la notification à marquer comme lue
        user_id: ID de l'utilisateur qui a lu la notification
    
    Returns:
        bool: True si la notification a été marquée comme lue avec succès, False sinon
    """
    try:
        notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if notification:
            notification.lu = True
            db.session.commit()
            return True
        return False
    except Exception as e:
        db.session.rollback()
        flash(f"Erreur lors du marquage de la notification comme lue: {str(e)}", "danger")
        return False

def accepter_prestation(prestation_id, transporteur_id, commentaire=None):
    """
    Permet à un transporteur d'accepter une prestation.
    
    Args:
        prestation_id: ID de la prestation à accepter
        transporteur_id: ID du transporteur qui accepte la prestation
        commentaire: Commentaire optionnel du transporteur
    
    Returns:
        bool: True si la prestation a été acceptée avec succès, False sinon
    """
    try:
        prestation = Prestation.query.get(prestation_id)
        if not prestation:
            flash("Prestation introuvable.", "danger")
            return False
            
        # Vérifier que le transporteur est bien assigné à cette prestation
        transporteur_assigne = False
        for transporteur in prestation.transporteurs:
            if transporteur.id == transporteur_id:
                transporteur_assigne = True
                break
                
        if not transporteur_assigne:
            flash("Vous n'êtes pas assigné à cette prestation.", "danger")
            return False
            
        # Mettre à jour le statut de la prestation pour ce transporteur
        prestation.status_transporteur = 'accepte'
        prestation.date_reponse = datetime.utcnow()
        
        # Ajouter un commentaire si fourni
        if commentaire:
            if prestation.observations:
                prestation.observations += f"\n\nAccepté par transporteur (ID: {transporteur_id}) le {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} :\n{commentaire}"
            else:
                prestation.observations = f"Accepté par transporteur (ID: {transporteur_id}) le {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} :\n{commentaire}"
        
        db.session.commit()
        
        # Créer une notification pour informer l'administrateur
        notification = Notification(
            message=f"Le transporteur a accepté la prestation #{prestation_id}.",
            type='success',
            role_destinataire='admin',
            prestation_id=prestation_id,
            date_creation=datetime.utcnow()
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return True
    except Exception as e:
        db.session.rollback()
        flash(f"Erreur lors de l'acceptation de la prestation: {str(e)}", "danger")
        return False

def refuser_prestation(prestation_id, transporteur_id, raison=None):
    """
    Permet à un transporteur de refuser une prestation.
    
    Args:
        prestation_id: ID de la prestation à refuser
        transporteur_id: ID du transporteur qui refuse la prestation
        raison: Raison du refus
    
    Returns:
        bool: True si la prestation a été refusée avec succès, False sinon
    """
    try:
        prestation = Prestation.query.get(prestation_id)
        if not prestation:
            flash("Prestation introuvable.", "danger")
            return False
            
        # Vérifier que le transporteur est bien assigné à cette prestation
        transporteur_assigne = False
        for transporteur in prestation.transporteurs:
            if transporteur.id == transporteur_id:
                transporteur_assigne = True
                break
                
        if not transporteur_assigne:
            flash("Vous n'êtes pas assigné à cette prestation.", "danger")
            return False
            
        # Mettre à jour le statut de la prestation pour ce transporteur
        prestation.status_transporteur = 'refuse'
        prestation.date_reponse = datetime.utcnow()
        prestation.raison_refus = raison
        
        # Ajouter la raison du refus aux observations
        if raison:
            if prestation.observations:
                prestation.observations += f"\n\nRefusé par transporteur (ID: {transporteur_id}) le {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} :\n{raison}"
            else:
                prestation.observations = f"Refusé par transporteur (ID: {transporteur_id}) le {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} :\n{raison}"
        
        db.session.commit()
        
        # Créer une notification pour informer l'administrateur
        notification = Notification(
            message=f"Le transporteur a refusé la prestation #{prestation_id}. Raison: {raison if raison else 'Non spécifiée'}",
            type='warning',
            role_destinataire='admin',
            prestation_id=prestation_id,
            date_creation=datetime.utcnow()
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return True
    except Exception as e:
        db.session.rollback()
        flash(f"Erreur lors du refus de la prestation: {str(e)}", "danger")
        return False
