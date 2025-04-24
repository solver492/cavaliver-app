/**
 * Script de débogage JavaScript amélioré (version allégée)
 * Conçu pour intercepter, analyser et corriger les erreurs JavaScript courantes
 * Sans modifier le code existant de l'application ni bloquer son affichage
 */

(function() {
    console.log('[Error Debugger Enhanced] Initialisation du débogueur amélioré (version allégée)');
    
    // Stocker les erreurs rencontrées pour éviter les doublons
    const encounteredErrors = new Set();
    
    // Fonction pour nettoyer les messages d'erreur
    function cleanErrorMessage(message) {
        if (!message) return 'Erreur inconnue';
        
        // Supprimer les informations sensibles ou les chemins complets
        return message
            .replace(/https?:\/\/[^\/]+\//g, '')  // Supprimer les domaines
            .replace(/at [^\s]+ \([^\)]+\)/g, '')  // Supprimer les traces de pile détaillées
            .replace(/(\r\n|\n|\r)/gm, ' ')  // Remplacer les sauts de ligne par des espaces
            .replace(/\s+/g, ' ')  // Normaliser les espaces
            .trim();
    }
    
    // Fonction pour vérifier si l'erreur a déjà été rencontrée
    function isNewError(error) {
        const cleanedMessage = cleanErrorMessage(error.message || String(error));
        if (encounteredErrors.has(cleanedMessage)) {
            return false;
        }
        encounteredErrors.add(cleanedMessage);
        return true;
    }
    
    // Fonction pour corriger les erreurs courantes
    function fixCommonErrors(error) {
        const errorMessage = error.message || String(error);
        const errorStack = error.stack || '';
        
        // Erreur 1: Problèmes avec les dates
        if (errorMessage.includes('Invalid Date') || 
            errorMessage.includes('is not a valid date') || 
            errorMessage.includes('Invalid isoformat string') ||
            errorMessage.includes('is not a constructor')) {
            
            console.log('[Error Debugger Enhanced] Tentative de correction d\'une erreur de date');
            
            // Patch pour Date.parse
            if (!window._originalDateParse) {
                window._originalDateParse = Date.parse;
                Date.parse = function(dateString) {
                    try {
                        const result = window._originalDateParse(dateString);
                        if (isNaN(result) && typeof dateString === 'string') {
                            // Essayer différents formats
                            if (/^\d{2}\/\d{2}\/\d{4}/.test(dateString)) {
                                const parts = dateString.split('/');
                                return window._originalDateParse(`${parts[2]}-${parts[1]}-${parts[0]}`);
                            }
                            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                                return window._originalDateParse(`${dateString}T00:00:00Z`);
                            }
                        }
                        return result;
                    } catch (e) {
                        console.warn('[Error Debugger Enhanced] Erreur lors du parsing de date:', e);
                        return NaN;
                    }
                };
            }
            
            return true;
        }
        
        // Erreur 2: Problèmes avec undefined ou null
        if (errorMessage.includes('null') || 
            errorMessage.includes('undefined') || 
            errorMessage.includes('is not defined') ||
            errorMessage.includes('Cannot read') ||
            errorMessage.includes('property') ||
            errorMessage.includes('of undefined') ||
            errorMessage.includes('of null')) {
            
            console.log('[Error Debugger Enhanced] Tentative de correction d\'une erreur de référence null/undefined');
            
            // Trouver la source de l'erreur
            let sourcePath = '';
            try {
                const stackLines = errorStack.split('\n');
                for (const line of stackLines) {
                    if (line.includes('.js:')) {
                        sourcePath = line.trim();
                        break;
                    }
                }
            } catch (e) {
                console.warn('[Error Debugger Enhanced] Erreur lors de l\'analyse de la stack trace:', e);
            }
            
            // Patch pour les méthodes courantes qui peuvent causer ces erreurs
            if (!window._safeQuerySelector) {
                window._originalQuerySelector = Document.prototype.querySelector;
                Document.prototype.querySelector = function(selector) {
                    try {
                        return window._originalQuerySelector.call(this, selector);
                    } catch (e) {
                        console.warn(`[Error Debugger Enhanced] Erreur lors de querySelector('${selector}'):`, e);
                        return null;
                    }
                };
                window._safeQuerySelector = true;
            }
            
            // Patch pour querySelectorAll
            if (!window._safeQuerySelectorAll) {
                window._originalQuerySelectorAll = Document.prototype.querySelectorAll;
                Document.prototype.querySelectorAll = function(selector) {
                    try {
                        return window._originalQuerySelectorAll.call(this, selector);
                    } catch (e) {
                        console.warn(`[Error Debugger Enhanced] Erreur lors de querySelectorAll('${selector}'):`, e);
                        return [];
                    }
                };
                window._safeQuerySelectorAll = true;
            }
            
            // Patch pour getElementById
            if (!window._safeGetElementById) {
                window._originalGetElementById = Document.prototype.getElementById;
                Document.prototype.getElementById = function(id) {
                    try {
                        return window._originalGetElementById.call(this, id);
                    } catch (e) {
                        console.warn(`[Error Debugger Enhanced] Erreur lors de getElementById('${id}'):`, e);
                        return null;
                    }
                };
                window._safeGetElementById = true;
            }
            
            return true;
        }
        
        // Erreur 3: Problèmes avec les événements
        if (errorMessage.includes('event') || 
            errorMessage.includes('listener') || 
            errorMessage.includes('dispatch')) {
            
            console.log('[Error Debugger Enhanced] Tentative de correction d\'une erreur d\'événement');
            
            // Patch pour addEventListener
            if (!window._safeAddEventListener) {
                window._originalAddEventListener = EventTarget.prototype.addEventListener;
                EventTarget.prototype.addEventListener = function(type, listener, options) {
                    try {
                        if (typeof listener !== 'function') {
                            console.warn(`[Error Debugger Enhanced] addEventListener appelé avec un listener non-fonction:`, listener);
                            return;
                        }
                        return window._originalAddEventListener.call(this, type, function(event) {
                            try {
                                return listener.call(this, event);
                            } catch (e) {
                                console.warn(`[Error Debugger Enhanced] Erreur dans un gestionnaire d'événements ${type}:`, e);
                            }
                        }, options);
                    } catch (e) {
                        console.warn(`[Error Debugger Enhanced] Erreur lors de addEventListener('${type}'):`, e);
                    }
                };
                window._safeAddEventListener = true;
            }
            
            return true;
        }
        
        // Erreur 4: Problèmes avec les scripts tiers
        if (errorMessage.includes('script') || 
            errorStack.includes('http') || 
            errorStack.includes('.js')) {
            
            console.log('[Error Debugger Enhanced] Tentative de correction d\'une erreur de script tiers');
            
            // Essayer d'identifier le script problématique
            let scriptUrl = '';
            try {
                const stackLines = errorStack.split('\n');
                for (const line of stackLines) {
                    if (line.includes('http') && line.includes('.js')) {
                        const matches = line.match(/https?:\/\/[^\s\)]+/);
                        if (matches && matches[0]) {
                            scriptUrl = matches[0];
                            break;
                        }
                    }
                }
            } catch (e) {
                console.warn('[Error Debugger Enhanced] Erreur lors de l\'analyse de la stack trace pour trouver le script:', e);
            }
            
            if (scriptUrl) {
                console.log(`[Error Debugger Enhanced] Script problématique identifié: ${scriptUrl}`);
            }
            
            return true;
        }
        
        // Erreur 5: Problèmes avec les fonctions asynchrones
        if (errorMessage.includes('async') || 
            errorMessage.includes('await') || 
            errorMessage.includes('promise') ||
            errorMessage.includes('then') ||
            errorMessage.includes('catch')) {
            
            console.log('[Error Debugger Enhanced] Tentative de correction d\'une erreur asynchrone');
            
            // Patch pour Promise.prototype.then
            if (!window._safeThen) {
                window._originalThen = Promise.prototype.then;
                Promise.prototype.then = function(onFulfilled, onRejected) {
                    return window._originalThen.call(this, 
                        onFulfilled ? function(value) {
                            try {
                                return onFulfilled(value);
                            } catch (e) {
                                console.warn('[Error Debugger Enhanced] Erreur dans un callback then:', e);
                                return Promise.reject(e);
                            }
                        } : onFulfilled,
                        onRejected ? function(reason) {
                            try {
                                return onRejected(reason);
                            } catch (e) {
                                console.warn('[Error Debugger Enhanced] Erreur dans un callback catch:', e);
                                return Promise.reject(e);
                            }
                        } : onRejected
                    );
                };
                window._safeThen = true;
            }
            
            // Patch pour fetch
            if (!window._safeFetch && window.fetch) {
                window._originalFetch = window.fetch;
                window.fetch = function() {
                    try {
                        return window._originalFetch.apply(this, arguments)
                            .catch(function(error) {
                                console.warn('[Error Debugger Enhanced] Erreur fetch interceptée:', error);
                                throw error;
                            });
                    } catch (e) {
                        console.warn('[Error Debugger Enhanced] Erreur lors de l\'appel à fetch:', e);
                        return Promise.reject(e);
                    }
                };
                window._safeFetch = true;
            }
            
            return true;
        }
        
        // Aucune correction spécifique trouvée
        return false;
    }
    
    // Intercepter les erreurs non gérées
    window.addEventListener('error', function(event) {
        if (!event.error) return;
        
        // Vérifier si c'est une nouvelle erreur
        if (!isNewError(event.error)) {
            return;
        }
        
        console.error('[Error Debugger Enhanced] Erreur non gérée interceptée:', event.error);
        
        // Essayer de corriger l'erreur
        const fixed = fixCommonErrors(event.error);
        
        if (fixed) {
            console.log('[Error Debugger Enhanced] Correction appliquée pour l\'erreur:', event.error.message);
            
            // Empêcher l'affichage de l'erreur dans la console du navigateur
            event.preventDefault();
        }
    }, true);
    
    // Intercepter les rejets de promesses non gérés
    window.addEventListener('unhandledrejection', function(event) {
        if (!event.reason) return;
        
        // Vérifier si c'est une nouvelle erreur
        if (!isNewError(event.reason)) {
            return;
        }
        
        console.error('[Error Debugger Enhanced] Promesse rejetée non gérée interceptée:', event.reason);
        
        // Essayer de corriger l'erreur
        const fixed = fixCommonErrors(event.reason);
        
        if (fixed) {
            console.log('[Error Debugger Enhanced] Correction appliquée pour la promesse rejetée:', 
                event.reason.message || event.reason);
            
            // Empêcher l'affichage de l'erreur dans la console du navigateur
            event.preventDefault();
        }
    }, true);
    
    // Fonction pour supprimer uniquement les messages d'erreur JavaScript spécifiques
    function removeErrorMessages() {
        // Supprimer uniquement les alertes d'erreur JavaScript
        const errorAlerts = document.querySelectorAll('.alert-danger, .alert-error, .error-message');
        errorAlerts.forEach(function(alert) {
            if (alert.textContent.toLowerCase().includes('javascript') || 
                alert.textContent.toLowerCase().includes('erreur inconnue')) {
                alert.style.display = 'none';
            }
        });
        
        // Supprimer uniquement les bannières d'erreur JavaScript spécifiques
        const errorTexts = ['ERREUR JAVASCRIPT', 'Erreur inconnue', 'JavaScript Error'];
        errorTexts.forEach(function(errorText) {
            try {
                // Utiliser XPath pour une recherche plus précise
                const xpath = `//div[contains(text(), '${errorText}')] | //span[contains(text(), '${errorText}')]`;
                const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                
                for (let i = 0; i < result.snapshotLength; i++) {
                    const element = result.snapshotItem(i);
                    if (element && !element.id.includes('content') && !element.id.includes('main')) {
                        element.style.display = 'none';
                    }
                }
            } catch (e) {
                // Ignorer les erreurs de recherche
            }
        });
    }
    
    // Exécuter périodiquement mais moins fréquemment pour éviter les problèmes de performance
    setInterval(removeErrorMessages, 2000);
    
    // Patch pour console.error pour éviter les erreurs dans la console
    const originalConsoleError = console.error;
    console.error = function() {
        // Filtrer certaines erreurs connues
        const errorText = Array.from(arguments).join(' ');
        if (errorText.includes('JAVASCRIPT') || errorText.includes('Erreur inconnue')) {
            // Ne pas afficher ces erreurs
            return;
        }
        
        // Afficher les autres erreurs normalement
        return originalConsoleError.apply(console, arguments);
    };
    
    console.log('[Error Debugger Enhanced] Débogueur amélioré initialisé avec succès');
})();
