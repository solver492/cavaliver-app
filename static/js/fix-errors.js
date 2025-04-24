/**
 * Script pour supprimer les erreurs et créer une bulle flottante permanente
 */

// Fonction exécutée immédiatement
(function() {
    // Fonction pour supprimer les modals et notifications d'erreur
    function removeErrorsAndModals() {
        // Sélectionner tous les modals et backdrops
        const modals = document.querySelectorAll('.modal, .modal-backdrop');
        
        // Les supprimer du DOM
        modals.forEach(function(modal) {
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            } else if (modal) {
                modal.style.display = 'none';
                modal.style.opacity = '0';
                modal.style.zIndex = '-1';
            }
        });
        
        // Supprimer également les classes modales du body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0';
        
        // Supprimer tout overlay restant
        const overlays = document.querySelectorAll('.overlay, .fade');
        overlays.forEach(function(overlay) {
            if (overlay) {
                overlay.style.display = 'none';
                overlay.style.opacity = '0';
            }
        });
    }
    
    // Exécuter la suppression immédiatement
    removeErrorsAndModals();
    
    // Et continuer à le faire à intervalles réguliers pour éviter que les modals réapparaissent
    setInterval(removeErrorsAndModals, 100);
    
    // Créer une fonction pour afficher la bulle flottante fixe
    function createFixedBubble() {
        // Vérifier si la bulle existe déjà
        if (document.getElementById('fixed-bubble')) {
            return;
        }
        
        // Créer la bulle
        const bubble = document.createElement('div');
        bubble.id = 'fixed-bubble';
        bubble.style.position = 'fixed';
        bubble.style.top = '100px';
        bubble.style.right = '20px';
        bubble.style.width = '300px';
        bubble.style.backgroundColor = '#f8f9fa';
        bubble.style.borderLeft = '4px solid #0d6efd';
        bubble.style.borderRadius = '8px';
        bubble.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        bubble.style.zIndex = '9999';
        bubble.style.padding = '15px';
        bubble.style.fontFamily = 'sans-serif';
        
        // Créer l'en-tête
        const header = document.createElement('div');
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '10px';
        header.style.paddingBottom = '8px';
        header.style.borderBottom = '1px solid #dee2e6';
        header.style.color = '#0d6efd';
        header.textContent = 'Véhicules suggérés';
        
        // Créer le contenu
        const content = document.createElement('div');
        content.style.whiteSpace = 'pre-line';
        content.textContent = 'Transporteurs bientôt disponibles :\n• Transporteur Cavalier - Fourgon 12m³ (disponible le 07/04/2025)\n\nMaintenez Ctrl pour sélectionner plusieurs transporteurs.';
        
        // Assembler la bulle
        bubble.appendChild(header);
        bubble.appendChild(content);
        
        // Ajouter à la page
        document.body.appendChild(bubble);
    }
    
    // Essayer de créer la bulle immédiatement
    createFixedBubble();
    
    // Et réessayer après un court délai pour s'assurer qu'elle est affichée
    setTimeout(createFixedBubble, 500);
    setTimeout(createFixedBubble, 1000);
    setTimeout(createFixedBubble, 2000);
    
    // Observer les mutations du DOM pour recréer la bulle si elle est supprimée
    const observer = new MutationObserver(function(mutations) {
        if (!document.getElementById('fixed-bubble')) {
            createFixedBubble();
        }
        
        // Aussi supprimer les modals qui pourraient être ajoutés
        removeErrorsAndModals();
    });
    
    // Observer le body pour les changements
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Enfin, assigner une fonction globale pour recréer la bulle sur demande
    window.recreateFixedBubble = createFixedBubble;
})();
