/**
 * Nouveau système unifié de sélection des transporteurs
 * Remplace complètement tous les anciens scripts
 */

(function() {
    // Suppression radicale de tous les systèmes précédents
    console.log("=== INITIALISATION DU NOUVEAU SYSTÈME DE TRANSPORTEURS ===");
    
    // Variables globales
    let transporteursLibres = [];
    let transporteursOccupes = [];
    let tousLesTransporteurs = [];
    
    // Attendre que le DOM soit complètement chargé
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM chargé - Initialisation du nouveau système de transporteurs");
        
        // Suppression radicale de tous les conteneurs existants de sélection de transporteurs
        const ancienConteneurs = document.querySelectorAll('.widget-transport-module, .old-transporteur-widget');
        if (ancienConteneurs.length > 0) {
            console.log(`Suppression de ${ancienConteneurs.length} ancien(s) conteneur(s)`);
            ancienConteneurs.forEach(el => el.remove());
        }
        
        // Création du nouveau conteneur
        const transporteurSection = document.createElement('div');
        transporteurSection.className = 'mb-4';
        transporteurSection.innerHTML = `
            <div class="card">
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
            </div>
        `;
        
        // Ajouter du CSS pour le nouveau système
        const style = document.createElement('style');
        style.textContent = `
            .transporteur-widget-container {
                max-height: 400px;
                overflow-y: auto;
            }
            
            /* Styles pour les options du select */
            #transporteurs option {
                padding: 8px;
                border-bottom: 1px solid #e9ecef;
            }
            
            /* Ajout de couleurs pour les états */
            #transporteurs option[data-status="disponible"] {
                background-color: rgba(40, 167, 69, 0.1);
            }
            
            #transporteurs option[data-status="occupe"] {
                background-color: rgba(255, 193, 7, 0.1);
            }
            
            /* Style pour l'option sélectionnée */
            #transporteurs option:checked {
                background-color: #007bff !important;
                color: white !important;
            }
        `;
        document.head.appendChild(style);
        
        // Trouver l'élément cible où insérer le nouveau conteneur
        const observationsDiv = document.querySelector('#ajouter-observation');
        let targetPlace = null;
        
        if (observationsDiv) {
            // Chercher le parent le plus proche qui est un div.mb-4
            targetPlace = observationsDiv.closest('.mb-4');
        }
        
        // Si on a trouvé un endroit où insérer notre widget
        if (targetPlace && targetPlace.parentNode) {
            targetPlace.parentNode.insertBefore(transporteurSection, targetPlace.nextSibling);
            console.log("Nouveau système de transporteurs inséré avec succès après les observations");
        } else {
            // Plan B: chercher le bouton Enregistrer et insérer avant
            const submitButton = document.querySelector('input[type="submit"], button[type="submit"]');
            if (submitButton && submitButton.parentNode) {
                const targetNode = submitButton.parentNode.parentNode;
                if (targetNode) {
                    targetNode.insertBefore(transporteurSection, submitButton.parentNode);
                    console.log("Nouveau système inséré avant le bouton d'enregistrement");
                } else {
                    console.error("Impossible de trouver un parent valide pour le bouton d'enregistrement");
                }
            } else {
                // Plan C: ajouter à la fin du formulaire
                const form = document.querySelector('form');
                if (form) {
                    form.appendChild(transporteurSection);
                    console.log("Nouveau système ajouté à la fin du formulaire");
                } else {
                    console.error("Aucun formulaire trouvé pour insérer le widget");
                    
                    // Plan D: ajouter au corps de la page
                    document.body.appendChild(transporteurSection);
                    console.log("Dernier recours: widget ajouté au corps de la page");
                }
            }
        }
        
        // Initialiser toutes les fonctionnalités du nouveau système
        initNouveauSysteme();
    });
    
    // Fonction d'initialisation du nouveau système
    function initNouveauSysteme() {
        // Références aux éléments du DOM
        const btnVerifierDispo = document.getElementById('verifier-disponibilite');
        const showCalendarBtn = document.getElementById('show-calendar-btn');
        const dateDebutInput = document.getElementById('date_debut');
        const dateFinInput = document.getElementById('date_fin');
        const typeDemenagementSelect = document.getElementById('type_demenagement_id');
        const transporteursSelect = document.getElementById('transporteurs');
        const transporteurSearch = document.getElementById('transporteur-search');
        const clearSearchBtn = document.getElementById('clear-search');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const transporteursResultatsDiv = document.getElementById('transporteurs-disponibles-resultats');
        const prestationIdInput = document.getElementById('prestation_id') || document.createElement('input');
        
        // Log des éléments pour débogage
        console.log("Éléments du nouveau système:", {
            btnVerifierDispo,
            showCalendarBtn,
            dateDebutInput,
            dateFinInput,
            typeDemenagementSelect,
            transporteursSelect,
            transporteurSearch,
            filterBtns
        });
        
        // Vérifier que les éléments existent
        if (!transporteursSelect || !transporteursResultatsDiv) {
            console.error("Éléments critiques manquants pour le nouveau système");
            return;
        }
        
        // Exécuter une vérification initiale si tous les champs requis sont remplis
        if (dateDebutInput && dateDebutInput.value && 
            dateFinInput && dateFinInput.value && 
            typeDemenagementSelect && typeDemenagementSelect.value && 
            typeDemenagementSelect.value !== '0') {
            setTimeout(verifierDisponibilites, 500);
        }
        
        // Événements pour la barre de recherche
        if (transporteurSearch) {
            transporteurSearch.addEventListener('input', filterTransporteurs);
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                if (transporteurSearch) {
                    transporteurSearch.value = '';
                    filterTransporteurs();
                }
            });
        }
        
        // Événements pour les boutons de filtre
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterTransporteurs();
            });
        });
        
        // Événement pour le bouton de vérification des disponibilités
        if (btnVerifierDispo) {
            btnVerifierDispo.addEventListener('click', verifierDisponibilites);
        }
        
        // Événement pour le bouton du calendrier
        if (showCalendarBtn) {
            showCalendarBtn.addEventListener('click', function() {
                window.location.href = '/calendrier';
            });
        }
        
        // Événement pour la sélection des transporteurs
        if (transporteursSelect) {
            transporteursSelect.addEventListener('change', updateTransporteurCounter);
        }
        
        // Événements pour déclencher automatiquement la vérification
        if (dateDebutInput) {
            dateDebutInput.addEventListener('change', verifierDisponibilites);
        }
        
        if (dateFinInput) {
            dateFinInput.addEventListener('change', verifierDisponibilites);
        }
        
        if (typeDemenagementSelect) {
            typeDemenagementSelect.addEventListener('change', verifierDisponibilites);
        }
        
        // Fonction pour filtrer les transporteurs
        function filterTransporteurs() {
            if (!transporteursSelect || !transporteurSearch) return;
            
            const searchText = transporteurSearch.value.toLowerCase();
            const activeFilter = document.querySelector('.filter-btn.active');
            const filterValue = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
            
            Array.from(transporteursSelect.options).forEach(option => {
                const matchesSearch = !searchText || option.getAttribute('data-search-text').includes(searchText);
                const matchesFilter = filterValue === 'all' || 
                                     (filterValue === 'available' && option.getAttribute('data-status') === 'disponible');
                
                option.style.display = matchesSearch && matchesFilter ? '' : 'none';
            });
        }
        
        // Fonction pour vérifier les disponibilités
        function verifierDisponibilites() {
            if (!dateDebutInput || !dateFinInput || !typeDemenagementSelect) {
                afficherErreur("Erreur: Éléments de formulaire manquants.");
                return;
            }
            
            const dateDebut = dateDebutInput.value;
            const dateFin = dateFinInput.value;
            const typeDemenagementId = typeDemenagementSelect.value;
            const prestationId = prestationIdInput.value || '';
            
            // Vérifier que les dates sont valides
            if (!dateDebut || !dateFin) {
                afficherErreur("Veuillez sélectionner les dates de début et de fin.");
                return;
            }
            
            // Vérifier que le type de déménagement est sélectionné
            if (!typeDemenagementId || typeDemenagementId === '0') {
                afficherErreur("Veuillez sélectionner un type de déménagement.");
                return;
            }
            
            // Afficher un indicateur de chargement
            afficherChargement();
            
            // Créer le formulaire de données pour la requête
            const formData = new FormData();
            formData.append('date_debut', dateDebut);
            formData.append('date_fin', dateFin);
            formData.append('type_demenagement_id', typeDemenagementId);
            if (prestationId) {
                formData.append('prestation_id', prestationId);
            }
            
            // Effectuer la requête AJAX
            fetch('/api/transporteurs/check-disponibilite', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur réseau: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Résultats de la vérification:", data);
                
                // Mettre à jour les listes de transporteurs
                transporteursLibres = data.transporteurs || [];
                transporteursOccupes = data.soon_available || [];
                tousLesTransporteurs = [...transporteursLibres, ...transporteursOccupes];
                
                // Traiter et afficher les résultats
                afficherResultats(data);
                
                // Synchroniser avec le calendrier si disponible
                synchroniserCalendrier(data);
                
                // Mettre à jour le compteur
                updateTransporteurCounter();
            })
            .catch(error => {
                console.error("Erreur lors de la vérification:", error);
                afficherErreur("Erreur lors de la vérification. Veuillez réessayer.");
            });
        }
        
        // Fonction pour afficher les résultats
        function afficherResultats(data) {
            if (!transporteursResultatsDiv) return;
            
            // Récupérer les transporteurs déjà assignés
            const transporteursAssignes = getTransporteursAssignes();
            console.log("Transporteurs déjà assignés:", transporteursAssignes);
            
            // Mettre à jour la liste de sélection des transporteurs
            if (transporteursSelect) {
                // Sauvegarder les transporteurs actuellement sélectionnés
                const selectedIds = Array.from(transporteursSelect.options)
                    .filter(opt => opt.selected)
                    .map(opt => opt.value);
                
                // Vider la liste actuelle
                transporteursSelect.innerHTML = '';
                
                // Fonction pour ajouter un transporteur à la liste
                function addTransporteurOption(transporteur, status) {
                    const option = document.createElement('option');
                    option.value = transporteur.id;
                    
                    // Ajouter des attributs de données pour le filtrage et la recherche
                    option.setAttribute('data-status', status);
                    option.setAttribute('data-search-text', 
                        `${transporteur.nom} ${transporteur.prenom} ${transporteur.vehicule}`.toLowerCase());
                    
                    // Définir si l'option est sélectionnée
                    option.selected = transporteursAssignes.includes(transporteur.id.toString()) || 
                                      selectedIds.includes(transporteur.id.toString());
                    
                    // Créer le texte de l'option avec des icônes pour le statut
                    let statusIcon = '';
                    if (status === 'disponible') {
                        statusIcon = '🟢 '; // Vert pour disponible
                    } else {
                        statusIcon = '🟠 '; // Orange pour bientôt disponible
                    }
                    
                    let vehiculeIcon = transporteur.vehicule_adapte ? '✓ ' : ''; // Coche pour véhicule adapté
                    
                    option.textContent = `${statusIcon}${vehiculeIcon}${transporteur.nom} ${transporteur.prenom} (${transporteur.vehicule})`;
                    transporteursSelect.appendChild(option);
                }
                
                // D'abord ajouter les transporteurs disponibles
                data.transporteurs.forEach(transporteur => {
                    addTransporteurOption(transporteur, 'disponible');
                });
                
                // Ensuite ajouter les transporteurs bientôt disponibles
                data.soon_available.forEach(transporteur => {
                    addTransporteurOption(transporteur, 'occupe');
                });
            }
            
            // Créer le contenu HTML pour les véhicules recommandés
            let htmlVehicules = '';
            if (data.vehicules_recommandes && data.vehicules_recommandes.length > 0) {
                htmlVehicules = '<div class="alert alert-success mt-3">' +
                                    '<h6><i class="fas fa-thumbs-up"></i> Véhicules recommandés:</h6>' +
                                    '<ul class="mb-0">';
                
                data.vehicules_recommandes.forEach(vehicule => {
                    htmlVehicules += `<li><strong>${vehicule.nom}</strong> - ${vehicule.description}</li>`;
                });
                
                htmlVehicules += '</ul></div>';
            }
            
            // Afficher les statistiques de disponibilité
            let statsHtml = `
                <div class="mt-3 mb-3">
                    <div class="d-flex justify-content-between">
                        <span><strong>Transporteurs disponibles:</strong> ${data.transporteurs.length}</span>
                        <span><strong>Bientôt disponibles:</strong> ${data.soon_available.length}</span>
                    </div>
                    <div class="progress mt-2" style="height: 20px;">
                        <div class="progress-bar bg-success" role="progressbar" 
                             style="width: ${data.transporteurs.length / (data.transporteurs.length + data.soon_available.length || 1) * 100}%" 
                             aria-valuenow="${data.transporteurs.length}" aria-valuemin="0" 
                             aria-valuemax="${data.transporteurs.length + data.soon_available.length}">
                            Disponibles
                        </div>
                        <div class="progress-bar bg-warning" role="progressbar" 
                             style="width: ${data.soon_available.length / (data.transporteurs.length + data.soon_available.length || 1) * 100}%" 
                             aria-valuenow="${data.soon_available.length}" aria-valuemin="0" 
                             aria-valuemax="${data.transporteurs.length + data.soon_available.length}">
                            Occupés
                        </div>
                    </div>
                </div>
            `;
            
            // Afficher les résultats
            transporteursResultatsDiv.innerHTML = 
                '<div class="alert alert-success">' +
                    '<i class="fas fa-check-circle me-2"></i> ' +
                    'Vérification terminée. Sélectionnez les transporteurs dans la liste ci-dessous.' +
                '</div>' + 
                statsHtml +
                htmlVehicules;
                
            // Mettre à jour les filtres
            filterTransporteurs();
        }
        
        // Fonction pour synchroniser avec le calendrier
        function synchroniserCalendrier(data) {
            // Vérifier si le calendrier existe
            if (typeof window.calendar === 'undefined') {
                console.log("Calendrier non trouvé pour la synchronisation");
                return;
            }
            
            console.log("Synchronisation avec le calendrier...");
            
            // Si des données de prestation existent, rafraîchir le calendrier
            if (data && (data.transporteurs || data.soon_available)) {
                try {
                    // Rafraîchir les événements du calendrier
                    window.calendar.refetchEvents();
                    console.log("Événements du calendrier rafraîchis");
                } catch (error) {
                    console.error("Erreur lors de la synchronisation avec le calendrier:", error);
                }
            }
        }
        
        // Fonction pour obtenir les transporteurs assignés
        function getTransporteursAssignes() {
            const assignedIds = [];
            const transporteursSelect = document.getElementById('transporteurs');
            if (transporteursSelect && transporteursSelect.options) {
                for (let i = 0; i < transporteursSelect.options.length; i++) {
                    if (transporteursSelect.options[i].selected) {
                        assignedIds.push(transporteursSelect.options[i].value);
                    }
                }
            }
            return assignedIds;
        }
        
        // Fonction pour mettre à jour le compteur
        function updateTransporteurCounter() {
            const counterElement = document.querySelector('.transporteurs-counter');
            if (!counterElement || !transporteursSelect) return;
            
            const selectedCount = Array.from(transporteursSelect.options)
                .filter(option => option.selected).length;
            
            const totalAvailable = transporteursLibres.length;
            let message = `${selectedCount} transporteur(s) sélectionné(s) sur ${totalAvailable} disponibles`;
            
            if (transporteursOccupes.length > 0) {
                message += ` (+ ${transporteursOccupes.length} occupés)`;
            }
            
            counterElement.textContent = message;
        }
        
        // Fonction pour afficher une erreur
        function afficherErreur(message) {
            if (!transporteursResultatsDiv) return;
            
            transporteursResultatsDiv.innerHTML = 
                `<div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i> ${message}
                </div>`;
        }
        
        // Fonction pour afficher un indicateur de chargement
        function afficherChargement() {
            if (!transporteursResultatsDiv) return;
            
            transporteursResultatsDiv.innerHTML = 
                `<div class="text-center p-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2">Vérification des disponibilités en cours...</p>
                </div>`;
        }
    }
})();
