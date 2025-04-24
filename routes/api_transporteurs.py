"""
API pour récupérer la liste des transporteurs
"""
from flask import Blueprint, jsonify, request, current_app
from models import User, Client, Prestation, TypeDemenagement, Transporteur, Vehicule, Facture, Stockage, Document
from datetime import datetime, timedelta
import json

# Créer un blueprint pour les API de transporteurs
api_transporteurs = Blueprint('api_transporteurs', __name__)

@api_transporteurs.route('/api/transporteurs/liste', methods=['GET'])
def liste_transporteurs():
    """Récupérer la liste de tous les transporteurs avec leurs véhicules"""
    try:
        # Récupérer tous les transporteurs
        transporteurs = Transporteur.query.all()
        
        # Préparer la liste des transporteurs avec leurs véhicules
        transporteurs_liste = []
        
        for transporteur in transporteurs:
            # Récupérer le véhicule principal du transporteur
            vehicule = Vehicule.query.filter_by(transporteur_id=transporteur.id, principal=True).first()
            
            # Déterminer si le véhicule est adapté pour les déménagements
            vehicule_adapte = False
            vehicule_nom = "Pas de véhicule"
            
            if vehicule:
                vehicule_adapte = vehicule.capacite >= 15  # Exemple: un véhicule est adapté s'il a une capacité d'au moins 15m³
                vehicule_nom = f"{vehicule.marque} {vehicule.modele} ({vehicule.capacite}m³)"
            
            # Ajouter le transporteur à la liste
            transporteurs_liste.append({
                'id': transporteur.id,
                'nom': transporteur.nom,
                'prenom': transporteur.prenom,
                'telephone': transporteur.telephone,
                'email': transporteur.email,
                'vehicule': vehicule_nom,
                'vehicule_adapte': vehicule_adapte
            })
        
        return jsonify({
            'success': True,
            'transporteurs': transporteurs_liste
        })
    
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des transporteurs: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Erreur lors de la récupération des transporteurs: {str(e)}"
        }), 500

@api_transporteurs.route('/api/transporteurs/check-disponibilite', methods=['POST'])
def check_disponibilite():
    """Vérifier la disponibilité des transporteurs pour une période donnée"""
    try:
        # Récupérer les données du formulaire
        date_debut = request.form.get('date_debut')
        date_fin = request.form.get('date_fin')
        type_demenagement_id = request.form.get('type_demenagement_id')
        prestation_id = request.form.get('prestation_id')
        
        # Valider les données
        if not date_debut or not date_fin or not type_demenagement_id:
            return jsonify({
                'success': False,
                'message': "Données manquantes: date_debut, date_fin et type_demenagement_id sont requis"
            }), 400
        
        # Convertir les dates en objets datetime
        try:
            date_debut_obj = datetime.strptime(date_debut, '%Y-%m-%d')
            date_fin_obj = datetime.strptime(date_fin, '%Y-%m-%d')
        except ValueError:
            return jsonify({
                'success': False,
                'message': "Format de date invalide. Utilisez le format YYYY-MM-DD"
            }), 400
        
        # Récupérer tous les transporteurs
        transporteurs = Transporteur.query.all()
        
        # Récupérer toutes les prestations qui chevauchent la période demandée
        prestations = Prestation.query.filter(
            Prestation.date_debut <= date_fin_obj,
            Prestation.date_fin >= date_debut_obj
        ).all()
        
        # Exclure la prestation en cours d'édition si prestation_id est fourni
        if prestation_id:
            prestations = [p for p in prestations if str(p.id) != prestation_id]
        
        # Récupérer les IDs des transporteurs déjà assignés à ces prestations
        transporteurs_occupes = set()
        for prestation in prestations:
            if prestation.transporteurs:
                transporteurs_occupes.update([t.id for t in prestation.transporteurs])
        
        # Déterminer les transporteurs disponibles et bientôt disponibles
        transporteurs_disponibles = []
        transporteurs_bientot_disponibles = []
        
        for transporteur in transporteurs:
            # Récupérer le véhicule principal du transporteur
            vehicule = Vehicule.query.filter_by(transporteur_id=transporteur.id, principal=True).first()
            
            # Déterminer si le véhicule est adapté pour ce type de déménagement
            vehicule_adapte = False
            vehicule_nom = "Pas de véhicule"
            
            if vehicule:
                # Logique pour déterminer si le véhicule est adapté au type de déménagement
                vehicule_adapte = vehicule.capacite >= 15  # Exemple simplifié
                vehicule_nom = f"{vehicule.marque} {vehicule.modele} ({vehicule.capacite}m³)"
            
            # Créer l'objet transporteur
            transporteur_obj = {
                'id': transporteur.id,
                'nom': transporteur.nom,
                'prenom': transporteur.prenom,
                'telephone': transporteur.telephone,
                'email': transporteur.email,
                'vehicule': vehicule_nom,
                'vehicule_adapte': vehicule_adapte
            }
            
            # Vérifier si le transporteur est disponible
            if transporteur.id not in transporteurs_occupes:
                transporteurs_disponibles.append(transporteur_obj)
            else:
                # Vérifier quand le transporteur sera disponible
                prochaine_dispo = None
                for prestation in prestations:
                    if transporteur in prestation.transporteurs:
                        fin_prestation = prestation.date_fin
                        if prochaine_dispo is None or fin_prestation > prochaine_dispo:
                            prochaine_dispo = fin_prestation
                
                if prochaine_dispo:
                    # Ajouter la date de disponibilité
                    transporteur_obj['disponible_le'] = prochaine_dispo.strftime('%d/%m/%Y')
                    transporteurs_bientot_disponibles.append(transporteur_obj)
        
        # Récupérer les véhicules recommandés pour ce type de déménagement
        vehicules_recommandes = []
        # Logique pour déterminer les véhicules recommandés selon le type de déménagement
        if type_demenagement_id == '1':  # Exemple: Petit déménagement
            vehicules_recommandes = [
                {'nom': 'Camionnette', 'description': 'Idéal pour les petits déménagements (studio, 1 pièce)'}
            ]
        elif type_demenagement_id == '2':  # Exemple: Déménagement moyen
            vehicules_recommandes = [
                {'nom': 'Camion 20m³', 'description': 'Parfait pour les appartements de 2-3 pièces'}
            ]
        elif type_demenagement_id == '3':  # Exemple: Grand déménagement
            vehicules_recommandes = [
                {'nom': 'Camion 30m³', 'description': 'Recommandé pour les maisons et grands appartements'}
            ]
        
        return jsonify({
            'success': True,
            'transporteurs': transporteurs_disponibles,
            'soon_available': transporteurs_bientot_disponibles,
            'vehicules_recommandes': vehicules_recommandes
        })
    
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la vérification de disponibilité: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Erreur lors de la vérification de disponibilité: {str(e)}"
        }), 500
