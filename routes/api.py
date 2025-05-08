from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user, login_required
from models import TypeDemenagement, TypeVehicule, User, Prestation, Transporteur, Vehicule, Client, Notification, Facture
from datetime import datetime, timedelta
from sqlalchemy import or_, and_, func
from extensions import db

api_bp = Blueprint('api', __name__)

@api_bp.route('/dashboard/revenue-data')
def get_revenue_data():
    # Obtenir les 6 derniers mois
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    # Requête pour obtenir le chiffre d'affaires mensuel
    monthly_revenue = db.session.query(
        func.date_trunc('month', Facture.date_emission).label('month'),
        func.sum(Facture.montant_total).label('total')
    ).filter(
        Facture.date_emission.between(start_date, end_date)
    ).group_by('month').order_by('month').all()
    
    # Formater les données
    labels = []
    values = []
    
    for month, total in monthly_revenue:
        labels.append(month.strftime('%b %Y'))
        values.append(float(total or 0))
    
    return jsonify({
        'labels': labels,
        'values': values
    })

@api_bp.route('/dashboard/service-types')
def get_service_types():
    # Requête pour obtenir le nombre de prestations par type
    service_types = db.session.query(
        Prestation.type_demenagement,
        func.count(Prestation.id).label('count')
    ).group_by(Prestation.type_demenagement).all()
    
    # Formater les données
    labels = []
    values = []
    
    for type_dem, count in service_types:
        labels.append(type_dem)
        values.append(count)
    
    return jsonify({
        'labels': labels,
        'values': values
    })

