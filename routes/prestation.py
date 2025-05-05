from flask import Blueprint, render_template, url_for, redirect, flash, request, send_file, make_response, session
from flask import Blueprint, request, render_template, redirect, url_for, flash, current_app, abort
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, not_, text
import json
from sqlalchemy.exc import SQLAlchemyError
import os
from io import BytesIO
from xhtml2pdf import pisa

from extensions import db
from models import Prestation, Client, User, TypeDemenagement, Vehicule, Notification
from forms import PrestationForm, SearchPrestationForm
from utils import notifier_transporteurs, accepter_prestation, refuser_prestation

prestation_bp = Blueprint('prestation', __name__)

@prestation_bp.route('/')
@login_required
def index():
    form = SearchPrestationForm()

    # Handle search and filter
    query = request.args.get('query', '')
    show_archived = request.args.get('archives', type=bool, default=False)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Base query with eager loading
    prestations_query = Prestation.query.options(
        db.joinedload(Prestation.client_principal),
        db.joinedload(Prestation.transporteurs),
        db.joinedload(Prestation.commercial)
    )

    # Filter by archive status
    if not show_archived:
        prestations_query = prestations_query.filter_by(archive=False)

    # For transporteur role, only show assigned prestations
    if current_user.role == 'transporteur':
        prestations_query = prestations_query.filter(
            Prestation.transporteurs.any(id=current_user.id)
        )
    # For commercial role (non-admin), only show their own prestations
    elif current_user.role == 'commercial' and not current_user.is_admin() and current_user.id != 1:
        prestations_query = prestations_query.filter(
            Prestation.commercial_id == current_user.id
        )

    # Apply search if provided
    if query:
        search = f"%{query}%"
        # Find client IDs matching the search
        matching_client_ids = [c.id for c in Client.query.filter(
            (Client.nom.ilike(search)) | 
            (Client.prenom.ilike(search))
        ).all()]

        prestations_query = prestations_query.filter(
            (Prestation.adresse_depart.ilike(search)) |
            (Prestation.adresse_arrivee.ilike(search)) |
            (Prestation.type_demenagement.ilike(search)) |
            (Prestation.tags.ilike(search)) |
            (Prestation.client_id.in_(matching_client_ids))
        )

    # Order by date (most recent first)
    prestations_query = prestations_query.order_by(Prestation.date_debut.desc())

    # Execute query with pagination
    prestations = prestations_query.paginate(page=page, per_page=per_page, error_out=False)

    return render_template(
        'prestations/index.html',
        title='Prestations',
        prestations=prestations,
        form=form,
        query=query,
        show_archived=show_archived
    )

