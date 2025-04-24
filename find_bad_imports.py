#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script pour trouver les importations problématiques dans le code
"""

import os
import re

def scan_python_files(base_dir, pattern):
    """Scanne tous les fichiers Python pour trouver un pattern d'importation"""
    problematic_files = []
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        matches = re.findall(pattern, content)
                        if matches:
                            problematic_files.append((file_path, file, matches))
                except Exception as e:
                    print(f"Erreur lors de la lecture de {file_path}: {e}")
    
    return problematic_files

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("=== RECHERCHE DES IMPORTATIONS PROBLÉMATIQUES ===\n")
    
    # Recherche des importations problématiques
    transporteur_pattern = r'(?:from\s+models\s+import.*?)Transporteur(?:[,\s]|$)'
    vehicule_pattern = r'(?:from\s+models\s+import.*?)Vehicule(?:[,\s]|$)'
    
    transporteur_files = scan_python_files(base_dir, transporteur_pattern)
    vehicule_files = scan_python_files(base_dir, vehicule_pattern)
    
    print("Fichiers avec importation de 'Transporteur':")
    if transporteur_files:
        for file_path, file_name, matches in transporteur_files:
            print(f"  • {file_name} ({file_path})")
            print(f"    Lignes trouvées: {matches}")
    else:
        print("  • Aucun fichier trouvé")
    
    print("\nFichiers avec importation de 'Vehicule':")
    if vehicule_files:
        for file_path, file_name, matches in vehicule_files:
            print(f"  • {file_name} ({file_path})")
            print(f"    Lignes trouvées: {matches}")
    else:
        print("  • Aucun fichier trouvé")
    
    # Suggérer des corrections
    if transporteur_files or vehicule_files:
        print("\n=== CORRECTIONS SUGGÉRÉES ===")
        print("Pour corriger ces importations problématiques:")
        print("1. Remplacer 'Transporteur' par 'User' avec un filtre sur le rôle 'transporteur'")
        print("2. Supprimer les références à 'Vehicule' et utiliser 'TypeVehicule' à la place")
        print("3. Mettre à jour la logique pour utiliser les modèles existants")
    
if __name__ == "__main__":
    main()
