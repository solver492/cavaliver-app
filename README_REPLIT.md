# Déploiement sur Replit - R-Cavalier App

Ce guide explique comment démarrer, travailler sur et déployer l'application R-Cavalier sur Replit.

## Prérequis

- Un compte [Replit](https://replit.com/)
- Le code source de l'application R-Cavalier (ce dépôt)

## Configuration initiale

1. **Importez le dépôt sur Replit**
   - Créez un nouveau Repl
   - Choisissez "Import from GitHub"
   - Collez l'URL du dépôt GitHub : `https://github.com/solver492/cavapp.git`
   - Sélectionnez "Python" comme langage

2. **Configuration automatique**
   - Replit détectera automatiquement les fichiers `.replit` et `replit.nix` présents dans le dépôt
   - Ces fichiers contiennent la configuration nécessaire pour exécuter l'application

## Démarrer l'application

1. **Exécutez le script de configuration**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   Ce script va :
   - Installer toutes les dépendances
   - Initialiser la base de données
   - Exécuter les scripts de migration

2. **Lancez l'application**
   - Cliquez sur le bouton "Run" dans l'interface Replit
   - L'application sera accessible via l'URL fournie par Replit (généralement sous la forme `https://votre-repl.username.repl.co`)

## Travailler sur l'application

### Structure des fichiers

L'application suit une architecture MVC (Modèle-Vue-Contrôleur) :
- `models.py` : Définition des modèles de données
- `routes/` : Organisation des routes par fonctionnalité
- `templates/` : Templates HTML
- `static/` : Ressources statiques (CSS, JS, images)

### Développement

1. **Modifier le code**
   - Utilisez l'éditeur Replit pour modifier les fichiers
   - Les modifications sont automatiquement sauvegardées

2. **Redémarrer l'application**
   - L'application redémarre automatiquement grâce à l'option `--reload` de Gunicorn
   - Si vous modifiez la structure des modèles, vous devrez exécuter les scripts de migration appropriés

## Déploiement

### Déploiement sur Replit

1. **Rendre l'application publique**
   - Dans le panneau de configuration de votre Repl, allez dans l'onglet "Hosting"
   - Activez l'option "Always On" pour que votre application reste active en permanence
   - Votre application sera accessible via l'URL Replit

2. **Configurer un domaine personnalisé** (optionnel)
   - Dans l'onglet "Hosting", vous pouvez configurer un domaine personnalisé
   - Suivez les instructions pour configurer les enregistrements DNS

### Déploiement sur Render

Si vous préférez déployer sur Render, l'application est déjà configurée pour cela :

1. **Créez un compte sur [Render](https://render.com/)**
2. **Connectez votre dépôt GitHub**
3. **Créez un nouveau service Web**
   - Render détectera automatiquement le fichier `render.yaml`
   - Ce fichier contient toute la configuration nécessaire pour le déploiement

## Variables d'environnement

Pour configurer les variables d'environnement sur Replit :

1. Allez dans l'onglet "Secrets" dans le panneau de gauche
2. Ajoutez les variables suivantes :
   - `FLASK_ENV` : `production`
   - `SESSION_SECRET` : [générer une clé secrète aléatoire]
   - `ADMIN_PASSWORD` : [mot de passe pour le compte administrateur]

## Base de données

Par défaut, l'application utilise SQLite en développement. Pour une utilisation en production sur Replit :

1. **Créez une base de données PostgreSQL**
   - Vous pouvez utiliser un service comme [ElephantSQL](https://www.elephantsql.com/) qui offre un plan gratuit
   - Ou utiliser le service PostgreSQL intégré à Replit

2. **Configurez la variable d'environnement `DATABASE_URL`**
   - Ajoutez l'URL de connexion à votre base de données dans les secrets Replit

## Ressources supplémentaires

- [Documentation Replit](https://docs.replit.com/)
- [Documentation Flask](https://flask.palletsprojects.com/)
- [Documentation R-Cavalier](./DOCUMENTATION.md)
- [Architecture R-Cavalier](./ARCHITECTURE.md)

## Support

Pour toute question ou assistance, contactez :
- Email : contact@r-cavalier.com
- Site web : [www.r-cavalier.com](https://www.r-cavalier.com)
