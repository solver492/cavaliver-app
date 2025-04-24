# Architecture et Logique de l'Application R-Cavalier

## Logique Globale de l'Application

L'application R-Cavalier est une solution complète de gestion pour entreprises de déménagement, conçue selon une architecture modulaire et évolutive. Elle permet de gérer l'ensemble du cycle de vie des prestations de déménagement, depuis la création d'un client jusqu'à la facturation, en passant par la planification et l'exécution des déménagements.

### Principes Fondamentaux

1. **Architecture MVC (Modèle-Vue-Contrôleur)**
   - **Modèles** : Définis dans `models.py`, représentent les entités métier et leurs relations
   - **Vues** : Templates HTML dans le dossier `templates/`
   - **Contrôleurs** : Implémentés via les routes Flask dans le dossier `routes/`

2. **Conception modulaire**
   - Chaque fonctionnalité métier est isolée dans son propre module
   - Les modules communiquent entre eux via des interfaces bien définies
   - Utilisation de blueprints Flask pour organiser les routes

3. **Sécurité et permissions**
   - Système de rôles hiérarchiques (admin, commercial, transporteur, client)
   - Contrôle d'accès basé sur les rôles pour chaque fonctionnalité
   - Protection contre les vulnérabilités web courantes (CSRF, XSS, injection SQL)

4. **Expérience utilisateur adaptative**
   - Interfaces spécifiques selon le rôle de l'utilisateur
   - Design responsive pour une utilisation sur tous les appareils
   - Notifications en temps réel pour les événements importants

## Logique des Modules

### 1. Module d'Authentification et Gestion des Utilisateurs

**Logique métier :**
- Gestion du cycle de vie complet des utilisateurs (création, modification, désactivation)
- Authentification sécurisée avec hachage des mots de passe
- Gestion des sessions utilisateur avec Flask-Login
- Récupération de mot de passe par email

**Flux de données :**
1. L'utilisateur soumet ses identifiants
2. Le système vérifie les identifiants contre la base de données
3. Si valides, création d'une session sécurisée
4. Redirection vers l'interface correspondant au rôle de l'utilisateur

### 2. Module Client

**Logique métier :**
- Gestion complète des informations clients
- Catégorisation des clients (particulier, entreprise)
- Historique des interactions et prestations
- Gestion des documents associés aux clients

**Flux de données :**
1. Création/modification des informations client
2. Association avec des prestations
3. Suivi de l'historique des prestations par client
4. Génération de rapports clients

### 3. Module Prestation

**Logique métier :**
- Cycle de vie complet des prestations de déménagement
- Planification temporelle et spatiale (dates, adresses)
- Attribution des ressources (transporteurs, véhicules)
- Suivi d'état (En attente, Confirmée, En cours, Terminée, Annulée)
- Gestion des observations et spécificités

**Flux de données :**
1. Création d'une prestation liée à un client
2. Planification des dates et lieux
3. Attribution des transporteurs et véhicules
4. Suivi de l'état et mise à jour par les différents acteurs
5. Génération de facture une fois terminée

### 4. Module Transporteur

**Logique métier :**
- Interface dédiée aux transporteurs
- Visualisation des prestations assignées
- Gestion des disponibilités
- Confirmation/refus des prestations
- Suivi en temps réel des prestations en cours

**Flux de données :**
1. Réception des prestations assignées
2. Acceptation ou refus motivé
3. Mise à jour du statut pendant l'exécution
4. Documentation de la prestation (photos, commentaires)

### 5. Module Facturation

**Logique métier :**
- Génération automatique ou manuelle des factures
- Calcul des montants (HT, TVA, TTC)
- Suivi des paiements
- Gestion des relances
- Génération de documents PDF

**Flux de données :**
1. Création de facture liée à une prestation
2. Calcul automatique des montants selon les règles définies
3. Génération du document PDF
4. Suivi du statut de paiement
5. Relances automatiques si nécessaire

### 6. Module Calendrier

**Logique métier :**
- Visualisation temporelle des prestations
- Planification visuelle des ressources
- Détection des conflits d'horaires
- Vue globale de l'activité

