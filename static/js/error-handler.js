/**
 * Script pour capturer et afficher les erreurs JavaScript de manière plus détaillée
 * Cela aidera à identifier et résoudre les erreurs qui ne sont pas clairement affichées dans la console
 */

// Fonction pour formater les erreurs de manière plus lisible
function formatError(error) {
    if (!error) return 'Erreur inconnue';

    let errorDetails = {
        message: error.message || 'Pas de message d\'erreur',
        name: error.name || 'Type d\'erreur inconnu',
        stack: error.stack || 'Pas de stack trace disponible',
        fileName: error.fileName || 'Fichier inconnu',
        lineNumber: error.lineNumber || 'Ligne inconnue'
    };

    return `
        Erreur: ${errorDetails.name}
        Message: ${errorDetails.message}
        Fichier: ${errorDetails.fileName}
        Ligne: ${errorDetails.lineNumber}
        Stack: ${errorDetails.stack}
    `;
}

// Fonction pour créer et afficher une alerte d'erreur (sans jQuery)
function showErrorAlert(message, type) {
    const errorContainer = document.createElement('div');
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '0';
    errorContainer.style.left = '0';
    errorContainer.style.right = '0';
    errorContainer.style.backgroundColor = type === 'error' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)';
    errorContainer.style.color = 'white';
    errorContainer.style.padding = '10px';
    errorContainer.style.zIndex = '9999';
    errorContainer.style.fontFamily = 'monospace';
    errorContainer.style.fontSize = '12px';
    errorContainer.style.whiteSpace = 'pre-wrap';
    errorContainer.style.maxHeight = '200px';
    errorContainer.style.overflow = 'auto';

    errorContainer.textContent = message;

    // Ajouter un bouton pour fermer l'erreur
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fermer';
    closeButton.style.marginLeft = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = 'white';
    closeButton.style.color = type === 'error' ? 'red' : 'orange';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';

    closeButton.addEventListener('click', function() {
        document.body.removeChild(errorContainer);
    });

    errorContainer.appendChild(closeButton);

    // Ajouter au début du body
    document.body.insertBefore(errorContainer, document.body.firstChild);
}

// Capturer les erreurs non gérées
window.addEventListener('error', function(event) {
    console.error('[ERROR-DEBUGGER] Erreur non gérée:', formatError(event.error));

    const errorMessage = `ERREUR JAVASCRIPT: ${event.error ? event.error.message : 'Erreur inconnue'}\n${formatError(event.error)}`;
    showErrorAlert(errorMessage, 'error');
});

// Capturer les rejets de promesses non gérés
window.addEventListener('unhandledrejection', function(event) {
    console.error('[ERROR-DEBUGGER] Promesse rejetée non gérée:', event.reason);

    const errorMessage = `PROMESSE REJETÉE: ${event.reason ? (event.reason.message || event.reason) : 'Raison inconnue'}\n${formatError(event.reason)}`;
    showErrorAlert(errorMessage, 'warning');
});

// Vérifier que les bibliothèques sont correctement chargées, mais seulement après le chargement complet du DOM
window.addEventListener('load', function() {
    // Vérifier jQuery
    if (typeof window.jQuery === 'undefined') {
        console.error('[ERROR-DEBUGGER] jQuery n\'est pas chargé correctement');
        showErrorAlert('jQuery n\'est pas chargé correctement', 'error');
    } else {
        console.log('[DEBUG] jQuery version:', window.jQuery.fn.jquery);

        // Ces vérifications ne sont faites que si jQuery est disponible
        // Vérifier Summernote
        if (typeof window.jQuery.fn.summernote === 'undefined') {
            console.error('[ERROR-DEBUGGER] Summernote n\'est pas chargé correctement');
        } else {
            console.log('[DEBUG] Summernote chargé correctement');
        }
    }

    // Vérifier Bootstrap (qui ne dépend pas de jQuery dans la v5)
    if (typeof window.bootstrap === 'undefined') {
        console.error('[ERROR-DEBUGGER] Bootstrap n\'est pas chargé correctement');
    } else {
        console.log('[DEBUG] Bootstrap chargé correctement');
    }

    console.log('[DEBUG] Scripts chargés:', Array.from(document.scripts).map(s => s.src || 'inline script').filter(s => s !== 'inline script'));
});

window.onerror = function(message, source, lineno, colno, error) {
    console.error('ERREUR JAVASCRIPT:', message);

    // Afficher une erreur plus détaillée dans la console
    if (error && error.stack) {
        console.error('Stack trace:', error.stack);
    }

    // Éviter que l'erreur ne bloque l'interface
    return true;
};