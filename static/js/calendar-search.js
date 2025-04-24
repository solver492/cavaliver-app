/**
 * Système de recherche intelligent pour le calendrier R-Cavalier
 * Permet de trouver des événements par nom de client, nom de planning ou tags
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du système de recherche pour le calendrier...');
    
    // Créer la barre de recherche
    createSearchBar();
    
    // Initialiser le système de recherche
    initializeSearch();
});

/**
 * Crée la barre de recherche et l'ajoute à l'interface
 */
function createSearchBar() {
    // Vérifier si la barre de recherche existe déjà
    if (document.getElementById('calendar-search-container')) {
        return;
    }
    
    // Créer le conteneur de la barre de recherche
    const searchContainer = document.createElement('div');
    searchContainer.id = 'calendar-search-container';
    searchContainer.className = 'calendar-search-container';
    
    // HTML pour la barre de recherche
    searchContainer.innerHTML = `
        <div class="input-group mb-3">
            <input type="text" id="calendar-search-input" class="form-control" 
                placeholder="Rechercher un client, planning ou tag..." aria-label="Rechercher">
            <button id="calendar-search-button" class="btn btn-primary" type="button">
                <i class="fas fa-search"></i>
            </button>
            <button id="calendar-search-reset" class="btn btn-outline-secondary" type="button">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div id="search-results-container" class="search-results-container d-none">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Résultats de recherche</span>
                    <span class="badge rounded-pill bg-primary" id="search-results-count">0</span>
                </div>
                <ul class="list-group list-group-flush" id="search-results-list"></ul>
            </div>
        </div>
    `;
    
    // Trouver le meilleur endroit pour insérer la barre de recherche
    const calendarHeader = document.querySelector('.page-header') || 
                          document.querySelector('.fc-header-toolbar');
    
    if (calendarHeader) {
        // Insérer avant le calendrier
        const calendarEl = document.getElementById('calendar');
        if (calendarEl && calendarEl.parentNode) {
            calendarEl.parentNode.insertBefore(searchContainer, calendarEl);
        } else {
            // Alternative: insérer après l'en-tête
            calendarHeader.insertAdjacentElement('afterend', searchContainer);
        }
    } else {
        // Dernier recours: insérer au début de la page
        const firstElement = document.body.firstElementChild;
        document.body.insertBefore(searchContainer, firstElement);
    }
    
    console.log('Barre de recherche créée avec succès');
}

/**
 * Initialise le système de recherche
 */
