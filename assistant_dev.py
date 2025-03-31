#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Assistant de développement pour l'application de déménagement
Ce script aide à diagnostiquer et résoudre les problèmes courants
"""

import os
import sys
import sqlite3
import importlib.util
import time
from datetime import datetime
import traceback

# Titre de l'application
TITLE = """
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   Assistant de Développement - Application de Déménagement                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

# Couleurs pour le terminal
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_colored(message, color):
    """Affiche un message coloré dans le terminal"""
    print(f"{color}{message}{Colors.ENDC}")

def print_header(header):
    """Affiche un en-tête de section"""
    print("\n")
    print_colored(f"{'=' * 80}", Colors.BLUE)
    print_colored(f"  {header}", Colors.BOLD + Colors.BLUE)
    print_colored(f"{'=' * 80}", Colors.BLUE)

def print_success(message):
    """Affiche un message de succès"""
    print_colored(f"✅ {message}", Colors.GREEN)

def print_warning(message):
    """Affiche un avertissement"""
    print_colored(f"⚠️ {message}", Colors.WARNING)

def print_error(message):
    """Affiche une erreur"""
    print_colored(f"❌ {message}", Colors.RED)

def print_info(message):
    """Affiche une information"""
    print_colored(f"ℹ️ {message}", Colors.BLUE)

def check_database_exists():
    """Vérifie si la base de données existe"""
    if os.path.exists('demenage.db'):
        db_size = os.path.getsize('demenage.db') / 1024  # Taille en Ko
        print_success(f"Base de données trouvée (demenage.db) - Taille: {db_size:.2f} Ko")
        return True
    else:
        print_error("Base de données non trouvée (demenage.db)")
        return False

def check_database_tables():
    """Vérifie les tables dans la base de données"""
    try:
        conn = sqlite3.connect('demenage.db')
        cursor = conn.cursor()
        
        # Liste des tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print_error("Aucune table trouvée dans la base de données")
            return False
        
        print_success(f"Nombre de tables trouvées: {len(tables)}")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print_info(f"  - Table '{table_name}': {len(columns)} colonnes")
        
        return True
    except sqlite3.Error as e:
        print_error(f"Erreur lors de l'accès à la base de données: {str(e)}")
        return False
    finally:
        if conn:
            conn.close()

def check_models_consistency():
    """Vérifie la cohérence entre les modèles Python et les tables SQLite"""
    try:
        # Importer dynamiquement les modèles
        spec = importlib.util.spec_from_file_location("models", "models.py")
        models = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(models)
        
        # Liste des modèles SQLAlchemy
        model_classes = []
        for attr_name in dir(models):
            attr = getattr(models, attr_name)
            if hasattr(attr, '__tablename__'):
                model_classes.append(attr)
        
        print_success(f"Nombre de modèles trouvés dans models.py: {len(model_classes)}")
        
        # Vérifier chaque modèle avec la structure de la base de données
        conn = sqlite3.connect('demenage.db')
        cursor = conn.cursor()
        
        issues_found = False
        
        for model in model_classes:
            table_name = model.__tablename__
            
            # Vérifier si la table existe
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
            if not cursor.fetchone():
                print_error(f"La table '{table_name}' n'existe pas dans la base de données")
                issues_found = True
                continue
            
            # Vérifier les colonnes
            cursor.execute(f"PRAGMA table_info({table_name})")
            db_columns = {col[1]: col[2] for col in cursor.fetchall()}
            
            for column in model.__table__.columns:
                col_name = column.name
                if col_name not in db_columns:
                    print_error(f"  - Colonne '{col_name}' manquante dans la table '{table_name}'")
                    issues_found = True
        
        if not issues_found:
            print_success("Modèles et tables de la base de données synchronisés !")
        
        return not issues_found
    except Exception as e:
        print_error(f"Erreur lors de la vérification de cohérence: {str(e)}")
        traceback.print_exc()
        return False
    finally:
        if 'conn' in locals() and conn:
            conn.close()

