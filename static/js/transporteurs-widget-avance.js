/**
 * Widget avancé pour la recherche et la sélection des transporteurs
 * Fonctionnalités:
 * - Barre de recherche intelligente (nom, prénom, matricule, permis)
 * - Affichage en temps réel des transporteurs disponibles
 * - Suggestion des transporteurs bientôt disponibles
 * - Interface améliorée avec un bon thème UI/UX
 * - Notification des transporteurs lors de l'assignation
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Widget avancé des transporteurs chargé");
    
    // Créer et insérer le widget dans la page
    initTransporteursWidget();
    
    // Initialiser les fonctionnalités du widget
    initWidgetFunctionality();
});

/**
 * Affiche un message dans le conteneur de résultats
 * Cette fonction est définie au niveau global pour être accessible partout
 */
function afficherMessage(message, type, isLoading = false) {
    try {
        // Récupérer ou créer le conteneur de résultats
        let resultsContainer = document.getElementById('transporteurs-resultats');
        
        if (!resultsContainer) {
            console.error("Conteneur de résultats non trouvé");
            return;
        }
        
        // Afficher le conteneur
        resultsContainer.style.display = 'block';
        
        // Définir le contenu en fonction du type
        if (type === "custom") {
            resultsContainer.innerHTML = message;
        } else {
            const iconClass = {
                'info': 'fa-info-circle',
                'success': 'fa-check-circle',
                'warning': 'fa-exclamation-triangle',
                'danger': 'fa-exclamation-circle'
            }[type] || 'fa-info-circle';
            
            const spinnerHtml = isLoading ? '<i class="fas fa-spinner fa-spin me-2"></i> ' : '';
            
            resultsContainer.innerHTML = `
                <div class="alert alert-${type} mb-3">
                    ${spinnerHtml}<i class="fas ${iconClass} me-2"></i> ${message}
                </div>
            `;
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage du message:", error);
    }
}

/**
 * Initialise le widget des transporteurs en créant et insérant le HTML nécessaire
 */
function initTransporteursWidget() {
    // Trouver le conteneur cible
    const targetContainer = document.querySelector('.transporteurs');
    if (!targetContainer) {
        console.error("Conteneur des transporteurs non trouvé");
        return;
    }
    
    // Créer le HTML du widget
    const widgetHTML = `
    <div class="transporteurs-widget-container">
        <!-- Boutons d'action -->
        <div class="mb-3 d-flex flex-wrap gap-2">
            <button type="button" id="show-calendar-btn" class="btn btn-primary">
                <i class="fas fa-calendar-alt"></i> Voir les disponibilités
            </button>
            <button type="button" id="verifier-disponibilite" class="btn btn-info">
                <i class="fas fa-sync-alt"></i> Vérifier les disponibilités
            </button>
        </div>
        
        <!-- Widget de recherche et sélection des transporteurs -->
        <div class="card border-primary mb-4 shadow-sm">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-truck"></i> Transporteurs disponibles</h5>
                <span class="badge bg-light text-primary selected-transporteurs-count">0 transporteur(s) sélectionné(s)</span>
            </div>
            
            <div class="card-body">
                <!-- Barre de recherche -->
                <div class="input-group mb-3">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" id="transporteur-search" class="form-control" placeholder="Rechercher par nom, prénom, matricule ou permis...">
                    <button class="btn btn-outline-secondary" type="button" id="clear-search">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Filtres rapides -->
                <div class="mb-3 d-flex flex-wrap gap-2">
                    <button type="button" class="btn btn-sm btn-outline-primary filter-btn" data-filter="all">
                        Tous
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-success filter-btn" data-filter="available">
                        Disponibles
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-warning filter-btn" data-filter="soon">
                        Bientôt disponibles
                    </button>
                </div>
                
                <!-- Résultats de la vérification -->
                <div id="transporteurs-resultats" class="mb-3"></div>
                
                <!-- Liste des transporteurs -->
                <div class="transporteurs-list-container">
                    <select name="transporteurs" id="transporteurs" multiple="multiple" class="form-select" size="10">
                        <!-- Les options seront ajoutées dynamiquement -->
                    </select>
                </div>
                
                <!-- Informations sur le transporteur sélectionné -->
                <div id="transporteur-details" class="mt-3 d-none">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            Détails du transporteur
                        </div>
                        <div class="card-body" id="transporteur-details-content">
                            <!-- Les détails seront ajoutés dynamiquement -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Remplacer le contenu existant
    targetContainer.innerHTML = widgetHTML;
    
    // Appliquer les styles CSS personnalisés
    applyCustomStyles();
}

/**
 * Applique des styles CSS personnalisés pour améliorer l'apparence du widget
 */
function applyCustomStyles() {
    // Créer un élément style
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .transporteurs-widget-container {
            width: 100%;
        }
        
        .transporteurs-list-container {
            position: relative;
        }
        
        #transporteurs {
            width: 100%;
            min-width: 100%;
            box-sizing: border-box;
            display: block;
            position: static;
            appearance: listbox;
            height: auto;
            min-height: 300px;
            max-height: 400px;
            padding: 0.5rem;
            margin: 0;
            border: 2px solid #0d6efd;
            border-radius: 0.5rem;
            box-shadow: 0 0 15px rgba(13, 110, 253, 0.15);
            font-family: Arial, sans-serif;
            font-size: 1rem;
            line-height: 1.5;
            color: #333;
        }
        
        #transporteurs option {
            padding: 0.75rem 1rem;
            margin-bottom: 0.25rem;
            border-radius: 0.25rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        #transporteurs option:hover {
            background-color: #f8f9fa;
        }
        
        #transporteurs option.available {
            background-color: #d1e7dd;
            color: #0f5132;
            border-left: 4px solid #198754;
        }
        
        #transporteurs option.soon-available {
            background-color: #fff3cd;
            color: #664d03;
            border-left: 4px solid #ffc107;
        }
        
        #transporteurs option.unavailable {
            background-color: #f8f9fa;
            color: #6c757d;
            border-left: 4px solid #adb5bd;
        }
        
        #transporteurs option:checked {
            background-color: #cfe2ff !important;
            color: #0a58ca !important;
            border-left: 4px solid #0d6efd !important;
            font-weight: bold;
        }
        
        .transporteur-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-weight: 600;
            margin-right: 0.5rem;
        }
        
        .transporteur-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .transporteur-info-details {
            display: flex;
            flex-direction: column;
        }
        
        .transporteur-search-highlight {
            background-color: #fff3cd;
            font-weight: bold;
        }
    `;
    
    // Ajouter le style à la page
    document.head.appendChild(styleElement);
}

/**
 * Initialise les fonctionnalités du widget
 */
function initWidgetFunctionality() {
    console.log("Initialisation des fonctionnalités du widget");
    
    // Récupérer les éléments du DOM
    const transporteursSelect = document.getElementById('transporteurs');
    const searchInput = document.getElementById('transporteur-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const verifierBtn = document.getElementById('verifier-disponibilite');
    const showCalendarBtn = document.getElementById('show-calendar-btn');
    const transporteurDetailsContainer = document.getElementById('transporteur-details');
    
    // Vérifier que tous les éléments nécessaires sont présents
    if (!transporteursSelect) {
        console.error("Élément select des transporteurs non trouvé");
        return;
    }
    
    // Initialiser le compteur de sélection
    updateSelectedCount();
    
    // Ajouter les écouteurs d'événements
    
    // Recherche de transporteurs
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterTransporteurs(this.value);
        });
    }
    
    // Effacer la recherche
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                filterTransporteurs('');
            }
        });
    }
    
    // Filtres rapides
    if (filterButtons && filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                applyFilter(filter);
            });
        });
    }
    
    // Vérifier les disponibilités
    if (verifierBtn) {
        verifierBtn.addEventListener('click', function() {
            verifierDisponibilitesAvancees();
        });
    }
    
    // Afficher le calendrier
    if (showCalendarBtn) {
        showCalendarBtn.addEventListener('click', function() {
            // Implémentation à venir
            alert("Fonctionnalité de calendrier en cours de développement");
        });
    }
    
    // Afficher les détails du transporteur sélectionné
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', function() {
            showTransporteurDetails();
        });
    }
    
    // Vérifier les disponibilités au chargement si les dates sont renseignées
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    
    if (dateDebutInput && dateFinInput && dateDebutInput.value && dateFinInput.value) {
        verifierDisponibilitesAvancees();
    }
}

