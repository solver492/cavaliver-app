from flask import Blueprint, render_template, current_app
from flask_login import login_required, current_user
from sqlalchemy import func
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from datetime import datetime
from app import db
from app.models.prestation import Prestation
from app.models.client import Client
from app.models.facture import Facture
from app.models.user import User
import logging

# Configuration du logger
logger = logging.getLogger(__name__)

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
@login_required
def dashboard():
    """
    Affiche le tableau de bord avec les informations importantes:
    - Prestations à venir
    - Factures en attente et en retard
    - Statistiques générales
    """
    today = datetime.utcnow().date()
    
    # Récupérer les prestations à venir avec gestion d'erreur robuste
    prestations_a_venir = get_upcoming_prestations(today)
    
    # Récupérer les factures en attente et en retard
    factures_en_attente = get_factures_by_status('en_attente')
    factures_en_retard = get_factures_by_status('retard')
    
    # Calculer les statistiques
    stats = calculate_statistics()
    
    return render_template('dashboard.html',
                          prestations_a_venir=prestations_a_venir,
                          factures_en_attente=factures_en_attente,
                          factures_en_retard=factures_en_retard,
                          **stats)

def get_upcoming_prestations(today, limit=5):
    """Récupère les prestations à venir avec gestion d'erreur robuste"""
    prestations = []
    
    try:
        # Essayer la requête complète d'abord
        prestations = Prestation.query.filter(
            Prestation.date_debut >= today,
            Prestation.archived != True
        ).order_by(Prestation.date_debut).limit(limit).all()
    except OperationalError as e:
        logger.error(f"Erreur lors de la récupération des prestations: {e}")
        
        # Si l'erreur est due à une colonne manquante, essayer une requête plus simple
        try:
            # Requête de base sans les colonnes qui pourraient manquer
            prestations = db.session.query(Prestation).filter(
                Prestation.date_debut >= today
            ).order_by(Prestation.date_debut).limit(limit).all()
        except Exception as e2:
            logger.error(f"Erreur lors de la tentative alternative: {e2}")
    except Exception as e:
        logger.error(f"Erreur inattendue lors de la récupération des prestations: {e}")
    
    return prestations

def get_factures_by_status(status, limit=5):
    """Récupère les factures selon leur statut avec gestion d'erreur robuste"""
    factures = []
    
    try:
        # Vérifier si la table facture existe
        inspector = db.inspect(db.engine)
        if 'facture' in inspector.get_table_names():
            factures = Facture.query.filter_by(statut=status).order_by(
                Facture.date_emission.desc() if status == 'en_attente' else Facture.date_emission
            ).limit(limit).all()
    except OperationalError as e:
        logger.error(f"Erreur lors de la récupération des factures {status}: {e}")
    except Exception as e:
        logger.error(f"Erreur inattendue lors de la récupération des factures {status}: {e}")
    
    return factures

def calculate_statistics():
    """Calcule les statistiques générales pour le tableau de bord avec gestion d'erreur robuste"""
    stats = {
        'total_clients': 0,
        'total_prestations': 0,
        'total_factures': 0,
        'ca_total': 0
    }
    
    # Compter les clients
    try:
        stats['total_clients'] = Client.query.count()
    except OperationalError as e:
        logger.error(f"Erreur lors du comptage des clients: {e}")
        try:
            # Requête SQL brute pour compter les clients
            result = db.session.execute(db.text("SELECT COUNT(*) FROM client"))
            stats['total_clients'] = result.scalar() or 0
        except Exception as e2:
            logger.error(f"Erreur lors de la tentative alternative de comptage des clients: {e2}")
    
    # Compter les prestations
    try:
        stats['total_prestations'] = Prestation.query.count()
    except OperationalError as e:
        logger.error(f"Erreur lors du comptage des prestations: {e}")
        try:
            # Requête SQL brute pour compter les prestations
            result = db.session.execute(db.text("SELECT COUNT(*) FROM prestation"))
            stats['total_prestations'] = result.scalar() or 0
        except Exception as e2:
            logger.error(f"Erreur lors de la tentative alternative de comptage des prestations: {e2}")
    
    # Compter les factures
    try:
        inspector = db.inspect(db.engine)
        if 'facture' in inspector.get_table_names():
            stats['total_factures'] = Facture.query.count()
            
            # Calculer le chiffre d'affaires
            ca_result = db.session.query(func.sum(Facture.montant_ttc)).filter(
                Facture.statut == 'payee'
            ).scalar()
            stats['ca_total'] = ca_result or 0
    except Exception as e:
        logger.error(f"Erreur lors du comptage des factures: {e}")
    
    return stats