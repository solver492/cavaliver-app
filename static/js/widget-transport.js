/**
 * Widget de Transport Animé
 * 
 * Ce script gère le widget de transport avec animation de camion
 * pour la sélection des transporteurs dans le système de prestation.
 */

// Configuration globale
const widgetConfig = {
    animationSpeed: 1000,
    speechDuration: 3000,
    drivingSpeed: 3000
};

// État du widget
let widgetState = {
    initialized: false,
    transporteurs: [],
    transporteursDisponibles: [],
    transporteursBientotDisponibles: [],
    transporteursIndisponibles: [],
    selectedTransporteurs: [],
    typeDemenagement: null,
    dateDebut: null,
    dateFin: null,
    searchQuery: '',
    animationInProgress: false
};

/**
 * Initialise le widget de transport
 */
function initWidgetTransport() {
    console.log("Initialisation du widget de transport animé...");
    
    // Vérifier si le widget est déjà initialisé
    if (widgetState.initialized) {
        console.log("Widget déjà initialisé");
        return;
    }
    
    // Créer la structure HTML du widget
    createWidgetHTML();
    
    // Récupérer les références aux éléments du DOM
    const elements = getWidgetElements();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners(elements);
    
    // Initialiser l'état du widget
    widgetState.initialized = true;
    
    // Animation initiale du chauffeur
    setTimeout(() => {
        startDriverAnimation();
    }, 500);
    
    console.log("Widget de transport initialisé avec succès");
}

/**
 * Crée la structure HTML du widget
 */
function createWidgetHTML() {
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'widget-transport-container';
    widgetContainer.id = 'widget-transport';
    
    widgetContainer.innerHTML = `
        <div class="search-container">
            <input type="text" class="search-input" placeholder="Rechercher un transporteur par nom, matricule ou permis...">
            <div class="transporteurs-list" id="selected-transporteurs"></div>
        </div>
        
        <div class="road">
            <div class="road-marking"></div>
        </div>
        
        <div class="truck" id="main-truck">
            <div class="truck-cabin">
                <div class="truck-window"></div>
            </div>
            <div class="truck-trailer">
                <div class="truck-trailer-screen">
                    <div class="truck-trailer-screen-left" id="available-transporteurs">
                        <strong>Transporteurs disponibles</strong>
                        <div class="transporteurs-list-container"></div>
                    </div>
                    <div class="truck-trailer-divider"></div>
                    <div class="truck-trailer-screen-right" id="selected-transporteurs-display">
                        <strong>Transporteurs sélectionnés</strong>
                        <div class="transporteurs-list-container"></div>
                    </div>
                </div>
            </div>
            <div class="truck-wheel truck-wheel-front"></div>
            <div class="truck-wheel truck-wheel-back"></div>
            
            <div class="driver">
                <div class="driver-head"></div>
                <div class="driver-body"></div>
                <div class="driver-arm driver-arm-left"></div>
                <div class="driver-arm driver-arm-right"></div>
                
                <div class="speech-bubble">
                    Je vais choisir pour vous les transporteurs qu'il faut pour votre déménagement
                </div>
            </div>
        </div>
        
        <button class="submit-button" title="Soumettre les transporteurs sélectionnés">
            <i class="fas fa-check"></i>
        </button>
        
        <div class="widget-controls">
            <button class="btn btn-primary check-disponibilite-btn">
                <i class="fas fa-sync-alt"></i> Vérifier disponibilité
            </button>
        </div>
        
        <div class="new-truck" id="new-truck" style="display: none;">
            <div class="truck-cabin" style="background-color: #27ae60;">
                <div class="truck-window"></div>
            </div>
            <div class="truck-trailer" style="background-color: #f39c12;">
                <div class="truck-trailer-screen">
                    <strong>Merci et bonne chance!</strong>
                </div>
            </div>
            <div class="truck-wheel truck-wheel-front"></div>
            <div class="truck-wheel truck-wheel-back"></div>
            
            <div class="driver">
                <div class="driver-head"></div>
                <div class="driver-body" style="background-color: #f39c12;"></div>
                <div class="driver-arm driver-arm-left"></div>
                <div class="driver-arm driver-arm-right"></div>
            </div>
        </div>
    `;
    
    // Insérer le widget dans le formulaire
    const targetElement = document.querySelector('form .mb-4:last-of-type');
    if (targetElement) {
        targetElement.parentNode.insertBefore(widgetContainer, targetElement.nextSibling);
    } else {
        console.error("Impossible de trouver l'élément cible pour insérer le widget");
        // Fallback: ajouter à la fin du formulaire
        const form = document.querySelector('form');
        if (form) {
            form.appendChild(widgetContainer);
        }
    }
    
    // Ajouter un champ caché pour stocker les transporteurs sélectionnés
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'transporteurs_selectionnes';
    hiddenInput.id = 'transporteurs-selectionnes-input';
    
    const form = document.querySelector('form');
    if (form) {
        form.appendChild(hiddenInput);
    }
}

