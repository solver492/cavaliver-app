import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    
    # Configuration de base
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cavapp.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configuration du dossier uploads
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    # Initialisation des extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    # Enregistrement des blueprints
    from .routes import auth_bp, calendrier_bp, client_bp, prestation_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(calendrier_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(prestation_bp)
    
    return app
