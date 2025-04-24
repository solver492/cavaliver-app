/**
 * Script dédié à la correction du problème de duplication des options dans les listes déroulantes
 * Résout le problème spécifique où l'option "Sélectionnez un type" apparaît deux fois
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour nettoyer les éléments dupliqués
    function fixSelectDuplicates() {
        // Cibler spécifiquement l'élément problématique (la barre grise qui apparaît en dessous du select)
        const duplicateElements = document.querySelectorAll('.text-bg-secondary');
        if (duplicateElements.length > 0) {
            console.log('Suppression de', duplicateElements.length, 'éléments dupliqués');
            duplicateElements.forEach(el => el.remove());
        }

        // Supprimer également les éléments ajoutés par Bootstrap qui causent la duplication
        const typeSelect = document.getElementById('type_demenagement_id');
        if (typeSelect) {
            // Rechercher les éléments frères qui ne sont pas des éléments légitimes
            const parent = typeSelect.parentElement;
            if (parent) {
                Array.from(parent.children).forEach(child => {
                    // Ne pas supprimer le select lui-même, son label ou les messages d'aide
                    if (child !== typeSelect && 
                        !child.classList.contains('form-label') && 
                        !child.classList.contains('form-text') &&
                        !child.classList.contains('invalid-feedback')) {
                        // Vérifier si c'est un élément ajouté dynamiquement
                        if (child.tagName === 'DIV' && !child.hasAttribute('id')) {
                            console.log('Suppression d\'un élément dynamique ajouté:', child);
                            child.remove();
                        }
                    }
                });
            }
        }
    }

    // Exécuter immédiatement au chargement de la page
    fixSelectDuplicates();
    
    // Exécuter également après un court délai pour s'assurer que tous les éléments dynamiques sont chargés
    setTimeout(fixSelectDuplicates, 100);
    
    // Et une dernière fois après que tout soit complètement chargé
    window.addEventListener('load', fixSelectDuplicates);
    
    // Surcharger la méthode native de selection pour empêcher la duplication
    const selectElement = document.getElementById('type_demenagement_id');
    if (selectElement) {
        // Observer les changements dans le DOM autour du select
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Un nouvel élément a été ajouté, vérifier s'il s'agit d'une duplication
                    fixSelectDuplicates();
                }
            });
        });
        
        // Observer le parent du select pour détecter les ajouts d'éléments
        observer.observe(selectElement.parentElement, { childList: true, subtree: true });
        
        // Empêcher l'ajout de styles personnalisés au select
        selectElement.classList.add('no-custom-select');
        selectElement.style.appearance = 'auto';
        selectElement.style.webkitAppearance = 'auto';
        selectElement.style.mozAppearance = 'auto';
        
        // Ajouter des styles inline pour s'assurer que le select natif est visible
        selectElement.style.opacity = '1';
        selectElement.style.position = 'static';
    }
});
