# R-Cavalier App

Application web de gestion pour entreprise de du00e9mu00e9nagement, permettant la gestion des clients, prestations, transporteurs, facturation et plus encore.

![Dashboard R-Cavalier](static/img/dashboard-preview.png)

## Fonctionnalitu00e9s principales

- **Gestion des clients** : ajout, modification, visualisation et recherche de clients
- **Gestion des prestations** : planification des du00e9mu00e9nagements avec attribution des transporteurs
- **Interface transporteur** : vue du00e9diu00e9e pour confirmer et suivre les prestations assignu00e9es
- **Facturation** : gu00e9nu00e9ration et suivi des factures pour les prestations
- **Tableau de bord** : visualisation des statistiques et activitu00e9s ru00e9centes
- **Calendrier** : planification et vue d'ensemble des prestations sur un calendrier interactif
- **Notifications** : systu00e8me de notifications entre commerciaux et transporteurs

## Pru00e9requis

- Python 3.12+
- Pip (gestionnaire de paquets Python)
- Navigateur web moderne

## Installation

### 1. Cloner le du00e9pu00f4t

```bash
git clone https://github.com/solver492/R-cavalier-app.git
cd R-cavalier-app
```

### 2. Cru00e9er un environnement virtuel

```bash
python -m venv venv
```

### 3. Activer l'environnement virtuel

Sous Windows :
```bash
venv\Scripts\activate
```

Sous macOS/Linux :
```bash
source venv/bin/activate
```

### 4. Installer les du00e9pendances

```bash
pip install -r requirements.txt
```

### 5. Initialiser la base de donnu00e9es

```bash
python update_db.py
```

### 6. Lancer l'application

```bash
python main.py
```

L'application sera accessible u00e0 l'adresse [http://127.0.0.1:5000](http://127.0.0.1:5000)

## Version des du00e9pendances

Les versions spu00e9cifiques des du00e9pendances requises sont :

- SQLAlchemy 2.0.40
- Flask-SQLAlchemy 3.1.1
- Flask-Login 0.6.3
- Flask-WTF 1.2.2

## Structure du projet

Consultez le fichier [DOCUMENTATION.md](DOCUMENTATION.md) pour une description du00e9taillu00e9e de l'architecture et des modules de l'application.

## Utilisateurs par du00e9faut

Apru00e8s l'initialisation de la base de donnu00e9es, un compte administrateur est cru00e9u00e9 par du00e9faut :

- **Nom d'utilisateur** : admin
- **Mot de passe** : password

## Du00e9ploiement sur Render

### 1. Cru00e9er un compte Render

Si vous n'avez pas encore de compte, inscrivez-vous sur [render.com](https://render.com/).

### 2. Cru00e9er un nouveau service Web

1. Dans votre tableau de bord Render, cliquez sur "New" puis "Web Service"
2. Connectez votre du00e9pu00f4t GitHub contenant l'application R-Cavalier
3. Donnez un nom u00e0 votre service (par exemple "r-cavalier-app")

### 3. Configurer le service

Utilisez les paramu00e8tres suivants :

- **Environment** : Python 3
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `gunicorn main:app`

### 4. Ajouter les variables d'environnement

Dans la section "Environment Variables", ajoutez :

- `FLASK_ENV` : production
- `SESSION_SECRET` : [gu00e9nu00e9rer une clu00e9 secru00e8te alu00e9atoire]
- `DATABASE_URL` : [URL de votre base de donnu00e9es PostgreSQL]

### 5. Configurer la base de donnu00e9es PostgreSQL

1. Dans Render, cru00e9ez un nouveau service PostgreSQL
2. Connectez votre service web u00e0 cette base de donnu00e9es
3. Utilisez l'URL de connexion fournie comme valeur pour `DATABASE_URL`

### 6. Du00e9ployer l'application

Cliquez sur "Create Web Service" et attendez que le du00e9ploiement soit terminu00e9.

## Licence

Ce projet est sous licence [MIT](LICENSE).

## Contact

Pour toute question ou suggestion, veuillez contacter :
- Email : contact@r-cavalier.com
- Site web : [www.r-cavalier.com](https://www.r-cavalier.com)