/**
 * Récupère les références aux éléments du DOM du widget
 */
function getWidgetElements() {
    return {
        widget: document.getElementById('widget-transport'),
        searchInput: document.querySelector('.search-input'),
        selectedTransporteursList: document.getElementById('selected-transporteurs'),
        availableTransporteursList: document.querySelector('#available-transporteurs .transporteurs-list-container'),
        selectedTransporteursDisplay: document.querySelector('#selected-transporteurs-display .transporteurs-list-container'),
        checkDisponibiliteBtn: document.querySelector('.check-disponibilite-btn'),
        submitButton: document.querySelector('.submit-button'),
        driver: document.querySelector('.driver'),
        driverArm: document.querySelector('.driver-arm-left'),
        speechBubble: document.querySelector('.speech-bubble'),
        mainTruck: document.getElementById('main-truck'),
        newTruck: document.getElementById('new-truck'),
        truckWheels: document.querySelectorAll('.truck-wheel'),
        hiddenInput: document.getElementById('transporteurs-selectionnes-input')
    };
}

/**
 * Configure les écouteurs d'événements pour le widget
 */
function setupEventListeners(elements) {
    // Recherche de transporteurs
    elements.searchInput.addEventListener('input', (e) => {
        widgetState.searchQuery = e.target.value.trim().toLowerCase();
        filterTransporteurs();
    });
    
    // Vérification de disponibilité
    elements.checkDisponibiliteBtn.addEventListener('click', () => {
        checkDisponibilite();
    });
    
    // Soumission des transporteurs sélectionnés
    elements.submitButton.addEventListener('click', () => {
        submitSelectedTransporteurs(elements);
    });
    
    // Écouter les changements de type de déménagement
    const typeDemenagementSelect = document.getElementById('type_demenagement');
    if (typeDemenagementSelect) {
        typeDemenagementSelect.addEventListener('change', (e) => {
            widgetState.typeDemenagement = e.target.value;
            startDriverAnimation();
            checkDisponibilite();
        });
    }
    
    // Écouter les changements de dates
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    
    if (dateDebutInput) {
        dateDebutInput.addEventListener('change', (e) => {
            widgetState.dateDebut = e.target.value;
            if (widgetState.dateDebut && widgetState.dateFin) {
                checkDisponibilite();
            }
        });
    }
    
    if (dateFinInput) {
        dateFinInput.addEventListener('change', (e) => {
            widgetState.dateFin = e.target.value;
            if (widgetState.dateDebut && widgetState.dateFin) {
                checkDisponibilite();
            }
        });
    }
}

/**
 * Démarre l'animation du chauffeur (salutation)
 */
