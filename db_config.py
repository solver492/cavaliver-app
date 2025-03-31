import os

def get_db_uri():
    """
    Retourne l'URI de la base de données en fonction de l'environnement.
    Pour Render, utilise le volume persistant monté sur /data
    Pour le développement local, utilise le chemin par défaut.
    """
    if os.environ.get('RENDER'):
        # Sur Render, utiliser le volume persistant
        return 'sqlite:////data/demenage.db'
    else:
        # En local, utiliser le chemin par défaut
        return 'sqlite:///demenage.db'