/**
 * Affiche les détails des transporteurs sélectionnés
 * Cette fonction est définie au niveau global pour être accessible partout
 */
function showTransporteurDetails() {
    try {
        const transporteursSelect = document.getElementById('transporteurs');
        const transporteurDetailsContainer = document.getElementById('transporteur-details');
        
        if (!transporteursSelect || !transporteurDetailsContainer) {
            console.error("Éléments nécessaires non trouvés");
            return;
        }
        
        const selectedOptions = transporteursSelect.selectedOptions;
        
        // Vider le conteneur de détails
        transporteurDetailsContainer.innerHTML = '';
        
        // Si aucun transporteur sélectionné, masquer le conteneur
        if (selectedOptions.length === 0) {
            transporteurDetailsContainer.style.display = 'none';
            return;
        }
        
        // Afficher le conteneur
        transporteurDetailsContainer.style.display = 'block';
        
        // Créer un élément pour chaque transporteur sélectionné
        Array.from(selectedOptions).forEach((option, index) => {
            // Récupérer les données du transporteur
            const id = option.value;
            const nom = option.dataset.nom || '';
            const prenom = option.dataset.prenom || '';
            const nomComplet = `${prenom} ${nom}`.trim();
            const vehicule = option.dataset.vehicule || 'Non spécifié';
            const email = option.dataset.email || '';
            const telephone = option.dataset.telephone || '';
            const permis = option.dataset.permis || '';
            const matricule = option.dataset.matricule || '';
            const disponibleDate = option.dataset.disponibleDate || '';
            const isAvailable = option.classList.contains('available');
            
            // Créer la carte de détails
            const detailCard = document.createElement('div');
            detailCard.className = 'card mb-3 border-primary shadow-sm';
            detailCard.dataset.transporteurId = id;
            
            // Définir le contenu de la carte
            detailCard.innerHTML = `
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-user me-2"></i> ${nomComplet}
                    </h6>
                    <span class="badge ${isAvailable ? 'bg-success' : 'bg-warning text-dark'}">
                        ${isAvailable ? 'Disponible' : 'Bientôt disponible'}
                    </span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><i class="fas fa-truck me-2"></i> <strong>Véhicule:</strong> ${vehicule}</p>
                            <p><i class="fas fa-id-card me-2"></i> <strong>Permis:</strong> ${permis}</p>
                            <p><i class="fas fa-car me-2"></i> <strong>Matricule:</strong> ${matricule}</p>
                        </div>
                        <div class="col-md-6">
                            <p><i class="fas fa-envelope me-2"></i> <strong>Email:</strong> ${email}</p>
                            <p><i class="fas fa-phone me-2"></i> <strong>Téléphone:</strong> ${telephone}</p>
                            <p><i class="fas fa-calendar me-2"></i> <strong>Disponible le:</strong> ${disponibleDate}</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-light">
                    <button type="button" class="btn btn-sm btn-outline-danger remove-transporteur" data-id="${id}">
                        <i class="fas fa-times"></i> Retirer
                    </button>
                </div>
            `;
            
            // Ajouter la carte au conteneur
            transporteurDetailsContainer.appendChild(detailCard);
            
            // Ajouter un écouteur d'événement pour le bouton de suppression
            const removeBtn = detailCard.querySelector('.remove-transporteur');
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    const transporteurId = this.dataset.id;
                    
                    // Désélectionner l'option correspondante
                    const option = transporteursSelect.querySelector(`option[value="${transporteurId}"]`);
                    if (option) {
                        option.selected = false;
                    }
                    
                    // Mettre à jour l'affichage
                    showTransporteurDetails();
                    updateSelectedCount();
                });
            }
        });
    } catch (error) {
        console.error("Erreur lors de l'affichage des détails:", error);
    }
}

