/**
 * Script pour supprimer RADICALEMENT les bulles non désirées
 * Solution agressive avec plusieurs méthodes combinées
 */

// Exécution immédiate pour supprimer les bulles dès que possible
(function() {
    console.log("Suppression RADICALE des bulles activée");
    
    // Exécuter la suppression immédiatement
    supprimerBullesRadicalement();
    
    // Fonction primaire de suppression radicale
    function supprimerBullesRadicalement() {
        console.log("Suppression radicale en cours...");
        
        // 1. Suppression directe par ID
        const bulleElement = document.getElementById('vehicules-suggeres-bubble');
        if (bulleElement) {
            console.log("Suppression directe de la bulle");
            try {
                // Essayer plusieurs méthodes pour garantir la suppression
                bulleElement.parentNode.removeChild(bulleElement); // Méthode 1
            } catch (e) {
                try {
                    bulleElement.remove(); // Méthode 2
                } catch (e2) {
                    // Méthode 3: Vider le contenu et cacher
                    bulleElement.innerHTML = '';
                    bulleElement.style.display = 'none';
                    bulleElement.style.visibility = 'hidden';
                    bulleElement.style.opacity = '0';
                    bulleElement.style.width = '0';
                    bulleElement.style.height = '0';
                    bulleElement.style.overflow = 'hidden';
                }
            }
        }
        
        // 2. Suppression par sélecteur CSS (plus large)
        document.querySelectorAll('.floating-bubble, [id*="vehicules-suggeres"], [id*="transporteurs-suggere"]').forEach(element => {
            try {
                console.log("Suppression d'élément par sélecteur:", element.id || element.className);
                element.remove();
            } catch (e) {
                // Méthode alternative: Vider et cacher
                element.innerHTML = '';
                element.style.display = 'none';
            }
        });
    }
    
    // Exécuter la suppression répétée pour attraper les éléments ajoutés dynamiquement
    const intervalIds = [];
    
    // Suppression à haute fréquence pendant 5 secondes
    for (let i = 1; i <= 20; i++) {
        const timeoutId = setTimeout(supprimerBullesRadicalement, i * 250); // Toutes les 250ms
        intervalIds.push(timeoutId);
    }
    
    // Suppression à moyenne fréquence pendant 30 secondes
    for (let i = 1; i <= 10; i++) {
        const timeoutId = setTimeout(supprimerBullesRadicalement, 5000 + i * 2500); // Toutes les 2.5s après les 5 premières secondes
        intervalIds.push(timeoutId);
    }
    
    // Surveillance continue
    const observerId = setInterval(supprimerBullesRadicalement, 5000); // Continuer à vérifier toutes les 5 secondes
    intervalIds.push(observerId);
    
    // Ajouter un observateur de mutations pour détecter les ajouts dynamiques
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                supprimerBullesRadicalement();
            }
        });
    });
    
    // Commencer à observer le corps du document
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Créer et injecter une règle CSS pour masquer les éléments (solution de secours)
    const style = document.createElement('style');
    style.textContent = `
        #vehicules-suggeres-bubble, 
        .floating-bubble, 
        [id*="vehicules-suggeres"],
        [id*="transporteurs-suggere"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
            z-index: -9999 !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);
})();
