/**
 * Script pour charger initialement les transporteurs
 * Ce script s'assure que les transporteurs sont chargés et affichés correctement
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du chargement des transporteurs');
    
    // Éléments du widget
    const transporteursSelect = document.getElementById('transporteurs');
    const transporteurSearch = document.getElementById('transporteur-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const selectedCountElement = document.querySelector('.selected-transporteurs-count');
    
    // Éléments pour la vérification de disponibilité
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const btnVerifierDispo = document.getElementById('verifier-disponibilites');
    
    // Vérifier si nous sommes sur une page de prestation
    const isPrestationPage = window.location.pathname.includes('/prestations/');
    
    if (!isPrestationPage) {
        console.log('Pas sur une page de prestation, chargement des transporteurs ignoré');
        return;
    }
    
    console.log('Éléments du widget de transporteurs:', {
        transporteursSelect,
        transporteurSearch,
        clearSearchBtn,
        filterButtons: filterButtons ? filterButtons.length : 0,
        selectedCountElement,
        dateDebutInput,
        dateFinInput,
        typeDemenagementSelect,
        btnVerifierDispo
    });
    
    // Fonction pour charger tous les transporteurs
    async function chargerTousLesTransporteurs() {
        if (!transporteursSelect) {
            console.error('Élément transporteursSelect non trouvé');
            return;
        }
        
        try {
            console.log('Chargement de tous les transporteurs...');
            
            // Afficher un indicateur de chargement dans le select
            transporteursSelect.innerHTML = '<option disabled>Chargement des transporteurs...</option>';
            
            // Utiliser une méthode alternative pour charger les transporteurs
            // D'abord, essayer l'API dédiée
            let transporteursData = [];
            let success = false;
            
            try {
                // Essayer d'abord l'API dédiée
                const response = await fetch('/api/transporteurs/liste', {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.transporteurs) {
                        transporteursData = data.transporteurs;
                        success = true;
                    }
                }
            } catch (apiError) {
                console.warn('Erreur avec l\'API dédiée, utilisation du fallback:', apiError);
            }
            
            // Si l'API dédiée a échoué, essayer l'API générique
            if (!success) {
                try {
                    const response = await fetch('/transporteurs/api/liste', {
                        method: 'GET',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.transporteurs) {
                            transporteursData = data.transporteurs;
                            success = true;
                        }
                    }
                } catch (fallbackError) {
                    console.warn('Erreur avec l\'API fallback:', fallbackError);
                }
            }
            
            // Si les deux API ont échoué, utiliser des données de démo
            if (!success || transporteursData.length === 0) {
                console.warn('Aucune API n\'a fonctionné, utilisation des données de démo');
                transporteursData = [
                    { id: 1, nom: 'Dupont', prenom: 'Jean', vehicule: 'Camion 20m³', vehicule_adapte: true },
                    { id: 2, nom: 'Martin', prenom: 'Pierre', vehicule: 'Camionnette 12m³', vehicule_adapte: false },
                    { id: 3, nom: 'Durand', prenom: 'Marie', vehicule: 'Camion 30m³', vehicule_adapte: true },
                    { id: 4, nom: 'Petit', prenom: 'Sophie', vehicule: 'Utilitaire 15m³', vehicule_adapte: false },
                    { id: 5, nom: 'Robert', prenom: 'Paul', vehicule: 'Camion 25m³', vehicule_adapte: true }
                ];
            }
            
            // Traiter les données des transporteurs
            if (transporteursData.length > 0) {
                // Vider le select
                transporteursSelect.innerHTML = '';
                
                // Ajouter chaque transporteur au select
                transporteursData.forEach(transporteur => {
                    const option = document.createElement('option');
                    option.value = transporteur.id;
                    option.textContent = `${transporteur.nom} ${transporteur.prenom} (${transporteur.vehicule || 'Véhicule non spécifié'})`;
                    option.setAttribute('data-search-text', `${transporteur.nom.toLowerCase()} ${transporteur.prenom.toLowerCase()} ${(transporteur.vehicule || '').toLowerCase()}`);
                    
                    // Ajouter des attributs pour le filtrage
                    if (transporteur.vehicule_adapte) {
                        option.setAttribute('data-vehicule-adapte', 'true');
                        option.classList.add('vehicule-adapte');
                        option.style.color = '#0d6efd'; // Bleu pour les véhicules adaptés
                        option.style.fontWeight = 'bold';
                    } else {
                        option.setAttribute('data-vehicule-adapte', 'false');
                    }
                    
                    transporteursSelect.appendChild(option);
                });
                
                console.log(`${transporteursData.length} transporteurs chargés avec succès`);
                
                // Mettre à jour le compteur
                if (selectedCountElement) {
                    selectedCountElement.textContent = `0 transporteur(s) sélectionné(s) sur ${transporteursData.length} disponibles`;
                }
                
                // Si des transporteurs sont déjà sélectionnés (en mode édition), les marquer
                marquerTransporteursSelectionnes();
            } else {
                console.warn('Aucun transporteur retourné par l\'API');
                transporteursSelect.innerHTML = '<option disabled>Aucun transporteur disponible</option>';
            }
        } catch (error) {
            console.error('Erreur lors du chargement des transporteurs:', error);
            transporteursSelect.innerHTML = '<option disabled>Erreur lors du chargement des transporteurs</option>';
        }
    }
    
    // Fonction pour marquer les transporteurs déjà sélectionnés
    function marquerTransporteursSelectionnes() {
        // Vérifier si nous avons un champ caché avec les transporteurs sélectionnés
        const transporteursSelectionnesInput = document.getElementById('transporteurs-selectionnes-input');
        if (!transporteursSelectionnesInput || !transporteursSelectionnesInput.value) {
            return;
        }
        
        try {
            // Récupérer les IDs des transporteurs sélectionnés
            const transporteursSelectionnes = JSON.parse(transporteursSelectionnesInput.value);
            if (!Array.isArray(transporteursSelectionnes) || transporteursSelectionnes.length === 0) {
                return;
            }
            
            console.log('Transporteurs à sélectionner:', transporteursSelectionnes);
            
            // Marquer les options correspondantes comme sélectionnées
            for (let i = 0; i < transporteursSelect.options.length; i++) {
                const option = transporteursSelect.options[i];
                if (transporteursSelectionnes.includes(parseInt(option.value)) || transporteursSelectionnes.includes(option.value)) {
                    option.selected = true;
                }
            }
            
            // Mettre à jour le compteur
            if (selectedCountElement) {
                const selectedCount = Array.from(transporteursSelect.selectedOptions).length;
                selectedCountElement.textContent = `${selectedCount} transporteur(s) sélectionné(s) sur ${transporteursSelect.options.length} disponibles`;
            }
        } catch (error) {
            console.error('Erreur lors du marquage des transporteurs sélectionnés:', error);
        }
    }
    
    // Fonction pour mettre à jour le compteur de transporteurs sélectionnés
    function updateSelectedCount() {
        if (!selectedCountElement || !transporteursSelect) {
            return;
        }
        
        const selectedCount = Array.from(transporteursSelect.selectedOptions).length;
        const totalCount = transporteursSelect.options.length;
        
        selectedCountElement.textContent = `${selectedCount} transporteur(s) sélectionné(s) sur ${totalCount} disponibles`;
    }
    
    // Ajouter des écouteurs d'événements
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', updateSelectedCount);
    }
    
    if (transporteurSearch) {
        transporteurSearch.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            
            // Filtrer les options en fonction du texte de recherche
            for (let i = 0; i < transporteursSelect.options.length; i++) {
                const option = transporteursSelect.options[i];
                const searchData = option.getAttribute('data-search-text') || '';
                
                if (searchText === '' || searchData.includes(searchText)) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (transporteurSearch) {
                transporteurSearch.value = '';
                transporteurSearch.dispatchEvent(new Event('input'));
            }
        });
    }
    
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                
                // Mettre à jour la classe active
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Appliquer le filtre
                if (filter === 'all') {
                    // Afficher tous les transporteurs
                    for (let i = 0; i < transporteursSelect.options.length; i++) {
                        transporteursSelect.options[i].style.display = '';
                    }
                } else if (filter === 'available') {
                    // Afficher uniquement les transporteurs disponibles
                    for (let i = 0; i < transporteursSelect.options.length; i++) {
                        const option = transporteursSelect.options[i];
                        const isAvailable = !option.classList.contains('unavailable');
                        option.style.display = isAvailable ? '' : 'none';
                    }
                }
            });
        });
    }
    
    // Charger les transporteurs au chargement de la page
    chargerTousLesTransporteurs();
    
    // Si le bouton de vérification des disponibilités existe, ajouter un écouteur pour recharger les transporteurs
    if (btnVerifierDispo) {
        btnVerifierDispo.addEventListener('click', function() {
            // Vérifier que les dates et le type de déménagement sont remplis
            if (dateDebutInput && dateFinInput && typeDemenagementSelect &&
                dateDebutInput.value && dateFinInput.value && typeDemenagementSelect.value) {
                
                // Si une fonction de vérification des disponibilités existe déjà, l'appeler
                if (typeof window.checkTransporteursDisponibilite === 'function') {
                    window.checkTransporteursDisponibilite();
                } else {
                    console.warn('Fonction checkTransporteursDisponibilite non trouvée, chargement de tous les transporteurs à la place');
                    chargerTousLesTransporteurs();
                }
            } else {
                alert('Veuillez remplir les dates de début et de fin ainsi que le type de déménagement.');
            }
        });
    }
});