**Flux de données :**
1. Récupération des prestations depuis la base de données
2. Affichage dans l'interface calendrier
3. Interaction pour la création/modification de prestations
4. Filtrage selon différents critères (statut, transporteur, etc.)

### 7. Module Stockage

**Logique métier :**
- Gestion des espaces de stockage
- Suivi des objets stockés
- Facturation du stockage
- Planification des entrées/sorties

**Flux de données :**
1. Attribution d'un espace de stockage à un client
2. Inventaire des objets stockés
3. Suivi de la durée de stockage
4. Facturation périodique

## Hiérarchie et Organisation du Code

### Structure Hiérarchique

```
R-cavalier-app/
│
├── Niveau 1: Points d'entrée et configuration
│   ├── app.py                # Création et configuration de l'application Flask
│   ├── main.py               # Point d'entrée pour le serveur de développement
│   ├── config.py             # Configuration de l'environnement
│   └── extensions.py         # Initialisation des extensions Flask
│
├── Niveau 2: Modèles et formulaires
│   ├── models.py             # Définition des modèles de données
│   └── forms.py              # Définition des formulaires
│
├── Niveau 3: Logique métier (routes)
│   └── routes/               # Organisation par domaine fonctionnel
│       ├── __init__.py       # Enregistrement des blueprints
│       ├── auth.py           # Authentification
│       ├── dashboard.py      # Tableau de bord
│       ├── client.py         # Gestion des clients
│       ├── prestation.py     # Gestion des prestations
│       ├── facture.py        # Gestion des factures
│       ├── stockage.py       # Gestion du stockage
│       ├── user.py           # Gestion des utilisateurs
│       ├── vehicule.py       # Gestion des véhicules
│       ├── transporteur.py   # Interface transporteur
│       ├── calendrier.py     # Gestion du calendrier
│       └── api.py            # API pour les interactions AJAX
│
├── Niveau 4: Présentation
│   ├── templates/            # Templates HTML par fonctionnalité
│   │   ├── base.html         # Template de base
│   │   ├── components/       # Composants réutilisables
│   │   ├── auth/             # Templates d'authentification
│   │   ├── clients/          # Templates de gestion des clients
│   │   ├── prestations/      # Templates de gestion des prestations
│   │   ├── factures/         # Templates de gestion des factures
│   │   ├── stockages/        # Templates de gestion du stockage
│   │   ├── users/            # Templates de gestion des utilisateurs
│   │   ├── transporteur/     # Templates pour les transporteurs
│   │   └── calendrier/       # Templates du calendrier
│   │
│   └── static/               # Ressources statiques
│       ├── css/              # Styles CSS
│       ├── js/               # Scripts JavaScript
│       └── img/              # Images
│
└── Niveau 5: Utilitaires et migrations
    ├── utils.py              # Fonctions utilitaires
    ├── migrations/           # Scripts de migration de base de données
    └── scripts/              # Scripts d'administration et maintenance
```

### Dépendances entre modules

```
auth.py ← user.py ← [tous les autres modules]
client.py ← prestation.py ← facture.py
prestation.py ← transporteur.py
prestation.py ← calendrier.py
prestation.py ← stockage.py
```

## Rôles Utilisateurs et Permissions

### Rôles définis

1. **Administrateur**
   - Accès complet à toutes les fonctionnalités
   - Gestion des utilisateurs et des rôles
   - Configuration système
   - Rapports et statistiques avancés

2. **Commercial**
   - Gestion des clients
   - Création et modification des prestations
   - Attribution des transporteurs
   - Génération et suivi des factures
   - Accès au calendrier et au tableau de bord

3. **Transporteur**
   - Vue limitée aux prestations assignées
   - Confirmation/refus des prestations
   - Mise à jour du statut des prestations
   - Accès à son calendrier personnel

4. **Client** (accès externe)
   - Consultation de ses prestations
   - Suivi de l'état des prestations
   - Accès à ses factures
   - Demande de nouvelles prestations

### Matrice des permissions

