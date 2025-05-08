from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from urllib.parse import urlparse
from datetime import datetime

from extensions import db
from models import User
from forms import LoginForm

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/', methods=['GET', 'POST'])
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user is None or not user.check_password(form.password.data):
            flash('Nom d\'utilisateur ou mot de passe incorrect', 'danger')
            return redirect(url_for('auth.login'))
        
        # Check if user is active
        if user.statut != 'actif':
            flash('Votre compte est désactivé. Veuillez contacter un administrateur.', 'warning')
            return redirect(url_for('auth.login'))

        # Check session expiry for non-superadmin users
        if user.role != 'superadmin':
            if user.session_expiry and user.session_expiry < datetime.utcnow():
                flash('Votre compte a expiré. Veuillez contacter un super administrateur.', 'danger')
                return redirect(url_for('auth.login'))
            # Set session expiry to 3 hours from now
            user.session_expiry = datetime.utcnow() + timedelta(hours=3)
            db.session.commit()
        
        # Update last login time
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        login_user(user, remember=True)
        
        # Redirect to the page the user was trying to access
        next_page = request.args.get('next')
        if not next_page or urlparse(next_page).netloc != '':
            next_page = url_for('dashboard.index')
        
        return redirect(next_page)
    
    return render_template('login.html', title='Connexion', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Vous avez été déconnecté avec succès', 'success')
    return redirect(url_for('auth.login'))
