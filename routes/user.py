from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
from sqlalchemy import or_

from extensions import db
from models import User, TypeVehicule
from forms import UserForm, SearchUserForm
from auth import role_required

user_bp = Blueprint('user', __name__)

@user_bp.route('/users')
@login_required
@role_required('admin', 'superadmin')
def index():
    form = SearchUserForm()
    
    # Populate role dropdown for filter
    role_choices = [
        ('', 'Tous les rôles'),
        ('transporteur', 'Transporteur'),
        ('commercial', 'Commercial'),
        ('admin', 'Admin'),
        ('superadmin', 'Super Admin')
    ]
    form.role.choices = role_choices
    
    # Populate statut dropdown for filter
    statut_choices = [
        ('', 'Tous les statuts'),
        ('actif', 'Actif'),
        ('inactif', 'Inactif')
    ]
    form.statut.choices = statut_choices
    
    # Get filters
    query = request.args.get('query', '')
    role = request.args.get('role', '')
    statut = request.args.get('statut', '')
    
    # Set form data
    form.query.data = query
    if role:
        form.role.data = role
    if statut:
        form.statut.data = statut
    
    # Build query
    users_query = User.query
    
    # Si l'utilisateur n'est pas un superadmin, ne pas montrer les comptes superadmin
    # et ne pas montrer les comptes admin aux commerciaux et transporteurs
    if current_user.role != 'superadmin':
        users_query = users_query.filter(User.role != 'superadmin')
        
        # Les commerciaux et transporteurs ne peuvent pas voir les admins non plus
        if current_user.role not in ['admin']:
            users_query = users_query.filter(User.role != 'admin')
    
    # Apply role filter
    if role:
        users_query = users_query.filter_by(role=role)
    
    # Apply statut filter
    if statut:
        users_query = users_query.filter_by(statut=statut)
    
    # Apply search if provided
    if query:
        search = f"%{query}%"
        users_query = users_query.filter(
            or_(
                User.nom.ilike(search),
                User.prenom.ilike(search),
                User.username.ilike(search),
                User.email.ilike(search)
            )
        )
    
    # Order by most recent first
    users = users_query.order_by(User.date_creation.desc()).all()
    
    # Count by role - Ne pas inclure les superadmins dans les statistiques pour les non-superadmins
    if current_user.role == 'superadmin':
        role_counts = {
            'transporteur': sum(1 for u in users if u.role == 'transporteur'),
            'commercial': sum(1 for u in users if u.role == 'commercial'),
            'admin': sum(1 for u in users if u.role == 'admin'),
            'superadmin': sum(1 for u in users if u.role == 'superadmin')
        }
    else:
        role_counts = {
            'transporteur': sum(1 for u in users if u.role == 'transporteur'),
            'commercial': sum(1 for u in users if u.role == 'commercial'),
            'admin': sum(1 for u in users if u.role == 'admin')
        }
    
    return render_template(
        'users/index.html',
        title='Gestion des Utilisateurs',
        users=users,
        form=form,
        role_counts=role_counts
    )

@user_bp.route('/users/liste')
@login_required
@role_required('admin', 'superadmin')
def liste():
    # Récupérer tous les utilisateurs triés par rôle
    users = User.query.filter(User.role.in_(['commercial', 'transporteur'])).order_by(User.role, User.nom).all()
    return render_template('users/liste.html', users=users)

@user_bp.route('/users/add', methods=['GET', 'POST'])
@login_required
@role_required('admin', 'superadmin')
def add():
    form = UserForm()
    
    # Remplir les choix de types de véhicules
    types_vehicules = TypeVehicule.query.all()
    form.type_vehicule_id.choices = [(0, 'Aucun')] + [(t.id, t.nom) for t in types_vehicules]
    
    # Limiter les rôles disponibles en fonction du rôle actuel
    role_choices = []
    if current_user.role == 'superadmin':
        role_choices = [
            ('transporteur', 'Transporteur'),
            ('commercial', 'Commercial'),
            ('admin', 'Admin'),
            ('superadmin', 'Super Admin')
        ]
    else:  # Admin standard
        role_choices = [
            ('transporteur', 'Transporteur'),
            ('commercial', 'Commercial')
        ]
    form.role.choices = role_choices
    
    if form.validate_on_submit():
        # Vérification supplémentaire pour s'assurer qu'un admin ne peut pas créer d'admin ou super_admin
        if current_user.role == 'admin' and form.role.data in ['admin', 'superadmin']:
            flash('Vous n\'avez pas les permissions nécessaires pour créer un utilisateur avec ce rôle.', 'danger')
            return render_template('users/add.html', title='Ajouter un Utilisateur', form=form)
        
        # Check if username already exists
        existing_user = User.query.filter_by(username=form.username.data).first()
        if existing_user:
            flash('Ce nom d\'utilisateur est déjà pris.', 'danger')
            return render_template('users/add.html', title='Ajouter un Utilisateur', form=form)
        
        # Check if email already exists (if provided)
        if form.email.data:
            existing_email = User.query.filter_by(email=form.email.data).first()
            if existing_email:
                flash('Cette adresse email est déjà utilisée.', 'danger')
                return render_template('users/add.html', title='Ajouter un Utilisateur', form=form)
        
        # Create user
        user = User(
            nom=form.nom.data,
            prenom=form.prenom.data,
            username=form.username.data,
            email=form.email.data,
            role=form.role.data,
            statut=form.statut.data,
            vehicule=form.vehicule.data if form.vehicule.data else None,
            type_vehicule_id=form.type_vehicule_id.data if form.type_vehicule_id.data != 0 else None,
            permis_conduire=form.permis_conduire.data if form.permis_conduire.data else None,
            notes=form.notes.data if form.notes.data else None
        )
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Utilisateur créé avec succès!', 'success')
        return redirect(url_for('user.index'))
    
    return render_template(
        'users/add.html',
        title='Ajouter un Utilisateur',
        form=form
    )

