/**
 * Script pour améliorer le widget de sélection des transporteurs
 * Fonctionne à la fois pour la création et l'édition de prestations
 * Intègre la vérification de disponibilité en temps réel
 */

document.addEventListener('DOMContentLoaded', function() {
    // Éléments du widget de transporteurs
    const transporteurSearch = document.getElementById('transporteur-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const transporteursSelect = document.getElementById('transporteurs');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const validerTransporteursBtn = document.getElementById('valider-transporteurs');
    const selectedCountElement = document.querySelector('.selected-transporteurs-count');
    const transporteurWidgetContainer = document.querySelector('.transporteur-widget-container');
    
    // Éléments du formulaire pour la vérification de disponibilité
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    
    // Vérifier si nous sommes sur la page de création ou d'édition
    const isCreationPage = window.location.pathname.includes('/add');
    const isEditPage = window.location.pathname.includes('/edit/');
    let prestationId = null;
    
    // Si nous sommes sur la page d'édition, récupérer l'ID de la prestation
    if (isEditPage) {
        const urlParts = window.location.pathname.split('/');
        prestationId = urlParts[urlParts.length - 1];
    }
    
    console.log("Widget transporteurs initialisé:", {
        isCreationPage,
        isEditPage,
        prestationId,
        transporteurSearch,
        clearSearchBtn,
        transporteursSelect,
        filterButtons: filterButtons ? filterButtons.length : 0,
        validerTransporteursBtn,
        dateDebutInput,
        dateFinInput,
        typeDemenagementSelect
    });
    
    // Fonction pour mettre à jour le compteur de transporteurs sélectionnés
    function updateSelectedCount() {
        if (selectedCountElement && transporteursSelect) {
            const selectedOptions = Array.from(transporteursSelect.options).filter(option => option.selected);
            selectedCountElement.textContent = `${selectedOptions.length} transporteur(s) sélectionné(s)`;
            
            // Mettre à jour l'apparence du bouton de validation
            if (validerTransporteursBtn) {
                if (selectedOptions.length > 0) {
                    validerTransporteursBtn.classList.remove('btn-outline-success');
                    validerTransporteursBtn.classList.add('btn-success');
                } else {
                    validerTransporteursBtn.classList.remove('btn-success');
                    validerTransporteursBtn.classList.add('btn-outline-success');
                }
            }
        }
    }
    
    // Fonction pour filtrer les transporteurs par texte de recherche
    function filterTransporteurs(searchText) {
        if (!transporteursSelect) return;
        
        const options = Array.from(transporteursSelect.options);
        const lowerSearchText = searchText.toLowerCase();
        
        options.forEach(option => {
            const searchableText = option.getAttribute('data-search-text') || option.textContent.toLowerCase();
            const shouldShow = searchableText.includes(lowerSearchText);
            option.style.display = shouldShow ? '' : 'none';
        });
    }
    
    // Fonction pour filtrer par disponibilité
    function filterByAvailability(filter) {
        if (!transporteursSelect) return;
        
        const options = Array.from(transporteursSelect.options);
        
        if (filter === 'all') {
            // Afficher tous les transporteurs
            options.forEach(option => {
                option.style.display = '';
            });
        } else if (filter === 'available') {
            // Afficher uniquement les transporteurs disponibles
            options.forEach(option => {
                const isAvailable = !option.textContent.includes('Bientôt disponible');
                option.style.display = isAvailable ? '' : 'none';
            });
        } else if (filter === 'soon') {
            // Afficher uniquement les transporteurs bientôt disponibles
            options.forEach(option => {
                const isSoonAvailable = option.textContent.includes('Bientôt disponible');
                option.style.display = isSoonAvailable ? '' : 'none';
            });
        } else if (filter === 'adapted') {
            // Afficher uniquement les transporteurs avec véhicule adapté
            options.forEach(option => {
                const isAdapted = option.getAttribute('data-vehicule-adapte') === 'true';
                option.style.display = isAdapted ? '' : 'none';
            });
        }
    }
    
    // Fonction pour vérifier la disponibilité des transporteurs
    async function checkTransporteursDisponibilite() {
        // Vérifier que les champs nécessaires sont présents et remplis
        if (!dateDebutInput || !dateFinInput || !typeDemenagementSelect || !transporteursSelect) {
            console.error('Champs manquants pour la vérification de disponibilité');
            return;
        }
        
        const dateDebut = dateDebutInput.value;
        const dateFin = dateFinInput.value;
        const typeDemenagementId = typeDemenagementSelect.value;
        
        if (!dateDebut || !dateFin) {
            console.log('Dates non spécifiées, impossible de vérifier la disponibilité');
            return;
        }
        
        try {
            // Afficher un indicateur de chargement
            if (transporteurWidgetContainer) {
                transporteurWidgetContainer.classList.add('loading');
                const loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'loading-indicator';
                loadingIndicator.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div><p>Vérification de la disponibilité des transporteurs...</p>';
                transporteurWidgetContainer.appendChild(loadingIndicator);
            }
            
            // Préparer les données pour la requête
            const formData = new FormData();
            formData.append('date_debut', dateDebut);
            formData.append('date_fin', dateFin);
            formData.append('type_demenagement_id', typeDemenagementId);
            
            if (prestationId) {
                formData.append('prestation_id', prestationId);
            }
            
            // Envoyer la requête à l'API
            const response = await fetch('/api/transporteurs/check-disponibilite', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Mettre à jour la liste des transporteurs avec les informations de disponibilité
                updateTransporteursList(data.transporteurs, data.soon_available, data.vehicules_recommandes);
            } else {
                console.error('Erreur lors de la vérification de disponibilité:', data.message);
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de disponibilité:', error);
        } finally {
            // Supprimer l'indicateur de chargement
            if (transporteurWidgetContainer) {
                transporteurWidgetContainer.classList.remove('loading');
                const loadingIndicator = transporteurWidgetContainer.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }
        }
    }
    
    // Fonction pour mettre à jour la liste des transporteurs avec les informations de disponibilité
    function updateTransporteursList(transporteursDisponibles, transporteursBientotDisponibles, vehiculesRecommandes) {
        if (!transporteursSelect) {
            console.error('Élément transporteursSelect non trouvé');
            return;
        }
        
        console.log('Mise à jour de la liste des transporteurs:', {
            disponibles: transporteursDisponibles ? transporteursDisponibles.length : 0,
            bientotDisponibles: transporteursBientotDisponibles ? transporteursBientotDisponibles.length : 0,
            vehiculesRecommandes: vehiculesRecommandes ? vehiculesRecommandes.length : 0
        });
        
        // Sauvegarder les transporteurs actuellement sélectionnés
        const selectedIds = [];
        try {
            // Utiliser une méthode plus robuste pour récupérer les options sélectionnées
            for (let i = 0; i < transporteursSelect.options.length; i++) {
                if (transporteursSelect.options[i].selected) {
                    selectedIds.push(transporteursSelect.options[i].value);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des options sélectionnées:', error);
        }
        
        // Vider la liste des transporteurs de manière sécurisée
        try {
            while (transporteursSelect.firstChild) {
                transporteursSelect.removeChild(transporteursSelect.firstChild);
            }
        } catch (error) {
            console.error('Erreur lors du vidage de la liste des transporteurs:', error);
            transporteursSelect.innerHTML = ''; // Méthode alternative
        }
        
        // Ajouter les transporteurs disponibles
        if (transporteursDisponibles && transporteursDisponibles.length > 0) {
            transporteursDisponibles.forEach(transporteur => {
                try {
                    const option = document.createElement('option');
                    option.value = transporteur.id;
                    option.textContent = `${transporteur.nom} ${transporteur.prenom} (${transporteur.vehicule || 'Véhicule non spécifié'})`;
                    option.selected = selectedIds.includes(transporteur.id.toString());
                    option.setAttribute('data-search-text', `${transporteur.nom.toLowerCase()} ${transporteur.prenom.toLowerCase()} ${(transporteur.vehicule || '').toLowerCase()}`);
                    option.setAttribute('data-vehicule-adapte', transporteur.vehicule_adapte ? 'true' : 'false');
                    
                    // Ajouter une classe pour les véhicules adaptés
                    if (transporteur.vehicule_adapte) {
                        option.classList.add('vehicule-adapte');
                        option.style.color = '#0d6efd'; // Bleu pour les véhicules adaptés
                        option.style.fontWeight = 'bold';
                    }
                    
                    transporteursSelect.appendChild(option);
                } catch (error) {
                    console.error('Erreur lors de l\'ajout d\'un transporteur disponible:', error, transporteur);
                }
            });
        } else {
            console.warn('Aucun transporteur disponible à afficher');
            // Ajouter un message dans le select
            const option = document.createElement('option');
            option.disabled = true;
            option.textContent = 'Aucun transporteur disponible pour cette période';
            transporteursSelect.appendChild(option);
        }
        
        // Ajouter les transporteurs bientôt disponibles si l'option est activée
        if (transporteursBientotDisponibles && transporteursBientotDisponibles.length > 0) {
            // Ajouter un séparateur visuel
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '─────────── Bientôt disponibles ───────────';
            separator.style.fontWeight = 'bold';
            separator.style.backgroundColor = '#f8f9fa';
            transporteursSelect.appendChild(separator);
            
            transporteursBientotDisponibles.forEach(transporteur => {
                try {
                    const option = document.createElement('option');
                    option.value = transporteur.id;
                    option.textContent = `${transporteur.nom} ${transporteur.prenom} (${transporteur.vehicule || 'Véhicule non spécifié'}) - Disponible le ${transporteur.disponible_le || 'bientôt'}`;
                    option.selected = selectedIds.includes(transporteur.id.toString());
                    option.setAttribute('data-search-text', `${transporteur.nom.toLowerCase()} ${transporteur.prenom.toLowerCase()} ${(transporteur.vehicule || '').toLowerCase()}`);
                    option.setAttribute('data-disponible-le', transporteur.disponible_le || '');
                    option.classList.add('soon-available');
                    option.style.color = '#6c757d'; // Gris pour les bientôt disponibles
                    option.style.fontStyle = 'italic';
                    
                    transporteursSelect.appendChild(option);
                } catch (error) {
                    console.error('Erreur lors de l\'ajout d\'un transporteur bientôt disponible:', error, transporteur);
                }
            });
        }
        
        // Mettre à jour le compteur de transporteurs sélectionnés
        try {
            updateSelectedCount();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compteur:', error);
        }
        
        // Si nous avons des véhicules recommandés, afficher une info-bulle
        if (vehiculesRecommandes && vehiculesRecommandes.length > 0 && transporteurWidgetContainer) {
            try {
                // Supprimer l'info-bulle existante si présente
                const existingInfo = transporteurWidgetContainer.querySelector('.alert-info');
                if (existingInfo) {
                    existingInfo.remove();
                }
                
                // Créer la nouvelle info-bulle
                const vehiculesInfo = document.createElement('div');
                vehiculesInfo.className = 'alert alert-info mt-2';
                vehiculesInfo.innerHTML = `<strong>Véhicules recommandés pour ce type de déménagement:</strong><ul>${vehiculesRecommandes.map(v => `<li>${v.nom || 'Véhicule'}${v.description ? ` - ${v.description}` : ''}</li>`).join('')}</ul>`;
                
                // Ajouter l'info-bulle après le select
                transporteurWidgetContainer.appendChild(vehiculesInfo);
            } catch (error) {
                console.error('Erreur lors de l\'affichage des véhicules recommandés:', error);
            }
        }
    }
    
    // Initialiser les événements
    if (transporteursSelect) {
        // Mettre à jour le compteur au chargement
        updateSelectedCount();
        
        // Mettre à jour le compteur lors de la sélection
        transporteursSelect.addEventListener('change', updateSelectedCount);
    }
    
    if (transporteurSearch) {
        transporteurSearch.addEventListener('input', function() {
            filterTransporteurs(this.value);
        });
    }
    
    // Événements pour déclencher la vérification de disponibilité
    if (dateDebutInput) {
        dateDebutInput.addEventListener('change', checkTransporteursDisponibilite);
    }
    
    if (dateFinInput) {
        dateFinInput.addEventListener('change', checkTransporteursDisponibilite);
    }
    
    if (typeDemenagementSelect) {
        typeDemenagementSelect.addEventListener('change', checkTransporteursDisponibilite);
    }
    
    // Bouton pour vérifier manuellement la disponibilité
    const checkDisponibiliteBtn = document.getElementById('check-disponibilite-btn');
    if (checkDisponibiliteBtn) {
        checkDisponibiliteBtn.addEventListener('click', checkTransporteursDisponibilite);
    } else {
        // Créer un bouton de vérification de disponibilité s'il n'existe pas
        if (transporteurWidgetContainer && transporteursSelect) {
            const newCheckBtn = document.createElement('button');
            newCheckBtn.type = 'button';
            newCheckBtn.id = 'check-disponibilite-btn';
            newCheckBtn.className = 'btn btn-outline-primary mt-2 mb-2';
            newCheckBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Vérifier la disponibilité';
            newCheckBtn.addEventListener('click', checkTransporteursDisponibilite);
            
            // Insérer le bouton avant le select
            transporteursSelect.parentNode.insertBefore(newCheckBtn, transporteursSelect);
        }
    }
    
    // Vérifier automatiquement la disponibilité au chargement si les dates sont déjà remplies
    if (dateDebutInput && dateDebutInput.value && dateFinInput && dateFinInput.value) {
        // Attendre un court instant pour s'assurer que tous les éléments sont chargés
        setTimeout(() => {
            checkTransporteursDisponibilite();
        }, 500);
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (transporteurSearch) {
                transporteurSearch.value = '';
                filterTransporteurs('');
            }
        });
    }
    
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Retirer la classe active de tous les boutons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Ajouter la classe active à ce bouton
                this.classList.add('active');
                
                // Appliquer le filtre
                const filter = this.getAttribute('data-filter');
                filterByAvailability(filter);
            });
        });
    }
    
    if (validerTransporteursBtn) {
        validerTransporteursBtn.addEventListener('click', function() {
            const selectedOptions = Array.from(transporteursSelect.options).filter(option => option.selected);
            
            if (selectedOptions.length === 0) {
                alert('Veuillez sélectionner au moins un transporteur.');
                return;
            }
            
            // Afficher un message de confirmation
            const confirmMessage = selectedOptions.length === 1
                ? `Vous avez sélectionné le transporteur: ${selectedOptions[0].textContent}`
                : `Vous avez sélectionné ${selectedOptions.length} transporteurs.`;
            
            if (confirm(`${confirmMessage}\nConfirmer cette sélection?`)) {
                // S'assurer que tous les transporteurs sélectionnés sont bien marqués comme sélectionnés dans le select
                const transporteurIds = selectedOptions.map(option => option.value);
                
                // Marquer visuellement les transporteurs sélectionnés
                Array.from(transporteursSelect.options).forEach(option => {
                    if (transporteurIds.includes(option.value)) {
                        option.selected = true;
                        option.classList.add('selected-transporteur');
                    }
                });
                
                // Envoyer une requête AJAX pour notifier les transporteurs sélectionnés
                notifierTransporteurs(transporteurIds);
                
                // Créer un élément récapitulatif des transporteurs sélectionnés
                const transporteursRecap = document.createElement('div');
                transporteursRecap.className = 'transporteurs-recap mt-3 p-3 border rounded';
                transporteursRecap.innerHTML = `
                    <h5><i class="fas fa-users"></i> Transporteurs assignés (${selectedOptions.length})</h5>
                    <ul class="list-group">
                        ${selectedOptions.map(option => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <span><i class="fas fa-user"></i> ${option.textContent}</span>
                                <span class="badge bg-success">Assigné</span>
                            </li>
                        `).join('')}
                    </ul>
                `;
                
                // Remplacer l'ancien récapitulatif s'il existe, sinon l'ajouter
                const existingRecap = document.querySelector('.transporteurs-recap');
                if (existingRecap) {
                    existingRecap.replaceWith(transporteursRecap);
                } else {
                    // Insérer le récapitulatif après le conteneur du widget
                    if (transporteurWidgetContainer) {
                        transporteurWidgetContainer.parentNode.insertBefore(transporteursRecap, transporteurWidgetContainer.nextSibling);
                    }
                }
                
                // Mettre à jour le bouton de validation
                validerTransporteursBtn.classList.remove('btn-outline-success');
                validerTransporteursBtn.classList.add('btn-success');
                validerTransporteursBtn.innerHTML = '<i class="fas fa-check-circle"></i> Transporteurs assignés';
                
                // Afficher un message de succès
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
                alertDiv.innerHTML = `
                    <i class="fas fa-check-circle"></i> Transporteurs sélectionnés avec succès! Des notifications ont été envoyées.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                
                // Insérer l'alerte après le bouton de validation
                validerTransporteursBtn.parentNode.appendChild(alertDiv);
                
                // Supprimer l'alerte après 3 secondes
                setTimeout(() => {
                    alertDiv.remove();
                }, 3000);
                
                // Simuler un clic sur le bouton de soumission du formulaire si en mode création
                if (isCreationPage) {
                    const submitButton = document.querySelector('button[type="submit"]');
                    if (submitButton) {
                        // Scroll vers le bas du formulaire
                        submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Mettre en évidence le bouton
                        submitButton.classList.add('btn-pulse');
                        setTimeout(() => {
                            submitButton.classList.remove('btn-pulse');
                        }, 2000);
                    }
                }
            }
        });
    }
    
    /**
     * Fonction pour notifier les transporteurs sélectionnés
     * @param {Array} transporteurIds - Tableau des IDs des transporteurs à notifier
     */
    function notifierTransporteurs(transporteurIds) {
        if (!transporteurIds || transporteurIds.length === 0) return;
        
        // Récupérer les informations de la prestation
        let prestationId = null;
        let prestationData = {};
        
        // Si nous sommes en mode édition, récupérer l'ID de la prestation depuis l'URL
        if (isEditPage) {
            const urlParts = window.location.pathname.split('/');
            prestationId = urlParts[urlParts.length - 1];
        }
        
        // Récupérer les données de base de la prestation depuis le formulaire
        const dateDebutValue = dateDebutInput ? dateDebutInput.value : '';
        const dateFinValue = dateFinInput ? dateFinInput.value : '';
        const typeDemenagementValue = typeDemenagementSelect ? typeDemenagementSelect.options[typeDemenagementSelect.selectedIndex]?.text : '';
        
        // Préparer les données pour la requête
        const formData = new FormData();
        formData.append('transporteur_ids', JSON.stringify(transporteurIds));
        
        if (prestationId) {
            formData.append('prestation_id', prestationId);
        }
        
        formData.append('date_debut', dateDebutValue);
        formData.append('date_fin', dateFinValue);
        formData.append('type_demenagement', typeDemenagementValue);
        
        // Envoyer la requête pour notifier les transporteurs
        fetch('/api/transporteurs/notifier', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Notifications envoyées avec succès:', data.message);
            } else {
                console.error('Erreur lors de l\'envoi des notifications:', data.message);
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi des notifications:', error);
        });
    }
    
    // Ajouter une classe CSS pour l'animation du bouton
    const style = document.createElement('style');
    style.textContent = `
        .btn-pulse {
            animation: pulse 1s infinite;
        }
        
        .selected-transporteur {
            background-color: #d1e7dd !important;
            font-weight: bold;
        }
        
        .transporteurs-recap {
            background-color: #f8f9fa;
            border-color: #0d6efd !important;
        }
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
            }
        }
    `;
    document.head.appendChild(style);
});
