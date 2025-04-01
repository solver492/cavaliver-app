# Guide de déploiement sur Render

Ce guide explique comment déployer l'application Déménage sur la plateforme Render.

## Prérequis

- Un compte Render (https://render.com)
- Un dépôt GitHub contenant le code de l'application

## Étapes de déploiement

### 1. Préparation du dépôt

Assurez-vous que votre dépôt GitHub contient les fichiers suivants:

- `requirements.txt` - Liste des dépendances Python
- `build.sh` - Script exécuté lors du build
- `startup.sh` - Script exécuté au démarrage de l'application
- `migration_db.py` - Script de migration de la base de données
- `fix_render_db.py` - Script de correction de la base de données
- `init_db.py` - Script d'initialisation de la base de données

### 2. Configuration du service Web sur Render

1. Connectez-vous à votre compte Render
2. Cliquez sur "New" puis "Web Service"
3. Connectez votre dépôt GitHub
4. Configurez le service:
   - **Name**: `demenage-app` (ou le nom de votre choix)
   - **Environment**: `Python 3`
   - **Region**: Choisissez la région la plus proche de vos utilisateurs
   - **Branch**: `main` (ou votre branche de production)
   - **Build Command**: `./build.sh`
   - **Start Command**: `./startup.sh`

### 3. Configuration des variables d'environnement

Dans l'onglet "Environment" de votre service, ajoutez les variables suivantes:

- `FLASK_ENV`: `production`
- `SECRET_KEY`: Générez une clé secrète forte (ex: `openssl rand -hex 32`)
- `DATABASE_URL`: Laissez Render configurer cette variable automatiquement
- `ADMIN_PASSWORD`: Mot de passe pour l'utilisateur admin initial
- `PORT`: `10000` (port par défaut sur Render)

### 4. Configuration de la base de données PostgreSQL

1. Cliquez sur "New" puis "PostgreSQL"
2. Configurez la base de données:
   - **Name**: `demenage-db` (ou le nom de votre choix)
   - **Region**: Même région que votre service Web
   - **PostgreSQL Version**: `14` (ou version plus récente)
   - **Instance Type**: Choisissez selon vos besoins (commencez par le plan gratuit)

3. Une fois la base de données créée, Render configurera automatiquement la variable `DATABASE_URL` dans votre service Web.

### 5. Déploiement initial

1. Après avoir configuré le service Web et la base de données, cliquez sur "Create Web Service"
2. Render va déployer votre application. Ce processus peut prendre quelques minutes.
3. Une fois le déploiement terminé, vous pouvez accéder à votre application via l'URL fournie par Render.

### 6. Vérification du déploiement

1. Accédez à l'URL de votre application
2. Connectez-vous avec les identifiants admin:
   - Nom d'utilisateur: `admin`
   - Mot de passe: Celui défini dans la variable d'environnement `ADMIN_PASSWORD`

### 7. Mise à jour de l'application

Pour mettre à jour votre application:

1. Poussez vos modifications sur GitHub
2. Render détectera automatiquement les changements et redéploiera votre application
3. Vous pouvez également déclencher un déploiement manuel depuis le tableau de bord Render

## Résolution des problèmes courants

### Erreurs de base de données

Si vous rencontrez des erreurs liées à la base de données:

1. Vérifiez les logs de l'application sur Render
2. Exécutez manuellement le script de correction:
   - Allez dans l'onglet "Shell" de votre service Web
   - Exécutez `python fix_render_db.py`

### Problèmes de démarrage

Si l'application ne démarre pas:

1. Vérifiez les logs de démarrage
2. Assurez-vous que les scripts `build.sh` et `startup.sh` sont exécutables:
   ```bash
   git update-index --chmod=+x build.sh startup.sh
   git commit -m "Make scripts executable"
   git push
   ```

### Problèmes de connexion

Si vous ne pouvez pas vous connecter:

1. Réinitialisez le mot de passe admin:
   - Allez dans l'onglet "Shell" de votre service Web
   - Exécutez:
     ```python
     from app import create_app, db
     from app.models.user import User
     from werkzeug.security import generate_password_hash
     
     app = create_app()
     with app.app_context():
         admin = User.query.filter_by(username='admin').first()
         if admin:
             admin.password_hash = generate_password_hash('nouveau_mot_de_passe')
             db.session.commit()
             print("Mot de passe admin réinitialisé avec succès")
     ```

## Maintenance

### Sauvegardes

Render sauvegarde automatiquement votre base de données PostgreSQL. Vous pouvez également:

1. Exporter manuellement vos données:
   - Allez dans l'onglet "Shell" de votre base de données
   - Exécutez `pg_dump -Fc $DATABASE_URL > backup.dump`
   - Téléchargez le fichier de sauvegarde

### Surveillance

Utilisez l'onglet "Metrics" de Render pour surveiller:
- L'utilisation du CPU
- L'utilisation de la mémoire
- Le nombre de requêtes
- Le temps de réponse

## Conclusion

Votre application Déménage est maintenant déployée sur Render et prête à être utilisée. N'oubliez pas de surveiller régulièrement les performances et de mettre à jour l'application selon les besoins.