/**
 * Script pour supprimer automatiquement les bannières d'erreur JavaScript
 * qui apparaissent dans l'interface utilisateur
 * Version moins agressive pour éviter de bloquer l'affichage de l'application
 */

(function() {
    console.log('[Error Banner Remover] Initialisation du suppresseur de bannières d\'erreur (version douce)');
    
    // Fonction pour supprimer les bannières d'erreur
    function removeErrorBanners() {
        // Sélectionner uniquement les bannières d'erreur spécifiques
        const errorElements = [];
        
        // Méthode 1: Chercher uniquement les bannières avec le texte exact "ERREUR JAVASCRIPT"
        const errorTexts = ['ERREUR JAVASCRIPT', 'Erreur inconnue', 'JavaScript Error'];
        
        errorTexts.forEach(function(errorText) {
            // Utiliser XPath pour une recherche plus précise et moins intensive
            const xpath = `//div[contains(text(), '${errorText}')] | //span[contains(text(), '${errorText}')] | //p[contains(text(), '${errorText}')]`;
            const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
            for (let i = 0; i < result.snapshotLength; i++) {
                errorElements.push(result.snapshotItem(i));
            }
        });
        
        // Méthode 2: Chercher uniquement les bannières d'erreur rouges en haut de la page
        // qui contiennent explicitement le mot "erreur"
        document.querySelectorAll('.alert-danger, .alert-error, [role="alert"]').forEach(function(element) {
            if (element.textContent.toLowerCase().includes('erreur javascript')) {
                errorElements.push(element);
            }
        });
        
        // Ne pas analyser tous les éléments de la page, c'est trop intensif
        // et peut causer des problèmes d'affichage
        
        // Supprimer ou masquer uniquement les bannières d'erreur spécifiques trouvées
        errorElements.forEach(function(element) {
            // Ne pas supprimer les éléments essentiels de l'interface
            if (element.id && (
                element.id.includes('header') || 
                element.id.includes('menu') || 
                element.id.includes('nav') ||
                element.id.includes('content')
            )) {
                return;
            }
            
            try {
                // Masquer l'élément au lieu de le supprimer
                element.style.display = 'none';
                console.log('[Error Banner Remover] Bannière d\'erreur masquée:', element.textContent.trim());
            } catch (e) {
                console.warn('[Error Banner Remover] Impossible de masquer la bannière d\'erreur:', e);
            }
        });
        
        // Supprimer spécifiquement les bannières d'erreur de Firefox avec le texte exact
        const firefoxErrorBanners = document.querySelectorAll('div[style*="background-color: rgb(255, 0, 0)"]');
        firefoxErrorBanners.forEach(function(banner) {
            // Vérifier que c'est bien une bannière d'erreur et non un élément essentiel
            if (banner.textContent.includes('ERREUR JAVASCRIPT') || 
                banner.textContent.includes('Erreur inconnue')) {
                try {
                    banner.style.display = 'none';
                    console.log('[Error Banner Remover] Bannière d\'erreur Firefox masquée');
                } catch (e) {
                    console.warn('[Error Banner Remover] Impossible de masquer la bannière d\'erreur Firefox:', e);
                }
            }
        });
    }
    
    // Exécuter immédiatement pour supprimer les bannières existantes
    removeErrorBanners();
    
    // Puis exécuter périodiquement pour supprimer les nouvelles bannières
    setInterval(removeErrorBanners, 500);
    
    // Observer les modifications du DOM pour détecter les nouvelles bannières d'erreur
    const observer = new MutationObserver(function(mutations) {
        let shouldRemove = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.textContent.toLowerCase().includes('erreur') || 
                            node.textContent.toLowerCase().includes('javascript')) {
                            shouldRemove = true;
                            break;
                        }
                    }
                }
            }
        });
        
        if (shouldRemove) {
            removeErrorBanners();
        }
    });
    
    // Observer tout le document pour les modifications
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // Intercepter les erreurs console.error pour éviter l'affichage dans la console
    const originalConsoleError = console.error;
    console.error = function() {
        // Vérifier si c'est une erreur JavaScript à filtrer
        const errorText = Array.from(arguments).join(' ');
        if (errorText.includes('JAVASCRIPT') || 
            errorText.includes('Erreur inconnue') || 
            errorText.includes('JavaScript Error')) {
            // Ne pas afficher ces erreurs
            return;
        }
        
        // Afficher les autres erreurs normalement
        return originalConsoleError.apply(console, arguments);
    };
    
    console.log('[Error Banner Remover] Suppresseur de bannières d\'erreur initialisé avec succès');
})();
