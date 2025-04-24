/**
 * Script de correction des problèmes de format de date entre navigateurs
 * Spécifiquement conçu pour résoudre les problèmes de compatibilité avec Firefox
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Date Format Fix] Initialisation du correcteur de format de date pour Firefox');
    
    // Fonction pour normaliser les formats de date ISO
    function normalizeISODateString(dateString) {
        if (!dateString) return dateString;
        
        try {
            // Si la date est déjà un objet Date, la convertir en chaîne ISO
            if (dateString instanceof Date) {
                return dateString.toISOString();
            }
            
            // Vérifier si la chaîne est au format ISO partiel (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString + 'T00:00:00Z';
            }
            
            // Vérifier si la chaîne est au format français (DD/MM/YYYY)
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                const parts = dateString.split('/');
                return `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`;
            }
            
            // Essayer de parser avec Luxon si disponible
            if (window.luxon && window.luxon.DateTime) {
                const dt = window.luxon.DateTime.fromISO(dateString);
                if (dt.isValid) {
                    return dt.toISO();
                }
            }
            
            // Essayer de parser avec date-fns si disponible
            if (window.dateFns && window.dateFns.parseISO) {
                const parsed = window.dateFns.parseISO(dateString);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                }
            }
            
            // Fallback: essayer de créer une date JavaScript standard
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
            
            return dateString;
        } catch (e) {
            console.warn('[Date Format Fix] Erreur lors de la normalisation de la date:', e);
            return dateString;
        }
    }
    
    // Intercepter les soumissions de formulaire pour corriger les formats de date
    document.addEventListener('submit', function(e) {
        // Vérifier si c'est un formulaire d'événement de calendrier
        if (e.target.action && (
            e.target.action.includes('/calendrier/') || 
            e.target.action.includes('/agendas/') ||
            e.target.action.includes('/evenements/')
        )) {
            console.log('[Date Format Fix] Interception d\'un formulaire de calendrier');
            
            // Trouver tous les champs de date dans le formulaire
            const dateInputs = e.target.querySelectorAll('input[type="date"], input[type="datetime-local"]');
            dateInputs.forEach(function(input) {
                if (input.value) {
                    console.log('[Date Format Fix] Normalisation du champ de date:', input.name);
                    const normalizedValue = normalizeISODateString(input.value);
                    
                    // Créer un champ caché avec la valeur normalisée
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = input.name + '_normalized';
                    hiddenInput.value = normalizedValue;
                    e.target.appendChild(hiddenInput);
                    
                    // Conserver la valeur originale pour l'affichage
                    input.setAttribute('data-original-value', input.value);
                }
            });
        }
    });
    
    // Patch pour la méthode Date.prototype.toISOString pour Firefox
    const originalToISOString = Date.prototype.toISOString;
    Date.prototype.toISOString = function() {
        try {
            return originalToISOString.call(this);
        } catch (e) {
            // Fallback pour Firefox
            const pad = function(num) {
                return (num < 10 ? '0' : '') + num;
            };
            
            return this.getUTCFullYear() + '-' +
                   pad(this.getUTCMonth() + 1) + '-' +
                   pad(this.getUTCDate()) + 'T' +
                   pad(this.getUTCHours()) + ':' +
                   pad(this.getUTCMinutes()) + ':' +
                   pad(this.getUTCSeconds()) + 'Z';
        }
    };
    
    // Patch pour la méthode Date.parse pour Firefox
    const originalDateParse = Date.parse;
    Date.parse = function(dateString) {
        try {
            const result = originalDateParse(dateString);
            if (isNaN(result)) {
                // Essayer de normaliser la chaîne
                const normalized = normalizeISODateString(dateString);
                return originalDateParse(normalized);
            }
            return result;
        } catch (e) {
            console.warn('[Date Format Fix] Erreur lors du parsing de la date:', e);
            return NaN;
        }
    };
    
    // Patch pour les entrées de date dans les formulaires
    const dateInputs = document.querySelectorAll('input[type="date"], input[type="datetime-local"]');
    dateInputs.forEach(function(input) {
        // Sauvegarder la méthode originale
        const originalValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        
        // Remplacer par notre version qui normalise les dates
        Object.defineProperty(input, 'value', {
            set: function(val) {
                try {
                    if (val && (this.type === 'date' || this.type === 'datetime-local')) {
                        const normalized = normalizeISODateString(val);
                        originalValueSetter.call(this, normalized);
                    } else {
                        originalValueSetter.call(this, val);
                    }
                } catch (e) {
                    console.warn('[Date Format Fix] Erreur lors de la définition de la valeur:', e);
                    originalValueSetter.call(this, val);
                }
            },
            get: function() {
                return this.getAttribute('value');
            }
        });
    });
    
    console.log('[Date Format Fix] Correcteur de format de date initialisé avec succès');
});
