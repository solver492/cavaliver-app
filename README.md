# Documentation de Migration - Application de Gestion de Déménagement

## Table des matières
1. [Prérequis](#prérequis)
2. [Structure du Projet](#structure-du-projet)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Migration de la Base de Données](#migration-de-la-base-de-données)
6. [Déploiement](#déploiement)
7. [Maintenance](#maintenance)
8. [Correction de la Base de Données sur Render](#correction-de-la-base-de-données-sur-render)

## Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)
- SQLite 3
- Serveur Web (Apache ou Nginx)
- Git

## Structure du Projet

```
demenage/
├── app.py              # Application principale Flask
├── models.py           # Modèles de base de données
├── forms.py            # Formulaires WTForms
├── utils.py           # Utilitaires (génération PDF, etc.)
├── requirements.txt    # Dépendances Python
├── static/            # Fichiers statiques
│   ├── css/
│   ├── js/
│   └── img/
└── templates/         # Templates Jinja2
    ├── base.html
    ├── dashboard.html
    ├── clients/
    ├── prestations/
    └── users/
```

## Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
cd demenage
```

2. Créer un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Installer les dépendances :
```bash
pip install -r requirements.txt
```

4. Initialiser la base de données :
```bash
python init_db.py
```

## Configuration

1. Configuration de la base de données :
```python
# app.py
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///demenagement.db'  # SQLite
# ou
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://user:password@localhost/demenagement'  # MySQL
```

2. Configuration de la clé secrète :
```python
# app.py
app.secret_key = 'votre_nouvelle_cle_secrete'  # À changer en production
```

3. Variables d'environnement (créer un fichier .env) :
```
FLASK_APP=app.py
FLASK_ENV=production
DATABASE_URL=mysql://user:password@localhost/demenagement
SECRET_KEY=votre_nouvelle_cle_secrete
```

## Lancement de l'application

1. Activer l'environnement virtuel (si ce n'est pas déjà fait)
2. Lancer l'application :
```bash
python app.py
```
3. Ouvrir un navigateur et aller à l'adresse : http://localhost:8000

## Identifiants par défaut

- Nom d'utilisateur : admin
- Mot de passe : admin

## Migration de la Base de Données

1. Initialiser les migrations :
```bash
flask db init
```

2. Créer la première migration :
```bash
flask db migrate -m "Initial migration"
```

3. Appliquer les migrations :
```bash
flask db upgrade
```

4. Pour les futures migrations :
```bash
# Après modification des modèles
flask db migrate -m "Description des changements"
flask db upgrade
```

## Déploiement

### Option 1 : Apache avec mod_wsgi

1. Installer mod_wsgi :
```bash
apt-get install apache2 libapache2-mod-wsgi-py3  # Debian/Ubuntu
```

2. Configuration Apache (créer /etc/apache2/sites-available/demenagement.conf) :
```apache
<VirtualHost *:80>
    ServerName votre-domaine.com
    
    WSGIDaemonProcess demenagement python-path=/chemin/vers/venv/lib/python3.8/site-packages
    WSGIProcessGroup demenagement
    WSGIScriptAlias / /chemin/vers/app.wsgi
    
    <Directory /chemin/vers/demenagement>
        Require all granted
    </Directory>
</VirtualHost>
```

3. Créer le fichier WSGI (app.wsgi) :
```python
import sys
sys.path.insert(0, '/chemin/vers/demenagement')

from app import app as application
```

### Option 2 : Nginx avec Gunicorn

1. Installer Gunicorn :
```bash
pip install gunicorn
```

2. Configuration Nginx (créer /etc/nginx/sites-available/demenagement) :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. Lancer Gunicorn :
```bash
gunicorn -w 4 -b 127.0.0.1:8000 app:app
```

## Maintenance

### Sauvegardes

1. Base de données SQLite :
```bash
# Sauvegarde
sqlite3 demenagement.db .dump > backup.sql

# Restauration
sqlite3 demenagement.db < backup.sql
```

2. Base de données MySQL :
```bash
# Sauvegarde
mysqldump -u user -p demenagement > backup.sql

# Restauration
mysql -u user -p demenagement < backup.sql
```

### Logs

1. Configuration des logs dans app.py :
```python
import logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)
```

2. Rotation des logs (logrotate) :
```
/chemin/vers/demenagement/app.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

### Mise à jour

1. Sauvegarder les données :
```bash
# Backup base de données
sqlite3 demenagement.db .dump > backup.sql

# Backup fichiers de configuration
cp .env .env.backup
```

2. Mettre à jour le code :
```bash
git pull origin main
```

3. Mettre à jour les dépendances :
```bash
pip install -r requirements.txt --upgrade
```

4. Appliquer les migrations :
```bash
flask db upgrade
```

5. Redémarrer le serveur :
```bash
# Apache
sudo service apache2 restart

# ou Gunicorn
sudo systemctl restart gunicorn
```

### Surveillance

1. Mettre en place une surveillance des processus avec Supervisor :
```ini
[program:demenagement]
command=/chemin/vers/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 app:app
directory=/chemin/vers/demenagement
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/demenagement/err.log
stdout_logfile=/var/log/demenagement/out.log
```

2. Surveiller les performances :
```bash
# Installation de New Relic
pip install newrelic

# Configuration
newrelic-admin generate-config YOUR_LICENSE_KEY newrelic.ini
```

## Correction de la Base de Données sur Render

L'application peut rencontrer des problèmes sur Render en raison de colonnes ou tables manquantes dans la base de données. Deux scripts ont été créés pour résoudre ces problèmes :

### Option 1 : Correction manuelle via le Shell Render (nécessite un abonnement)

Si vous avez accès au shell Render (fonctionnalité payante), vous pouvez exécuter directement :

```bash
cd /opt/render/project/src/
python fix_render_db.py
```

Ce script va :
- Vérifier les tables existantes
- Ajouter les colonnes manquantes (societe, montant, tags dans la table prestation et tags dans la table client)
- Créer la table facture si elle n'existe pas
- Initialiser un utilisateur admin si nécessaire

### Option 2 : Utilisation de l'API Render (gratuit)

Si vous n'avez pas d'abonnement Render avec accès au shell, vous pouvez utiliser l'API Render pour exécuter le script de correction :

1. Assurez-vous d'avoir une clé API Render (créée dans les paramètres de votre compte)
2. Exécutez le script d'automatisation localement :

```bash
# Installez d'abord les dépendances
pip install requests

# Exécutez le script (assurez-vous de mettre à jour l'ID de service dans le script)
python render_api_deploy.py
```

Le script `render_api_deploy.py` va :
- Se connecter à l'API Render avec votre clé
- Exécuter le script de correction de base de données sur votre service
- Déclencher un redéploiement de l'application
- Suivre le statut du déploiement

### Colonnes et tables manquantes connues

Les problèmes suivants ont été identifiés et sont gérés par les scripts de correction :

1. Colonnes manquantes dans la table prestation :
   - societe
   - montant
   - tags
   - trajet_depart
   - trajet_destination
   - requires_packaging
   - demenagement_type
   - camion_type
   - priorite

2. Colonnes manquantes dans la table client :
   - tags
   - client_type

3. Tables manquantes :
   - facture
   - ligne_facture

Le code de l'application a été adapté pour gérer ces absences, mais les scripts de correction permettent de rétablir la structure complète de la base de données.

Pour toute question ou assistance supplémentaire, veuillez contacter l'équipe de support.