/**
 * Met à jour le compteur de transporteurs sélectionnés
 * Cette fonction est définie au niveau global pour être accessible partout
 */
function updateSelectedCount() {
    try {
        const transporteursSelect = document.getElementById('transporteurs');
        const selectedCount = transporteursSelect ? transporteursSelect.selectedOptions.length : 0;
        const countElement = document.querySelector('.selected-transporteurs-count');
        
        if (countElement) {
            countElement.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
            
            // Mettre à jour la classe en fonction du nombre de sélections
            if (selectedCount > 0) {
                countElement.classList.remove('bg-light', 'text-primary');
                countElement.classList.add('bg-primary', 'text-white');
            } else {
                countElement.classList.remove('bg-primary', 'text-white');
                countElement.classList.add('bg-light', 'text-primary');
            }
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du compteur:", error);
    }
}

/**
 * Filtre les transporteurs en fonction de la recherche
 * Cette fonction est définie au niveau global pour être accessible partout
 */
function filterTransporteurs(query) {
    try {
        const transporteursSelect = document.getElementById('transporteurs');
        
        if (!transporteursSelect) {
            console.error("Élément select des transporteurs non trouvé");
            return;
        }
        
        const options = transporteursSelect.querySelectorAll('option');
        const optgroups = transporteursSelect.querySelectorAll('optgroup');
        const queryLower = query.toLowerCase().trim();
        
        // Si la recherche est vide, tout afficher
        if (!queryLower) {
            options.forEach(opt => {
                opt.style.display = '';
            });
            
            // Réactiver le premier bouton de filtre (Tous)
            const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
            if (allFilterBtn) {
                allFilterBtn.click();
            }
            
            return;
        }
        
        // Parcourir toutes les options et filtrer
        let matchCount = 0;
        
        options.forEach(opt => {
            // Récupérer les données du transporteur
            const nom = (opt.dataset.nom || '').toLowerCase();
            const prenom = (opt.dataset.prenom || '').toLowerCase();
            const nomComplet = `${prenom} ${nom}`.toLowerCase();
            const matricule = (opt.dataset.matricule || '').toLowerCase();
            const permis = (opt.dataset.permis || '').toLowerCase();
            const vehicule = (opt.dataset.vehicule || '').toLowerCase();
            
            // Vérifier si la recherche correspond à l'un des critères
            const match = 
                nomComplet.includes(queryLower) || 
                matricule.includes(queryLower) || 
                permis.includes(queryLower) ||
                vehicule.includes(queryLower);
            
            // Afficher ou masquer l'option
            opt.style.display = match ? '' : 'none';
            
            if (match) matchCount++;
        });
        
        // Mettre à jour les optgroups (masquer ceux qui n'ont pas d'options visibles)
        optgroups.forEach(group => {
            const visibleOptions = Array.from(group.querySelectorAll('option')).filter(opt => opt.style.display !== 'none');
            group.style.display = visibleOptions.length > 0 ? '' : 'none';
        });
        
        // Afficher un message si aucun résultat
        if (matchCount === 0) {
            console.log("Aucun transporteur ne correspond à la recherche:", query);
        }
    } catch (error) {
        console.error("Erreur lors du filtrage des transporteurs:", error);
    }
}

/**
 * Applique un filtre aux transporteurs en fonction du bouton cliqué
 * Cette fonction est définie au niveau global pour être accessible partout
 */
function applyFilter(filter) {
    try {
        console.log("Application du filtre:", filter);
        
        const transporteursSelect = document.getElementById('transporteurs');
        if (!transporteursSelect) {
            console.error("Élément select des transporteurs non trouvé");
            return;
        }
        
        const options = transporteursSelect.querySelectorAll('option');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const searchInput = document.getElementById('transporteur-search');
        
        // Mettre à jour les classes des boutons de filtre
        if (filterButtons && filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                // Retirer les classes actives de tous les boutons
                btn.classList.remove('active', 'btn-primary', 'btn-success', 'btn-warning');
                btn.classList.add('btn-outline-primary', 'btn-outline-success', 'btn-outline-warning');
                
                // Ajouter la classe active au bouton correspondant au filtre
                if (btn.dataset.filter === filter) {
                    btn.classList.add('active');
                    
                    // Ajouter la classe de couleur appropriée
                    if (filter === 'all') {
                        btn.classList.remove('btn-outline-primary');
                        btn.classList.add('btn-primary');
                    } else if (filter === 'available') {
                        btn.classList.remove('btn-outline-success');
                        btn.classList.add('btn-success');
                    } else if (filter === 'soon') {
                        btn.classList.remove('btn-outline-warning');
                        btn.classList.add('btn-warning');
                    }
                }
            });
        }
        
        // Appliquer le filtre aux options
        if (options && options.length > 0) {
            options.forEach(option => {
                if (!option) return;
                
                try {
                    switch(filter) {
                        case 'all':
                            option.style.display = '';
                            break;
                        case 'available':
                            option.style.display = option.classList.contains('available') ? '' : 'none';
                            break;
                        case 'soon':
                            option.style.display = option.classList.contains('soon-available') ? '' : 'none';
                            break;
                        default:
                            option.style.display = '';
                    }
                } catch (optionError) {
                    console.error("Erreur lors du traitement d'une option:", optionError);
                }
            });
        }
        
        // Réappliquer le filtre de recherche si nécessaire
        if (searchInput && searchInput.value.trim()) {
            filterTransporteurs(searchInput.value.trim());
        }
        
        // Mettre à jour le compteur de sélection
        updateSelectedCount();
        
    } catch (error) {
        console.error("Erreur lors de l'application du filtre:", error.message || "Erreur inconnue");
    }
}