@prestation_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    form = PrestationForm()
    
    try:
        # Charger les types de déménagement depuis la base de données
        types_demenagement = TypeDemenagement.query.all()
        form.type_demenagement.choices = [(t.id, t.nom) for t in types_demenagement]

        # Charger les clients en fonction du rôle de l'utilisateur
        if current_user.role in ['admin', 'superadmin']:
            clients = Client.query.filter_by(archive=False).all()
        else:
            clients = Client.query.filter_by(commercial_id=current_user.id, archive=False).all()
        form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]

        # Charger les transporteurs
        transporteurs = User.query.filter(User.role.in_(['transporteur', 'admin'])).all()
        form.transporteurs.choices = [(t.id, f"{t.nom} {t.prenom}") for t in transporteurs]

        if form.validate_on_submit():
            try:
                current_app.logger.info("Début de la création de la prestation")
                
                # Récupérer le type de déménagement
                type_dem = TypeDemenagement.query.get(form.type_demenagement.data)
                if not type_dem:
                    raise ValueError("Type de déménagement invalide")
                
                current_app.logger.info(f"Type de déménagement trouvé: {type_dem.nom}")

                # Créer la prestation
                prestation = Prestation(
                    client_id=form.client_id.data,
                    date_debut=form.date_debut.data,
                    date_fin=form.date_fin.data,
                    adresse_depart=form.adresse_depart.data,
                    adresse_arrivee=form.adresse_arrivee.data,
                    type_demenagement=type_dem.nom,
                    type_demenagement_id=type_dem.id,
                    observations=form.observations.data,
                    mode_groupage=form.mode_groupage.data,
                    montant=form.montant.data if form.montant.data else 0,
                    date_creation=datetime.now(),
                    statut=form.statut.data,
                    tags=form.tags.data if form.tags.data else '',
                    priorite=form.priorite.data,
                    commercial_id=current_user.id,
                    createur_id=current_user.id,
                    societe=form.societe.data if form.societe.data else ''
                )

                current_app.logger.info("Prestation créée en mémoire")

                # Récupérer les clients supplémentaires et leurs montants
                clients_supplementaires = request.form.getlist('clients_supplementaires[]')
                montants_supplementaires = request.form.getlist('montants_supplementaires[]')
                
                current_app.logger.info(f"Clients supplémentaires: {clients_supplementaires}")
                current_app.logger.info(f"Montants supplémentaires: {montants_supplementaires}")

                # Démarrer la transaction
                db.session.add(prestation)
                db.session.commit()
                current_app.logger.info(f"Prestation ajoutée à la base de données avec l'ID: {prestation.id}")

                # Gérer les clients supplémentaires en mode groupage
                if form.mode_groupage.data and clients_supplementaires:
                    current_app.logger.info("Mode groupage activé")
                    
                    # Supprimer d'abord toute association existante
                    db.session.execute(
                        text("DELETE FROM prestation_clients WHERE prestation_id = :pid"),
                        {"pid": prestation.id}
                    )
                    
                    # Vider la liste des clients supplémentaires
                    prestation.clients_supplementaires = []
                    db.session.commit()
                    
                    # Ajouter les nouveaux clients supplémentaires
                    for i, client_id in enumerate(clients_supplementaires):
                        if client_id and client_id.isdigit():
                            client = Client.query.get(int(client_id))
                            if client:
                                montant = 0
                                if i < len(montants_supplementaires) and montants_supplementaires[i].strip():
                                    try:
                                        montant = float(montants_supplementaires[i])
                                    except ValueError as e:
                                        current_app.logger.error(f"Erreur de conversion du montant: {str(e)}")
                                        montant = 0

                                current_app.logger.info(f"Ajout du client {client.id} avec montant {montant}")
                                
                                # Ajouter le client à la relation many-to-many
                                prestation.clients_supplementaires.append(client)
                                db.session.commit()
                                
                                # Mettre à jour le montant dans la table d'association
                                try:
                                    db.session.execute(
                                        text("UPDATE prestation_clients SET montant = :m WHERE prestation_id = :pid AND client_id = :cid"),
                                        {"pid": prestation.id, "cid": client.id, "m": montant}
                                    )
                                    db.session.commit()
                                    current_app.logger.info(f"Montant ajouté pour le client {client.id}")
                                except Exception as e:
                                    current_app.logger.error(f"Erreur lors de l'ajout du montant: {str(e)}")
                                    db.session.rollback()

                # Gérer les transporteurs
                if form.transporteurs.data:
                    current_app.logger.info("Ajout des transporteurs")
                    for transporteur_id in form.transporteurs.data:
                        transporteur = User.query.get(transporteur_id)
                        if transporteur:
                            prestation.transporteurs.append(transporteur)
                            current_app.logger.info(f"Transporteur {transporteur.id} ajouté")
                    db.session.commit()

                current_app.logger.info("Transaction validée avec succès")
                flash('Prestation créée avec succès!', 'success')
                return redirect(url_for('prestation.view', id=prestation.id))

            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Erreur détaillée lors de la création de la prestation: {str(e)}")
                flash('Une erreur est survenue lors de la création de la prestation.', 'error')
                return render_template('prestations/add.html', form=form, types_demenagement=types_demenagement)

    except Exception as e:
        current_app.logger.error(f"Erreur lors du chargement du formulaire: {str(e)}")
        flash('Une erreur est survenue lors du chargement du formulaire.', 'error')

    return render_template(
        'prestations/add.html',
        form=form,
        types_demenagement=types_demenagement
    )

