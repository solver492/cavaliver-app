/**
 * Gestionnaire de plannings pour le calendrier R-Cavalier
 * Permet d'ajouter des plannings de différents types et de rediriger vers les formulaires appropriés
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du gestionnaire de plannings...');
    
    // Attendre que le calendrier soit complètement chargé avant d'ajouter le bouton
    setTimeout(() => {
        // Ajouter le bouton de planning
        initPlanningButton();
        
        // Surveiller les changements de vue pour ajouter/supprimer le bouton selon la vue
        observeViewChanges();
        
        // Initialiser le formulaire modal
        initPlanningForm();
    }, 1000);
});

/**
 * Ajoute le bouton "Ajouter Planning" à l'interface
 */
function initPlanningButton() {
    console.log('Tentative d\'ajout du bouton de planning...');
    
    // Vérifier si nous sommes sur la vue planning (plusieurs méthodes de détection)
    const isListView = document.querySelector('.fc-listMonth-button.fc-button-active') || 
                      (document.querySelector('.fc-view-harness .fc-list-view'));
    
    // Détection de la vue planning par le texte "Planning" dans l'onglet actif
    const activeTabWithPlanning = Array.from(document.querySelectorAll('.fc-button-active')).find(btn => 
        btn.textContent.trim().toLowerCase().includes('planning'));
    
    const isInPlanningView = isListView || activeTabWithPlanning;
    
    console.log('En vue planning ?', !!isInPlanningView);
    
    // Si le bouton existe déjà, le supprimer pour éviter les doublons
    const existingButton = document.getElementById('add-planning-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Créer seulement si nous sommes sur la vue planning
    if (isInPlanningView) {
        console.log('Vue planning détectée, ajout du bouton');
        
        // Créer le bouton
        const addButton = document.createElement('button');
        addButton.id = 'add-planning-button';
        addButton.className = 'btn btn-primary';
        addButton.style.marginLeft = '10px';
        addButton.innerHTML = '<i class="fas fa-plus me-1"></i> Ajouter Planning';
        
        // Ajouter le gestionnaire d'événement
        addButton.addEventListener('click', function() {
            // Montrer le formulaire modal
            const planningModal = document.getElementById('planning-modal');
            if (planningModal) {
                // Bootstrap 5
                const modal = new bootstrap.Modal(planningModal);
                modal.show();
            }
        });
        
        // Essayer plusieurs emplacements pour insérer le bouton
        let buttonPlaced = false;
        
        // 1. Essayer d'abord les filtres
        const filters = document.querySelector('.calendar-filters');
        if (filters) {
            filters.appendChild(addButton);
            buttonPlaced = true;
            console.log('Bouton placé dans les filtres');
        }
        
        // 2. Essayer après les boutons de vue (Planning, Jour, etc.)
        if (!buttonPlaced) {
            const viewNav = document.querySelector('.fc-header-toolbar .fc-toolbar-chunk:last-child');
            if (viewNav) {
                viewNav.appendChild(addButton);
                buttonPlaced = true;
                console.log('Bouton placé après les boutons de vue');
            }
        }
        
        // 3. Essayer en haut à droite du calendrier
        if (!buttonPlaced) {
            const headerRight = document.querySelectorAll('.fc-toolbar-chunk')[2]; // Dernier chunk
            if (headerRight) {
                headerRight.appendChild(addButton);
                buttonPlaced = true;
                console.log('Bouton placé dans le header droit du calendrier');
            }
        }
        
        // 4. Essayer avant les filtres "Toutes", "Confirmées", etc.
        if (!buttonPlaced) {
            const filterContainer = document.querySelector('.btn-group');
            if (filterContainer && filterContainer.parentNode) {
                filterContainer.parentNode.insertBefore(addButton, filterContainer);
                buttonPlaced = true;
                console.log('Bouton placé avant les filtres');
            }
        }
        
        // 5. Dernier recours : ajouter juste après le titre "Calendrier des prestations"
        if (!buttonPlaced) {
            const title = document.querySelector('h1, h2, h3, h4, h5, h6');
            if (title) {
                title.insertAdjacentElement('afterend', addButton);
                buttonPlaced = true;
                console.log('Bouton placé après le titre');
            }
        }
        
        console.log('Bouton ajouté avec succès :', buttonPlaced);
    } else {
        console.log('Pas en vue planning, bouton non ajouté');
    }
}

/**
 * Observe les changements de vue pour ajouter/supprimer le bouton
 */
function observeViewChanges() {
    // Surveiller les clics sur les boutons de vue
    document.querySelectorAll('.fc-button').forEach(button => {
        button.addEventListener('click', function() {
            // Laisser le temps à FullCalendar de changer la vue
            setTimeout(function() {
                // Vérifier si nous sommes en vue planning
                const isListView = document.querySelector('.fc-listMonth-button.fc-button-active');
                
                // Supprimer le bouton s'il existe et que nous ne sommes pas en vue planning
                const existingButton = document.getElementById('add-planning-button');
                if (existingButton && !isListView) {
                    existingButton.remove();
                }
                // Ajouter le bouton si nous sommes en vue planning et qu'il n'existe pas
                else if (isListView && !existingButton) {
                    initPlanningButton();
                }
            }, 100);
        });
    });
}

/**
 * Initialise la gestion du formulaire modal
 */
function initPlanningForm() {
    // Écouter la soumission du formulaire
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'planning-form') {
            e.preventDefault();
            
            // Récupérer les données du formulaire
            const formData = new FormData(e.target);
            const planningType = formData.get('planning-type');
            const startDate = formData.get('start-date');
            const endDate = formData.get('end-date');
            const planningName = formData.get('planning-name');
            const planningTags = formData.get('planning-tags');
            
            console.log('Données du planning:', {
                type: planningType,
                start: startDate,
                end: endDate,
                name: planningName,
                tags: planningTags
            });
            
            // Rediriger selon le type de planning
            if (planningType === 'demenagement') {
                // Construire l'URL avec paramètres pour préremplir la prestation
                const prestationUrl = `/prestations/prestations/add?name=${encodeURIComponent(planningName)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&tags=${encodeURIComponent(planningTags)}`;
                window.location.href = prestationUrl;
            } else if (planningType === 'stockage') {
                // Construire l'URL avec paramètres pour préremplir le stockage
                const stockageUrl = `/stockage/add?name=${encodeURIComponent(planningName)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&tags=${encodeURIComponent(planningTags)}`;
                window.location.href = stockageUrl;
            }
            
            // Fermer le modal
            const planningModal = document.getElementById('planning-modal');
            if (planningModal) {
                const modal = bootstrap.Modal.getInstance(planningModal);
                if (modal) modal.hide();
            }
        }
    });
    
    // Gérer les changements de type de planning pour mettre à jour l'interface
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'planning-type') {
            updatePlanningForm(e.target.value);
        }
    });
}

/**
 * Met à jour l'interface du formulaire en fonction du type sélectionné
 */
function updatePlanningForm(planningType) {
    const submitButton = document.querySelector('#planning-form button[type="submit"]');
    const formTitle = document.querySelector('#planning-modal .modal-title');
    const typeDescription = document.getElementById('type-description');
    
    if (!submitButton || !formTitle || !typeDescription) return;
    
    if (planningType === 'demenagement') {
        formTitle.textContent = 'Nouveau Planning de Déménagement';
        submitButton.textContent = 'Créer Déménagement';
        typeDescription.textContent = 'Ce planning vous dirigera vers le formulaire de création d\'une prestation de déménagement.';
    } else if (planningType === 'stockage') {
        formTitle.textContent = 'Nouveau Planning de Stockage';
        submitButton.textContent = 'Créer Stockage';
        typeDescription.textContent = 'Ce planning vous dirigera vers le formulaire de création d\'un nouveau stockage.';
    } else {
        formTitle.textContent = 'Nouveau Planning';
        submitButton.textContent = 'Continuer';
        typeDescription.textContent = 'Veuillez sélectionner un type de planning pour continuer.';
    }
}
