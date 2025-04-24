from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, not_

from extensions import db
from models import Prestation, User, TypeDemenagement, TypeVehicule

# Créer un blueprint pour les API de transporteurs
transporteur_api_bp = Blueprint('transporteur_api', __name__, url_prefix='/api/transporteurs')

@transporteur_api_bp.route('/check-disponibilite', methods=['POST'])
@login_required
def check_disponibilite():
    """
    Route pour vérifier la disponibilité des transporteurs pour une période donnée
    et suggérer des véhicules adaptés au type de déménagement
    """
    # Récupérer les paramètres de la requête
    data = request.get_json() or {}
    date_debut_str = data.get('date_debut') or request.form.get('date_debut')
    date_fin_str = data.get('date_fin') or request.form.get('date_fin')
    type_demenagement_id = data.get('type_demenagement_id') or request.form.get('type_demenagement_id')
    prestation_id = data.get('prestation_id') or request.form.get('prestation_id')  # Optionnel, pour l'édition
    
    # Valider les paramètres
    if not date_debut_str or not date_fin_str:
        return jsonify({
            'success': False,
            'message': 'Paramètres manquants. Veuillez spécifier date_debut et date_fin.'
        }), 400
    
    try:
        # Convertir les dates
        date_debut = datetime.strptime(date_debut_str, '%Y-%m-%d')
        date_fin = datetime.strptime(date_fin_str, '%Y-%m-%d')
        
        # Valider le type de déménagement
        type_demenagement = None
        if type_demenagement_id and type_demenagement_id != '0':
            type_demenagement = TypeDemenagement.query.get(type_demenagement_id)
        
        # Trouver les transporteurs déjà assignés à des prestations pendant cette période
        transporteurs_occupes_query = User.query.join(User.prestations).filter(
            and_(
                User.role == 'transporteur',
                User.statut == 'actif',
                or_(
                    # Chevauchement des dates
                    and_(
                        Prestation.date_debut <= date_fin,
                        Prestation.date_fin >= date_debut
                    )
                )
            )
        )
        
        # Exclure la prestation en cours d'édition si applicable
        if prestation_id:
            transporteurs_occupes_query = transporteurs_occupes_query.filter(Prestation.id != prestation_id)
        
        # Obtenir les IDs des transporteurs occupés
        transporteurs_occupes_ids = [t.id for t in transporteurs_occupes_query.all()]
        
        # Trouver tous les transporteurs actifs
        tous_transporteurs = User.query.filter_by(role='transporteur', statut='actif').all()
        
        # Séparer les transporteurs disponibles et bientôt disponibles
        transporteurs_disponibles = []
        transporteurs_bientot_disponibles = []
        
        for transporteur in tous_transporteurs:
            if transporteur.id not in transporteurs_occupes_ids:
                # Transporteur disponible
                transporteurs_disponibles.append({
                    'id': transporteur.id,
                    'nom': transporteur.nom,
                    'prenom': transporteur.prenom,
                    'vehicule': transporteur.vehicule or 'Non spécifié',
                    'type_vehicule': transporteur.type_vehicule or 'Standard',
                    'disponible': True,
                    'vehicule_adapte': True  # Par défaut, considérer tous les véhicules comme adaptés
                })
            else:
                # Trouver quand le transporteur sera disponible
                prochaine_dispo = Prestation.query.filter(
                    Prestation.transporteurs.any(id=transporteur.id),
                    Prestation.date_fin >= datetime.now()
                ).order_by(Prestation.date_fin).first()
                
                if prochaine_dispo:
                    date_disponible = prochaine_dispo.date_fin + timedelta(days=1)
                    transporteurs_bientot_disponibles.append({
                        'id': transporteur.id,
                        'nom': transporteur.nom,
                        'prenom': transporteur.prenom,
                        'vehicule': transporteur.vehicule or 'Non spécifié',
                        'type_vehicule': transporteur.type_vehicule or 'Standard',
                        'disponible_le': date_disponible.strftime('%d/%m/%Y')
                    })
        
        # Trouver les types de véhicules recommandés pour ce type de déménagement
        vehicules_recommandes = []
        if type_demenagement:
            try:
                # Récupérer les types de véhicules recommandés pour ce type de déménagement
                types_vehicules_adaptes = TypeVehicule.query.filter(
                    TypeVehicule.types_demenagement.any(id=type_demenagement.id)
                ).all()
                
                vehicules_recommandes = [{
                    'id': tv.id,
                    'nom': tv.nom,
                    'description': tv.description or '',
                    'capacite': tv.capacite or ''
                } for tv in types_vehicules_adaptes]
            except Exception as ve:
                print(f"Erreur lors de la récupération des types de véhicules adaptés: {str(ve)}")
                # Continuer sans véhicules recommandés
        
        # Marquer les transporteurs qui ont un véhicule adapté
        if vehicules_recommandes:
            vehicules_noms = [v['nom'].lower() for v in vehicules_recommandes]
            for t in transporteurs_disponibles:
                # Vérifier si l'utilisateur a un type_vehicule_id associé
                user = User.query.get(t['id'])
                if user and user.type_vehicule_id:
                    # Vérifier si le type de véhicule est adapté pour ce type de déménagement
                    t['vehicule_adapte'] = user.type_vehicule_id in [v['id'] for v in vehicules_recommandes]
                elif t['vehicule'] and t['vehicule'] != 'Non spécifié':
                    # Sinon, vérifier par le nom du véhicule
                    t['vehicule_adapte'] = any(v_nom in t['vehicule'].lower() for v_nom in vehicules_noms)
                else:
                    t['vehicule_adapte'] = False
        
        # Trier les transporteurs disponibles par véhicule adapté puis par nom
        transporteurs_disponibles.sort(key=lambda x: (not x['vehicule_adapte'], x['nom']))
        
        return jsonify({
            'success': True,
            'message': 'Informations de disponibilité récupérées avec succès',
            'transporteurs': transporteurs_disponibles,
            'soon_available': transporteurs_bientot_disponibles,
            'vehicules_recommandes': vehicules_recommandes
        })
        
    except Exception as e:
        # Log de l'erreur pour débogage
        print(f"Erreur lors de la vérification de disponibilité: {str(e)}")
        
        return jsonify({
            'success': False,
            'message': f'Erreur lors de la vérification de disponibilité: {str(e)}',
            'error': str(e)
        }), 500


