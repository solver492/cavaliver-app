# Guide de développement - Application de déménagement

Ce document est un guide technique pour comprendre l'architecture, le fonctionnement et les bonnes pratiques à suivre lors du développement de l'application de déménagement.

## 1. Architecture générale

L'application est construite avec :
- **Flask** : Framework web Python léger
- **SQLAlchemy** : ORM pour la gestion de la base de données
- **SQLite** : Base de données par défaut (peut être changée pour PostgreSQL lors du déploiement)
- **HTML/CSS/JavaScript** : Interface utilisateur (avec Bootstrap pour le style)

La structure des fichiers est la suivante :
```
demenage-main/
├── app.py              # Application principale Flask
├── models.py           # Modèles de données
├── static/             # Fichiers statiques (CSS, JS, images)
├── templates/          # Templates HTML
├── demenage.db         # Base de données SQLite
├── migration_db.py     # Script de migration de la base de données
└── README.md           # Documentation
```

## 2. Modèles de données

### Principaux modèles

1. **User** : Utilisateurs du système avec différents rôles
   - Rôles : super_admin, admin, commercial, transporteur, client
   - Un utilisateur peut être associé à plusieurs prestations

2. **Prestation** : Service de déménagement
   - Associée à un client
   - Peut avoir un ou plusieurs transporteurs
   - Possède différents statuts : en_attente, en_cours, terminee, annulee

3. **PrestationTransporter** : Relation entre Prestation et Transporteurs
   - Suivi de l'état de la mission pour chaque transporteur
   - Stocke les dates d'acceptation, refus et finalisation

4. **Notification** : Système de notification pour les utilisateurs
   - Permet d'informer les utilisateurs des actions prises

### Hiérarchie des rôles

- **Super Admin** : Contrôle total, peut créer tous types d'utilisateurs
- **Admin** : Peut créer des commerciaux et transporteurs
- **Commercial** : Peut créer des clients et des prestations
- **Transporteur** : Peut accepter, refuser et compléter des prestations
- **Client** : Reçoit des prestations

## 3. Workflow des prestations

1. **Création** : Un commercial crée une prestation pour un client
2. **Assignation** : Le commercial assigne un ou plusieurs transporteurs
3. **Acceptation/Refus** : Le transporteur accepte ou refuse la prestation
4. **Exécution** : Si acceptée, le transporteur effectue la prestation
5. **Finalisation** : Le transporteur marque la prestation comme terminée
6. **Facturation** : Le commercial peut créer une facture pour la prestation terminée

## 4. Points sensibles et erreurs courantes

### Modifications de la base de données

**IMPORTANT** : À chaque modification de modèle dans `models.py`, vous devez mettre à jour le schéma de la base de données.

#### Erreur fréquente
```
sqlalchemy.exc.OperationalError: table X has no column named Y
```

Cela se produit lorsque :
- Vous ajoutez un nouveau champ à un modèle dans le code Python
- Mais la base de données SQLite ne reflète pas ces changements

### Solution
1. Utilisez le script `migration_db.py` pour ajouter les colonnes manquantes
2. Exécutez : `python migration_db.py`

## 5. Procédures à suivre pour éviter les erreurs

### Lors de la modification des modèles

1. **Documentez les changements** : Notez tous les changements apportés aux modèles
2. **Créez une migration** : Ajoutez le code nécessaire dans `migration_db.py` pour mettre à jour la base de données
3. **Testez localement** : Vérifiez que la migration fonctionne sur votre environnement local
4. **Appliquez au déploiement** : Assurez-vous que la migration est exécutée sur l'environnement de production

### Exemple d'ajout d'un champ au modèle Prestation

```python
# Dans models.py
class Prestation(db.Model):
    # Champs existants...
    nouveau_champ = db.Column(db.String(50), nullable=True)

# Dans migration_db.py (ajoutez à la fonction run_migration)
if 'nouveau_champ' not in columns:
    cursor.execute('ALTER TABLE prestation ADD COLUMN nouveau_champ VARCHAR(50)')
    print("- Colonne 'nouveau_champ' ajoutée")
```

## 6. Déploiement

### Sur Render.com

1. Ajoutez les commandes de migration dans `build.sh` :
```bash
#!/bin/bash
python migration_db.py
gunicorn --bind=0.0.0.0:$PORT wsgi:app
```

2. Pour le débogage, vérifiez les logs de Render

### Sur PythonAnywhere

1. Créez un script de migration à exécuter manuellement
2. Configurez le fichier WSGI pour pointer vers votre application Flask
3. Utilisez la console pour exécuter les migrations

## 7. Bonnes pratiques de développement

1. **Versionner le code** : Utilisez Git pour suivre les changements
2. **Tester régulièrement** : Testez chaque fonctionnalité avant de la déployer
3. **Documenter les APIs** : Documentez les routes et leur fonctionnement
4. **Gérer les erreurs** : Implémentez une gestion d'erreurs robuste
5. **Respecter la hiérarchie des rôles** : Assurez-vous que les restrictions d'accès sont respectées

## 8. Liste des erreurs connues et leurs solutions

### Erreur : "table X has no column named Y"
**Solution** : Exécutez `python migration_db.py`

### Erreur : "no such table: user"
**Solution** : La base de données n'est pas initialisée. Exécutez :
```python
from app import db
db.create_all()
```

### Erreur : "Circular import"
**Solution** : Restructurez votre code pour éviter les imports circulaires entre `app.py` et `models.py`

### Erreur : "User not authenticated"
**Solution** : Vérifiez que l'utilisateur est bien connecté et que la session est active

## 9. Ressources utiles

- [Documentation Flask](https://flask.palletsprojects.com/)
- [Documentation SQLAlchemy](https://docs.sqlalchemy.org/)
- [Tutoriel sur les migrations Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/)
- [Guide de déploiement sur Render](https://render.com/docs/deploy-flask)
- [Guide de déploiement sur PythonAnywhere](https://help.pythonanywhere.com/pages/Flask/)

---

*Document créé le 30 mars 2025*