function startDriverAnimation() {
    const elements = getWidgetElements();
    
    // Faire saluer le chauffeur
    elements.driverArm.classList.add('waving');
    
    // Afficher la bulle de dialogue
    elements.speechBubble.classList.add('show');
    
    // Mettre à jour le texte de la bulle en fonction du type de déménagement
    if (widgetState.typeDemenagement) {
        let message = "Je vais choisir pour vous les transporteurs adaptés pour ";
        
        switch (widgetState.typeDemenagement) {
            case 'local':
                message += "un déménagement local";
                break;
            case 'appartement':
                message += "un déménagement d'appartement";
                break;
            case 'maison':
                message += "un déménagement de maison";
                break;
            case 'international':
                message += "un déménagement international";
                break;
            default:
                message += "votre déménagement";
        }
        
        elements.speechBubble.textContent = message;
    }
    
    // Cacher la bulle après quelques secondes
    setTimeout(() => {
        elements.speechBubble.classList.remove('show');
        elements.driverArm.classList.remove('waving');
        elements.driverArm.classList.add('down');
    }, widgetConfig.speechDuration);
}

/**
 * Vérifie la disponibilité des transporteurs pour les dates sélectionnées
 */
function checkDisponibilite() {
    const dateDebut = document.getElementById('date_debut')?.value;
    const dateFin = document.getElementById('date_fin')?.value;
    const typeDemenagement = document.getElementById('type_demenagement')?.value;
    
    if (!dateDebut || !dateFin) {
        showNotification("Veuillez sélectionner les dates de début et de fin", "warning");
        return;
    }
    
    widgetState.dateDebut = dateDebut;
    widgetState.dateFin = dateFin;
    widgetState.typeDemenagement = typeDemenagement;
    
    // Afficher un message de chargement
    showNotification("Recherche des transporteurs disponibles...", "info");
    
    // Appel à l'API pour vérifier la disponibilité
    fetch('/api/check_disponibilite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            date_debut: dateDebut,
            date_fin: dateFin,
            type_demenagement: typeDemenagement
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Résultats de disponibilité:", data);
        processDisponibiliteResults(data);
    })
    .catch(error => {
        console.error("Erreur lors de la vérification de disponibilité:", error);
        showNotification("Erreur lors de la vérification de disponibilité: " + error.message, "danger");
    });
}

/**
 * Traite les résultats de la vérification de disponibilité
 */
function processDisponibiliteResults(data) {
    // Mettre à jour l'état du widget
    widgetState.transporteursDisponibles = data.transporteurs_disponibles || [];
    widgetState.transporteursBientotDisponibles = data.transporteurs_bientot_disponibles || [];
    
    // Filtrer les transporteurs par type de déménagement si nécessaire
    if (widgetState.typeDemenagement) {
        filterTransporteursByType();
    }
    
    // Mettre à jour l'affichage
    updateTransporteursDisplay();
    
    // Afficher un message de succès
    const totalCount = widgetState.transporteursDisponibles.length + widgetState.transporteursBientotDisponibles.length;
    showNotification(`${totalCount} transporteurs trouvés pour les dates sélectionnées`, "success");
    
    // Animation du chauffeur
    startDriverAnimation();
}

/**
 * Filtre les transporteurs par type de déménagement
 */
function filterTransporteursByType() {
    if (!widgetState.typeDemenagement) return;
    
    // Filtrer les transporteurs disponibles
    widgetState.transporteursDisponibles = widgetState.transporteursDisponibles.filter(transporteur => {
        return isTransporteurCompatible(transporteur, widgetState.typeDemenagement);
    });
    
    // Filtrer les transporteurs bientôt disponibles
    widgetState.transporteursBientotDisponibles = widgetState.transporteursBientotDisponibles.filter(transporteur => {
        return isTransporteurCompatible(transporteur, widgetState.typeDemenagement);
    });
}

/**
 * Vérifie si un transporteur est compatible avec un type de déménagement
 */
function isTransporteurCompatible(transporteur, typeDemenagement) {
    // Si le transporteur n'a pas de type de véhicule, on le considère compatible
    if (!transporteur.type_vehicule) return true;
    
    // Logique de compatibilité entre type de véhicule et type de déménagement
    const vehicule = transporteur.type_vehicule.toLowerCase();
    
    switch (typeDemenagement) {
        case 'local':
            // Tous les véhicules sont compatibles avec le déménagement local
            return true;
        case 'appartement':
            // Petits et moyens véhicules pour les appartements
            return vehicule.includes('petit') || 
                   vehicule.includes('moyen') || 
                   vehicule.includes('12m') ||
                   vehicule.includes('fourgon');
        case 'maison':
            // Moyens et grands véhicules pour les maisons
            return vehicule.includes('moyen') || 
                   vehicule.includes('grand') || 
                   vehicule.includes('20m') ||
                   vehicule.includes('semi-remorque');
        case 'international':
            // Grands véhicules pour l'international
            return vehicule.includes('grand') || 
                   vehicule.includes('20m') ||
                   vehicule.includes('semi-remorque') ||
                   vehicule.includes('international');
        default:
            return true;
    }
}

