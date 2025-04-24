from app import create_app, db
from flask import json
from flask_login import login_user, current_user
from models import User
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)

app = create_app()
app.config['TESTING'] = True
client = app.test_client()

# Test de l'API du calendrier
with app.app_context():
    # 1. Rechercher un utilisateur existant dans la base de données
    user = User.query.filter_by(role='admin').first()
    if not user:
        user = User.query.first()  # Prendre n'importe quel utilisateur si aucun admin
        
    if user:
        print(f"Utilisateur trouvé: {user.username}, rôle: {user.role}")
        
        # 2. Se connecter avec cet utilisateur
        with client.session_transaction() as sess:
            # Simuler une connexion
            login_user(user)
            
        # 3. Maintenant faire l'appel API avec la session authentifiée
        response = client.get('/api/prestations/calendrier')
        status = response.status_code
        print(f"Status code: {status}")
        
        if status == 200:
            data = json.loads(response.data)
            print(f"Nombre d'événements: {len(data)}")
            print("Contenu de la réponse:", data)
        else:
            print("Erreur:", response.data)
    else:
        print("Aucun utilisateur trouvé dans la base de données. Impossible de tester l'API.")
