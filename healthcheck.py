from flask import Blueprint

healthcheck = Blueprint('healthcheck', __name__)

@healthcheck.route('/healthz')
def health_check():
    return {'status': 'healthy'}, 200
