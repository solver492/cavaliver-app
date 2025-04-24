import os
import re

def fix_imports_in_file(file_path):
    print(f"Fixing imports in {file_path}")
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remplacer from app import db par from extensions import db
    new_content = re.sub(r'from app import db', 'from extensions import db', content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"✓ Fixed imports in {file_path}")
    else:
        print(f"✓ No changes needed in {file_path}")

def main():
    # Chemin de base des routes
    routes_dir = os.path.join(os.getcwd(), 'routes')
    
    # Parcourir tous les fichiers Python dans routes
    for root, dirs, files in os.walk(routes_dir):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                fix_imports_in_file(file_path)
    
    print("Import fixes completed!")

if __name__ == "__main__":
    main()
