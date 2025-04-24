"""
Point d'entrée pour l'application R-Cavalier sur Replit
Ce fichier est spécifiquement conçu pour faciliter le démarrage de l'application sur Replit
"""

import os
import sys
import subprocess
from flask import Flask

def setup_environment():
    """Configure l'environnement avant de démarrer l'application"""
    print("Configuration de l'environnement R-Cavalier sur Replit...")
    
    # Vérifier si le script setup.sh a été exécuté
    if not os.path.exists(".setup_done"):
        print("Exécution du script de configuration initiale...")
        try:
            # Rendre le script exécutable
            os.chmod("setup.sh", 0o755)
            # Exécuter le script de configuration
            subprocess.run(["./setup.sh"], check=True)
            # Créer un fichier marqueur pour indiquer que la configuration a été effectuée
            with open(".setup_done", "w") as f:
                f.write("Configuration terminée")
        except Exception as e:
            print(f"Erreur lors de la configuration : {e}")
            print("Vous pouvez exécuter manuellement le script avec : ./setup.sh")
    else:
        print("L'environnement est déjà configuré.")

def start_application():
    """Démarre l'application Flask"""
    print("Démarrage de l'application R-Cavalier...")
    
    try:
        # Importer l'application depuis main.py
        from main import app
        
        # Définir le port à partir de la variable d'environnement de Replit ou utiliser 5000 par défaut
        port = int(os.environ.get("PORT", 5000))
        
        print(f"L'application est en cours d'exécution sur le port {port}")
        print("Accédez à l'application via l'URL fournie par Replit")
        
        # Retourner l'application pour que Replit puisse la démarrer
        return app
    except Exception as e:
        print(f"Erreur lors du démarrage de l'application : {e}")
        sys.exit(1)

# Point d'entrée principal
if __name__ == "__main__":
    setup_environment()
    app = start_application()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
else:
    # Pour l'intégration avec Gunicorn ou d'autres serveurs WSGI
    setup_environment()
    app = start_application()