/**
 * Met à jour l'affichage des transporteurs dans le widget
 */
function updateTransporteursDisplay() {
    const elements = getWidgetElements();
    
    // Vider les conteneurs
    elements.availableTransporteursList.innerHTML = '';
    
    // Ajouter les transporteurs disponibles
    if (widgetState.transporteursDisponibles.length > 0) {
        const disponiblesTitle = document.createElement('div');
        disponiblesTitle.className = 'transporteurs-category-title';
        disponiblesTitle.innerHTML = `<strong>Disponibles</strong> <span class="badge badge-disponible">${widgetState.transporteursDisponibles.length}</span>`;
        elements.availableTransporteursList.appendChild(disponiblesTitle);
        
        widgetState.transporteursDisponibles.forEach(transporteur => {
            const transporteurItem = createTransporteurItem(transporteur, 'disponible');
            elements.availableTransporteursList.appendChild(transporteurItem);
        });
    }
    
    // Ajouter les transporteurs bientôt disponibles
    if (widgetState.transporteursBientotDisponibles.length > 0) {
        const bientotTitle = document.createElement('div');
        bientotTitle.className = 'transporteurs-category-title mt-2';
        bientotTitle.innerHTML = `<strong>Bientôt disponibles</strong> <span class="badge badge-bientot">${widgetState.transporteursBientotDisponibles.length}</span>`;
        elements.availableTransporteursList.appendChild(bientotTitle);
        
        widgetState.transporteursBientotDisponibles.forEach(transporteur => {
            const transporteurItem = createTransporteurItem(transporteur, 'bientot');
            elements.availableTransporteursList.appendChild(transporteurItem);
        });
    }
    
    // Mettre à jour l'affichage des transporteurs sélectionnés
    updateSelectedTransporteursDisplay();
}

/**
 * Crée un élément HTML pour un transporteur
 */
