# Documentation du Widget Transporteur

## Introduction

Le Widget Transporteur est un composant interactif déplaçable qui permet aux utilisateurs de sélectionner et de gérer des transporteurs lors de la création ou de la modification d'une prestation. Ce widget offre une interface utilisateur intuitive et flexible pour améliorer l'expérience utilisateur dans l'application R-Cavalier.

## Fonctionnalités principales

1. **Interface déplaçable** : Le widget peut être déplacé n'importe où sur l'écran selon les préférences de l'utilisateur.
2. **Sélection multiple** : Permet de sélectionner plusieurs transporteurs pour une prestation.
3. **Vérification de disponibilité** : Vérifie automatiquement la disponibilité des transporteurs en fonction des dates de prestation.
4. **Affichage des transporteurs sélectionnés** : Montre clairement les transporteurs qui ont été choisis.
5. **Bouton flottant** : Un bouton d'accès rapide pour ouvrir/fermer le widget.
6. **Redimensionnement** : Le widget peut être redimensionné pour s'adapter aux besoins de l'utilisateur.

## Architecture technique

Le widget est implémenté en JavaScript pur (vanilla JS) et s'intègre dans les pages de création et de modification de prestations. Il est composé des éléments suivants :

### Fichiers principaux

- `transporteurs-widget-final.js` : Script principal du widget
- `transporteurs-widget.css` : Styles associés au widget

### Structure du code

Le code est organisé selon une architecture modulaire :

```javascript
(function() {
    // Configuration
    const config = {
        draggable: true,        // Widget déplaçable
        resizable: true,        // Widget redimensionnable
        minimizable: true,      // Widget minimisable
        closeButton: true,      // Bouton pour fermer le widget
        saveButton: true,       // Bouton pour sauvegarder la sélection
        defaultPosition: {      // Position par défaut
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)'
        },
        // Autres options de configuration...
    };
    
    // État global du widget
    const state = {
        isOpen: false,
        transporteurs: [],
        selectedTransporteurs: [],
        isLoading: false,
        error: null,
        // Autres états...
    };
    
    // Éléments DOM
    const elements = {
        modal: null,
        content: null,
        closeBtn: null,
        saveBtn: null,
        transporteursList: null,
        selectedDisplay: null,
        floatingBtn: null,
        // Autres éléments DOM...
    };
    
    // Fonctions principales
    
    // Initialisation
    function init() { /* ... */ }
    
    // Création du widget
    function createWidget() { /* ... */ }
    
    // Chargement des transporteurs
    function loadTransporteurs() { /* ... */ }
    
    // Vérification de disponibilité
    function checkDisponibilite() { /* ... */ }
    
    // Autres fonctions...
    
    // Initialisation au chargement de la page
    document.addEventListener('DOMContentLoaded', init);
})();
```

## Fonctionnement détaillé

### Initialisation

1. Le widget s'initialise automatiquement au chargement de la page via l'événement `DOMContentLoaded`.
2. Il crée d'abord un élément `transporteursSelect` s'il n'existe pas déjà.
3. Il nettoie les anciens widgets qui pourraient exister.
4. Il crée les styles nécessaires et le bouton flottant.
5. Après un court délai pour s'assurer que tout est chargé, il crée le widget et initialise les événements.

### Sélection des transporteurs

1. Le widget charge la liste des transporteurs depuis l'API `/api/transporteurs/liste`.
2. L'utilisateur peut sélectionner un ou plusieurs transporteurs dans la liste.
3. Les transporteurs sélectionnés sont affichés dans une section dédiée.
4. La sélection est sauvegardée dans un champ caché `input[name="transporteur_ids"]` au format JSON.

### Vérification de disponibilité

1. Le widget utilise l'API `/api/transporteurs/check-disponibilite` pour vérifier si les transporteurs sélectionnés sont disponibles pour les dates de prestation.
2. Si un transporteur n'est pas disponible, un message d'erreur est affiché.
3. Les transporteurs bientôt disponibles sont également affichés.

### Interaction avec le formulaire

1. Le widget met à jour le champ caché `input[name="transporteur_ids"]` avec les IDs des transporteurs sélectionnés.
2. Il crée également un affichage visuel des transporteurs sélectionnés sur la page.
3. Lors de la soumission du formulaire, les IDs des transporteurs sont envoyés avec les autres données.

## Erreurs communes et solutions

### 1. Élément `transporteursSelect` non trouvé

**Problème** : Le widget essaie d'accéder à un élément avec l'ID `transporteursSelect` qui n'existe pas dans le DOM.

**Solution** : Une fonction `createTransporteursSelectElement()` a été ajoutée pour créer cet élément s'il n'existe pas :

```javascript
function createTransporteursSelectElement() {
    console.log("Vérification de l'élément transporteursSelect...");
    // Vérifier si l'élément existe déjà
    let transporteursSelect = document.getElementById('transporteursSelect');
    
    // S'il n'existe pas, le créer
    if (!transporteursSelect) {
        console.log("Création de l'élément transporteursSelect...");
        transporteursSelect = document.createElement('select');
        transporteursSelect.id = 'transporteursSelect';
        transporteursSelect.name = 'transporteursSelect';
        transporteursSelect.multiple = true;
        transporteursSelect.style.display = 'none'; // Caché visuellement
        
        // Ajouter au formulaire ou au body si pas de formulaire
        const form = document.querySelector('form');
        if (form) {
            form.appendChild(transporteursSelect);
        } else {
            document.body.appendChild(transporteursSelect);
        }
        console.log("Élément transporteursSelect créé avec succès");
    } else {
        console.log("Élément transporteursSelect trouvé");
    }
    
    return transporteursSelect;
}
```

