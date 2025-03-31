import os

def get_db_uri():
    """
    Retourne l'URI de la base de données en fonction de l'environnement.
    Pour Render, utilise un chemin qui sera toujours accessible en écriture
    Pour le développement local, utilise le chemin par défaut.
    """
    if os.environ.get('RENDER'):
        # Sur Render, utiliser un chemin accessible en écriture
        # Le répertoire /opt/render/project/src/ est accessible en écriture sur Render
        db_path = '/opt/render/project/src/instance/demenage.db'
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        return f'sqlite:///{db_path}'
    else:
        # En local, utiliser le chemin par défaut
        return 'sqlite:///demenage.db'