/**
 * Traite les résultats de la vérification de disponibilité et met à jour l'interface
 * Cette fonction est définie au niveau global pour être accessible partout
 * @param {Object} data - Données de disponibilité des transporteurs
 */
function traiterResultatsDisponibiliteAvances(data) {
    try {
        const transporteursSelect = document.getElementById('transporteurs');
        
        if (!transporteursSelect) {
            console.error("Élément select des transporteurs non trouvé");
            return;
        }
        
        if (!data) {
            throw new Error("Aucune donnée reçue de l'API");
        }
        
        // Récupérer les transporteurs disponibles et bientôt disponibles
        const transporteursDisponibles = data.transporteurs || [];
        const transporteursBientotDisponibles = data.soon_available || [];
        
        // Conserver les transporteurs déjà sélectionnés
        const selectedIds = Array.from(transporteursSelect.selectedOptions).map(opt => opt.value);
        
        // Vider la liste des transporteurs
        transporteursSelect.innerHTML = '';
        
        // Compter le nombre de transporteurs dans chaque catégorie
        const nbDisponibles = transporteursDisponibles.length;
        const nbBientotDisponibles = transporteursBientotDisponibles.length;
        
        // Créer un groupe pour les transporteurs disponibles
        if (nbDisponibles > 0) {
            const disponiblesGroup = document.createElement('optgroup');
            disponiblesGroup.label = `Transporteurs disponibles (${nbDisponibles})`;
            
            // Ajouter chaque transporteur disponible
            transporteursDisponibles.forEach(t => {
                const option = creerOptionTransporteur(t, 'available', selectedIds);
                disponiblesGroup.appendChild(option);
            });
            
            transporteursSelect.appendChild(disponiblesGroup);
        }
        
        // Créer un groupe pour les transporteurs bientôt disponibles
        if (nbBientotDisponibles > 0) {
            const bientotGroup = document.createElement('optgroup');
            bientotGroup.label = `Bientôt disponibles (${nbBientotDisponibles})`;
            
            // Ajouter chaque transporteur bientôt disponible
            transporteursBientotDisponibles.forEach(t => {
                const option = creerOptionTransporteur(t, 'soon', selectedIds);
                bientotGroup.appendChild(option);
            });
            
            transporteursSelect.appendChild(bientotGroup);
        }
        
        // Afficher un message de résultat
        let messageHTML = '';
        
        if (data.success) {
            if (transporteursDisponibles.length > 0) {
                messageHTML += `
                    <div class="alert alert-success mb-3">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>${transporteursDisponibles.length} transporteur(s) disponible(s)</strong> pour cette période
                    </div>
                `;
            } else {
                messageHTML += `
                    <div class="alert alert-warning mb-3">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Aucun transporteur disponible</strong> pour cette période
                    </div>
                `;
            }
            
            if (transporteursBientotDisponibles.length > 0) {
                messageHTML += `
                    <div class="alert alert-info mb-3">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>${transporteursBientotDisponibles.length} transporteur(s) bientôt disponible(s)</strong>
                    </div>
                `;
            }
        } else {
            messageHTML += `
                <div class="alert alert-danger mb-3">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    <strong>Erreur:</strong> ${data.message || 'Impossible de vérifier les disponibilités'}
                </div>
            `;
        }
        
        // Afficher le message
        afficherMessage(messageHTML, "custom");
        
        // Activer le premier bouton de filtre (Tous)
        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allFilterBtn) {
            allFilterBtn.click();
        }
        
        // Mettre à jour le compteur de sélection
        const updateSelectedCount = document.querySelector('.selected-transporteurs-count');
        if (updateSelectedCount && typeof initWidgetFunctionality.updateSelectedCount === 'function') {
            initWidgetFunctionality.updateSelectedCount();
        }
    } catch (error) {
        console.error("Erreur lors du traitement des résultats:", error);
        afficherMessage(`Erreur lors du traitement des résultats: ${error.message}`, "danger");
    }
}

