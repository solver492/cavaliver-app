import os
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from werkzeug.middleware.proxy_fix import ProxyFix

# Initialisation des extensions
db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()

def create_app(config_name=None):
    """Fonction factory pour créer l'application Flask"""
    app = Flask(__name__)
    
    # Déterminer la configuration à utiliser
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    # Charger la configuration
    if config_name == 'production':
        app.config.from_object('app.config.ProductionConfig')
    elif config_name == 'testing':
        app.config.from_object('app.config.TestingConfig')
    else:
        app.config.from_object('app.config.DevelopmentConfig')
    
    # Charger les variables d'environnement supplémentaires
    app.config.from_envvar('APP_CONFIG_FILE', silent=True)
    
    # Configurer le proxy pour Render
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    
    # S'assurer que le dossier d'upload existe
    upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    # Initialiser les extensions
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    
    # Configurer le login manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Veuillez vous connecter pour accéder à cette page.'
    login_manager.login_message_category = 'info'
    
    # Importer et enregistrer les blueprints
    with app.app_context():
        # Importer les modèles pour que Flask-SQLAlchemy les connaisse
        from app.models import user, client, prestation, facture
        
        # Importer et enregistrer les blueprints
        from app.routes.auth import auth_bp
        from app.routes.dashboard import dashboard_bp
        from app.routes.client import client_bp
        from app.routes.prestation import prestation_bp
        from app.routes.facture import facture_bp
        
        app.register_blueprint(auth_bp)
        app.register_blueprint(dashboard_bp)
        app.register_blueprint(client_bp)
        app.register_blueprint(prestation_bp)
        app.register_blueprint(facture_bp)
        
        # Configurer le gestionnaire d'erreurs
        from app.utils.error_handler import setup_error_handlers
        setup_error_handlers(app)
        
        # Créer les tables si elles n'existent pas
        db.create_all()
    
    # Définir le gestionnaire pour la page 404
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404
    
    # Définir le gestionnaire pour la page 500
    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('errors/500.html'), 500
    
    # Définir le contexte global pour les templates
    @app.context_processor
    def inject_global_vars():
        return {
            'app_name': 'Déménage',
            'app_version': '1.0.0'
        }
    
    return app