from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import or_, and_, desc, func
from datetime import datetime, timedelta
import os
import json
from decimal import Decimal

from extensions import db
from models import Stockage, Client, ArticleStockage, StockageArticle, Facture, Prestation, User
from forms import StockageForm, ArticleStockageForm, SearchStockageForm
from auth import role_required

# Création du Blueprint
stockage_bp = Blueprint('stockage', __name__, url_prefix='/stockages')

@stockage_bp.route('/')
@login_required
@role_required('commercial', 'admin', 'superadmin')
def index():
    """Liste des stockages"""
    form = SearchStockageForm()
    
    # Initialiser les choix du formulaire
    clients = Client.query.filter_by(archive=False).order_by(Client.nom).all()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    # Utiliser 0 au lieu d'une chaîne vide pour éviter l'erreur de conversion
    form.client_id.choices.insert(0, (0, 'Tous les clients'))
    
    form.statut.choices = [
        ('Actif', 'Actif'),
        ('En attente', 'En attente'),
        ('Terminé', 'Terminé'),
        ('', 'Tous les statuts')
    ]
    
    # Récupération des paramètres de filtrage
    client_id = request.args.get('client_id', '')
    statut = request.args.get('statut', '')
    reference = request.args.get('reference', '')
    date_debut = request.args.get('date_debut', '')
    date_fin = request.args.get('date_fin', '')
    archives = 'archives' in request.args
    
    # Construction de la requête
    query = Stockage.query
    
    if client_id and client_id != '':
        query = query.filter(Stockage.client_id == client_id)
    
    if statut and statut != '':
        query = query.filter(Stockage.statut == statut)
    
    if reference:
        query = query.filter(Stockage.reference.ilike(f'%{reference}%'))
    
    if date_debut:
        date_debut = datetime.strptime(date_debut, '%Y-%m-%d')
        query = query.filter(Stockage.date_debut >= date_debut)
    
    if date_fin:
        date_fin = datetime.strptime(date_fin, '%Y-%m-%d')
        query = query.filter(Stockage.date_fin <= date_fin)
    
    if not archives:
        query = query.filter(Stockage.archive == False)
    
    # Application des filtres de rôle
    if current_user.role == 'transporteur':
        # Les transporteurs ne peuvent voir que les stockages des prestations auxquelles ils sont assignés
        query = query.join(Client).filter(Client.id.in_(
            db.session.query(Client.id)
            .join(Prestation, Client.id == Prestation.client_id)
            .join(Prestation.transporteurs)
            .filter(User.id == current_user.id)
        ))
    elif current_user.role == 'commercial':
        # Les commerciaux ne peuvent voir que les stockages de leurs clients
        query = query.join(Client).filter(Client.commercial_id == current_user.id)
    elif current_user.role not in ['admin', 'superadmin']:
        # Les utilisateurs non-admin ne peuvent voir que leurs propres stockages
        # ou ceux des clients qu'ils ont créés
        query = query.join(Client).filter(Client.created_by == current_user.id)
    
    # Récupération des stockages avec pagination
    page = request.args.get('page', 1, type=int)
    stockages = query.order_by(desc(Stockage.date_creation)).paginate(page=page, per_page=10)
    
    return render_template('stockages/index.html', stockages=stockages, form=form)