/**
 * Crée une option pour un transporteur
 * Cette fonction est définie au niveau global pour être accessible partout
 */
function creerOptionTransporteur(transporteur, status, selectedIds = []) {
    // Gestion des différents formats de données possibles
    const id = transporteur.id || transporteur.user_id || transporteur.transporteur_id;
    const prenom = transporteur.prenom || '';
    const nom = transporteur.nom || '';
    const nomComplet = `${prenom} ${nom}`.trim();
    const vehicule = transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié';
    const email = transporteur.email || '';
    const telephone = transporteur.telephone || '';
    const permis = transporteur.permis_conduire || '';
    const matricule = transporteur.matricule_vehicule || '';
    
    // Formater la date de disponibilité si elle existe
    let disponibleDate = '';
    if (transporteur.disponible_a_partir || transporteur.date_disponibilite) {
        const dateObj = new Date(transporteur.disponible_a_partir || transporteur.date_disponibilite);
        disponibleDate = dateObj.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    // Créer l'option
    const option = document.createElement('option');
    option.value = id;
    option.text = nomComplet;
    option.classList.add(status === 'available' ? 'available' : 'soon-available');
    
    // Ajouter des attributs data pour la recherche et le filtrage
    option.dataset.status = status;
    option.dataset.nom = nom;
    option.dataset.prenom = prenom;
    option.dataset.vehicule = vehicule;
    option.dataset.email = email;
    option.dataset.telephone = telephone;
    option.dataset.permis = permis;
    option.dataset.matricule = matricule;
    
    if (disponibleDate) {
        option.dataset.disponibleDate = disponibleDate;
    }
    
    // Sélectionner l'option si elle était déjà sélectionnée
    if (selectedIds.includes(id.toString())) {
        option.selected = true;
    }
    
    return option;
}

/**
 * Vérifie la disponibilité des transporteurs et met à jour l'interface
 * Cette fonction est définie au niveau global pour être accessible partout
 */
function verifierDisponibilitesAvancees() {
    console.log("Vérification avancée des disponibilités démarrée");
    
    // Éléments du DOM
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const transporteursSelect = document.getElementById('transporteurs');
    
    // Vérifier si tous les éléments nécessaires sont présents
    if (!dateDebutInput || !dateFinInput || !typeDemenagementSelect || !transporteursSelect) {
        console.error("Éléments du formulaire manquants pour le widget des transporteurs");
        return;
    }
    
    try {
        // Récupérer les valeurs du formulaire
        const dateDebut = dateDebutInput.value;
        const dateFin = dateFinInput.value;
        const typeDemenagement = typeDemenagementSelect.value;
        const prestationId = document.querySelector('input[name="id"]') ? 
                            document.querySelector('input[name="id"]').value : '';
        
        // Validation des données
        if (!dateDebut || !dateFin) {
            afficherMessage("Veuillez remplir les dates de début et de fin", "warning");
            return;
        }
        
        if (!typeDemenagement) {
            afficherMessage("Veuillez sélectionner un type de déménagement", "warning");
            return;
        }
        
        // Afficher un indicateur de chargement
        afficherMessage("Recherche des transporteurs disponibles...", "info", true);
        
        // Préparation des données pour l'API
        const donnees = {
            date_debut: dateDebut,
            date_fin: dateFin,
            type_demenagement_id: typeDemenagement,
            prestation_id: prestationId
        };
        
        console.log("Données envoyées à l'API:", donnees);
        
        // Appel à l'API
        fetch('/api/check_disponibilite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(donnees)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Réponse de l'API:", data);
            traiterResultatsDisponibiliteAvances(data);
        })
        .catch(error => {
            console.error("Erreur lors de la vérification:", error);
            afficherMessage(`Erreur lors de la vérification: ${error.message}`, "danger");
        });
    } catch (error) {
        console.error("Exception lors de la vérification:", error);
        afficherMessage(`Une erreur inattendue s'est produite: ${error.message}`, "danger");
    }
}

