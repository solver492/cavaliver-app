(function() {
    'use strict';
    
    // Configuration
    const config = {
        apiUrl: '/api/transporteurs/check-disponibilite',
        transporteursListeUrl: '/api/transporteurs/liste',
        debug: true
    };
    
    // Éléments DOM - Initialisation différée
    let elements = {
        form: null,
        transporteursContainer: null,
        transporteursSelect: null,
        radioStandard: null,
        radioGroupage: null,
        floatingBtn: null,
        widgetContainer: null,
        checkAvailabilityBtn: null,
        resultsContainer: null,
        helpButtonWidget: null,
        helpButtonInline: null,
        statutLegendeWidget: null,
        prestationTypeSwitch: null,
        dateDebut: null,
        dateFin: null,
        typeDemenagement: null
    };
    
    // État de l'application
    const state = {
        transporteurs: [],
        selectedTransporteurs: [],
        isWidgetOpen: false,
        isGroupage: false,
        isCheckingAvailability: false,
        isHelpVisible: false  // Nouvel état pour suivre la visibilité de l'aide
    };
    
    // Fonction pour initialiser les éléments DOM
    function initElements() {
        log('Initialisation des éléments DOM...');
        
        try {
            // Récupérer le formulaire principal - essayer plusieurs sélecteurs
            elements.form = document.querySelector('form');
            if (!elements.form) {
                // Essayer de trouver n'importe quel formulaire
                const forms = document.getElementsByTagName('form');
                if (forms.length > 0) {
                    elements.form = forms[0];
                    log('Formulaire trouvé via getElementsByTagName');
                } else {
                    // Si aucun formulaire n'est trouvé, créer un formulaire caché
                    log('Aucun formulaire trouvé, création d\'un formulaire caché');
                    elements.form = document.createElement('form');
                    elements.form.id = 'transporteurs-hidden-form';
                    elements.form.style.display = 'none';
                    document.body.appendChild(elements.form);
                }
            }
            
            // Récupérer les champs de date
            elements.dateDebut = document.getElementById('date_debut');
            elements.dateFin = document.getElementById('date_fin');
            elements.typeDemenagement = document.getElementById('type_demenagement_id');
            
            // Récupérer les boutons radio pour le type de prestation
            elements.prestationTypeSwitch = document.getElementById('prestation_type_switch');
            
            // Créer le select des transporteurs s'il n'existe pas
            const selectCreated = createTransporteursSelect();
            log('Résultat de la création du select: ' + (selectCreated ? 'Succès' : 'Échec'));
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des éléments:', error);
            return false;
        }
    }
    
    function initPrestationTypeSwitch() {
        if (!elements.prestationTypeSwitch) {
            console.error("Switch de type de prestation non trouvé");
            // Créer un switch par défaut si nécessaire
            const switchContainer = document.querySelector('.form-check-inline');
            if (switchContainer) {
                elements.prestationTypeSwitch = document.createElement('input');
                elements.prestationTypeSwitch.type = 'checkbox';
                elements.prestationTypeSwitch.id = 'prestation-type-switch';
                elements.prestationTypeSwitch.className = 'form-check-input';
                switchContainer.appendChild(elements.prestationTypeSwitch);
            } else {
                console.error("Conteneur pour le switch non trouvé");
            }
        }
        
        // Vérifier si l'élément transporteursSelect existe, sinon le créer
        if (!document.getElementById('transporteursSelect')) {
            log('Création de l\'élément transporteursSelect');
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
        
        // Supprimer la section des transporteurs existante si demandé
        // Utiliser un sélecteur plus précis pour trouver la section des transporteurs
        try {
            const transporteurSection = document.querySelector('.card .card-header:has(h5:contains("Transporteurs"))');
            if (transporteurSection) {
                const parentCard = transporteurSection.closest('.card');
                if (parentCard) {
                    log('Suppression de la section des transporteurs existante');
                    parentCard.parentNode.removeChild(parentCard);
                }
            } else {
                // Essayer une autre méthode pour trouver la section des transporteurs
                const headers = document.querySelectorAll('.card-header');
                for (const header of headers) {
                    if (header.textContent.includes('Transporteurs')) {
                        const parentCard = header.closest('.card');
                        if (parentCard) {
                            log('Suppression de la section des transporteurs (méthode alternative)');
                            parentCard.parentNode.removeChild(parentCard);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la section des transporteurs:', error);
        }
        
        // S'assurer que le bouton flottant est visible
        setTimeout(() => {
            if (elements.floatingBtn) {
                elements.floatingBtn.style.display = 'flex';
            }
        }, 500);
        
        return true;
    }
    
    /**
     * Initialisation du module
     */
    function init() {
        log('Initialisation du module de transporteurs...');
        
        try {
            // Initialiser les styles CSS
            initStyles();
            
            // Initialiser les éléments DOM
            if (!initElements()) {
                console.error("Erreur lors de l'initialisation des éléments DOM");
                return;
            }
            
            // Ajouter une bibliothèque d'animation si elle n'existe pas déjà
            if (!document.getElementById('animate-css')) {
                const animateCSS = document.createElement('link');
                animateCSS.id = 'animate-css';
                animateCSS.rel = 'stylesheet';
                animateCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';
                document.head.appendChild(animateCSS);
            }
            
            // Initialiser les événements
            initEvents();
            
            // Créer le select des transporteurs
            createTransporteursSelect();
            
            // Charger les transporteurs
            loadTransporteurs();
            
            log('Initialisation terminée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du module de transporteurs:', error);
        }
    }
    
    /**
     * Création des éléments requis pour le fonctionnement du widget
     */
    function createRequiredElements() {
        log('Création des éléments requis...');
        
        // Créer le bouton flottant s'il n'existe pas
        if (!elements.floatingBtn) {
            elements.floatingBtn = document.createElement('button');
            elements.floatingBtn.id = 'transporteurs-floating-btn';
            elements.floatingBtn.className = 'btn btn-primary btn-floating';
            elements.floatingBtn.innerHTML = '<i class="fas fa-truck"></i>';
            elements.floatingBtn.title = 'Sélectionner des transporteurs';
            elements.floatingBtn.style.display = 'flex';
            document.body.appendChild(elements.floatingBtn);
        } else {
            elements.floatingBtn = document.getElementById('transporteurs-floating-btn');
            elements.floatingBtn.style.display = 'flex';
        }
        
        // Créer ou mettre à jour le select des transporteurs
        createTransporteursSelect();
        
        // Ajouter des styles CSS pour le widget
        addWidgetStyles();
        
        log('Initialisation des éléments DOM terminée');
        return true;
    }
                }
                
                .widget-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background-color: #007bff;
                    color: white;
                }
                
                .widget-body {
                    padding: 15px;
                    overflow-y: auto;
                    max-height: calc(80vh - 60px);
                }
                
                .transporteurs-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .transporteur-item {
                    padding: 10px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    background-color: #f8f9fa;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-left: 4px solid transparent;
                }
                
                .transporteur-item:hover {
                    background-color: #e9ecef;
                }
                
                .transporteur-item.selected {
                    background-color: #e7f4ff;
                    border-left: 4px solid #007bff;
                }
                
                .transporteur-disponible {
                    border-left: 4px solid #28a745;
                }
                
                .transporteur-attente {
                    border-left: 4px solid #ffc107;
                }
                
                .transporteur-indisponible {
                    border-left: 4px solid #6c757d;
                }
                
                /* Styles pour les boutons d'aide */
                #help-button-widget, #help-button-inline {
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #dc3545;
                    border-color: #dc3545;
                    color: white;
                    transition: all 0.3s;
                    animation: pulse 2s infinite;
                    z-index: 1060; /* S'assurer que le bouton est au-dessus des autres éléments */
                    box-shadow: 0 0 10px rgba(220, 53, 69, 0.5);
                }
                
                #help-button-widget:hover, #help-button-inline:hover {
                    background-color: #c82333;
                    border-color: #bd2130;
                    transform: scale(1.05);
                    animation: none;
                }
                
                #help-button-widget i, #help-button-inline i {
                    margin-right: 5px;
                    font-size: 1.1em;
                }
                
                /* Style pour la légende des statuts */
                #statut-legende-widget {
                    border: 2px solid #dc3545;
                    border-radius: 5px;
                    animation: fadeIn 0.3s ease-in-out;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                #statut-legende-widget .card-header {
                    background-color: #dc3545;
                    color: white;
                    font-weight: bold;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }
            `;
            document.head.appendChild(styleElement);
        }
    }
    
    /**
     * Création du widget de transporteurs
     */
    function createWidget() {
        log('Création du widget de transporteurs...');
        
        // Créer le conteneur du widget s'il n'existe pas
        if (!elements.widgetContainer) {
            elements.widgetContainer = document.createElement('div');
            elements.widgetContainer.id = 'transporteurs-widget';
            elements.widgetContainer.className = 'transporteurs-widget';
            elements.widgetContainer.style.display = 'none';
            document.body.appendChild(elements.widgetContainer);
        }
        
        // S'assurer que le select des transporteurs existe
        createTransporteursSelect();
        
        // Créer le contenu du widget avec le bouton d'aide plus visible et plus grand
        elements.widgetContainer.innerHTML = `
            <div class="widget-header">
                <h5>Sélection des transporteurs</h5>
                <div class="d-flex align-items-center">
                    <button type="button" class="btn btn-danger btn-lg me-2" id="help-button-widget" title="Aide sur les statuts" style="font-size: 1rem; padding: 0.5rem 1rem;">
                        <i class="fas fa-question-circle"></i> Aide
                    </button>
                    <button type="button" class="btn-close" aria-label="Fermer" id="close-widget-btn"></button>
                </div>
            </div>
            <div class="widget-body">
                <div id="statut-legende-widget" class="mb-3" style="display: none;">
                    <div class="card">
                        <div class="card-header bg-danger text-white">
                            <h6 class="mb-0">Légende des statuts</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-group">
                                <li class="list-group-item d-flex align-items-center">
                                    <span class="badge bg-success me-2">■</span> Validé - Le transporteur a accepté la prestation
                                </li>
                                <li class="list-group-item d-flex align-items-center">
                                    <span class="badge bg-primary me-2">■</span> Reçu - Le transporteur a reçu la notification
                                </li>
                                <li class="list-group-item d-flex align-items-center">
                                    <span class="badge bg-danger me-2">■</span> Refusé - Le transporteur a refusé la prestation
                                </li>
                                <li class="list-group-item d-flex align-items-center">
                                    <span class="badge bg-warning me-2">■</span> En attente - Notification non envoyée
                                </li>
                                <li class="list-group-item d-flex align-items-center">
                                    <span class="badge bg-secondary me-2">■</span> Indisponible - Non disponible pour cette période
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="d-flex mb-3">
                    <button type="button" class="btn btn-primary flex-grow-1 me-2" id="check-availability-btn">
                        <i class="fas fa-sync-alt"></i> Vérifier disponibilités
                    </button>
                    <button type="button" class="btn btn-danger" id="help-button-inline" title="Aide sur les statuts" style="min-width: 100px; font-weight: bold;">
                        <i class="fas fa-question-circle"></i> Aide
                    </button>
                </div>
                <div id="results-container" class="mb-3"></div>
                <div id="transporteurs-container" class="transporteurs-list"></div>
            </div>
        `;

        // Mettre à jour les références aux éléments du widget
        elements.transporteursContainer = document.getElementById('transporteurs-container');
        elements.checkAvailabilityBtn = document.getElementById('check-availability-btn');
        elements.resultsContainer = document.getElementById('results-container');
        elements.statutLegendeWidget = document.getElementById('statut-legende-widget');
        elements.helpButtonWidget = document.getElementById('help-button-widget');
        elements.helpButtonInline = document.getElementById('help-button-inline');
        
        // Vérifier que les éléments critiques sont bien trouvés
        if (!elements.helpButtonWidget) {
            console.error("Bouton d'aide dans l'en-tête non trouvé lors de l'initialisation");
        }
        
        if (!elements.helpButtonInline) {
            console.error("Bouton d'aide inline non trouvé lors de l'initialisation");
        }
        
        if (!elements.statutLegendeWidget) {
            console.error("Légende des statuts non trouvée lors de l'initialisation");
        }
        
        // Ajouter les événements pour les boutons d'aide
        function setupHelpButtons() {
            log('Configuration des boutons d\'aide...');
            
            // Fonction pour basculer l'affichage de la légende
            function toggleHelpLegend() {
                log('Clic sur un bouton d\'aide');
                
                // Vérifier le style d'affichage actuel
                const legende = document.getElementById('statut-legende-widget');
                if (!legende) {
                    console.error('Légende des statuts non trouvée');
                    return;
                }
                
                // Basculer l'état global
                state.isHelpVisible = !state.isHelpVisible;
                
                // Basculer l'affichage
                legende.style.display = state.isHelpVisible ? 'block' : 'none';
                log('Légende des statuts ' + (state.isHelpVisible ? 'affichée' : 'masquée'));
                
                // Mettre à jour le texte des boutons
                const updateButtonText = (btn) => {
                    if (btn) {
                        // Utiliser des classes pour rendre le bouton plus visible
                        if (state.isHelpVisible) {
                            btn.innerHTML = '<i class="fas fa-times-circle"></i> Fermer';
                            btn.classList.remove('btn-danger');
                            btn.classList.add('btn-secondary');
                        } else {
                            btn.innerHTML = '<i class="fas fa-question-circle"></i> Aide';
                            btn.classList.remove('btn-secondary');
                            btn.classList.add('btn-danger');
                        }
                    }
                };
                
                // Mettre à jour les deux boutons
                updateButtonText(elements.helpButtonWidget);
                updateButtonText(elements.helpButtonInline);
            }
            
            // Ajouter l'événement pour le bouton d'aide dans l'en-tête
            if (elements.helpButtonWidget) {
                log('Ajout de l\'event listener sur le bouton d\'aide dans l\'en-tête');
                // Supprimer d'abord les anciens écouteurs pour éviter les doublons
                elements.helpButtonWidget.removeEventListener('click', toggleHelpLegend);
                elements.helpButtonWidget.addEventListener('click', toggleHelpLegend);
                
                // Ajouter une animation pour attirer l'attention
                setTimeout(() => {
                    if (elements.helpButtonWidget) {
                        elements.helpButtonWidget.classList.add('animate__animated', 'animate__heartBeat');
                        setTimeout(() => {
                            if (elements.helpButtonWidget) {
                                elements.helpButtonWidget.classList.remove('animate__animated', 'animate__heartBeat');
                            }
                        }, 1000);
                    }
                }, 500);
            } else {
                console.error("Bouton d'aide dans l'en-tête non trouvé");
            }
            
            // Ajouter l'événement pour le bouton d'aide inline
            if (elements.helpButtonInline) {
                log('Ajout de l\'event listener sur le bouton d\'aide inline');
                // Supprimer d'abord les anciens écouteurs pour éviter les doublons
                elements.helpButtonInline.removeEventListener('click', toggleHelpLegend);
                elements.helpButtonInline.addEventListener('click', toggleHelpLegend);
            } else {
                console.error("Bouton d'aide inline non trouvé");
            }
        }
        
        // Configurer les boutons d'aide
        setupHelpButtons();

        // Ajouter l'événement pour le bouton de vérification
        if (elements.checkAvailabilityBtn) {
            log('Ajout de l\'event listener sur le bouton de vérification');
            elements.checkAvailabilityBtn.addEventListener('click', function() {
                log('Clic sur le bouton de vérification');
                // Ajouter une animation de rotation pendant la vérification
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification en cours...';
                this.disabled = true;

                checkAvailability()
                    .catch(error => {
                        console.error('Erreur lors de la vérification:', error);
                    })
                    .finally(() => {
                        // Restaurer le bouton après la vérification
                        this.innerHTML = '<i class="fas fa-sync-alt"></i> Vérifier disponibilités';
                        this.disabled = false;
                    });
            });
        } else {
            console.error("Bouton de vérification non trouvé");
            // Tentative de récupération alternative
            const checkBtn = document.getElementById('check-availability-btn');
            if (checkBtn) {
                log('Récupération alternative du bouton de vérification');
                elements.checkAvailabilityBtn = checkBtn;
                checkBtn.addEventListener('click', function() {
                    log('Clic sur le bouton de vérification (récupéré alternativement)');
                    // Ajouter une animation de rotation pendant la vérification
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification en cours...';
                    this.disabled = true;

                    checkAvailability()
                        .catch(error => {
                            console.error('Erreur lors de la vérification:', error);
                        })
                        .finally(() => {
                            // Restaurer le bouton après la vérification
                            this.innerHTML = '<i class="fas fa-sync-alt"></i> Vérifier disponibilités';
                            this.disabled = false;
                        });
                });
            }
        }

        // Ajouter l'événement pour fermer le widget
        const closeBtn = document.getElementById('close-widget-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                toggleWidget();
            });
        }
    }
    
    /**
     * Initialisation des événements
     */
    function initEvents() {
        log('Initialisation des événements...');
        
        // Événement pour le switch de type de prestation dans le formulaire principal
        if (elements.prestationTypeSwitch) {
            elements.prestationTypeSwitch.addEventListener('change', function() {
                state.isGroupage = this.checked;
                
                // Synchroniser avec les boutons radio du widget
                if (elements.widgetModeStandard) {
                    elements.widgetModeStandard.checked = !state.isGroupage;
                }
                if (elements.widgetModeGroupage) {
                    elements.widgetModeGroupage.checked = state.isGroupage;
                }
                
                log(`Mode ${state.isGroupage ? 'groupage' : 'standard'} activé depuis le formulaire`);
            });
        }
        
        // Événement pour le bouton flottant
        if (elements.floatingBtn) {
            elements.floatingBtn.addEventListener('click', function() {
                toggleWidget();
            });
        }
        
        // Événement pour le bouton de vérification de disponibilité
        if (elements.checkAvailabilityBtn) {
            log('Ajout de l\'event listener sur le bouton de vérification');
            elements.checkAvailabilityBtn.addEventListener('click', function() {
                log('Clic sur le bouton de vérification de disponibilité');
                checkAvailability();
            });
        } else {
            console.error("Bouton de vérification de disponibilité non trouvé");
            // Tentative de récupération alternative
            const checkBtn = document.getElementById('check-availability-btn');
            if (checkBtn) {
                log('Récupération alternative du bouton de vérification');
                elements.checkAvailabilityBtn = checkBtn;
                checkBtn.addEventListener('click', function() {
                    log('Clic sur le bouton de vérification de disponibilité (récupéré alternativement)');
                    checkAvailability();
                });
            }
        }
        
        // Événement pour le bouton d'aide
        const helpButton = document.getElementById('help-button');
        if (helpButton) {
            helpButton.addEventListener('click', function() {
                const statutLegende = document.getElementById('statut-legende');
                if (statutLegende) {
                    statutLegende.style.display = statutLegende.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
        
        // Événement pour la soumission du formulaire
        if (elements.form) {
            elements.form.addEventListener('submit', function(e) {
                // Mettre à jour le champ select caché avec les transporteurs sélectionnés
                updateTransporteursSelect();
                log('Formulaire soumis, transporteurs sélectionnés mis à jour');
            });
        }
    }
    
    /**
     * Gestionnaire d'événement pour le changement du switch
     */
    function handleSwitchChange() {
        log('Changement du type de prestation...');
        
        // Mettre à jour l'état
        state.isGroupage = elements.prestationTypeSwitch.checked;
        
        // Mettre à jour l'interface
        if (state.isGroupage) {
            log('Mode groupage activé');
        } else {
            log('Mode standard activé');
        }
    }
    
    /**
     * Chargement des transporteurs
     */
    function loadTransporteurs() {
        log('Chargement des transporteurs...');
        
        if (!elements.transporteursContainer) {
            console.error("Élément transporteursContainer non trouvé");
            return;
        }
        
        // Afficher un message de chargement
        elements.transporteursContainer.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Chargement des transporteurs...</div>';
        
        // Récupérer les transporteurs depuis l'API
        fetch(config.transporteursListeUrl)
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
                    log(`${state.transporteurs.length} transporteurs chargés`);
                } else {
                    throw new Error(data.message || 'Erreur lors du chargement des transporteurs');
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des transporteurs:', error);
                if (elements.transporteursContainer) {
                    elements.transporteursContainer.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i> 
                            Erreur lors du chargement des transporteurs: ${error.message || 'Erreur inconnue'}
                        </div>
                    `;
                }
            });
    }
    
    /**
     * Affichage de la liste des transporteurs
     */
    function renderTransporteursList() {
        log('Affichage de la liste des transporteurs...');
        
        if (!elements.transporteursContainer) {
            console.error("Container des transporteurs non trouvé");
            return;
        }

        if (state.transporteurs.length === 0) {
            elements.transporteursContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    Aucun transporteur disponible
                </div>
            `;
            return;
        }

        const transporteursHtml = state.transporteurs.map(transporteur => {
            const isSelected = state.selectedTransporteurs.includes(transporteur.id);
            const selectedClass = isSelected ? 'selected' : '';
            
            // Déterminer le statut et la classe CSS
            let statusClass = 'bg-warning';
            let statusBadge = '<span class="badge bg-warning">En attente</span>';
            
            if (!transporteur.disponible) {
                statusClass = 'transporteur-indisponible';
                statusBadge = `
                    <span class="badge bg-secondary" title="${transporteur.raison_indisponibilite || 'Indisponible'}">
                        Indisponible
                    </span>
                `;
            } else if (transporteur.statut === 'valide') {
                statusClass = 'transporteur-valide';
                statusBadge = '<span class="badge bg-success">Validé</span>';
            } else if (transporteur.statut === 'recu') {
                statusClass = 'transporteur-recu';
                statusBadge = '<span class="badge bg-primary">Reçu</span>';
            } else if (transporteur.statut === 'refuse') {
                statusClass = 'transporteur-refuse';
                statusBadge = '<span class="badge bg-danger">Refusé</span>';
            }

            return `
                <div class="transporteur-item ${selectedClass} ${statusClass}" data-id="${transporteur.id}">
                    <div class="transporteur-info">
                        <div>
                            <span class="transporteur-nom">${transporteur.nom}</span>
                            ${statusBadge}
                        </div>
                        <small class="text-muted">${transporteur.vehicule || ''}</small>
                    </div>
                </div>
            `;
        }).join('');

        elements.transporteursContainer.innerHTML = transporteursHtml;

        // Ajouter les événements de clic
        const items = elements.transporteursContainer.querySelectorAll('.transporteur-item');
        items.forEach(item => {
            item.addEventListener('click', function() {
                const transporteurId = parseInt(this.dataset.id);
                toggleTransporteurSelection(transporteurId);
            });
        });
    }
    
    /**
     * Vérifier la disponibilité des transporteurs
     */
    async function checkAvailability() {
        log('Vérification de la disponibilité des transporteurs...');
        
        try {
            // Vérifier si une vérification est déjà en cours
            if (state.isCheckingAvailability) {
                log('Une vérification est déjà en cours');
                return;
            }
            
            state.isCheckingAvailability = true;
            
            // Vérifier si les éléments nécessaires existent
            if (!elements.dateDebut) elements.dateDebut = document.getElementById('date_debut');
            if (!elements.dateFin) elements.dateFin = document.getElementById('date_fin');
            if (!elements.typeDemenagement) elements.typeDemenagement = document.getElementById('type_demenagement_id');
            
            // Vérifier si les dates sont renseignées
            const dateDebut = elements.dateDebut?.value;
        
        // Préparer également les données au format JSON pour le fallback
        const jsonData = {
            date_debut: dateDebut,
            date_fin: dateFin,
            type_demenagement_id: typeDemenagementId,
            is_groupage: state.isGroupage ? 1 : 0
        };
        
        // Afficher l'indicateur de chargement
        toggleLoading(true);
        
        // Essayer d'abord avec FormData
        let response;
        let data;
        let usedFormData = true;
        
        try {
            log('Tentative avec FormData...');
            response = await fetch(config.apiUrl + '/api/transporteurs/check-disponibilite', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            data = await response.json();
        } catch (formDataError) {
            log('Erreur avec FormData, tentative avec JSON...', formDataError);
            usedFormData = false;
            
            // Fallback sur JSON
            response = await fetch(config.apiUrl + '/api/transporteurs/check-disponibilite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            data = await response.json();
        }
        
        log('Réponse API reçue:', data, 'Format utilisé:', usedFormData ? 'FormData' : 'JSON');
        
        if (data.success) {
            // Mettre à jour la liste des transporteurs avec leurs disponibilités
            updateTransporteursList(data.transporteurs);
            
            // Mettre à jour le select caché si nécessaire
            updateHiddenSelect();
            
            // Afficher un message de succès
            showAlert('success', 'Disponibilités mises à jour avec succès.');
        } else {
            // Afficher un message d'erreur
            showAlert('danger', data.message || 'Erreur lors de la vérification des disponibilités.');
        }
        } catch (error) {
            console.error('Erreur lors de la vérification des disponibilités:', error);
            showAlert('danger', 'Erreur lors de la vérification des disponibilités. Veuillez réessayer.');
        } finally {
            // Masquer l'indicateur de chargement
            toggleLoading(false);
        }
    }

/**
 * Mise à jour du select caché avec les transporteurs sélectionnés
 */
function updateHiddenSelect() {
    log('Mise à jour du select caché...');
    
    try {
        // Vérifier que le select existe, sinon le créer
        if (!elements.transporteursSelect) {
            log('Select caché non trouvé, tentative de création...');
            if (!createTransporteursSelect()) {
                console.error("Impossible de créer l'élément transporteursSelect");
                return;
            }
        }
        
        // Vérifier à nouveau que le select existe
        if (!elements.transporteursSelect) {
            console.error("Elément transporteursSelect toujours non trouvé après tentative de création");
            return;
        }
        
        // Vider le select
        elements.transporteursSelect.innerHTML = '';
        
        // Ajouter les options pour chaque transporteur sélectionné
        let selectedCount = 0;
        state.transporteurs.forEach(transporteur => {
            if (transporteur.selected) {
                const option = document.createElement('option');
                option.value = transporteur.id;
                option.text = transporteur.nom;
                option.selected = true;
                elements.transporteursSelect.appendChild(option);
                selectedCount++;
            }
        });
        
        log(`Select caché mis à jour avec ${selectedCount} transporteurs sélectionnés`);
        
        // Déclencher un événement change pour notifier d'éventuels écouteurs
        const event = new Event('change');
        elements.transporteursSelect.dispatchEvent(event);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du select caché:", error);
    }
}

    /**
     * Basculer la sélection d'un transporteur
     */
    function toggleTransporteurSelection(transporteurId) {
        log(`Basculement de la sélection du transporteur ${transporteurId}`);
        
        // S'assurer que transporteurId est un nombre
        const id = parseInt(transporteurId, 10);
        if (isNaN(id)) {
            console.error(`ID de transporteur invalide: ${transporteurId}`);
            return;
        }
        
        // Vérifier si le transporteur est déjà sélectionné
        const index = state.selectedTransporteurs.indexOf(id);
        
        if (index === -1) {
            // Ajouter le transporteur à la sélection
            state.selectedTransporteurs.push(id);
            log(`Transporteur ${id} ajouté à la sélection`);
        } else {
            // Retirer le transporteur de la sélection
            state.selectedTransporteurs.splice(index, 1);
            log(`Transporteur ${id} retiré de la sélection`);
        }
        
        // Mettre à jour l'interface
        renderTransporteursList();
        updateTransporteursSelect();
        
        // Mettre à jour le badge du bouton flottant si nécessaire
        if (elements.floatingBtn) {
            let badge = elements.floatingBtn.querySelector('.badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge bg-danger position-absolute top-0 end-0';
                elements.floatingBtn.appendChild(badge);
            }
            
            badge.textContent = state.selectedTransporteurs.length;
            badge.style.display = state.selectedTransporteurs.length > 0 ? 'block' : 'none';
        }
    }
    
    /**
     * Fonction de journalisation
     */
    function log(message) {
        if (config.debug) {
            console.log(`[Add Prestation Transporteurs] ${message}`);
        }
    }
    
    /**
     * Basculer l'affichage du widget
     */
    function toggleWidget() {
        log('Basculement de l\'affichage du widget...');
        
        state.isWidgetOpen = !state.isWidgetOpen;
        
        if (state.isWidgetOpen) {
            elements.widgetContainer.style.display = 'flex';
        } else {
            elements.widgetContainer.style.display = 'none';
        }
    }
    
    // Initialiser le module au chargement du DOM
    document.addEventListener('DOMContentLoaded', init);
    
    // Si le DOM est déjà chargé, initialiser immédiatement
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    }
})();