@stockage_bp.route('/add', methods=['GET', 'POST'])
@login_required
@role_required('commercial', 'admin', 'superadmin')
def add():
    """Ajouter un nouveau stockage"""
    # Récupérer les paramètres de l'URL (utilisés lors de la création depuis le calendrier)
    planning_name = request.args.get('name', '')
    planning_start_date = request.args.get('start_date', '')
    planning_end_date = request.args.get('end_date', '')
    planning_tags = request.args.get('tags', '')
    
    form = StockageForm()
    
    # Si le formulaire n'est pas encore soumis (méthode GET), pré-remplir avec les paramètres de l'URL
    if request.method == 'GET':
        # Mettre le nom du planning dans les observations
        if planning_name:
            form.observations.data = f"Planning: {planning_name}\n\n{form.observations.data or ''}"
        
        # Convertir et définir les dates si elles sont fournies
        if planning_start_date:
            try:
                # Convertir la date au format attendu
                start_date = datetime.strptime(planning_start_date, '%Y-%m-%d')
                form.date_debut.data = start_date
            except ValueError:
                pass
        
        if planning_end_date:
            try:
                # Convertir la date au format attendu
                end_date = datetime.strptime(planning_end_date, '%Y-%m-%d')
                form.date_fin.data = end_date
            except ValueError:
                pass
    
    # Récupérer les clients actifs pour le formulaire
    clients = Client.query.filter_by(archive=False).order_by(Client.nom).all()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    
    if form.validate_on_submit():
        stockage = Stockage()
        stockage.client_id = form.client_id.data
        stockage.reference = form.reference.data
        stockage.date_debut = form.date_debut.data
        stockage.date_fin = form.date_fin.data
        stockage.montant_mensuel = form.montant_mensuel.data
        stockage.caution = form.caution.data
        stockage.emplacement = form.emplacement.data
        stockage.volume_total = form.volume_total.data
        stockage.poids_total = form.poids_total.data
        stockage.statut = form.statut.data
        stockage.observations = form.observations.data
        stockage.created_by = current_user.id
        
        db.session.add(stockage)
        db.session.commit()
        
        flash(f'Stockage {stockage.reference} créé avec succès.', 'success')
        return redirect(url_for('stockage.edit', id=stockage.id))
    
    return render_template('stockages/add.html', form=form)

@stockage_bp.route('/<int:id>', methods=['GET'])
@login_required
def detail(id):
    """Afficher les détails d'un stockage"""
    stockage = Stockage.query.get_or_404(id)
    
    # Vérification des permissions
    if current_user.role not in ['admin', 'superadmin'] and stockage.client.created_by != current_user.id:
        abort(403, "Vous n'avez pas la permission d'accéder à ce stockage.")
    
    # Récupérer les articles stockés
    articles = StockageArticle.query.filter_by(stockage_id=stockage.id).all()
    
    # Calculer le coût total du stockage à ce jour
    aujourd_hui = datetime.now().date()
    debut = stockage.date_debut.date()
    fin = stockage.date_fin.date() if stockage.date_fin else aujourd_hui
    
    # Si le stockage est terminé, on prend la date de fin
    if stockage.statut == 'Terminé' and stockage.date_fin:
        fin = stockage.date_fin.date()
    
    # Calculer le nombre de mois
    delta = fin - debut
    jours = delta.days
    mois = jours // 30
    jours_restants = jours % 30
    
    # Calculer le montant
    cout_total = stockage.montant_mensuel * mois
    if jours_restants > 0:
        cout_total += (stockage.montant_mensuel / 30) * jours_restants
    
    return render_template(
        'stockages/details.html', 
        stockage=stockage, 
        articles=articles, 
        cout_total=cout_total
    )

@stockage_bp.route('/<int:id>/edit', methods=['GET', 'POST'])
@login_required
@role_required('commercial', 'admin', 'superadmin')
def edit(id):
    """Modifier un stockage existant"""
    stockage = Stockage.query.get_or_404(id)
    
    # Vérification des permissions
    if current_user.role not in ['admin', 'superadmin'] and stockage.client.created_by != current_user.id:
        abort(403, "Vous n'avez pas la permission de modifier ce stockage.")
    
    form = StockageForm(obj=stockage)
    form_article = ArticleStockageForm()
    
    # Récupérer les clients pour le formulaire
    clients = Client.query.filter_by(archive=False).order_by(Client.nom).all()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    
    # Récupérer les articles stockés
    articles_stockes = StockageArticle.query.filter_by(stockage_id=stockage.id).all()
    
    if form.validate_on_submit():
        stockage.client_id = form.client_id.data
        stockage.reference = form.reference.data
        stockage.date_debut = form.date_debut.data
        stockage.date_fin = form.date_fin.data
        stockage.montant_mensuel = form.montant_mensuel.data
        stockage.caution = form.caution.data
        stockage.emplacement = form.emplacement.data
        stockage.volume_total = form.volume_total.data
        stockage.poids_total = form.poids_total.data
        stockage.statut = form.statut.data
        stockage.observations = form.observations.data
        
        db.session.commit()
        
        flash(f'Stockage {stockage.reference} mis à jour avec succès.', 'success')
        return redirect(url_for('stockage.edit', id=stockage.id))
    
    return render_template(
        'stockages/edit.html', 
        form=form, 
        form_article=form_article, 
        stockage=stockage,
        articles=articles_stockes
    )