/**
 * Applique des styles CSS personnalisés pour améliorer l'apparence du widget
 */
function applyCustomStyles() {
    // Créer un élément style
    const style = document.createElement('style');
    
    // Définir les styles CSS
    style.textContent = `
        .transporteurs-widget-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .transporteurs-list-container {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
        }
        
        #transporteurs {
            border: none;
            width: 100%;
            height: 100%;
            min-height: 200px;
        }
        
        #transporteurs option {
            padding: 8px 12px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
        }
        
        #transporteurs option:hover {
            background-color: #f8f9fa;
        }
        
        #transporteurs option.available {
            color: #198754;
            font-weight: 500;
        }
        
        #transporteurs option.soon-available {
            color: #fd7e14;
            font-weight: 500;
        }
        
        #transporteurs option:checked {
            background-color: #0d6efd;
            color: white;
        }
        
        .filter-btn.active {
            font-weight: bold;
        }
        
        #transporteur-search:focus {
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
            border-color: #86b7fe;
        }
        
        #transporteurs-resultats {
            transition: all 0.3s ease;
        }
        
        .selected-transporteurs-count {
            font-size: 0.9rem;
        }
    `;
    
    // Ajouter les styles à la page
    document.head.appendChild(style);
}

/**
 * Vérifie la disponibilité des transporteurs et met à jour l'interface
 * Cette fonction est définie au niveau global pour être accessible partout
 */
function verifierDisponibilitesAvancees() {
    console.log("Vérification avancée des disponibilités démarrée");
    
    // Éléments du DOM
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    
    // Vérifier si tous les éléments nécessaires sont présents
    if (!dateDebutInput || !dateFinInput || !typeDemenagementSelect) {
        console.error("Éléments du formulaire manquants pour la vérification des transporteurs");
        afficherMessage("Veuillez remplir tous les champs obligatoires (dates et type de déménagement)", "warning");
        return;
    }
    
    try {
        // Récupérer les valeurs du formulaire
        const dateDebut = dateDebutInput.value;
        const dateFin = dateFinInput.value;
        const typeDemenagement = typeDemenagementSelect.value;
        const prestationId = document.querySelector('input[name="id"]') ? 
                            document.querySelector('input[name="id"]').value : '';
        
        // Validation des données
        if (!dateDebut || !dateFin) {
            afficherMessage("Veuillez remplir les dates de début et de fin", "warning");
            return;
        }
        
        if (!typeDemenagement) {
            afficherMessage("Veuillez sélectionner un type de déménagement", "warning");
            return;
        }
        
        // Afficher un indicateur de chargement
        afficherMessage("Recherche des transporteurs disponibles...", "info", true);
        
        // Préparation des données pour l'API
        const donnees = {
            date_debut: dateDebut,
            date_fin: dateFin,
            type_demenagement_id: typeDemenagement,
            prestation_id: prestationId
        };
        
        console.log("Données envoyées à l'API:", donnees);
        
        // Appel à l'API
        fetch('/api/check_disponibilite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(donnees)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Réponse de l'API:", data);
            traiterResultatsDisponibiliteAvances(data);
        })
        .catch(error => {
            console.error("Erreur lors de la vérification:", error);
            afficherMessage(`Erreur lors de la vérification: ${error.message}`, "danger");
        });
    } catch (error) {
        console.error("Exception lors de la vérification:", error);
        afficherMessage(`Une erreur inattendue s'est produite: ${error.message}`, "danger");
    }
}

