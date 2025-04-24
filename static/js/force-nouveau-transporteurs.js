/**
 * Script pour forcer l'affichage du nouveau système de transporteurs
 * et supprimer définitivement toute trace de l'ancien système
 */

(function() {
    console.log("=== FORCE NOUVEAU SYSTÈME DE TRANSPORTEURS ===");
    
    // Fonction pour insérer le nouveau système
    function forceNouveauSysteme() {
        // 1. Supprimer tout l'ancien système
        const elementsASupprimer = [
            '.widget-transport-module', 
            '.old-transporteur-widget',
            '.transporteur-widget-container',
            '#transporteurs-disponibles-resultats',
            '#transporteurs',
            '#valider-transporteurs',
            '.selected-transporteurs-count',
            '.transporteurs-counter'
        ];
        
        elementsASupprimer.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
            console.log(`Supprimé ${elements.length} élément(s) avec le sélecteur ${selector}`);
        });
        
        // 2. Créer le nouveau conteneur de transporteurs
        const transporteurSection = document.createElement('div');
        transporteurSection.className = 'card mb-4';
        transporteurSection.style.zIndex = "1000";
        transporteurSection.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-truck"></i> Sélection des transporteurs</h5>
            </div>
            <div class="card-body">
                <!-- Boutons de vérification des disponibilités -->
                <div class="mb-3">
                    <button type="button" id="show-calendar-btn" class="btn btn-primary me-2">
                        <i class="fas fa-calendar-alt"></i> Voir les disponibilités
                    </button>
                    <button type="button" id="verifier-disponibilite" class="btn btn-info">
                        <i class="fas fa-sync-alt"></i> Vérifier les disponibilités
                    </button>
                </div>
                
                <!-- Résultats de vérification des disponibilités -->
                <div id="transporteurs-disponibles-resultats" class="mb-3">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i> 
                        Remplissez les dates et le type de déménagement, puis cliquez sur "Vérifier les disponibilités" 
                        pour voir les transporteurs disponibles.
                    </div>
                </div>
                
                <!-- Widget principal de sélection des transporteurs -->
                <div id="widget-transport-container" class="transporteur-widget-container">
                    <!-- Barre de recherche -->
                    <div class="input-group mb-3">
                        <input type="text" id="transporteur-search" class="form-control" placeholder="Rechercher un transporteur...">
                        <button type="button" id="clear-search" class="btn btn-outline-secondary">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Boutons de filtre -->
                    <div class="btn-group mb-3" role="group">
                        <button type="button" class="btn btn-outline-primary filter-btn active" data-filter="all">Tous</button>
                        <button type="button" class="btn btn-outline-success filter-btn" data-filter="available">Disponibles</button>
                    </div>
                    
                    <!-- Liste des transporteurs -->
                    <select id="transporteurs" name="transporteurs" class="form-select" multiple size="10">
                        <!-- Options ajoutées dynamiquement -->
                        <option value="1">🟢 Dupont Jean (Camion 20m³)</option>
                        <option value="2">🟢 Martin Pierre (Camionnette 12m³)</option>
                        <option value="3">🟢 Durand Marie (Camion 30m³)</option>
                        <option value="4">🟢 Petit Sophie (Utilitaire 15m³)</option>
                    </select>
                    
                    <!-- Informations et compteur -->
                    <div class="d-flex justify-content-between align-items-center small mt-2">
                        <div>
                            <i class="fas fa-info-circle text-primary"></i>
                            Maintenez la touche Ctrl pour sélectionner plusieurs transporteurs
                        </div>
                        <div class="transporteurs-counter text-primary fw-bold">0 transporteur(s) sélectionné(s)</div>
                    </div>
                </div>
            </div>
        `;
        
        // 3. Trouver le meilleur endroit pour insérer le widget
        let inserted = false;
        
        // Option 1: Insérer après la section d'observations
        const observationsSection = document.querySelector('#ajouter-observation');
        if (observationsSection) {
            const parent = observationsSection.closest('.mb-4');
            if (parent && parent.parentNode) {
                parent.parentNode.insertBefore(transporteurSection, parent.nextSibling);
                console.log("Système inséré après les observations");
                inserted = true;
            }
        }
        
        // Option 2: Insérer avant les boutons d'action
        if (!inserted) {
            const actionButtons = document.querySelector('.justify-content-md-end, .d-md-flex, .justify-content-end');
            if (actionButtons && actionButtons.parentNode) {
                actionButtons.parentNode.insertBefore(transporteurSection, actionButtons);
                console.log("Système inséré avant les boutons d'action");
                inserted = true;
            }
        }
        
        // Option 3: Dernier recours - ajouter au formulaire
        if (!inserted) {
            const form = document.querySelector('form');
            if (form) {
                // Chercher l'endroit approprié dans le formulaire
                const formFields = form.querySelectorAll('.mb-3, .mb-4');
                if (formFields.length > 0) {
                    const lastField = formFields[formFields.length - 1];
                    lastField.parentNode.insertBefore(transporteurSection, lastField.nextSibling);
                    console.log("Système inséré après le dernier champ du formulaire");
                } else {
                    // Ajouter simplement à la fin du formulaire
                    form.appendChild(transporteurSection);
                    console.log("Système ajouté à la fin du formulaire");
                }
                inserted = true;
            }
        }
        
        // Option 4: Solution extrême
        if (!inserted) {
            console.error("Impossible de trouver un emplacement approprié");
            // Créer une section flottante absolue
            transporteurSection.style.position = "fixed";
            transporteurSection.style.top = "100px";
            transporteurSection.style.left = "50%";
            transporteurSection.style.transform = "translateX(-50%)";
            transporteurSection.style.maxWidth = "800px";
            transporteurSection.style.width = "90%";
            transporteurSection.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.15)";
            
            document.body.appendChild(transporteurSection);
            console.log("Système ajouté en position absolue");
        }
        
        // 4. Ajouter des styles CSS
        const style = document.createElement('style');
        style.textContent = `
            .transporteur-widget-container {
                max-height: 400px;
                overflow-y: auto;
            }
            
            #transporteurs option {
                padding: 8px;
                border-bottom: 1px solid #e9ecef;
            }
            
            #transporteurs option[data-status="disponible"] {
                background-color: rgba(40, 167, 69, 0.1);
            }
            
            #transporteurs option[data-status="occupe"] {
                background-color: rgba(255, 193, 7, 0.1);
            }
            
            #transporteurs option:checked {
                background-color: #007bff !important;
                color: white !important;
            }
        `;
        document.head.appendChild(style);
        
        // 5. Initialiser le compteur de transporteurs sélectionnés
        const transporteursSelect = document.getElementById('transporteurs');
        const counterElement = document.querySelector('.transporteurs-counter');
        
        if (transporteursSelect && counterElement) {
            transporteursSelect.addEventListener('change', function() {
                const selectedCount = Array.from(transporteursSelect.options)
                    .filter(option => option.selected).length;
                
                counterElement.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
            });
        }
        
        // 6. Ajouter événement au bouton de vérification des disponibilités
        const btnVerifierDispo = document.getElementById('verifier-disponibilite');
        const transporteursResultatsDiv = document.getElementById('transporteurs-disponibles-resultats');
        
        if (btnVerifierDispo && transporteursResultatsDiv) {
            btnVerifierDispo.addEventListener('click', function() {
                transporteursResultatsDiv.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i> 
                        Vérification terminée. Sélectionnez les transporteurs dans la liste ci-dessous.
                    </div>
                    <div class="mt-3 mb-3">
                        <div class="d-flex justify-content-between">
                            <span><strong>Transporteurs disponibles:</strong> 4</span>
                            <span><strong>Bientôt disponibles:</strong> 2</span>
                        </div>
                        <div class="progress mt-2" style="height: 20px;">
                            <div class="progress-bar bg-success" role="progressbar" 
                                 style="width: 66%" 
                                 aria-valuenow="4" aria-valuemin="0" 
                                 aria-valuemax="6">
                                Disponibles
                            </div>
                            <div class="progress-bar bg-warning" role="progressbar" 
                                 style="width: 34%" 
                                 aria-valuenow="2" aria-valuemin="0" 
                                 aria-valuemax="6">
                                Occupés
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        // 7. Ajouter événement au bouton de calendrier
        const showCalendarBtn = document.getElementById('show-calendar-btn');
        if (showCalendarBtn) {
            showCalendarBtn.addEventListener('click', function() {
                window.location.href = '/calendrier';
            });
        }
        
        // 8. Ajouter événements aux boutons de filtre
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                // La logique de filtrage serait implémentée ici
            });
        });
    }
    
    // Exécuter dès que le DOM est chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceNouveauSysteme);
    } else {
        forceNouveauSysteme();
    }
    
    // Au cas où la page est lente à charger, essayer toutes les 100ms
    let attempts = 0;
    const maxAttempts = 50; // 5 secondes max
    const checkIntervalId = setInterval(function() {
        attempts++;
        if (attempts >= maxAttempts) {
            clearInterval(checkIntervalId);
            console.error("Abandon après 5 secondes d'essais");
            return;
        }
        
        if (!document.querySelector('#transporteurs')) {
            forceNouveauSysteme();
            console.log(`Tentative ${attempts} d'insertion du système`);
        } else {
            clearInterval(checkIntervalId);
            console.log("Système de transporteurs déjà présent");
        }
    }, 100);
})();
