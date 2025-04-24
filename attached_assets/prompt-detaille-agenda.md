# Prompt pour amélioration du système d'agenda et d'événements

## Contexte de l'application

Je développe une application de gestion de déménagement avec Flask et SQLAlchemy, utilisant une architecture MVC. L'application permet de gérer:
- Des clients
- Des prestations de déménagement
- Des transporteurs
- Du stockage
- De la facturation
- Des agendas et calendriers

## Problème actuel

Dans mon module de gestion d'agendas, plusieurs fonctionnalités ne fonctionnent pas correctement:

1. **Sur la page "Mes Agendas"**:
   - Les agendas sont visibles mais affichent toujours "Aucun événement programmé" même lorsque j'en crée
   - Quand je clique sur "Info" pour voir un agenda dans FullCalendar, aucun événement n'apparaît
   - Les événements ne sont pas associés correctement à leurs agendas respectifs

2. **Fonctionnalités manquantes**:
   - Pas de page dédiée pour gérer spécifiquement les événements d'un agenda
   - Absence de boutons d'action pour modifier/archiver/supprimer les événements
   - Impossible de relier un événement à une prestation existante

## Solution demandée

Je souhaite implémenter les fonctionnalités suivantes:

### 1. Affichage correct des événements dans les cartes d'agenda

Corriger le template `templates/calendrier/agendas.html` pour:
- Charger correctement les événements associés à chaque agenda
- Afficher les 2-3 prochains événements par agenda avec leur date et titre
- Résoudre le problème de relation entre les modèles `Agenda` et `Prestation` ou `Evenement`

### 2. Page dédiée pour chaque agenda

Créer une nouvelle page/template `templates/calendrier/agenda_detail.html` qui:
- Affiche les détails d'un agenda spécifique
- Liste tous les événements associés à cet agenda
- Offre une interface pour gérer ces événements
- Inclut des filtres et une pagination pour les agendas avec beaucoup d'événements

### 3. Gestion complète des événements

Pour chaque événement, ajouter des boutons d'action permettant de:
- Modifier l'événement (modal ou redirection)
- Archiver l'événement (changement de statut)
- Supprimer l'événement (avec confirmation)
- Relier l'événement à une prestation existante ou en créer une nouvelle

### 4. Système de calendrier amélioré

Améliorer FullCalendar pour:
- Filtrer les événements par agenda(s) sélectionné(s)
- Utiliser la couleur de l'agenda pour les événements correspondants
- Permettre l'ajout/modification d'événements directement depuis le calendrier
- Afficher plus de détails au clic sur un événement

## Structure des données

Mes modèles principaux concernés sont:

```python
class Agenda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100))
    type_agenda = db.Column(db.String(50))
    couleur = db.Column(db.String(7))
    observations = db.Column(db.JSON)
    evenements = db.relationship('Prestation', ...) # Cette relation semble problématique
```

```python
class Prestation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # autres champs
    # La relation avec Agenda n'est peut-être pas correctement définie
```

## Routes actuelles

Mes routes principales pour le calendrier sont:

```python
@calendrier_bp.route('/agendas')
def agendas():
    # Liste tous les agendas

@calendrier_bp.route('/api/prestations/calendrier')
def api_prestations_calendrier():
    # Récupère les événements pour FullCalendar
```

## Implémentations demandées

Je souhaite obtenir:

1. **Corrections des modèles** - Définir correctement les relations entre `Agenda`, `Prestation` et éventuellement un modèle `Evenement` intermédiaire si nécessaire

2. **Routes supplémentaires**:
   - `/calendrier/agenda/<int:agenda_id>` - Page détaillée d'un agenda
   - `/calendrier/evenement/add` - Ajout d'événement
   - `/calendrier/evenement/<int:id>/edit` - Modification d'événement
   - `/calendrier/evenement/<int:id>/delete` - Suppression d'événement
   - `/calendrier/evenement/<int:id>/link-prestation` - Liaison à une prestation
   - `/api/calendrier/agenda/<int:agenda_id>/events` - API pour récupérer les événements d'un agenda

3. **Modifications des templates**:
   - `agendas.html` - Pour afficher correctement les événements
   - Nouveau `agenda_detail.html` - Pour la gestion détaillée d'un agenda
   - Améliorations des modals d'événements

4. **JavaScript**:
   - Amélioration de FullCalendar pour la gestion des événements par agenda
   - Fonctions pour les actions sur les événements
   - Filtrage dynamique

## Instructions techniques spécifiques

1. Respecter l'architecture MVC existante
2. Maintenir la cohérence avec le style Bootstrap utilisé
3. S'assurer que les événements sont correctement reliés aux agendas dans la base de données
4. Implémenter la validation des formulaires côté serveur et client
5. Assurer la compatibilité avec la structure de base de données PostgreSQL existante

Merci de me fournir le code complet et structuré pour ces modifications, en vous assurant qu'il s'intègre parfaitement dans mon application existante.