/**
 * Traite les résultats de la vérification de disponibilité et met à jour l'interface
 * @param {Object} data - Données de disponibilité des transporteurs
 */
function traiterResultatsDisponibiliteAvances(data) {
    console.log("Traitement des résultats de disponibilité", data);
    
    // Vérifier si la requête a réussi
    if (!data.success) {
        afficherMessage(data.message || "Erreur lors de la vérification des disponibilités", "danger");
        return;
    }
    
    // Récupérer les listes de transporteurs
    const transporteursDisponibles = data.disponibles || [];
    const transporteursBientotDisponibles = data.bientot_disponibles || [];
    const transporteursNonDisponibles = data.non_disponibles || [];
    
    // Récupérer l'élément select des transporteurs
    const transporteursSelect = document.getElementById('transporteurs');
    if (!transporteursSelect) {
        console.error("Élément select des transporteurs non trouvé");
        return;
    }
    
    // Sauvegarder les transporteurs actuellement sélectionnés
    const transporteursSelectionnes = Array.from(transporteursSelect.selectedOptions).map(option => option.value);
    
    // Vider le select
    transporteursSelect.innerHTML = '';
    
    // Créer les groupes d'options
    const groupeDisponibles = document.createElement('optgroup');
    groupeDisponibles.label = 'Transporteurs disponibles';
    
    const groupeBientotDisponibles = document.createElement('optgroup');
    groupeBientotDisponibles.label = 'Bientôt disponibles';
    
    const groupeNonDisponibles = document.createElement('optgroup');
    groupeNonDisponibles.label = 'Non disponibles';
    
    // Ajouter les transporteurs disponibles
    transporteursDisponibles.forEach(transporteur => {
        const option = document.createElement('option');
        option.value = transporteur.id;
        option.text = `${transporteur.prenom} ${transporteur.nom} - ${transporteur.vehicule || 'Aucun véhicule'}`;
        option.classList.add('disponible');
        option.selected = transporteursSelectionnes.includes(transporteur.id.toString());
        groupeDisponibles.appendChild(option);
    });
    
    // Ajouter les transporteurs bientôt disponibles
    transporteursBientotDisponibles.forEach(transporteur => {
        const option = document.createElement('option');
        option.value = transporteur.id;
        option.text = `${transporteur.prenom} ${transporteur.nom} - Disponible le ${transporteur.disponible_le}`;
        option.classList.add('bientot-disponible');
        option.selected = transporteursSelectionnes.includes(transporteur.id.toString());
        groupeBientotDisponibles.appendChild(option);
    });
    
    // Ajouter les transporteurs non disponibles
    transporteursNonDisponibles.forEach(transporteur => {
        const option = document.createElement('option');
        option.value = transporteur.id;
        option.text = `${transporteur.prenom} ${transporteur.nom} - ${transporteur.raison || 'Non disponible'}`;
        option.classList.add('non-disponible');
        option.disabled = true;
        groupeNonDisponibles.appendChild(option);
    });
    
    // Ajouter les groupes au select
    if (groupeDisponibles.children.length > 0) {
        transporteursSelect.appendChild(groupeDisponibles);
    }
    
    if (groupeBientotDisponibles.children.length > 0) {
        transporteursSelect.appendChild(groupeBientotDisponibles);
    }
    
    if (groupeNonDisponibles.children.length > 0) {
        transporteursSelect.appendChild(groupeNonDisponibles);
    }
    
    // Afficher un message de résultat
    let message = `${transporteursDisponibles.length} transporteur${transporteursDisponibles.length > 1 ? 's' : ''} disponible${transporteursDisponibles.length > 1 ? 's' : ''}`;
    if (transporteursBientotDisponibles.length > 0) {
        message += `, ${transporteursBientotDisponibles.length} bientôt disponible${transporteursBientotDisponibles.length > 1 ? 's' : ''}`;
    }
    message += ` sur un total de ${transporteursDisponibles.length + transporteursBientotDisponibles.length + transporteursNonDisponibles.length}`;
    
    // Déterminer le type de message en fonction du nombre de transporteurs disponibles
    let typeMessage = "info";
    if (transporteursDisponibles.length === 0) {
        typeMessage = "danger";
    } else if (transporteursDisponibles.length < 3) {
        typeMessage = "warning";
    } else {
        typeMessage = "success";
    }
    
    afficherMessage(message, typeMessage);
    
    // Ajouter des styles CSS pour les différents types de transporteurs
    ajouterStylesTransporteurs();
}

