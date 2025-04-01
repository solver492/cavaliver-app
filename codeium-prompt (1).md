# Mise à jour de l'application de gestion de transport/déménagement

## Objectifs principaux
L'application nécessite les améliorations suivantes avec une attention particulière sur la flexibilité et la personnalisation :

### 1. Gestion des Plannings
- Possibilité de créer plusieurs plannings avec des noms personnalisés
- Chaque planning doit pouvoir être nommé et identifié individuellement
- Fonctionnalité pour agrandir un planning en plein écran pour une meilleure visibilité

### 2. Personnalisation des Fiches de Contact
- Système de création de champs personnalisés par l'administrateur
- Types de champs à supporter :
  - Champs texte libre
  - Champs numériques
  - Menus déroulants
  - Champs à choix binaire (Oui/Non)
  - Champs d'observation
- Seul le super administrateur peut créer ces champs personnalisés
- Les champs personnalisés doivent s'intégrer dynamiquement dans le tableau de contacts

### 3. Personnalisation des Fiches de Prestation
- Système similaire de création de champs personnalisés
- Possibilité de créer des champs type devis/facture
- Capacité d'ajouter des champs comme quantité totale
- Option d'impression des prestations sous forme de tableau récapitulatif

### 4. Gestion des Administrateurs
- Possibilité de créer des administrateurs avec des niveaux de permissions différenciés
- Le super administrateur garde un contrôle total sur la création et la configuration des comptes

### 5. Gestion de Documents
- Module de stockage de documents légers (PDF, fichiers texte)
- Possibilité d'attacher des documents à une fiche contact
- Système de gestion documentaire simple et intuitif

## Contraintes de Développement
- Le super administrateur (développeur) doit toujours garder un contrôle technique
- L'administrateur client doit avoir des droits limités, le rendant dépendant de l'équipe de développement pour certaines actions avancées

## Sécurité et Permissions
- Mise en place de plusieurs niveaux de permissions
- Super administrateur : droits complets, création de structures
- Administrateur client : droits limités, personnalisation contrôlée

## Technologies
- Conserver l'architecture PHP/MySQL existante
- Interface responsive
- Développement modulaire permettant des extensions futures

## Livrables attendus
- Code source des nouvelles fonctionnalités
- Documentation technique des modifications
- Script de mise à jour de la base de données
- Guide de migration et d'utilisation des nouvelles fonctionnalités

## Points d'attention
- Garder une interface utilisateur simple et intuitive
- Permettre la personnalisation sans complexifier l'utilisation
- Assurer la traçabilité des modifications

## Recommandations supplémentaires
- Prévoir une phase de tests approfondis
- Documenter précisément chaque nouvelle fonctionnalité
- Assurer la compatibilité avec les versions existantes de l'application
