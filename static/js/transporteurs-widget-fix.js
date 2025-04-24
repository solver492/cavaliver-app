/**
 * Fichier de correction pour le widget de transporteurs
 * Ce fichier corrige les problèmes d'affichage des transporteurs dans le widget
 */

/**
 * Initialise le widget de sélection des transporteurs avec une recherche intelligente
 * Cette fonction est appelée automatiquement au chargement de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du widget de transporteurs (version corrigée)");
    initWidgetFunctionality();
});

/**
 * Initialise les fonctionnalités du widget de transporteurs
 */
function initWidgetFunctionality() {
    try {
        // Vérifier si le widget existe sur la page
        const transporteursSelect = document.getElementById('transporteurs');
        if (!transporteursSelect) {
            console.log("Widget de transporteurs non trouvé sur cette page");
            return;
        }
        
        console.log("Initialisation du widget de transporteurs...");
        
        // Récupérer les éléments du DOM
        const searchInput = document.querySelector('.transporteur-search-input');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const checkDisponibiliteBtn = document.querySelector('.check-disponibilite-btn');
        
        // Ajouter un conteneur pour les messages s'il n'existe pas
        let messageContainer = document.querySelector('.transporteur-widget-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'transporteur-widget-message mt-2';
            transporteursSelect.parentNode.insertBefore(messageContainer, transporteursSelect.nextSibling);
        }
        
        // Ajouter un compteur de sélection s'il n'existe pas
        let selectionCounter = document.querySelector('.selected-transporteurs-count');
        if (!selectionCounter) {
            selectionCounter = document.createElement('div');
            selectionCounter.className = 'selected-transporteurs-count mt-2 small text-muted';
            transporteursSelect.parentNode.insertBefore(selectionCounter, messageContainer);
        }
        
        // Initialiser les événements
        
        // Recherche intelligente
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterTransporteurs(this.value);
            });
        }
        
        // Filtres rapides
        if (filterButtons && filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Désactiver tous les boutons
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Activer le bouton cliqué
                    this.classList.add('active');
                    
                    // Appliquer le filtre
                    applyFilter(this.dataset.filter);
                });
            });
        }
        
        // Vérification de disponibilité
        if (checkDisponibiliteBtn) {
            checkDisponibiliteBtn.addEventListener('click', function() {
                checkDisponibilite();
            });
        }
        
        // Affichage des détails du transporteur sélectionné
        transporteursSelect.addEventListener('change', function() {
            showTransporteurDetails();
            updateSelectedCount();
        });
        
        // Vérifier la disponibilité au chargement si les dates sont déjà remplies
        const dateDebut = document.getElementById('date_debut');
        const dateFin = document.getElementById('date_fin');
        
        if (dateDebut && dateFin && dateDebut.value && dateFin.value) {
            console.log("Dates déjà remplies, vérification de la disponibilité...");
            checkDisponibilite();
        }
        
        // Mettre à jour le compteur de sélection
        updateSelectedCount();
        
        console.log("Widget de transporteurs initialisé avec succès");
    } catch (error) {
        console.error("Erreur lors de l'initialisation du widget:", error.message || "Erreur inconnue");
    }
}

/**
 * Filtre les transporteurs en fonction de la recherche
 * @param {string} query - Texte de recherche
 */
