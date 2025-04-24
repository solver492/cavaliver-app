/**
 * Script unifié pour la gestion des prestations
 * - Intègre le widget de transporteurs directement dans la page
 * - Assure une interface cohérente et fonctionnelle
 */

(function() {
    console.log("=== SYSTÈME UNIFIÉ DE GESTION DES PRESTATIONS ===");
    
    // Configuration
    const config = {
        transporteurSection: {
            title: "Transporteurs",
            icon: "fa-truck",
            position: "after-observations", // Où placer la section: "after-observations", "before-buttons", "end-form"
            showBadge: true                 // Afficher un badge avec le nombre de transporteurs sélectionnés
        },
        validation: {
            required: ["client", "type_demenagement", "date_debut", "date_fin", "adresse_depart", "adresse_arrivee"]
        }
    };
    
    // État
    let state = {
        selectedTransporteurs: [],
        formData: {},
        validationErrors: {}
    };
    
    // Éléments DOM
    let elements = {
        form: null,
        transporteurSection: null,
        transporteursList: null,
        transporteursCounter: null,
        saveButton: null
    };
    
    // Fonction pour initialiser l'interface unifiée
    function initUnifiedInterface() {
        console.log("Initialisation de l'interface unifiée...");
        
        // Récupérer le formulaire
        elements.form = document.querySelector('form');
        if (!elements.form) {
            console.error("Formulaire non trouvé");
            return;
        }
        
        // Supprimer les anciens widgets de transporteurs
        cleanupOldWidgets();
        
        // Créer la section des transporteurs
        createTransporteurSection();
        
        // Initialiser les événements
        initEvents();
        
        // Charger les transporteurs
        loadTransporteurs();
        
        // Charger les transporteurs déjà sélectionnés (en mode édition)
        loadSelectedTransporteurs();
        
        console.log("Interface unifiée initialisée");
    }
    
    // Fonction pour nettoyer les anciens widgets
    function cleanupOldWidgets() {
        // Supprimer les anciens widgets
        const elementsToRemove = [
            '.transporteurs-modal-widget',
            '.transporteurs-toggle-btn',
            '#systeme-transporteurs-propre',
            '.widget-transport-module',
            '.transporteur-widget-container'
        ];
        
        elementsToRemove.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // Supprimer les styles associés
        document.querySelectorAll('style[data-for="transporteurs-modal"]').forEach(el => el.remove());
    }
    
    // Fonction pour créer la section des transporteurs
    function createTransporteurSection() {
        // Créer la section
        const section = document.createElement('div');
        section.className = 'card mb-4';
        section.id = 'transporteurs-section';
        
        // Créer l'en-tête
        const header = document.createElement('div');
        header.className = 'card-header bg-primary text-white d-flex justify-content-between align-items-center';
        header.innerHTML = `
            <h5 class="mb-0"><i class="fas ${config.transporteurSection.icon}"></i> ${config.transporteurSection.title}</h5>
            <span class="transporteurs-badge badge bg-light text-primary" style="display: none;">0</span>
        `;
        
        // Créer le corps
        const body = document.createElement('div');
        body.className = 'card-body';
        
        // Ajouter les boutons d'action
        const actions = document.createElement('div');
        actions.className = 'mb-3';
        actions.innerHTML = `
            <button type="button" id="check-availability-btn" class="btn btn-info me-2">
                <i class="fas fa-sync-alt"></i> Vérifier les disponibilités
            </button>
            <button type="button" id="view-calendar-btn" class="btn btn-outline-primary">
                <i class="fas fa-calendar-alt"></i> Voir le calendrier
            </button>
        `;
        
        // Ajouter la barre de recherche
        const searchContainer = document.createElement('div');
        searchContainer.className = 'input-group mb-3';
        searchContainer.innerHTML = `
            <input type="text" id="transporteur-search" class="form-control" placeholder="Rechercher un transporteur...">
            <button type="button" id="clear-search" class="btn btn-outline-secondary">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Ajouter les boutons de filtre
        const filterContainer = document.createElement('div');
        filterContainer.className = 'btn-group mb-3';
        filterContainer.setAttribute('role', 'group');
        filterContainer.innerHTML = `
            <button type="button" class="btn btn-outline-primary filter-btn active" data-filter="tous">Tous</button>
            <button type="button" class="btn btn-outline-success filter-btn" data-filter="disponibles">Disponibles</button>
        `;
        
        // Ajouter la liste des transporteurs
        const transporteursList = document.createElement('div');
        transporteursList.className = 'transporteurs-list';
        transporteursList.id = 'transporteurs-list';
        transporteursList.innerHTML = '<div class="alert alert-info">Chargement des transporteurs...</div>';
        
        // Ajouter le compteur et les informations
        const footer = document.createElement('div');
        footer.className = 'd-flex justify-content-between align-items-center small mt-2';
        footer.innerHTML = `
            <div>
                <i class="fas fa-info-circle text-primary"></i>
                Cliquez sur un transporteur pour le sélectionner
            </div>
            <div id="transporteurs-counter" class="text-primary fw-bold">0 transporteur(s) sélectionné(s)</div>
        `;
        
        // Assembler la section
        body.appendChild(actions);
        body.appendChild(searchContainer);
        body.appendChild(filterContainer);
        body.appendChild(transporteursList);
        body.appendChild(footer);
        
        section.appendChild(header);
        section.appendChild(body);
        
        // Stocker les références
        elements.transporteurSection = section;
        elements.transporteursList = transporteursList;
        elements.transporteursCounter = footer.querySelector('#transporteurs-counter');
        
        // Insérer la section au bon endroit
        insertTransporteurSection(section);
        
        // Ajouter les styles CSS
        addTransporteurStyles();
    }
    
    // Fonction pour insérer la section des transporteurs au bon endroit
    function insertTransporteurSection(section) {
        if (!elements.form) return;
        
        let inserted = false;
        
        // Option 1: Après les observations
        if (config.transporteurSection.position === 'after-observations') {
            const observationsField = elements.form.querySelector('#observations, [name="observations"]');
            if (observationsField) {
                const observationsContainer = observationsField.closest('.card, .mb-3, .mb-4');
                if (observationsContainer && observationsContainer.parentNode) {
                    observationsContainer.parentNode.insertBefore(section, observationsContainer.nextSibling);
                    inserted = true;
                }
            }
        }
        
        // Option 2: Avant les boutons d'action
        if (!inserted && config.transporteurSection.position === 'before-buttons') {
            const buttonsContainer = elements.form.querySelector('.justify-content-md-end, .d-md-flex, .justify-content-end');
            if (buttonsContainer && buttonsContainer.parentNode) {
                buttonsContainer.parentNode.insertBefore(section, buttonsContainer);
                inserted = true;
            }
        }
        
        // Option 3: À la fin du formulaire
        if (!inserted) {
            elements.form.appendChild(section);
        }
    }
    
    // Fonction pour ajouter les styles CSS
    function addTransporteurStyles() {
        const style = document.createElement('style');
        style.setAttribute('data-for', 'transporteurs-unified');
        style.textContent = `
            #transporteurs-section {
                margin-bottom: 2rem;
            }
            
            .transporteurs-list {
                border: 1px solid #ced4da;
                border-radius: 4px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .transporteur-item {
                padding: 10px 15px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .transporteur-item:last-child {
                border-bottom: none;
            }
            
            .transporteur-item:hover {
                background-color: #f8f9fa;
            }
            
            .transporteur-item.selected {
                background-color: #e2f0ff;
            }
            
            .transporteur-status {
                margin-right: 10px;
                font-size: 16px;
            }
            
            .transporteur-info {
                flex: 1;
            }
            
            .transporteur-name {
                font-weight: bold;
            }
            
            .transporteur-vehicle {
                font-size: 12px;
                color: #6c757d;
            }
            
            .alert {
                margin-bottom: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fonction pour initialiser les événements
    function initEvents() {
        if (!elements.transporteurSection) return;
        
        // Bouton de vérification des disponibilités
        const checkAvailabilityBtn = elements.transporteurSection.querySelector('#check-availability-btn');
        if (checkAvailabilityBtn) {
            checkAvailabilityBtn.addEventListener('click', checkAvailability);
        }
        
        // Bouton pour voir le calendrier
        const viewCalendarBtn = elements.transporteurSection.querySelector('#view-calendar-btn');
        if (viewCalendarBtn) {
            viewCalendarBtn.addEventListener('click', function() {
                window.location.href = '/calendrier';
            });
        }
        
        // Champ de recherche
        const searchInput = elements.transporteurSection.querySelector('#transporteur-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterTransporteurs(this.value.toLowerCase());
            });
        }
        
        // Bouton pour effacer la recherche
        const clearSearchBtn = elements.transporteurSection.querySelector('#clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                const searchInput = elements.transporteurSection.querySelector('#transporteur-search');
                if (searchInput) {
                    searchInput.value = '';
                    filterTransporteurs('');
                }
            });
        }
        
        // Boutons de filtre
        const filterBtns = elements.transporteurSection.querySelectorAll('.filter-btn');
        if (filterBtns.length) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    const filter = this.dataset.filter;
                    const searchInput = elements.transporteurSection.querySelector('#transporteur-search');
                    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                    
                    filterTransporteurs(searchTerm, filter);
                });
            });
        }
        
        // Bouton de sauvegarde du formulaire
        elements.saveButton = elements.form.querySelector('button[type="submit"]');
        if (elements.saveButton) {
            elements.form.addEventListener('submit', function(e) {
                // Vérifier si des transporteurs sont sélectionnés
                if (state.selectedTransporteurs.length === 0) {
                    const confirmSubmit = confirm('Aucun transporteur n\'est sélectionné. Voulez-vous quand même enregistrer la prestation ?');
                    if (!confirmSubmit) {
                        e.preventDefault();
                        return false;
                    }
                }
                
                // Mettre à jour le champ caché avec les transporteurs sélectionnés
                updateHiddenTransporteursField();
                
                return true;
            });
        }
    }
    
    // Fonction pour charger les transporteurs
    async function loadTransporteurs() {
        try {
            // Afficher un message de chargement
            if (elements.transporteursList) {
                elements.transporteursList.innerHTML = '<div class="alert alert-info">Chargement des transporteurs...</div>';
            }
            
            const response = await fetch('/api/transporteurs/liste');
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.transporteurs) {
                state.transporteurs = data.transporteurs;
                renderTransporteurs();
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des transporteurs');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des transporteurs:', error);
            
            // Afficher un message d'erreur
            if (elements.transporteursList) {
                elements.transporteursList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Erreur: ${error.message || 'Impossible de charger les transporteurs'}
                    </div>
                `;
            }
            
            // Charger des transporteurs par défaut
            state.transporteurs = [
                { id: 1, nom: 'Transporteur', prenom: '1', vehicule: 'Camion 20m³', disponible: true },
                { id: 2, nom: 'Transporteur', prenom: '2', vehicule: 'Camionnette 12m³', disponible: true },
                { id: 3, nom: 'Transporteur', prenom: '3', vehicule: 'Camion 30m³', disponible: false }
            ];
            renderTransporteurs();
        }
    }
    
    // Fonction pour charger les transporteurs déjà sélectionnés (en mode édition)
    function loadSelectedTransporteurs() {
        // Vérifier s'il y a un champ caché avec des transporteurs déjà sélectionnés
        const hiddenInput = document.querySelector('input[name="transporteur_ids"]');
        if (hiddenInput && hiddenInput.value) {
            try {
                const transporteurIds = JSON.parse(hiddenInput.value);
                
                // Marquer ces transporteurs comme sélectionnés
                transporteurIds.forEach(id => {
                    const transporteur = state.transporteurs.find(t => t.id === id);
                    if (transporteur) {
                        state.selectedTransporteurs.push(transporteur);
                    }
                });
                
                // Mettre à jour l'affichage
                updateTransporteursSelection();
                updateCounter();
            } catch (error) {
                console.error('Erreur lors du chargement des transporteurs sélectionnés:', error);
            }
        }
    }
    
    // Fonction pour afficher les transporteurs
    function renderTransporteurs() {
        if (!elements.transporteursList) return;
        
        // Vider la liste
        elements.transporteursList.innerHTML = '';
        
        // Si aucun transporteur, afficher un message
        if (!state.transporteurs || state.transporteurs.length === 0) {
            elements.transporteursList.innerHTML = '<div class="alert alert-warning">Aucun transporteur disponible</div>';
            return;
        }
        
        // Créer un élément pour chaque transporteur
        state.transporteurs.forEach(transporteur => {
            const item = document.createElement('div');
            item.className = 'transporteur-item';
            item.dataset.id = transporteur.id;
            
            // Vérifier si le transporteur est sélectionné
            if (state.selectedTransporteurs.some(t => t.id === transporteur.id)) {
                item.classList.add('selected');
            }
            
            // Déterminer le statut et l'icône
            const statut = transporteur.disponible ? 'disponible' : 'occupe';
            const icone = transporteur.disponible ? '🟢' : '🟠';
            
            // Créer le contenu de l'item
            item.innerHTML = `
                <div class="transporteur-status">${icone}</div>
                <div class="transporteur-info">
                    <div class="transporteur-name">${transporteur.nom} ${transporteur.prenom}</div>
                    <div class="transporteur-vehicle">${transporteur.vehicule}</div>
                </div>
            `;
            
            // Ajouter l'événement de clic pour sélectionner/désélectionner
            item.addEventListener('click', function() {
                toggleTransporteurSelection(transporteur);
            });
            
            elements.transporteursList.appendChild(item);
        });
        
        // Appliquer les filtres initiaux
        const searchInput = elements.transporteurSection.querySelector('#transporteur-search');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        const activeFilterBtn = elements.transporteurSection.querySelector('.filter-btn.active');
        const filter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'tous';
        
        filterTransporteurs(searchTerm, filter);
    }
    
    // Fonction pour filtrer les transporteurs
    function filterTransporteurs(searchTerm = '', filter = 'tous') {
        if (!elements.transporteursList) return;
        
        const items = elements.transporteursList.querySelectorAll('.transporteur-item');
        
        items.forEach(item => {
            const transporteurId = parseInt(item.dataset.id);
            const transporteur = state.transporteurs.find(t => t.id === transporteurId);
            
            if (!transporteur) return;
            
            // Filtre de recherche
            const matchesSearch = !searchTerm || 
                (transporteur.nom + ' ' + transporteur.prenom).toLowerCase().includes(searchTerm) || 
                transporteur.vehicule.toLowerCase().includes(searchTerm);
            
            // Filtre de disponibilité
            const matchesFilter = filter === 'tous' || 
                (filter === 'disponibles' && transporteur.disponible);
            
            // Afficher ou masquer l'item
            item.style.display = matchesSearch && matchesFilter ? '' : 'none';
        });
    }
    
    // Fonction pour basculer la sélection d'un transporteur
    function toggleTransporteurSelection(transporteur) {
        const index = state.selectedTransporteurs.findIndex(t => t.id === transporteur.id);
        
        if (index === -1) {
            // Ajouter à la sélection
            state.selectedTransporteurs.push(transporteur);
        } else {
            // Retirer de la sélection
            state.selectedTransporteurs.splice(index, 1);
        }
        
        // Mettre à jour l'affichage
        updateTransporteursSelection();
        updateCounter();
        updateHiddenTransporteursField();
    }
    
    // Fonction pour mettre à jour l'affichage des transporteurs sélectionnés
    function updateTransporteursSelection() {
        if (!elements.transporteursList) return;
        
        // Mettre à jour les classes des items
        const items = elements.transporteursList.querySelectorAll('.transporteur-item');
        
        items.forEach(item => {
            const transporteurId = parseInt(item.dataset.id);
            const isSelected = state.selectedTransporteurs.some(t => t.id === transporteurId);
            
            if (isSelected) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    // Fonction pour mettre à jour le compteur
    function updateCounter() {
        if (!elements.transporteursCounter) return;
        
        const count = state.selectedTransporteurs.length;
        elements.transporteursCounter.textContent = `${count} transporteur(s) sélectionné(s)`;
        
        // Mettre à jour le badge si activé
        if (config.transporteurSection.showBadge) {
            const badge = elements.transporteurSection.querySelector('.transporteurs-badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'inline-block' : 'none';
            }
        }
    }
    
    // Fonction pour mettre à jour le champ caché avec les transporteurs sélectionnés
    function updateHiddenTransporteursField() {
        // Récupérer les IDs des transporteurs sélectionnés
        const transporteurIds = state.selectedTransporteurs.map(t => t.id);
        
        // Créer ou mettre à jour le champ caché
        let hiddenInput = document.querySelector('input[name="transporteur_ids"]');
        
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'transporteur_ids';
            elements.form.appendChild(hiddenInput);
        }
        
        // Stocker les IDs au format JSON
        hiddenInput.value = JSON.stringify(transporteurIds);
    }
    
    // Fonction pour vérifier les disponibilités
    async function checkAvailability() {
        try {
            // Récupérer les dates et le type de déménagement
            const dateDebut = document.querySelector('input[name="date_debut"]')?.value;
            const dateFin = document.querySelector('input[name="date_fin"]')?.value;
            const typeDemenagementId = document.querySelector('select[name="type_demenagement_id"]')?.value;
            const prestationId = document.querySelector('input[name="id"]')?.value;
            
            // Vérifier que les dates sont remplies
            if (!dateDebut || !dateFin) {
                alert('Veuillez remplir les dates de début et de fin pour vérifier les disponibilités.');
                return;
            }
            
            // Afficher un message de chargement
            if (elements.transporteursList) {
                elements.transporteursList.innerHTML = '<div class="alert alert-info">Vérification des disponibilités...</div>';
            }
            
            // Préparer les données pour l'API
            const data = {
                date_debut: dateDebut,
                date_fin: dateFin,
                type_demenagement_id: typeDemenagementId || '',
                prestation_id: prestationId || ''
            };
            
            // Appeler l'API
            const response = await fetch('/api/transporteurs/check-disponibilite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            if (responseData.success) {
                // Mettre à jour les transporteurs avec leur disponibilité
                if (responseData.transporteurs) {
                    // Conserver les transporteurs sélectionnés
                    const selectedIds = state.selectedTransporteurs.map(t => t.id);
                    
                    // Mettre à jour la liste des transporteurs
                    state.transporteurs = responseData.transporteurs;
                    
                    // Restaurer les transporteurs sélectionnés
                    state.selectedTransporteurs = state.transporteurs.filter(t => selectedIds.includes(t.id));
                    
                    // Mettre à jour l'affichage
                    renderTransporteurs();
                    updateCounter();
                }
                
                // Afficher un message de succès
                const successMessage = document.createElement('div');
                successMessage.className = 'alert alert-success mb-3';
                successMessage.innerHTML = `
                    <i class="fas fa-check-circle"></i> 
                    Disponibilités vérifiées avec succès. 
                    ${responseData.transporteurs.filter(t => t.disponible).length} transporteurs disponibles.
                `;
                
                elements.transporteursList.parentNode.insertBefore(successMessage, elements.transporteursList);
                
                // Supprimer le message après 5 secondes
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            } else {
                throw new Error(responseData.message || 'Erreur lors de la vérification des disponibilités');
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des disponibilités:', error);
            
            // Afficher un message d'erreur
            if (elements.transporteursList) {
                elements.transporteursList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Erreur: ${error.message || 'Impossible de vérifier les disponibilités'}
                    </div>
                `;
                
                // Recharger les transporteurs après 3 secondes
                setTimeout(() => {
                    loadTransporteurs();
                }, 3000);
            }
        }
    }
    
    // Initialiser l'interface unifiée
    document.addEventListener('DOMContentLoaded', initUnifiedInterface);
})();
