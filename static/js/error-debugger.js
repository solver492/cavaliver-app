/**
 * Script de débogage pour intercepter et améliorer les erreurs console
 * Ce script remplace temporairement console.error pour capturer et améliorer
 * les messages d'erreur vides ou incomplets
 */

(function() {
    // Sauvegarder la fonction console.error originale
    const originalConsoleError = console.error;
    
    // Créer un journal des erreurs pour le débogage
    const errorLog = [];
    
    // Remplacer console.error par notre version améliorée
    console.error = function(...args) {
        // Enregistrer l'heure de l'erreur
        const timestamp = new Date().toISOString();
        
        // Vérifier si l'erreur est du type "Erreur: {}"
        const isEmptyError = args.length === 1 && 
                            typeof args[0] === 'string' && 
                            (args[0] === 'Erreur: {}' || args[0].includes('Erreur: {}'));
        
        if (isEmptyError) {
            // Capturer la stack trace pour identifier la source de l'erreur
            const stack = new Error().stack;
            
            // Créer un message d'erreur amélioré
            const enhancedMessage = `[ERROR-DEBUGGER] Erreur vide détectée! Stack trace: ${stack}`;
            
            // Enregistrer l'erreur améliorée dans notre journal
            errorLog.push({
                timestamp,
                type: 'empty-error',
                originalMessage: args[0],
                stack
            });
            
            // Afficher l'erreur améliorée dans la console
            originalConsoleError.call(console, enhancedMessage);
            
            // Afficher un message dans l'interface utilisateur si possible
            try {
                const errorContainer = document.getElementById('error-debug-container') || 
                                      document.createElement('div');
                
                if (!document.getElementById('error-debug-container')) {
                    errorContainer.id = 'error-debug-container';
                    errorContainer.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; ' +
                                                 'background: rgba(255, 0, 0, 0.1); border: 1px solid red; ' +
                                                 'padding: 10px; max-width: 400px; max-height: 200px; overflow: auto;';
                    document.body.appendChild(errorContainer);
                }
                
                const errorEntry = document.createElement('div');
                errorEntry.innerHTML = `<strong>${timestamp}</strong>: Erreur vide détectée! <button onclick="this.nextElementSibling.style.display='block'">Détails</button><pre style="display:none; margin-top: 5px; font-size: 10px;">${stack}</pre>`;
                errorContainer.appendChild(errorEntry);
            } catch (e) {
                // Ignorer les erreurs d'interface utilisateur
            }
        } else {
            // Pour les autres erreurs, simplement les transmettre à la fonction originale
            originalConsoleError.apply(console, args);
            
            // Mais les enregistrer quand même dans notre journal
            errorLog.push({
                timestamp,
                type: 'normal-error',
                args: args.map(arg => {
                    try {
                        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                    } catch (e) {
                        return '[Objet non sérialisable]';
                    }
                })
            });
        }
    };
    
    // Exposer le journal des erreurs globalement pour le débogage
    window.errorDebuggerLog = {
        getLog: function() {
            return errorLog;
        },
        clear: function() {
            errorLog.length = 0;
            return 'Journal des erreurs effacé';
        },
        downloadLog: function() {
            try {
                const logText = JSON.stringify(errorLog, null, 2);
                const blob = new Blob([logText], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `error-log-${new Date().toISOString().replace(/:/g, '-')}.json`;
                a.click();
                
                URL.revokeObjectURL(url);
                return 'Téléchargement du journal des erreurs initié';
            } catch (e) {
                return `Erreur lors du téléchargement du journal: ${e.message}`;
            }
        }
    };
    
    // Ajouter un gestionnaire d'erreurs global pour capturer les erreurs non gérées
    window.addEventListener('error', function(event) {
        console.error(`[ERROR-DEBUGGER] Erreur non gérée: ${event.message} dans ${event.filename}:${event.lineno}:${event.colno}`);
        return false; // Ne pas empêcher le comportement par défaut
    });
    
    console.log('[ERROR-DEBUGGER] Débogueur d\'erreurs installé. Utilisez window.errorDebuggerLog.getLog() pour voir le journal des erreurs.');
})();
