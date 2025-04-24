/**
 * CALENDRIER DES TRANSPORTEURS
 * Module pour afficher les disponibilités des transporteurs sous forme de calendrier
 * Version: 1.0.0
 */

// Fonction auto-exécutante pour éviter les conflits de variables globales
(function() {
    // Attendre que le DOM soit complètement chargé
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[TRANSPORTEURS-CALENDRIER] Script chargé et initialisé');
        initCalendrierTransporteurs();
    });

    // Fonction principale d'initialisation
    function initCalendrierTransporteurs() {
        // Éléments DOM
        const elements = {
            btnShowCalendar: document.querySelector('#show-calendar-btn'),
            transporteursSelect: document.querySelector('#transporteurs'),
            dateDebutInput: document.querySelector('#date_debut'),
            dateFinInput: document.querySelector('#date_fin')
        };

        // Vérifier que les éléments nécessaires sont présents
        if (!elements.btnShowCalendar) {
            console.error('[TRANSPORTEURS-CALENDRIER] Bouton calendrier non trouvé');
            return;
        }

        console.log('[TRANSPORTEURS-CALENDRIER] Éléments nécessaires trouvés');

        // Initialiser les écouteurs d'événements
        elements.btnShowCalendar.addEventListener('click', function(e) {
            e.preventDefault();
            showCalendarModal(elements);
        });

        console.log('[TRANSPORTEURS-CALENDRIER] Écouteurs d\'événements initialisés');
    }

    // Fonction pour afficher le modal du calendrier
    function showCalendarModal(elements) {
        try {
            console.log('[TRANSPORTEURS-CALENDRIER] Affichage du modal calendrier');

            // Créer le modal s'il n'existe pas déjà
            let calendarModal = document.getElementById('transporteurs-calendar-modal');
            if (!calendarModal) {
                console.log('[TRANSPORTEURS-CALENDRIER] Création du modal calendrier');
                calendarModal = createCalendarModal();
                document.body.appendChild(calendarModal);
            } else {
                console.log('[TRANSPORTEURS-CALENDRIER] Modal calendrier existant réutilisé');
            }

            // Récupérer les dates sélectionnées
            const dateDebut = elements.dateDebutInput ? elements.dateDebutInput.value : '';
            const dateFin = elements.dateFinInput ? elements.dateFinInput.value : '';
            console.log(`[TRANSPORTEURS-CALENDRIER] Dates sélectionnées: début=${dateDebut}, fin=${dateFin}`);

            // Récupérer le transporteur sélectionné (si un seul est sélectionné)
            let transporteurId = null;
            let transporteurNom = '';
            if (elements.transporteursSelect && elements.transporteursSelect.selectedOptions.length === 1) {
                transporteurId = elements.transporteursSelect.selectedOptions[0].value;
                transporteurNom = elements.transporteursSelect.selectedOptions[0].text;
                console.log(`[TRANSPORTEURS-CALENDRIER] Transporteur sélectionné: id=${transporteurId}, nom=${transporteurNom}`);
            } else if (elements.transporteursSelect) {
                console.log(`[TRANSPORTEURS-CALENDRIER] ${elements.transporteursSelect.selectedOptions.length} transporteurs sélectionnés ou aucun`);
            }

            // Mettre à jour le titre du modal
            const modalTitle = calendarModal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = transporteurId 
                    ? `Calendrier de disponibilité - ${transporteurNom}` 
                    : 'Calendrier des disponibilités';
                console.log(`[TRANSPORTEURS-CALENDRIER] Titre du modal mis à jour: ${modalTitle.textContent}`);
            }

            // Vérifier si Bootstrap est disponible
            if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
                console.error('[TRANSPORTEURS-CALENDRIER] Bootstrap Modal n\'est pas disponible');
                alert('Erreur: La bibliothèque Bootstrap est manquante. Veuillez recharger la page.');
                return;
            }

            // Initialiser ou mettre à jour le calendrier
            console.log('[TRANSPORTEURS-CALENDRIER] Initialisation du calendrier dans le modal');
            initializeCalendar(calendarModal, dateDebut, dateFin, transporteurId);

            // Afficher le modal
            try {
                console.log('[TRANSPORTEURS-CALENDRIER] Affichage du modal Bootstrap');
                const bootstrapModal = new bootstrap.Modal(calendarModal);
                bootstrapModal.show();
                console.log('[TRANSPORTEURS-CALENDRIER] Modal affiché avec succès');
            } catch (modalError) {
                console.error('[TRANSPORTEURS-CALENDRIER] Erreur lors de l\'affichage du modal:', modalError);
                alert('Erreur lors de l\'affichage du calendrier. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('[TRANSPORTEURS-CALENDRIER] Exception lors de l\'affichage du modal calendrier:', error);
            alert(`Erreur: ${error.message || 'Une erreur est survenue lors de l\'affichage du calendrier'}`);
        }
    }

    // Fonction pour créer le modal du calendrier
    function createCalendarModal() {
        const modalHTML = `
            <div class="modal fade" id="transporteurs-calendar-modal" tabindex="-1" aria-labelledby="calendarModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="calendarModalLabel">Calendrier des disponibilités</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fermer"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <div class="card">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0">Légende</h6>
                                        </div>
                                        <div class="card-body">
                                            <ul class="list-group">
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    Disponible
                                                    <span class="badge bg-success rounded-pill">
                                                        <i class="fas fa-check"></i>
                                                    </span>
                                                </li>
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    Occupé
                                                    <span class="badge bg-danger rounded-pill">
                                                        <i class="fas fa-times"></i>
                                                    </span>
                                                </li>
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    Période sélectionnée
                                                    <span class="badge bg-primary rounded-pill">
                                                        <i class="fas fa-calendar-check"></i>
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div class="card mt-3">
                                        <div class="card-header bg-warning text-dark">
                                            <h6 class="mb-0">Filtres</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-3">
                                                <label for="calendar-transporteur-filter" class="form-label">Transporteur</label>
                                                <select id="calendar-transporteur-filter" class="form-select">
                                                    <option value="">Tous les transporteurs</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label for="calendar-vehicule-filter" class="form-label">Type de véhicule</label>
                                                <select id="calendar-vehicule-filter" class="form-select">
                                                    <option value="">Tous les véhicules</option>
                                                </select>
                                            </div>
                                            <button id="calendar-apply-filters" class="btn btn-primary w-100">
                                                <i class="fas fa-filter"></i> Appliquer les filtres
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-9">
                                    <div id="transporteurs-calendar"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        return modalContainer.firstElementChild;
    }

    // Fonction pour initialiser le calendrier
    function initializeCalendar(modalElement, dateDebut, dateFin, transporteurId) {
        try {
            console.log('[TRANSPORTEURS-CALENDRIER] Initialisation du calendrier');
            
            const calendarEl = modalElement.querySelector('#transporteurs-calendar');
            if (!calendarEl) {
                console.error('[TRANSPORTEURS-CALENDRIER] Élément calendrier non trouvé');
                return;
            }

            // Vérifier si FullCalendar est disponible avant de continuer
            if (typeof FullCalendar === 'undefined') {
                console.warn('[TRANSPORTEURS-CALENDRIER] FullCalendar n\'est pas encore chargé, chargement dynamique...');
                calendarEl.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-spinner fa-spin me-2"></i> Chargement de FullCalendar...
                    </div>
                `;
                
                // Charger dynamiquement FullCalendar
                loadFullCalendarLibrary(function() {
                    console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar chargé avec succès, initialisation du calendrier');
                    // Réessayer l'initialisation après le chargement
                    loadCalendarEvents(calendarEl, dateDebut, dateFin, transporteurId);
                });
                return;
            }

            // Charger les données des événements
            loadCalendarEvents(calendarEl, dateDebut, dateFin, transporteurId);
        } catch (error) {
            console.error('[TRANSPORTEURS-CALENDRIER] Erreur lors de l\'initialisation du calendrier:', error);
            // Afficher l'erreur dans le modal
            if (modalElement) {
                const errorContainer = modalElement.querySelector('.modal-body');
                if (errorContainer) {
                    errorContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            <strong>Erreur lors de l'initialisation du calendrier:</strong><br>
                            ${error.message || 'Erreur inconnue'}
                        </div>
                    `;
                }
            }
        }
    }

    // Fonction pour charger les événements du calendrier
    function loadCalendarEvents(calendarEl, dateDebut, dateFin, transporteurId) {
        try {
            console.log('[TRANSPORTEURS-CALENDRIER] Chargement des événements du calendrier');
            console.log(`[TRANSPORTEURS-CALENDRIER] Paramètres: dateDebut=${dateDebut}, dateFin=${dateFin}, transporteurId=${transporteurId}`);

            // Préparer les paramètres de la requête
            const params = new URLSearchParams();
            if (dateDebut) params.append('start', dateDebut);
            if (dateFin) params.append('end', dateFin);
            if (transporteurId) params.append('transporteur_id', transporteurId);

            // Afficher un indicateur de chargement
            calendarEl.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <div>Chargement du calendrier...</div>
                </div>
            `;

            const url = `/calendar-events?${params.toString()}`;
            console.log(`[TRANSPORTEURS-CALENDRIER] URL de l'API: ${url}`);

            // Charger les événements depuis l'API
            fetch(url)
                .then(response => {
                    console.log(`[TRANSPORTEURS-CALENDRIER] Réponse API statut: ${response.status}`);
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('[TRANSPORTEURS-CALENDRIER] Événements reçus:', data);
                    if (!Array.isArray(data)) {
                        console.warn('[TRANSPORTEURS-CALENDRIER] Les données reçues ne sont pas un tableau:', data);
                        data = []; // Assurer que data est un tableau
                    }
                    renderCalendar(calendarEl, data, dateDebut, dateFin);
                })
                .catch(error => {
                    console.error('[TRANSPORTEURS-CALENDRIER] Erreur lors du chargement des événements:', error);
                    calendarEl.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            <strong>Erreur lors du chargement des données:</strong><br>
                            ${error.message || 'Erreur inconnue'}
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="fas fa-sync-alt me-2"></i> Recharger la page
                            </button>
                        </div>
                    `;
                });
        } catch (error) {
            console.error('[TRANSPORTEURS-CALENDRIER] Exception lors du chargement des événements:', error);
            if (calendarEl) {
                calendarEl.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Erreur inattendue:</strong><br>
                        ${error.message || 'Erreur inconnue'}
                    </div>
                `;
            }
        }
    }

    // Fonction pour rendre le calendrier avec les événements
    function renderCalendar(calendarEl, events, dateDebut, dateFin) {
        try {
            console.log('[TRANSPORTEURS-CALENDRIER] Rendu du calendrier avec', events.length, 'événements');
            
            // Vérifier si FullCalendar est disponible
            if (typeof FullCalendar === 'undefined') {
                console.error('[TRANSPORTEURS-CALENDRIER] FullCalendar n\'est pas chargé');
                calendarEl.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Bibliothèque manquante:</strong><br>
                        FullCalendar n'est pas disponible. Chargement en cours...
                    </div>
                `;
                
                // Charger dynamiquement FullCalendar si nécessaire
                loadFullCalendarLibrary(function() {
                    console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar chargé dynamiquement, nouvelle tentative de rendu');
                    renderCalendar(calendarEl, events, dateDebut, dateFin);
                });
                return;
            }

            console.log('[TRANSPORTEURS-CALENDRIER] Configuration du calendrier');
            
            // Créer le calendrier avec une gestion d'erreurs
            try {
                const calendarOptions = {
                    initialView: 'dayGridMonth',
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek'
                    },
                    locale: 'fr',
                    events: events,
                    eventClick: function(info) {
                        try {
                            showEventDetails(info.event);
                        } catch (e) {
                            console.error('[TRANSPORTEURS-CALENDRIER] Erreur lors de l\'affichage des détails:', e);
                            alert('Erreur lors de l\'affichage des détails de l\'événement');
                        }
                    },
                    datesSet: function(dateInfo) {
                        try {
                            // Mettre à jour les filtres quand la vue du calendrier change
                            updateCalendarFilters(calendar);
                        } catch (e) {
                            console.error('[TRANSPORTEURS-CALENDRIER] Erreur lors de la mise à jour des filtres:', e);
                        }
                    }
                };
                
                console.log('[TRANSPORTEURS-CALENDRIER] Création de l\'instance FullCalendar');
                const calendar = new FullCalendar.Calendar(calendarEl, calendarOptions);

                // Définir la date de début si disponible
                if (dateDebut) {
                    console.log(`[TRANSPORTEURS-CALENDRIER] Navigation vers la date: ${dateDebut}`);
                    calendar.gotoDate(dateDebut);
                }

                // Mettre en évidence la période sélectionnée
                if (dateDebut && dateFin) {
                    console.log(`[TRANSPORTEURS-CALENDRIER] Mise en évidence de la période: ${dateDebut} - ${dateFin}`);
                    try {
                        addSelectedPeriodHighlight(calendar, dateDebut, dateFin);
                    } catch (e) {
                        console.error('[TRANSPORTEURS-CALENDRIER] Erreur lors de la mise en évidence de la période:', e);
                    }
                }

                // Rendre le calendrier
                console.log('[TRANSPORTEURS-CALENDRIER] Rendu du calendrier');
                calendar.render();
                
                // Initialiser les filtres
                try {
                    console.log('[TRANSPORTEURS-CALENDRIER] Initialisation des filtres');
                    initializeCalendarFilters(calendar, events);
                } catch (e) {
                    console.error('[TRANSPORTEURS-CALENDRIER] Erreur lors de l\'initialisation des filtres:', e);
                }
                
                console.log('[TRANSPORTEURS-CALENDRIER] Calendrier rendu avec succès');
            } catch (calendarError) {
                console.error('[TRANSPORTEURS-CALENDRIER] Erreur lors de la création du calendrier:', calendarError);
                calendarEl.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong>Erreur lors de la création du calendrier:</strong><br>
                        ${calendarError.message || 'Erreur inconnue'}
                    </div>
                `;
            }
        } catch (error) {
            console.error('[TRANSPORTEURS-CALENDRIER] Exception lors du rendu du calendrier:', error);
            if (calendarEl) {
                calendarEl.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Erreur inattendue:</strong><br>
                        ${error.message || 'Erreur inconnue'}
                    </div>
                `;
            }
        }
    }

    // Fonction pour charger dynamiquement FullCalendar si nécessaire
    function loadFullCalendarLibrary(callback) {
        try {
            console.log('[TRANSPORTEURS-CALENDRIER] Chargement dynamique de FullCalendar');
            
            // Vérifier si FullCalendar est déjà défini
            if (typeof FullCalendar !== 'undefined') {
                console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar est déjà chargé');
                callback();
                return;
            }
            
            // Vérifier si les scripts sont déjà en cours de chargement
            if (document.querySelector('script[src*="fullcalendar"]')) {
                console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar est déjà en cours de chargement');
                // Attendre un peu et vérifier à nouveau
                setTimeout(function() {
                    if (typeof FullCalendar !== 'undefined') {
                        console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar est maintenant disponible');
                        callback();
                    } else {
                        console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar n\'est toujours pas disponible, attente supplémentaire');
                        // Attendre encore un peu
                        setTimeout(function() {
                            if (typeof FullCalendar !== 'undefined') {
                                console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar est finalement disponible');
                                callback();
                            } else {
                                console.error('[TRANSPORTEURS-CALENDRIER] FullCalendar n\'a pas pu être chargé après plusieurs tentatives');
                                alert('Erreur: Impossible de charger la bibliothèque FullCalendar. Veuillez recharger la page.');
                            }
                        }, 2000);
                    }
                }, 1000);
                return;
            }
            
            console.log('[TRANSPORTEURS-CALENDRIER] Ajout des scripts FullCalendar au document');
            
            // Créer et ajouter les styles nécessaires
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.css';
            document.head.appendChild(link);
            
            // Créer et ajouter les scripts nécessaires
            const scripts = [
                'https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.js',
                'https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/locales/fr.js'
            ];
            
            // Charger les scripts de manière séquentielle
            let loaded = 0;
            scripts.forEach(function(src) {
                const script = document.createElement('script');
                script.src = src;
                script.onload = function() {
                    console.log(`[TRANSPORTEURS-CALENDRIER] Script chargé: ${src}`);
                    loaded++;
                    if (loaded === scripts.length) {
                        console.log('[TRANSPORTEURS-CALENDRIER] Tous les scripts FullCalendar chargés avec succès');
                        // Vérifier que FullCalendar est bien défini
                        if (typeof FullCalendar !== 'undefined') {
                            console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar est disponible après chargement');
                            callback();
                        } else {
                            console.error('[TRANSPORTEURS-CALENDRIER] FullCalendar n\'est pas défini après chargement des scripts');
                            setTimeout(function() {
                                if (typeof FullCalendar !== 'undefined') {
                                    console.log('[TRANSPORTEURS-CALENDRIER] FullCalendar est disponible après délai');
                                    callback();
                                } else {
                                    console.error('[TRANSPORTEURS-CALENDRIER] FullCalendar n\'est toujours pas disponible');
                                }
                            }, 1000);
                        }
                    }
                };
                script.onerror = function() {
                    console.error(`[TRANSPORTEURS-CALENDRIER] Erreur lors du chargement de ${src}`);
                    alert(`Erreur: Impossible de charger ${src}. Veuillez vérifier votre connexion internet.`);
                };
                document.head.appendChild(script);
                console.log(`[TRANSPORTEURS-CALENDRIER] Script ajouté au document: ${src}`);
            });
        } catch (error) {
            console.error('[TRANSPORTEURS-CALENDRIER] Exception lors du chargement de FullCalendar:', error);
            alert('Erreur lors du chargement des ressources nécessaires. Veuillez recharger la page.');
        }
    }

    // Fonction pour ajouter la mise en évidence de la période sélectionnée
    function addSelectedPeriodHighlight(calendar, dateDebut, dateFin) {
        // Convertir les dates au format attendu par FullCalendar
        const start = new Date(dateDebut);
        const end = new Date(dateFin);
        end.setDate(end.getDate() + 1); // Inclure le dernier jour
        
        // Ajouter un événement spécial pour la période sélectionnée
        calendar.addEvent({
            title: 'Période sélectionnée',
            start: start,
            end: end,
            display: 'background',
            backgroundColor: 'rgba(13, 110, 253, 0.25)',
            borderColor: '#0d6efd'
        });
    }

    // Fonction pour afficher les détails d'un événement
    function showEventDetails(event) {
        console.log('[TRANSPORTEURS-CALENDRIER] Affichage des détails de l\'événement:', event);
        
        // Créer le contenu du modal
        const eventTitle = event.title || 'Événement sans titre';
        const eventStart = event.start ? event.start.toLocaleDateString('fr-FR') : 'Date inconnue';
        const eventEnd = event.end ? event.end.toLocaleDateString('fr-FR') : eventStart;
        const eventDescription = event.extendedProps.description || 'Aucune description disponible';
        const eventTransporteur = event.extendedProps.transporteur || 'Non spécifié';
        const eventVehicule = event.extendedProps.vehicule || 'Non spécifié';
        const eventClient = event.extendedProps.client || 'Non spécifié';
        
        // Créer ou réutiliser le modal de détails
        let detailsModal = document.getElementById('event-details-modal');
        if (!detailsModal) {
            const modalHTML = `
                <div class="modal fade" id="event-details-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Détails de l'événement</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                            </div>
                            <div class="modal-body" id="event-details-content">
                                <!-- Le contenu sera injecté dynamiquement -->
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            detailsModal = modalContainer.firstElementChild;
            document.body.appendChild(detailsModal);
        }
        
        // Mettre à jour le contenu du modal
        const contentContainer = detailsModal.querySelector('#event-details-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">${eventTitle}</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Période:</strong> Du ${eventStart} au ${eventEnd}</p>
                        <p><strong>Transporteur:</strong> ${eventTransporteur}</p>
                        <p><strong>Véhicule:</strong> ${eventVehicule}</p>
                        <p><strong>Client:</strong> ${eventClient}</p>
                        <p><strong>Description:</strong> ${eventDescription}</p>
                    </div>
                </div>
            `;
        }
        
        // Afficher le modal
        const bootstrapModal = new bootstrap.Modal(detailsModal);
        bootstrapModal.show();
    }

    // Fonction pour initialiser les filtres du calendrier
    function initializeCalendarFilters(calendar, events) {
        // Récupérer les éléments de filtre
        const transporteurFilter = document.getElementById('calendar-transporteur-filter');
        const vehiculeFilter = document.getElementById('calendar-vehicule-filter');
        const applyFiltersBtn = document.getElementById('calendar-apply-filters');
        
        if (!transporteurFilter || !vehiculeFilter || !applyFiltersBtn) {
            console.error('[TRANSPORTEURS-CALENDRIER] Éléments de filtre non trouvés');
            return;
        }
        
        // Extraire les transporteurs et véhicules uniques des événements
        const transporteurs = new Set();
        const vehicules = new Set();
        
        events.forEach(event => {
            if (event.extendedProps && event.extendedProps.transporteur) {
                transporteurs.add(event.extendedProps.transporteur);
            }
            if (event.extendedProps && event.extendedProps.vehicule) {
                vehicules.add(event.extendedProps.vehicule);
            }
        });
        
        // Remplir les listes déroulantes de filtres
        transporteurs.forEach(transporteur => {
            const option = document.createElement('option');
            option.value = transporteur;
            option.textContent = transporteur;
            transporteurFilter.appendChild(option);
        });
        
        vehicules.forEach(vehicule => {
            const option = document.createElement('option');
            option.value = vehicule;
            option.textContent = vehicule;
            vehiculeFilter.appendChild(option);
        });
        
        // Ajouter l'écouteur d'événement pour le bouton d'application des filtres
        applyFiltersBtn.addEventListener('click', function() {
            applyCalendarFilters(calendar, transporteurFilter.value, vehiculeFilter.value);
        });
    }

    // Fonction pour mettre à jour les filtres du calendrier
    function updateCalendarFilters(calendar) {
        // Récupérer les valeurs actuelles des filtres
        const transporteurFilter = document.getElementById('calendar-transporteur-filter');
        const vehiculeFilter = document.getElementById('calendar-vehicule-filter');
        
        if (transporteurFilter && vehiculeFilter) {
            applyCalendarFilters(calendar, transporteurFilter.value, vehiculeFilter.value);
        }
    }

    // Fonction pour appliquer les filtres au calendrier
    function applyCalendarFilters(calendar, transporteur, vehicule) {
        console.log(`[TRANSPORTEURS-CALENDRIER] Application des filtres: Transporteur=${transporteur}, Véhicule=${vehicule}`);
        
        // Récupérer tous les événements
        const events = calendar.getEvents();
        
        // Appliquer les filtres
        events.forEach(event => {
            let visible = true;
            
            // Filtrer par transporteur si spécifié
            if (transporteur && event.extendedProps && event.extendedProps.transporteur !== transporteur) {
                visible = false;
            }
            
            // Filtrer par véhicule si spécifié
            if (visible && vehicule && event.extendedProps && event.extendedProps.vehicule !== vehicule) {
                visible = false;
            }
            
            // Appliquer la visibilité
            if (visible) {
                event.setProp('display', 'auto');
            } else {
                event.setProp('display', 'none');
            }
        });
    }
})();
