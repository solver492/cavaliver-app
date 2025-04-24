/**
 * Script de compatibilité pour le calendrier
 * Spécifiquement conçu pour résoudre les problèmes de création d'événements dans Firefox
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Calendar Compatibility] Initialisation du correcteur de compatibilité pour le calendrier');
    
    // Fonction pour intercepter et corriger les requêtes AJAX liées au calendrier
    function setupAjaxInterceptor() {
        // Sauvegarder la méthode originale
        const originalFetch = window.fetch;
        
        // Remplacer fetch par notre version
        window.fetch = function(url, options) {
            // Vérifier si c'est une requête liée au calendrier
            if (typeof url === 'string' && (
                url.includes('/calendrier/') || 
                url.includes('/agendas/') ||
                url.includes('/evenements/')
            )) {
                console.log('[Calendar Compatibility] Interception d\'une requête fetch pour le calendrier:', url);
                
                // Si c'est une requête POST (création d'événement)
                if (options && options.method === 'POST') {
                    // Cloner les options pour ne pas modifier l'original
                    const newOptions = Object.assign({}, options);
                    
                    // Si le corps est un FormData
                    if (options.body instanceof FormData) {
                        const originalFormData = options.body;
                        const newFormData = new FormData();
                        
                        // Parcourir tous les champs du FormData
                        for (const pair of originalFormData.entries()) {
                            const [name, value] = pair;
                            
                            // Si c'est un champ de date, essayer de le normaliser
                            if (name.includes('date') || name.includes('debut') || name.includes('fin')) {
                                try {
                                    // Essayer de normaliser la date
                                    if (typeof value === 'string' && value.trim() !== '') {
                                        // Vérifier si c'est une date au format DD/MM/YYYY
                                        if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
                                            const parts = value.split('/');
                                            const normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                            
                                            // Si la date contient aussi une heure
                                            if (value.includes(':')) {
                                                const timePart = value.split(' ')[1];
                                                newFormData.append(name, `${normalizedDate}T${timePart}`);
                                            } else {
                                                newFormData.append(name, normalizedDate);
                                            }
                                            continue;
                                        }
                                        
                                        // Si c'est déjà au format ISO mais incomplet
                                        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                                            newFormData.append(name, `${value}T00:00:00`);
                                            continue;
                                        }
                                    }
                                } catch (e) {
                                    console.warn('[Calendar Compatibility] Erreur lors de la normalisation de la date:', e);
                                }
                            }
                            
                            // Ajouter le champ tel quel s'il n'a pas été modifié
                            newFormData.append(name, value);
                        }
                        
                        newOptions.body = newFormData;
                    }
                    
                    // Si le corps est une chaîne JSON
                    else if (typeof options.body === 'string' && options.headers && 
                             options.headers['Content-Type'] === 'application/json') {
                        try {
                            const jsonData = JSON.parse(options.body);
                            
                            // Parcourir tous les champs JSON
                            for (const key in jsonData) {
                                if (jsonData.hasOwnProperty(key) && 
                                    (key.includes('date') || key.includes('debut') || key.includes('fin'))) {
                                    const value = jsonData[key];
                                    
                                    if (typeof value === 'string' && value.trim() !== '') {
                                        // Vérifier si c'est une date au format DD/MM/YYYY
                                        if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
                                            const parts = value.split('/');
                                            const normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                            
                                            // Si la date contient aussi une heure
                                            if (value.includes(':')) {
                                                const timePart = value.split(' ')[1];
                                                jsonData[key] = `${normalizedDate}T${timePart}`;
                                            } else {
                                                jsonData[key] = normalizedDate;
                                            }
                                        }
                                        
                                        // Si c'est déjà au format ISO mais incomplet
                                        else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                                            jsonData[key] = `${value}T00:00:00`;
                                        }
                                    }
                                }
                            }
                            
                            newOptions.body = JSON.stringify(jsonData);
                        } catch (e) {
                            console.warn('[Calendar Compatibility] Erreur lors du parsing JSON:', e);
                        }
                    }
                    
                    return originalFetch.call(this, url, newOptions);
                }
            }
            
            // Pour les autres requêtes, utiliser la méthode originale
            return originalFetch.apply(this, arguments);
        };
        
        // Intercepter également les requêtes XMLHttpRequest pour la compatibilité
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._calendarCompatUrl = url;
            this._calendarCompatMethod = method;
            return originalXHROpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            // Vérifier si c'est une requête liée au calendrier
            if (typeof this._calendarCompatUrl === 'string' && (
                this._calendarCompatUrl.includes('/calendrier/') || 
                this._calendarCompatUrl.includes('/agendas/') ||
                this._calendarCompatUrl.includes('/evenements/')
            )) {
                console.log('[Calendar Compatibility] Interception d\'une requête XHR pour le calendrier:', this._calendarCompatUrl);
                
                // Si c'est une requête POST (création d'événement)
                if (this._calendarCompatMethod === 'POST' && data) {
                    let modifiedData = data;
                    
                    // Si le corps est un FormData
                    if (data instanceof FormData) {
                        const newFormData = new FormData();
                        
                        // Parcourir tous les champs du FormData
                        for (const pair of data.entries()) {
                            const [name, value] = pair;
                            
                            // Si c'est un champ de date, essayer de le normaliser
                            if (name.includes('date') || name.includes('debut') || name.includes('fin')) {
                                try {
                                    // Essayer de normaliser la date
                                    if (typeof value === 'string' && value.trim() !== '') {
                                        // Vérifier si c'est une date au format DD/MM/YYYY
                                        if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
                                            const parts = value.split('/');
                                            const normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                            
                                            // Si la date contient aussi une heure
                                            if (value.includes(':')) {
                                                const timePart = value.split(' ')[1];
                                                newFormData.append(name, `${normalizedDate}T${timePart}`);
                                                continue;
                                            } else {
                                                newFormData.append(name, normalizedDate);
                                                continue;
                                            }
                                        }
                                        
                                        // Si c'est déjà au format ISO mais incomplet
                                        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                                            newFormData.append(name, `${value}T00:00:00`);
                                            continue;
                                        }
                                    }
                                } catch (e) {
                                    console.warn('[Calendar Compatibility] Erreur lors de la normalisation de la date:', e);
                                }
                            }
                            
                            // Ajouter le champ tel quel s'il n'a pas été modifié
                            newFormData.append(name, value);
                        }
                        
                        modifiedData = newFormData;
                    }
                    
                    return originalXHRSend.call(this, modifiedData);
                }
            }
            
            // Pour les autres requêtes, utiliser la méthode originale
            return originalXHRSend.apply(this, arguments);
        };
    }
    
    // Fonction pour corriger les problèmes spécifiques de FullCalendar avec Firefox
    function fixFullCalendarForFirefox() {
        // Vérifier si FullCalendar est présent
        if (typeof window.FullCalendar !== 'undefined') {
            console.log('[Calendar Compatibility] FullCalendar détecté, application des correctifs pour Firefox');
            
            // Intercepter la création d'événements
            document.addEventListener('click', function(e) {
                // Trouver les boutons de création d'événement
                if (e.target.matches('button, .fc-button, [data-action="create"], .create-event, .btn-create')) {
                    const buttonText = e.target.textContent.toLowerCase();
                    if (buttonText.includes('créer') || buttonText.includes('creer') || 
                        buttonText.includes('nouvel') || buttonText.includes('nouveau') ||
                        buttonText.includes('ajouter') || buttonText.includes('add')) {
                        
                        console.log('[Calendar Compatibility] Clic sur un bouton de création d\'événement détecté');
                        
                        // Attendre que le formulaire soit affiché
                        setTimeout(function() {
                            // Trouver tous les champs de date dans le formulaire
                            const dateInputs = document.querySelectorAll('input[type="date"], input[type="datetime-local"]');
                            
                            dateInputs.forEach(function(input) {
                                // Ajouter un gestionnaire d'événements pour corriger la valeur avant soumission
                                input.addEventListener('change', function() {
                                    if (this.value) {
                                        console.log('[Calendar Compatibility] Champ de date modifié:', this.name, this.value);
                                        
                                        // Stocker la valeur originale dans un attribut data
                                        this.setAttribute('data-original-value', this.value);
                                        
                                        // Essayer de normaliser la date pour Firefox
                                        try {
                                            // Si c'est au format DD/MM/YYYY
                                            if (/^\d{2}\/\d{2}\/\d{4}/.test(this.value)) {
                                                const parts = this.value.split('/');
                                                let normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                                
                                                // Si la date contient aussi une heure
                                                if (this.value.includes(':')) {
                                                    const timePart = this.value.split(' ')[1];
                                                    normalizedDate = `${normalizedDate}T${timePart}`;
                                                }
                                                
                                                console.log('[Calendar Compatibility] Date normalisée:', normalizedDate);
                                                this.value = normalizedDate;
                                            }
                                        } catch (e) {
                                            console.warn('[Calendar Compatibility] Erreur lors de la normalisation de la date:', e);
                                        }
                                    }
                                });
                            });
                            
                            // Intercepter la soumission du formulaire
                            const form = document.querySelector('form');
                            if (form) {
                                form.addEventListener('submit', function(e) {
                                    console.log('[Calendar Compatibility] Soumission du formulaire interceptée');
                                    
                                    // Vérifier tous les champs de date
                                    const dateInputs = this.querySelectorAll('input[type="date"], input[type="datetime-local"]');
                                    let hasInvalidDate = false;
                                    
                                    dateInputs.forEach(function(input) {
                                        if (input.value) {
                                            try {
                                                // Vérifier si la date est valide
                                                const date = new Date(input.value);
                                                if (isNaN(date.getTime())) {
                                                    hasInvalidDate = true;
                                                    console.warn('[Calendar Compatibility] Date invalide détectée:', input.name, input.value);
                                                    
                                                    // Essayer de corriger le format
                                                    if (/^\d{2}\/\d{2}\/\d{4}/.test(input.value)) {
                                                        const parts = input.value.split('/');
                                                        let normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                                        
                                                        // Si la date contient aussi une heure
                                                        if (input.value.includes(':')) {
                                                            const timePart = input.value.split(' ')[1];
                                                            normalizedDate = `${normalizedDate}T${timePart}`;
                                                        }
                                                        
                                                        input.value = normalizedDate;
                                                        
                                                        // Vérifier si la correction a fonctionné
                                                        const correctedDate = new Date(input.value);
                                                        if (!isNaN(correctedDate.getTime())) {
                                                            hasInvalidDate = false;
                                                            console.log('[Calendar Compatibility] Date corrigée avec succès:', normalizedDate);
                                                        }
                                                    }
                                                }
                                            } catch (e) {
                                                console.warn('[Calendar Compatibility] Erreur lors de la vérification de la date:', e);
                                            }
                                        }
                                    });
                                    
                                    // Si une date invalide persiste, empêcher la soumission du formulaire
                                    if (hasInvalidDate) {
                                        console.warn('[Calendar Compatibility] Formulaire non soumis en raison de dates invalides');
                                        e.preventDefault();
                                        alert('Veuillez vérifier le format des dates. Utilisez le format AAAA-MM-JJ pour les dates.');
                                    }
                                });
                            }
                        }, 500);
                    }
                }
            });
        }
    }
    
    // Initialiser les correctifs
    setupAjaxInterceptor();
    fixFullCalendarForFirefox();
    
    console.log('[Calendar Compatibility] Correctifs de compatibilité pour le calendrier initialisés avec succès');
});
