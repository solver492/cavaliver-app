/**
 * Script amélioré pour gérer la sélection des transporteurs
 * et vérifier leur disponibilité en temps réel
 */

// Variables globales
let derniereVerification = null;
let transporteursSelectionnes = [];
let tousLesTransporteurs = [];
let transporteursOccupes = [];
let transporteursLibres = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du système de sélection des transporteurs");
    
    // Référence aux éléments du formulaire
    const btnVerifierDispo = document.getElementById('verifier-disponibilite');
    const showCalendarBtn = document.getElementById('show-calendar-btn');
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const transporteursSelect = document.getElementById('transporteurs');
    const transporteurSearch = document.getElementById('transporteur-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const transporteursResultatsDiv = document.getElementById('transporteurs-disponibles-resultats');
    const prestationIdInput = document.getElementById('prestation_id') || document.createElement('input');
    
    // Log des éléments pour débogage
    console.log("Éléments du système de transporteurs:", {
        btnVerifierDispo,
        showCalendarBtn,
        dateDebutInput,
        dateFinInput,
        typeDemenagementSelect,
        transporteursSelect,
        transporteurSearch,
        clearSearchBtn,
        filterBtns,
        transporteursResultatsDiv
    });
    
    // Initialiser l'UI
    initializeUI();
    
    // Exécuter une vérification initiale si tous les champs requis sont remplis
    if (dateDebutInput && dateDebutInput.value && 
        dateFinInput && dateFinInput.value && 
        typeDemenagementSelect && typeDemenagementSelect.value && 
        typeDemenagementSelect.value !== '0') {
        setTimeout(verifierDisponibilites, 500);
    }
    
    // ===== FONCTIONS PRINCIPALES =====
    
    /**
     * Initialiser l'interface utilisateur
     */
    function initializeUI() {
        if (!transporteursResultatsDiv) return;
        
        transporteursResultatsDiv.innerHTML = 
            '<div class="alert alert-info">' +
                '<i class="fas fa-info-circle me-2"></i> ' +
                'Remplissez les dates et le type de déménagement, puis cliquez sur "Vérifier les disponibilités" ' +
                'pour voir les transporteurs disponibles.' +
            '</div>';
            
        // Initialiser le compteur de transporteurs sélectionnés
        updateTransporteurCounter();
        
        // Initialiser les événements de recherche et filtrage
        if (transporteurSearch) {
            transporteurSearch.addEventListener('input', function() {
                filterTransporteurs();
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                if (transporteurSearch) {
                    transporteurSearch.value = '';
                    filterTransporteurs();
                }
            });
        }
        
        // Initialiser les boutons de filtre
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterTransporteurs();
            });
        });
    }
    
    /**
     * Vérifier les disponibilités des transporteurs
     */
    function verifierDisponibilites() {
        if (!dateDebutInput || !dateFinInput || !typeDemenagementSelect) {
            console.error("Éléments de formulaire manquants");
            afficherErreur("Erreur: Éléments de formulaire manquants.");
            return;
        }
        
        const dateDebut = dateDebutInput.value;
        const dateFin = dateFinInput.value;
        const typeDemenagementId = typeDemenagementSelect.value;
        const prestationId = prestationIdInput.value || '';
        
        // Vérifier que les dates sont valides
        if (!dateDebut || !dateFin) {
            afficherErreur("Veuillez sélectionner les dates de début et de fin.");
            return;
        }
        
        // Vérifier que le type de déménagement est sélectionné
        if (!typeDemenagementId || typeDemenagementId === '0') {
            afficherErreur("Veuillez sélectionner un type de déménagement.");
            return;
        }
        
        // Afficher un indicateur de chargement
        afficherChargement();
        
        // Créer le formulaire de données pour la requête
        const formData = new FormData();
        formData.append('date_debut', dateDebut);
        formData.append('date_fin', dateFin);
        formData.append('type_demenagement_id', typeDemenagementId);
        if (prestationId) {
            formData.append('prestation_id', prestationId);
        }
        
        // Effectuer la requête AJAX
        fetch('/api/transporteurs/check-disponibilite', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur réseau: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Résultats de la vérification:", data);
            
            // Sauvegarder les résultats pour référence future
            derniereVerification = data;
            
            // Mettre à jour les listes de transporteurs
            transporteursLibres = data.transporteurs || [];
            transporteursOccupes = data.soon_available || [];
            tousLesTransporteurs = [...transporteursLibres, ...transporteursOccupes];
            
            // Traiter et afficher les résultats
            afficherResultats(data);
            
            // Synchroniser avec le calendrier si disponible
            synchroniserCalendrier(data);
            
            // Mettre à jour le compteur
            updateTransporteurCounter();
        })
        .catch(error => {
            console.error("Erreur lors de la vérification:", error);
            afficherErreur("Erreur lors de la vérification. Veuillez réessayer.");
        });
    }
    
    /**
     * Afficher les résultats de la vérification
     */
    function afficherResultats(data) {
        if (!transporteursResultatsDiv) return;
        
        // Récupérer les transporteurs déjà assignés
        const transporteursAssignes = getTransporteursAssignes();
        console.log("Transporteurs déjà assignés:", transporteursAssignes);
        
        // Mettre à jour la liste de sélection des transporteurs
        if (transporteursSelect) {
            // Sauvegarder les transporteurs actuellement sélectionnés
            const selectedIds = Array.from(transporteursSelect.options)
                .filter(opt => opt.selected)
                .map(opt => opt.value);
            
            // Vider la liste actuelle
            transporteursSelect.innerHTML = '';
            
            // Fonction pour ajouter un transporteur à la liste
            function addTransporteurOption(transporteur, status) {
                const option = document.createElement('option');
                option.value = transporteur.id;
                
                // Ajouter des attributs de données pour le filtrage et la recherche
                option.setAttribute('data-status', status);
                option.setAttribute('data-search-text', 
                    `${transporteur.nom} ${transporteur.prenom} ${transporteur.vehicule}`.toLowerCase());
                
                // Définir si l'option est sélectionnée
                option.selected = transporteursAssignes.includes(transporteur.id.toString()) || 
                                  selectedIds.includes(transporteur.id.toString());
                
                // Créer le texte de l'option avec des icônes pour le statut
                let statusIcon = '';
                if (status === 'disponible') {
                    statusIcon = '🟢 '; // Vert pour disponible
                } else {
                    statusIcon = '🟠 '; // Orange pour bientôt disponible
                }
                
                let vehiculeIcon = transporteur.vehicule_adapte ? '✓ ' : ''; // Coche pour véhicule adapté
                
                option.textContent = `${statusIcon}${vehiculeIcon}${transporteur.nom} ${transporteur.prenom} (${transporteur.vehicule})`;
                transporteursSelect.appendChild(option);
            }
            
            // D'abord ajouter les transporteurs disponibles
            data.transporteurs.forEach(transporteur => {
                addTransporteurOption(transporteur, 'disponible');
            });
            
            // Ensuite ajouter les transporteurs bientôt disponibles
            data.soon_available.forEach(transporteur => {
                addTransporteurOption(transporteur, 'occupe');
            });
        }
        
        // Créer le contenu HTML pour les véhicules recommandés
        let htmlVehicules = '';
        if (data.vehicules_recommandes && data.vehicules_recommandes.length > 0) {
            htmlVehicules = '<div class="alert alert-success mt-3">' +
                                '<h6><i class="fas fa-thumbs-up"></i> Véhicules recommandés:</h6>' +
                                '<ul class="mb-0">';
            
            data.vehicules_recommandes.forEach(vehicule => {
                htmlVehicules += `<li><strong>${vehicule.nom}</strong> - ${vehicule.description}</li>`;
            });
            
            htmlVehicules += '</ul></div>';
        }
        
        // Afficher les statistiques de disponibilité
        let statsHtml = `
            <div class="mt-3 mb-3">
                <div class="d-flex justify-content-between">
                    <span><strong>Transporteurs disponibles:</strong> ${data.transporteurs.length}</span>
                    <span><strong>Bientôt disponibles:</strong> ${data.soon_available.length}</span>
                </div>
                <div class="progress mt-2" style="height: 20px;">
                    <div class="progress-bar bg-success" role="progressbar" 
                         style="width: ${data.transporteurs.length / (data.transporteurs.length + data.soon_available.length || 1) * 100}%" 
                         aria-valuenow="${data.transporteurs.length}" aria-valuemin="0" 
                         aria-valuemax="${data.transporteurs.length + data.soon_available.length}">
                        Disponibles
                    </div>
                    <div class="progress-bar bg-warning" role="progressbar" 
                         style="width: ${data.soon_available.length / (data.transporteurs.length + data.soon_available.length || 1) * 100}%" 
                         aria-valuenow="${data.soon_available.length}" aria-valuemin="0" 
                         aria-valuemax="${data.transporteurs.length + data.soon_available.length}">
                        Occupés
                    </div>
                </div>
            </div>
        `;
        
        // Afficher les résultats
        transporteursResultatsDiv.innerHTML = 
            '<div class="alert alert-success">' +
                '<i class="fas fa-check-circle me-2"></i> ' +
                'Vérification terminée. Sélectionnez les transporteurs dans la liste ci-dessous.' +
            '</div>' + 
            statsHtml +
            htmlVehicules;
            
        // Mettre à jour le compteur et les filtres
        updateTransporteurCounter();
        filterTransporteurs();
    }
    
    /**
     * Filtrer les transporteurs selon la recherche et les filtres
     */
    function filterTransporteurs() {
        if (!transporteursSelect || !transporteurSearch) return;
        
        const searchText = transporteurSearch.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active');
        const filterValue = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
        
        Array.from(transporteursSelect.options).forEach(option => {
            const matchesSearch = !searchText || option.getAttribute('data-search-text').includes(searchText);
            const matchesFilter = filterValue === 'all' || 
                                 (filterValue === 'available' && option.getAttribute('data-status') === 'disponible');
            
            option.style.display = matchesSearch && matchesFilter ? '' : 'none';
        });
    }
    
    /**
     * Synchroniser avec le calendrier FullCalendar
     */
    function synchroniserCalendrier(data) {
        // Vérifier si le calendrier existe
        if (typeof window.calendar === 'undefined') {
            console.log("Calendrier non trouvé pour la synchronisation");
            return;
        }
        
        console.log("Synchronisation avec le calendrier...");
        
        // Si des données de prestation existent, rafraîchir le calendrier
        if (data && (data.transporteurs || data.soon_available)) {
            try {
                // Rafraîchir les événements du calendrier
                window.calendar.refetchEvents();
                console.log("Événements du calendrier rafraîchis");
            } catch (error) {
                console.error("Erreur lors de la synchronisation avec le calendrier:", error);
            }
        }
    }
    
    /**
     * Obtenir les transporteurs déjà assignés
     */
    function getTransporteursAssignes() {
        const assignedIds = [];
        if (transporteursSelect && transporteursSelect.options) {
            for (let i = 0; i < transporteursSelect.options.length; i++) {
                if (transporteursSelect.options[i].selected) {
                    assignedIds.push(transporteursSelect.options[i].value);
                }
            }
        }
        return assignedIds;
    }
    
    /**
     * Mettre à jour le compteur de transporteurs sélectionnés
     */
    function updateTransporteurCounter() {
        const counterElement = document.querySelector('.transporteurs-counter');
        if (!counterElement || !transporteursSelect) return;
        
        const selectedCount = Array.from(transporteursSelect.options)
            .filter(option => option.selected).length;
        
        const totalAvailable = transporteursLibres.length;
        let message = `${selectedCount} transporteur(s) sélectionné(s) sur ${totalAvailable} disponibles`;
        
        if (transporteursOccupes.length > 0) {
            message += ` (+ ${transporteursOccupes.length} occupés)`;
        }
        
        counterElement.textContent = message;
    }
    
    /**
     * Afficher un message d'erreur
     */
    function afficherErreur(message) {
        if (!transporteursResultatsDiv) return;
        
        transporteursResultatsDiv.innerHTML = 
            `<div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i> ${message}
            </div>`;
    }
    
    /**
     * Afficher un indicateur de chargement
     */
    function afficherChargement() {
        if (!transporteursResultatsDiv) return;
        
        transporteursResultatsDiv.innerHTML = 
            `<div class="text-center p-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-2">Vérification des disponibilités en cours...</p>
            </div>`;
    }
    
    // ===== ATTACHER LES ÉVÉNEMENTS =====
    
    // Bouton de vérification des disponibilités
    if (btnVerifierDispo) {
        btnVerifierDispo.addEventListener('click', verifierDisponibilites);
    }
    
    // Bouton pour afficher le calendrier
    if (showCalendarBtn) {
        showCalendarBtn.addEventListener('click', function() {
            // Rediriger vers la vue du calendrier
            window.location.href = '/calendrier';
        });
    }
    
    // Événement de changement pour le select des transporteurs
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', function() {
            updateTransporteurCounter();
        });
    }
    
    // Événements pour déclencher la vérification automatique
    if (dateDebutInput) {
        dateDebutInput.addEventListener('change', verifierDisponibilites);
    }
    
    if (dateFinInput) {
        dateFinInput.addEventListener('change', verifierDisponibilites);
    }
    
    if (typeDemenagementSelect) {
        typeDemenagementSelect.addEventListener('change', verifierDisponibilites);
    }
});