@api_bp.route('/type-demenagement/<int:type_id>/vehicules', methods=['GET'])
def get_vehicules_for_type(type_id):
    """
    Récupère les véhicules recommandés pour un type de déménagement spécifique
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise', 
                'vehicules': []
            }), 401
            
        type_demenagement = TypeDemenagement.query.get(type_id)
        if not type_demenagement:
            return jsonify({'success': False, 'message': 'Type de déménagement non trouvé', 'vehicules': []}), 404
        
        vehicules = [tv.nom for tv in type_demenagement.types_vehicule]
        
        return jsonify({
            'success': True,
            'vehicules': vehicules
        })
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des véhicules: {e}")
        return jsonify({'success': False, 'message': str(e), 'vehicules': []}), 500

@api_bp.route('/transporteurs-disponibles', methods=['POST'])
def get_transporteurs_disponibles():
    """
    Récupère les transporteurs disponibles pour une période et un type de déménagement donnés
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise'
            }), 401
            
        data = request.json
        date_debut = data.get('date_debut')
        date_fin = data.get('date_fin')
        type_demenagement_id = data.get('type_demenagement_id')
        
        if not date_debut or not date_fin:
            return jsonify({'success': False, 'message': 'Dates requises'}), 400
        
        # Convertir les dates en objets datetime
        try:
            date_debut = datetime.strptime(date_debut, '%Y-%m-%d')
            date_fin = datetime.strptime(date_fin, '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'message': 'Format de date invalide'}), 400
        
        # Récupérer le type de déménagement
        type_demenagement = None
        if type_demenagement_id:
            type_demenagement = TypeDemenagement.query.get(type_demenagement_id)
        
        # Récupérer tous les transporteurs (utilisateurs avec rôle transporteur)
        transporteurs = User.query.filter_by(role='transporteur', statut='actif').all()
        
        # Récupérer les prestations existantes dans cette période
        prestations = Prestation.query.filter(
            or_(
                and_(
                    Prestation.date_debut >= date_debut,
                    Prestation.date_debut <= date_fin
                ),
                and_(
                    Prestation.date_fin >= date_debut,
                    Prestation.date_fin <= date_fin
                ),
                and_(
                    Prestation.date_debut <= date_debut,
                    Prestation.date_fin >= date_fin
                )
            )
        ).all()
        
        # Transporteurs déjà occupés (via la table d'association prestation_transporteurs)
        transporteurs_occupes = set()
        for p in prestations:
            for t in p.transporteurs:
                transporteurs_occupes.add(t.id)
        
        # Types de véhicules recommandés
        types_vehicule_recommandes = []
        if type_demenagement:
            types_vehicule_recommandes = [tv.id for tv in type_demenagement.types_vehicule]
        
        # Préparer les résultats
        resultats = []
        for user in transporteurs:
            # Récupérer le transporteur associé
            transporteur = Transporteur.query.filter_by(user_id=user.id).first()
            if not transporteur:
                continue
                
            # Vérifier si le transporteur est occupé
            disponible = user.id not in transporteurs_occupes
            
            # Vérifier si le transporteur a un véhicule du type recommandé
            vehicule_compatible = True
            if types_vehicule_recommandes and transporteur.vehicule_id:
                vehicule = Vehicule.query.get(transporteur.vehicule_id)
                if vehicule and vehicule.type_id not in types_vehicule_recommandes:
                    vehicule_compatible = False
            
            # Récupérer les informations du véhicule
            vehicule_info = None
            if transporteur.vehicule_id:
                vehicule = Vehicule.query.get(transporteur.vehicule_id)
                if vehicule:
                    vehicule_info = {
                        'id': vehicule.id,
                        'marque': vehicule.marque,
                        'modele': vehicule.modele,
                        'immatriculation': vehicule.immatriculation,
                        'type': vehicule.type.nom if vehicule.type else 'Non spécifié'
                    }
            
            # Ajouter le transporteur au résultat
            resultats.append({
                'id': user.id,
                'nom': user.nom,
                'prenom': user.prenom,
                'email': user.email,
                'telephone': user.telephone,
                'disponible': disponible,
                'vehicule_compatible': vehicule_compatible,
                'vehicule': vehicule_info,
                'note': transporteur.note,
                'prochaine_disponibilite': None  # À implémenter
            })
        
        return jsonify({
            'success': True,
            'transporteurs': resultats
        })
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des transporteurs: {e}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500

@api_bp.route('/prestations-periode', methods=['POST'])
def get_prestations_periode():
    """
    Récupère les prestations pour une période donnée
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise'
            }), 401
            
        data = request.json
        date_debut = data.get('date_debut')
        date_fin = data.get('date_fin')
        
        if not date_debut or not date_fin:
            return jsonify({'success': False, 'message': 'Dates requises'}), 400
        
        # Convertir les dates en objets datetime
        try:
            date_debut = datetime.strptime(date_debut, '%Y-%m-%d')
            date_fin = datetime.strptime(date_fin, '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'message': 'Format de date invalide'}), 400
        
        # Récupérer les prestations dans cette période
        prestations = Prestation.query.filter(
            or_(
                and_(
                    Prestation.date_debut >= date_debut,
                    Prestation.date_debut <= date_fin
                ),
                and_(
                    Prestation.date_fin >= date_debut,
                    Prestation.date_fin <= date_fin
                ),
                and_(
                    Prestation.date_debut <= date_debut,
                    Prestation.date_fin >= date_fin
                )
            )
        ).all()
        
        # Préparer les résultats
        resultats = []
        for p in prestations:
            # Récupérer les transporteurs assignés
            transporteurs = []
            for t in p.transporteurs:
                transporteurs.append({
                    'id': t.id,
                    'nom': t.nom,
                    'prenom': t.prenom
                })
            
            # Récupérer le client
            client_info = None
            if p.client_principal:
                client_info = {
                    'id': p.client_principal.id,
                    'nom': p.client_principal.nom,
                    'prenom': p.client_principal.prenom
                }
            
            resultats.append({
                'id': p.id,
                'client': client_info,
                'date_debut': p.date_debut.strftime('%Y-%m-%d'),
                'date_fin': p.date_fin.strftime('%Y-%m-%d'),
                'statut': p.statut,
                'type_demenagement': p.type_demenagement,
                'transporteurs': transporteurs
            })
        
        return jsonify({
            'success': True,
            'prestations': resultats
        })
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des prestations: {e}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500

@api_bp.route('/check-transporteur-disponibilite', methods=['POST'])
def check_transporteur_disponibilite():
    """
    Vérifie la disponibilité des transporteurs pour une période donnée
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise'
            }), 401
            
        data = request.json
        transporteur_ids = data.get('transporteur_ids', [])
        date_debut = data.get('date_debut')
        date_fin = data.get('date_fin')
        prestation_id = data.get('prestation_id')  # Pour exclure la prestation actuelle lors d'une modification
        
        if not transporteur_ids or not date_debut or not date_fin:
            return jsonify({'success': False, 'message': 'Paramètres manquants'}), 400
        
        # Convertir les dates en objets datetime
        try:
            date_debut = datetime.strptime(date_debut, '%Y-%m-%d')
            date_fin = datetime.strptime(date_fin, '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'message': 'Format de date invalide'}), 400
        
        # Récupérer les prestations existantes dans cette période
        query = Prestation.query.filter(
            or_(
                and_(
                    Prestation.date_debut >= date_debut,
                    Prestation.date_debut <= date_fin
                ),
                and_(
                    Prestation.date_fin >= date_debut,
                    Prestation.date_fin <= date_fin
                ),
                and_(
                    Prestation.date_debut <= date_debut,
                    Prestation.date_fin >= date_fin
                )
            )
        )
        
        # Exclure la prestation actuelle si on est en mode modification
        if prestation_id:
            query = query.filter(Prestation.id != prestation_id)
            
        prestations = query.all()
        
        # Transporteurs déjà occupés
        transporteurs_occupes = set()
        for p in prestations:
            for t in p.transporteurs:
                transporteurs_occupes.add(t.id)
        
        # Vérifier la disponibilité de chaque transporteur
        resultats = {}
        for transporteur_id in transporteur_ids:
            try:
                transporteur_id = int(transporteur_id)
                disponible = transporteur_id not in transporteurs_occupes
                
                # Récupérer les informations du transporteur
                user = User.query.get(transporteur_id)
                if user:
                    resultats[transporteur_id] = {
                        'id': user.id,
                        'nom': user.nom,
                        'prenom': user.prenom,
                        'disponible': disponible
                    }
                else:
                    resultats[transporteur_id] = {
                        'id': transporteur_id,
                        'nom': 'Inconnu',
                        'prenom': '',
                        'disponible': False
                    }
            except ValueError:
                # Ignorer les IDs non valides
                pass
        
        return jsonify({
            'success': True,
            'transporteurs': resultats
        })
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la vérification de disponibilité: {e}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500

@api_bp.route('/transporteur-responses', methods=['GET'])
def get_transporteur_responses():
    """
    Récupère les réponses des transporteurs pour les prestations
    Accessible uniquement par les administrateurs et commerciaux
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise'
            }), 401
            
        # Vérifier les autorisations
        if not (current_user.role == 'admin' or current_user.role == 'commercial'):
            return jsonify({
                'success': False,
                'message': 'Vous n\'êtes pas autorisé à accéder à ces informations'
            }), 403
        
        # Récupérer les prestations avec des réponses de transporteurs
        prestations = Prestation.query.filter(
            Prestation.status_transporteur.in_(['accepte', 'refuse'])
        ).order_by(Prestation.date_reponse.desc()).limit(50).all()
        
        # Préparer les résultats
        resultats = []
        for p in prestations:
            # Récupérer le client
            client_info = None
            if p.client_principal:
                client_info = {
                    'id': p.client_principal.id,
                    'nom': p.client_principal.nom,
                    'prenom': p.client_principal.prenom
                }
            
            # Récupérer le transporteur
            transporteur_info = None
            if p.transporteur_id:
                transporteur = User.query.get(p.transporteur_id)
                if transporteur:
                    transporteur_info = {
                        'id': transporteur.id,
                        'nom': transporteur.nom,
                        'prenom': transporteur.prenom
                    }
            
            resultats.append({
                'id': p.id,
                'client': client_info,
                'transporteur': transporteur_info,
                'date_debut': p.date_debut.strftime('%Y-%m-%d'),
                'date_fin': p.date_fin.strftime('%Y-%m-%d'),
                'status_transporteur': p.status_transporteur,
                'raison_refus': p.raison_refus,
                'date_reponse': p.date_reponse.strftime('%Y-%m-%d %H:%M') if p.date_reponse else None
            })
        
        return jsonify({
            'success': True,
            'responses': resultats
        })
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des réponses: {e}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500

@api_bp.route('/transporteur/<int:transporteur_id>/prestations', methods=['GET'])
def get_transporteur_prestations(transporteur_id):
    """
    Récupère les prestations assignées à un transporteur
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise'
            }), 401
            
        # Vérifier que l'utilisateur est autorisé (soit le transporteur lui-même, soit un admin/commercial)
        is_self = current_user.id == transporteur_id
        is_authorized = current_user.role == 'admin' or current_user.role == 'commercial'
        
        if not (is_self or is_authorized):
            return jsonify({
                'success': False,
                'message': 'Vous n\'êtes pas autorisé à accéder à ces informations'
            }), 403
        
        # Récupérer l'utilisateur transporteur
        transporteur_user = User.query.get(transporteur_id)
        if not transporteur_user or transporteur_user.role != 'transporteur':
            return jsonify({
                'success': False,
                'message': 'Transporteur non trouvé'
            }), 404
        
        # Récupérer les prestations assignées à ce transporteur
        prestations_data = []
        for prestation in transporteur_user.prestations:
            # Récupérer le client
            client_nom = f"{prestation.client_principal.nom} {prestation.client_principal.prenom}" if prestation.client_principal else "Client inconnu"
            
            prestations_data.append({
                'id': prestation.id,
                'client_nom': client_nom,
                'date_debut': prestation.date_debut.strftime('%Y-%m-%d'),
                'date_fin': prestation.date_fin.strftime('%Y-%m-%d'),
                'adresse_depart': prestation.adresse_depart,
                'adresse_arrivee': prestation.adresse_arrivee,
                'statut': prestation.statut,
                'type_demenagement': prestation.type_demenagement,
                'status_transporteur': prestation.status_transporteur,
                'raison_refus': prestation.raison_refus,
                'date_reponse': prestation.date_reponse.strftime('%Y-%m-%d %H:%M') if prestation.date_reponse else None
            })
        
        return jsonify({
            'success': True,
            'prestations': prestations_data
        })
    
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des prestations du transporteur: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500

