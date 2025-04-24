#!/usr/bin/env bash
# Script de construction pour le déploiement Render

# Installer les dépendances
pip install -r requirements.txt

# Initialiser la base de données
python init_db.py

# Exécuter tous les scripts de migration pour garantir la cohérence
echo "Exécution des scripts de migration pour synchroniser les modèles avec la base de données..."
python migration_client.py
python migration_prestation.py
python migration_facture_societe.py
python migration_prestation_tags.py
python migration_vehicule_prestation.py
python migration_global.py

echo "Déploiement terminé avec succès!"
