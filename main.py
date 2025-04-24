from app import create_app
from flask import redirect, url_for, jsonify

app = create_app()

@app.route('/')
def index():
    return redirect(url_for('dashboard.index'))

@app.route('/healthz')
def health_check():
    """Point de terminaison pour la vérification de santé de l'application par Render"""
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
