# Documentation de la Base de Données

## Vue d'ensemble

La base de données PostgreSQL de l'application de gestion de déménagement est composée de plusieurs tables interconnectées pour gérer les clients, les prestations, les factures, le stockage, les transporteurs et les véhicules. Ce document détaille chaque table, ses champs et ses relations.

## Schéma des Tables

### 1. Table `user`
Gère les utilisateurs du système avec différents rôles.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| nom | String(64) | Nom de famille | Non null |
| prenom | String(64) | Prénom | Non null |
| username | String(64) | Nom d'utilisateur | Unique, Non null |
| email | String(120) | Adresse email | Unique |
| password_hash | String(256) | Mot de passe haché | Non null |
| role | String(20) | Rôle de l'utilisateur (transporteur, commercial, admin, super_admin) | Non null, Défaut: 'transporteur' |
| statut | String(20) | Statut du compte (actif, inactif) | Non null, Défaut: 'actif' |
| vehicule | String(100) | Description du véhicule (pour les transporteurs) | |
| type_vehicule_id | Integer | Référence au type de véhicule | Clé étrangère -> type_vehicule.id |
| permis_conduire | String(50) | Numéro de permis de conduire | |
| notes | Text | Notes supplémentaires | |
| derniere_connexion | DateTime | Date et heure de dernière connexion | |
| date_creation | DateTime | Date et heure de création du compte | Non null, Défaut: now() |

**Relations:**
- Un utilisateur peut avoir un type de véhicule (type_vehicule_id -> type_vehicule.id)
- Un utilisateur peut être transporteur pour plusieurs prestations (via prestation_transporteurs)
- Un utilisateur (commercial) peut créer plusieurs prestations (foreign_key: prestation.commercial_id)

### 2. Table `client`
Stocke les informations des clients.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| nom | String(64) | Nom de famille | Non null |
| prenom | String(64) | Prénom | Non null |
| adresse | Text | Adresse postale | |
| telephone | String(20) | Numéro de téléphone | |
| email | String(120) | Adresse email | |
| type_client | String(50) | Type de client (particulier, entreprise, etc.) | |
| tags | String(200) | Tags pour catégoriser le client | |
| archive | Boolean | Indique si le client est archivé | Défaut: false |
| date_creation | DateTime | Date et heure de création du client | Non null, Défaut: now() |

**Relations:**
- Un client peut avoir plusieurs prestations (One-to-Many: client.id -> prestation.client_id)
- Un client peut avoir plusieurs factures (One-to-Many: client.id -> facture.client_id)
- Un client peut avoir plusieurs stockages (One-to-Many: client.id -> stockage.client_id)
- Un client peut avoir plusieurs documents (One-to-Many: client.id -> document.client_id)

### 3. Table `document`
Stocke les documents associés aux clients.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| nom | String(255) | Nom du document | Non null |
| chemin | String(255) | Chemin du fichier | Non null |
| type | String(50) | Type de document | |
| date_upload | DateTime | Date et heure d'upload | Non null, Défaut: now() |
| client_id | Integer | Client associé | Clé étrangère -> client.id, Non null |

**Relations:**
- Un document appartient à un client (Many-to-One: document.client_id -> client.id)

### 4. Table `type_vehicule`
Définit les différents types de véhicules disponibles.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| nom | String(100) | Nom du type de véhicule | Non null, Unique |
| description | Text | Description détaillée | |
| capacite | String(50) | Capacité du véhicule (m³) | |
| date_creation | DateTime | Date et heure de création | Non null, Défaut: now() |

**Relations:**
- Un type de véhicule peut être associé à plusieurs transporteurs (One-to-Many: type_vehicule.id -> user.type_vehicule_id)
- Un type de véhicule peut être associé à plusieurs types de déménagement (Many-to-Many via type_demenagement_vehicule)

### 5. Table `type_demenagement`
Définit les différents types de services de déménagement.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| nom | String(100) | Nom du type de déménagement | Non null, Unique |
| description | Text | Description détaillée | |
| date_creation | DateTime | Date et heure de création | Non null, Défaut: now() |

**Relations:**
- Un type de déménagement peut être associé à plusieurs types de véhicules (Many-to-Many via type_demenagement_vehicule)
- Un type de déménagement peut être utilisé pour plusieurs prestations (One-to-Many: type_demenagement.id -> prestation.type_demenagement_id)

### 6. Table `type_demenagement_vehicule`
Table d'association entre types de déménagement et types de véhicules.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| type_demenagement_id | Integer | Type de déménagement | Clé étrangère -> type_demenagement.id, Partie de clé primaire |
| type_vehicule_id | Integer | Type de véhicule | Clé étrangère -> type_vehicule.id, Partie de clé primaire |

**Relations:**
- Associe les types de déménagement aux types de véhicules appropriés (Many-to-Many)

