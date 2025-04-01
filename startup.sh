#!/bin/bash

# Afficher les informations de démarrage
echo "Démarrage de l'application..."
echo "Environnement: $FLASK_ENV"

# Créer le répertoire pour la base de données sur Render si nécessaire
if [ ! -z "$RENDER" ]; then
    echo "Environnement Render détecté"
    mkdir -p /opt/render/project/src/instance
    chmod 777 /opt/render/project/src/instance
    echo "Répertoire de base de données créé sur Render avec permissions"
fi

# Afficher les informations sur le répertoire de la base de données
echo "Contenu du répertoire de la base de données:"
if [ ! -z "$RENDER" ]; then
    ls -la /opt/render/project/src/instance
else
    ls -la instance
fi

# Exécuter les migrations de base de données
echo "Exécution des migrations de base de données..."
python migration_db.py

# Exécuter le script de correction directe de la base de données
echo "Correction directe de la structure de la base de données..."
python direct_fix_db.py

# Vérifier que le script a bien fonctionné
if [ $? -ne 0 ]; then
    echo "ERREUR: Le script de correction de la base de données a échoué!"
else
    echo "Correction de la base de données réussie!"
fi

# Initialiser la base de données si nécessaire
echo "Initialisation de la base de données..."
python init_db.py

# Corriger les algorithmes de hachage des mots de passe
echo "Correction des algorithmes de hachage des mots de passe..."
python fix_passwords.py

# Vérifier que le script de correction des mots de passe a bien fonctionné
if [ $? -ne 0 ]; then
    echo "ERREUR: Le script de correction des mots de passe a échoué!"
else
    echo "Correction des mots de passe réussie!"
fi

# Afficher les informations sur la base de données après correction
echo "Informations sur la base de données après correction:"
if [ ! -z "$RENDER" ]; then
    ls -la /opt/render/project/src/instance
    if [ -f "/opt/render/project/src/instance/demenage.db" ]; then
        echo "Base de données trouvée!"
        echo "Taille: $(du -h /opt/render/project/src/instance/demenage.db | cut -f1)"
    else
        echo "ERREUR: Base de données non trouvée!"
    fi
else
    ls -la instance
fi

# Attendre que la base de données soit prête
echo "Attente de la disponibilité de la base de données..."
sleep 2

# Démarrer l'application avec Gunicorn
echo "Démarrage du serveur Gunicorn..."
PORT=${PORT:-10000}
gunicorn 'app:create_app()' --bind 0.0.0.0:$PORT --workers=2 --timeout=60
