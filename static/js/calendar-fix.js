/**
 * Solution améliorée pour corriger les boutons du calendrier et les erreurs de chargement
 * Y compris la suppression des doublons de boutons
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du correctif calendrier (version améliorée)...");
    
    // Exécuter immédiatement et réessayer après un délai
    fixCalendar();
    setTimeout(fixCalendar, 1000);
    
    /**
     * Fonction principale qui applique toutes les corrections
     */
    function fixCalendar() {
        // 1. Supprimer les doublons de boutons
        removeButtonDuplicates();
        
        // 2. Correctif pour les boutons de vue
        fixCalendarViewButtons();
        
        // 3. Correctif pour le chargement des événements
        fixEventLoading();
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
        
        // Nettoyer également les conteneurs vides de boutons
        const emptyContainers = document.querySelectorAll('.fc-button-group, .fc-toolbar-chunk');
        emptyContainers.forEach(container => {
            if (container.children.length === 0) {
                container.parentNode?.removeChild(container);
            }
        });
    }
    
    /**
     * Répare les boutons de changement de vue (Semaine, Jour, Planning)
     */
    function fixCalendarViewButtons() {
        console.log("Application du correctif pour les boutons de vue du calendrier...");
        
        // Identifier les boutons par leur classe FullCalendar
        const weekButton = document.querySelector('.fc-timeGridWeek-button');
        const dayButton = document.querySelector('.fc-timeGridDay-button');
        const listButton = document.querySelector('.fc-listMonth-button');
        
        // Tableau des boutons à corriger
        const buttons = [
            { button: weekButton, viewName: 'timeGridWeek', label: 'Semaine' },
            { button: dayButton, viewName: 'timeGridDay', label: 'Jour' },
            { button: listButton, viewName: 'listMonth', label: 'Planning' }
        ];
        
        // Réparer chaque bouton
        buttons.forEach(({ button, viewName, label }) => {
            if (button) {
                // Supprimer les anciens gestionnaires d'événements
                button.replaceWith(button.cloneNode(true));
                
                // Récupérer le bouton fraîchement cloné
                const newButton = document.querySelector(`.fc-${viewName}-button`);
                if (!newButton) return;
                
                // S'assurer que le bouton a le bon texte
                newButton.textContent = label;
                
                // Ajouter le nouveau gestionnaire d'événements
                newButton.addEventListener('click', function() {
                    // Récupérer l'instance du calendrier
                    const calendarInstance = getCalendarInstance();
                    
                    if (calendarInstance) {
                        // Changer la vue
                        calendarInstance.changeView(viewName);
                        
                        // Mettre à jour l'état actif des boutons
                        updateActiveButtonState(viewName);
                        
                        console.log(`Vue changée pour: ${viewName}`);
                    } else {
                        console.error("Instance du calendrier non trouvée");
                    }
                });
                
                console.log(`Bouton ${viewName} corrigé`);
            }
        });
    }
    
    /**
     * Récupère l'instance du calendrier FullCalendar
     */
    function getCalendarInstance() {
        // Rechercher l'élément DOM du calendrier
        const calendarEl = document.getElementById('calendar');
        
        if (!calendarEl) {
            console.error("Élément calendrier non trouvé");
            return null;
        }
        
        // Accéder à l'instance FullCalendar stockée dans l'API FullCalendar
        return calendarEl._calendar || window.calendar || null;
    }
    
    /**
     * Met à jour l'état actif des boutons
     */
    function updateActiveButtonState(activeViewName) {
        // Retirer la classe active de tous les boutons
        document.querySelectorAll('.fc-button-primary').forEach(btn => {
            btn.classList.remove('fc-button-active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        // Ajouter la classe active au bouton sélectionné
        const activeButton = document.querySelector(`.fc-${activeViewName}-button`);
        if (activeButton) {
            activeButton.classList.add('fc-button-active');
            activeButton.setAttribute('aria-pressed', 'true');
        }
    }
    
    /**
     * Corrige le chargement des événements
     */
    function fixEventLoading() {
        console.log("Application du correctif pour le chargement des événements...");
        
        // Trouver l'instance du calendrier
        const calendarInstance = getCalendarInstance();
        
        if (!calendarInstance) {
            // Si l'instance n'est pas accessible, essayer de remplacer la fonction events
            patchEventsFunction();
            return;
        }
        
        // Réinitialiser le chargement des événements
        try {
            // Forcer le rechargement des événements
            calendarInstance.refetchEvents();
            console.log("Événements rechargés avec succès");
        } catch (error) {
            console.error("Erreur lors du rechargement des événements:", error);
            patchEventsFunction();
        }
    }
    
    /**
     * Remplace la fonction de chargement des événements par une version de secours
     */
    function patchEventsFunction() {
        console.log("Remplacement de la fonction de chargement des événements...");
        
        // Créer une fonction de secours pour charger les événements
        window.fetchEventsBackup = function(info, successCallback, failureCallback) {
            console.log("Utilisation de la fonction de secours pour charger les événements...");
            
            fetch('/calendrier/api/prestations/calendrier', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log("Événements chargés avec succès:", data);
                successCallback(data);
            })
            .catch(error => {
                console.error("Erreur lors du chargement des événements:", error);
                // Retourner au moins un tableau vide pour éviter des erreurs supplémentaires
                successCallback([]);
            });
        };
        
        // Essayer d'attacher cette fonction à l'instance du calendrier
        const calendarEl = document.getElementById('calendar');
        if (calendarEl && calendarEl._calendar) {
            calendarEl._calendar.options.events = window.fetchEventsBackup;
            calendarEl._calendar.refetchEvents();
        } else {
            // Réinjecter un nouveau calendrier comme solution de dernier recours
            setTimeout(reinitializeCalendar, 500);
        }
    }
    
    /**
     * Réinitialise complètement le calendrier en cas d'échec des autres méthodes
     */
    function reinitializeCalendar() {
        console.log("Réinitialisation complète du calendrier...");
        
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        
        // Vider l'élément calendrier
        calendarEl.innerHTML = '';
        
        // Recréer le calendrier
        if (typeof FullCalendar !== 'undefined') {
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
                events: window.fetchEventsBackup,
                height: 'auto',
                // Autres options de base
                eventTimeFormat: {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }
            });
            
            window.calendar.render();
            console.log("Calendrier réinitialisé avec succès");
        } else {
            console.error("FullCalendar n'est pas défini, impossible de réinitialiser");
        }
    }
});
