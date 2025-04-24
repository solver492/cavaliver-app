/**
 * Script spécifique pour corriger les problèmes sur la page d'ajout de prestation
 * - Crée les éléments manquants (transporteursSelect, boutons radio)
 * - Force l'initialisation du widget de transporteurs
 */

(function() {
    console.log("=== CORRECTION DE LA PAGE D'AJOUT DE PRESTATION ===");
    
    // Fonction pour créer les éléments manquants
    function createMissingElements() {
        console.log("Création des éléments manquants...");
        
        // 1. Créer l'élément transporteursSelect s'il n'existe pas
        if (!document.getElementById('transporteursSelect')) {
            console.log("Création de l'élément transporteursSelect");
            const transporteursSelect = document.createElement('select');
            transporteursSelect.id = 'transporteursSelect';
            transporteursSelect.name = 'transporteursSelect';
            transporteursSelect.multiple = true;
            transporteursSelect.style.display = 'none';
            document.querySelector('form').appendChild(transporteursSelect);
            
            // Créer également l'élément transporteurs standard
            if (!document.getElementById('transporteurs')) {
                console.log("Création de l'élément transporteurs");
                const transporteurs = document.createElement('select');
                transporteurs.id = 'transporteurs';
                transporteurs.name = 'transporteurs';
                transporteurs.multiple = true;
                transporteurs.style.display = 'none';
                document.querySelector('form').appendChild(transporteurs);
            }
        }
        
        // 2. Créer les boutons radio pour le type de prestation s'ils n'existent pas
        if (!document.getElementById('radio-standard') || !document.getElementById('radio-groupage')) {
            console.log("Création des boutons radio pour le type de prestation");
            
            // Récupérer l'état du switch
            const prestationTypeSwitch = document.getElementById('prestation-type-switch');
            const isGroupage = prestationTypeSwitch ? prestationTypeSwitch.checked : false;
            
            // Créer le bouton radio Standard
            if (!document.getElementById('radio-standard')) {
                const radioStandard = document.createElement('input');
                radioStandard.type = 'radio';
                radioStandard.id = 'radio-standard';
                radioStandard.name = 'type_prestation_radio';
                radioStandard.value = 'Standard';
                radioStandard.style.display = 'none';
                radioStandard.checked = !isGroupage;
                document.body.appendChild(radioStandard);
            }
            
            // Créer le bouton radio Groupage
            if (!document.getElementById('radio-groupage')) {
                const radioGroupage = document.createElement('input');
                radioGroupage.type = 'radio';
                radioGroupage.id = 'radio-groupage';
                radioGroupage.name = 'type_prestation_radio';
                radioGroupage.value = 'Groupage';
                radioGroupage.style.display = 'none';
                radioGroupage.checked = isGroupage;
                document.body.appendChild(radioGroupage);
            }
        }
        
        // 3. Synchroniser les boutons radio avec le switch
        const prestationTypeSwitch = document.getElementById('prestation-type-switch');
        const radioStandard = document.getElementById('radio-standard');
        const radioGroupage = document.getElementById('radio-groupage');
        
        if (prestationTypeSwitch && radioStandard && radioGroupage) {
            // Synchroniser l'état initial
            radioStandard.checked = !prestationTypeSwitch.checked;
            radioGroupage.checked = prestationTypeSwitch.checked;
            
            // Ajouter l'événement de changement au switch
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
        }
    }
    
    // Fonction pour forcer l'initialisation du widget de transporteurs
    function forceInitTransporteursWidget() {
        console.log("Forçage de l'initialisation du widget de transporteurs...");
        
        // Vérifier si le script transporteurs-widget-final.js est chargé
        if (typeof window.initTransporteursWidget === 'function') {
            console.log("Fonction initTransporteursWidget trouvée, initialisation...");
            window.initTransporteursWidget();
        } else {
            console.log("Fonction initTransporteursWidget non trouvée, création manuelle du widget...");
            
            // Créer le bouton flottant manuellement
            const floatingBtn = document.createElement('button');
            floatingBtn.className = 'transporteurs-toggle-btn';
            floatingBtn.innerHTML = '<i class="fas fa-truck"></i> <span class="badge bg-danger">0</span>';
            floatingBtn.title = 'Gérer les transporteurs';
            document.body.appendChild(floatingBtn);
            
            // Ajouter l'événement de clic
            floatingBtn.addEventListener('click', function() {
                // Tenter de déclencher l'initialisation du widget
                const event = new CustomEvent('initTransporteursWidget');
                document.dispatchEvent(event);
            });
        }
    }
    
    // Exécuter après le chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM chargé, initialisation des corrections...");
        
        // Créer les éléments manquants
        createMissingElements();
        
        // Forcer l'initialisation du widget après un délai
        setTimeout(function() {
            forceInitTransporteursWidget();
        }, 1000);
    });
    
    // Si le DOM est déjà chargé, exécuter immédiatement
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("DOM déjà chargé, initialisation immédiate des corrections...");
        createMissingElements();
        setTimeout(function() {
            forceInitTransporteursWidget();
        }, 500);
    }
})();
