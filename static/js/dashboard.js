/**
 * Dashboard specific JavaScript for Cavalier Déménagement
 */

/**
 * Fonction pour charger les informations complètes du client depuis la page de détails de la prestation
 */
function loadClientInfo() {
    // Récupérer l'ID de la prestation actuelle
    const prestationId = window.currentPrestationId;
    
    if (!prestationId) {
        console.error('ID de prestation non disponible');
        return;
    }
    
    // Créer un lien vers la page de détails de la prestation
    const prestationViewUrl = `/prestations/${prestationId}/view`;
    
    // Afficher un indicateur de chargement
    const loadButton = document.getElementById('load-client-info');
    if (loadButton) {
        loadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Chargement...';
        loadButton.disabled = true;
    }
    
    // Créer un iframe invisible pour charger la page
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = prestationViewUrl;
    
    // Ajouter l'iframe au document
    document.body.appendChild(iframe);
    
    // Attendre que l'iframe soit chargé
    iframe.onload = function() {
        try {
            // Récupérer le contenu de l'iframe
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            
            // Extraire les informations de tous les clients
            const clientsContainer = document.getElementById('clients-container');
            if (clientsContainer) {
                // Trouver la section des clients dans la page de détails
                const clientsSection = iframeDocument.querySelector('.card-body:has(a[href^="tel:"])');
                
                if (clientsSection) {
                    // Extraire tous les noms, emails et téléphones des clients
                    const clientElements = clientsSection.querySelectorAll('.card-body > div');
                    
                    // Construire le HTML pour afficher tous les clients
                    let clientsHTML = '';
                    
                    // Parcourir tous les clients
                    clientElements.forEach((clientElement, index) => {
                        // Extraire le nom du client
                        const nameElement = clientElement.querySelector('strong');
                        const clientName = nameElement ? nameElement.textContent.trim() : `Client ${index + 1}`;
                        
                        // Extraire l'email du client
                        const emailElement = clientElement.querySelector('a[href^="mailto:"]');
                        const clientEmail = emailElement ? emailElement.href.replace('mailto:', '') : '';
                        
                        // Extraire le téléphone du client
                        const telElement = clientElement.querySelector('a[href^="tel:"]');
                        const clientTel = telElement ? telElement.href.replace('tel:', '') : '';
                        
                        // Ajouter le client au HTML
                        clientsHTML += `
                        <div class="client-card mb-3 border-bottom pb-3">
                            <h6 class="mb-2 fw-bold">${clientName}</h6>
                            
                            <div class="d-flex align-items-center mb-2">
                                <a href="tel:${clientTel}" class="btn btn-sm btn-outline-primary me-2 ${!clientTel ? 'disabled' : ''}">
                                    <i class="fas fa-phone"></i>
                                </a>
                                <span>${clientTel || 'Non renseigné'}</span>
                            </div>
                            
                            <div class="d-flex align-items-center">
                                <a href="mailto:${clientEmail}" class="btn btn-sm btn-outline-primary me-2 ${!clientEmail ? 'disabled' : ''}">
                                    <i class="fas fa-envelope"></i>
                                </a>
                                <span>${clientEmail || 'Non renseigné'}</span>
                            </div>
                        </div>
                        `;
                    });
                    
                    // Mettre à jour le conteneur des clients
                    clientsContainer.innerHTML = clientsHTML || '<p>Aucun client trouvé</p>';
                }
            }
            
            // Extraire les adresses
            const adressesContainer = document.getElementById('adresses-container');
            if (adressesContainer) {
                const departElement = iframeDocument.querySelector('#point-de-depart');
                const arriveeElement = iframeDocument.querySelector('#point-darrivee');
                
                const departAdresse = departElement ? departElement.textContent.trim() : 'Non renseignée';
                const arriveeAdresse = arriveeElement ? arriveeElement.textContent.trim() : 'Non renseignée';
                
                // Mettre à jour les adresses
                const departContainer = document.getElementById('adresse-depart');
                const arriveeContainer = document.getElementById('adresse-arrivee');
                
                if (departContainer) departContainer.textContent = departAdresse;
                if (arriveeContainer) arriveeContainer.textContent = arriveeAdresse;
            }
            
            // Restaurer le bouton de chargement
            if (loadButton) {
                loadButton.innerHTML = '<i class="fas fa-check me-1"></i> Informations chargées';
                setTimeout(() => {
                    if (loadButton) {
                        loadButton.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Recharger les informations';
                        loadButton.disabled = false;
                    }
                }, 2000);
            }
            
            // Supprimer l'iframe après utilisation
            document.body.removeChild(iframe);
        } catch (error) {
            console.error('Erreur lors de la récupération des informations du client:', error);
            
            // Restaurer le bouton de chargement en cas d'erreur
            if (loadButton) {
                loadButton.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Erreur de chargement';
                setTimeout(() => {
                    if (loadButton) {
                        loadButton.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Réessayer';
                        loadButton.disabled = false;
                    }
                }, 2000);
            }
            
            // Supprimer l'iframe en cas d'erreur
            document.body.removeChild(iframe);
        }
    };
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du dashboard...');
    // Check if we're on the dashboard page
    if (!document.getElementById('dashboard-page')) return;

    // Initialize revenue chart if container exists
    const revenueChartContainer = document.getElementById('revenue-chart');
    if (revenueChartContainer) {
        console.log('Initialisation du graphique de revenus...');
        initRevenueChart();
    }
    
    // Initialize service type chart if container exists
    const serviceTypeChartContainer = document.getElementById('service-type-chart');
    if (serviceTypeChartContainer) {
        console.log('Initialisation du graphique des types de services...');
        initServiceTypeChart();
    }
    
    // Réactiver l'initialisation du calendrier dans le dashboard
    const calendarContainer = document.getElementById('dashboard-calendar');
    if (calendarContainer) {
        console.log('Initialisation du calendrier en plein écran dans le dashboard...');
        initCalendar();
    }
});