function createTransporteurItem(transporteur, status) {
    const item = document.createElement('div');
    item.className = 'transporteur-item';
    item.dataset.id = transporteur.id;
    item.dataset.status = status;
    
    // Vérifier si le transporteur est déjà sélectionné
    if (widgetState.selectedTransporteurs.some(t => t.id === transporteur.id)) {
        item.classList.add('selected');
    }
    
    // Créer le contenu de l'élément
    let badge = '';
    switch (status) {
        case 'disponible':
            badge = '<span class="badge badge-disponible">Disponible</span>';
            break;
        case 'bientot':
            badge = '<span class="badge badge-bientot">Bientôt</span>';
            break;
        case 'indisponible':
            badge = '<span class="badge badge-indisponible">Indisponible</span>';
            break;
    }
    
    // Informations sur le véhicule
    let vehiculeInfo = '';
    if (transporteur.type_vehicule) {
        vehiculeInfo = `<small><i class="fas fa-truck"></i> ${transporteur.type_vehicule}</small>`;
    }
    
    // Informations sur la disponibilité
    let disponibiliteInfo = '';
    if (status === 'bientot' && transporteur.disponible_le) {
        disponibiliteInfo = `<small><i class="fas fa-calendar"></i> Dispo. le ${transporteur.disponible_le}</small>`;
    }
    
    item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <strong>${transporteur.prenom} ${transporteur.nom}</strong> ${badge}
            </div>
            <div class="transporteur-actions">
                <button class="btn btn-sm btn-outline-primary select-transporteur" title="Sélectionner">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
        <div class="transporteur-details">
            ${vehiculeInfo}
            ${disponibiliteInfo}
            ${transporteur.matricule ? `<small><i class="fas fa-id-card"></i> ${transporteur.matricule}</small>` : ''}
        </div>
    `;
    
    // Ajouter l'événement de clic pour sélectionner/désélectionner
    item.querySelector('.select-transporteur').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTransporteurSelection(transporteur, item);
    });
    
    return item;
}

/**
 * Bascule la sélection d'un transporteur
 */
function toggleTransporteurSelection(transporteur, item) {
    const isSelected = item.classList.contains('selected');
    
    if (isSelected) {
        // Désélectionner le transporteur
        widgetState.selectedTransporteurs = widgetState.selectedTransporteurs.filter(t => t.id !== transporteur.id);
        item.classList.remove('selected');
    } else {
        // Sélectionner le transporteur
        widgetState.selectedTransporteurs.push(transporteur);
        item.classList.add('selected');
    }
    
    // Mettre à jour l'affichage des transporteurs sélectionnés
    updateSelectedTransporteursDisplay();
    
    // Mettre à jour le champ caché
    updateHiddenInput();
}

/**
 * Met à jour l'affichage des transporteurs sélectionnés
 */
function updateSelectedTransporteursDisplay() {
    const elements = getWidgetElements();
    
    // Vider le conteneur
    elements.selectedTransporteursDisplay.innerHTML = '';
    elements.selectedTransporteursList.innerHTML = '';
    
    // Ajouter les transporteurs sélectionnés
    if (widgetState.selectedTransporteurs.length > 0) {
        widgetState.selectedTransporteurs.forEach(transporteur => {
            // Affichage dans le panneau principal
            const displayItem = document.createElement('div');
            displayItem.className = 'transporteur-item selected';
            displayItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${transporteur.prenom} ${transporteur.nom}</strong>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-danger remove-transporteur" title="Retirer">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <small>${transporteur.type_vehicule || ''}</small>
            `;
            elements.selectedTransporteursDisplay.appendChild(displayItem);
            
            // Ajouter l'événement pour retirer le transporteur
            displayItem.querySelector('.remove-transporteur').addEventListener('click', () => {
                removeSelectedTransporteur(transporteur.id);
            });
            
            // Affichage dans la liste de recherche
            const searchItem = document.createElement('div');
            searchItem.className = 'transporteur-item selected';
            searchItem.innerHTML = `
                <strong>${transporteur.prenom} ${transporteur.nom}</strong>
                <button class="btn btn-sm btn-outline-danger remove-transporteur" title="Retirer">
                    <i class="fas fa-times"></i>
                </button>
            `;
            elements.selectedTransporteursList.appendChild(searchItem);
            
            // Ajouter l'événement pour retirer le transporteur
            searchItem.querySelector('.remove-transporteur').addEventListener('click', () => {
                removeSelectedTransporteur(transporteur.id);
            });
        });
    } else {
        // Message si aucun transporteur n'est sélectionné
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-muted text-center p-2';
        emptyMessage.innerHTML = '<i class="fas fa-info-circle"></i> Aucun transporteur sélectionné';
        elements.selectedTransporteursDisplay.appendChild(emptyMessage);
    }
    
    // Mettre à jour le compteur
    const countBadge = document.createElement('div');
    countBadge.className = 'selected-count-badge';
    countBadge.innerHTML = `<strong>Total:</strong> ${widgetState.selectedTransporteurs.length} transporteur(s) sélectionné(s)`;
    elements.selectedTransporteursDisplay.appendChild(countBadge);
}

/**
 * Retire un transporteur de la sélection
 */
function removeSelectedTransporteur(transporteurId) {
    // Mettre à jour l'état
    widgetState.selectedTransporteurs = widgetState.selectedTransporteurs.filter(t => t.id !== transporteurId);
    
    // Mettre à jour l'affichage
    updateSelectedTransporteursDisplay();
    
    // Mettre à jour les éléments visuels
    const transporteurItems = document.querySelectorAll(`.transporteur-item[data-id="${transporteurId}"]`);
    transporteurItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // Mettre à jour le champ caché
    updateHiddenInput();
}

/**
 * Filtre les transporteurs en fonction de la recherche
 */