/**
 * Ajoute des styles CSS pour les différents types de transporteurs dans le select
 */
function ajouterStylesTransporteurs() {
    // Vérifier si les styles existent déjà
    if (document.getElementById('transporteurs-styles')) {
        return;
    }
    
    // Créer un élément style
    const styleElement = document.createElement('style');
    styleElement.id = 'transporteurs-styles';
    
    // Définir les styles
    styleElement.textContent = `
        .disponible {
            background-color: #d4edda;
            color: #155724;
        }
        
        .bientot-disponible {
            background-color: #fff3cd;
            color: #856404;
        }
        
        .non-disponible {
            background-color: #f8d7da;
            color: #721c24;
            text-decoration: line-through;
        }
    `;
    
    // Ajouter les styles au document
    document.head.appendChild(styleElement);
}

/**
 * Ajoute une barre de recherche pour filtrer les transporteurs
 */
function ajouterBarreRechercheTransporteurs() {
    // Vérifier si la barre de recherche existe déjà
    if (document.getElementById('recherche-transporteurs')) {
        return;
    }
    
    // Récupérer l'élément select des transporteurs
    const transporteursSelect = document.getElementById('transporteurs');
    if (!transporteursSelect) {
        console.error("Élément select des transporteurs non trouvé");
        return;
    }
    
    // Créer le conteneur de la barre de recherche
    const rechercheContainer = document.createElement('div');
    rechercheContainer.className = 'input-group mb-3';
    
    // Créer l'icône de recherche
    const searchIconSpan = document.createElement('span');
    searchIconSpan.className = 'input-group-text';
    searchIconSpan.innerHTML = '<i class="fas fa-search"></i>';
    
    // Créer l'input de recherche
    const rechercheInput = document.createElement('input');
    rechercheInput.type = 'text';
    rechercheInput.id = 'recherche-transporteurs';
    rechercheInput.className = 'form-control';
    rechercheInput.placeholder = 'Rechercher un transporteur (nom, prénom, véhicule, permis)';
    
    // Ajouter l'événement de recherche
    rechercheInput.addEventListener('input', filtrerTransporteurs);
    
    // Assembler les éléments
    rechercheContainer.appendChild(searchIconSpan);
    rechercheContainer.appendChild(rechercheInput);
    
    // Insérer la barre de recherche avant le select
    transporteursSelect.parentNode.insertBefore(rechercheContainer, transporteursSelect);
}

/**
 * Filtre les transporteurs en fonction du texte saisi dans la barre de recherche
 */
function filtrerTransporteurs() {
    const rechercheInput = document.getElementById('recherche-transporteurs');
    const transporteursSelect = document.getElementById('transporteurs');
    
    if (!rechercheInput || !transporteursSelect) {
        return;
    }
    
    const texteRecherche = rechercheInput.value.toLowerCase();
    
    // Parcourir tous les groupes d'options
    Array.from(transporteursSelect.getElementsByTagName('optgroup')).forEach(groupe => {
        let optionsVisibles = 0;
        
        // Parcourir toutes les options du groupe
        Array.from(groupe.getElementsByTagName('option')).forEach(option => {
            const texteOption = option.text.toLowerCase();
            const visible = texteOption.includes(texteRecherche);
            
            // Afficher ou masquer l'option
            if (visible) {
                option.style.display = '';
                optionsVisibles++;
            } else {
                option.style.display = 'none';
            }
        });
        
        // Afficher ou masquer le groupe en fonction des options visibles
        groupe.style.display = optionsVisibles > 0 ? '' : 'none';
    });
}

// Initialiser la barre de recherche lors du chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    ajouterBarreRechercheTransporteurs();
    
    // Ajouter un événement pour vérifier les disponibilités lorsque les dates ou le type de déménagement changent
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    
    if (dateDebutInput && dateFinInput && typeDemenagementSelect) {
        dateDebutInput.addEventListener('change', verifierDisponibilitesAvancees);
        dateFinInput.addEventListener('change', verifierDisponibilitesAvancees);
        typeDemenagementSelect.addEventListener('change', verifierDisponibilitesAvancees);
        
        // Vérifier les disponibilités au chargement si les dates sont déjà remplies
        if (dateDebutInput.value && dateFinInput.value) {
            verifierDisponibilitesAvancees();
        }
    }
});
