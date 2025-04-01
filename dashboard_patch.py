#!/usr/bin/env python
import os
import sys
import re
import logging
from datetime import datetime

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("dashboard_patch.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DASHBOARD_PATCH")

def log_info(message):
    """Log un message d'information"""
    logger.info(message)
    print(f"[INFO] {message}")

def log_error(message):
    """Log un message d'erreur"""
    logger.error(message)
    print(f"[ERROR] {message}")

def backup_file(file_path):
    """Crée une sauvegarde du fichier"""
    backup_path = f"{file_path}.bak.{datetime.now().strftime('%Y%m%d%H%M%S')}"
    try:
        with open(file_path, 'r', encoding='utf-8') as src:
            with open(backup_path, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
        log_info(f"Sauvegarde créée: {backup_path}")
        return True
    except Exception as e:
        log_error(f"Erreur lors de la création de la sauvegarde: {e}")
        return False

def find_dashboard_route(content):
    """Trouve la route dashboard dans le contenu du fichier"""
    # Recherche de la définition de la route dashboard
    dashboard_match = re.search(r'@app\.route\s*\(\s*[\'"]\/dashboard[\'"]\s*\)[^{]*?def\s+dashboard\s*\(\s*\)\s*:', content)
    if not dashboard_match:
        return None, None
    
    start_pos = dashboard_match.start()
    
    # Trouver la fin de la fonction
    # Cela peut être complexe car nous devons tenir compte de l'indentation
    lines = content[start_pos:].split('\n')
    function_lines = [lines[0]]
    indent_level = None
    
    for i, line in enumerate(lines[1:], 1):
        # Déterminer le niveau d'indentation de la première ligne non vide
        if indent_level is None and line.strip():
            indent_level = len(line) - len(line.lstrip())
            function_lines.append(line)
            continue
        
        # Si nous avons déjà déterminé le niveau d'indentation
        if indent_level is not None:
            # Si la ligne est vide ou a une indentation supérieure ou égale, elle fait partie de la fonction
            if not line.strip() or len(line) - len(line.lstrip()) >= indent_level:
                function_lines.append(line)
            else:
                # Sinon, nous avons atteint la fin de la fonction
                break
    
    end_pos = start_pos + len('\n'.join(function_lines))
    return start_pos, end_pos

def patch_dashboard_route(file_path):
    """Applique le patch à la route dashboard"""
    if not os.path.exists(file_path):
        log_error(f"Le fichier {file_path} n'existe pas")
        return False
    
    # Créer une sauvegarde
    if not backup_file(file_path):
        return False
    
    try:
        # Lire le contenu du fichier
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Trouver la route dashboard
        start_pos, end_pos = find_dashboard_route(content)
        if start_pos is None:
            log_error("Route dashboard non trouvée dans le fichier")
            return False
        
        # Nouveau code pour la route dashboard
        new_dashboard_code = '''@app.route('/dashboard')
@login_required
def dashboard():
    """Affiche le tableau de bord avec les informations importantes"""
    today = datetime.utcnow().date()
    
    # Initialiser les variables avec des valeurs par défaut
    prestations_a_venir = []
    factures_en_attente = []
    factures_en_retard = []
    total_clients = 0
    total_prestations = 0
    total_factures = 0
    ca_total = 0
    
    # Récupérer les prestations à venir avec gestion d'erreur robuste
    try:
        prestations_a_venir = Prestation.query.filter(
            Prestation.date_debut >= today,
            Prestation.archived != True
        ).order_by(Prestation.date_debut).limit(5).all()
    except Exception as e:
        print(f"Erreur lors de la récupération des prestations: {e}")
        try:
            # Requête SQL brute pour récupérer les prestations
            prestations_a_venir = db.session.query(Prestation).filter(
                Prestation.date_debut >= today
            ).order_by(Prestation.date_debut).limit(5).all()
        except Exception as e2:
            print(f"Erreur lors de la tentative alternative: {e2}")
    
    # Récupérer les factures en attente avec gestion d'erreur robuste
    try:
        factures_en_attente = Facture.query.filter_by(statut='en_attente').order_by(
            Facture.date_emission.desc()
        ).limit(5).all()
    except Exception as e:
        print(f"Erreur lors de la récupération des factures: {e}")
    
    # Récupérer les factures en retard avec gestion d'erreur robuste
    try:
        factures_en_retard = Facture.query.filter_by(statut='retard').order_by(
            Facture.date_emission
        ).limit(5).all()
    except Exception as e:
        print(f"Erreur lors de la récupération des factures en retard: {e}")
    
    # Calculer les statistiques avec gestion d'erreur robuste
    try:
        total_clients = Client.query.count()
    except Exception as e:
        print(f"Erreur lors du comptage des clients: {e}")
        try:
            # Requête SQL brute pour compter les clients
            result = db.session.execute(text("SELECT COUNT(*) FROM client"))
            total_clients = result.scalar() or 0
        except Exception as e2:
            print(f"Erreur lors de la tentative alternative de comptage des clients: {e2}")
    
    try:
        total_prestations = Prestation.query.count()
    except Exception as e:
        print(f"Erreur lors du comptage des prestations: {e}")
        try:
            # Requête SQL brute pour compter les prestations
            result = db.session.execute(text("SELECT COUNT(*) FROM prestation"))
            total_prestations = result.scalar() or 0
        except Exception as e2:
            print(f"Erreur lors de la tentative alternative de comptage des prestations: {e2}")
    
    try:
        total_factures = Facture.query.count()
    except Exception as e:
        print(f"Erreur lors du comptage des factures: {e}")
    
    try:
        ca_total = db.session.query(func.sum(Facture.montant_ttc)).filter(
            Facture.statut == 'payee'
        ).scalar() or 0
    except Exception as e:
        print(f"Erreur lors du calcul du chiffre d'affaires: {e}")
        ca_total = 0
    
    return render_template('dashboard.html',
                          prestations_a_venir=prestations_a_venir,
                          factures_en_attente=factures_en_attente,
                          factures_en_retard=factures_en_retard,
                          total_clients=total_clients,
                          total_prestations=total_prestations,
                          total_factures=total_factures,
                          ca_total=ca_total)'''
        
        # Remplacer l'ancienne route par la nouvelle
        new_content = content[:start_pos] + new_dashboard_code + content[end_pos:]
        
        # Écrire le contenu modifié dans le fichier
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        log_info(f"Patch appliqué avec succès à {file_path}")
        return True
    
    except Exception as e:
        log_error(f"Erreur lors de l'application du patch: {e}")
        return False

def main():
    """Fonction principale"""
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <chemin_vers_app.py>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    log_info(f"Démarrage de l'application du patch pour la route dashboard...")
    
    if not os.path.exists(file_path):
        log_error(f"Le fichier {file_path} n'existe pas")
        log_error(f"Échec de l'application du patch")
        sys.exit(1)
        
    success = patch_dashboard_route(file_path)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()