/**
 * Initialize revenue chart with data from server
 */
function initRevenueChart() {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    
    // Données de démonstration
    const demoData = {
        labels: getLastMonths(6),
        datasets: [{
            label: 'Chiffre d\'affaires',
            data: [3500, 4200, 3800, 5100, 4700, 6200],
            backgroundColor: 'rgba(40, 167, 69, 0.2)',
            borderColor: '#28a745',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#28a745',
            pointBorderColor: '#fff',
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#28a745'
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: demoData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR'
                            }).format(value);
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyColor: '#fff',
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Chiffre d\'affaires: ' + new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR'
                            }).format(context.parsed.y);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/**
 * Initialize service type pie chart
 */
function initServiceTypeChart() {
    const ctx = document.getElementById('service-type-chart').getContext('2d');
    
    // Récupérer les données du serveur
    fetch('/api/dashboard/service-types')
        .then(response => response.json())
        .then(data => {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels || [
                        'Déménagement Résidentiel',
                        'Déménagement Commercial',
                        'Transport de marchandises',
                        'Stockage'
                    ],
                    datasets: [{
                        data: data.values || [0, 0, 0, 0],
                        backgroundColor: [
                            '#8B4513',
                            '#A0522D',
                            '#DAA520',
                            '#CD853F'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des types de services:', error);
        });
}

/**
 * Initialize calendar with upcoming services
 */
function initCalendar() {
    console.log('Initialisation du calendrier en plein écran dans le dashboard...');
    const calendarEl = document.getElementById('dashboard-calendar');
    
    if (!calendarEl) {
        console.error("L'élément du calendrier n'a pas été trouvé!");
        return;
    }
    
    // Créer une instance du calendrier
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        locale: 'fr',
        themeSystem: 'bootstrap',
        height: 'auto',
        eventDisplay: 'block',
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        firstDay: 1, // Monday
        displayEventTime: true,
        displayEventEnd: true,
        
        // Gestionnaire de clic sur un événement - Version simplifiée sans API
        eventClick: function(info) {
            // Empêcher la redirection par défaut
            info.jsEvent.preventDefault();
            
            // Récupérer les informations de l'événement
            const event = info.event;
            const prestationId = event.id;
            const title = event.title || 'Sans titre';
            const start = event.start ? event.start.toLocaleDateString('fr-FR') : 'Non défini';
            const end = event.end ? event.end.toLocaleDateString('fr-FR') : start;
            
            // Extraire les informations du titre pour obtenir le type et le client
            let extractedType = 'Type non spécifié';
            let extractedClient = 'Client non spécifié';
            
            if (title) {
                const titleParts = title.split(' - ');
                if (titleParts.length >= 2) {
                    extractedType = titleParts[0] || 'Type non spécifié';
                    extractedClient = titleParts[1] || 'Client non spécifié';
                }
            }
            
            // Récupérer les informations des propriétés étendues ou de l'API
            const statut = event.extendedProps?.status || event.extendedProps?.statut || 'Non défini';
            
            // Simplifier l'affichage sans chargement des détails du client
            const clientInfoUrl = `/prestations/view/${prestationId}`;
            
            // Extraire les adresses de départ et d'arrivée depuis la propriété location
            let adresseDepart = 'Non renseignée';
            let adresseArrivee = 'Non renseignée';
            
            if (event.extendedProps?.location) {
                const locationText = event.extendedProps.location;
                const deMatch = locationText.match(/De:\s*([^À]+)/);
                const aMatch = locationText.match(/À:\s*(.+)/);
                
                if (deMatch && deMatch[1]) {
                    adresseDepart = deMatch[1].trim();
                }
                
                if (aMatch && aMatch[1]) {
                    adresseArrivee = aMatch[1].trim();
                }
            }
            
            const adresse = event.extendedProps?.adresse || adresseDepart || 'Adresse non spécifiée';
            const type = extractedType;
            const observations = event.extendedProps?.description || event.extendedProps?.observations || '';
            
            // Récupérer les éléments DOM
            const prestationDetails = document.querySelector('.prestation-details');
            const detailsContainer = document.getElementById('prestation-details-container');
            
            // Vérifier que les éléments existent
            if (!prestationDetails || !detailsContainer) {
                console.error('Eléments DOM manquants pour afficher les détails');
                return false;
            }
            
            // Déterminer la classe de badge selon le statut
            const badgeClass = {
                'En attente': 'bg-warning',
                'Confirmée': 'bg-info',
                'En cours': 'bg-primary',
                'Terminée': 'bg-success',
                'Annulée': 'bg-danger',
                'Refusée': 'bg-secondary'
            }[statut] || 'bg-secondary';
            
            // Stocker l'ID de la prestation actuelle dans une variable globale
            window.currentPrestationId = prestationId;
            
            // Construire le HTML pour afficher les détails
            detailsContainer.innerHTML = `
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0">Prestation #${prestationId}</h5>
                        <span class="badge prestation-detail-badge ${badgeClass}">${statut}</span>
                    </div>
                    
                    <div class="detail-section card mb-3">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-3 text-muted d-flex align-items-center">
                                <i class="fas fa-info-circle me-2 text-primary"></i> Détails
                            </h6>
                            <p class="card-text mb-2 fs-5 fw-bold">${title}</p>
                        </div>
                    </div>
                    
                    <div class="detail-section card mb-3">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-3 text-muted d-flex align-items-center">
                                <i class="fas fa-user me-2 text-primary"></i> Client
                            </h6>
                            
                            <!-- Affichage simple du client -->
                            <p class="card-text mb-2 fw-bold">${extractedClient}</p>
                            <p class="card-text mb-0">Pour voir les détails complets du client, cliquez sur le bouton "Fiche complète" ci-dessous.</p>
                        </div>
                    </div>
                    
                    <div class="detail-section card mb-3">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-3 text-muted d-flex align-items-center">
                                <i class="fas fa-calendar-alt me-2 text-primary"></i> Dates
                            </h6>
                            <p class="card-text">Du ${start} au ${end}</p>
                        </div>
                    </div>
                    
                    <div class="detail-section card mb-3">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-3 text-muted d-flex align-items-center">
                                <i class="fas fa-map-marker-alt me-2 text-primary"></i> Adresses
                            </h6>
                            <div id="adresses-container">
                                <p class="card-text mb-2"><span class="fw-bold">Départ:</span> <span id="adresse-depart">${adresseDepart || 'Non renseignée'}</span></p>
                                <p class="card-text mb-2"><span class="fw-bold">Arrivée:</span> <span id="adresse-arrivee">${adresseArrivee || 'Non renseignée'}</span></p>
                                ${!adresseDepart && !adresseArrivee ? `<p class="card-text">${adresse}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section card mb-3">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-3 text-muted d-flex align-items-center">
                                <i class="fas fa-truck me-2 text-primary"></i> Type de prestation
                            </h6>
                            <p class="card-text">${type}</p>
                        </div>
                    </div>
                    
                    ${observations ? `
                    <div class="detail-section card mb-3">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-3 text-muted d-flex align-items-center">
                                <i class="fas fa-clipboard-list me-2 text-primary"></i> Observations
                            </h6>
                            <p class="card-text">${observations}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="action-buttons">
                        <a href="/prestations/view/${prestationId}" class="btn btn-primary">
                            <i class="fas fa-eye me-1"></i> Fiche complète
                        </a>
                        <button class="btn btn-outline-danger ms-2 close-panel-btn">
                            <i class="fas fa-times me-1"></i> Fermer
                        </button>
                    </div>
                </div>
            `;
            
            // Afficher le panneau de détails
            prestationDetails.classList.add('active');
            
            // Ajouter l'événement de fermeture au bouton
            document.querySelector('.close-panel-btn')?.addEventListener('click', function() {
                prestationDetails.classList.remove('active');
            });
            
            return false;
        },
        
        // Ajouter des classes CSS aux événements selon leur statut
        eventClassNames: function(arg) {
            if (arg.event.extendedProps && arg.event.extendedProps.statut) {
                const statut = arg.event.extendedProps.statut.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-');
                return [`event-${statut}`];
            }
            return [];
        },
        
        // Configuration des événements lors du montage
        eventDidMount: function(info) {
            // Récupérer les informations pour l'infobulle
            const title = info.event.title || 'Sans titre';
            const statut = info.event.extendedProps && info.event.extendedProps.statut ? 
                info.event.extendedProps.statut : 'Non défini';
            const debut = info.event.start ? 
                info.event.start.toLocaleDateString('fr-FR') : 'Non défini';
            
            // Texte de l'infobulle
            const tooltipText = `${title} - ${statut} - ${debut}`;
            
            // Ajouter un attribut title pour l'infobulle natif du navigateur
            info.el.setAttribute('title', tooltipText);
            
            // Ajouter un attribut data-prestation-id pour faciliter la récupération de l'ID
            info.el.setAttribute('data-prestation-id', info.event.id);
        },
        
        // Fonction de chargement vide pour éviter les animations de chargement
        loading: function(isLoading) {
            // Ne rien faire
        }
    });
    
    // Rendre le calendrier avant de charger les événements
    calendar.render();
    console.log('Calendrier rendu initialement');
    
    // Aucun indicateur de chargement - chargement direct des événements
    
    // Charger les événements immédiatement
    console.log('Chargement des événements...');
    fetch('/calendrier/api/prestations/calendrier', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(events => {
        console.log(`${events.length} événements chargés avec succès`);
        
        // Supprimer tous les événements existants et ajouter les nouveaux
        calendar.removeAllEvents();
        
        // Modifier les événements pour ajouter des classes CSS spécifiques
        const processedEvents = events.map(event => {
            // Ajouter une classe CSS basée sur le statut pour le style
            const statut = (event.extendedProps && event.extendedProps.statut) ? 
                event.extendedProps.statut.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-') : 
                'non-defini';
            
            // Ajouter la classe au classNames de l'événement
            if (!event.classNames) {
                event.classNames = [];
            }
            event.classNames.push(`event-${statut}`);
            
            return event;
        });
        
        // Ajouter les événements traités au calendrier
        calendar.addEventSource(processedEvents);
        
        // Aucun indicateur de chargement à masquer
        
        // Forcer un rafraîchissement du calendrier immédiatement
        calendar.updateSize();
        calendar.refetchEvents();
        calendar.render();
        console.log('Calendrier rafraîchi immédiatement après chargement des événements');
        
        // Supprimer les éventuels spinners de chargement des événements
        document.querySelectorAll('.fc-event .spinner-border, .fc-event .loading-indicator').forEach(spinner => {
            spinner.remove();
        });
        
        // Forcer un second rafraîchissement après un court délai
        setTimeout(() => {
            calendar.updateSize();
            calendar.refetchEvents();
            calendar.render();
            console.log('Calendrier rafraîchi après un court délai');
            
            // Supprimer à nouveau les éventuels spinners de chargement
            document.querySelectorAll('.fc-event .spinner-border, .fc-event .loading-indicator').forEach(spinner => {
                spinner.remove();
            });
        }, 100);
        
        // Ajouter un autre rafraîchissement après un délai plus long pour s'assurer que tout est bien chargé
        setTimeout(() => {
            calendar.updateSize();
            calendar.refetchEvents();
            calendar.render();
            console.log('Second rafraîchissement du calendrier');
            
            // Supprimer à nouveau les éventuels spinners de chargement
            document.querySelectorAll('.fc-event .spinner-border, .fc-event .loading-indicator').forEach(spinner => {
                spinner.remove();
            });
        }, 1000);
    })
    .catch(error => {
        console.error('Erreur lors du chargement des événements:', error);
        // Masquer l'indicateur de chargement en cas d'erreur
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    });
    
    // Ajouter un gestionnaire pour fermer le panneau de détails
    document.querySelector('.close-details')?.addEventListener('click', function() {
        document.querySelector('.prestation-details').classList.remove('active');
    });
    
    // Retourner l'instance du calendrier pour pouvoir y accéder ailleurs si nécessaire
    return calendar;
    
    // Ajouter un gestionnaire pour le bouton "Aujourd'hui" pour forcer un rafraîchissement
    document.querySelector('.fc-today-button')?.addEventListener('click', function() {
        setTimeout(() => {
            calendar.updateSize();
            calendar.refetchEvents();
        }, 100);
    });
    
    // Ajouter des gestionnaires pour les boutons de navigation pour forcer un rafraîchissement
    document.querySelector('.fc-prev-button')?.addEventListener('click', function() {
        setTimeout(() => {
            calendar.updateSize();
            calendar.refetchEvents();
        }, 100);
    });
    
    document.querySelector('.fc-next-button')?.addEventListener('click', function() {
        setTimeout(() => {
            calendar.updateSize();
            calendar.refetchEvents();
        }, 100);
    });
    
    // Retourner l'instance du calendrier pour pouvoir y accéder ailleurs si nécessaire
    return calendar;
}

/**
 * Get array of last n months as formatted strings
 * @param {number} numMonths - Number of months to get
 * @return {Array} Array of formatted month strings
 */
function getLastMonths(numMonths) {
    const months = [];
    const date = new Date();
    
    for (let i = 0; i < numMonths; i++) {
        const monthDate = new Date(date);
        monthDate.setMonth(date.getMonth() - i);
        
        const monthName = monthDate.toLocaleString('fr-FR', { month: 'short' });
        const year = monthDate.getFullYear();
        
        months.unshift(`${monthName} ${year}`);
    }
    
    return months;
}

// Les fonctions retryLoadDetails et displayPrestationDetails ont été supprimées
// car nous avons simplifié le système d'affichage des détails des prestations


/**
 * Fetch calendar events from the API
 * @return {Promise} Promise resolving to array of calendar events
 */
function fetchCalendarEvents() {
    console.log('Chargement des événements du calendrier depuis l\'API...');
    
    // Récupération du token CSRF depuis la balise meta
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    // Configuration des headers pour la requête
    const fetchConfig = {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrfToken || '',
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    };
    
    return fetch('/api/prestations/calendrier', fetchConfig)
        .then(response => {
            if (!response.ok) {
                console.warn(`Erreur HTTP: ${response.status} - ${response.statusText}`);
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            console.log('Réponse reçue de l\'API');
            return response.json();
        })
        .then(events => {
            console.log('Événements reçus :', events);
            if (events.length === 0) {
                console.warn('Aucun événement trouvé dans le calendrier.');
            }
            return events;
        })
        .catch(error => {
            console.error('Erreur lors du chargement des événements :', error);
            // Retourner un tableau vide en cas d'erreur pour éviter de bloquer l'application
            return [];
        });
}

/**
 * Format date for calendar
 * @param {Date} date - Date to format
 * @param {number} addDays - Optional days to add
 * @return {string} Formatted date string
 */
function formatDateForCalendar(date, addDays = 0) {
    const newDate = new Date(date);
    if (addDays) {
        newDate.setDate(newDate.getDate() + addDays);
    }
    
    return newDate.toISOString().split('T')[0];
}
