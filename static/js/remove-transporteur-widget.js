/**
 * Script pour supprimer définitivement l'élément div des transporteurs
 */
(function() {
    'use strict';
    
    // Fonction de journalisation
    function log(message) {
        if (window.console && window.console.log) {
            console.log('[Suppression Transporteur] ' + message);
        }
    }
    
    // Fonction principale pour supprimer l'élément
    function removeTransporteurWidget() {
        try {
            log('Tentative de suppression du widget des transporteurs...');
            
            // Sélectionner l'élément div parent avec la classe col-md-12
            const transporteurDiv = document.querySelector('.col-md-12[data-component-name="<div />"] .card');
            
            if (transporteurDiv) {
                // Remonter jusqu'au parent col-md-12
                const parentDiv = transporteurDiv.closest('.col-md-12');
                
                if (parentDiv) {
                    // Supprimer l'élément parent
                    parentDiv.remove();
                    log('Élément div des transporteurs supprimé avec succès');
                } else {
                    log('Parent div col-md-12 non trouvé');
                }
            } else {
                // Essayer une autre méthode si la première ne fonctionne pas
                log('Tentative alternative de suppression...');
                const allCards = document.querySelectorAll('.card');
                let removed = false;
                
                for (const card of allCards) {
                    const header = card.querySelector('.card-header');
                    if (header && header.textContent.includes('Transporteurs')) {
                        const parentDiv = card.closest('.col-md-12');
                        if (parentDiv) {
                            parentDiv.remove();
                            log('Élément div des transporteurs supprimé via méthode alternative');
                            removed = true;
                            break;
                        }
                    }
                }
                
                if (!removed) {
                    log('Aucun élément correspondant trouvé');
                }
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du div des transporteurs:', error);
        }
    }
    
    // Exécuter la suppression au chargement de la page
    document.addEventListener('DOMContentLoaded', function() {
        log('Initialisation de la suppression...');
        removeTransporteurWidget();
    });
    
    // Exécuter également si le DOM est déjà chargé
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(removeTransporteurWidget, 100);
    }
})();