@transporteur_api_bp.route('/notifier', methods=['POST'])
@login_required
def notifier_transporteurs_route():
    """
    Route pour notifier les transporteurs qu'ils ont été assignés à une prestation
    """
    # Récupérer les paramètres de la requête
    try:
        # Récupérer les IDs des transporteurs depuis le formulaire
        transporteur_ids_json = request.form.get('transporteur_ids')
        if not transporteur_ids_json:
            return jsonify({
                'success': False,
                'message': 'Aucun transporteur spécifié.'
            }), 400
        
        # Convertir la chaîne JSON en liste
        import json
        transporteur_ids = json.loads(transporteur_ids_json)
        
        # Récupérer l'ID de la prestation si disponible (pour l'édition)
        prestation_id = request.form.get('prestation_id')
        prestation = None
        
        # Si nous avons un ID de prestation, récupérer la prestation
        if prestation_id:
            prestation = Prestation.query.get(prestation_id)
            if not prestation:
                return jsonify({
                    'success': False,
                    'message': f'Prestation avec ID {prestation_id} non trouvée.'
                }), 404
        
        # Récupérer les informations de base de la prestation depuis le formulaire
        date_debut = request.form.get('date_debut', '')
        date_fin = request.form.get('date_fin', '')
        type_demenagement = request.form.get('type_demenagement', '')
        
        # Récupérer les transporteurs
        transporteurs = User.query.filter(User.id.in_(transporteur_ids), User.role == 'transporteur').all()
        
        if not transporteurs:
            return jsonify({
                'success': False,
                'message': 'Aucun transporteur valide trouvé.'
            }), 404
        
        # Si nous avons une prestation existante, mettre à jour les transporteurs assignés
        if prestation:
            # Mettre à jour les transporteurs de la prestation
            prestation.transporteurs = transporteurs
            db.session.commit()
            
            # Envoyer des notifications aux transporteurs
            from utils import notifier_transporteurs
            notifier_transporteurs(prestation, transporteurs)
            
            return jsonify({
                'success': True,
                'message': f'{len(transporteurs)} transporteur(s) assigné(s) à la prestation et notifié(s) avec succès.',
                'prestation_id': prestation.id,
                'transporteurs': [{'id': t.id, 'nom': t.nom, 'prenom': t.prenom} for t in transporteurs]
            })
        else:
            # Pour une nouvelle prestation, nous stockons temporairement les transporteurs sélectionnés
            # dans la session jusqu'à ce que la prestation soit créée
            from flask import session
            session['selected_transporteurs'] = transporteur_ids
            
            return jsonify({
                'success': True,
                'message': f'{len(transporteurs)} transporteur(s) sélectionné(s) pour la nouvelle prestation.',
                'transporteurs': [{'id': t.id, 'nom': t.nom, 'prenom': t.prenom} for t in transporteurs]
            })
    
    except Exception as e:
        # Log de l'erreur pour débogage
        print(f"Erreur lors de la notification des transporteurs: {str(e)}")
        
        return jsonify({
            'success': False,
            'message': f'Erreur lors de la notification des transporteurs: {str(e)}',
            'error': str(e)
        }), 500


@transporteur_api_bp.route('/liste', methods=['GET'])
@login_required
def liste_transporteurs():
    """
    Route pour récupérer la liste de tous les transporteurs
    """
    try:
        # Récupérer tous les transporteurs actifs
        transporteurs = User.query.filter_by(role='transporteur', statut='actif').all()
        
        # Formater les données
        transporteurs_data = []
        for transporteur in transporteurs:
            # Vérifier si le transporteur est actuellement occupé
            est_occupe = Prestation.query.join(Prestation.transporteurs).filter(
                User.id == transporteur.id,
                Prestation.date_debut <= datetime.now(),
                Prestation.date_fin >= datetime.now()
            ).first() is not None
            
            # Récupérer les informations du véhicule
            info_vehicule = "Non spécifié"
            if transporteur.type_vehicule:
                info_vehicule = transporteur.type_vehicule.nom
            elif transporteur.vehicule:
                info_vehicule = transporteur.vehicule
            
            transporteurs_data.append({
                'id': transporteur.id,
                'nom': transporteur.nom,
                'prenom': transporteur.prenom,
                'vehicule': info_vehicule,
                'disponible': not est_occupe
            })
        
        # Trier par disponibilité puis par nom
        transporteurs_data.sort(key=lambda x: (not x['disponible'], x['nom']))
        
        return jsonify({
            'success': True,
            'transporteurs': transporteurs_data
        })
        
    except Exception as e:
        print(f"Erreur lors de la récupération des transporteurs: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500