@stockage_bp.route('/<int:id>/toggle_archive', methods=['GET'])
@login_required
@role_required('commercial', 'admin', 'superadmin')
def toggle_archive(id):
    """Archiver ou désarchiver un stockage"""
    stockage = Stockage.query.get_or_404(id)
    
    # Vérification des permissions
    if current_user.role not in ['admin', 'superadmin'] and stockage.client.created_by != current_user.id:
        abort(403, "Vous n'avez pas la permission de modifier ce stockage.")
    
    stockage.archive = not stockage.archive
    db.session.commit()
    
    action = "archivé" if stockage.archive else "désarchivé"
    flash(f'Stockage {stockage.reference} {action} avec succès.', 'success')
    
    return redirect(url_for('stockage.index'))

@stockage_bp.route('/<int:id>/create_invoice', methods=['GET'])
@login_required
@role_required('commercial', 'admin', 'superadmin')
def create_invoice(id):
    """Créer une facture pour un stockage"""
    stockage = Stockage.query.get_or_404(id)
    
    # Vérification des permissions
    if current_user.role not in ['admin', 'superadmin'] and stockage.client.created_by != current_user.id:
        abort(403, "Vous n'avez pas la permission de créer une facture pour ce stockage.")
    
    # Calcul du montant de la facture (par défaut un mois de stockage)
    montant_ht = stockage.montant_mensuel
    taux_tva = 20.0
    montant_ttc = montant_ht * (1 + taux_tva / 100)
    
    # Générer le numéro de facture
    from config import Config
    prefix = Config.INVOICE_PREFIX
    today = datetime.now().strftime('%Y%m%d')
    count = Facture.query.filter(Facture.numero.like(f'{prefix}{today}%')).count()
    numero = f"{prefix}{today}{str(count + 1).zfill(3)}"
    
    # Créer une nouvelle facture
    facture = Facture(
        client_id=stockage.client_id,
        stockage_id=stockage.id,
        numero=numero,
        date_emission=datetime.now(),
        date_echeance=datetime.now() + timedelta(days=30),
        montant_ht=montant_ht,
        taux_tva=taux_tva,
        montant_ttc=montant_ttc,
        mode_paiement='Virement',
        statut='En attente',
        notes=f"Facture de stockage - Référence: {stockage.reference} - Période: {datetime.now().strftime('%d/%m/%Y')}"
    )
    
    db.session.add(facture)
    db.session.commit()
    
    flash(f'Facture {facture.numero} créée avec succès pour le stockage {stockage.reference}.', 'success')
    return redirect(url_for('facture.edit', id=facture.id))