@prestation_bp.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit(id):
    prestation = Prestation.query.get_or_404(id)
    form = PrestationForm(obj=prestation)
    
    # Charger les types de déménagement depuis la base de données
    types_demenagement = TypeDemenagement.query.all()
    form.type_demenagement.choices = [(t.id, t.nom) for t in types_demenagement]
    
    # Pré-sélectionner le type de déménagement actuel
    if prestation.type_demenagement_id:
        form.type_demenagement.data = prestation.type_demenagement_id
    
    # Charger les clients en fonction du rôle de l'utilisateur
    if current_user.role in ['admin', 'superadmin']:
        clients = Client.query.filter_by(archive=False).all()
    else:
        clients = Client.query.filter_by(commercial_id=current_user.id, archive=False).all()
    form.client_id.choices = [(c.id, f"{c.nom} {c.prenom}") for c in clients]
    
    # Charger les transporteurs
    transporteurs = User.query.filter(User.role.in_(['transporteur', 'admin'])).all()
    form.transporteurs.choices = [(t.id, f"{t.nom} {t.prenom}") for t in transporteurs]
    
    # Pré-sélectionner les transporteurs actuels
    form.transporteurs.data = [t.id for t in prestation.transporteurs]
    
    # Récupérer les montants des clients supplémentaires
    clients_montants = {}
    if prestation.mode_groupage:
        try:
            result = db.session.execute(
                text("SELECT client_id, montant FROM prestation_clients WHERE prestation_id = :pid"),
                {"pid": prestation.id}
            ).fetchall()
            
            for client_id, montant in result:
                clients_montants[client_id] = montant
            current_app.logger.info(f"Montants récupérés: {clients_montants}")
        except Exception as e:
            current_app.logger.error(f"Erreur lors de la récupération des montants: {str(e)}")
    
    if form.validate_on_submit():
        try:
            current_app.logger.info(f"Début de la modification de la prestation {id}")
            
            # Récupérer le type de déménagement
            type_dem = TypeDemenagement.query.get(form.type_demenagement.data)
            if not type_dem:
                raise ValueError("Type de déménagement invalide")
            
            # Mettre à jour les champs de la prestation
            prestation.client_id = form.client_id.data
            prestation.date_debut = form.date_debut.data
            prestation.date_fin = form.date_fin.data
            prestation.adresse_depart = form.adresse_depart.data
            prestation.adresse_arrivee = form.adresse_arrivee.data
            prestation.type_demenagement = type_dem.nom
            prestation.type_demenagement_id = type_dem.id
            prestation.observations = form.observations.data
            prestation.mode_groupage = form.mode_groupage.data
            prestation.montant = form.montant.data if form.montant.data else 0
            prestation.statut = form.statut.data
            prestation.tags = form.tags.data if form.tags.data else ''
            prestation.priorite = form.priorite.data
            prestation.date_modification = datetime.now()
            prestation.modificateur_id = current_user.id
            prestation.societe = form.societe.data if form.societe.data else ''
            
            # Enregistrer les modifications de base
            db.session.commit()
            current_app.logger.info(f"Prestation {id} mise à jour")
            
            # Gérer les transporteurs
            prestation.transporteurs = []
            db.session.commit()
            
            if form.transporteurs.data:
                for transporteur_id in form.transporteurs.data:
                    transporteur = User.query.get(transporteur_id)
                    if transporteur:
                        prestation.transporteurs.append(transporteur)
                db.session.commit()
                current_app.logger.info(f"Transporteurs mis à jour pour la prestation {id}")
            
            # Récupérer les clients supplémentaires et leurs montants
            clients_supplementaires = request.form.getlist('clients_supplementaires[]')
            montants_supplementaires = request.form.getlist('montants_supplementaires[]')
            
            current_app.logger.info(f"Clients supplémentaires: {clients_supplementaires}")
            current_app.logger.info(f"Montants supplémentaires: {montants_supplementaires}")
            
            # Gérer les clients supplémentaires en mode groupage
            if form.mode_groupage.data:
                current_app.logger.info(f"Mode groupage activé pour la prestation {id}")
                
                # Supprimer d'abord toute association existante
                db.session.execute(
                    text("DELETE FROM prestation_clients WHERE prestation_id = :pid"),
                    {"pid": prestation.id}
                )
                
                # Vider la liste des clients supplémentaires
                prestation.clients_supplementaires = []
                db.session.commit()
                
                # Ajouter les nouveaux clients supplémentaires
                if clients_supplementaires:
                    for i, client_id in enumerate(clients_supplementaires):
                        if client_id and client_id.isdigit():
                            client = Client.query.get(int(client_id))
                            if client:
                                montant = 0
                                if i < len(montants_supplementaires) and montants_supplementaires[i].strip():
                                    try:
                                        montant = float(montants_supplementaires[i])
                                    except ValueError as e:
                                        current_app.logger.error(f"Erreur de conversion du montant: {str(e)}")
                                        montant = 0
                                
                                current_app.logger.info(f"Ajout du client {client.id} avec montant {montant}")
                                
                                # Ajouter le client à la relation many-to-many
                                prestation.clients_supplementaires.append(client)
                                db.session.commit()
                                
                                # Mettre à jour le montant dans la table d'association
                                try:
                                    db.session.execute(
                                        text("UPDATE prestation_clients SET montant = :m WHERE prestation_id = :pid AND client_id = :cid"),
                                        {"pid": prestation.id, "cid": client.id, "m": montant}
                                    )
                                    db.session.commit()
                                    current_app.logger.info(f"Montant ajouté pour le client {client.id}")
                                except Exception as e:
                                    current_app.logger.error(f"Erreur lors de l'ajout du montant: {str(e)}")
                                    db.session.rollback()
            else:
                # Si le mode groupage est désactivé, supprimer tous les clients supplémentaires
                db.session.execute(
                    text("DELETE FROM prestation_clients WHERE prestation_id = :pid"),
                    {"pid": prestation.id}
                )
                prestation.clients_supplementaires = []
                db.session.commit()
                current_app.logger.info(f"Clients supplémentaires supprimés pour la prestation {id} (mode groupage désactivé)")
            
            flash('Prestation modifiée avec succès!', 'success')
            return redirect(url_for('prestation.view', id=prestation.id))
        
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erreur lors de la modification de la prestation {id}: {str(e)}")
            flash('Une erreur est survenue lors de la modification de la prestation.', 'error')
    
    return render_template(
        'prestations/edit.html',
        form=form,
        prestation=prestation,
        types_demenagement=types_demenagement,
        clients_montants=clients_montants
    )