| Fonctionnalité                   | Admin | Commercial | Transporteur | Client |
|----------------------------------|-------|------------|--------------|--------|
| **Gestion des utilisateurs**     |   ✓   |     -      |      -       |   -    |
| **Création de clients**          |   ✓   |     ✓      |      -       |   -    |
| **Modification de clients**      |   ✓   |     ✓      |      -       |   -    |
| **Création de prestations**      |   ✓   |     ✓      |      -       |   ✓*   |
| **Modification de prestations**  |   ✓   |     ✓      |      -       |   -    |
| **Assignation transporteurs**    |   ✓   |     ✓      |      -       |   -    |
| **Confirmation prestations**     |   ✓   |     ✓      |      ✓       |   -    |
| **Mise à jour statut**           |   ✓   |     ✓      |      ✓       |   -    |
| **Création de factures**         |   ✓   |     ✓      |      -       |   -    |
| **Modification de factures**     |   ✓   |     ✓      |      -       |   -    |
| **Gestion du stockage**          |   ✓   |     ✓      |      -       |   -    |
| **Accès au calendrier global**   |   ✓   |     ✓      |      -       |   -    |
| **Accès calendrier personnel**   |   ✓   |     ✓      |      ✓       |   ✓    |
| **Rapports et statistiques**     |   ✓   |     ✓*     |      -       |   -    |
| **Configuration système**        |   ✓   |     -      |      -       |   -    |

*✓* : Accès complet
*✓**: Accès limité
*-* : Pas d'accès

### Implémentation des permissions

Les permissions sont implémentées à trois niveaux :

1. **Niveau routes** : Décorateurs Flask-Login pour vérifier l'authentification et le rôle
   ```python
   @login_required
   @admin_required
   def admin_only_route():
       # ...
   ```

2. **Niveau templates** : Conditionnels Jinja2 pour afficher/masquer des éléments selon le rôle
   ```html
   {% if current_user.is_admin() %}
   <div class="admin-panel">...</div>
   {% endif %}
   ```

3. **Niveau API** : Vérification des permissions avant chaque action
   ```python
   def modify_resource(resource_id):
       if not current_user.can_modify(resource_id):
           abort(403)
       # ...
   ```

## Flux de Données et Interactions

### Création d'une prestation

1. Le commercial crée un client ou sélectionne un client existant
2. Le commercial crée une nouvelle prestation en spécifiant:
   - Dates de début et fin
   - Adresses de départ et d'arrivée
   - Type de déménagement
   - Observations spécifiques
3. Le système suggère des transporteurs disponibles
4. Le commercial assigne un ou plusieurs transporteurs
5. Le système notifie les transporteurs assignés
6. Les transporteurs confirment ou refusent la prestation
7. Le jour de la prestation, le transporteur met à jour le statut
8. Une fois terminée, le commercial génère la facture

### Cycle de vie d'une prestation

```
Création → En attente → Confirmée → En cours → Terminée → Facturée
                     ↘ Annulée
                     ↘ Refusée → Réassignation
```

## Améliorations Futures

1. **Widget de sélection des transporteurs amélioré**
   - Barre de recherche intelligente (filtrage par nom, prénom, matricule, permis)
   - Affichage des transporteurs disponibles en temps réel
   - Suggestions de transporteurs bientôt disponibles
   - Interface améliorée avec thème UI/UX moderne
   - Notifications pour les transporteurs lors de l'assignation
   - Fonctionnalités d'acceptation/refus/documentation des prestations

2. **Module de prestation optimisé**
   - Correction des erreurs lors de la création/modification
   - Intégration de l'éditeur Summernote pour les observations
   - Gestion améliorée des documents liés aux prestations
   - Système de versionnement des prestations

3. **Intégration mobile**
   - Application mobile pour les transporteurs
   - Notifications push
   - Scan de documents sur mobile
   - Signature électronique des clients

4. **Intelligence artificielle**
   - Optimisation des itinéraires
   - Prédiction de la durée des prestations
   - Suggestion automatique de transporteurs selon l'historique
   - Détection des anomalies et des risques
