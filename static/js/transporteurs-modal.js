/**
 * Script pour la gestion des transporteurs en mode modal déplaçable
 * - Crée un widget déplaçable
 * - Ajoute un bouton de validation
 * - Ne bloque pas le reste de l'interface
 */

(function() {
    console.log("=== WIDGET MODAL TRANSPORTEURS ===");
    
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
        minWidth: '400px',      // Largeur minimale
        minHeight: '300px',     // Hauteur minimale
        defaultWidth: '600px',  // Largeur par défaut
        defaultHeight: '500px', // Hauteur par défaut
        zIndex: 9999            // Z-index (pour être au-dessus des autres éléments)
    };
    
    // État du widget
    let state = {
        isOpen: false,          // Widget ouvert ou fermé
        isDragging: false,      // En cours de déplacement
        isResizing: false,      // En cours de redimensionnement
        isMinimized: false,     // Minimisé ou non
        position: {             // Position actuelle
            x: 0,
            y: 0
        },
        size: {                 // Taille actuelle
            width: 0,
            height: 0
        },
        dragOffset: {           // Offset pour le déplacement
            x: 0,
            y: 0
        },
        selectedTransporteurs: [],  // Transporteurs sélectionnés
        transporteurs: [],          // Liste des transporteurs
        filteredTransporteurs: [],  // Transporteurs filtrés
        searchTerm: '',             // Terme de recherche
        activeFilter: 'tous'        // Filtre actif
    };
    
    // Éléments DOM
    let elements = {
        modal: null,            // Conteneur principal
        header: null,           // En-tête du widget
        content: null,          // Contenu du widget
        footer: null,           // Pied du widget
        closeBtn: null,         // Bouton de fermeture
        minimizeBtn: null,      // Bouton de minimisation
        saveBtn: null,          // Bouton de sauvegarde
        transporteursList: null, // Liste des transporteurs
        searchInput: null,      // Champ de recherche
        filterBtns: null,       // Boutons de filtre
        resizeHandle: null,     // Poignée de redimensionnement
        counterElement: null    // Compteur de transporteurs sélectionnés
    };
    
    // Fonction pour nettoyer les anciens widgets
    function cleanupOldWidgets() {
        // Supprimer les anciens widgets
        document.querySelectorAll('.transporteurs-modal-widget').forEach(el => el.remove());
        
        // Supprimer les styles associés
        document.querySelectorAll('style[data-for="transporteurs-modal"]').forEach(el => el.remove());
    }
    
    // Fonction pour créer les styles CSS
    function createStyles() {
        const style = document.createElement('style');
        style.setAttribute('data-for', 'transporteurs-modal');
        style.textContent = `
            .transporteurs-modal-widget {
                position: fixed;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transition: all 0.3s ease;
                z-index: ${config.zIndex};
            }
            
            .transporteurs-modal-widget.minimized {
                height: 40px !important;
                width: 200px !important;
                overflow: hidden;
            }
            
            .transporteurs-modal-header {
                background-color: #007bff;
                color: white;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                user-select: none;
            }
            
            .transporteurs-modal-title {
                margin: 0;
                font-size: 16px;
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .transporteurs-modal-controls {
                display: flex;
                gap: 5px;
            }
            
            .transporteurs-modal-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 14px;
                padding: 2px 5px;
                border-radius: 3px;
                transition: background-color 0.2s;
            }
            
            .transporteurs-modal-btn:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            
            .transporteurs-modal-content {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .transporteurs-modal-footer {
                padding: 10px 15px;
                border-top: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .transporteurs-modal-resize-handle {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 20px;
                height: 20px;
                cursor: nwse-resize;
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="%23ccc" d="M22 22H16V16H22V22ZM14 22H8V16H14V22ZM6 22H0V16H6V22ZM22 14H16V8H22V14ZM14 14H8V8H14V14ZM6 14H0V8H6V14ZM22 6H16V0H22V6ZM14 6H8V0H14V6ZM6 6H0V0H6V6Z"/></svg>');
                background-repeat: no-repeat;
                background-position: bottom right;
            }
            
            .transporteurs-search-container {
                display: flex;
                gap: 5px;
            }
            
            .transporteurs-search-input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
            }
            
            .transporteurs-filter-container {
                display: flex;
                gap: 5px;
            }
            
            .transporteurs-filter-btn {
                padding: 6px 12px;
                border: 1px solid #007bff;
                background-color: transparent;
                color: #007bff;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .transporteurs-filter-btn.active {
                background-color: #007bff;
                color: white;
            }
            
            .transporteurs-list {
                border: 1px solid #ced4da;
                border-radius: 4px;
                min-height: 200px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .transporteur-item {
                padding: 8px 12px;
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
            
            .transporteurs-counter {
                font-size: 14px;
                color: #007bff;
                font-weight: bold;
            }
            
            .transporteurs-save-btn {
                padding: 8px 16px;
                background-color: #28a745;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .transporteurs-save-btn:hover {
                background-color: #218838;
            }
            
            .transporteurs-save-btn:disabled {
                background-color: #6c757d;
                cursor: not-allowed;
            }
            
            .transporteurs-toggle-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #007bff;
                color: white;
                border: none;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                z-index: ${config.zIndex - 1};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: all 0.3s ease;
            }
            
            .transporteurs-toggle-btn:hover {
                background-color: #0069d9;
                transform: scale(1.05);
            }
            
            .transporteurs-toggle-btn .badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #dc3545;
                color: white;
                border-radius: 50%;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fonction pour créer le widget modal
    function createModalWidget() {
        // Créer le conteneur principal
        const modal = document.createElement('div');
        modal.className = 'transporteurs-modal-widget';
        modal.style.width = config.defaultWidth;
        modal.style.height = config.defaultHeight;
        modal.style.top = config.defaultPosition.top;
        modal.style.left = config.defaultPosition.left;
        modal.style.transform = config.defaultPosition.transform;
        
        // Créer l'en-tête
        const header = document.createElement('div');
        header.className = 'transporteurs-modal-header';
        
        const title = document.createElement('h3');
        title.className = 'transporteurs-modal-title';
        title.textContent = 'Sélection des transporteurs';
        
        const controls = document.createElement('div');
        controls.className = 'transporteurs-modal-controls';
        
        // Bouton de minimisation
        if (config.minimizable) {
            const minimizeBtn = document.createElement('button');
            minimizeBtn.className = 'transporteurs-modal-btn';
            minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
            minimizeBtn.title = 'Minimiser';
            controls.appendChild(minimizeBtn);
            elements.minimizeBtn = minimizeBtn;
        }
        
        // Bouton de fermeture
        if (config.closeButton) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'transporteurs-modal-btn';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.title = 'Fermer';
            controls.appendChild(closeBtn);
            elements.closeBtn = closeBtn;
        }
        
        header.appendChild(title);
        header.appendChild(controls);
        
        // Créer le contenu
        const content = document.createElement('div');
        content.className = 'transporteurs-modal-content';
        
        // Barre de recherche
        const searchContainer = document.createElement('div');
        searchContainer.className = 'transporteurs-search-container';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'transporteurs-search-input';
        searchInput.placeholder = 'Rechercher un transporteur...';
        
        const clearSearchBtn = document.createElement('button');
        clearSearchBtn.className = 'transporteurs-modal-btn';
        clearSearchBtn.style.color = '#6c757d';
        clearSearchBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearSearchBtn.title = 'Effacer la recherche';
        
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(clearSearchBtn);
        
        // Boutons de filtre
        const filterContainer = document.createElement('div');
        filterContainer.className = 'transporteurs-filter-container';
        
        const allFilterBtn = document.createElement('button');
        allFilterBtn.className = 'transporteurs-filter-btn active';
        allFilterBtn.dataset.filter = 'tous';
        allFilterBtn.textContent = 'Tous';
        
        const availableFilterBtn = document.createElement('button');
        availableFilterBtn.className = 'transporteurs-filter-btn';
        availableFilterBtn.dataset.filter = 'disponibles';
        availableFilterBtn.textContent = 'Disponibles';
        
        filterContainer.appendChild(allFilterBtn);
        filterContainer.appendChild(availableFilterBtn);
        
        elements.filterBtns = [allFilterBtn, availableFilterBtn];
        
        // Liste des transporteurs
        const transporteursList = document.createElement('div');
        transporteursList.className = 'transporteurs-list';
        
        // Ajouter les éléments au contenu
        content.appendChild(searchContainer);
        content.appendChild(filterContainer);
        content.appendChild(transporteursList);
        
        // Créer le pied
        const footer = document.createElement('div');
        footer.className = 'transporteurs-modal-footer';
        
        const counter = document.createElement('div');
        counter.className = 'transporteurs-counter';
        counter.textContent = '0 transporteur(s) sélectionné(s)';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'transporteurs-save-btn';
        saveBtn.textContent = 'Valider la sélection';
        saveBtn.disabled = true;
        
        footer.appendChild(counter);
        footer.appendChild(saveBtn);
        
        // Poignée de redimensionnement
        if (config.resizable) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'transporteurs-modal-resize-handle';
            modal.appendChild(resizeHandle);
            elements.resizeHandle = resizeHandle;
        }
        
        // Assembler le widget
        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(footer);
        
        // Ajouter au document
        document.body.appendChild(modal);
        
        // Stocker les références
        elements.modal = modal;
        elements.header = header;
        elements.content = content;
        elements.footer = footer;
        elements.saveBtn = saveBtn;
        elements.transporteursList = transporteursList;
        elements.searchInput = searchInput;
        elements.clearSearchBtn = clearSearchBtn;
        elements.counterElement = counter;
        
        // Mettre à jour l'état
        state.isOpen = true;
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
        
        // Événement pour ouvrir/fermer le widget
        button.addEventListener('click', function() {
            if (state.isOpen) {
                closeWidget();
            } else {
                openWidget();
            }
        });
        
        // Mettre à jour le badge lorsque des transporteurs sont sélectionnés
        function updateBadge() {
            const count = state.selectedTransporteurs.length;
            badge.textContent = count.toString();
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Exposer la fonction de mise à jour
        return {
            button,
            updateBadge
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
                state.searchTerm = this.value.toLowerCase();
                filterTransporteurs();
            });
        }
        
        // Bouton pour effacer la recherche
        if (elements.clearSearchBtn) {
            elements.clearSearchBtn.addEventListener('click', function() {
                if (elements.searchInput) {
                    elements.searchInput.value = '';
                    state.searchTerm = '';
                    filterTransporteurs();
                }
            });
        }
        
        // Boutons de filtre
        if (elements.filterBtns) {
            elements.filterBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    elements.filterBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    state.activeFilter = this.dataset.filter;
                    filterTransporteurs();
                });
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
            createModalWidget();
            initDragEvents();
            initResizeEvents();
            initControlEvents();
            loadTransporteurs();
        }
        state.isOpen = true;
    }
    
    // Fonction pour charger les transporteurs depuis l'API
    async function loadTransporteurs() {
        try {
            // Afficher un message de chargement
            if (elements.transporteursList) {
                elements.transporteursList.innerHTML = '<div class="transporteur-item">Chargement des transporteurs...</div>';
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
                    <div class="transporteur-item" style="color: #dc3545;">
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
    
    // Fonction pour filtrer les transporteurs
    function filterTransporteurs() {
        if (!state.transporteurs.length) return;
        
        state.filteredTransporteurs = state.transporteurs.filter(transporteur => {
            // Filtre de recherche
            const matchesSearch = state.searchTerm ? 
                (transporteur.nom + ' ' + transporteur.prenom).toLowerCase().includes(state.searchTerm) || 
                transporteur.vehicule.toLowerCase().includes(state.searchTerm) : 
                true;
            
            // Filtre de disponibilité
            const matchesFilter = state.activeFilter === 'tous' || 
                (state.activeFilter === 'disponibles' && transporteur.disponible);
            
            return matchesSearch && matchesFilter;
        });
        
        renderTransporteurs();
    }
    
    // Fonction pour afficher les transporteurs
    function renderTransporteurs() {
        if (!elements.transporteursList) return;
        
        // Vider la liste
        elements.transporteursList.innerHTML = '';
        
        // Si aucun transporteur filtré, afficher un message
        if (!state.filteredTransporteurs || state.filteredTransporteurs.length === 0) {
            elements.transporteursList.innerHTML = '<div class="transporteur-item">Aucun transporteur ne correspond aux critères</div>';
            return;
        }
        
        // Ajouter chaque transporteur à la liste
        state.filteredTransporteurs.forEach(transporteur => {
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
                this.classList.toggle('selected');
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
        
        // Mettre à jour le compteur
        updateCounter();
        
        // Mettre à jour le bouton de sauvegarde
        if (elements.saveBtn) {
            elements.saveBtn.disabled = state.selectedTransporteurs.length === 0;
        }
        
        // Mettre à jour le badge du bouton flottant
        if (window.floatingButton && window.floatingButton.updateBadge) {
            window.floatingButton.updateBadge();
        }
    }
    
    // Fonction pour mettre à jour le compteur
    function updateCounter() {
        if (elements.counterElement) {
            elements.counterElement.textContent = `${state.selectedTransporteurs.length} transporteur(s) sélectionné(s)`;
        }
        
        // Mettre à jour le badge du bouton flottant si disponible
        if (window.floatingButton && window.floatingButton.updateBadge) {
            window.floatingButton.updateBadge();
        }
    }
    
    // Fonction pour sauvegarder la sélection
    function saveSelection() {
        if (state.selectedTransporteurs.length === 0) {
            alert('Veuillez sélectionner au moins un transporteur.');
            return;
        }
        
        // Récupérer les IDs des transporteurs sélectionnés
        const transporteurIds = state.selectedTransporteurs.map(t => t.id);
        
        // Créer ou mettre à jour le champ caché pour stocker les IDs
        let hiddenInput = document.querySelector('input[name="transporteur_ids"]');
        
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'transporteur_ids';
            document.querySelector('form')?.appendChild(hiddenInput);
        }
        
        // Stocker les IDs au format JSON
        hiddenInput.value = JSON.stringify(transporteurIds);
        
        // Créer un élément visible pour montrer les transporteurs sélectionnés
        let selectedTransporteursDisplay = document.getElementById('selected-transporteurs-display');
        
        if (!selectedTransporteursDisplay) {
            selectedTransporteursDisplay = document.createElement('div');
            selectedTransporteursDisplay.id = 'selected-transporteurs-display';
            selectedTransporteursDisplay.className = 'alert alert-success mt-3';
            
            // Trouver un bon endroit pour l'insérer
            const form = document.querySelector('form');
            if (form) {
                // Chercher une section appropriée
                const sections = form.querySelectorAll('.card, .mb-4');
                let inserted = false;
                
                for (const section of sections) {
                    if (section.textContent.includes('Transport') || section.textContent.includes('Déménagement')) {
                        section.appendChild(selectedTransporteursDisplay);
                        inserted = true;
                        break;
                    }
                }
                
                // Si aucune section appropriée n'a été trouvée, l'ajouter à la fin du formulaire
                if (!inserted) {
                    form.appendChild(selectedTransporteursDisplay);
                }
            }
        }
        
        // Mettre à jour l'affichage
        selectedTransporteursDisplay.innerHTML = `
            <h5><i class="fas fa-check-circle"></i> Transporteurs sélectionnés (${state.selectedTransporteurs.length})</h5>
            <ul class="list-group">
                ${state.selectedTransporteurs.map(t => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${t.nom} ${t.prenom} - ${t.vehicule}
                        <span class="badge ${t.disponible ? 'bg-success' : 'bg-warning'} rounded-pill">
                            ${t.disponible ? 'Disponible' : 'Occupé'}
                        </span>
                    </li>
                `).join('')}
            </ul>
            <button type="button" class="btn btn-sm btn-outline-primary mt-2" id="modifier-selection-btn">
                <i class="fas fa-edit"></i> Modifier la sélection
            </button>
        `;
        
        // Ajouter un événement pour rouvrir le widget
        document.getElementById('modifier-selection-btn')?.addEventListener('click', openWidget);
        
        // Fermer le widget
        closeWidget();
        
        console.log('Transporteurs sélectionnés:', state.selectedTransporteurs);
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
                elements.transporteursList.innerHTML = '<div class="transporteur-item">Vérification des disponibilités...</div>';
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
                    state.transporteurs = responseData.transporteurs.map(t => ({
                        id: t.id,
                        nom: t.nom,
                        prenom: t.prenom,
                        vehicule: t.vehicule,
                        disponible: t.disponible
                    }));
                    
                    // Filtrer et afficher les transporteurs
                    filterTransporteurs();
                }
            } else {
                throw new Error(responseData.message || 'Erreur lors de la vérification des disponibilités');
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des disponibilités:', error);
            
            // Afficher un message d'erreur
            if (elements.transporteursList) {
                elements.transporteursList.innerHTML = `
                    <div class="transporteur-item" style="color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 
                        Erreur: ${error.message || 'Impossible de vérifier les disponibilités'}
                    </div>
                `;
            }
        }
    }
    
    // Fonction pour ajouter le bouton de vérification des disponibilités
    function addCheckAvailabilityButton() {
        // Créer le bouton
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-primary';
        button.innerHTML = '<i class="fas fa-sync-alt"></i> Vérifier les disponibilités';
        
        // Ajouter l'événement
        button.addEventListener('click', function() {
            checkAvailability();
            openWidget();
        });
        
        // Trouver un bon endroit pour l'insérer
        const form = document.querySelector('form');
        if (form) {
            // Chercher les champs de date
            const dateDebutField = form.querySelector('input[name="date_debut"]');
            const dateFinField = form.querySelector('input[name="date_fin"]');
            
            if (dateDebutField && dateFinField) {
                // Trouver le parent commun
                const dateDebutParent = dateDebutField.closest('.mb-3, .form-group');
                const dateFinParent = dateFinField.closest('.mb-3, .form-group');
                
                if (dateFinParent) {
                    // Créer un conteneur pour le bouton
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'mb-3 mt-2';
                    buttonContainer.appendChild(button);
                    
                    // Insérer après le champ de date de fin
                    dateFinParent.parentNode.insertBefore(buttonContainer, dateFinParent.nextSibling);
                }
            }
        }
        
        return button;
    }
    
    // Fonction principale d'initialisation
    function init() {
        console.log('Initialisation du widget modal de transporteurs...');
        
        // Nettoyer les anciens widgets
        cleanupOldWidgets();
        
        // Créer les styles CSS
        createStyles();
        
        // Créer le bouton flottant et le stocker dans une variable globale au script
        const floatingBtn = createFloatingButton();
        window.floatingButton = floatingBtn; // Rendre accessible globalement
        
        // Ajouter le bouton de vérification des disponibilités
        const checkButton = addCheckAvailabilityButton();
        
        console.log('Widget modal de transporteurs initialisé');
    }
    
    // Initialiser le widget
    init();
})();
