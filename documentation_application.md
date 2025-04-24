# Documentation de l'Application de Gestion de Déménagement

## Table des matières
1. [Introduction](#introduction)
2. [Architecture de l'Application](#architecture-de-lapplication)
3. [Structure de la Base de Données](#structure-de-la-base-de-données)
4. [Flux de Travail et Processus](#flux-de-travail-et-processus)
5. [Système de Recommandation de Véhicules](#système-de-recommandation-de-véhicules)
6. [Gestion des Utilisateurs et Rôles](#gestion-des-utilisateurs-et-rôles)
7. [Module de Stockage](#module-de-stockage)
8. [Système de Facturation](#système-de-facturation)
9. [Structure des Fichiers](#structure-des-fichiers)

## Introduction

Cette application web, développée avec Flask et SQLAlchemy, offre une solution complète pour la gestion d'une entreprise de déménagement et de stockage. Elle permet de gérer les clients, les prestations de déménagement, le stockage d'articles, la facturation, et l'attribution des transporteurs aux services.

## Architecture de l'Application

L'application est construite sur une architecture MVC (Modèle-Vue-Contrôleur) :

- **Modèles** : Définis dans `models.py`, ils représentent les structures de données et leur interaction dans la base de données.
- **Vues** : Templates HTML dans le dossier `templates/`, organisés par module.
- **Contrôleurs** : Routes Flask dans le dossier `routes/`, séparées par fonctionnalité.

Le point d'entrée principal est `main.py` qui importe et utilise l'application créée dans `app.py`.

## Structure de la Base de Données

### Principales Entités

1. **User** : Utilisateurs du système (transporteurs, commerciaux, administrateurs)
2. **Client** : Clients de l'entreprise de déménagement
3. **Prestation** : Services de déménagement fournis aux clients
4. **TypeVehicule** : Types de véhicules disponibles
5. **TypeDemenagement** : Catégories de services de déménagement
6. **Facture** : Factures générées pour les prestations
7. **Stockage** : Services de stockage pour les clients
8. **ArticleStockage** : Articles stockés dans les emplacements

### Relations Clés

#### Associations Many-to-Many
- **User ↔ Prestation** : Transporteurs attribués aux prestations via `prestation_transporteurs`
- **TypeVehicule ↔ TypeDemenagement** : Types de véhicules recommandés pour chaque type de déménagement via `type_demenagement_vehicule`
- **Stockage ↔ ArticleStockage** : Articles stockés dans chaque emplacement via `StockageArticle` (avec quantité)

#### Associations One-to-Many
- **Client → Prestation** : Un client peut avoir plusieurs prestations
- **Client → Facture** : Un client peut avoir plusieurs factures
- **Client → Stockage** : Un client peut avoir plusieurs emplacements de stockage
- **User → User.prestations_creees** : Un commercial peut créer plusieurs prestations
- **Prestation → Facture** : Une prestation peut être associée à plusieurs factures
- **Stockage → Facture** : Un stockage peut être associé à plusieurs factures

### Types de Véhicules et Types de Déménagement

| Type de Déménagement | Types de Véhicules Associés | Capacités |
|----------------------|----------------------------|-----------|
| Déménagement Résidentiel | Fourgon/Camionnette, Petit Camion | 8-16 m³, 20-23 m³ |
| Déménagement Commercial | Camion 5T, Camion 10T | 30-40 m³, 50 m³ |
| Transport de marchandises | Semi-remorque | jusqu'à 100 m³ |
| Stockage | Petit Camion, Camion 5T, Camion 10T | 20-23 m³, 30-40 m³, 50 m³ |

## Flux de Travail et Processus

### Gestion des Prestations de Déménagement

1. **Création de la prestation**
   - Un commercial ou admin crée une nouvelle prestation pour un client
   - Sélection du type de déménagement et des détails (adresses, dates)
   - Le système recommande automatiquement des transporteurs en fonction du type de déménagement

2. **Assignation des transporteurs**
   - Les transporteurs recommandés sont mis en évidence dans la liste
   - Sélection possible de transporteurs multiples pour une prestation
   - Le système affiche le compteur de transporteurs sélectionnés

3. **Suivi de la prestation**
   - La prestation est mise à jour selon son statut (En attente, Confirmée, En cours, Terminée)
   - Les transporteurs peuvent voir les prestations qui leur sont assignées

4. **Facturation**
   - Création de factures liées à la prestation une fois celle-ci terminée

### Gestion du Stockage

1. **Création d'un emplacement de stockage**
   - Définition de l'emplacement, tarif mensuel, dates, etc.

2. **Gestion des articles**
   - Ajout d'articles à un emplacement de stockage
   - Suivi des caractéristiques (dimensions, poids, valeur)

3. **Facturation du stockage**
   - Génération de factures mensuelles ou à la demande

## Système de Recommandation de Véhicules

Le système recommande automatiquement des véhicules et des transporteurs en fonction du type de déménagement sélectionné. Ce processus comprend :

1. **Définition des associations** : Chaque type de déménagement est associé à certains types de véhicules dans la table `type_demenagement_vehicule`.

2. **Récupération des transporteurs appropriés** : Lorsqu'un type de déménagement est sélectionné, l'API recherche :
   - Les types de véhicules recommandés
   - Les transporteurs actifs qui possèdent ces types de véhicules

3. **Présentation des résultats** : 
   - Les transporteurs recommandés sont affichés en premier dans la liste
   - Les autres transporteurs disponibles sont affichés séparément
   - Les transporteurs recommandés sont mis en évidence visuellement

4. **Interface utilisateur** :
   - Le champ "Véhicules suggérés" affiche un résumé des recommandations
   - Le compteur indique le nombre de transporteurs sélectionnés

## Gestion des Utilisateurs et Rôles

### Hiérarchie des Rôles

1. **super_admin** : Accès complet à toutes les fonctionnalités
   - Peut créer d'autres admins
   - Gestion des paramètres système

2. **admin** : Administration générale
   - Peut créer des utilisateurs commerciaux et transporteurs
   - Accès à tous les modules de gestion

3. **commercial** : Gestion des clients et prestations
   - Création et gestion de clients
   - Création et suivi des prestations
   - Assignation de transporteurs aux prestations

4. **transporteur** : Exécution des prestations
   - Consultation des prestations assignées
   - Mise à jour du statut des prestations

### Contrôle d'Accès

Le contrôle d'accès est géré par le décorateur `role_required` dans `auth.py`, qui vérifie si l'utilisateur connecté a les permissions nécessaires pour accéder à une route.

## Module de Stockage

### Fonctionnalités Clés

1. **Gestion des emplacements** : Création et suivi des emplacements de stockage
2. **Inventaire des articles** : Suivi détaillé des articles stockés
3. **Calcul des coûts** : Calcul automatique des coûts de stockage basé sur la durée

### Structure Unique de la Table

La relation entre Stockage et ArticleStockage utilise une table d'association `StockageArticle` avec une clé primaire composée (`stockage_id`, `article_id`) et un attribut supplémentaire pour la quantité.

## Système de Facturation

Le système de facturation permet :
- La génération de factures liées aux prestations ou au stockage
- Le calcul automatique de la TVA
- Le suivi du statut des paiements
- L'historique complet des factures par client

## Structure des Fichiers

```
/
├── app.py                   # Configuration principale de l'application Flask
├── main.py                  # Point d'entrée de l'application
├── models.py                # Définition des modèles de données
├── forms.py                 # Définition des formulaires WTForms
├── auth.py                  # Gestion de l'authentification et des rôles
├── migrations.py            # Gestion des migrations de base de données
├── config.py                # Configurations de l'application
├── routes/                  # Contrôleurs organisés par fonctionnalité
│   ├── auth.py              # Routes d'authentification
│   ├── client.py            # Gestion des clients
│   ├── dashboard.py         # Tableau de bord
│   ├── facture.py           # Gestion des factures
│   ├── prestation.py        # Gestion des prestations de déménagement
│   ├── stockage.py          # Gestion du stockage
│   ├── user.py              # Gestion des utilisateurs
│   └── vehicule.py          # Gestion des véhicules et types de déménagement
├── static/                  # Fichiers statiques (CSS, JS, images)
│   ├── css/
│   ├── js/
│   │   ├── vehicule-suggestions.js  # Gestion des suggestions de véhicules
│   │   └── transporteur-calendrier.js  # Calendrier des transporteurs
│   └── img/
└── templates/               # Templates HTML organisés par module
    ├── auth/
    ├── clients/
    ├── dashboard/
    ├── factures/
    ├── prestations/
    ├── stockages/
    ├── utilisateurs/
    ├── vehicules/
    └── base.html            # Template de base
```

## Recommandations Techniques

1. **Mise à jour des associations** : Pour modifier les associations entre types de déménagement et types de véhicules, utiliser l'interface d'administration ou mettre à jour directement la table `type_demenagement_vehicule`.

2. **Ajout de nouveaux types de véhicules** : Créer le nouveau type via l'interface d'administration, puis l'associer aux types de déménagement appropriés.

3. **Extensibilité** : Pour ajouter de nouvelles fonctionnalités, créer un nouveau module dans `routes/` et les templates correspondants.

4. **Sécurité** : Toujours utiliser le décorateur `@login_required` et `@role_required` pour sécuriser les routes.