function filterTransporteurs(query) {
    try {
        console.log("Filtrage des transporteurs avec la requête:", query);
        
        const transporteursSelect = document.getElementById('transporteurs');
        
        if (!transporteursSelect) {
            console.error("Élément select des transporteurs non trouvé");
            return;
        }
        
        // Normaliser la requête (minuscules, sans accents)
        const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Parcourir tous les groupes d'options
        Array.from(transporteursSelect.querySelectorAll('optgroup')).forEach(group => {
            let visibleOptions = 0;
            
            // Parcourir toutes les options du groupe
            Array.from(group.querySelectorAll('option')).forEach(option => {
                // Récupérer toutes les données du transporteur
                const nom = (option.dataset.nom || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const prenom = (option.dataset.prenom || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const email = (option.dataset.email || '').toLowerCase();
                const telephone = (option.dataset.telephone || '').toLowerCase();
                const matricule = (option.dataset.matricule || '').toLowerCase();
                const permis = (option.dataset.permis || '').toLowerCase();
                const text = option.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                
                // Vérifier si l'une des données correspond à la requête
                const isMatch = normalizedQuery === '' || 
                    nom.includes(normalizedQuery) || 
                    prenom.includes(normalizedQuery) || 
                    email.includes(normalizedQuery) || 
                    telephone.includes(normalizedQuery) || 
                    matricule.includes(normalizedQuery) || 
                    permis.includes(normalizedQuery) || 
                    text.includes(normalizedQuery);
                
                // Afficher ou masquer l'option
                option.style.display = isMatch ? '' : 'none';
                
                // Compter les options visibles
                if (isMatch) visibleOptions++;
            });
            
            // Afficher ou masquer le groupe en fonction du nombre d'options visibles
            group.style.display = visibleOptions > 0 ? '' : 'none';
        });
        
        // Afficher un message si aucun résultat
        const allHidden = Array.from(transporteursSelect.querySelectorAll('optgroup')).every(group => group.style.display === 'none');
        
        if (allHidden && query !== '') {
            afficherMessage(`Aucun transporteur ne correspond à "${query}"`, 'warning');
        } else {
            // Effacer le message précédent
            const messageContainer = document.querySelector('.transporteur-widget-message');
            if (messageContainer) messageContainer.innerHTML = '';
        }
    } catch (error) {
        console.error("Erreur lors du filtrage des transporteurs:", error.message || "Erreur inconnue");
    }
}

/**
 * Applique un filtre prédéfini aux transporteurs
 * @param {string} filter - Type de filtre (all, available, soon, unavailable)
 */
function applyFilter(filter) {
    try {
        console.log("Application du filtre:", filter);
        
        const transporteursSelect = document.getElementById('transporteurs');
        
        if (!transporteursSelect) {
            console.error("Élément select des transporteurs non trouvé");
            return;
        }
        
        // Parcourir toutes les options
        Array.from(transporteursSelect.querySelectorAll('option')).forEach(option => {
            // Récupérer le statut du transporteur
            const status = option.dataset.status || '';
            
            // Déterminer si l'option doit être affichée
            let isVisible = false;
            
            switch (filter) {
                case 'all':
                    isVisible = true;
                    break;
                case 'available':
                    isVisible = status === 'available';
                    break;
                case 'soon':
                    isVisible = status === 'soon-available';
                    break;
                case 'unavailable':
                    isVisible = status === 'unavailable';
                    break;
                default:
                    isVisible = true;
            }
            
            // Afficher ou masquer l'option
            option.style.display = isVisible ? '' : 'none';
        });
        
        // Afficher ou masquer les groupes en fonction des options visibles
        Array.from(transporteursSelect.querySelectorAll('optgroup')).forEach(group => {
            const hasVisibleOptions = Array.from(group.querySelectorAll('option')).some(option => option.style.display !== 'none');
            group.style.display = hasVisibleOptions ? '' : 'none';
        });
    } catch (error) {
        console.error("Erreur lors de l'application du filtre:", error.message || "Erreur inconnue");
    }
}

/**
 * Vérifie la disponibilité des transporteurs pour les dates sélectionnées
 */
function checkDisponibilite() {
    try {
        console.log("Vérification de la disponibilité des transporteurs...");
        
        // Récupérer les dates et le type de prestation
        const dateDebut = document.getElementById('date_debut');
        const dateFin = document.getElementById('date_fin');
        const typePrestation = document.getElementById('type_prestation');
        
        if (!dateDebut || !dateFin) {
            console.error("Champs de date non trouvés");
            afficherMessage("Impossible de vérifier la disponibilité: champs de date non trouvés", "danger");
            return;
        }
        
        if (!dateDebut.value || !dateFin.value) {
            afficherMessage("Veuillez sélectionner les dates de début et de fin", "warning");
            return;
        }
        
        // Récupérer l'ID de la prestation en cours d'édition (si applicable)
        let prestationId = null;
        if (window.modeInfo && window.modeInfo.mode === 'edit' && window.modeInfo.id) {
            prestationId = window.modeInfo.id;
        }
        
        // Préparer les données pour la requête
        const formData = new FormData();
        formData.append('date_debut', dateDebut.value);
        formData.append('date_fin', dateFin.value);
        
        if (typePrestation && typePrestation.value) {
            formData.append('type_prestation', typePrestation.value);
        }
        
        if (prestationId) {
            formData.append('prestation_id', prestationId);
        }
        
        // Afficher un message de chargement
        afficherMessage("Vérification de la disponibilité des transporteurs...", "info");
        
        // Envoyer la requête
        fetch('/api/check_disponibilite', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Résultats de disponibilité reçus:", data);
            traiterResultatsDisponibiliteAvances(data);
        })
        .catch(error => {
            console.error("Erreur lors de la vérification de disponibilité:", error);
            afficherMessage(`Erreur lors de la vérification de disponibilité: ${error.message}`, "danger");
        });
    } catch (error) {
        console.error("Erreur lors de la vérification de disponibilité:", error.message || "Erreur inconnue");
        afficherMessage(`Erreur lors de la vérification de disponibilité: ${error.message || "Erreur inconnue"}`, "danger");
    }
}

/**
 * Affiche les détails du transporteur sélectionné
 */
function showTransporteurDetails() {
    try {
        console.log("Affichage des détails du transporteur sélectionné");
        
        const transporteursSelect = document.getElementById('transporteurs');
        const detailsContainer = document.querySelector('.transporteur-details');
        
        if (!transporteursSelect || !detailsContainer) {
            console.error("Éléments nécessaires non trouvés");
            return;
        }
        
        // Récupérer l'option sélectionnée
        const selectedOption = transporteursSelect.options[transporteursSelect.selectedIndex];
        
        if (!selectedOption) {
            console.log("Aucun transporteur sélectionné");
            detailsContainer.innerHTML = '<p class="text-muted">Aucun transporteur sélectionné</p>';
            return;
        }
        
        // Récupérer les données du transporteur
        const id = selectedOption.value;
        const nom = selectedOption.dataset.nom || '';
        const prenom = selectedOption.dataset.prenom || '';
        const email = selectedOption.dataset.email || '';
        const telephone = selectedOption.dataset.telephone || '';
        const matricule = selectedOption.dataset.matricule || '';
        const permis = selectedOption.dataset.permis || '';
        const status = selectedOption.dataset.status || '';
        const disponibleDate = selectedOption.dataset.disponibleDate || '';
        
        // Créer le HTML des détails
        let statusBadge = '';
        let statusText = '';
        
        switch (status) {
            case 'available':
                statusBadge = '<span class="badge bg-success">Disponible</span>';
                statusText = 'Disponible';
                break;
            case 'soon-available':
                statusBadge = `<span class="badge bg-warning">Bientôt disponible</span>`;
                statusText = `Disponible le: ${disponibleDate}`;
                break;
            case 'unavailable':
                statusBadge = '<span class="badge bg-danger">Non disponible</span>';
                statusText = 'Non disponible';
                break;
            default:
                statusBadge = '<span class="badge bg-secondary">Statut inconnu</span>';
                statusText = 'Statut inconnu';
        }
        
        const detailsHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${prenom} ${nom}</h5>
                    ${statusBadge}
                </div>
                <div class="card-body">
                    <ul class="list-group list-group-flush">
                        ${email ? `<li class="list-group-item"><i class="fas fa-envelope me-2"></i> ${email}</li>` : ''}
                        ${telephone ? `<li class="list-group-item"><i class="fas fa-phone me-2"></i> ${telephone}</li>` : ''}
                        ${matricule ? `<li class="list-group-item"><i class="fas fa-car me-2"></i> Matricule: ${matricule}</li>` : ''}
                        ${permis ? `<li class="list-group-item"><i class="fas fa-id-card me-2"></i> Permis: ${permis}</li>` : ''}
                        <li class="list-group-item"><i class="fas fa-clock me-2"></i> ${statusText}</li>
                    </ul>
                </div>
            </div>
        `;
        
        // Mettre à jour le conteneur de détails
        detailsContainer.innerHTML = detailsHTML;
    } catch (error) {
        console.error("Erreur lors de l'affichage des détails du transporteur:", error.message || "Erreur inconnue");
    }
}

/**
 * Met à jour le compteur de transporteurs sélectionnés
 */
function updateSelectedCount() {
    try {
        const transporteursSelect = document.getElementById('transporteurs');
        const countContainer = document.querySelector('.selected-transporteurs-count');
        
        if (!transporteursSelect || !countContainer) {
            return;
        }
        
        const selectedCount = transporteursSelect.selectedOptions.length;
        const totalCount = transporteursSelect.options.length;
        
        countContainer.textContent = `${selectedCount} transporteur${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''} sur ${totalCount}`;
    } catch (error) {
        console.error("Erreur lors de la mise à jour du compteur:", error);
    }
}

/**
 * Traite les résultats de la vérification de disponibilité et met à jour l'interface
 * Cette fonction est définie au niveau global pour être accessible partout
 * @param {Object} data - Données de disponibilité des transporteurs
 */
function traiterResultatsDisponibiliteAvances(data) {
    try {
        console.log("Traitement des résultats de disponibilité:", data);
        
        const transporteursSelect = document.getElementById('transporteurs');
        
        if (!transporteursSelect) {
            console.error("Élément select des transporteurs non trouvé");
            return;
        }
        
        if (!data) {
            throw new Error("Aucune donnée reçue de l'API");
        }
        
        // Récupérer les transporteurs disponibles et bientôt disponibles
        // Correction: utiliser les bonnes clés de l'API
        const transporteursDisponibles = data.transporteurs_disponibles || [];
        const transporteursBientotDisponibles = data.transporteurs_bientot_disponibles || [];
        const transporteursNonDisponibles = []; // Transporteurs non disponibles
        
        console.log("Transporteurs disponibles:", transporteursDisponibles.length);
        console.log("Transporteurs bientôt disponibles:", transporteursBientotDisponibles.length);
        
        // Conserver les transporteurs déjà sélectionnés
        const selectedIds = Array.from(transporteursSelect.selectedOptions).map(opt => opt.value);
        console.log("IDs sélectionnés:", selectedIds);
        
        // Vider la liste des transporteurs
        transporteursSelect.innerHTML = '';
        
        // Créer un groupe pour les transporteurs disponibles
        const groupeDisponibles = document.createElement('optgroup');
        groupeDisponibles.label = `Transporteurs disponibles (${transporteursDisponibles.length})`;
        
        // Ajouter chaque transporteur disponible
        transporteursDisponibles.forEach(transporteur => {
            try {
                const option = creerOptionTransporteur(transporteur, 'available', selectedIds);
                option.classList.add('available');
                groupeDisponibles.appendChild(option);
            } catch (err) {
                console.error("Erreur lors de la création de l'option pour un transporteur disponible:", err, transporteur);
            }
        });
        
        transporteursSelect.appendChild(groupeDisponibles);
        
        // Créer un groupe pour les transporteurs bientôt disponibles
        const groupeBientotDisponibles = document.createElement('optgroup');
        groupeBientotDisponibles.label = `Bientôt disponibles (${transporteursBientotDisponibles.length})`;
        
        // Ajouter chaque transporteur bientôt disponible
        transporteursBientotDisponibles.forEach(transporteur => {
            try {
                const option = creerOptionTransporteur(transporteur, 'soon-available', selectedIds);
                option.classList.add('soon-available');
                option.dataset.disponibleDate = transporteur.disponible_le || '';
                groupeBientotDisponibles.appendChild(option);
            } catch (err) {
                console.error("Erreur lors de la création de l'option pour un transporteur bientôt disponible:", err, transporteur);
            }
        });
        
        transporteursSelect.appendChild(groupeBientotDisponibles);
        
        // Créer un groupe pour les transporteurs non disponibles
        const groupeNonDisponibles = document.createElement('optgroup');
        groupeNonDisponibles.label = `Non disponibles (${transporteursNonDisponibles.length})`;
        
        // Ajouter chaque transporteur non disponible
        transporteursNonDisponibles.forEach(transporteur => {
            try {
                const option = creerOptionTransporteur(transporteur, 'unavailable', selectedIds);
                option.classList.add('unavailable');
                groupeNonDisponibles.appendChild(option);
            } catch (err) {
                console.error("Erreur lors de la création de l'option pour un transporteur non disponible:", err, transporteur);
            }
        });
        
        transporteursSelect.appendChild(groupeNonDisponibles);
        
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
        
        // Activer le premier bouton de filtre (Tous)
        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allFilterBtn) {
            allFilterBtn.click();
        }
        
        // Mettre à jour le compteur de sélection
        updateSelectedCount();
        
    } catch (error) {
        console.error("Erreur lors du traitement des résultats:", error.message || "Erreur inconnue");
        afficherMessage(`Erreur lors du traitement des résultats: ${error.message || "Erreur inconnue"}`, "danger");
    }
}

/**
 * Crée une option pour le select des transporteurs
 * @param {Object} transporteur - Données du transporteur
 * @param {string} status - Statut du transporteur (available, soon-available, unavailable)
 * @param {Array} selectedIds - IDs des transporteurs déjà sélectionnés
 * @returns {HTMLOptionElement} - L'élément option créé
 */
function creerOptionTransporteur(transporteur, status, selectedIds) {
    if (!transporteur || !transporteur.id) {
        console.error("Données de transporteur invalides:", transporteur);
        throw new Error("Données de transporteur invalides");
    }
    
    const option = document.createElement('option');
    option.value = transporteur.id;
    
    // Déterminer si l'option doit être sélectionnée
    if (selectedIds && selectedIds.includes(transporteur.id.toString())) {
        option.selected = true;
    }
    
    // Définir les attributs data pour stocker les informations du transporteur
    option.dataset.id = transporteur.id;
    option.dataset.nom = transporteur.nom || '';
    option.dataset.prenom = transporteur.prenom || '';
    option.dataset.email = transporteur.email || '';
    option.dataset.telephone = transporteur.telephone || '';
    option.dataset.matricule = transporteur.matricule || '';
    option.dataset.permis = transporteur.permis || '';
    option.dataset.status = status;
    
    // Créer le texte de l'option
    let optionText = '';
    if (transporteur.prenom && transporteur.nom) {
        optionText = `${transporteur.prenom} ${transporteur.nom}`;
    } else if (transporteur.nom) {
        optionText = transporteur.nom;
    } else {
        optionText = `Transporteur #${transporteur.id}`;
    }
    
    // Ajouter des informations supplémentaires si disponibles
    const infos = [];
    if (transporteur.matricule) infos.push(`Matricule: ${transporteur.matricule}`);
    if (transporteur.permis) infos.push(`Permis: ${transporteur.permis}`);
    if (transporteur.type_vehicule) infos.push(`Véhicule: ${transporteur.type_vehicule}`);
    
    if (infos.length > 0) {
        optionText += ` (${infos.join(' | ')})`;
    }
    
    // Ajouter la date de disponibilité pour les transporteurs bientôt disponibles
    if (status === 'soon-available' && transporteur.disponible_le) {
        optionText += ` - Disponible le: ${transporteur.disponible_le}`;
    }
    
    option.textContent = optionText;
    
    // Ajouter des classes CSS en fonction du statut
    option.classList.add(status);
    
    return option;
}

/**
 * Affiche un message dans la zone de notification du widget
 * @param {string} message - Message à afficher
 * @param {string} type - Type de message (success, info, warning, danger, custom)
 */
function afficherMessage(message, type = 'info') {
    try {
        const messageContainer = document.querySelector('.transporteur-widget-message');
        
        if (!messageContainer) {
            console.error("Conteneur de message non trouvé");
            return;
        }
        
        // Si le type est 'custom', on suppose que le message est déjà formaté en HTML
        if (type === 'custom') {
            messageContainer.innerHTML = message;
            messageContainer.style.display = 'block';
            return;
        }
        
        // Sinon, on crée une alerte Bootstrap
        const alertClass = `alert-${type}`;
        const icon = getIconForAlertType(type);
        
        messageContainer.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="${icon} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        messageContainer.style.display = 'block';
    } catch (error) {
        console.error("Erreur lors de l'affichage du message:", error);
    }
}

/**
 * Retourne l'icône appropriée pour un type d'alerte
 * @param {string} type - Type d'alerte (success, info, warning, danger)
 * @returns {string} - Classe CSS de l'icône
 */
function getIconForAlertType(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'info': return 'fas fa-info-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'danger': return 'fas fa-exclamation-circle';
        default: return 'fas fa-info-circle';
    }
}