@api_bp.route('/prestation/<int:prestation_id>/status', methods=['POST'])
def update_prestation_status(prestation_id):
    """
    Met à jour le statut d'une prestation pour un transporteur
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise'
            }), 401
            
        # Récupérer les données de la requête
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'Aucune donnée reçue'
            }), 400
        
        status = data.get('status')
        reason = data.get('reason', '')
        
        if not status or status not in ['accepte', 'refuse']:
            return jsonify({
                'success': False,
                'message': 'Statut invalide'
            }), 400
        
        # Récupérer la prestation
        prestation = Prestation.query.get(prestation_id)
        if not prestation:
            return jsonify({
                'success': False,
                'message': 'Prestation non trouvée'
            }), 404
        
        # Vérifier que l'utilisateur est autorisé (soit un transporteur assigné, soit un admin/commercial)
        is_assigned = current_user in prestation.transporteurs
        is_authorized = current_user.is_admin() or current_user.role == 'commercial'
        
        if not (is_assigned or is_authorized):
            return jsonify({
                'success': False,
                'message': 'Vous n\'êtes pas autorisé à modifier cette prestation'
            }), 403
        
        # Mettre à jour le statut
        prestation.status_transporteur = status
        
        # Enregistrer la date de réponse
        prestation.date_reponse = datetime.now()
        
        # Enregistrer la raison du refus si le statut est 'refuse'
        if status == 'refuse' and reason:
            prestation.raison_refus = reason
        
        # Ajouter une note si une raison est fournie
        if reason:
            # Créer ou mettre à jour les notes de la prestation
            if prestation.observations:
                prestation.observations += f"\n\n[{datetime.now().strftime('%d/%m/%Y %H:%M')}] Réponse du transporteur {current_user.prenom} {current_user.nom}: {status.upper()}\n{reason}"
            else:
                prestation.observations = f"[{datetime.now().strftime('%d/%m/%Y %H:%M')}] Réponse du transporteur {current_user.prenom} {current_user.nom}: {status.upper()}\n{reason}"
        
        # Mettre à jour la date de modification
        prestation.date_modification = datetime.now()
        prestation.modificateur_id = current_user.id
        
        # Si la prestation est refusée, mettre à jour son statut global
        if status == 'refuse' and current_user.role == 'transporteur':
            # Retirer le transporteur de la prestation
            prestation.transporteurs.remove(current_user)
            
            # Si c'était le seul transporteur, mettre la prestation en attente
            if len(prestation.transporteurs) == 0:
                prestation.statut = 'En attente'
        
        # Sauvegarder les modifications
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"Statut de la prestation mis à jour: {status}"
        })
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la mise à jour du statut de la prestation: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500

@api_bp.route('/check_disponibilite', methods=['POST'])
def check_disponibilite():
    """
    Vérifie la disponibilité des transporteurs pour une période et un type de déménagement donnés
    Version améliorée pour le nouveau widget de transport
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise'
            }), 401
            
        data = request.json
        date_debut = data.get('date_debut')
        date_fin = data.get('date_fin')
        type_demenagement = data.get('type_demenagement')
        
        if not date_debut or not date_fin:
            return jsonify({'success': False, 'message': 'Dates requises'}), 400
        
        # Convertir les dates en objets datetime
        try:
            date_debut_obj = datetime.strptime(date_debut, '%Y-%m-%d')
            date_fin_obj = datetime.strptime(date_fin, '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'message': 'Format de date invalide'}), 400
        
        # Récupérer tous les transporteurs actifs
        transporteurs = User.query.filter_by(role='transporteur', statut='actif').all()
        
        # Récupérer les prestations existantes dans cette période
        prestations = Prestation.query.filter(
            or_(
                and_(
                    Prestation.date_debut >= date_debut_obj,
                    Prestation.date_debut <= date_fin_obj
                ),
                and_(
                    Prestation.date_fin >= date_debut_obj,
                    Prestation.date_fin <= date_fin_obj
                ),
                and_(
                    Prestation.date_debut <= date_debut_obj,
                    Prestation.date_fin >= date_fin_obj
                )
            )
        ).all()
        
        # Créer un dictionnaire pour stocker les transporteurs et leurs prestations
        transporteurs_prestations = {t.id: [] for t in transporteurs}
        
        # Remplir le dictionnaire avec les prestations
        for p in prestations:
            for t in p.transporteurs:
                if t.id in transporteurs_prestations:
                    transporteurs_prestations[t.id].append({
                        'id': p.id,
                        'date_debut': p.date_debut.strftime('%Y-%m-%d'),
                        'date_fin': p.date_fin.strftime('%Y-%m-%d'),
                        'titre': p.titre
                    })
        
        # Déterminer les transporteurs disponibles et bientôt disponibles
        transporteurs_disponibles = []
        transporteurs_bientot_disponibles = []
        
        for t in transporteurs:
            # Récupérer les informations du transporteur
            transporteur_info = {
                'id': t.id,
                'nom': t.nom,
                'prenom': t.prenom,
                'matricule': t.matricule if hasattr(t, 'matricule') else None,
                'permis': t.permis if hasattr(t, 'permis') else None,
                'prestations': transporteurs_prestations[t.id]
            }
            
            # Récupérer le type de véhicule du transporteur
            transporteur_db = Transporteur.query.filter_by(user_id=t.id).first()
            if transporteur_db and transporteur_db.vehicule:
                transporteur_info['type_vehicule'] = transporteur_db.vehicule.type_vehicule.nom if transporteur_db.vehicule.type_vehicule else None
            else:
                transporteur_info['type_vehicule'] = None
            
            # Vérifier si le transporteur est disponible pour cette période
            if not transporteurs_prestations[t.id]:
                transporteurs_disponibles.append(transporteur_info)
            else:
                # Vérifier si le transporteur sera bientôt disponible (dans les 7 jours suivant la fin de la période)
                sera_disponible = True
                date_disponible = None
                
                for p in transporteurs_prestations[t.id]:
                    p_date_fin = datetime.strptime(p['date_fin'], '%Y-%m-%d')
                    
                    # Si la prestation se termine après la période demandée et dans les 7 jours
                    if p_date_fin > date_fin_obj and (p_date_fin - date_fin_obj).days <= 7:
                        if date_disponible is None or p_date_fin > date_disponible:
                            date_disponible = p_date_fin
                    
                    # Si la prestation chevauche complètement la période demandée
                    elif datetime.strptime(p['date_debut'], '%Y-%m-%d') <= date_debut_obj and p_date_fin >= date_fin_obj:
                        sera_disponible = False
                        break
                
                if sera_disponible and date_disponible:
                    transporteur_info['disponible_le'] = date_disponible.strftime('%d/%m/%Y')
                    transporteurs_bientot_disponibles.append(transporteur_info)
        
        # Trier les transporteurs par nom
        transporteurs_disponibles.sort(key=lambda x: (x['nom'], x['prenom']))
        transporteurs_bientot_disponibles.sort(key=lambda x: (x['nom'], x['prenom']))
        
        return jsonify({
            'success': True,
            'transporteurs_disponibles': transporteurs_disponibles,
            'transporteurs_bientot_disponibles': transporteurs_bientot_disponibles
        })
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la vérification de disponibilité: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500

@api_bp.route('/notify_transporteur', methods=['POST'])
def notify_transporteur():
    """
    Notifie un transporteur qu'il a été assigné à une prestation
    """
    try:
        # Vérification manuelle de l'authentification
        if not current_user.is_authenticated:
            return jsonify({
                'success': False, 
                'message': 'Authentification requise'
            }), 401
            
        data = request.json
        transporteur_id = data.get('transporteur_id')
        prestation_id = data.get('prestation_id')
        
        if not transporteur_id or not prestation_id:
            return jsonify({'success': False, 'message': 'Identifiants requis'}), 400
        
        # Récupérer le transporteur et la prestation
        transporteur = User.query.get(transporteur_id)
        prestation = Prestation.query.get(prestation_id)
        
        if not transporteur or not prestation:
            return jsonify({'success': False, 'message': 'Transporteur ou prestation non trouvé'}), 404
        
        # Vérifier que l'utilisateur a les droits pour assigner un transporteur
        if not (current_user.is_admin() or current_user.role == 'commercial'):
            return jsonify({'success': False, 'message': 'Vous n\'êtes pas autorisé à assigner des transporteurs'}), 403
        
        # Ajouter le transporteur à la prestation s'il n'y est pas déjà
        if transporteur not in prestation.transporteurs:
            prestation.transporteurs.append(transporteur)
            
            # Mettre à jour la date de modification
            prestation.date_modification = datetime.now()
            prestation.modificateur_id = current_user.id
            
            # Ajouter une note
            if prestation.observations:
                prestation.observations += f"\n\n[{datetime.now().strftime('%d/%m/%Y %H:%M')}] Transporteur {transporteur.prenom} {transporteur.nom} assigné par {current_user.prenom} {current_user.nom}"
            else:
                prestation.observations = f"[{datetime.now().strftime('%d/%m/%Y %H:%M')}] Transporteur {transporteur.prenom} {transporteur.nom} assigné par {current_user.prenom} {current_user.nom}"
            
            # Sauvegarder les modifications
            db.session.commit()
            
            # TODO: Envoyer une notification au transporteur (email, SMS, etc.)
            
            return jsonify({
                'success': True,
                'message': f"Transporteur {transporteur.prenom} {transporteur.nom} assigné à la prestation"
            })
        else:
            return jsonify({
                'success': True,
                'message': f"Transporteur déjà assigné à cette prestation"
            })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la notification du transporteur: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}"
        }), 500

