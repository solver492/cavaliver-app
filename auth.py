from functools import wraps
from flask import flash, redirect, url_for, request
from flask_login import current_user, login_required

# Access control decorator
def role_required(*roles):
    def wrapper(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login'))

            # Vérifier l'accès aux modules en développement
            if current_user.role in ['admin', 'commercial']:
                module = request.blueprint
                if module in ['stockage', 'facture']:
                    flash('Module en développement. Accès temporairement restreint.', 'warning')
                    return redirect(url_for('dashboard.index'))

            if not any(current_user.role == role for role in roles):
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return wrapper