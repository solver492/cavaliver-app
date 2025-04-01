import requests
import json
import time
import sys
import os

# Votre clé API Render
API_KEY = "rnd_OKmqRNnpnZaJE7drwfVQzGk8c5AT"

# L'ID de votre service sur Render (à remplacer par votre ID réel)
# Vous pouvez le trouver dans l'URL de votre service: https://dashboard.render.com/web/srv-xxxx
SERVICE_ID = "srv-cltlh30gjchc73brpglg"  # Remplacez par votre ID de service

# Configuration des en-têtes pour l'API
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

def get_service_info():
    """Récupère les informations sur le service"""
    url = f"https://api.render.com/v1/services/{SERVICE_ID}"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erreur lors de la récupération des informations du service: {response.status_code}")
        print(response.text)
        return None

def trigger_deploy():
    """Déclenche un déploiement manuel"""
    url = f"https://api.render.com/v1/services/{SERVICE_ID}/deploys"
    payload = {
        "clearCache": "clear"  # Nettoyer le cache pour un déploiement propre
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 201:
        deploy_data = response.json()
        print(f"Déploiement déclenché avec succès! ID: {deploy_data['id']}")
        return deploy_data['id']
    else:
        print(f"Erreur lors du déclenchement du déploiement: {response.status_code}")
        print(response.text)
        return None

def check_deploy_status(deploy_id):
    """Vérifie le statut d'un déploiement"""
    url = f"https://api.render.com/v1/services/{SERVICE_ID}/deploys/{deploy_id}"
    
    while True:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            deploy_data = response.json()
            status = deploy_data['status']
            
            if status == "live":
                print("Déploiement terminé avec succès!")
                return True
            elif status in ["build_failed", "deploy_failed", "canceled"]:
                print(f"Le déploiement a échoué avec le statut: {status}")
                return False
            else:
                print(f"Statut du déploiement: {status}. Attente...")
                time.sleep(10)  # Attendre 10 secondes avant de vérifier à nouveau
        else:
            print(f"Erreur lors de la vérification du statut: {response.status_code}")
            print(response.text)
            return False

def execute_command():
    """Exécute une commande sur le service via l'API Render"""
    url = f"https://api.render.com/v1/services/{SERVICE_ID}/exec"
    
    # Commande pour exécuter notre script de correction de base de données
    payload = {
        "command": "cd /opt/render/project/src/ && python fix_render_db.py"
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        exec_data = response.json()
        print("Commande exécutée avec succès!")
        print("Résultat de la commande:")
        print(exec_data.get('output', 'Aucune sortie disponible'))
        return True
    else:
        print(f"Erreur lors de l'exécution de la commande: {response.status_code}")
        print(response.text)
        return False

def main():
    """Fonction principale"""
    print("=== Utilitaire d'automatisation Render ===")
    
    # Vérifier les informations du service
    service_info = get_service_info()
    if not service_info:
        print("Impossible de récupérer les informations du service. Vérifiez votre clé API et l'ID du service.")
        sys.exit(1)
    
    print(f"Service trouvé: {service_info['name']}")
    
    # Exécuter notre script de correction de base de données
    print("\n=== Exécution du script de correction de base de données ===")
    if not execute_command():
        print("Échec de l'exécution du script. Tentative de déploiement manuel...")
    else:
        print("Script exécuté avec succès!")
    
    # Déclencher un déploiement manuel
    print("\n=== Déclenchement d'un déploiement manuel ===")
    deploy_id = trigger_deploy()
    if not deploy_id:
        print("Impossible de déclencher un déploiement. Vérifiez votre clé API et l'ID du service.")
        sys.exit(1)
    
    # Vérifier le statut du déploiement
    print("\n=== Vérification du statut du déploiement ===")
    if check_deploy_status(deploy_id):
        print("\nVotre application a été déployée avec succès et la base de données a été corrigée!")
        print("Vous pouvez maintenant accéder à votre application sur Render.")
    else:
        print("\nLe déploiement a échoué. Veuillez vérifier les logs sur le tableau de bord Render.")

if __name__ == "__main__":
    main()
