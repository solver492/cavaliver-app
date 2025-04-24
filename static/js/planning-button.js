/**
 * Script indépendant pour ajouter un bouton "Ajouter Planning" 
 * dans la vue planning du calendrier
 */

// Exécuter immédiatement
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du bouton d'ajout de planning...");
    
    // Exécuter immédiatement et réessayer plusieurs fois
    addPlanningButton();
    setTimeout(addPlanningButton, 500);
    setTimeout(addPlanningButton, 1000);
    setTimeout(addPlanningButton, 2000);
});

/**
 * Ajoute le bouton "Ajouter Planning" directement après les onglets de vue
 */
function addPlanningButton() {
    // Si on est déjà dans la vue planning ou si on clique sur l'onglet Planning
    const planningTab = document.querySelector('.fc-listMonth-button, button:contains("Planning")');
    if (planningTab) {
        // Vérifier si le bouton existe déjà
        if (document.getElementById('add-planning-button')) {
            return;
        }
        
        // Créer le bouton
        const button = document.createElement('button');
        button.id = 'add-planning-button';
        button.className = 'btn btn-primary';
        button.innerHTML = '<i class="fas fa-plus me-1"></i> Ajouter Planning';
        button.style.marginLeft = '10px';
        
        // Ajouter l'événement pour ouvrir le modal
        button.addEventListener('click', function() {
            const modal = document.getElementById('planning-modal');
            if (modal) {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        });
        
        // Trouver l'endroit où insérer le bouton (après les boutons de vue)
        const toolbar = document.querySelector('.fc-header-toolbar');
        if (toolbar) {
            const rightSection = toolbar.querySelector('.fc-toolbar-chunk:last-child');
            if (rightSection) {
                rightSection.appendChild(button);
                console.log("Bouton 'Ajouter Planning' ajouté avec succès");
            }
        }
    }
}

// Patch pour jQuery :contains sans dépendance jQuery
if (!window.jQuery) {
    // Ajout de la fonctionnalité :contains pour querySelector
    document.querySelectorAll = document.querySelectorAll || function(selector) {
        if (selector.includes(':contains(')) {
            const containsText = selector.match(/:contains\(["'](.*?)["']\)/)[1];
            const newSelector = selector.replace(/:contains\(["'].*?["']\)/, '');
            
            const elements = Array.from(document.querySelectorAll(newSelector || '*'));
            return elements.filter(el => el.textContent.includes(containsText));
        }
        return document.querySelectorAll(selector);
    };
}