@prestation_bp.route('/view/<int:id>')
@login_required
def view(id):
    """Afficher les détails d'une prestation."""
    # Récupérer la prestation avec ses relations
    prestation = Prestation.query.options(
        db.joinedload(Prestation.client_principal),
        db.joinedload(Prestation.clients_supplementaires),
        db.joinedload(Prestation.transporteurs)
    ).get_or_404(id)
    
    # Vérifier les permissions
    if current_user.role == 'transporteur':
        # Vérifier si le transporteur a une notification pour cette prestation
        notification = Notification.query.filter_by(
            user_id=current_user.id,
            prestation_id=id,
            role_destinataire='transporteur'
        ).first()
        
        # Autoriser l'accès si le transporteur est assigné ou a reçu une notification
        if current_user not in prestation.transporteurs and not notification:
            flash('Vous n\'avez pas accès à cette prestation.', 'danger')
            return redirect(url_for('transporteur_prestations.mes_prestations'))
    
    # Récupérer les montants des clients supplémentaires
    montants_clients = {}
    if prestation.mode_groupage and prestation.clients_supplementaires:
        # Utiliser la table d'association directement
        stmt = db.text("""
            SELECT client_id, montant 
            FROM prestation_clients 
            WHERE prestation_id = :prestation_id
        """)
        result = db.session.execute(stmt, {"prestation_id": prestation.id})
        montants_clients = {row[0]: row[1] for row in result}
        current_app.logger.info(f"Montants des clients supplémentaires: {montants_clients}")
    
    # Récupérer les transporteurs directement depuis la table d'association
    transporteurs = []
    try:
        # Requête directe pour récupérer les transporteurs assignés à cette prestation
        transporteurs_query = db.session.query(User).join(
            prestation_transporteurs, 
            User.id == prestation_transporteurs.c.user_id
        ).filter(
            prestation_transporteurs.c.prestation_id == prestation.id
        ).all()
        
        if transporteurs_query:
            transporteurs = transporteurs_query
            current_app.logger.info(f"Transporteurs récupérés via requête directe: {[t.nom for t in transporteurs if hasattr(t, 'nom')]}")
        else:
            # Fallback: utiliser la relation ORM si la requête directe ne donne rien
            transporteurs = list(prestation.transporteurs)
            current_app.logger.info(f"Transporteurs récupérés via relation ORM: {[t.nom for t in transporteurs if hasattr(t, 'nom')]}")
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des transporteurs: {str(e)}")
        # En cas d'erreur, utiliser la relation ORM
        transporteurs = list(prestation.transporteurs)
    
    current_app.logger.info(f"Nombre final de transporteurs: {len(transporteurs)}")
    
    # Préparer la liste complète des clients (principal + supplémentaires)
    all_clients = [prestation.client_principal]
    if prestation.clients_supplementaires:
        all_clients.extend(prestation.clients_supplementaires)
    
    # Log des données réelles pour le débogage
    current_app.logger.info(f"Prestation ID: {prestation.id}")
    current_app.logger.info(f"Étapes de départ réelles: {prestation.etapes_depart}")
    current_app.logger.info(f"Étapes d'arrivée réelles: {prestation.etapes_arrivee}")
    current_app.logger.info(f"Nombre de transporteurs réels: {len(transporteurs)}")
    if transporteurs:
        current_app.logger.info(f"Transporteurs réels: {[t.nom for t in transporteurs]}")
    
    # Utiliser les nouvelles méthodes du modèle Prestation
    current_app.logger.info(f"Étapes de départ (méthode): {prestation.get_etapes_depart()}")
    current_app.logger.info(f"Étapes d'arrivée (méthode): {prestation.get_etapes_arrivee()}")
    current_app.logger.info(f"Has étapes départ: {prestation.has_etapes_depart()}")
    current_app.logger.info(f"Has étapes arrivée: {prestation.has_etapes_arrivee()}")
    current_app.logger.info(f"Nombre total d'étapes: {prestation.count_etapes()}")

    # Ajouter des données supplémentaires pour le débogage
    debug_data = {
        'prestation_id': prestation.id,
        'etapes_depart': prestation.get_etapes_depart(),
        'etapes_arrivee': prestation.get_etapes_arrivee(),
        'transporteurs': [{'id': t.id, 'nom': t.nom} for t in transporteurs]
    }

    return render_template(
        'prestations/view.html',
        title='Détails de la Prestation',
        prestation=prestation,
        client=prestation.client_principal,
        clients=all_clients,
        transporteurs=transporteurs,
        debug_data=debug_data,
        prestation_clients=montants_clients
    )

