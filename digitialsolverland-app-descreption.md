# Documentation de l'Application Cavalier Déménagement

## Vue d'ensemble

L'application Cavalier Déménagement est une solution complète de gestion pour les entreprises de déménagement et de stockage. Elle permet de gérer les prestations, les clients, les agendas, les événements, le stockage, la facturation et bien plus encore. Cette application est développée avec Flask, un framework web Python, et utilise SQLAlchemy pour la gestion de la base de données.

## Modules de l'Application

### 1. Gestion des Utilisateurs

Ce module gère les différents types d'utilisateurs du système, leurs rôles et leurs permissions.

**Fonctionnalités principales :**
- Authentification et autorisation (login/logout)
- Gestion des rôles (admin, commercial, transporteur)
- Profils utilisateurs
- Gestion des permissions selon les rôles

**Modèles associés :**
- `User` : Stocke les informations des utilisateurs, leurs rôles et leurs permissions

### 2. Gestion des Clients

Ce module permet de gérer les informations relatives aux clients de l'entreprise.

**Fonctionnalités principales :**
- Création, modification et suppression de clients
- Visualisation des détails des clients
- Historique des prestations par client
- Gestion des documents associés aux clients

**Modèles associés :**
- `Client` : Stocke les informations des clients (nom, prénom, adresse, etc.)

### 3. Gestion des Agendas

Ce module est au cœur de l'application et permet de gérer les plannings et les événements de l'entreprise. Il offre une interface de type calendrier pour visualiser et organiser les activités.

**Fonctionnalités principales :**
- Création et gestion d'agendas personnalisés
- Partage d'agendas entre utilisateurs (notamment entre administrateurs et commerciaux)
- Visualisation des événements par jour, semaine, mois ou liste
- Filtrage des événements par type
- Création, modification, archivage et suppression d'événements
- Gestion des versions des événements (historique des modifications)
- Association de documents aux événements
- Liaison des événements avec des prestations

**Modèles associés :**
- `Agenda` : Représente un agenda avec ses propriétés (nom, couleur, description, etc.)
- `Evenement` : Représente un événement dans un agenda (titre, dates, type, etc.)
- `EvenementVersion` : Stocke l'historique des modifications d'un événement
- `Document` : Stocke les documents associés aux événements

**Détails techniques :**
- Interface utilisateur basée sur FullCalendar.js pour l'affichage du calendrier
- Système de versionnement pour suivre les modifications des événements
- Gestion des états d'archivage pour masquer les événements sans les supprimer
- Système de partage d'agendas avec contrôle d'accès
- Filtrage des événements par type et période
- Gestion des documents associés aux événements avec upload et téléchargement

### 4. Gestion des Prestations

Ce module permet de gérer les prestations de déménagement proposées par l'entreprise.

**Fonctionnalités principales :**
- Création et gestion des prestations de déménagement
- Assignation de prestations aux événements du calendrier
- Suivi de l'état des prestations (en attente, confirmée, en cours, terminée)
- Gestion des transporteurs pour les prestations
- Planification des étapes de déménagement

**Modèles associés :**
- `Prestation` : Stocke les informations des prestations de déménagement
- `PrestationVersion` : Stocke l'historique des modifications d'une prestation
- `TypeDemenagement` : Définit les différents types de déménagement proposés

### 5. Gestion du Stockage

Ce module permet de gérer les services de stockage proposés par l'entreprise.

**Fonctionnalités principales :**
- Gestion des espaces de stockage
- Suivi des articles stockés
- Facturation du stockage
- Gestion des entrées et sorties

**Modèles associés :**
- `Stockage` : Représente un espace de stockage loué à un client
- `ArticleStockage` : Représente un article stocké
- `StockageArticle` : Relation entre un stockage et les articles qu'il contient

### 6. Gestion des Véhicules et Transporteurs

Ce module permet de gérer la flotte de véhicules et les transporteurs de l'entreprise.

**Fonctionnalités principales :**
- Gestion des véhicules (ajout, modification, suppression)
- Gestion des transporteurs (chauffeurs)
- Assignation des véhicules aux transporteurs
- Suivi de la disponibilité des véhicules

**Modèles associés :**
- `TypeVehicule` : Définit les différents types de véhicules disponibles
- `Vehicule` : Représente un véhicule spécifique de la flotte
- `Transporteur` : Représente un transporteur (chauffeur)

### 7. Gestion de la Facturation

Ce module permet de gérer la facturation des prestations et des services de stockage.

**Fonctionnalités principales :**
- Génération de factures pour les prestations et le stockage
- Suivi des paiements
- Gestion des échéances
- Génération de rapports financiers

**Modèles associés :**
- `Facture` : Représente une facture émise à un client
- `FichierFacture` : Stocke les fichiers associés aux factures

### 8. Système de Notifications

Ce module permet de gérer les notifications internes à l'application.

**Fonctionnalités principales :**
- Notifications pour les nouvelles prestations
- Alertes pour les échéances de paiement
- Notifications pour les partages d'agenda
- Système de marquage des notifications comme lues/non lues

**Modèles associés :**
- `Notification` : Stocke les notifications envoyées aux utilisateurs

### 9. Gestion des Documents

Ce module transversal permet de gérer les documents associés aux différentes entités de l'application.

**Fonctionnalités principales :**
- Upload et téléchargement de documents
- Association de documents aux clients, prestations, événements, etc.
- Gestion des types de documents
- Contrôle d'accès aux documents

**Modèles associés :**
- `Document` : Stocke les informations sur les documents uploadés

## Architecture Technique

### Backend
- **Framework** : Flask (Python)
- **ORM** : SQLAlchemy
- **Base de données** : SQLite (développement) / PostgreSQL (production)
- **Authentification** : Flask-Login

### Frontend
- **Framework CSS** : Bootstrap
- **Bibliothèque JavaScript** : jQuery
- **Calendrier** : FullCalendar.js
- **Templating** : Jinja2

### Sécurité
- **Authentification** : Gestion des sessions avec Flask-Login
- **Autorisation** : Contrôle d'accès basé sur les rôles
- **Protection CSRF** : Jetons CSRF pour les formulaires
- **Validation des données** : Validation côté serveur et côté client

## Flux de Travail Typiques

### Gestion d'un Déménagement
1. Création d'un client
2. Création d'une prestation de déménagement
3. Création d'un événement dans l'agenda
4. Assignation de la prestation à l'événement
5. Assignation d'un transporteur
6. Suivi de la prestation
7. Facturation

### Gestion du Stockage
1. Création d'un client
2. Création d'un espace de stockage
3. Enregistrement des articles stockés
4. Facturation mensuelle
5. Gestion des entrées/sorties

### Gestion des Agendas et Événements
1. Création d'un agenda
2. Partage de l'agenda avec d'autres utilisateurs
3. Création d'événements dans l'agenda
4. Association de documents aux événements
5. Modification des événements avec suivi des versions
6. Archivage ou suppression des événements obsolètes

## Conclusion

L'application Cavalier Déménagement est une solution complète et intégrée qui couvre tous les aspects de la gestion d'une entreprise de déménagement et de stockage. Sa conception modulaire permet une grande flexibilité et facilite les évolutions futures.