### 7. Table `prestation`
Stocke les informations sur les prestations de déménagement.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| client_id | Integer | Client concerné | Clé étrangère -> client.id, Non null |
| commercial_id | Integer | Commercial qui a créé la prestation | Clé étrangère -> user.id |
| date_debut | DateTime | Date et heure de début | Non null |
| date_fin | DateTime | Date et heure de fin | Non null |
| adresse_depart | Text | Adresse de départ | Non null |
| adresse_arrivee | Text | Adresse d'arrivée | Non null |
| type_demenagement_id | Integer | Type de déménagement | Clé étrangère -> type_demenagement.id |
| type_demenagement | String(100) | Type de déménagement (texte) | Non null |
| tags | String(200) | Tags pour catégoriser la prestation | |
| societe | String(200) | Société concernée | |
| montant | Float | Montant de la prestation | |
| priorite | String(50) | Priorité (Normale, Haute, Urgente) | Défaut: 'Normale' |
| statut | String(50) | Statut (En attente, Confirmée, En cours, Terminée, Annulée) | Défaut: 'En attente' |
| observations | Text | Observations supplémentaires | |
| archive | Boolean | Indique si la prestation est archivée | Défaut: false |
| stockage_id | Integer | Stockage associé | Clé étrangère -> stockage.id |
| date_creation | DateTime | Date et heure de création | Non null, Défaut: now() |

**Relations:**
- Une prestation appartient à un client (Many-to-One: prestation.client_id -> client.id)
- Une prestation est créée par un commercial (Many-to-One: prestation.commercial_id -> user.id)
- Une prestation peut avoir plusieurs transporteurs (Many-to-Many via prestation_transporteurs)
- Une prestation peut avoir un type de déménagement (Many-to-One: prestation.type_demenagement_id -> type_demenagement.id)
- Une prestation peut avoir plusieurs factures (One-to-Many: prestation.id -> facture.prestation_id)
- Une prestation peut être associée à un stockage (Many-to-One: prestation.stockage_id -> stockage.id)

### 8. Table `prestation_transporteurs`
Table d'association entre prestations et transporteurs.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| prestation_id | Integer | Prestation | Clé étrangère -> prestation.id, Partie de clé primaire |
| user_id | Integer | Transporteur (utilisateur) | Clé étrangère -> user.id, Partie de clé primaire |

**Relations:**
- Associe les prestations aux transporteurs qui les exécutent (Many-to-Many)

### 9. Table `facture`
Stocke les informations sur les factures.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| numero | String(50) | Numéro de facture | Non null, Unique |
| client_id | Integer | Client concerné | Clé étrangère -> client.id, Non null |
| prestation_id | Integer | Prestation facturée | Clé étrangère -> prestation.id |
| stockage_id | Integer | Stockage facturé | Clé étrangère -> stockage.id |
| montant_ht | Float | Montant hors taxes | Non null |
| taux_tva | Float | Taux de TVA (%) | Non null, Défaut: 20.0 |
| montant_ttc | Float | Montant TTC | Non null |
| date_emission | DateTime | Date d'émission | Non null |
| date_echeance | DateTime | Date d'échéance | Non null |
| mode_paiement | String(50) | Mode de paiement (Espèces, Chèque, etc.) | |
| statut | String(50) | Statut (En attente, Payée, Retard, Annulée) | Défaut: 'En attente' |
| notes | Text | Notes supplémentaires | |
| date_creation | DateTime | Date et heure de création | Non null, Défaut: now() |

**Relations:**
- Une facture appartient à un client (Many-to-One: facture.client_id -> client.id)
- Une facture peut être liée à une prestation (Many-to-One: facture.prestation_id -> prestation.id)
- Une facture peut être liée à un stockage (Many-to-One: facture.stockage_id -> stockage.id)

### 10. Table `stockage`
Gère les services de stockage.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| client_id | Integer | Client concerné | Clé étrangère -> client.id, Non null |
| reference | String(50) | Référence unique | Non null, Unique |
| date_debut | DateTime | Date de début du stockage | Non null, Défaut: now() |
| date_fin | DateTime | Date de fin du stockage (facultative) | |
| statut | String(50) | Statut (Actif, Terminé, En attente) | Défaut: 'Actif' |
| montant_mensuel | Float | Coût mensuel | Non null |
| caution | Float | Montant de la caution | |
| emplacement | String(100) | Localisation précise | Non null |
| volume_total | Float | Volume total en m³ | |
| poids_total | Float | Poids total en kg | |
| observations | Text | Observations supplémentaires | |
| archive | Boolean | Indique si le stockage est archivé | Défaut: false |
| date_creation | DateTime | Date et heure de création | Non null, Défaut: now() |

**Relations:**
- Un stockage appartient à un client (Many-to-One: stockage.client_id -> client.id)
- Un stockage peut avoir plusieurs factures (One-to-Many: stockage.id -> facture.stockage_id)
- Un stockage peut être lié à plusieurs prestations (One-to-Many: stockage.id -> prestation.stockage_id)
- Un stockage peut contenir plusieurs articles (Many-to-Many via stockage_article)