@prestation_bp.route('/assign_transporteurs/<int:id>', methods=['GET', 'POST'])
@login_required
def assign_transporteurs(id):
    """Assigner des transporteurs à une prestation."""
    # Vérifier les permissions
    if not current_user.is_admin() and current_user.role != 'commercial':
        flash('Vous n\'êtes pas autorisé à assigner des transporteurs.', 'danger')
        return redirect(url_for('prestation.index'))
    
    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(id)
    
    # Récupérer tous les transporteurs actifs
    transporteurs = User.query.filter_by(role='transporteur', statut='actif').order_by(User.nom).all()
    
    # Récupérer les transporteurs déjà assignés
    transporteurs_assignes = prestation.transporteurs
    
    # Créer une liste d'IDs des transporteurs déjà assignés
    transporteurs_assignes_ids = [t.id for t in transporteurs_assignes]
    
    if request.method == 'POST':
        try:
            # Récupérer les transporteurs sélectionnés
            selected_transporteurs = request.form.getlist('transporteurs')
            
            # Convertir en entiers
            selected_transporteurs = [int(t_id) for t_id in selected_transporteurs if t_id.isdigit()]
            
            # Réinitialiser les transporteurs assignés
            prestation.transporteurs = []
            db.session.flush()  # Forcer la mise à jour des relations
            
            # Ajouter les transporteurs sélectionnés
            transporteurs_a_notifier = []
            for t_id in selected_transporteurs:
                transporteur = User.query.get(t_id)
                if transporteur and transporteur.role == 'transporteur':
                    prestation.transporteurs.append(transporteur)
                    
                    # Ajouter à la liste des transporteurs à notifier s'il est nouveau
                    if t_id not in transporteurs_assignes_ids:
                        transporteurs_a_notifier.append(transporteur)
            
            # Sauvegarder d'abord les modifications de la prestation
            db.session.commit()
            
            # Envoyer des notifications aux nouveaux transporteurs assignés
            if transporteurs_a_notifier:
                if notifier_transporteurs(prestation, transporteurs_a_notifier, 'assignation'):
                    flash(f'{len(transporteurs_a_notifier)} transporteur(s) notifié(s) de leur assignation.', 'info')
                else:
                    flash('Erreur lors de l\'envoi des notifications aux transporteurs.', 'warning')

            # Sauvegarder les modifications
            db.session.commit()

            flash(f'{len(selected_transporteurs)} transporteur(s) assigné(s) avec succès!', 'success')
            return redirect(url_for('prestation.view', id=prestation.id))
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erreur lors de l'assignation des transporteurs: {str(e)}")
            flash(f'Erreur lors de l\'assignation des transporteurs: {str(e)}', 'danger')
    
    # Afficher le formulaire
    return render_template(
        'prestations/assign_transporteurs.html',
        title='Assigner des transporteurs',
        prestation=prestation,
        transporteurs=transporteurs,
        transporteurs_assignes_ids=transporteurs_assignes_ids
    )

