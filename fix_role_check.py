from flask import Flask
from extensions import db
from sqlalchemy import text

app = Flask(__name__)
app.config.from_object('config.Config')
db.init_app(app)

def fix_role_check():
    """Corrige la vérification du rôle de l'utilisateur dans toutes les routes."""
    with app.app_context():
        # Lire le contenu du fichier
        file_path = 'routes/calendrier.py'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remplacer toutes les occurrences de current_user.role.in_(['admin', 'superadmin'])
        # par current_user.role in ['admin', 'superadmin']
        new_content = content.replace("current_user.role.in_(['admin', 'superadmin'])", 
                                     "current_user.role in ['admin', 'superadmin']")
        
        # Écrire le contenu modifié dans le fichier
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("Correction de la vérification du rôle terminée avec succès!")
        return True

if __name__ == '__main__':
    fix_role_check()
    print("Script terminé avec succès!")
