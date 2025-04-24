# Documentation Technique - R-Cavalier App

## Architecture de l'Application

L'application R-Cavalier est une application web conçue pour gérer les opérations d'une entreprise de déménagement. Elle utilise une architecture basée sur Python/Flask pour le backend et Bootstrap/jQuery pour le frontend.

### Structure du Projet

```
R-cavalier-app/
│
├── app.py                # Point d'entrée de l'application Flask
├── main.py               # Script de démarrage pour le développement
├── models.py             # Modèles de données SQLAlchemy
├── forms.py              # Formulaires WTForms
├── config.py             # Configuration de l'application
├── update_db.py          # Utilitaire de mise à jour de la base de données
│
├── routes/               # Organisation des routes par fonctionnalité
│   ├── __init__.py       # Initialisation des blueprints
│   ├── auth.py           # Authentification
│   ├── dashboard.py      # Tableau de bord
│   ├── client.py         # Gestion des clients
│   ├── prestation.py     # Gestion des prestations
│   ├── facture.py        # Gestion des factures
│   ├── stockage.py       # Gestion du stockage
│   ├── user.py           # Gestion des utilisateurs
│   ├── vehicule.py       # Gestion des véhicules
│   ├── transporteur.py   # Interface transporteur
│   └── calendrier.py     # Gestion du calendrier
│
├── templates/            # Templates HTML organisés par fonctionnalité
│   ├── base.html         # Template de base
│   ├── dashboard.html    # Page du tableau de bord
│   ├── auth/             # Templates d'authentification
│   ├── clients/          # Templates de gestion des clients
│   ├── prestations/      # Templates de gestion des prestations
│   ├── factures/         # Templates de gestion des factures
│   ├── stockages/        # Templates de gestion du stockage
│   ├── users/            # Templates de gestion des utilisateurs
│   ├── transporteur/     # Templates pour les transporteurs
│   └── calendrier/       # Templates du calendrier
│
└── static/               # Fichiers statiques
    ├── css/              # Feuilles de style
    ├── js/               # Scripts JavaScript
    └── img/              # Images
```

## Modules et Fonctionnalités

### 1. Module d'Authentification (auth.py)

Gère l'inscription, la connexion et la déconnexion des utilisateurs. Utilise Flask-Login pour la gestion des sessions.

**Principales fonctionnalités :**
- Inscription de nouveaux utilisateurs
- Connexion/Déconnexion
- Récupération de mot de passe

### 2. Module Dashboard (dashboard.py)

Affiche les statistiques et informations principales sur l'activité de l'entreprise.

**Principales fonctionnalités :**
- Vue d'ensemble des prestations récentes/à venir
- Graphiques de performance (CA, types de prestations)
- Alertes et notifications
- Accès rapide au calendrier en plein écran

### 3. Module Clients (client.py)

Gère les informations des clients de l'entreprise.

**Principales fonctionnalités :**
- Ajout/Modification/Suppression de clients
- Recherche de clients
- Gestion des documents associés aux clients

### 4. Module Prestations (prestation.py)

Gère les prestations de déménagement.

**Principales fonctionnalités :**
- Création/Modification/Suppression de prestations
- Attribution de transporteurs aux prestations
- Suivi de l'état des prestations (En attente, Confirmée, En cours, Terminée)
- Facturation des prestations

### 5. Module Transporteurs (transporteur.py)

Interface dédiée aux transporteurs pour la gestion de leurs prestations assignées.

**Principales fonctionnalités :**
- Visualisation des prestations assignées
- Confirmation/Refus des prestations
- Notification du début et de la fin d'une prestation
- Vue détaillée sans possibilité de modification

### 6. Module Facturation (facture.py)

Gère la facturation des prestations.

**Principales fonctionnalités :**
- Création/Modification/Suppression de factures
- Génération de PDF
- Suivi des paiements

### 7. Module Stockage (stockage.py)

Gère les espaces de stockage et les objets stockés.

**Principales fonctionnalités :**
- Gestion des espaces de stockage
- Inventaire des objets stockés
- Facturation du stockage

### 8. Module Utilisateurs (user.py)

Gère les comptes utilisateurs de l'application.

**Principales fonctionnalités :**
- Création/Modification/Suppression d'utilisateurs
- Gestion des rôles (admin, commercial, transporteur)
- Gestion des permissions

### 9. Module Véhicules (vehicule.py)

Gère la flotte de véhicules de l'entreprise.

**Principales fonctionnalités :**
- Gestion des types de véhicules
- Attribution des véhicules aux transporteurs
- Suggestion de véhicules adaptés aux prestations

### 10. Module Calendrier (calendrier.py)

Gère l'affichage des prestations dans un calendrier interactif.

**Principales fonctionnalités :**
- Vue calendrier en plein écran
- Filtrage des prestations par statut
- Affichage détaillé des prestations

## Modèles de Données

### User
- Représente un utilisateur de l'application (admin, commercial, transporteur)
- Champs principaux : id, nom, prenom, username, email, password_hash, role

### Client
- Représente un client de l'entreprise
- Champs principaux : id, nom, prenom, adresse, telephone, email, type_client

### Prestation
- Représente une prestation de déménagement
- Champs principaux : id, client_id, date_debut, date_fin, adresse_depart, adresse_arrivee, type_demenagement, statut

### Facture
- Représente une facture liée à une prestation
- Champs principaux : id, numero, client_id, prestation_id, montant_ht, taux_tva, montant_ttc, date_emission, statut

### Stockage
- Représente un espace de stockage loué par un client
- Champs principaux : id, client_id, reference, date_debut, date_fin, montant_mensuel, emplacement

### ArticleStockage
- Représente un objet stocké dans un espace de stockage
- Champs principaux : id, nom, description, dimensions, volume, poids

### Notification
- Représente une notification système
- Champs principaux : id, message, type, date_creation, lu, role_destinataire

## Flux d'Utilisation

### Flux Commercial
1. Création d'un client
2. Création d'une prestation pour ce client
3. Attribution de transporteurs à la prestation
4. Suivi du statut de la prestation
5. Génération de la facture une fois la prestation terminée

### Flux Transporteur
1. Réception des prestations assignées
2. Confirmation ou refus des prestations
3. Mise à jour du statut au début de la prestation (En cours)
4. Mise à jour du statut à la fin de la prestation (Terminée)

## Configuration Technique

### Dépendances principales
- Python 3.12+
- Flask 2.0+
- SQLAlchemy 2.0.40
- Flask-SQLAlchemy 3.1.1
- Flask-Login 0.6.3
- Flask-WTF 1.2.2
- Bootstrap 5
- FullCalendar 5.10.0
- Chart.js 3.7.0

### Base de données
- SQLite en développement
- Migration prévue vers PostgreSQL en production

### Déploiement
- Développement : Serveur de développement Flask (localhost:5000)
- Production : Render (www.r-cavalier.com)