@prestation_bp.route('/add_etapes/<int:id>', methods=['GET', 'POST'])
@login_required
def add_etapes(id):
    """Ajouter des étapes à une prestation existante."""
    # Vérifier les permissions
    if not current_user.is_admin() and current_user.role != 'commercial':
        flash('Vous n\'êtes pas autorisé à modifier les étapes.', 'danger')
        return redirect(url_for('prestation.index'))
    
    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(id)
    
    if request.method == 'POST':
        # Récupérer les étapes de départ et d'arrivée
        etapes_depart = request.form.getlist('etape_depart[]')
        etapes_arrivee = request.form.getlist('etape_arrivee[]')
        
        # Filtrer les étapes vides
        etapes_depart = [etape for etape in etapes_depart if etape.strip()]
        etapes_arrivee = [etape for etape in etapes_arrivee if etape.strip()]
        
        # Enregistrer les étapes
        # Si la liste est vide, on met une chaîne vide pour effacer les étapes existantes
        prestation.etapes_depart = '||'.join(etapes_depart) if etapes_depart else ''
        prestation.etapes_arrivee = '||'.join(etapes_arrivee) if etapes_arrivee else ''
        
        current_app.logger.info(f"Étapes de départ mises à jour: {prestation.etapes_depart}")
        current_app.logger.info(f"Étapes d'arrivée mises à jour: {prestation.etapes_arrivee}")
        
        # Sauvegarder les modifications
        try:
            db.session.commit()
            flash('Étapes mises à jour avec succès!', 'success')
            
            # Rediriger vers la page de détails de la prestation
            return redirect(url_for('prestation.view', id=prestation.id))
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la mise à jour des étapes: {str(e)}', 'danger')
    
    # Récupérer les étapes existantes
    etapes_depart = prestation.get_etapes_depart()
    etapes_arrivee = prestation.get_etapes_arrivee()
    
    # Afficher le formulaire
    return render_template(
        'prestations/add_etapes.html',
        title='Gérer les étapes',
        prestation=prestation,
        etapes_depart=etapes_depart,
        etapes_arrivee=etapes_arrivee
    )

