/**
 * Script final pour le widget déplaçable de transporteurs
 * - Widget en bulle déplaçable
 * - Affichage des transporteurs sélectionnés dans la prestation
 */

(function() {
    console.log("=== WIDGET DÉPLAÇABLE DE TRANSPORTEURS ===");
    
    // Configuration
    const config = {
        draggable: true,        // Widget déplaçable
        resizable: true,        // Widget redimensionnable
        minimizable: true,      // Widget minimisable
        closeButton: true,      // Bouton pour fermer le widget
        saveButton: true,       // Bouton pour sauvegarder la sélection
        defaultPosition: {      // Position par défaut
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)'
        },
        minWidth: '300px',      // Largeur minimale
        minHeight: '400px',     // Hauteur minimale
        zIndex: 9999            // Z-index pour être au-dessus de tout
    };
    
    // État du widget
    const state = {
        isOpen: false,          // Widget ouvert ou fermé
        isMinimized: false,     // Widget minimisé ou non
        isDragging: false,      // Widget en cours de déplacement
        isResizing: false,      // Widget en cours de redimensionnement
        dragOffset: {           // Offset pour le déplacement
            x: 0,
            y: 0
        },
        transporteurs: [],      // Liste des transporteurs
        selectedTransporteurs: [] // Transporteurs sélectionnés
    };
    
    // Éléments du DOM
    const elements = {
        modal: null,            // Élément principal du widget
        header: null,           // En-tête du widget
        content: null,          // Contenu du widget
        footer: null,           // Pied du widget
        closeBtn: null,         // Bouton de fermeture
        minimizeBtn: null,      // Bouton de minimisation
        saveBtn: null,          // Bouton de sauvegarde
        resizeHandle: null,     // Poignée de redimensionnement
        searchInput: null,      // Champ de recherche
        clearSearchBtn: null,   // Bouton pour effacer la recherche
        filterBtns: null,       // Boutons de filtre
        transporteursList: null, // Liste des transporteurs
        counterElement: null,   // Compteur de transporteurs sélectionnés
        checkAvailabilityBtn: null, // Bouton de vérification des disponibilités
        viewCalendarBtn: null,  // Bouton pour voir le calendrier
        floatingBtn: null,      // Bouton flottant
        selectedDisplay: null   // Affichage des transporteurs sélectionnés
    };
    
    // Fonction pour nettoyer les anciens widgets
    function cleanupOldWidgets() {
        // Supprimer les anciens widgets s'ils existent
        const oldWidgets = document.querySelectorAll('.transporteurs-widget');
        oldWidgets.forEach(widget => widget.remove());
        
        // Supprimer les anciens boutons flottants s'ils existent
        const oldButtons = document.querySelectorAll('.transporteurs-toggle-btn');
        oldButtons.forEach(button => button.remove());
    }
    
    // Fonction pour créer les styles CSS
    function createStyles() {
        const styleElement = document.createElement('style');
        styleElement.dataset.for = 'transporteurs-widget';
        
        styleElement.textContent = `
            /* Styles pour le widget */
            .transporteurs-widget {
                position: fixed;
                display: flex;
                flex-direction: column;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                z-index: ${config.zIndex};
                overflow: hidden;
                transition: all 0.3s ease;
                max-height: 80vh;
            }
            
            /* En-tête du widget */
            .transporteurs-widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background-color: #3498db;
                color: white;
                cursor: move;
                user-select: none;
            }
            
            .transporteurs-widget-title {
                font-weight: bold;
                font-size: 16px;
                margin: 0;
            }
            
            .transporteurs-widget-controls {
                display: flex;
                gap: 5px;
            }
            
            .transporteurs-widget-controls button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 14px;
                padding: 2px 5px;
                border-radius: 3px;
                transition: background-color 0.2s;
            }
            
            .transporteurs-widget-controls button:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            
            /* Contenu du widget */
            .transporteurs-widget-content {
                display: flex;
                flex-direction: column;
                padding: 15px;
                overflow-y: auto;
                flex: 1;
            }
            
            /* Pied du widget */
            .transporteurs-widget-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background-color: #f5f5f5;
                border-top: 1px solid #ddd;
            }
            
            /* Poignée de redimensionnement */
            .transporteurs-widget-resize {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 15px;
                height: 15px;
                cursor: nwse-resize;
                background: linear-gradient(135deg, transparent 50%, #3498db 50%);
            }
            
            /* Barre de recherche */
            .transporteurs-search-bar {
                display: flex;
                margin-bottom: 15px;
                position: relative;
            }
            
            .transporteurs-search-bar input {
                flex: 1;
                padding: 8px 30px 8px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .transporteurs-search-bar .clear-search {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
            }
            
            /* Filtres */
            .transporteurs-filters {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .transporteurs-filters button {
                padding: 5px 10px;
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .transporteurs-filters button.active {
                background-color: #3498db;
                color: white;
                border-color: #3498db;
            }
            
            /* Liste des transporteurs */
            .transporteurs-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 15px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .transporteur-item {
                display: flex;
                align-items: center;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .transporteur-item:hover {
                background-color: #f9f9f9;
            }
            
            .transporteur-item.selected {
                background-color: #e1f0fa;
                border-color: #3498db;
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
                margin-bottom: 3px;
            }
            
            .transporteur-vehicle {
                font-size: 12px;
                color: #666;
            }
            
            /* Compteur */
            .transporteurs-counter {
                font-size: 14px;
                color: #666;
            }
            
            /* Actions */
            .transporteurs-actions {
                display: flex;
                gap: 10px;
            }
            
            .transporteurs-actions button {
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .transporteurs-actions button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .transporteurs-actions button.primary {
                background-color: #3498db;
                color: white;
            }
            
            .transporteurs-actions button.secondary {
                background-color: #f5f5f5;
                border: 1px solid #ddd;
            }
            
            /* Widget minimisé */
            .transporteurs-widget.minimized {
                height: auto !important;
                width: auto !important;
            }
            
            /* Affichage des transporteurs sélectionnés */
            .transporteurs-selected-display {
                margin-top: 15px;
                padding: 10px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .transporteurs-selected-display h5 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                color: #333;
            }
            
            .transporteurs-selected-display ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .transporteurs-selected-display li {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px 0;
                border-bottom: 1px solid #eee;
            }
            
            .transporteurs-selected-display li:last-child {
                border-bottom: none;
            }
            
            /* Bouton flottant */
            .transporteurs-toggle-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #3498db;
                color: white;
                border: none;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                z-index: ${config.zIndex - 1};
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 24px;
                transition: all 0.3s ease;
            }
            
            .transporteurs-toggle-btn:hover {
                transform: scale(1.1);
                background-color: #2980b9;
            }
            
            .transporteurs-toggle-btn .badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #e74c3c;
                color: white;
                border-radius: 50%;
                width: 25px;
                height: 25px;
                font-size: 12px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            /* Alertes */
            .alert {
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .alert-info {
                background-color: #d9edf7;
                border: 1px solid #bce8f1;
                color: #31708f;
            }
            
            .alert-warning {
                background-color: #fcf8e3;
                border: 1px solid #faebcc;
                color: #8a6d3b;
            }
            
            .alert-danger {
                background-color: #f2dede;
                border: 1px solid #ebccd1;
                color: #a94442;
            }
            
            /* Badges */
            .badge {
                padding: 3px 7px;
                border-radius: 10px;
                font-size: 12px;
            }
            
            .badge-success {
                background-color: #5cb85c;
                color: white;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    // Fonction pour créer le widget
    function createWidget() {
        // Créer le conteneur principal
        const widget = document.createElement('div');
        widget.className = 'transporteurs-widget';
        widget.style.width = config.minWidth;
        widget.style.height = config.minHeight;
        widget.style.top = '20px';  // Position en haut
        widget.style.right = 'auto'; // Annuler right
        widget.style.left = '20px';  // Position à gauche
        widget.style.transform = 'none'; // Pas de transformation nécessaire
        
        // Créer l'en-tête
        const header = document.createElement('div');
        header.className = 'transporteurs-widget-header';
        
        const title = document.createElement('h3');
        title.className = 'transporteurs-widget-title';
        title.textContent = 'Sélection des transporteurs';
        
        const controls = document.createElement('div');
        controls.className = 'transporteurs-widget-controls';
        
        // Bouton de minimisation
        if (config.minimizable) {
            const minimizeBtn = document.createElement('button');
            minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
            minimizeBtn.title = 'Minimiser';
            controls.appendChild(minimizeBtn);
            elements.minimizeBtn = minimizeBtn;
        }
        
        // Bouton de fermeture
        if (config.closeButton) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.title = 'Fermer';
            controls.appendChild(closeBtn);
            elements.closeBtn = closeBtn;
        }
        
        header.appendChild(title);
        header.appendChild(controls);
        
        // Créer le contenu
        const content = document.createElement('div');
        content.className = 'transporteurs-widget-content';
        
        // Boutons d'action
        const actions = document.createElement('div');
        actions.className = 'transporteurs-actions';
        
        const checkAvailabilityBtn = document.createElement('button');
        checkAvailabilityBtn.className = 'secondary';
        checkAvailabilityBtn.id = 'check-availability-btn';
        checkAvailabilityBtn.textContent = 'Vérifier disponibilités';
        actions.appendChild(checkAvailabilityBtn);
        
        // Barre de recherche
        const searchContainer = document.createElement('div');
        searchContainer.className = 'transporteurs-search-bar';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Rechercher un transporteur...';
        
        const clearSearchBtn = document.createElement('button');
        clearSearchBtn.className = 'clear-search';
        clearSearchBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearSearchBtn.title = 'Effacer la recherche';
        
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(clearSearchBtn);
        
        // Boutons de filtre
        const filterContainer = document.createElement('div');
        filterContainer.className = 'transporteurs-filters';
        
        const allFilterBtn = document.createElement('button');
        allFilterBtn.className = 'active';
        allFilterBtn.dataset.filter = 'tous';
        allFilterBtn.textContent = 'Tous';
        
        const availableFilterBtn = document.createElement('button');
        availableFilterBtn.dataset.filter = 'disponibles';
        availableFilterBtn.textContent = 'Disponibles';
        
        filterContainer.appendChild(allFilterBtn);
        filterContainer.appendChild(availableFilterBtn);
        
        // Liste des transporteurs
        const transporteursList = document.createElement('div');
        transporteursList.className = 'transporteurs-list';
        
        // Ajouter les éléments au contenu
        content.appendChild(actions);
        content.appendChild(searchContainer);
        content.appendChild(filterContainer);
        content.appendChild(transporteursList);
        
        // Créer le pied
        const footer = document.createElement('div');
        footer.className = 'transporteurs-widget-footer';
        
        const counter = document.createElement('div');
        counter.className = 'transporteurs-counter';
        counter.textContent = '0 transporteur(s) sélectionné(s)';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'primary';
        saveBtn.textContent = 'Valider la sélection';
        saveBtn.disabled = true;
        
        footer.appendChild(counter);
        footer.appendChild(saveBtn);
        
        // Poignée de redimensionnement
        if (config.resizable) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'transporteurs-widget-resize';
            widget.appendChild(resizeHandle);
            elements.resizeHandle = resizeHandle;
        }
        
        // Assembler le widget
        widget.appendChild(header);
        widget.appendChild(content);
        widget.appendChild(footer);
        document.body.appendChild(widget);
        
        // Stocker les références
        elements.modal = widget;
        elements.header = header;
        elements.content = content;
        elements.footer = footer;
        elements.searchInput = searchInput;
        elements.clearSearchBtn = clearSearchBtn;
        elements.filterBtns = [allFilterBtn, availableFilterBtn];
        elements.transporteursList = transporteursList;
        elements.counterElement = counter;
        elements.saveBtn = saveBtn;
        elements.checkAvailabilityBtn = actions.querySelector('#check-availability-btn');
        elements.viewCalendarBtn = actions.querySelector('#view-calendar-btn');
    }
    
    // Fonction pour créer le bouton flottant
    function createFloatingButton() {
        const button = document.createElement('button');
        button.className = 'transporteurs-toggle-btn';
        button.innerHTML = '<i class="fas fa-truck"></i>';
        button.title = 'Sélectionner des transporteurs';
        
        // Badge pour afficher le nombre de transporteurs sélectionnés
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = '0';
        badge.style.display = 'none';
        
        button.appendChild(badge);
        document.body.appendChild(button);
        
        // Stocker la référence
        elements.floatingBtn = button;
        
        return {
            button,
            updateBadge: function() {
                const count = state.selectedTransporteurs.length;
                badge.textContent = count.toString();
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        };
    }
    
    // Fonction pour initialiser les événements de déplacement
    function initDragEvents() {
        if (!config.draggable || !elements.header) return;
        
        elements.header.addEventListener('mousedown', function(e) {
            // Ignorer si on clique sur un bouton
            if (e.target.closest('button')) return;
            
            state.isDragging = true;
            
            const rect = elements.modal.getBoundingClientRect();
            state.dragOffset.x = e.clientX - rect.left;
            state.dragOffset.y = e.clientY - rect.top;
            
            elements.modal.style.transition = 'none';
            elements.modal.style.transform = 'none';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!state.isDragging) return;
            
            const x = e.clientX - state.dragOffset.x;
            const y = e.clientY - state.dragOffset.y;
            
            // Limiter le déplacement à l'intérieur de la fenêtre
            const maxX = window.innerWidth - elements.modal.offsetWidth;
            const maxY = window.innerHeight - elements.modal.offsetHeight;
            
            elements.modal.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            elements.modal.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        });
        
        document.addEventListener('mouseup', function() {
            if (state.isDragging) {
                state.isDragging = false;
                elements.modal.style.transition = 'all 0.3s ease';
            }
        });
    }
    
    // Fonction pour initialiser les événements de redimensionnement
    function initResizeEvents() {
        if (!config.resizable || !elements.resizeHandle) return;
        
        elements.resizeHandle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            state.isResizing = true;
            
            elements.modal.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!state.isResizing) return;
            
            const width = e.clientX - elements.modal.getBoundingClientRect().left;
            const height = e.clientY - elements.modal.getBoundingClientRect().top;
            
            // Appliquer les dimensions minimales
            elements.modal.style.width = Math.max(parseInt(config.minWidth), width) + 'px';
            elements.modal.style.height = Math.max(parseInt(config.minHeight), height) + 'px';
        });
        
        document.addEventListener('mouseup', function() {
            if (state.isResizing) {
                state.isResizing = false;
                elements.modal.style.transition = 'all 0.3s ease';
            }
        });
    }
    
    // Fonction pour initialiser les contrôles du widget
    function initControlEvents() {
        // Bouton de fermeture
        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', closeWidget);
        }
        
        // Bouton de minimisation
        if (elements.minimizeBtn) {
            elements.minimizeBtn.addEventListener('click', toggleMinimize);
        }
        
        // Bouton de sauvegarde
        if (elements.saveBtn) {
            elements.saveBtn.addEventListener('click', saveSelection);
        }
        
        // Champ de recherche
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', function() {
                filterTransporteurs(this.value.toLowerCase());
            });
        }
        
        // Bouton pour effacer la recherche
        if (elements.clearSearchBtn) {
            elements.clearSearchBtn.addEventListener('click', function() {
                if (elements.searchInput) {
                    elements.searchInput.value = '';
                    filterTransporteurs('');
                }
            });
        }
        
        // Boutons de filtre
        if (elements.filterBtns) {
            elements.filterBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    elements.filterBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    const filter = this.dataset.filter;
                    const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
                    
                    filterTransporteurs(searchTerm, filter);
                });
            });
        }
        
        // Bouton de vérification des disponibilités
        if (elements.checkAvailabilityBtn) {
            elements.checkAvailabilityBtn.addEventListener('click', checkAvailability);
        }
        
        // Bouton pour voir le calendrier
        if (elements.viewCalendarBtn) {
            elements.viewCalendarBtn.addEventListener('click', function() {
                window.location.href = '/calendrier';
            });
        }
        
        // Bouton flottant
        if (elements.floatingBtn) {
            elements.floatingBtn.addEventListener('click', function() {
                if (state.isOpen) {
                    closeWidget();
                } else {
                    openWidget();
                }
            });
        }
    }
    
    // Fonction pour minimiser/maximiser le widget
    function toggleMinimize() {
        state.isMinimized = !state.isMinimized;
        
        if (elements.modal) {
            if (state.isMinimized) {
                elements.modal.classList.add('minimized');
                elements.content.style.display = 'none';
                elements.footer.style.display = 'none';
                if (elements.resizeHandle) {
                    elements.resizeHandle.style.display = 'none';
                }
                if (elements.minimizeBtn) {
                    elements.minimizeBtn.innerHTML = '<i class="fas fa-expand"></i>';
                    elements.minimizeBtn.title = 'Restaurer';
                }
            } else {
                elements.modal.classList.remove('minimized');
                elements.content.style.display = 'flex';
                elements.footer.style.display = 'flex';
                if (elements.resizeHandle) {
                    elements.resizeHandle.style.display = 'block';
                }
                if (elements.minimizeBtn) {
                    elements.minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
                    elements.minimizeBtn.title = 'Minimiser';
                }
            }
        }
    }
    
    // Fonction pour fermer le widget
    function closeWidget() {
        if (elements.modal) {
            elements.modal.style.display = 'none';
        }
        state.isOpen = false;
    }
    
    // Fonction pour ouvrir le widget
    function openWidget() {
        if (elements.modal) {
            elements.modal.style.display = 'flex';
        } else {
            createWidget();
            initDragEvents();
            initResizeEvents();
            initControlEvents();
        }
        state.isOpen = true;
        
        // Charger les transporteurs si ce n'est pas déjà fait
        if (state.transporteurs.length === 0) {
            loadTransporteurs();
        }
    }
    
    // Fonction pour charger les transporteurs depuis l'API
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
                
                // Charger les transporteurs déjà sélectionnés
                loadSelectedTransporteurs();
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
            
            // Charger les transporteurs déjà sélectionnés
            loadSelectedTransporteurs();
        }
    }
    
    // Fonction pour charger les transporteurs déjà sélectionnés
    function loadSelectedTransporteurs() {
        // Vérifier s'il y a un champ caché avec des transporteurs déjà sélectionnés
        const hiddenInput = document.querySelector('input[name="transporteur_ids"]');
        if (hiddenInput && hiddenInput.value) {
            try {
                const transporteurIds = JSON.parse(hiddenInput.value);
                
                // Marquer ces transporteurs comme sélectionnés
                transporteurIds.forEach(id => {
                    const transporteur = state.transporteurs.find(t => t.id === parseInt(id));
                    if (transporteur && !state.selectedTransporteurs.some(t => t.id === transporteur.id)) {
                        state.selectedTransporteurs.push(transporteur);
                    }
                });
                
                // Mettre à jour l'affichage
                updateTransporteursSelection();
                updateCounter();
                
                // Mettre à jour le bouton de sauvegarde
                if (elements.saveBtn) {
                    elements.saveBtn.disabled = state.selectedTransporteurs.length === 0;
                }
                
                // Mettre à jour le badge du bouton flottant
                updateFloatingButtonBadge();
                
                // Créer l'affichage des transporteurs sélectionnés
                createSelectedTransporteursDisplay();
            } catch (error) {
                console.error('Erreur lors du chargement des transporteurs sélectionnés:', error);
            }
        }
    }
    
    // Fonction pour filtrer les transporteurs
    function filterTransporteurs(searchTerm = '', filter = 'tous') {
        if (!elements.transporteursList) return;
        
        const items = elements.transporteursList.querySelectorAll('.transporteur-item');
        let visibleCount = 0;
        
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
            const visible = matchesSearch && matchesFilter;
            item.style.display = visible ? '' : 'none';
            
            if (visible) visibleCount++;
        });
        
        // Afficher un message si aucun résultat
        if (visibleCount === 0) {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'alert alert-warning';
            noResultsMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Aucun transporteur ne correspond aux critères';
            
            // Supprimer l'ancien message s'il existe
            const oldMsg = elements.transporteursList.querySelector('.alert');
            if (oldMsg) oldMsg.remove();
            
            elements.transporteursList.appendChild(noResultsMsg);
        } else {
            // Supprimer le message s'il existe
            const msg = elements.transporteursList.querySelector('.alert');
            if (msg) msg.remove();
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
        
        // Mettre à jour le bouton de sauvegarde
        if (elements.saveBtn) {
            elements.saveBtn.disabled = state.selectedTransporteurs.length === 0;
        }
        
        // Mettre à jour le badge du bouton flottant
        updateFloatingButtonBadge();
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
        if (!elements.counterElement) return;
        
        const count = state.selectedTransporteurs.length;
        elements.counterElement.textContent = `${count} transporteur(s) sélectionné(s)`;
    }
    
    // Fonction pour mettre à jour le badge du bouton flottant
    function updateFloatingButtonBadge() {
        const floatingButton = elements.floatingBtn;
        if (!floatingButton) return;
        
        const badge = floatingButton.querySelector('.badge');
        if (!badge) return;
        
        const count = state.selectedTransporteurs.length;
        badge.textContent = count.toString();
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
    
    // Fonction pour créer l'affichage des transporteurs sélectionnés
    function createSelectedTransporteursDisplay() {
        // Vérifier s'il y a des transporteurs sélectionnés
        if (state.selectedTransporteurs.length === 0) {
            // Si l'affichage existe déjà, le supprimer
            if (elements.selectedDisplay) {
                elements.selectedDisplay.remove();
                elements.selectedDisplay = null;
            }
            return;
        }
        
        // Créer l'affichage s'il n'existe pas
        if (!elements.selectedDisplay) {
            const display = document.createElement('div');
            display.className = 'transporteurs-selected-display';
            
            const title = document.createElement('h5');
            title.textContent = 'Transporteurs sélectionnés';
            
            const list = document.createElement('ul');
            
            display.appendChild(title);
            display.appendChild(list);
            
            elements.selectedDisplay = display;
            elements.content.appendChild(display);
        }
        
        // Mettre à jour la liste des transporteurs sélectionnés
        const list = elements.selectedDisplay.querySelector('ul');
        list.innerHTML = '';
        
        state.selectedTransporteurs.forEach(transporteur => {
            const item = document.createElement('li');
            item.innerHTML = `
                <span>${transporteur.nom} ${transporteur.prenom}</span>
                <span class="badge badge-success">${transporteur.vehicule}</span>
            `;
            list.appendChild(item);
        });
    }
    
    // Fonction pour sauvegarder la sélection
    function saveSelection() {
        try {
            // Vérifier s'il y a des transporteurs sélectionnés
            if (state.selectedTransporteurs.length === 0) {
                alert('Veuillez sélectionner au moins un transporteur');
                return;
            }
            
            // Vérifier que les données sont valides
            if (!Array.isArray(state.selectedTransporteurs)) {
                console.error('Format de données invalide');
                return;
            }
            
            // Vérifier chaque transporteur
            for (const transporteur of state.selectedTransporteurs) {
                if (!transporteur.id || !transporteur.nom) {
                    console.error('Données de transporteur invalides');
                    return;
                }
            }
            
            // Mettre à jour le widget et le formulaire
            updateTransporteursSelection();
            updatePageDisplay();
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Une erreur est survenue lors de la sauvegarde des transporteurs');
        }
        
        console.log('Transporteurs sélectionnés:', state.selectedTransporteurs);
        
        // Trouver ou créer le champ caché pour stocker les IDs des transporteurs
        let hiddenInput = document.querySelector('input[name="transporteur_ids"]');
        
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'transporteur_ids';
            
            // Ajouter le champ caché au formulaire
            const form = document.querySelector('form');
            if (form) {
                form.appendChild(hiddenInput);
            } else {
                document.body.appendChild(hiddenInput);
            }
        }
        
        // Mettre à jour la valeur du champ caché
        hiddenInput.value = JSON.stringify(state.selectedTransporteurs.map(t => t.id));
        
        // Créer ou mettre à jour l'affichage des transporteurs sélectionnés dans la page
        updatePageDisplay();
        
        // Fermer le widget
        closeWidget();
        
        // Afficher un message de confirmation
        const toast = document.createElement('div');
        toast.className = 'alert alert-success';
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.zIndex = '9999';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i> 
            ${state.selectedTransporteurs.length} transporteur(s) sélectionné(s) avec succès
        `;
        
        document.body.appendChild(toast);
        
        // Supprimer le message après 3 secondes
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // Fonction pour mettre à jour l'affichage des transporteurs dans la page
    function updatePageDisplay() {
        // Rechercher l'élément d'affichage des transporteurs dans la page
        let displayContainer = document.querySelector('.transporteurs-page-display');
        
        // Créer l'élément s'il n'existe pas
        if (!displayContainer) {
            displayContainer = document.createElement('div');
            displayContainer.className = 'transporteurs-page-display';
            
            // Trouver un bon emplacement pour l'affichage
            const formGroups = document.querySelectorAll('.form-group, .mb-3');
            let targetElement = null;
            
            // Chercher un groupe de formulaire qui contient "transporteur" dans son texte
            for (const group of formGroups) {
                if (group.textContent.toLowerCase().includes('transporteur')) {
                    targetElement = group;
                    break;
                }
            }
            
            // Si on n'a pas trouvé, prendre le premier groupe après la moitié du formulaire
            if (!targetElement && formGroups.length > 0) {
                const midIndex = Math.floor(formGroups.length / 2);
                targetElement = formGroups[midIndex];
            }
            
            // Insérer après l'élément cible
            if (targetElement) {
                targetElement.parentNode.insertBefore(displayContainer, targetElement.nextSibling);
            } else {
                // Fallback: ajouter à la fin du formulaire
                const form = document.querySelector('form');
                if (form) {
                    form.appendChild(displayContainer);
                }
            }
        }
        
        // Mettre à jour le contenu
        displayContainer.innerHTML = `
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <i class="fas fa-truck"></i> Transporteurs sélectionnés (${state.selectedTransporteurs.length})
                </div>
                <div class="card-body">
                    ${state.selectedTransporteurs.length === 0 
                        ? '<p class="text-muted">Aucun transporteur sélectionné</p>' 
                        : '<ul class="list-group">' + 
                            state.selectedTransporteurs.map(t => 
                                `<li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${t.nom} ${t.prenom}
                                    <span class="badge bg-success rounded-pill">${t.vehicule}</span>
                                </li>`
                            ).join('') + 
                          '</ul>'
                    }
                </div>
                <div class="card-footer">
                    <button type="button" class="btn btn-sm btn-outline-primary edit-transporteurs-btn">
                        <i class="fas fa-edit"></i> Modifier la sélection
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter un événement au bouton de modification
        const editBtn = displayContainer.querySelector('.edit-transporteurs-btn');
        if (editBtn) {
            editBtn.addEventListener('click', openWidget);
        }
    }
    
    // Fonction pour vérifier les disponibilités
    function checkAvailability() {
        // Vérifier s'il y a des transporteurs sélectionnés
        if (state.selectedTransporteurs.length === 0) {
            alert('Veuillez sélectionner au moins un transporteur');
            return;
        }
        
        // Créer un message de chargement
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'alert alert-info';
        loadingMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification des disponibilités en cours...';
        
        // Afficher le message de chargement
        elements.transporteursList.innerHTML = '';
        elements.transporteursList.appendChild(loadingMsg);
        
        // Récupérer les dates de la prestation
        const dateDebut = document.querySelector('input[name="date_debut"]')?.value;
        const dateFin = document.querySelector('input[name="date_fin"]')?.value;
        
        if (!dateDebut || !dateFin) {
            elements.transporteursList.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> Veuillez d\'abord remplir les dates de début et de fin</div>';
            return;
        }
        
        // Appeler l'API pour vérifier les disponibilités
        fetch('/api/transporteurs/check-disponibilite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transporteur_ids: state.selectedTransporteurs.map(t => t.id),
                date_debut: dateDebut,
                date_fin: dateFin
            })
        })
        .then(response => response.json())
        .then(data => {
            // Mettre à jour l'affichage
            elements.transporteursList.innerHTML = '';
            
            if (data.success) {
                if (data.disponibles && data.disponibles.length > 0) {
                    // Afficher les transporteurs disponibles
                    const disponiblesMsg = document.createElement('div');
                    disponiblesMsg.className = 'alert alert-success mb-3';
                    disponiblesMsg.innerHTML = '<i class="fas fa-check-circle"></i> Transporteurs disponibles :';
                    elements.transporteursList.appendChild(disponiblesMsg);
                    
                    data.disponibles.forEach(id => {
                        const transporteur = state.transporteurs.find(t => t.id === parseInt(id));
                        if (transporteur) {
                            const item = document.createElement('div');
                            item.className = 'transporteur-item';
                            item.dataset.id = transporteur.id;
                            
                            // Créer le contenu de l'item
                            item.innerHTML = `
                                <div class="transporteur-status">🟢</div>
                                <div class="transporteur-info">
                                    <div class="transporteur-name">${transporteur.nom} ${transporteur.prenom}</div>
                                    <div class="transporteur-vehicle">${transporteur.vehicule}</div>
                                </div>
                            `;
                            
                            // Ajouter l'événement de clic pour sélectionner/désélectionner
                            item.addEventListener('click', function() {
                                toggleTransporteurSelection(transporteur);
                            });
                            
                            // Vérifier si le transporteur est déjà sélectionné
                            if (state.selectedTransporteurs.some(t => t.id === transporteur.id)) {
                                item.classList.add('selected');
                            }
                            
                            elements.transporteursList.appendChild(item);
                        }
                    });
                }
                
                if (data.indisponibles && data.indisponibles.length > 0) {
                    // Afficher les transporteurs indisponibles
                    const indisponiblesMsg = document.createElement('div');
                    indisponiblesMsg.className = 'alert alert-warning mb-3';
                    indisponiblesMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Transporteurs indisponibles :';
                    elements.transporteursList.appendChild(indisponiblesMsg);
                    
                    data.indisponibles.forEach(id => {
                        const transporteur = state.transporteurs.find(t => t.id === parseInt(id));
                        if (transporteur) {
                            const item = document.createElement('div');
                            item.className = 'transporteur-item';
                            item.dataset.id = transporteur.id;
                            
                            // Créer le contenu de l'item
                            item.innerHTML = `
                                <div class="transporteur-status">🟠</div>
                                <div class="transporteur-info">
                                    <div class="transporteur-name">${transporteur.nom} ${transporteur.prenom}</div>
                                    <div class="transporteur-vehicle">${transporteur.vehicule}</div>
                                </div>
                            `;
                            
                            elements.transporteursList.appendChild(item);
                        }
                    });
                }
                
                if ((!data.disponibles || data.disponibles.length === 0) && 
                    (!data.indisponibles || data.indisponibles.length === 0)) {
                    // Aucun transporteur trouvé
                    const noResultsMsg = document.createElement('div');
                    noResultsMsg.className = 'alert alert-info';
                    noResultsMsg.innerHTML = '<i class="fas fa-info-circle"></i> Aucun transporteur trouvé pour cette période';
                    elements.transporteursList.appendChild(noResultsMsg);
                }
            } else {
                // Erreur lors de la vérification
                const errorMsg = document.createElement('div');
                errorMsg.className = 'alert alert-danger';
                errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${data.message || 'Erreur lors de la vérification des disponibilités'}`;
                elements.transporteursList.appendChild(errorMsg);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification des disponibilités:', error);
            
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-danger';
            errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erreur lors de la vérification des disponibilités';
            elements.transporteursList.appendChild(errorMsg);
        });
    }
    
    // Fonction pour créer ou récupérer l'élément transporteursSelect
    function createTransporteursSelectElement() {
        console.log("Vérification de l'élément transporteursSelect...");
        // Vérifier si l'élément existe déjà
        let transporteursSelect = document.getElementById('transporteursSelect');
        
        // S'il n'existe pas, le créer
        if (!transporteursSelect) {
            console.log("Création de l'élément transporteursSelect...");
            transporteursSelect = document.createElement('select');
            transporteursSelect.id = 'transporteursSelect';
            transporteursSelect.name = 'transporteursSelect';
            transporteursSelect.multiple = true;
            transporteursSelect.style.display = 'none'; // Caché visuellement
            
            // Ajouter au formulaire ou au body si pas de formulaire
            const form = document.querySelector('form');
            if (form) {
                form.appendChild(transporteursSelect);
            } else {
                document.body.appendChild(transporteursSelect);
            }
            console.log("Élément transporteursSelect créé avec succès");
        } else {
            console.log("Élément transporteursSelect trouvé");
        }
        
        return transporteursSelect;
    }

    // Fonction d'initialisation du widget
    function initTransporteursWidget() {
        console.log("Initialisation du widget transporteurs...");
        cleanupOldWidgets();
        createStyles();
        const floatingBtn = createFloatingButton();
        
        // Créer ou récupérer l'élément transporteursSelect
        createTransporteursSelectElement();
        
        // Ajouter un délai pour s'assurer que tout est chargé
        setTimeout(() => {
            // Créer le widget mais ne pas l'afficher immédiatement
            createWidget();
            initDragEvents();
            initResizeEvents();
            initControlEvents();
            
            // Charger les transporteurs
            loadTransporteurs();
            
            // Fermer le widget par défaut
            if (elements.modal) {
                elements.modal.style.display = 'none';
            }
            
            console.log("Widget transporteurs initialisé avec succès!");
        }, 500);
    }
    
    // Exposer la fonction d'initialisation globalement
    window.initTransporteursWidget = initTransporteursWidget;
    
    // Initialisation au chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        initTransporteursWidget();
    });
    
    // Écouter l'événement personnalisé pour l'initialisation
    document.addEventListener('initTransporteursWidget', function() {
        console.log("Événement d'initialisation du widget transporteurs reçu");
        initTransporteursWidget();
    });
})();