function filterTransporteurs() {
    const query = widgetState.searchQuery.toLowerCase();
    const transporteurItems = document.querySelectorAll('.transporteur-item');
    
    transporteurItems.forEach(item => {
        const transporteurId = item.dataset.id;
        let transporteur;
        
        // Trouver le transporteur correspondant
        if (widgetState.transporteursDisponibles.some(t => t.id.toString() === transporteurId)) {
            transporteur = widgetState.transporteursDisponibles.find(t => t.id.toString() === transporteurId);
        } else if (widgetState.transporteursBientotDisponibles.some(t => t.id.toString() === transporteurId)) {
            transporteur = widgetState.transporteursBientotDisponibles.find(t => t.id.toString() === transporteurId);
        } else {
            return;
        }
        
        // Si la recherche est vide, afficher tous les transporteurs
        if (!query) {
            item.style.display = '';
            return;
        }
        
        // Vérifier si le transporteur correspond à la recherche
        const matchesSearch = 
            (transporteur.nom && transporteur.nom.toLowerCase().includes(query)) ||
            (transporteur.prenom && transporteur.prenom.toLowerCase().includes(query)) ||
            (transporteur.matricule && transporteur.matricule.toLowerCase().includes(query)) ||
            (transporteur.permis && transporteur.permis.toLowerCase().includes(query));
        
        // Afficher ou masquer l'élément
        item.style.display = matchesSearch ? '' : 'none';
    });
}

/**
 * Met à jour le champ caché avec les IDs des transporteurs sélectionnés
 */
function updateHiddenInput() {
    const elements = getWidgetElements();
    const selectedIds = widgetState.selectedTransporteurs.map(t => t.id);
    elements.hiddenInput.value = JSON.stringify(selectedIds);
}

/**
 * Soumet les transporteurs sélectionnés
 */
function submitSelectedTransporteurs(elements) {
    if (widgetState.selectedTransporteurs.length === 0) {
        showNotification("Veuillez sélectionner au moins un transporteur", "warning");
        return;
    }
    
    if (widgetState.animationInProgress) {
        return;
    }
    
    // Démarrer l'animation
    widgetState.animationInProgress = true;
    
    // Animation du chauffeur qui baisse le bras
    elements.driverArm.classList.remove('waving');
    elements.driverArm.classList.add('down');
    
    // Faire tourner les roues
    elements.truckWheels.forEach(wheel => {
        wheel.classList.add('spinning');
    });
    
    // Faire partir le camion
    setTimeout(() => {
        elements.mainTruck.classList.add('drive-away');
        
        // Faire arriver le nouveau camion
        setTimeout(() => {
            elements.newTruck.style.display = 'block';
            setTimeout(() => {
                elements.newTruck.classList.add('arrive');
                
                // Arrêter l'animation
                setTimeout(() => {
                    widgetState.animationInProgress = false;
                    
                    // Soumettre le formulaire si nécessaire
                    // document.querySelector('form').submit();
                }, 1000);
            }, 100);
        }, widgetConfig.drivingSpeed / 2);
    }, 500);
    
    // Mettre à jour le champ caché
    updateHiddenInput();
    
    // Afficher un message de succès
    showNotification(`${widgetState.selectedTransporteurs.length} transporteurs sélectionnés avec succès`, "success");
}

/**
 * Affiche une notification
 */
function showNotification(message, type = 'info') {
    // Créer l'élément de notification s'il n'existe pas
    let notificationContainer = document.querySelector('.widget-notification');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'widget-notification';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Ajouter la notification au conteneur
    notificationContainer.appendChild(notification);
    
    // Supprimer la notification après quelques secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Initialiser le widget au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log("Chargement du widget de transport...");
    
    // Vérifier si nous sommes sur une page de création ou d'édition de prestation
    const isPrestation = document.querySelector('form[action*="prestation"]');
    if (!isPrestation) {
        console.log("Pas sur une page de prestation, widget non initialisé");
        return;
    }
    
    // Initialiser le widget
    setTimeout(() => {
        initWidgetTransport();
    }, 500);
});