@prestation_bp.route('/toggle_archive/<int:id>')
@login_required
def toggle_archive(id):
    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(id)

    # Vérifier les permissions
    if not current_user.is_admin() and current_user.role != 'commercial':
        flash('Vous n\'avez pas l\'autorisation d\'archiver/désarchiver des prestations.', 'danger')
        return redirect(url_for('prestation.index'))

    # Inverser le statut d'archivage
    prestation.archive = not prestation.archive

    # Enregistrer les modifications
    try:
        db.session.commit()
        status = 'archivée' if prestation.archive else 'désarchivée'
        flash(f'Prestation {status} avec succès!', 'success')
    except SQLAlchemyError as e:
        db.session.rollback()
        flash(f'Erreur SQL lors de la modification du statut d\'archivage: {str(e)}', 'danger')
    except Exception as e:
        db.session.rollback()
        flash(f'Erreur lors de la modification du statut d\'archivage: {str(e)}', 'danger')

    # Rediriger vers la liste des prestations
    return redirect(url_for('prestation.index'))

@prestation_bp.route('/historique/<int:id>')
@login_required
def historique(id):
    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(id)

    # Vérifier les permissions
    if not current_user.is_admin() and current_user.role != 'commercial':
        flash('Vous n\'avez pas l\'autorisation de voir l\'historique des prestations.', 'danger')
        return redirect(url_for('prestation.index'))

    # Pour l'instant, nous n'avons pas de système d'historique des versions
    # Nous allons donc simplement afficher un message
    flash('La fonctionnalité d\'historique des versions sera disponible prochainement.', 'info')
    return redirect(url_for('prestation.view', id=id))

@prestation_bp.route('/repondre/<int:id>', methods=['GET', 'POST'])
@login_required
def repondre(id):
    # Vérifier que l'utilisateur est un transporteur
    if current_user.role != 'transporteur':
        flash('Vous n\'avez pas l\'autorisation d\'accéder à cette page.', 'danger')
        return redirect(url_for('prestation.index'))

    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(id)

    # Vérifier que le transporteur est bien assigné à cette prestation
    transporteur_assigne = False
    for transporteur in prestation.transporteurs:
        if transporteur.id == current_user.id:
            transporteur_assigne = True
            break

    if not transporteur_assigne:
        flash('Vous n\'avez pas été assigné à cette prestation.', 'danger')
        return redirect(url_for('prestation.index'))

    # Traiter le formulaire de réponse
    if request.method == 'POST':
        reponse = request.form.get('reponse')
        commentaire = request.form.get('commentaire')

        if reponse == 'accepter':
            if accepter_prestation(id, current_user.id, commentaire):
                flash('Vous avez accepté cette prestation avec succès.', 'success')
                return redirect(url_for('prestation.index'))
        elif reponse == 'refuser':
            if refuser_prestation(id, current_user.id, commentaire):
                flash('Vous avez refusé cette prestation avec succès.', 'success')
                return redirect(url_for('prestation.index'))
        else:
            flash('Réponse invalide.', 'danger')

    # Récupérer le client principal
    client = Client.query.get(prestation.client_id) if prestation.client_id else None

    return render_template(
        'prestations/repondre.html',
        title='Répondre à la Prestation',
        prestation=prestation,
        client=client
    )