### 2. Erreurs d'API

**Problème** : Les appels API peuvent échouer pour diverses raisons (serveur indisponible, erreurs de réseau, etc.).

**Solution** : Toujours utiliser des blocs try/catch et gérer les erreurs de manière appropriée :

```javascript
async function loadTransporteurs() {
    try {
        state.isLoading = true;
        updateWidgetState();
        
        const response = await fetch('/api/transporteurs/liste');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        state.transporteurs = data.transporteurs || [];
        
        state.isLoading = false;
        state.error = null;
        updateWidgetState();
        
        // Charger les transporteurs déjà sélectionnés
        loadSelectedTransporteurs();
    } catch (error) {
        console.error('Erreur lors du chargement des transporteurs:', error);
        state.isLoading = false;
        state.error = 'Impossible de charger les transporteurs. Veuillez réessayer.';
        updateWidgetState();
    }
}
```

### 3. Problèmes d'affichage des transporteurs sélectionnés

**Problème** : Les transporteurs sélectionnés ne s'affichent pas correctement sur la page.

**Solution** : S'assurer que la fonction `updatePageDisplay()` est appelée après chaque modification de la sélection :

```javascript
function updateTransporteursSelection() {
    // Mettre à jour l'affichage dans le widget
    createSelectedTransporteursDisplay();
    
    // Mettre à jour l'affichage sur la page
    updatePageDisplay();
    
    // Mettre à jour le champ caché
    updateHiddenInput();
}
```

### 4. Conflits avec d'autres widgets

**Problème** : Le widget peut entrer en conflit avec d'autres composants de l'interface.

**Solution** : Utiliser un espace de noms unique et s'assurer que les sélecteurs CSS sont spécifiques :

```javascript
function createStyles() {
    // Vérifier si les styles existent déjà
    if (document.getElementById('transporteurs-widget-styles')) {
        return;
    }
    
    // Créer l'élément style avec un ID unique
    const style = document.createElement('style');
    style.id = 'transporteurs-widget-styles';
    
    // Définir les styles avec des sélecteurs spécifiques
    style.textContent = `
        .transporteurs-widget-modal { /* styles spécifiques */ }
        .transporteurs-widget-content { /* styles spécifiques */ }
        /* Autres styles... */
    `;
    
    // Ajouter au head
    document.head.appendChild(style);
}
```

## Bonnes pratiques

### 1. Toujours vérifier l'existence des éléments DOM

Avant d'accéder à un élément DOM, vérifiez toujours qu'il existe :

```javascript
function someFunction() {
    const element = document.getElementById('someElement');
    if (!element) {
        console.error('Élément someElement non trouvé');
        return; // Sortir de la fonction si l'élément n'existe pas
    }
    
    // Continuer avec l'élément
}
```

### 2. Utiliser des logs de débogage clairs

Ajoutez des logs de débogage clairs pour faciliter le dépannage :

```javascript
console.log("=== WIDGET DÉPLAÇABLE DE TRANSPORTEURS ===");
console.log("Initialisation du widget transporteurs...");
// Autres logs...
```

### 3. Gérer correctement les événements

Assurez-vous de gérer correctement les événements, notamment en évitant les fuites de mémoire :

```javascript
// Ajouter un événement
element.addEventListener('click', handleClick);

// Supprimer l'événement lorsqu'il n'est plus nécessaire
element.removeEventListener('click', handleClick);
```

### 4. Sauvegarder l'état du widget

Sauvegardez l'état du widget (position, taille, etc.) pour améliorer l'expérience utilisateur :

```javascript
function saveWidgetState() {
    // Sauvegarder la position
    const position = {
        top: elements.modal.style.top,
        left: elements.modal.style.left
    };
    
    localStorage.setItem('transporteursWidgetPosition', JSON.stringify(position));
    
    // Sauvegarder d'autres états si nécessaire
}

function loadWidgetState() {
    try {
        const savedPosition = JSON.parse(localStorage.getItem('transporteursWidgetPosition'));
        if (savedPosition && elements.modal) {
            elements.modal.style.top = savedPosition.top;
            elements.modal.style.left = savedPosition.left;
        }
    } catch (e) {
        console.error('Erreur lors du chargement de l\'état du widget:', e);
    }
}
```

## Intégration dans les pages

Pour intégrer le widget dans une page, il suffit d'inclure le script JavaScript :

```html
<script src="{{ url_for('static', filename='js/transporteurs-widget-final.js') }}"></script>
```

Le widget s'initialisera automatiquement et créera tous les éléments nécessaires.

## Personnalisation

Le widget peut être personnalisé en modifiant l'objet `config` au début du script :

```javascript
const config = {
    draggable: true,        // Widget déplaçable
    resizable: true,        // Widget redimensionnable
    minimizable: true,      // Widget minimisable
    closeButton: true,      // Bouton pour fermer le widget
    saveButton: true,       // Bouton pour sauvegarder la sélection
    defaultPosition: {      // Position par défaut
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)'
    },
    // Autres options...
};
```

## Conclusion

Le Widget Transporteur est un composant flexible et puissant qui améliore l'expérience utilisateur lors de la sélection des transporteurs. En suivant les bonnes pratiques et en évitant les erreurs courantes, vous pouvez assurer son bon fonctionnement dans l'application R-Cavalier.

Pour toute question ou problème, veuillez consulter le code source ou contacter l'équipe de développement.