@stockage_bp.route('/article/add', methods=['POST'])
@login_required
@role_required('commercial', 'admin', 'superadmin')
def add_article():
    """Ajouter un article à un stockage"""
    stockage_id = request.form.get('stockage_id')
    stockage = Stockage.query.get_or_404(stockage_id)
    
    # Vérification des permissions
    if current_user.role not in ['admin', 'superadmin'] and stockage.client.created_by != current_user.id:
        abort(403, "Vous n'avez pas la permission de modifier ce stockage.")
    
    form = ArticleStockageForm()
    
    if form.validate_on_submit():
        # Créer ou récupérer l'article
        article = ArticleStockage(
            nom=form.nom.data,
            description=form.description.data,
            categorie=form.categorie.data,
            dimensions=form.dimensions.data,
            volume=form.volume.data,
            poids=form.poids.data,
            valeur_declaree=form.valeur_declaree.data,
            code_barre=form.code_barre.data,
            fragile=form.fragile.data
        )
        
        db.session.add(article)
        db.session.commit()
        
        # Ajouter l'article au stockage
        stockage_article = StockageArticle(
            stockage_id=stockage.id,
            article_id=article.id,
            quantite=form.quantite.data
        )
        
        db.session.add(stockage_article)
        
        # Mettre à jour les totaux du stockage
        if form.volume.data and form.quantite.data:
            stockage.volume_total = (stockage.volume_total or 0) + (form.volume.data * form.quantite.data)
        
        if form.poids.data and form.quantite.data:
            stockage.poids_total = (stockage.poids_total or 0) + (form.poids.data * form.quantite.data)
        
        db.session.commit()
        
        flash(f'Article "{form.nom.data}" ajouté au stockage avec succès.', 'success')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f'Erreur dans le champ {getattr(form, field).label.text}: {error}', 'danger')
    
    return redirect(url_for('stockage.edit', id=stockage.id))

@stockage_bp.route('/article/remove', methods=['GET'])
@login_required
@role_required('commercial', 'admin', 'superadmin')
def remove_article():
    """Retirer un article d'un stockage"""
    stockage_id = request.args.get('stockage_id', type=int)
    article_id = request.args.get('article_id', type=int)
    
    if not stockage_id or not article_id:
        flash('Identifiants manquants pour supprimer l\'article.', 'danger')
        return redirect(url_for('stockage.index'))
        
    stockage_article = StockageArticle.query.filter_by(
        stockage_id=stockage_id, 
        article_id=article_id
    ).first_or_404()
    
    stockage_id = stockage_article.stockage_id
    stockage = Stockage.query.get_or_404(stockage_id)
    
    # Vérification des permissions
    if current_user.role not in ['admin', 'superadmin'] and stockage.client.created_by != current_user.id:
        abort(403, "Vous n'avez pas la permission de modifier ce stockage.")
    
    # Mise à jour des totaux du stockage
    if stockage_article.article.volume and stockage_article.quantite:
        stockage.volume_total = (stockage.volume_total or 0) - (stockage_article.article.volume * stockage_article.quantite)
    
    if stockage_article.article.poids and stockage_article.quantite:
        stockage.poids_total = (stockage.poids_total or 0) - (stockage_article.article.poids * stockage_article.quantite)
    
    # S'assurer que les totaux ne sont pas négatifs
    if stockage.volume_total and stockage.volume_total < 0:
        stockage.volume_total = 0
    
    if stockage.poids_total and stockage.poids_total < 0:
        stockage.poids_total = 0
    
    # Supprimer l'article du stockage
    db.session.delete(stockage_article)
    db.session.commit()
    
    flash('Article retiré du stockage avec succès.', 'success')
    return redirect(url_for('stockage.edit', id=stockage_id))

@stockage_bp.route('/delete/<int:id>')
@login_required
@role_required('commercial', 'admin', 'superadmin')
def delete(id):
    stockage = Stockage.query.get_or_404(id)
    
    try:
        db.session.delete(stockage)
        db.session.commit()
        flash('Le stockage a été supprimé avec succès.', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Une erreur est survenue lors de la suppression du stockage.', 'danger')
    
    return redirect(url_for('stockage.index'))

@stockage_bp.route('/change_status/<int:id>')
@login_required
def change_status(id):
    stockage = Stockage.query.get_or_404(id)
    
    if stockage.statut == 'Actif':
        stockage.statut = 'Terminé'
        db.session.commit()
        flash('Le stockage a été marqué comme terminé.', 'success')
    
    return redirect(url_for('stockage.index'))