@api_bp.route('/clients', methods=['GET'])
@login_required
def get_clients():
    """
    Récupère la liste des clients pour le dropdown de sélection,
    filtrée selon le commercial connecté
    """
    try:
        if current_user.role in ['admin', 'superadmin']:
            # Admin et superadmin voient tous les clients non archivés
            clients = Client.query.filter_by(archive=False).all()
        elif current_user.role == 'commercial':
            # Commercial ne voit que ses clients non archivés
            clients = Client.query.filter_by(commercial_id=current_user.id, archive=False).all()
        else:
            # Autres rôles n'ont accès à aucun client
            clients = []
        
        # Préparer les données pour la réponse JSON
        clients_data = []
        for client in clients:
            clients_data.append({
                'id': client.id,
                'nom': client.nom,
                'prenom': client.prenom,
                'adresse': client.adresse if client.adresse else '',
                'telephone': client.telephone if client.telephone else '',
                'email': client.email if client.email else ''
            })
        
        return jsonify({
            'success': True,
            'clients': clients_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Erreur lors de la récupération des clients: {str(e)}"
        }), 500

# Route duplicata pour assurer la compatibilité avec le nouveau chemin d'API
@api_bp.route('/api/clients', methods=['GET'])
@login_required
def get_clients_api_path():
    """Route duplicata pour /api/clients, redirige vers la fonction get_clients()"""
    return get_clients()