function initializeSearch() {
    // Récupérer les éléments
    const searchInput = document.getElementById('calendar-search-input');
    const searchButton = document.getElementById('calendar-search-button');
    const resetButton = document.getElementById('calendar-search-reset');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsList = document.getElementById('search-results-list');
    const resultsCount = document.getElementById('search-results-count');
    
    if (!searchInput || !searchButton || !resetButton || !resultsContainer || !resultsList) {
        console.error('Éléments de recherche non trouvés');
        return;
    }
    
    // Gestionnaire pour le bouton de recherche
    searchButton.addEventListener('click', function() {
        performSearch(searchInput.value);
    });
    
    // Gestionnaire pour la touche Enter
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
    
    // Gestionnaire pour le bouton de réinitialisation
    resetButton.addEventListener('click', function() {
        searchInput.value = '';
        resultsContainer.classList.add('d-none');
        highlightEvents([]);
    });
    
    /**
     * Recherche directement dans le DOM quand l'API FullCalendar échoue
     */
    function searchDirectlyInDOM() {
        console.log('Recherche directe dans le DOM...');
        const normalizedQuery = searchInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Récupérer tous les éléments d'événement dans le DOM
        const eventElements = document.querySelectorAll('.fc-event');
        console.log('Éléments trouvés dans le DOM:', eventElements.length);
        
        const matchingElements = [];
        const matchingEvents = [];
        
        eventElements.forEach(function(el) {
            // Extraire le texte de l'événement et le normaliser
            const eventText = el.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            // Extraire les attributs data-* (qui contiennent les propriétés étendues)
            const dataAttributes = {};
            Array.from(el.attributes)
                .filter(attr => attr.name.startsWith('data-'))
                .forEach(attr => {
                    dataAttributes[attr.name.substring(5)] = attr.value;
                });
            
            // Vérifier si le texte ou un attribut contient la requête
            const matchesText = eventText.includes(normalizedQuery);
            
            // Vérifier les attributs data-*
            const matchesData = Object.values(dataAttributes).some(value => {
                if (typeof value === 'string') {
                    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery);
                }
                return false;
            });
            
            if (matchesText || matchesData) {
                matchingElements.push(el);
                
                // Créer un objet événement factice pour la liste des résultats
                const eventId = el.getAttribute('data-event-id') || el.id || Math.random().toString(36).substring(2, 9);
                const title = el.querySelector('.fc-event-title')?.textContent || 
                              el.querySelector('.fc-list-event-title')?.textContent || 
                              el.getAttribute('data-title') || 
                              el.textContent.trim() || 'Sans titre';
                
                const backgroundColor = el.style.backgroundColor || 
                                        window.getComputedStyle(el).backgroundColor || 
                                        '#3788d8';
                
                // Extraire la date si possible
                let eventDate = null;
                try {
                    // Tenter de récupérer la date depuis un attribut
                    if (el.getAttribute('data-date')) {
                        eventDate = new Date(el.getAttribute('data-date'));
                    } else {
                        // Tenter de récupérer la date depuis l'élément parent
                        const dateElement = el.closest('.fc-daygrid-day') || el.closest('.fc-timegrid-slot');
                        if (dateElement && dateElement.getAttribute('data-date')) {
                            eventDate = new Date(dateElement.getAttribute('data-date'));
                        }
                    }
                } catch (e) {
                    console.error('Erreur lors de l\'extraction de la date:', e);
                }
                
                // Créer un événement similaire à celui de FullCalendar
                matchingEvents.push({
                    id: eventId,
                    title: title,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor,
                    start: eventDate,
                    extendedProps: dataAttributes,
                    // Référence à l'élément DOM pour la mise en évidence
                    _element: el
                });
            }
        });
        
        console.log('Éléments correspondants trouvés:', matchingElements.length);
        
        // Mettre à jour le compteur de résultats
        resultsCount.textContent = matchingEvents.length;
        
        // Vider la liste des résultats
        resultsList.innerHTML = '';
        
        // Afficher les résultats
        if (matchingEvents.length > 0) {
            displaySearchResults(matchingEvents);
            highlightDOMElements(matchingElements);
        } else {
            // Aucun résultat
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'Aucun résultat trouvé';
            resultsList.appendChild(li);
            resultsContainer.classList.remove('d-none');
        }
    }
    
    /**
     * Affiche les résultats de recherche dans la liste
     */
    function displaySearchResults(events) {
        resultsList.innerHTML = '';
        
        events.forEach(event => {
            const li = document.createElement('li');
            li.className = 'list-group-item search-result-item';
            
            // Stocker l'ID de l'événement comme attribut de données
            li.setAttribute('data-event-id', event.id);
            
            // Déterminer le type d'événement et l'icône
            let eventType = event.extendedProps && event.extendedProps.type ? event.extendedProps.type : 'prestation';
            let eventIcon = eventType === 'stockage' ? 'fas fa-warehouse' : 'fas fa-truck-moving';
            
            // Formater la date
            let eventDate = '';
            if (event.start) {
                try {
                    const date = new Date(event.start);
                    eventDate = date.toLocaleDateString('fr-FR');
                } catch (e) {
                    console.error('Erreur lors du formatage de la date:', e);
                }
            }
            
            // Créer le contenu HTML
            li.innerHTML = `
                <div class="d-flex align-items-center" style="border-left: 4px solid ${event.backgroundColor}; padding-left: 10px;">
                    <div class="me-3">
                        <i class="${eventIcon} text-secondary"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${event.title}</h6>
                        <small class="text-muted">${eventDate}</small>
                    </div>
                </div>
            `;
            
            // Ajouter l'événement de clic
            li.addEventListener('click', function() {
                console.log('Clic sur le résultat:', event.title);
                
                // 1. Trouver tous les éléments correspondants dans le DOM
                let targetElement = null;
                const eventElements = document.querySelectorAll('.fc-event');
                
                // D'abord essayer par ID
                if (event.id) {
                    targetElement = Array.from(eventElements).find(el => 
                        el.getAttribute('data-event-id') === event.id.toString());
                }
                
                // Ensuite essayer par titre
                if (!targetElement) {
                    targetElement = Array.from(eventElements).find(el => 
                        el.textContent.includes(event.title));
                }
                
                // Essayer par référence directe
                if (!targetElement && event._element) {
                    targetElement = event._element;
                }
                
                // Si nous avons trouvé l'élément DOM
                if (targetElement) {
                    console.log('Élément correspondant trouvé dans le DOM');
                    
                    // 2. Déterminer la date de l'événement
                    let eventDate = null;
                    
                    // Essayer de trouver la date depuis l'élément parent
                    const dateElement = targetElement.closest('.fc-daygrid-day') || 
                                        targetElement.closest('.fc-timegrid-slot') || 
                                        targetElement.closest('.fc-list-day');
                    
                    if (dateElement && dateElement.getAttribute('data-date')) {
                        eventDate = dateElement.getAttribute('data-date');
                        console.log('Date trouvée depuis l\'\u00e9lément:', eventDate);
                    } else if (event.start) {
                        // Utiliser la date de l'événement si disponible
                        eventDate = event.start;
                        console.log('Date de l\'\u00e9vénement utilisée:', eventDate);
                    }
                    
                    // 3. Aller à la date et mettre en évidence l'événement
                    const calendar = getCalendarInstance();
                    if (calendar && eventDate) {
                        // Fermer d'abord la boîte de résultats de recherche
                        resultsContainer.classList.add('d-none');
                        
                        console.log('Navigation vers la date:', eventDate);
                        try {
                            // D'abord naviguer vers la date en restant dans la même vue
                            const currentView = calendar.view.type;
                            calendar.gotoDate(eventDate);
                            
                            // Attendre que le calendrier se mette à jour
                            setTimeout(() => {
                                // Déterminer si nous sommes dans une vue qui permet d'ouvrir les détails
                                if (currentView.includes('list')) {
                                    // En vue liste, nous devons peut-être changer de vue
                                    calendar.changeView('dayGridMonth');
                                    calendar.gotoDate(eventDate);
                                    setTimeout(processEvent, 200);
                                } else {
                                    processEvent();
                                }
                                
                                function processEvent() {
                                    // Récupérer à nouveau l'élément après le rendu
                                    const updatedElements = document.querySelectorAll('.fc-event');
                                    console.log('Events trouvés après navigation:', updatedElements.length);
                                    
                                    const updatedTargets = Array.from(updatedElements).filter(el => 
                                        el.textContent.includes(event.title));
                                    
                                    if (updatedTargets.length > 0) {
                                        console.log('Cible trouvée:', updatedTargets[0].textContent);
                                        // Mettre en évidence
                                        highlightDOMElements(updatedTargets);
                                        updatedTargets[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        updatedTargets[0].classList.add('blink-highlight');
                                        
                                        // Simuler un clic directement sur l'événement
                                        setTimeout(() => {
                                            // Ouvrir le panneau de détails directement si possible
                                            const detailsPanel = document.querySelector('.prestation-details');
                                            if (detailsPanel) {
                                                detailsPanel.classList.add('active');
                                            }
                                            
                                            // Extraire l'ID de l'événement si possible
                                            const eventId = event.id || updatedTargets[0].getAttribute('data-event-id');
                                            if (eventId && !isNaN(eventId) && eventId !== 'undefined') {
                                                // Charger les détails par API
                                                const apiUrl = `/calendrier/api/prestations/${eventId}/details`;
                                                console.log('Chargement des détails depuis:', apiUrl);
                                                
                                                fetch(apiUrl)
                                                    .then(response => response.json())
                                                    .then(data => {
                                                        console.log('Détails reçus:', data);
                                                        // Appeler la fonction existante pour afficher les détails
                                                        if (typeof displayPrestationDetails === 'function') {
                                                            displayPrestationDetails(data);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error('Erreur lors du chargement des détails:', error);
                                                        // En cas d'échec, juste cliquer sur l'événement
                                                        updatedTargets[0].click();
                                                    });
                                            } else {
                                                // Pas d'ID, juste cliquer sur l'événement
                                                updatedTargets[0].click();
                                            }
                                        }, 200);
                                    } else {
                                        console.log('Aucune cible trouvée après navigation');
                                    }
                                }
                            }, 200);
                        } catch (e) {
                            console.error('Erreur lors de la navigation:', e);
                        }
                    } else {
                        console.log('Aucun élément correspondant trouvé, tentative directe...');
                        
                        // Tenter d'utiliser directement l'API du calendrier
                        const calendar = getCalendarInstance();
                        if (calendar && event.start) {
                            try {
                                // Essayer de passer en vue jour
                                calendar.changeView('dayGridMonth');
                                calendar.gotoDate(event.start);
                                
                                // Mettre en évidence par le titre après le rendu
                                setTimeout(() => {
                                    const elements = document.querySelectorAll('.fc-event');
                                    const matchingElements = Array.from(elements).filter(el => 
                                        el.textContent.includes(event.title));
                                    
                                    if (matchingElements.length > 0) {
                                        highlightDOMElements(matchingElements);
                                        matchingElements[0].scrollIntoView({ behavior: 'smooth' });
                                        matchingElements[0].classList.add('blink-highlight');
                                        setTimeout(() => matchingElements[0].click(), 500);
                                    }
                                }, 500);
                            } catch (e) {
                                console.error('Erreur lors de la tentative directe:', e);
                            }
                        }
                    }
                } else {
                    console.log('Aucun élément correspondant trouvé');
                }
            });
            
            resultsList.appendChild(li);
        });
        
        // Afficher les résultats
        resultsContainer.classList.remove('d-none');
    }
    
    /**
     * Met en évidence les éléments DOM correspondants
     */
    function highlightDOMElements(elements) {
        // Réinitialiser tous les éléments d'événement
        document.querySelectorAll('.fc-event').forEach(el => {
            el.style.boxShadow = '';
            el.style.zIndex = '';
            el.classList.remove('event-highlighted');
        });
        
        // Mettre en évidence les éléments correspondants
        elements.forEach(el => {
            el.style.boxShadow = '0 0 0 2px #007bff';
            el.style.zIndex = '10';
            el.classList.add('event-highlighted');
        });
    }
    
    /**
     * Effectue la recherche dans les événements du calendrier
     */
    function performSearch(query) {
        console.log('Recherche en cours pour:', query);
        if (!query || query.length < 2) {
            resultsContainer.classList.add('d-none');
            highlightEvents([]);
            return;
        }
        
        // Normaliser la requête (minuscules, sans accents)
        const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        console.log('Requête normalisée:', normalizedQuery);
        
        // Récupérer le calendrier
        const calendar = getCalendarInstance();
        if (!calendar) {
            console.error('Instance du calendrier non trouvée');
            searchDirectlyInDOM();
            return;
        }
        
        // Récupérer tous les événements
        const allEvents = calendar.getEvents();
        console.log('Nombre d\'\u00e9vénements trouvés:', allEvents.length);
        
        // Si aucun événement n'est retourné par l'API, chercher directement dans le DOM
        if (!allEvents || allEvents.length === 0) {
            console.log('Aucun événement trouvé via l\'API, recherche dans le DOM...');
            searchDirectlyInDOM();
            return;
        }
        
        // Filtrer les événements correspondant à la recherche
        const matchingEvents = allEvents.filter(event => {
            // Log pour debug
            console.log('Analyse de l\'\u00e9vénement:', event.title, event);
            
            // Extraire les valeurs et les normaliser
            const title = (event.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            let client = '';
            let description = '';
            let tags = '';
            
            // Vérifier les propriétés étendues
            if (event.extendedProps) {
                client = (event.extendedProps.client || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                description = (event.extendedProps.observations || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                tags = (event.extendedProps.tags || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }
            
            // Vérifier si l'un des champs contient la requête
            const matches = title.includes(normalizedQuery) || 
                          client.includes(normalizedQuery) ||
                          description.includes(normalizedQuery) ||
                          tags.includes(normalizedQuery);
            
            // Log pour débug
            if (matches) {
                console.log('Correspondance trouvée pour:', event.title);
            }
            
            return matches;
        });
        
        // Mettre à jour le compteur de résultats
        resultsCount.textContent = matchingEvents.length;
        
        // Vider la liste des résultats
        resultsList.innerHTML = '';
        
        // Ajouter les résultats à la liste
        if (matchingEvents.length > 0) {
            matchingEvents.forEach(event => {
                const li = document.createElement('li');
                li.className = 'list-group-item search-result-item';
                
                // Déterminer la couleur de la bordure en fonction du type d'événement
                let eventColor = event.backgroundColor || '#6c757d';
                let eventType = event.extendedProps && event.extendedProps.type ? event.extendedProps.type : 'prestation';
                let eventIcon = eventType === 'stockage' ? 'fas fa-warehouse' : 'fas fa-truck-moving';
                
                // Formater la date
                let eventDate = '';
                if (event.start) {
                    const date = new Date(event.start);
                    eventDate = date.toLocaleDateString('fr-FR');
                }
                
                // Créer le contenu HTML
                li.innerHTML = `
                    <div class="d-flex align-items-center" style="border-left: 4px solid ${eventColor}; padding-left: 10px;">
                        <div class="me-3">
                            <i class="${eventIcon} text-secondary"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0">${event.title}</h6>
                            <small class="text-muted">${eventDate}</small>
                        </div>
                    </div>
                `;
                
                // Ajouter l'événement de clic pour aller à l'événement
                li.addEventListener('click', function() {
                    // Aller à la date de l'événement
                    if (event.start) {
                        calendar.gotoDate(event.start);
                    }
                    
                    // Mettre en évidence cet événement spécifique
                    highlightEvents([event]);
                    
                    // Afficher les détails de l'événement si possible
                    if (typeof showEventDetails === 'function') {
                        showEventDetails(event);
                    }
                });
                
                resultsList.appendChild(li);
            });
            
            // Afficher les résultats et mettre en évidence les événements
            resultsContainer.classList.remove('d-none');
            highlightEvents(matchingEvents);
        } else {
            // Aucun résultat, afficher un message
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'Aucun résultat trouvé';
            resultsList.appendChild(li);
            
            resultsContainer.classList.remove('d-none');
            highlightEvents([]);
        }
    }
    
    /**
     * Met en évidence les événements correspondants
     */
    function highlightEvents(events) {
        // Si mode liste ou mode calendrier simplifié, utiliser l'approche DOM
        if (document.querySelector('.fc-list-table') || document.querySelectorAll('.fc-event').length > 0) {
            highlightDOMElements(Array.from(document.querySelectorAll('.fc-event')).filter(el => {
                // Chercher si l'élément correspond à un événement dans la liste des résultats
                for (const event of events) {
                    if (event._element === el) return true;
                    if (el.getAttribute('data-event-id') === event.id) return true;
                    if (el.textContent.includes(event.title)) return true;
                }
                return false;
            }));
            return;
        }
        
        // Récupérer le calendrier
        const calendar = getCalendarInstance();
        if (!calendar) return;
        
        try {
            // Récupérer tous les événements
            const allEvents = calendar.getEvents();
            
            // Réinitialiser tous les événements
            allEvents.forEach(event => {
                try {
                    // Vérifier si l'événement a des propriétés valides
                    if (!event || typeof event.setProp !== 'function') return;
                    
                    // Stocker la couleur originale
                    if (event.backgroundColor && (!event.extendedProps || !event.extendedProps.originalColor)) {
                        try {
                            // S'assurer que extendedProps existe
                            if (!event.extendedProps) {
                                event.extendedProps = {};
                            }
                            // Stocker la couleur originale
                            event.extendedProps.originalColor = event.backgroundColor;
                        } catch (e) {
                            console.log('Erreur lors du stockage de la couleur:', e);
                        }
                    }
                    
                    // Restaurer la couleur d'origine si disponible
                    if (event.extendedProps && event.extendedProps.originalColor) {
                        event.setProp('backgroundColor', event.extendedProps.originalColor);
                        event.setProp('borderColor', event.extendedProps.originalColor);
                    }
                } catch (e) {
                    console.log('Erreur lors de la réinitialisation d\'un événement:', e);
                }
            });
            
            // Si aucun événement à mettre en évidence, sortir
            if (!events || events.length === 0) return;
            
            // Mettre en évidence les événements correspondants
            events.forEach(event => {
                try {
                    // Vérifier si l'événement a des propriétés valides
                    if (!event || typeof event.setProp !== 'function') return;
                    
                    // Appliquer une couleur plus vive
                    const highlightColor = '#007bff'; // Bleu vif
                    event.setProp('backgroundColor', highlightColor);
                    event.setProp('borderColor', highlightColor);
                    
                    // Faire défiler jusqu'à l'événement en cas de clic
                    if (event.start && calendar.gotoDate) {
                        calendar.gotoDate(event.start);
                    }
                } catch (e) {
                    console.log('Erreur lors de la mise en évidence d\'un événement:', e);
                }
            });
        } catch (e) {
            console.error('Erreur dans highlightEvents:', e);
            // Utiliser l'approche DOM en cas d'échec
            highlightDOMElements(Array.from(document.querySelectorAll('.fc-event')).filter(el => {
                return events.some(event => el.textContent.includes(event.title));
            }));
        }
    }
}

/**
 * Récupère l'instance du calendrier FullCalendar
 */
function getCalendarInstance() {
    console.log('Tentative de récupération de l\'instance du calendrier');
    
    // Solution 1: Via l'élément calendar
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('Aucun élément avec ID "calendar" trouvé');
        return null;
    }
    
    // Solution 2: Via la propriété _calendar (ancienne méthode)
    if (calendarEl._calendar) {
        console.log('Instance trouvée via calendarEl._calendar');
        return calendarEl._calendar;
    }
    
    // Solution 3: Via la variable globale (si disponible)
    if (window.calendar) {
        console.log('Instance trouvée via window.calendar');
        return window.calendar;
    }
    
    // Solution 4: Via l'attribut de données (plus récent)
    const fcCalendar = calendarEl.querySelector('.fc');
    if (fcCalendar && fcCalendar._fullCalendar) {
        console.log('Instance trouvée via fcCalendar._fullCalendar');
        return fcCalendar._fullCalendar;
    }
    
    // Solution 5: Créer une solution de contournement
    console.log('Création d\'une solution de contournement pour le calendrier');
    
    // Récupération des événements directement depuis les éléments DOM
    const mockCalendar = {
        getEvents: function() {
            // Collecter tous les événements visibles dans le DOM
            const events = [];
            const eventElements = document.querySelectorAll('.fc-event');
            
            eventElements.forEach(function(el) {
                // Extraire les données de l'événement depuis le DOM
                const eventId = el.getAttribute('data-event-id') || el.id || Math.random().toString(36).substring(2, 9);
                const title = el.querySelector('.fc-event-title')?.textContent || 
                              el.querySelector('.fc-list-event-title')?.textContent || 
                              el.getAttribute('data-title') || 'Sans titre';
                
                const backgroundColor = el.style.backgroundColor || 
                                        window.getComputedStyle(el).backgroundColor || 
                                        '#3788d8';
                                        
                const borderColor = el.style.borderColor || 
                                   window.getComputedStyle(el).borderColor || 
                                   backgroundColor;
                
                // Observer les attributs data-* pour les propriétés supplémentaires
                const extendedProps = {};
                Array.from(el.attributes)
                    .filter(attr => attr.name.startsWith('data-'))
                    .forEach(attr => {
                        const propName = attr.name.substring(5).replace(/-([a-z])/g, g => g[1].toUpperCase());
                        extendedProps[propName] = attr.value;
                    });
                
                // Créer un objet événement similaire à celui de FullCalendar
                events.push({
                    id: eventId,
                    title: title,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    extendedProps: extendedProps,
                    // Méthodes de l'événement
                    setProp: function(propName, value) {
                        if (propName === 'backgroundColor') {
                            el.style.backgroundColor = value;
                        } else if (propName === 'borderColor') {
                            el.style.borderColor = value;
                        }
                        this[propName] = value;
                    },
                    setExtendedProp: function(propName, value) {
                        if (!this.extendedProps) this.extendedProps = {};
                        this.extendedProps[propName] = value;
                        el.setAttribute(`data-${propName.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
                    }
                });
            });
            
            return events;
        },
        gotoDate: function(date) {
            console.log('Tentative de navigation vers la date:', date);
            // La navigation réelle n'est pas possible sans l'instance complète
        }
    };
    
    return mockCalendar;
}

/**
 * Affiche les détails d'un événement avec le nouveau système simplifié
 */
function showEventDetails(event) {
    // Vérifier si le panneau de détails existe
    const detailsPanel = document.querySelector('.prestation-details');
    if (!detailsPanel) return;
    
    // Ouvrir le panneau de détails
    detailsPanel.classList.add('active');
    
    // Utiliser directement notre nouveau système simplifié
    const container = document.getElementById('prestation-details-container');
    if (!container) return;
    
    // Récupérer les informations de base de l'événement
    const prestationId = event.id;
    const title = event.title || 'Sans titre';
    const start = event.start ? new Date(event.start).toLocaleDateString('fr-FR') : 'Non défini';
    const end = event.end ? new Date(event.end).toLocaleDateString('fr-FR') : 'Non défini';
    const statut = event.extendedProps?.statut || 'Non défini';
    const type = event.extendedProps?.type_demenagement || 'Non défini';
    
    // Extraire le nom du client depuis le titre de l'événement
    const extractedClient = title.split(' - ')[0] || 'Client non spécifié';
    
    // Extraire les adresses de départ et d'arrivée
    let adresseDepart = 'Non renseignée';
    let adresseArrivee = 'Non renseignée';
    
    if (event.extendedProps?.adresse_depart) {
        adresseDepart = event.extendedProps.adresse_depart;
    }
    
    if (event.extendedProps?.adresse_arrivee) {
        adresseArrivee = event.extendedProps.adresse_arrivee;
    }
    
    // Extraire les observations
    const observations = event.extendedProps?.observations || '';
    
    // Couleur du badge selon le statut
    const badgeClass = {
        'En attente': 'bg-warning text-dark',
        'Confirmée': 'bg-info text-white',
        'En cours': 'bg-primary text-white',
        'Terminée': 'bg-success text-white',
        'Annulée': 'bg-danger text-white',
        'Refusée': 'bg-secondary text-white'
    }[statut] || 'bg-secondary text-white';
    
    // Construire le HTML des détails
    const html = `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Prestation #${prestationId}</h5>
                <span class="badge prestation-detail-badge ${badgeClass}">${statut}</span>
            </div>

            <div class="detail-section card mb-3">
                <div class="card-body">
                    <h6 class="card-subtitle mb-3 text-muted d-flex align-items-center">
                        <i class="fas fa-user me-2 text-primary"></i> Client
                    </h6>
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
                    <p class="card-text mb-2"><span class="fw-bold">Départ:</span> ${adresseDepart}</p>
                    <p class="card-text"><span class="fw-bold">Arrivée:</span> ${adresseArrivee}</p>
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
                <button class="btn btn-outline-secondary close-panel-btn">
                    <i class="fas fa-times me-1"></i> Fermer
                </button>
            </div>
        </div>
    `;
    
    // Mettre à jour le contenu du panneau
    container.innerHTML = html;
    
    // Ajouter l'événement de fermeture au bouton
    document.querySelector('.close-panel-btn')?.addEventListener('click', function() {
        document.querySelector('.prestation-details')?.classList.remove('active');
    });
}
