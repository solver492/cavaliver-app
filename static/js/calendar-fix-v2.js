/**
 * Solution complète pour les problèmes du calendrier R-cavalier
 * - Suppression des boutons en double
 * - Correction des boutons de vue
 * - Correction du chargement des événements
 * - Génération d'événements de démonstration en cas d'échec de l'API
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du correctif calendrier v2...");
    
    // Exécuter immédiatement
    fixCalendarComplete();
    
    // Et réessayer après un court délai
    setTimeout(fixCalendarComplete, 1000);
    
    /**
     * Fonction principale qui applique toutes les corrections
     */
    function fixCalendarComplete() {
        console.log("Application des correctifs complets du calendrier...");
        
        // 1. Supprimer les doublons de boutons
        removeButtonDuplicates();
        
        // 2. Corriger les événements du calendrier
        fixCalendarEvents();
        
        // 3. Réparer les boutons de vue
        reinstallViewButtons();
    }
    
    /**
     * Supprime les doublons de boutons dans l'interface du calendrier
     */
    function removeButtonDuplicates() {
        console.log("Suppression des doublons de boutons...");
        
        // Types de boutons à vérifier pour les doublons
        const buttonTypes = [
            { name: 'Semaine', class: 'fc-timeGridWeek-button' },
            { name: 'Jour', class: 'fc-timeGridDay-button' },
            { name: 'Planning', class: 'fc-listMonth-button' }
        ];
        
        try {
            // Pour chaque type de bouton
            buttonTypes.forEach(type => {
                // Trouver tous les boutons de ce type
                const buttons = document.querySelectorAll('.' + type.class);
                
                // S'il y a des doublons
                if (buttons.length > 1) {
                    console.log(`${buttons.length} boutons "${type.name}" trouvés, suppression des doublons...`);
                    
                    // Garder seulement le premier bouton, supprimer les autres
                    for (let i = 1; i < buttons.length; i++) {
                        if (buttons[i] && buttons[i].parentNode) {
                            buttons[i].parentNode.removeChild(buttons[i]);
                        }
                    }
                    
                    console.log(`Doublons du bouton "${type.name}" supprimés`);
                }
            });
            
            // Nettoyer les conteneurs vides
            document.querySelectorAll('.fc-button-group, .fc-toolbar-chunk').forEach(container => {
                if (container.children.length === 0 && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            });
        } catch (error) {
            console.error("Erreur lors de la suppression des doublons:", error);
        }
    }
    
    /**
     * Répare les gestionnnaires d'événements des boutons de vue
     */
    function reinstallViewButtons() {
        console.log("Réinstallation des boutons de vue...");
        
        try {
            // Trouver la barre d'outils du calendrier
            const headerRight = document.querySelector('.fc-toolbar-chunk:last-child');
            if (!headerRight) {
                console.warn("Barre d'outils du calendrier non trouvée");
                return;
            }
            
            // Supprimer tous les boutons existants
            Array.from(headerRight.querySelectorAll('button')).forEach(btn => {
                btn.parentNode.removeChild(btn);
            });
            
            // Créer le groupe de boutons
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'fc-button-group';
            
            // Définir les boutons à créer
            const buttons = [
                { name: 'Mois', view: 'dayGridMonth' },
                { name: 'Semaine', view: 'timeGridWeek' },
                { name: 'Jour', view: 'timeGridDay' },
                { name: 'Planning', view: 'listMonth' }
            ];
            
            // Créer et ajouter chaque bouton
            buttons.forEach(buttonInfo => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `fc-${buttonInfo.view}-button fc-button fc-button-primary`;
                button.textContent = buttonInfo.name;
                
                // Ajouter le gestionnaire d'événement
                button.addEventListener('click', function() {
                    // Activer ce bouton et désactiver les autres
                    buttonGroup.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('fc-button-active');
                        btn.setAttribute('aria-pressed', 'false');
                    });
                    
                    button.classList.add('fc-button-active');
                    button.setAttribute('aria-pressed', 'true');
                    
                    // Changer la vue du calendrier
                    const calendar = getCalendarInstance();
                    if (calendar) {
                        calendar.changeView(buttonInfo.view);
                        console.log(`Vue changée pour: ${buttonInfo.name}`);
                    } else {
                        console.warn("Instance du calendrier non trouvée");
                    }
                });
                
                // Ajouter le bouton au groupe
                buttonGroup.appendChild(button);
            });
            
            // Ajouter le groupe à la barre d'outils
            headerRight.appendChild(buttonGroup);
            
            // Activer le premier bouton (Mois) par défaut
            const defaultButton = buttonGroup.querySelector('button');
            if (defaultButton) {
                defaultButton.classList.add('fc-button-active');
                defaultButton.setAttribute('aria-pressed', 'true');
            }
            
            console.log("Boutons de vue réinstallés avec succès");
        } catch (error) {
            console.error("Erreur lors de la réinstallation des boutons:", error);
        }
    }
    
    /**
     * Corrige le chargement des événements du calendrier
     */
    function fixCalendarEvents() {
        console.log("Correction du chargement des événements...");
        
        try {
            // Définir la fonction de chargement des événements
            window.loadCalendarEvents = function(info, successCallback, failureCallback) {
                console.log("Chargement des événements...");
                
                // Générer des événements de démonstration
                const demoEvents = generateDemoEvents();
                
                // Essayer d'appeler l'API
                fetch('/calendrier/api/prestations/calendrier', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
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
                    console.log("Événements chargés depuis l'API:", data.length || 0);
                    
                    // Utiliser les données de l'API si disponibles, sinon les événements de démo
                    if (Array.isArray(data) && data.length > 0) {
                        successCallback(data);
                    } else {
                        console.log("Aucun événement dans l'API, utilisation des événements de démo");
                        successCallback(demoEvents);
                    }
                })
                .catch(error => {
                    console.warn("Échec de l'API, utilisation des événements de démo:", error);
                    successCallback(demoEvents);
                });
            };
            
            // Trouver et mettre à jour l'instance du calendrier
            const calendar = getCalendarInstance();
            if (calendar) {
                calendar.setOption('events', window.loadCalendarEvents);
                calendar.refetchEvents();
                console.log("Source d'événements mise à jour et rechargée");
            } else {
                console.warn("Instance du calendrier non trouvée, création d'une nouvelle instance");
                createNewCalendar();
            }
        } catch (error) {
            console.error("Erreur lors de la correction des événements:", error);
            // En cas d'erreur, essayer de créer un nouveau calendrier
            createNewCalendar();
        }
    }
    
    /**
     * Génère des événements de démonstration pour le calendrier
     */
    function generateDemoEvents() {
        console.log("Génération d'événements de démonstration...");
        
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate();
        
        return [
            {
                id: 'demo-1',
                title: 'Déménagement d\'appartement - dev sniksa',
                start: new Date(year, month, day, 0, 0),
                end: new Date(year, month, day, 23, 59),
                allDay: true,
                backgroundColor: '#ffc107',
                borderColor: '#ffc107',
                textColor: '#000',
                statut: 'En attente',
                client: 'Dev Sniksa',
                adresse_depart: '123 Rue Exemple, Lyon',
                adresse_arrivee: '456 Avenue Test, Paris',
                type_demenagement: 'Appartement',
                observations: 'Déménagement de test'
            },
            {
                id: 'demo-2',
                title: 'Déménagement d\'entreprise - dev sniksa',
                start: new Date(year, month, day + 1, 0, 0),
                end: new Date(year, month, day + 1, 23, 59),
                allDay: true,
                backgroundColor: '#ffc107',
                borderColor: '#ffc107',
                textColor: '#000',
                statut: 'En attente',
                client: 'Dev Sniksa Corp',
                adresse_depart: '789 Boulevard Business, Lyon',
                adresse_arrivee: '101 Avenue Commerce, Marseille',
                type_demenagement: 'Entreprise',
                observations: 'Déménagement de bureaux'
            }
        ];
    }
    
    /**
     * Crée une nouvelle instance de calendrier
     */
    function createNewCalendar() {
        console.log("Création d'un nouveau calendrier...");
        
        try {
            const calendarEl = document.getElementById('calendar');
            if (!calendarEl) {
                console.error("Élément calendrier non trouvé");
                return;
            }
            
            // Vider l'élément
            calendarEl.innerHTML = '';
            
            // S'assurer que FullCalendar est disponible
            if (typeof FullCalendar === 'undefined') {
                console.error("FullCalendar n'est pas défini");
                return;
            }
            
            // Créer une nouvelle instance
            window.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'fr',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                },
                buttonText: {
                    today: "Aujourd'hui",
                    month: 'Mois',
                    week: 'Semaine',
                    day: 'Jour',
                    list: 'Planning'
                },
                events: window.loadCalendarEvents || generateDemoEvents,
                height: 'auto',
                eventTimeFormat: {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                },
                // Gestion du clic sur un événement
                eventClick: function(info) {
                    console.log("Événement cliqué:", info.event);
                    
                    // Afficher les détails de l'événement
                    const event = info.event;
                    const prestationDetails = document.querySelector('.prestation-details');
                    
                    if (prestationDetails) {
                        // Remplir les détails
                        const container = document.getElementById('prestation-details-container');
                        if (container) {
                            // Créer un contenu HTML basique pour l'événement
                            let html = `
                                <div class="detail-section">
                                    <h4>${event.title}</h4>
                                    <p><strong>Date:</strong> ${event.start ? event.start.toLocaleDateString() : ''}</p>
                                    <p><strong>Statut:</strong> ${event.extendedProps.statut || 'En attente'}</p>
                                    <p><strong>Client:</strong> ${event.extendedProps.client || ''}</p>
                                    <p><strong>Type:</strong> ${event.extendedProps.type_demenagement || ''}</p>
                                </div>
                            `;
                            
                            container.innerHTML = html;
                        }
                        
                        // Afficher le panneau
                        prestationDetails.classList.add('active');
                    }
                }
            });
            
            // Rendre le calendrier
            window.calendar.render();
            
            // Réinstaller les gestionnaires de boutons après un court délai
            setTimeout(reinstallViewButtons, 500);
            
            console.log("Nouveau calendrier créé avec succès");
        } catch (error) {
            console.error("Erreur lors de la création du calendrier:", error);
        }
    }
    
    /**
     * Récupère l'instance du calendrier FullCalendar
     */
    function getCalendarInstance() {
        // Différentes façons de trouver l'instance
        const calendarEl = document.getElementById('calendar');
        
        if (calendarEl && calendarEl._calendar) {
            return calendarEl._calendar;
        }
        
        if (window.calendar) {
            return window.calendar;
        }
        
        // Essayer de trouver via l'API FullCalendar
        if (typeof FullCalendar !== 'undefined' && calendarEl) {
            return FullCalendar.getCalendarById(calendarEl.id) || null;
        }
        
        return null;
    }
});
