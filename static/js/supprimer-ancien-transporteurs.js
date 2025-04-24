/**
 * Script pour supprimer radicalement l'ancien affichage du sélecteur de transporteurs
 * et s'assurer que seule la nouvelle version est active
 */

(function() {
    console.log("Suppression de l'ancien affichage des transporteurs...");
    
    // Fonction pour nettoyer l'interface
    function nettoyerInterface() {
        // Liste des sélecteurs à supprimer (éléments de l'ancienne interface)
        const selecteursASupprimer = [
            '.old-transporteur-widget', 
            '.widget-transport-module:not(:first-child)',
            '#transporteur-counter',
            '#transporteurs-selectionnes-input',
            '.selected-transporteurs-count',
            '#valider-transporteurs'
        ];
        
        // Supprimer tous les éléments correspondants
        selecteursASupprimer.forEach(selecteur => {
            const elements = document.querySelectorAll(selecteur);
            if (elements.length > 0) {
                console.log(`Suppression de ${elements.length} élément(s) correspondant à "${selecteur}"`);
                elements.forEach(el => el.remove());
            }
        });
        
        // S'assurer qu'il n'y a qu'un seul widget de transport
        const widgets = document.querySelectorAll('.transporteur-widget-container');
        if (widgets.length > 1) {
            console.log(`Suppression de ${widgets.length - 1} widget(s) de transport en double`);
            for (let i = 1; i < widgets.length; i++) {
                widgets[i].remove();
            }
        }
        
        // S'assurer qu'il n'y a qu'un seul élément select pour les transporteurs
        const selects = document.querySelectorAll('select#transporteurs');
        if (selects.length > 1) {
            console.log(`Suppression de ${selects.length - 1} select(s) de transporteurs en double`);
            for (let i = 1; i < selects.length; i++) {
                selects[i].remove();
            }
        }
        
        // Corriger les classes des éléments restants
        const counter = document.querySelector('.transporteurs-counter');
        if (counter) {
            counter.className = 'transporteurs-counter text-primary fw-bold';
        }
    }
    
    // Exécuter immédiatement après le chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM chargé, nettoyage de l'interface...");
        nettoyerInterface();
        
        // Exécuter à nouveau après un délai pour s'assurer que tous les scripts ont été exécutés
        setTimeout(nettoyerInterface, 500);
    });
    
    // Observer les changements dans le DOM pour supprimer les éléments qui pourraient être ajoutés dynamiquement
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Si de nouveaux éléments ont été ajoutés, vérifier et nettoyer
                nettoyerInterface();
            }
        });
    });
    
    // Commencer à observer le document avec la configuration spécifiée
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Exécuter toutes les secondes pour plus de sécurité
    setInterval(nettoyerInterface, 1000);
    
    // Exécuter immédiatement si le DOM est déjà chargé
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        nettoyerInterface();
    }
})();
