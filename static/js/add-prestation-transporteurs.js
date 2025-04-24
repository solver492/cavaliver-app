/**
 * Script dédié à la gestion des transporteurs sur la page d'ajout de prestation
 * Ce script est conçu pour fonctionner spécifiquement sur la page d'ajout
 * Il gère:
 * - L'intégration du widget de transporteurs
 * - La synchronisation avec le type de prestation (Standard/Groupage)
 * - La vérification de disponibilité des transporteurs
 */

(function() {
    'use strict';
    
    // Configuration
    const config = {
        apiUrl: '/api/transporteurs/disponibilite',
        debug: true
    };
    
    // Éléments DOM
    const elements = {
        form: document.querySelector('form'),
        prestationTypeSwitch: document.getElementById('prestation-type-switch'),
        dateDebut: document.getElementById('date_debut'),
        dateFin: document.getElementById('date_fin'),
        typeDemenagement: document.getElementById('type_demenagement'),
        transporteursContainer: null,
        transporteursSelect: null,
        radioStandard: null,
        radioGroupage: null,
        floatingBtn: null,
        widgetContainer: null,
        checkAvailabilityBtn: null,
        resultsContainer: null
    };
    
    // État de l'application
    const state = {
        transporteurs: [],
        selectedTransporteurs: [],
        isWidgetOpen: false,
        isGroupage: false,
        isCheckingAvailability: false
    };
    
    /**
     * Initialisation du module
     */
    function init() {
        log('Initialisation du module transporteurs pour la page d\'ajout...');
        
        // Créer les éléments nécessaires
        createRequiredElements();
        
        // Initialiser le widget
        createWidget();
        
        // Charger les transporteurs
        loadTransporteurs();
        
        // Initialiser les événements
        initEvents();
        
        log('Module transporteurs initialisé avec succès');
    }
    
    /**
     * Création des éléments requis pour le fonctionnement du widget
     */
    function createRequiredElements() {
        log('Création des éléments requis...');
        
        // Créer l'élément select pour les transporteurs s'il n'existe pas
        if (!document.getElementById('transporteursSelect')) {
            const transporteursSelect = document.createElement('select');
            transporteursSelect.id = 'transporteursSelect';
            transporteursSelect.name = 'transporteursSelect';
            transporteursSelect.multiple = true;
            transporteursSelect.style.display = 'none';
            elements.form.appendChild(transporteursSelect);
            elements.transporteursSelect = transporteursSelect;
        } else {
            elements.transporteursSelect = document.getElementById('transporteursSelect');
        }
        
        // Créer les boutons radio pour le type de prestation
        if (!document.getElementById('radio-standard')) {
            const radioStandard = document.createElement('input');
            radioStandard.type = 'radio';
            radioStandard.id = 'radio-standard';
            radioStandard.name = 'type_prestation_radio';
            radioStandard.value = 'Standard';
            radioStandard.style.display = 'none';
            radioStandard.checked = !elements.prestationTypeSwitch.checked;
            elements.form.appendChild(radioStandard);
            elements.radioStandard = radioStandard;
        } else {
            elements.radioStandard = document.getElementById('radio-standard');
        }
        
        if (!document.getElementById('radio-groupage')) {
            const radioGroupage = document.createElement('input');
            radioGroupage.type = 'radio';
            radioGroupage.id = 'radio-groupage';
            radioGroupage.name = 'type_prestation_radio';
            radioGroupage.value = 'Groupage';
            radioGroupage.style.display = 'none';
            radioGroupage.checked = elements.prestationTypeSwitch.checked;
            elements.form.appendChild(radioGroupage);
            elements.radioGroupage = radioGroupage;
        } else {
            elements.radioGroupage = document.getElementById('radio-groupage');
        }
        
        // Synchroniser l'état initial
        state.isGroupage = elements.prestationTypeSwitch.checked;
        elements.radioStandard.checked = !state.isGroupage;
        elements.radioGroupage.checked = state.isGroupage;
    }
    
    /**
     * Création du widget de transporteurs
     */
    function createWidget() {
        log('Création du widget de transporteurs...');
        
        // Créer le bouton flottant
        const floatingBtn = document.createElement('button');
        floatingBtn.className = 'transporteurs-toggle-btn';
        floatingBtn.innerHTML = '<i class="fas fa-truck"></i> <span class="badge bg-danger">0</span>';
        floatingBtn.title = 'Gérer les transporteurs';
        document.body.appendChild(floatingBtn);
        elements.floatingBtn = floatingBtn;
        
        // Créer le conteneur du widget
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'transporteurs-widget-container';
        widgetContainer.style.display = 'none';
        document.body.appendChild(widgetContainer);
        elements.widgetContainer = widgetContainer;
        
        // Créer le contenu du widget
        widgetContainer.innerHTML = `
            <div class="transporteurs-widget-header">
                <h5>Gestion des transporteurs</h5>
                <button class="btn-close" aria-label="Fermer"></button>
            </div>
            <div class="transporteurs-widget-body">
                <div class="transporteurs-list-container">
                    <div class="transporteurs-list"></div>
                </div>
                <div class="transporteurs-actions">
                    <button class="btn btn-primary check-availability-btn">
                        <i class="fas fa-calendar-check"></i> Vérifier la disponibilité
                    </button>
                </div>
                <div class="transporteurs-results-container"></div>
            </div>
        `;
        
        // Récupérer les éléments du widget
        elements.checkAvailabilityBtn = widgetContainer.querySelector('.check-availability-btn');
        elements.resultsContainer = widgetContainer.querySelector('.transporteurs-results-container');
        elements.transporteursContainer = widgetContainer.querySelector('.transporteurs-list');
    }
    
    /**
     * Initialisation des événements
     */
    function initEvents() {
        log('Initialisation des événements...');
        
        // Événement du bouton flottant
        elements.floatingBtn.addEventListener('click', toggleWidget);
        
        // Événement du bouton de fermeture du widget
        elements.widgetContainer.querySelector('.btn-close').addEventListener('click', closeWidget);
        
        // Événement du bouton de vérification de disponibilité
        elements.checkAvailabilityBtn.addEventListener('click', checkAvailability);
        
        // Événement du switch de type de prestation
        elements.prestationTypeSwitch.addEventListener('change', function() {
            state.isGroupage = this.checked;
            elements.radioStandard.checked = !state.isGroupage;
            elements.radioGroupage.checked = state.isGroupage;
            
            // Mettre à jour l'interface
            updateUI();
        });
    }
    
    /**
     * Chargement des transporteurs
     */
    function loadTransporteurs() {
        log('Chargement des transporteurs...');
        
        // Afficher un message de chargement
        elements.transporteursContainer.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Chargement des transporteurs...</div>';
        
        // Récupérer les transporteurs depuis l'API
        fetch('/api/transporteurs')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    state.transporteurs = data.transporteurs || [];
                    renderTransporteursList();
                } else {
                    throw new Error(data.message || 'Erreur lors du chargement des transporteurs');
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des transporteurs:', error);
                elements.transporteursContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i> 
                        Erreur lors du chargement des transporteurs: ${error.message || 'Erreur inconnue'}
                    </div>
                `;
            });
    }
    
    /**
     * Affichage de la liste des transporteurs
     */
    function renderTransporteursList() {
        log('Affichage de la liste des transporteurs...');
        
        if (state.transporteurs.length === 0) {
            elements.transporteursContainer.innerHTML = '<div class="empty-message">Aucun transporteur disponible</div>';
            return;
        }
        
        // Générer le HTML pour chaque transporteur
        const transporteursHtml = state.transporteurs.map(transporteur => {
            const isSelected = state.selectedTransporteurs.includes(transporteur.id);
            return `
                <div class="transporteur-item ${isSelected ? 'selected' : ''}" data-id="${transporteur.id}">
                    <div class="transporteur-info">
                        <div class="transporteur-name">${transporteur.nom}</div>
                        <div class="transporteur-details">
                            <span class="transporteur-phone"><i class="fas fa-phone"></i> ${transporteur.telephone || 'N/A'}</span>
                            <span class="transporteur-vehicle"><i class="fas fa-truck"></i> ${transporteur.vehicule || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="transporteur-select">
                        <input type="checkbox" ${isSelected ? 'checked' : ''}>
                    </div>
                </div>
            `;
        }).join('');
        
        // Mettre à jour le conteneur
        elements.transporteursContainer.innerHTML = transporteursHtml;
        
        // Ajouter les événements de clic sur les transporteurs
        const transporteurItems = elements.transporteursContainer.querySelectorAll('.transporteur-item');
        transporteurItems.forEach(item => {
            item.addEventListener('click', function() {
                const transporteurId = parseInt(this.dataset.id, 10);
                toggleTransporteurSelection(transporteurId);
            });
        });
        
        // Mettre à jour le badge du bouton flottant
        updateFloatingButtonBadge();
    }
    
    /**
     * Basculer la sélection d'un transporteur
     */
    function toggleTransporteurSelection(transporteurId) {
        log(`Basculement de la sélection du transporteur ${transporteurId}...`);
        
        const index = state.selectedTransporteurs.indexOf(transporteurId);
        if (index === -1) {
            // Ajouter le transporteur
            state.selectedTransporteurs.push(transporteurId);
        } else {
            // Retirer le transporteur
            state.selectedTransporteurs.splice(index, 1);
        }
        
        // Mettre à jour l'interface
        renderTransporteursList();
        updateTransporteursSelect();
    }
    
    /**
     * Mettre à jour le select caché des transporteurs
     */
    function updateTransporteursSelect() {
        log('Mise à jour du select des transporteurs...');
        
        // Vider le select
        elements.transporteursSelect.innerHTML = '';
        
        // Ajouter les options pour chaque transporteur sélectionné
        state.selectedTransporteurs.forEach(transporteurId => {
            const option = document.createElement('option');
            option.value = transporteurId;
            option.selected = true;
            elements.transporteursSelect.appendChild(option);
        });
    }
    
    /**
     * Mettre à jour le badge du bouton flottant
     */
    function updateFloatingButtonBadge() {
        const badge = elements.floatingBtn.querySelector('.badge');
        badge.textContent = state.selectedTransporteurs.length;
        
        // Changer la couleur du badge en fonction du nombre de transporteurs sélectionnés
        if (state.selectedTransporteurs.length > 0) {
            badge.className = 'badge bg-success';
        } else {
            badge.className = 'badge bg-danger';
        }
    }
    
    /**
     * Basculer l'affichage du widget
     */
    function toggleWidget() {
        log('Basculement de l\'affichage du widget...');
        
        state.isWidgetOpen = !state.isWidgetOpen;
        elements.widgetContainer.style.display = state.isWidgetOpen ? 'block' : 'none';
    }
    
    /**
     * Fermer le widget
     */
    function closeWidget() {
        log('Fermeture du widget...');
        
        state.isWidgetOpen = false;
        elements.widgetContainer.style.display = 'none';
    }
    
    /**
     * Vérifier la disponibilité des transporteurs
     */
    function checkAvailability() {
        log('Vérification de la disponibilité des transporteurs...');
        
        // Vérifier si une vérification est déjà en cours
        if (state.isCheckingAvailability) {
            log('Une vérification est déjà en cours, annulation...');
            return;
        }
        
        // Récupérer les valeurs des champs de date
        const dateDebut = elements.dateDebut.value;
        const dateFin = elements.dateFin.value;
        const typeDemenagement = elements.typeDemenagement.value;
        
        // Vérifier que les dates sont renseignées
        if (!dateDebut || !dateFin) {
            elements.resultsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Veuillez renseigner les dates de début et de fin
                </div>
            `;
            return;
        }
        
        // Vérifier que le type de déménagement est renseigné
        if (!typeDemenagement) {
            elements.resultsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Veuillez sélectionner un type de déménagement
                </div>
            `;
            return;
        }
        
        // Afficher un message de chargement
        elements.resultsContainer.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i> 
                Vérification des disponibilités en cours...
            </div>
        `;
        
        // Marquer que la vérification est en cours
        state.isCheckingAvailability = true;
        
        // Préparer les données pour l'API
        const requestData = {
            date_debut: dateDebut,
            date_fin: dateFin,
            type_demenagement: typeDemenagement,
            type_prestation: state.isGroupage ? 'Groupage' : 'Standard'
        };
        
        // Appeler l'API
        fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Marquer que la vérification est terminée
            state.isCheckingAvailability = false;
            
            if (data.success) {
                // Traiter les résultats
                processAvailabilityResults(data);
            } else {
                throw new Error(data.message || 'Erreur lors de la vérification des disponibilités');
            }
        })
        .catch(error => {
            // Marquer que la vérification est terminée
            state.isCheckingAvailability = false;
            
            console.error('Erreur lors de la vérification des disponibilités:', error);
            
            // Afficher un message d'erreur
            elements.resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> 
                    Erreur lors de la vérification des disponibilités: ${error.message || 'Erreur inconnue'}
                </div>
            `;
        });
    }
    
    /**
     * Traiter les résultats de la vérification de disponibilité
     */
    function processAvailabilityResults(data) {
        log('Traitement des résultats de la vérification de disponibilité...');
        
        const disponibles = data.transporteurs_disponibles || [];
        const indisponibles = data.transporteurs_indisponibles || [];
        
        // Mettre à jour la liste des transporteurs avec les disponibilités
        state.transporteurs.forEach(transporteur => {
            transporteur.disponible = disponibles.some(t => t.id === transporteur.id);
            transporteur.raison_indisponibilite = indisponibles.find(t => t.id === transporteur.id)?.raison || null;
        });
        
        // Afficher les résultats
        if (disponibles.length === 0 && indisponibles.length === 0) {
            elements.resultsContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 
                    Aucun transporteur trouvé pour cette période
                </div>
            `;
        } else {
            let resultsHtml = `
                <div class="availability-results">
                    <h6>Résultats de la vérification</h6>
            `;
            
            if (disponibles.length > 0) {
                resultsHtml += `
                    <div class="available-transporteurs">
                        <h6 class="text-success"><i class="fas fa-check-circle"></i> Transporteurs disponibles (${disponibles.length})</h6>
                        <ul class="list-group">
                `;
                
                disponibles.forEach(transporteur => {
                    resultsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${transporteur.nom}
                            <button class="btn btn-sm btn-outline-success select-transporteur-btn" data-id="${transporteur.id}">
                                <i class="fas fa-plus"></i> Sélectionner
                            </button>
                        </li>
                    `;
                });
                
                resultsHtml += `
                        </ul>
                    </div>
                `;
            }
            
            if (indisponibles.length > 0) {
                resultsHtml += `
                    <div class="unavailable-transporteurs mt-3">
                        <h6 class="text-danger"><i class="fas fa-times-circle"></i> Transporteurs indisponibles (${indisponibles.length})</h6>
                        <ul class="list-group">
                `;
                
                indisponibles.forEach(transporteur => {
                    resultsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${transporteur.nom}
                            <span class="text-danger">${transporteur.raison || 'Indisponible'}</span>
                        </li>
                    `;
                });
                
                resultsHtml += `
                        </ul>
                    </div>
                `;
            }
            
            resultsHtml += `</div>`;
            
            // Mettre à jour le conteneur des résultats
            elements.resultsContainer.innerHTML = resultsHtml;
            
            // Ajouter les événements de clic sur les boutons de sélection
            const selectButtons = elements.resultsContainer.querySelectorAll('.select-transporteur-btn');
            selectButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const transporteurId = parseInt(this.dataset.id, 10);
                    if (!state.selectedTransporteurs.includes(transporteurId)) {
                        toggleTransporteurSelection(transporteurId);
                    }
                });
            });
        }
        
        // Mettre à jour l'interface
        renderTransporteursList();
    }
    
    /**
     * Mettre à jour l'interface utilisateur
     */
    function updateUI() {
        log('Mise à jour de l\'interface utilisateur...');
        
        // Mettre à jour l'affichage en fonction du type de prestation
        if (state.isGroupage) {
            // Mode Groupage
            log('Mode Groupage activé');
        } else {
            // Mode Standard
            log('Mode Standard activé');
        }
        
        // Rafraîchir la liste des transporteurs
        renderTransporteursList();
    }
    
    /**
     * Fonction de journalisation
     */
    function log(message) {
        if (config.debug) {
            console.log(`[Add Prestation Transporteurs] ${message}`);
        }
    }
    
    // Initialiser le module au chargement du DOM
    document.addEventListener('DOMContentLoaded', init);
    
    // Si le DOM est déjà chargé, initialiser immédiatement
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    }
})();