def fix_missing_columns():
    """Corrige les colonnes manquantes en exécutant le script de migration"""
    try:
        # Vérifier si le script de migration existe
        if not os.path.exists('migration_db.py'):
            print_error("Script de migration non trouvé (migration_db.py)")
            return False
        
        print_info("Exécution du script de migration...")
        
        # Importer et exécuter le script de migration
        spec = importlib.util.spec_from_file_location("migration", "migration_db.py")
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        
        result = migration.run_migration()
        
        if result:
            print_success("Migration terminée avec succès!")
        else:
            print_error("Échec de la migration")
        
        return result
    except Exception as e:
        print_error(f"Erreur lors de la migration: {str(e)}")
        traceback.print_exc()
        return False

def initialize_database():
    """Initialise la base de données si elle n'existe pas"""
    try:
        # Importer l'application Flask
        spec = importlib.util.spec_from_file_location("app", "app.py")
        app_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(app_module)
        
        print_info("Initialisation de la base de données...")
        
        # Initialiser la base de données
        with app_module.app.app_context():
            app_module.db.create_all()
            
            # Vérifier si un utilisateur super_admin existe déjà
            admin_exists = app_module.User.query.filter_by(email='admin@admin.com').first()
            
            if not admin_exists:
                # Créer un utilisateur super_admin par défaut
                admin = app_module.User(
                    nom='Admin',
                    prenom='Super',
                    email='admin@admin.com',
                    telephone='0123456789',
                    role='super_admin',
                    adresse='Administration',
                    ville='Système',
                    code_postal='00000'
                )
                admin.set_password('admin')
                app_module.db.session.add(admin)
                app_module.db.session.commit()
                print_success("Utilisateur super_admin créé (email: admin@admin.com, mot de passe: admin)")
            else:
                print_info("Un utilisateur super_admin existe déjà")
        
        print_success("Base de données initialisée avec succès!")
        return True
    except Exception as e:
        print_error(f"Erreur lors de l'initialisation de la base de données: {str(e)}")
        traceback.print_exc()
        return False

def run_diagnostics():
    """Exécute tous les diagnostics et propose des solutions"""
    print(TITLE)
    print(f"Date et heure: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Répertoire de travail: {os.getcwd()}")
    print("\n")
    
    # Vérification des fichiers importants
    print_header("VÉRIFICATION DES FICHIERS")
    important_files = ['app.py', 'models.py', 'migration_db.py']
    for file in important_files:
        if os.path.exists(file):
            print_success(f"Fichier trouvé: {file}")
        else:
            print_error(f"Fichier manquant: {file}")
    
    # Vérification de la base de données
    print_header("VÉRIFICATION DE LA BASE DE DONNÉES")
    db_exists = check_database_exists()
    
    if not db_exists:
        print_info("La base de données n'existe pas. Voulez-vous l'initialiser? (o/n)")
        choice = input("> ").lower()
        if choice == 'o':
            initialize_database()
    else:
        check_database_tables()
    
    # Vérification de la cohérence des modèles
    print_header("VÉRIFICATION DE LA COHÉRENCE DES MODÈLES")
    models_ok = check_models_consistency()
    
    if not models_ok:
        print_info("Des incohérences ont été détectées entre les modèles et la base de données.")
        print_info("Voulez-vous exécuter la migration pour corriger ces problèmes? (o/n)")
        choice = input("> ").lower()
        if choice == 'o':
            fix_missing_columns()
            # Vérifier à nouveau après la migration
            print_info("Vérification après migration...")
            check_models_consistency()
    
    # Conclusion
    print_header("CONCLUSION")
    print_info("Le diagnostic est terminé. Consultez le GUIDE_DEVELOPPEMENT.md pour plus d'informations sur les bonnes pratiques.")
    print_info("Pour toute aide supplémentaire, exécutez ce script à nouveau.")

if __name__ == "__main__":
    run_diagnostics()