### 11. Table `article_stockage`
Définit les articles pouvant être stockés.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| id | Integer | Identifiant unique | Clé primaire |
| nom | String(100) | Nom de l'article | Non null |
| description | Text | Description détaillée | |
| categorie | String(50) | Catégorie (Meubles, Cartons, etc.) | |
| dimensions | String(100) | Dimensions (LxlxH en cm) | |
| volume | Float | Volume en m³ | |
| poids | Float | Poids en kg | |
| valeur_declaree | Float | Valeur déclarée pour l'assurance | |
| code_barre | String(100) | Code barre pour le suivi | |
| photo | String(255) | Chemin vers la photo | |
| fragile | Boolean | Indique si l'article est fragile | Défaut: false |
| date_creation | DateTime | Date et heure de création | Non null, Défaut: now() |

**Relations:**
- Un article peut être stocké dans plusieurs emplacements (Many-to-Many via stockage_article)

### 12. Table `stockage_article`
Table d'association entre stockages et articles avec quantité.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| stockage_id | Integer | Stockage | Clé étrangère -> stockage.id, Partie de clé primaire |
| article_id | Integer | Article stocké | Clé étrangère -> article_stockage.id, Partie de clé primaire |
| quantite | Integer | Quantité d'articles | Défaut: 1 |
| date_ajout | DateTime | Date et heure d'ajout | Non null, Défaut: now() |

**Relations:**
- Associe les stockages aux articles qu'ils contiennent, avec une quantité (Many-to-Many)

## Associations Spécifiques entre Types de Déménagement et Véhicules

Les associations suivantes ont été configurées dans la base de données pour optimiser les recommandations de véhicules :

### Déménagement Résidentiel (jusqu'à 100m²)
- Fourgon ou Camionnette (8 à 16 m³)
- Petit Camion (20 à 23 m³)

### Déménagement Commercial
- Camion Poids Lourd 5T (30 à 40 m³)
- Camion Poids Lourd 10T (50 m³)

### Transport de marchandises
- Semi-remorque (jusqu'à 100 m³)

### Stockage
- Petit Camion (20 à 23 m³)
- Camion Poids Lourd 5T (30 à 40 m³)
- Camion Poids Lourd 10T (50 m³)

## Requêtes SQL Utiles

### Vérifier les Associations entre Types de Déménagement et Véhicules
```sql
SELECT td.nom as "Type de déménagement", tv.nom as "Type de véhicule", tv.capacite
FROM type_demenagement_vehicule tdv
JOIN type_demenagement td ON tdv.type_demenagement_id = td.id
JOIN type_vehicule tv ON tdv.type_vehicule_id = tv.id
ORDER BY td.id, tv.id;
```

### Rechercher les Transporteurs avec Véhicules Appropriés
```sql
SELECT u.id, u.nom, u.prenom, tv.nom as type_vehicule, tv.capacite
FROM "user" u
JOIN type_vehicule tv ON u.type_vehicule_id = tv.id
JOIN type_demenagement_vehicule tdv ON tv.id = tdv.type_vehicule_id
WHERE tdv.type_demenagement_id = ? -- ID du type de déménagement
AND u.role = 'transporteur'
AND u.statut = 'actif';
```

### Trouver les Prestations par Période
```sql
SELECT p.id, c.nom as client_nom, p.adresse_depart, p.adresse_arrivee, p.date_debut, p.statut
FROM prestation p
JOIN client c ON p.client_id = c.id
WHERE p.date_debut BETWEEN ? AND ?
ORDER BY p.date_debut;
```

### Calculer le Chiffre d'Affaires Mensuel
```sql
SELECT 
    EXTRACT(YEAR FROM date_emission) as annee,
    EXTRACT(MONTH FROM date_emission) as mois,
    SUM(montant_ht) as ca_ht,
    SUM(montant_ttc) as ca_ttc
FROM facture
WHERE statut = 'Payée'
GROUP BY annee, mois
ORDER BY annee DESC, mois DESC;
```

## Conseils pour la Maintenance de la Base de Données

1. **Indexation** : Les champs fréquemment utilisés dans les recherches et les jointures sont indexés pour optimiser les performances.

2. **Mise à jour des associations** : Pour modifier les associations entre types de déménagement et types de véhicules, mettre à jour la table `type_demenagement_vehicule`.

3. **Intégrité référentielle** : Les contraintes de clés étrangères garantissent l'intégrité des données en empêchant la suppression d'enregistrements référencés.

4. **Archivage** : Utiliser les champs `archive` pour masquer les enregistrements obsolètes plutôt que de les supprimer, préservant ainsi l'historique et l'intégrité des données.

5. **Sauvegarde** : Effectuer des sauvegardes régulières de la base de données pour prévenir la perte de données.