/**
 * Script pour adapter les fonctionnalités qui cherchent les anciens boutons radio
 * au nouveau système d'interrupteur à bascule pour le type de prestation
 */

(function() {
    console.log("Initialisation de l'adaptateur pour le type de prestation...");
    
    // Fonction pour adapter l'interface
    function adapterInterface() {
        // Vérifier si nous sommes sur une page avec le nouveau sélecteur
        const prestationTypeSwitch = document.getElementById('prestation-type-switch');
        if (!prestationTypeSwitch) return;
        
        console.log("Adaptateur de type de prestation: sélecteur trouvé");
        
        // Créer des éléments virtuels pour les anciens scripts qui cherchent les boutons radio
        if (!document.getElementById('radio-standard') && !document.getElementById('radio-groupage')) {
            console.log("Création d'éléments virtuels pour les boutons radio");
            
            // Créer des éléments cachés qui simulent les anciens boutons radio
            const radioStandard = document.createElement('input');
            radioStandard.type = 'radio';
            radioStandard.id = 'radio-standard';
            radioStandard.name = 'type_prestation_radio';
            radioStandard.value = 'Standard';
            radioStandard.style.display = 'none';
            radioStandard.checked = !prestationTypeSwitch.checked;
            document.body.appendChild(radioStandard);
            
            const radioGroupage = document.createElement('input');
            radioGroupage.type = 'radio';
            radioGroupage.id = 'radio-groupage';
            radioGroupage.name = 'type_prestation_radio';
            radioGroupage.value = 'Groupage';
            radioGroupage.style.display = 'none';
            radioGroupage.checked = prestationTypeSwitch.checked;
            document.body.appendChild(radioGroupage);
            
            // Synchroniser les boutons radio virtuels avec l'interrupteur
            prestationTypeSwitch.addEventListener('change', function() {
                radioStandard.checked = !this.checked;
                radioGroupage.checked = this.checked;
                
                // Déclencher des événements pour que les autres scripts détectent le changement
                const event = new Event('change');
                if (this.checked) {
                    radioGroupage.dispatchEvent(event);
                } else {
                    radioStandard.dispatchEvent(event);
                }
            });
            
            // Synchroniser l'interrupteur avec les boutons radio virtuels
            radioStandard.addEventListener('change', function() {
                if (this.checked && prestationTypeSwitch.checked) {
                    prestationTypeSwitch.checked = false;
                    prestationTypeSwitch.dispatchEvent(new Event('change'));
                }
            });
            
            radioGroupage.addEventListener('change', function() {
                if (this.checked && !prestationTypeSwitch.checked) {
                    prestationTypeSwitch.checked = true;
                    prestationTypeSwitch.dispatchEvent(new Event('change'));
                }
            });
        }
    }
    
    // Exécuter après le chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM chargé, adaptation de l'interface...");
        adapterInterface();
        
        // Exécuter à nouveau après un délai pour s'assurer que tous les scripts ont été exécutés
        setTimeout(adapterInterface, 500);
    });
    
    // Observer les changements dans le DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Si de nouveaux éléments ont été ajoutés, vérifier et adapter
                adapterInterface();
            }
        });
    });
    
    // Commencer à observer le document
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Exécuter immédiatement si le DOM est déjà chargé
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        adapterInterface();
    }
})();
