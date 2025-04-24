# Import the blueprints to make them available through the routes package
from .auth import auth_bp
from .client import client_bp
from .dashboard import dashboard_bp
from .document import documents_bp
from .prestation import prestation_bp
from .stockage import stockage_bp
from .user import user_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(prestation_bp)
    app.register_blueprint(stockage_bp)
    app.register_blueprint(user_bp)