@prestation_bp.route('/mes-prestations')
@login_required
def mes_prestations():
    # Vérifier que l'utilisateur est un transporteur
    if current_user.role != 'transporteur':
        flash('Vous n\'avez pas l\'autorisation d\'accéder à cette page.', 'danger')
        return redirect(url_for('prestation.index'))

    # Récupérer les prestations assignées au transporteur
    prestations = Prestation.query.filter(
        Prestation.transporteurs.any(id=current_user.id)
    ).order_by(Prestation.date_debut.desc()).all()

    return render_template(
        'prestations/mes_prestations.html',
        title='Mes Prestations',
        prestations=prestations
    )

@prestation_bp.route('/delete/<int:id>')
@login_required
def delete(id):
    # Vérifier que l'utilisateur est administrateur
    if not current_user.is_admin():
        current_app.logger.warning(f"Tentative de suppression non autorisée par l'utilisateur {current_user.id}")
        flash('Vous n\'avez pas l\'autorisation de supprimer des prestations.', 'danger')
        return redirect(url_for('prestation.index'))

    try:
        # Récupérer la prestation
        prestation = Prestation.query.get_or_404(id)

        # Vérifier si la prestation a des factures associées
        if hasattr(prestation, 'factures') and prestation.factures:
            flash('Impossible de supprimer une prestation qui a des factures associées.', 'danger')
            return redirect(url_for('prestation.index'))

        # Vérifier si la prestation est en cours ou terminée
        if prestation.statut in ['En cours', 'Terminée']:
            flash('Impossible de supprimer une prestation en cours ou terminée.', 'danger')
            return redirect(url_for('prestation.index'))

        # Supprimer les associations avec les transporteurs
        prestation.transporteurs = []

        # Supprimer la prestation
        db.session.delete(prestation)
        db.session.commit()

        current_app.logger.info(f"Prestation {id} supprimée par l'utilisateur {current_user.id}")
        flash('Prestation supprimée avec succès!', 'success')
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur SQL lors de la suppression de la prestation {id}: {str(e)}")
        flash('Une erreur est survenue lors de la suppression de la prestation.', 'danger')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur inattendue lors de la suppression de la prestation {id}: {str(e)}")
        flash('Une erreur inattendue est survenue.', 'danger')

    return redirect(url_for('prestation.index'))

@prestation_bp.route('/confirm-delete/<int:id>')
@login_required
def confirm_delete(id):
    # Vérifier que l'utilisateur est administrateur
    if not current_user.is_admin():
        flash('Vous n\'avez pas l\'autorisation de supprimer des prestations.', 'danger')
        return redirect(url_for('prestation.index'))

    # Récupérer la prestation
    prestation = Prestation.query.get_or_404(id)

    return render_template(
        'prestations/confirm_delete.html',
        title='Confirmer la suppression',
        prestation=prestation
    )

@prestation_bp.route('/print/<int:id>')
@login_required
def print_prestation(id):
    prestation = Prestation.query.get_or_404(id)
    
    # Générer le HTML avec le domaine complet pour les images
    html = render_template('prestations/print.html', 
                         prestation=prestation,
                         base_url=request.url_root)
    
    # Créer un buffer pour le PDF
    pdf_buffer = BytesIO()
    
    try:
        # Convertir HTML en PDF avec les options pour les images
        pisa_status = pisa.CreatePDF(
            html,
            dest=pdf_buffer,
            encoding='utf-8',
            show_error_as_pdf=True,
            path=request.url_root  # Ajouter le chemin de base pour les images
        )
        
        # Vérifier si la conversion a réussi
        if not pisa_status.err:
            # Préparer la réponse
            pdf_buffer.seek(0)
            response = make_response(pdf_buffer.getvalue())
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'inline; filename=prestation_{id}.pdf'
            return response
        else:
            # En cas d'erreur de conversion
            flash("Erreur lors de la génération du PDF.", "error")
            return html
            
    except Exception as e:
        # En cas d'erreur, afficher la version HTML
        flash("Impossible de générer le PDF. Affichage en HTML.", "warning")
        return html