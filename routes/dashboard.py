from flask import Blueprint, render_template
from flask_login import login_required, current_user
from sqlalchemy import func, extract
from datetime import datetime, timedelta

from extensions import db
from models import Client, Prestation, Facture

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/test-images')
@login_required
def test_images():
    return render_template('test_images.html')

@dashboard_bp.route('/guide')
@login_required
def guide():
    return render_template('guide.html', title='Guide et bonnes pratiques')

@dashboard_bp.route('/dashboard')
@login_required
def index():
    # Get counts for dashboard
    clients_count = Client.query.filter_by(archive=False).count()
    prestations_count = Prestation.query.filter_by(archive=False).count()
    factures_count = Facture.query.count()
    
    # Get recent clients
    recent_clients = Client.query.filter_by(archive=False).order_by(Client.date_creation.desc()).limit(5).all()
    
    # Get upcoming prestations
    today = datetime.utcnow().date()
    upcoming_prestations = Prestation.query.filter(
        Prestation.date_debut >= today,
        Prestation.archive == False
    ).order_by(Prestation.date_debut).limit(5).all()
    
    # Get recent unpaid invoices
    unpaid_invoices = Facture.query.filter_by(statut='En attente').order_by(Facture.date_echeance).limit(5).all()
    
    # Get monthly revenue data for the chart
    current_year = datetime.utcnow().year
    monthly_revenue = []
    
    for month in range(1, 13):
        month_revenue = db.session.query(func.sum(Facture.montant_ttc)).filter(
            extract('year', Facture.date_emission) == current_year,
            extract('month', Facture.date_emission) == month,
            Facture.statut == 'Payée'
        ).scalar() or 0
        
        monthly_revenue.append(float(month_revenue))
    
    # Get prestation types data for the pie chart
    prestation_types = db.session.query(
        Prestation.type_demenagement,
        func.count(Prestation.id)
    ).group_by(Prestation.type_demenagement).all()
    
    pie_labels = [p[0] for p in prestation_types]
    pie_data = [p[1] for p in prestation_types]
    
    # Calculate additional stats for the dashboard
    today = datetime.utcnow().date()
    next_month = today + timedelta(days=30)
    
    # New clients this month
    new_clients_month = Client.query.filter(
        extract('month', Client.date_creation) == today.month,
        extract('year', Client.date_creation) == today.year
    ).count()
    
    # Upcoming and in-progress prestations
    prestations_a_venir = Prestation.query.filter(
        Prestation.date_debut > today,
        Prestation.archive == False
    ).count()
    
    prestations_en_cours = Prestation.query.filter(
        Prestation.date_debut <= today,
        Prestation.date_fin >= today,
        Prestation.archive == False
    ).count()
    
    # Count unpaid invoices
    factures_impayees = Facture.query.filter_by(statut='En attente').count()
    
    # Total revenue from paid invoices
    total_revenue = db.session.query(func.sum(Facture.montant_ttc)).filter(
        Facture.statut == 'Payée'
    ).scalar() or 0
    
    # Recent activities
    recent_factures = Facture.query.order_by(Facture.date_emission.desc()).limit(5).all()
    
    # Compile stats into a dictionary
    stats = {
        'total_clients': clients_count,
        'new_clients_month': new_clients_month,
        'prestations_a_venir': prestations_a_venir,
        'prestations_en_cours': prestations_en_cours,
        'factures_impayees': factures_impayees,
        'total_factures': factures_count,
        'total_revenue': float(total_revenue),
        'recent_clients': recent_clients,
        'recent_prestations': upcoming_prestations,
        'recent_factures': recent_factures
    }
    
    return render_template(
        'dashboard.html',
        title='Tableau de Bord',
        stats=stats,
        monthly_revenue=monthly_revenue,
        pie_labels=pie_labels,
        pie_data=pie_data
    )