@user_bp.route('/users/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@role_required('admin', 'superadmin')
def edit(id):
    user = User.query.get_or_404(id)
    form = UserForm(obj=user)
    
    # Remplir les choix de types de véhicules
    types_vehicules = TypeVehicule.query.all()
    form.type_vehicule_id.choices = [(0, 'Aucun')] + [(t.id, t.nom) for t in types_vehicules]
    
    # Empêcher la modification des comptes superadmin par les non-superadmin
    if user.role == 'superadmin' and current_user.role != 'superadmin':
        flash('Vous n\'avez pas les permissions nécessaires pour modifier un super administrateur.', 'danger')
        return redirect(url_for('user.index'))
    
    # Empêcher la modification des comptes admin par les non-superadmin
    if user.role == 'admin' and current_user.role != 'superadmin':
        flash('Vous n\'avez pas les permissions nécessaires pour modifier un administrateur.', 'danger')
        return redirect(url_for('user.index'))
    
    if form.validate_on_submit():
        # Vérifier que l'admin ne tente pas de promouvoir en admin ou superadmin
        if current_user.role != 'superadmin' and form.role.data in ['admin', 'superadmin']:
            flash('Vous n\'avez pas les permissions nécessaires pour attribuer ce rôle.', 'danger')
            return render_template('users/edit.html', title='Modifier un Utilisateur', form=form, user=user)
        
        # Mise à jour des champs
        user.username = form.username.data
        user.email = form.email.data
        user.nom = form.nom.data
        user.prenom = form.prenom.data
        user.role = form.role.data
        user.statut = form.statut.data
        user.notes = form.notes.data
        user.permis_conduire = form.permis_conduire.data
        user.vehicule = form.vehicule.data
        user.type_vehicule_id = form.type_vehicule_id.data if form.type_vehicule_id.data != 0 else None
        
        # Mise à jour du mot de passe si fourni
        if form.password.data:
            user.set_password(form.password.data)
        
        try:
            db.session.commit()
            flash('Utilisateur modifié avec succès!', 'success')
            return redirect(url_for('user.index'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la modification de l\'utilisateur: {str(e)}', 'danger')
    
    return render_template('users/edit.html', title='Modifier un Utilisateur', form=form, user=user)

@user_bp.route('/users/delete/<int:id>')
@login_required
@role_required('admin', 'superadmin')
def delete(id):
    user = User.query.get_or_404(id)
    
    # Empêcher la suppression de son propre compte
    if user.id == current_user.id:
        flash('Vous ne pouvez pas supprimer votre propre compte.', 'danger')
        return redirect(url_for('user.index'))
    
    # Empêcher la suppression des comptes superadmin par les non-superadmin
    if user.role == 'superadmin' and current_user.role != 'superadmin':
        flash('Vous n\'avez pas les permissions nécessaires pour supprimer un super administrateur.', 'danger')
        return redirect(url_for('user.index'))
    
    # Empêcher la suppression des comptes admin par les non-superadmin
    if user.role == 'admin' and current_user.role != 'superadmin':
        flash('Vous n\'avez pas les permissions nécessaires pour supprimer un administrateur.', 'danger')
        return redirect(url_for('user.index'))
    
    try:
        db.session.delete(user)
        db.session.commit()
        flash('Utilisateur supprimé avec succès!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erreur lors de la suppression de l\'utilisateur: {str(e)}', 'danger')
    
    return redirect(url_for('user.index'))

@user_bp.route('/users/check-username/<username>')
@login_required
def check_username(username):
    # Exclude current user when editing
    current_username = request.args.get('current')
    
    if current_username and username == current_username:
        return jsonify({'available': True})
    
    user = User.query.filter_by(username=username).first()
    return jsonify({'available': user is None})