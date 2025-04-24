import os
from datetime import timedelta

class Config:
    # Basic configuration
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'
    TESTING = False
    SECRET_KEY = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')
    
    # Database configuration
    # Utilise PostgreSQL en production (Render) et SQLite en développement
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), "instance", "app.db"))}')
    # Si l'URL commence par 'postgres://', le remplacer par 'postgresql://' pour SQLAlchemy 2.0+
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File upload settings
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
    ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'txt'}
    
    # Application settings
    APP_NAME = "Cavalier Déménagement"
    COMPANY_FULL_NAME = "Cavalier Déménagement"
    COMPANY_ADDRESS = "123 Rue du Transport, 75000 Paris"
    COMPANY_PHONE = "+33 1 23 45 67 89"
    COMPANY_EMAIL = "contact@cavalier-demenagement.fr"
    COMPANY_WEBSITE = "www.cavalier-demenagement.fr"
    COMPANY_SIRET = "123 456 789 00012"
    
    # Invoice settings
    INVOICE_PREFIX = "FAC"
    VAT_RATE = 20.0  # Default VAT rate (%)
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
