import traceback
import logging
from functools import wraps
from flask import jsonify, render_template, current_app, request
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app_errors.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseError(Exception):
    """Exception personnalisée pour les erreurs de base de données"""
    pass

class ValidationError(Exception):
    """Exception personnalisée pour les erreurs de validation"""
    pass

def handle_error(error, error_type="Erreur", status_code=500):
    """
    Gère les erreurs de manière uniforme
    
    Args:
        error: L'exception levée
        error_type: Type d'erreur pour le log
        status_code: Code HTTP à retourner
    
    Returns:
        Réponse JSON ou HTML selon le type de requête
    """
    error_message = str(error)
    error_traceback = traceback.format_exc()
    
    # Journaliser l'erreur
    logger.error(f"{error_type}: {error_message}")
    logger.debug(error_traceback)
    
    # Déterminer si la requête attend du JSON
    is_json_request = request.is_xhr or request.path.startswith('/api/')
    
    if is_json_request:
        return jsonify({
            'success': False,
            'error': error_type,
            'message': error_message
        }), status_code
    else:
        return render_template(
            'error.html',
            error_type=error_type,
            error_message=error_message,
            debug=current_app.debug
        ), status_code

def setup_error_handlers(app):
    """Configure les gestionnaires d'erreurs pour l'application Flask"""
    
    @app.errorhandler(404)
    def not_found_error(error):
        return handle_error(error, "Page non trouvée", 404)
    
    @app.errorhandler(500)
    def internal_error(error):
        return handle_error(error, "Erreur interne du serveur", 500)
    
    @app.errorhandler(SQLAlchemyError)
    def db_error(error):
        return handle_error(error, "Erreur de base de données", 500)
    
    @app.errorhandler(IntegrityError)
    def integrity_error(error):
        return handle_error(error, "Erreur d'intégrité des données", 400)
    
    @app.errorhandler(ValidationError)
    def validation_error(error):
        return handle_error(error, "Erreur de validation", 400)
    
    @app.errorhandler(Exception)
    def unhandled_exception(error):
        return handle_error(error, "Erreur non gérée", 500)

def db_error_handler(f):
    """
    Décorateur pour gérer les erreurs de base de données
    
    Usage:
        @db_error_handler
        def ma_fonction():
            # Code qui interagit avec la base de données
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except OperationalError as e:
            logger.error(f"Erreur opérationnelle de base de données: {str(e)}")
            raise DatabaseError(f"Problème de connexion à la base de données: {str(e)}")
        except IntegrityError as e:
            logger.error(f"Erreur d'intégrité de base de données: {str(e)}")
            raise DatabaseError(f"Violation de contrainte d'intégrité: {str(e)}")
        except SQLAlchemyError as e:
            logger.error(f"Erreur SQLAlchemy: {str(e)}")
            raise DatabaseError(f"Erreur de base de données: {str(e)}")
    return decorated_function

def validate_input(data, required_fields=None, field_validators=None):
    """
    Valide les données d'entrée
    
    Args:
        data: Dictionnaire de données à valider
        required_fields: Liste des champs obligatoires
        field_validators: Dictionnaire de fonctions de validation par champ
    
    Raises:
        ValidationError: Si la validation échoue
    """
    if required_fields:
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                raise ValidationError(f"Le champ '{field}' est obligatoire")
    
    if field_validators:
        for field, validator in field_validators.items():
            if field in data and data[field] is not None:
                try:
                    validator(data[field])
                except Exception as e:
                    raise ValidationError(f"Validation du champ '{field}' échouée: {str(e)}")
    
    return True