@api_bp.route('/session-data', methods=['GET'])
@login_required
def get_session_data():
    """
    Récupère les données de session pour les étapes et les transporteurs
    """
    try:
        from flask import session
        
        # Récupérer les données de session
        etapes_depart = session.get('debug_etapes_depart', [])
        etapes_arrivee = session.get('debug_etapes_arrivee', [])
        transporteurs_ids = session.get('debug_transporteurs', [])
        
        # Log des données pour le débogage
        current_app.logger.info(f"Données de session - Étapes départ: {etapes_depart}")
        current_app.logger.info(f"Données de session - Étapes arrivée: {etapes_arrivee}")
        current_app.logger.info(f"Données de session - Transporteurs IDs: {transporteurs_ids}")
        
        # Récupérer les détails des transporteurs
        transporteurs = []
        if transporteurs_ids:
            transporteurs_data = User.query.filter(User.id.in_(transporteurs_ids)).all()
            transporteurs = [{
                'id': t.id,
                'nom': t.nom,
                'prenom': t.prenom,
                'telephone': t.telephone if hasattr(t, 'telephone') else '',
                'email': t.email
            } for t in transporteurs_data]
        
        return jsonify({
            'success': True,
            'etapes_depart': etapes_depart,
            'etapes_arrivee': etapes_arrivee,
            'transporteurs': transporteurs
        })
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des données de session: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Une erreur est survenue: {str(e)}",
            'etapes_depart': [],
            'etapes_arrivee': [],
            'transporteurs': []
        }), 500

@api_bp.route('/notifications/count', methods=['GET'])
@login_required
def get_notifications_count():
    """Récupère le nombre de notifications non lues pour l'utilisateur connecté."""
    try:
        # Construire la requête en fonction du rôle
        if current_user.is_admin() or current_user.role == 'superadmin':
            # Les admins voient toutes les notifications non lues
            count = Notification.query.filter_by(lu=False).count()
        elif current_user.role == 'commercial':
            # Les commerciaux voient les notifications non lues liées à leurs prestations
            count = Notification.query.join(Prestation).filter(
                and_(
                    Notification.lu == False,
                    Prestation.commercial_id == current_user.id
                )
            ).count()
        else:
            # Les transporteurs voient leurs notifications non lues
            count = Notification.query.filter_by(
                user_id=current_user.id,
                role_destinataire='transporteur',
                lu=False
            ).count()

        current_app.logger.info(f"Notifications non lues pour {current_user.username}: {count}")
        
        return jsonify({
            'success': True,
            'count': count
        })
    except Exception as e:
        current_app.logger.error(f"Erreur lors du comptage des notifications: {e}")
        return jsonify({
            'success': False,
            'message': str(e),
            'count': 0
        }), 500
