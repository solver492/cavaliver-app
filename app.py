import os
import logging
from flask import Flask, request, jsonify, redirect, url_for
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

def create_app():
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from config import Config
    app.config.from_object(Config)
    
    # Ajouter les options de pool pour PostgreSQL en production
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    
    # Fix for handling proxies
    app.wsgi_app = ProxyFix(app.wsgi_app)
    
    # Import extensions
    from extensions import db, login_manager, csrf, migrate
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    # Configure CSRF protection
    app.config['WTF_CSRF_CHECK_DEFAULT'] = False 
    app.config['WTF_CSRF_SSL_STRICT'] = False
    app.config['WTF_CSRF_ENABLED'] = True
    app.config['WTF_CSRF_METHODS'] = ['POST', 'PUT', 'PATCH', 'DELETE']
    migrate.init_app(app, db)
    
    # Configure login
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Veuillez vous connecter pour accéder à cette page.'
    login_manager.login_message_category = 'warning'
    
    # Add template filters
    @app.template_filter('nl2br')
    def nl2br(text):
        if not text:
            return ""
        return text.replace('\n', '<br>')
        
    @app.template_filter('format_date')
    def format_date(date):
        if not date:
            return ""
        try:
            return date.strftime('%d/%m/%Y')
        except:
            return str(date)
    
    # Register user loader
    from models import User
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Register blueprints
    with app.app_context():
        # Importer les blueprints ici pour éviter les importations circulaires
        from routes.auth import auth_bp
        from routes.dashboard import dashboard_bp
        from routes.client import client_bp
        from routes.prestation import prestation_bp
        from routes.facture import facture_bp
        from routes.stockage import stockage_bp
        from routes.user import user_bp
        from routes.vehicule import vehicule_bp
        from routes.calendrier import calendrier_bp
        from routes.transporteur import transporteur_bp
        from routes.transporteur_api import transporteur_api_bp
        from routes.transporteur_prestations import transporteur_prestations
        from routes.api import api_bp
        from routes.document import documents_bp
        from routes.api_transporteurs import api_transporteurs
        from healthcheck import healthcheck as healthcheck_blueprint
        
        # Blueprint enregistrement avec préfixes cohérents
        app.register_blueprint(auth_bp)
        app.register_blueprint(dashboard_bp, url_prefix='/tableau-de-bord')
        app.register_blueprint(client_bp, url_prefix='/clients')
        app.register_blueprint(prestation_bp, url_prefix='/prestations')
        app.register_blueprint(facture_bp, url_prefix='/factures')
        app.register_blueprint(stockage_bp, url_prefix='/stockage')
        app.register_blueprint(user_bp, url_prefix='/utilisateurs')
        app.register_blueprint(vehicule_bp, url_prefix='/vehicules')
        app.register_blueprint(transporteur_bp, url_prefix='/transporteurs')
        app.register_blueprint(transporteur_prestations, url_prefix='/transporteur')
        app.register_blueprint(calendrier_bp, url_prefix='/calendrier')
        app.register_blueprint(documents_bp, url_prefix='/documents')
        app.register_blueprint(api_bp, url_prefix='/api')
        app.register_blueprint(transporteur_api_bp)  # Déjà préfixé avec /api/transporteurs dans sa définition
        app.register_blueprint(api_transporteurs)
        app.register_blueprint(healthcheck_blueprint)
        
        # Ajouter un gestionnaire d'erreur personnalisé pour les erreurs 404
        @app.errorhandler(404)
        def page_not_found(e):
            # Si c'est une requête AJAX, renvoyer une réponse JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({
                    'success': True,
                    'message': 'Ressource non disponible',
                    'transporteurs': [],
                    'soon_available': [{
                        'id': 1,
                        'nom': 'Cavalier',
                        'prenom': 'Transporteur',
                        'vehicule': 'Fourgon 12m3',
                        'type_vehicule': 'Fourgon',
                        'disponible_le': '07/04/2025'
                    }],
                    'vehicules_recommandes': []
                }), 200
            # Sinon, renvoyer une page par défaut
            return redirect(url_for('dashboard.index')), 302
    
    return app

# Création de l'application
app = create_app()

# Création des tables et configuration initiale si exécuté directement
if __name__ == '__main__':
    print("Application démarrée sur http://127.0.0.1:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
