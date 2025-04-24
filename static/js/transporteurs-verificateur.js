/**
 * VÉRIFICATEUR DE TRANSPORTEURS DISPONIBLES
 * Script robuste et indépendant pour vérifier les transporteurs disponibles
 * Version: 1.0.3
 * - Ajout d'un mécanisme de verrouillage pour éviter les conflits entre scripts
 * - Amélioration de la détection des éléments DOM (boutons, conteneurs)
 * - Meilleure gestion des erreurs et des logs détaillés
 * - Résolution de la confusion entre modèles User et Transporteur
 * - Formatage amélioré des dates et des informations de contact
 * - Gestion plus robuste des différents formats de données
 */

// Fonction auto-exécutante pour éviter les conflits de variables globales
(function() {
    // Vérifier si le script est déjà initialisé pour éviter les conflits
    if (window.transporteurVerificateurInitialized) {
        console.warn('[TRANSPORTEURS-VERIFICATEUR] Le vérificateur de transporteurs est déjà initialisé, sortie anticipée.');
        return;
    }
    window.transporteurVerificateurInitialized = true;
    
    // Enregistrer l'initialisation du script
    console.info('[TRANSPORTEURS-VERIFICATEUR] Version 1.0.3 - Initialisation...');
    // Gestionnaire d'erreurs global pour capturer toutes les erreurs non gérées
    window.addEventListener('error', function(event) {
        try {
            console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur globale non gérée:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            
            // Enregistrer l'erreur dans la console avec plus de détails
            if (event.error && event.error.stack) {
                console.error('[TRANSPORTEURS-VERIFICATEUR] Stack trace:', event.error.stack);
            }
            
            // Afficher une notification d'erreur pour l'utilisateur
            const errorContainer = document.getElementById('transporteurs-error-global');
            if (errorContainer) {
                errorContainer.innerHTML = `<div class="alert alert-danger">
                    <strong>Erreur technique détectée</strong><br>
                    Une erreur s'est produite lors du traitement de votre demande.<br>
                    Détails: ${event.message || 'Erreur inconnue'}
                </div>`;
                errorContainer.style.display = 'block';
            } else {
                // Créer un conteneur d'erreur si nécessaire
                const newErrorContainer = document.createElement('div');
                newErrorContainer.id = 'transporteurs-error-global';
                newErrorContainer.className = 'alert alert-danger mt-3';
                newErrorContainer.innerHTML = `
                    <strong>Erreur technique détectée</strong><br>
                    Une erreur s'est produite lors du traitement de votre demande.<br>
                    Détails: ${event.message || 'Erreur inconnue'}
                `;
                
                // Essayer d'insérer le conteneur dans un endroit visible
                const possibleContainers = [
                    document.querySelector('.transporteurs-container'),
                    document.querySelector('.prestation-container'),
                    document.querySelector('main'),
                    document.body
                ];
                
                for (const container of possibleContainers) {
                    if (container) {
                        container.prepend(newErrorContainer);
                        break;
                    }
                }
            }
        } catch (handlerError) {
            console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur dans le gestionnaire global d\'erreurs:', handlerError);
        }
        
        // Empêcher la propagation de l'erreur pour éviter les doublons
        // event.preventDefault();
    });
    
    // Gestionnaire de promesses rejetées non gérées
    window.addEventListener('unhandledrejection', function(event) {
        try {
            console.error('[TRANSPORTEURS-VERIFICATEUR] Promesse rejetée non gérée:', {
                reason: event.reason
            });
            
            if (event.reason && event.reason.stack) {
                console.error('[TRANSPORTEURS-VERIFICATEUR] Stack trace:', event.reason.stack);
            }
            
            // Extraire le message d'erreur
            let errorMessage = 'Erreur asynchrone inconnue';
            if (event.reason) {
                if (typeof event.reason === 'string') {
                    errorMessage = event.reason;
                } else if (event.reason.message) {
                    errorMessage = event.reason.message;
                }
            }
            
            // Afficher une notification d'erreur pour l'utilisateur
            const errorContainer = document.getElementById('transporteurs-error-global');
            if (errorContainer) {
                errorContainer.innerHTML = `<div class="alert alert-danger">
                    <strong>Erreur asynchrone détectée</strong><br>
                    Une erreur s'est produite lors d'une opération asynchrone.<br>
                    Détails: ${errorMessage}
                </div>`;
                errorContainer.style.display = 'block';
            } else {
                // Créer un conteneur d'erreur si nécessaire
                const newErrorContainer = document.createElement('div');
                newErrorContainer.id = 'transporteurs-error-global';
                newErrorContainer.className = 'alert alert-danger mt-3';
                newErrorContainer.innerHTML = `
                    <strong>Erreur asynchrone détectée</strong><br>
                    Une erreur s'est produite lors d'une opération asynchrone.<br>
                    Détails: ${errorMessage}
                `;
                
                // Essayer d'insérer le conteneur dans un endroit visible
                const possibleContainers = [
                    document.querySelector('.transporteurs-container'),
                    document.querySelector('.prestation-container'),
                    document.querySelector('main'),
                    document.body
                ];
                
                for (const container of possibleContainers) {
                    if (container) {
                        container.prepend(newErrorContainer);
                        break;
                    }
                }
            }
        } catch (handlerError) {
            console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur dans le gestionnaire de promesses rejetées:', handlerError);
        }
        
        // Empêcher la propagation de l'erreur si nécessaire
        // event.preventDefault();
    });
    
    // Fonction utilitaire pour la journalisation améliorée
    function logDebug(message, data) {
        console.log(`[TRANSPORTEURS-VERIFICATEUR] ${message}`, data || '');
    }
    
    function logInfo(message, data) {
        console.info(`[TRANSPORTEURS-VERIFICATEUR] ${message}`, data || '');
    }
    
    function logWarning(message, data) {
        console.warn(`[TRANSPORTEURS-VERIFICATEUR] ${message}`, data || '');
    }
    
    function logError(message, error) {
        try {
            console.error(`[TRANSPORTEURS-VERIFICATEUR] ${message}`, error || '');
            
            // Journaliser la stack trace et les détails supplémentaires si disponibles
            if (error) {
                if (error instanceof Error) {
                    console.error('[TRANSPORTEURS-VERIFICATEUR] Détails de l\'erreur:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                        fileName: error.fileName,
                        lineNumber: error.lineNumber,
                        columnNumber: error.columnNumber
                    });
                } else if (error.stack) {
                    console.error('[TRANSPORTEURS-VERIFICATEUR] Stack trace:', error.stack);
                }
                
                // Enregistrer l'erreur dans un élément HTML pour le débogage
                const errorLogElement = document.getElementById('transporteurs-error-log');
                if (errorLogElement) {
                    const errorEntry = document.createElement('div');
                    errorEntry.className = 'error-entry';
                    errorEntry.innerHTML = `
                        <div class="timestamp">${new Date().toISOString()}</div>
                        <div class="message">${message}</div>
                        <div class="details">${error instanceof Error ? error.message : JSON.stringify(error)}</div>
                    `;
                    errorLogElement.appendChild(errorEntry);
                }
            }
            
            // Notifier l'erreur dans la console du navigateur pour faciliter le débogage
            if (typeof console.groupCollapsed === 'function') {
                console.groupCollapsed(`[TRANSPORTEURS-VERIFICATEUR] Erreur détaillée: ${message}`);
                console.error('Message:', message);
                console.error('Erreur:', error);
                console.error('Timestamp:', new Date().toISOString());
                console.error('URL:', window.location.href);
                console.groupEnd();
            }
        } catch (e) {
            console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur lors de la journalisation:', e);
        }
    }
    
    // Fonction pour créer un élément de journal d'erreurs dans le DOM
    function createErrorLogElement() {
        try {
            // Vérifier si l'élément existe déjà
            if (document.getElementById('transporteurs-error-log')) {
                return;
            }
            
            // Créer l'élément de journal d'erreurs
            const errorLogContainer = document.createElement('div');
            errorLogContainer.id = 'transporteurs-error-log-container';
            errorLogContainer.style.cssText = 'display: none; position: fixed; bottom: 0; right: 0; width: 400px; max-height: 300px; overflow-y: auto; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 10px; z-index: 9999; box-shadow: 0 0 10px rgba(0,0,0,0.1);';
            
            // Ajouter un en-tête avec bouton pour afficher/masquer
            const header = document.createElement('div');
            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;';
            header.innerHTML = `
                <strong>Journal des erreurs</strong>
                <button id="transporteurs-error-log-toggle" style="background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
            `;
            errorLogContainer.appendChild(header);
            
            // Ajouter l'élément de journal
            const errorLog = document.createElement('div');
            errorLog.id = 'transporteurs-error-log';
            errorLog.style.cssText = 'font-family: monospace; font-size: 12px;';
            errorLogContainer.appendChild(errorLog);
            
            // Ajouter un bouton flottant pour afficher le journal
            const toggleButton = document.createElement('button');
            toggleButton.id = 'transporteurs-error-log-float-button';
            toggleButton.innerHTML = '🐞';
            toggleButton.style.cssText = 'position: fixed; bottom: 10px; right: 10px; width: 40px; height: 40px; border-radius: 50%; background: #dc3545; color: white; border: none; font-size: 20px; cursor: pointer; z-index: 9999; display: none;';
            toggleButton.title = 'Afficher le journal des erreurs';
            
            // Ajouter les éléments au body
            document.body.appendChild(errorLogContainer);
            document.body.appendChild(toggleButton);
            
            // Ajouter les gestionnaires d'événements
            document.getElementById('transporteurs-error-log-toggle').addEventListener('click', function() {
                errorLogContainer.style.display = 'none';
                toggleButton.style.display = 'block';
            });
            
            toggleButton.addEventListener('click', function() {
                errorLogContainer.style.display = 'block';
                this.style.display = 'none';
            });
            
            // Afficher le bouton flottant s'il y a des erreurs
            if (document.querySelectorAll('#transporteurs-error-log .error-entry').length > 0) {
                toggleButton.style.display = 'block';
            }
            
            logInfo('Journal des erreurs créé et initialisé');
        } catch (e) {
            console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur lors de la création du journal des erreurs:', e);
        }
    }
    
    // Attendre que le DOM soit complètement chargé
    document.addEventListener('DOMContentLoaded', function() {
        logInfo('Script chargé et initialisé');
        
        // Créer l'élément de journal des erreurs
        createErrorLogElement();
        
        // Vérifier si un autre script a déjà initialisé le vérificateur
        if (window.transporteursVerificateurInitialized) {
            logWarning('Le vérificateur de transporteurs a déjà été initialisé par un autre script');
            return;
        }
        
        // Marquer comme initialisé
        window.transporteursVerificateurInitialized = true;
        
        try {
            initVerificateurTransporteurs();
        } catch (error) {
            logError('Erreur lors de l\'initialisation du vérificateur de transporteurs', error);
        }
    });

    // Fonction principale d'initialisation
    function initVerificateurTransporteurs() {
        try {
            logInfo('Initialisation du vérificateur de transporteurs');
            
            // Détecter les erreurs vides et les remplacer par des erreurs plus informatives
            const emptyErrorHandler = function(event) {
                if (event.error && Object.keys(event.error).length === 0) {
                    logError('Erreur vide détectée', {
                        message: 'Erreur vide détectée',
                        location: window.location.href,
                        stack: new Error().stack
                    });
                    
                    // Essayer de déterminer la source de l'erreur
                    const scripts = document.querySelectorAll('script');
                    logDebug('Scripts chargés sur la page', Array.from(scripts).map(s => s.src || 'inline script'));
                    
                    // Vérifier les conflits potentiels
                    const transporteurScripts = Array.from(scripts)
                        .filter(s => s.src && s.src.includes('transporteur'));
                    
                    if (transporteurScripts.length > 1) {
                        logWarning('Plusieurs scripts de transporteurs détectés, risque de conflit', 
                            transporteurScripts.map(s => s.src));
                    }
                }
            };
            
            // Ajouter l'écouteur d'erreurs vides
            window.addEventListener('error', emptyErrorHandler);
            
            // Vérifier les conflits potentiels avec d'autres scripts
            if (window.transporteursCheckInitialized || window.transporteursDisponibiliteInitialized) {
                logWarning('Détection de conflits potentiels avec d\'autres scripts de transporteurs', {
                    transporteursCheckInitialized: !!window.transporteursCheckInitialized,
                    transporteursDisponibiliteInitialized: !!window.transporteursDisponibiliteInitialized
                });
            }
            
            // Éléments DOM essentiels (requis pour le fonctionnement)
            const elementsEssentiels = {
                dateDebutInput: document.querySelector('#date_debut'),
                dateFinInput: document.querySelector('#date_fin'),
                typeDemenagementSelect: document.querySelector('#type_demenagement_id'),
                // Amélioration de la détection du bouton avec plusieurs sélecteurs possibles
                btnVerifierDisponibilite: document.querySelector('#verifier-disponibilite') || 
                                         document.querySelector('#verifier-disponibilites') || 
                                         document.querySelector('.btn-verifier-disponibilite') ||
                                         document.querySelector('button[data-action="verifier-disponibilite"]')
            };
            
            // Vérifier que les éléments essentiels sont présents
            let missingEssentialElements = [];
            for (const [key, element] of Object.entries(elementsEssentiels)) {
                if (!element) {
                    missingEssentialElements.push(key);
                }
            }
            
            if (missingEssentialElements.length > 0) {
                logError(`Éléments essentiels manquants: ${missingEssentialElements.join(', ')}`);
                logError('Impossible d\'initialiser le vérificateur de transporteurs');
                
                // Essayer de récupérer les éléments avec des sélecteurs alternatifs
                logWarning('Tentative de récupération avec des sélecteurs alternatifs');
                
                const alternativeSelectors = {
                    dateDebutInput: 'input[name="date_debut"], input[type="date"]:first-of-type',
                    dateFinInput: 'input[name="date_fin"], input[type="date"]:nth-of-type(2)',
                    typeDemenagementSelect: 'select[name="type_demenagement_id"], select.type-demenagement-select, select:has(option[value])'                    
                };
                
                let recoveredElements = 0;
                
                for (const key of missingEssentialElements) {
                    if (alternativeSelectors[key]) {
                        const element = document.querySelector(alternativeSelectors[key]);
                        if (element) {
                            elementsEssentiels[key] = element;
                            logInfo(`Élément ${key} récupéré avec sélecteur alternatif`);
                            recoveredElements++;
                        }
                    }
                }
                
                // Si on n'a pas récupéré tous les éléments, abandonner
                if (recoveredElements < missingEssentialElements.length) {
                    logError('Impossible de récupérer tous les éléments essentiels, abandon');
                    return;
                }
                
                logInfo('Récupération réussie des éléments essentiels');
            }
            
            // Éléments DOM secondaires (non essentiels mais utiles)
            const elements = {
                ...elementsEssentiels,
                btnVerifier: document.querySelector('#verifier-disponibilite'),
                resultsContainer: document.querySelector('#transporteurs-disponibles-resultats'),
                transporteursSelect: document.querySelector('#transporteurs'),
                bientotDisponiblesDiv: document.querySelector('#transporteurs-bientot-disponibles'),
                bientotDisponiblesResultats: document.querySelector('#transporteurs-bientot-disponibles-resultats'),
                transporteurCounter: document.querySelector('#transporteur-counter'),
                btnCalendar: document.querySelector('#show-calendar-btn')
            };
            
            // Déboguer les éléments trouvés
            logDebug('Eléments secondaires trouvés', {
                btnVerifier: !!elements.btnVerifier,
                resultsContainer: !!elements.resultsContainer,
                transporteursSelect: !!elements.transporteursSelect,
                bientotDisponiblesDiv: !!elements.bientotDisponiblesDiv,
                bientotDisponiblesResultats: !!elements.bientotDisponiblesResultats,
                transporteurCounter: !!elements.transporteurCounter,
                btnCalendar: !!elements.btnCalendar
            });
            
            // Créer dynamiquement les éléments manquants non essentiels
            if (!elements.resultsContainer) {
                logWarning('Conteneur de résultats non trouvé, création dynamique');
                const container = document.createElement('div');
                container.id = 'transporteurs-disponibles-resultats';
                container.className = 'mt-3 border p-3 rounded';
                
                // Trouver un emplacement approprié pour insérer le conteneur
                const parent = elements.transporteursSelect ? 
                    elements.transporteursSelect.closest('.form-group') : 
                    document.querySelector('.card-body');
                
                if (parent) {
                    parent.appendChild(container);
                    elements.resultsContainer = container;
                }
            }
            
            // Créer le conteneur pour les transporteurs bientôt disponibles s'il n'existe pas
            if (!elements.bientotDisponiblesDiv) {
                console.warn('[TRANSPORTEURS-VERIFICATEUR] Conteneur pour transporteurs bientôt disponibles non trouvé, création dynamique');
                const container = document.createElement('div');
                container.id = 'transporteurs-bientot-disponibles';
                container.className = 'mt-4';
                container.style.display = 'none';
                
                const title = document.createElement('h5');
                title.textContent = 'Transporteurs bientôt disponibles';
                container.appendChild(title);
                
                const results = document.createElement('div');
                results.id = 'transporteurs-bientot-disponibles-resultats';
                container.appendChild(results);
                
                // Insérer après le conteneur de résultats
                if (elements.resultsContainer && elements.resultsContainer.parentNode) {
                    elements.resultsContainer.parentNode.insertBefore(container, elements.resultsContainer.nextSibling);
                    elements.bientotDisponiblesDiv = container;
                    elements.bientotDisponiblesResultats = results;
                }
            }
            
            // Créer le bouton de vérification s'il n'existe pas
            if (!elements.btnVerifier) {
                console.warn('[TRANSPORTEURS-VERIFICATEUR] Bouton de vérification non trouvé, création dynamique');
                const btn = document.createElement('button');
                btn.id = 'verifier-disponibilite';
                btn.className = 'btn btn-primary mt-2';
                btn.innerHTML = '<i class="fas fa-search me-2"></i>Vérifier les disponibilités';
                
                // Insérer après le select de type de déménagement
                if (elements.typeDemenagementSelect && elements.typeDemenagementSelect.parentNode) {
                    const parent = elements.typeDemenagementSelect.closest('.form-group') || elements.typeDemenagementSelect.parentNode;
                    parent.appendChild(btn);
                    elements.btnVerifier = btn;
                }
            }
            
            // Créer le bouton du calendrier s'il n'existe pas et si le module de calendrier est détecté
            if (!elements.btnCalendar && typeof showCalendarModal === 'function') {
                console.log('[TRANSPORTEURS-VERIFICATEUR] Module de calendrier détecté, création du bouton');
                const btn = document.createElement('button');
                btn.id = 'show-calendar-btn';
                btn.className = 'btn btn-outline-primary mt-2 ms-2';
                btn.innerHTML = '<i class="fas fa-calendar-alt me-2"></i>Voir le calendrier';
                
                // Insérer à côté du bouton de vérification
                if (elements.btnVerifier && elements.btnVerifier.parentNode) {
                    elements.btnVerifier.parentNode.insertBefore(btn, elements.btnVerifier.nextSibling);
                    elements.btnCalendar = btn;
                    
                    // Ajouter un écouteur d'événement pour le bouton du calendrier
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (typeof showCalendarModal === 'function') {
                            showCalendarModal(elements);
                        } else {
                            console.error('[TRANSPORTEURS-VERIFICATEUR] Fonction showCalendarModal non disponible');
                        }
                    });
                }
            }
            
            // Loguer les éléments trouvés et manquants
            const foundElements = Object.entries(elements).filter(([_, el]) => el).map(([key, _]) => key);
            const missingElements = Object.entries(elements).filter(([_, el]) => !el).map(([key, _]) => key);
            
            console.log(`[TRANSPORTEURS-VERIFICATEUR] Éléments trouvés (${foundElements.length}): ${foundElements.join(', ')}`);
            if (missingElements.length > 0) {
                console.warn(`[TRANSPORTEURS-VERIFICATEUR] Éléments non essentiels manquants (${missingElements.length}): ${missingElements.join(', ')}`);
            }
            
            // Récupérer l'ID de la prestation actuelle (pour l'édition)
            const prestationId = extractPrestationIdFromUrl();
            if (prestationId) {
                console.log(`[TRANSPORTEURS-VERIFICATEUR] Mode édition détecté, prestation ID: ${prestationId}`);
            } else {
                console.log('[TRANSPORTEURS-VERIFICATEUR] Mode création détecté');
            }
            
            // Initialiser les écouteurs d'événements
            initEventListeners(elements, prestationId);
            
            // Mettre à jour le compteur de transporteurs si présent
            if (elements.transporteurCounter && elements.transporteursSelect) {
                updateTransporteurCounter(elements);
            }
            
            // Ajouter un gestionnaire d'erreur global pour capturer les erreurs vides
            if (!window.transporteursEmptyErrorHandlerAdded) {
                window.addEventListener('error', function(event) {
                    // Détecter les erreurs vides (objet d'erreur sans propriétés)
                    if (event.error && Object.keys(event.error).length === 0) {
                        logError('Erreur vide détectée', {
                            message: 'Erreur JavaScript vide détectée',
                            location: window.location.href,
                            stack: new Error().stack
                        });
                        
                        // Essayer de déterminer la source de l'erreur
                        const scripts = document.querySelectorAll('script');
                        const transporteurScripts = Array.from(scripts)
                            .filter(s => s.src && s.src.includes('transporteur'));
                        
                        if (transporteurScripts.length > 1) {
                            logWarning('Plusieurs scripts de transporteurs détectés, risque de conflit', 
                                transporteurScripts.map(s => s.src));
                        }
                    }
                });
                
                window.transporteursEmptyErrorHandlerAdded = true;
                logInfo('Gestionnaire d\'erreurs vides installé');
            }
            
            // Vérifier les conflits potentiels avec d'autres scripts
            if (window.transporteursVerificateurInitialized) {
                logWarning('Le vérificateur de transporteurs a déjà été initialisé, risque de conflit');
            }
            
            // Vérification automatique au chargement si tous les champs sont remplis
            if (shouldAutoVerify(elements)) {
                logInfo('Vérification automatique au chargement');
                setTimeout(() => {
                    try {
                        verifierDisponibilite(elements, prestationId);
                    } catch (autoVerifyError) {
                        logError('Erreur lors de la vérification automatique', autoVerifyError);
                    }
                }, 1000); // Délai plus long pour éviter les conflits avec d'autres scripts
            }
            
            // Marquer le script comme initialisé pour éviter les doubles initialisations
            window.transporteursVerificateurInitialized = true;
            
            logInfo('Initialisation terminée avec succès');
        } catch (error) {
            logError('Erreur lors de l\'initialisation', error);
            
            // Essayer de récupérer en mode dégradé
            try {
                logWarning('Tentative de récupération en mode dégradé');
                
                // Récupérer les éléments essentiels avec des sélecteurs plus larges
                const fallbackElements = {
                    dateDebutInput: document.querySelector('input[name="date_debut"], input[type="date"]:first-of-type'),
                    dateFinInput: document.querySelector('input[name="date_fin"], input[type="date"]:nth-of-type(2)'),
                    typeDemenagementSelect: document.querySelector('select[name="type_demenagement_id"], select:has(option[value])'),
                    btnVerifier: document.querySelector('#verifier-disponibilite, button.btn-primary'),
                    transporteursSelect: document.querySelector('#transporteurs, select[multiple]')
                };
                
                // Vérifier si on a récupéré les éléments essentiels
                if (fallbackElements.dateDebutInput && fallbackElements.dateFinInput && fallbackElements.typeDemenagementSelect) {
                    logInfo('Récupération réussie des éléments essentiels en mode dégradé');
                    
                    // Créer un conteneur de résultats si nécessaire
                    if (!fallbackElements.resultsContainer) {
                        const container = document.createElement('div');
                        container.id = 'transporteurs-disponibles-resultats-fallback';
                        container.className = 'mt-3 border p-3 rounded';
                        container.innerHTML = '<div class="alert alert-warning">Mode dégradé activé suite à une erreur</div>';
                        
                        // Insérer après le sélecteur de transporteurs ou le bouton de vérification
                        const parent = fallbackElements.transporteursSelect ? 
                            fallbackElements.transporteursSelect.closest('.form-group') : 
                            (fallbackElements.btnVerifier ? fallbackElements.btnVerifier.parentNode : document.querySelector('.card-body'));
                        
                        if (parent) {
                            parent.appendChild(container);
                            fallbackElements.resultsContainer = container;
                        }
                    }
                    
                    // Initialiser les écouteurs d'événements en mode dégradé
                    if (fallbackElements.btnVerifier) {
                        fallbackElements.btnVerifier.addEventListener('click', function() {
                            try {
                                verifierDisponibilite(fallbackElements);
                            } catch (e) {
                                logError('Erreur lors de la vérification en mode dégradé', e);
                                if (fallbackElements.resultsContainer) {
                                    fallbackElements.resultsContainer.innerHTML = `
                                        <div class="alert alert-danger">
                                            Erreur lors de la vérification des disponibilités. Veuillez réessayer plus tard.
                                        </div>
                                    `;
                                }
                            }
                        });
                    }
                    
                    logInfo('Mode dégradé initialisé avec succès');
                } else {
                    logError('Impossible de récupérer les éléments essentiels en mode dégradé');
                }
            } catch (fallbackError) {
                logError('Erreur lors de la récupération en mode dégradé', fallbackError);
            }
        }
    }

    // Extraire l'ID de prestation de l'URL
    function extractPrestationIdFromUrl() {
        const currentUrl = window.location.pathname;
        const urlParts = currentUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        
        if (!isNaN(parseInt(lastPart))) {
            const prestationId = parseInt(lastPart);
            console.log(`[TRANSPORTEURS-VERIFICATEUR] ID de prestation détecté: ${prestationId}`);
            return prestationId;
        }
        
        return null;
    }

    // Initialiser tous les écouteurs d'événements
    function initEventListeners(elements, prestationId) {
        try {
            console.log('[TRANSPORTEURS-VERIFICATEUR] Initialisation des écouteurs d\'événements');
            
            // 1. Écouteur pour le bouton principal de vérification
            if (elements.btnVerifier) {
                // D'abord, supprimer tous les écouteurs existants pour éviter les doublons
                const oldBtn = elements.btnVerifier;
                const newBtn = oldBtn.cloneNode(true);
                if (oldBtn.parentNode) {
                    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
                }
                elements.btnVerifier = newBtn;
                
                // Ajouter le nouvel écouteur
                newBtn.addEventListener('click', function(e) {
                    console.log('[TRANSPORTEURS-VERIFICATEUR] Bouton de vérification cliqué');
                    e.preventDefault();
                    verifierDisponibilite(elements, prestationId);
                });
                
                console.log('[TRANSPORTEURS-VERIFICATEUR] Écouteur ajouté au bouton de vérification');
            } else {
                console.warn('[TRANSPORTEURS-VERIFICATEUR] Bouton de vérification non trouvé, utilisation de la délégation d\'événements');
            }
            
            // 2. Écouteur pour le bouton du calendrier
            if (elements.btnCalendar) {
                // D'abord, supprimer tous les écouteurs existants pour éviter les doublons
                const oldBtn = elements.btnCalendar;
                const newBtn = oldBtn.cloneNode(true);
                if (oldBtn.parentNode) {
                    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
                }
                elements.btnCalendar = newBtn;
                
                // Ajouter le nouvel écouteur
                newBtn.addEventListener('click', function(e) {
                    console.log('[TRANSPORTEURS-VERIFICATEUR] Bouton du calendrier cliqué');
                    e.preventDefault();
                    if (typeof showCalendarModal === 'function') {
                        showCalendarModal(elements);
                    } else {
                        console.error('[TRANSPORTEURS-VERIFICATEUR] Fonction showCalendarModal non disponible');
                        alert('Le module de calendrier n\'est pas disponible.');
                    }
                });
                
                console.log('[TRANSPORTEURS-VERIFICATEUR] Écouteur ajouté au bouton du calendrier');
            }
            
            // 3. Écouteur global pour la délégation d'événements (boutons ajoutés dynamiquement)
            // Utiliser un identifiant unique pour cet écouteur pour éviter les doublons
            const delegationHandlerId = 'transporteurs-verificateur-delegation';
            
            // Supprimer l'écouteur existant s'il existe
            const existingHandler = document.transporteursVerificateurDelegationHandler;
            if (existingHandler) {
                document.removeEventListener('click', existingHandler);
                console.log('[TRANSPORTEURS-VERIFICATEUR] Écouteur de délégation existant supprimé');
            }
            
            // Créer et enregistrer le nouvel écouteur
            const clickHandler = function(e) {
                // Gérer le bouton de vérification
                if (e.target && (e.target.id === 'verifier-disponibilite' || 
                                (e.target.closest && e.target.closest('#verifier-disponibilite')))) {
                    console.log('[TRANSPORTEURS-VERIFICATEUR] Bouton de vérification cliqué (délégation)');
                    e.preventDefault();
                    verifierDisponibilite(elements, prestationId);
                }
                
                // Gérer le bouton du calendrier
                if (e.target && (e.target.id === 'show-calendar-btn' || 
                                (e.target.closest && e.target.closest('#show-calendar-btn')))) {
                    console.log('[TRANSPORTEURS-VERIFICATEUR] Bouton du calendrier cliqué (délégation)');
                    e.preventDefault();
                    if (typeof showCalendarModal === 'function') {
                        showCalendarModal(elements);
                    } else {
                        console.error('[TRANSPORTEURS-VERIFICATEUR] Fonction showCalendarModal non disponible');
                        alert('Le module de calendrier n\'est pas disponible.');
                    }
                }
            };
            
            document.addEventListener('click', clickHandler);
            document.transporteursVerificateurDelegationHandler = clickHandler;
            console.log('[TRANSPORTEURS-VERIFICATEUR] Nouvel écouteur de délégation enregistré');
            
            // 4. Écouteurs pour les changements de champs qui déclenchent une vérification automatique
            const fieldsToWatch = ['dateDebutInput', 'dateFinInput', 'typeDemenagementSelect'];
            fieldsToWatch.forEach(fieldName => {
                if (elements[fieldName]) {
                    // D'abord, marquer l'élément pour éviter les doublons d'écouteurs
                    const element = elements[fieldName];
                    
                    // Supprimer l'écouteur existant s'il existe
                    if (element.transporteursVerificateurChangeHandler) {
                        element.removeEventListener('change', element.transporteursVerificateurChangeHandler);
                    }
                    
                    // Créer et enregistrer le nouvel écouteur
                    const changeHandler = function() {
                        console.log(`[TRANSPORTEURS-VERIFICATEUR] Changement détecté sur ${fieldName}`);
                        if (shouldAutoVerify(elements)) {
                            // Ajouter un délai pour éviter les vérifications multiples rapprochées
                            clearTimeout(element.transporteursVerificateurTimeout);
                            element.transporteursVerificateurTimeout = setTimeout(() => {
                                verifierDisponibilite(elements, prestationId);
                            }, 500);
                        }
                    };
                    
                    element.addEventListener('change', changeHandler);
                    element.transporteursVerificateurChangeHandler = changeHandler;
                    console.log(`[TRANSPORTEURS-VERIFICATEUR] Écouteur de changement ajouté à ${fieldName}`);
                }
            });
            
            // 5. Écouteur pour le select des transporteurs (mise à jour du compteur)
            if (elements.transporteursSelect) {
                // Supprimer l'écouteur existant s'il existe
                if (elements.transporteursSelect.transporteursVerificateurChangeHandler) {
                    elements.transporteursSelect.removeEventListener('change', 
                        elements.transporteursSelect.transporteursVerificateurChangeHandler);
                }
                
                // Créer et enregistrer le nouvel écouteur
                const changeHandler = function() {
                    console.log('[TRANSPORTEURS-VERIFICATEUR] Changement détecté sur le select des transporteurs');
                    updateTransporteurCounter(elements);
                };
                
                elements.transporteursSelect.addEventListener('change', changeHandler);
                elements.transporteursSelect.transporteursVerificateurChangeHandler = changeHandler;
                console.log('[TRANSPORTEURS-VERIFICATEUR] Écouteur de changement ajouté au select des transporteurs');
            }
            
            // 6. Vérifier l'intégration avec le module de calendrier
            if (typeof showCalendarModal === 'function') {
                console.log('[TRANSPORTEURS-VERIFICATEUR] Module de calendrier détecté, intégration activée');
            } else {
                console.log('[TRANSPORTEURS-VERIFICATEUR] Module de calendrier non détecté');
            }
            
            console.log('[TRANSPORTEURS-VERIFICATEUR] Tous les écouteurs d\'événements ont été initialisés avec succès');
        } catch (error) {
            console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur lors de l\'initialisation des écouteurs d\'événements:', error);
        }
    }

    // Vérifier si tous les champs requis sont remplis pour une vérification automatique
    function shouldAutoVerify(elements) {
        return elements.dateDebutInput && elements.dateDebutInput.value && 
               elements.dateFinInput && elements.dateFinInput.value && 
               elements.typeDemenagementSelect && elements.typeDemenagementSelect.value;
    }

    // Mettre à jour le compteur de transporteurs
    function updateTransporteurCounter(elements) {
        if (!elements.transporteurCounter || !elements.transporteursSelect) return;
        
        const selectedCount = elements.transporteursSelect.selectedOptions.length;
        let message = `${selectedCount} transporteur(s) sélectionné(s)`;
        
        if (selectedCount === 0) {
            message += " - Aucun transporteur sélectionné";
            elements.transporteurCounter.className = "mt-2 text-danger";
        } else {
            elements.transporteurCounter.className = "mt-2 text-success";
        }
        
        elements.transporteurCounter.textContent = message;
        console.log(`[TRANSPORTEURS-VERIFICATEUR] Compteur mis à jour: ${selectedCount} transporteurs`);
    }

    // Fonction utilitaire pour détecter le type de modèle (User ou Transporteur)
    function detectModelType(transporteur) {
        if (!transporteur) {
            logWarning('Impossible de détecter le type de modèle: objet transporteur null ou undefined');
            return 'unknown';
        }
        
        // Vérifier les propriétés spécifiques au modèle User
        if (transporteur.role === 'transporteur' || 
            transporteur.first_name || 
            transporteur.last_name || 
            transporteur.transporteur_info) {
            return 'user';
        }
        
        // Par défaut, considérer comme un modèle Transporteur standard
        return 'transporteur';
    }
    
    /**
     * Normalise les données d'un transporteur pour fournir une structure cohérente
     * quel que soit le type de modèle (User ou Transporteur)
     * 
     * @param {Object} transporteur - L'objet transporteur à normaliser
     * @returns {Object} Les données normalisées du transporteur
     */
    function normalizeTransporteurData(transporteur) {
        try {
            if (!transporteur) {
                logError('Tentative de normalisation d\'un transporteur null ou undefined');
                return {
                    id: null,
                    nom: 'Erreur',
                    prenom: '',
                    modelType: 'error',
                    vehicule: 'Non spécifié',
                    typeVehicule: 'Non spécifié',
                    vehiculeAdapte: false,
                    disponibleLe: null,
                    telephone: 'Non renseigné',
                    email: 'Non renseigné',
                    error: true
                };
            }
            
            // Détecter le type de modèle
            const modelType = detectModelType(transporteur);
            logDebug(`Normalisation du transporteur ${transporteur.id} de type ${modelType}`, transporteur);
            
            // Initialiser l'objet normalisé avec des valeurs par défaut
            const normalized = {
                id: transporteur.id,
                modelType: modelType,
                error: false
            };
            
            // Normaliser les données en fonction du type de modèle
            if (modelType === 'user') {
                // Modèle User
                normalized.nom = transporteur.nom || transporteur.last_name || 'Sans nom';
                normalized.prenom = transporteur.prenom || transporteur.first_name || '';
                
                // Récupérer les informations du véhicule depuis transporteur_info
                if (transporteur.transporteur_info && typeof transporteur.transporteur_info === 'object') {
                    logDebug(`Données transporteur_info disponibles pour ${transporteur.id}`, transporteur.transporteur_info);
                    normalized.vehicule = transporteur.transporteur_info.vehicule || 'Non spécifié';
                    
                    // Gérer le cas où type_vehicule est un objet ou une chaîne
                    if (transporteur.transporteur_info.type_vehicule) {
                        if (typeof transporteur.transporteur_info.type_vehicule === 'object' && transporteur.transporteur_info.type_vehicule.nom) {
                            normalized.typeVehicule = transporteur.transporteur_info.type_vehicule.nom;
                        } else if (typeof transporteur.transporteur_info.type_vehicule === 'string') {
                            normalized.typeVehicule = transporteur.transporteur_info.type_vehicule;
                        } else {
                            normalized.typeVehicule = 'Type non spécifié';
                            logWarning(`Type de véhicule de format inconnu pour le transporteur ${transporteur.id}`, transporteur.transporteur_info.type_vehicule);
                        }
                    } else {
                        normalized.typeVehicule = 'Type non spécifié';
                    }
                    
                    normalized.vehiculeAdapte = transporteur.transporteur_info.vehicule_adapte || false;
                    
                    // Récupérer la date de disponibilité
                    if (transporteur.disponible_le) {
                        normalized.disponibleLe = transporteur.disponible_le;
                        logDebug(`Date de disponibilité trouvée dans l'objet principal: ${normalized.disponibleLe}`);
                    } else if (transporteur.transporteur_info.disponible_le) {
                        normalized.disponibleLe = transporteur.transporteur_info.disponible_le;
                        logDebug(`Date de disponibilité trouvée dans transporteur_info: ${normalized.disponibleLe}`);
                    } else {
                        normalized.disponibleLe = null;
                        logWarning(`Aucune date de disponibilité trouvée pour le transporteur ${transporteur.id}`);
                    }
                } else {
                    logWarning(`transporteur_info non disponible pour le transporteur ${transporteur.id} de type user`);
                    normalized.vehicule = 'Non spécifié';
                    normalized.typeVehicule = 'Type non spécifié';
                    normalized.vehiculeAdapte = false;
                    normalized.disponibleLe = transporteur.disponible_le || null;
                }
                
                // Informations de contact
                normalized.telephone = transporteur.telephone || 
                    (transporteur.transporteur_info && transporteur.transporteur_info.telephone ? 
                    transporteur.transporteur_info.telephone : 'Non renseigné');
                normalized.email = transporteur.email || 'Non renseigné';
            } else {
                // Modèle Transporteur standard
                logDebug(`Traitement du modèle Transporteur standard pour ${transporteur.id}`, transporteur);
                normalized.nom = transporteur.nom || 'Sans nom';
                normalized.prenom = transporteur.prenom || '';
                normalized.vehicule = transporteur.vehicule || 'Non spécifié';
                
                // Gérer le cas où type_vehicule est un objet ou une chaîne
                if (transporteur.type_vehicule) {
                    if (typeof transporteur.type_vehicule === 'object' && transporteur.type_vehicule.nom) {
                        normalized.typeVehicule = transporteur.type_vehicule.nom;
                    } else if (typeof transporteur.type_vehicule === 'string') {
                        normalized.typeVehicule = transporteur.type_vehicule;
                    } else {
                        normalized.typeVehicule = 'Type non spécifié';
                        logWarning(`Type de véhicule de format inconnu pour le transporteur ${transporteur.id}`, transporteur.type_vehicule);
                    }
                } else {
                    normalized.typeVehicule = 'Type non spécifié';
                }
                
                normalized.vehiculeAdapte = transporteur.vehicule_adapte || false;
                
                // Vérifier la date de disponibilité
                if (transporteur.disponible_le) {
                    normalized.disponibleLe = transporteur.disponible_le;
                    logDebug(`Date de disponibilité trouvée pour le transporteur ${transporteur.id}: ${normalized.disponibleLe}`);
                } else {
                    normalized.disponibleLe = null;
                    logWarning(`Aucune date de disponibilité trouvée pour le transporteur ${transporteur.id}`);
                }
                
                // Informations de contact
                normalized.telephone = transporteur.telephone || 'Non renseigné';
                normalized.email = transporteur.email || 'Non renseigné';
            }
            
            return normalized;
        } catch (error) {
            logError(`Erreur lors de la normalisation des données du transporteur ${transporteur ? transporteur.id : 'inconnu'}`, error);
            // Retourner un objet par défaut en cas d'erreur
            return {
                id: transporteur ? transporteur.id : null,
                nom: 'Erreur de normalisation',
                prenom: '',
                modelType: 'error',
                vehicule: 'Non spécifié',
                typeVehicule: 'Non spécifié',
                vehiculeAdapte: false,
                disponibleLe: null,
                telephone: 'Non renseigné',
                email: 'Non renseigné',
                error: true
            };
        }
    }
    
    // Fonction principale pour vérifier la disponibilité des transporteurs
    function verifierDisponibilite(elements, prestationId) {
        try {
            logInfo('Début de la vérification des disponibilités');
            
            // Vérifier que tous les éléments nécessaires sont présents
            if (!elements) {
                logError('Éléments nécessaires manquants (objet elements est null ou undefined)');
                // Essayer d'afficher une erreur dans la page si possible
                try {
                    const errorContainer = document.getElementById('transporteurs-error-global');
                    if (errorContainer) {
                        errorContainer.innerHTML = '<div class="alert alert-danger">Erreur technique: Éléments nécessaires manquants</div>';
                        errorContainer.style.display = 'block';
                    } else {
                        // Créer un conteneur d'erreur global
                        const newErrorContainer = document.createElement('div');
                        newErrorContainer.id = 'transporteurs-error-global';
                        newErrorContainer.className = 'alert alert-danger mt-3';
                        newErrorContainer.innerHTML = 'Erreur technique: Éléments nécessaires manquants';
                        
                        // Essayer de l'insérer dans un endroit visible
                        const possibleContainers = [
                            document.querySelector('.transporteurs-container'),
                            document.querySelector('.prestation-container'),
                            document.querySelector('main'),
                            document.body
                        ];
                        
                        for (const container of possibleContainers) {
                            if (container) {
                                container.prepend(newErrorContainer);
                                break;
                            }
                        }
                    }
                } catch (displayError) {
                    console.error('Impossible d\'afficher le message d\'erreur:', displayError);
                }
                return;
            }
            
            // Déboguer les éléments disponibles
            logDebug('Elements disponibles', {
                resultsContainer: !!elements.resultsContainer,
                dateDebutInput: !!elements.dateDebutInput,
                dateFinInput: !!elements.dateFinInput,
                typeDemenagementSelect: !!elements.typeDemenagementSelect,
                transporteursSelect: !!elements.transporteursSelect,
                btnVerifier: !!elements.btnVerifier,
                btnCalendar: !!elements.btnCalendar
            });
            
            if (!elements.resultsContainer) {
                logError('Conteneur de résultats manquant');
                // Créer un conteneur temporaire pour afficher l'erreur
                const tempContainer = document.createElement('div');
                tempContainer.id = 'temp-transporteurs-error';
                tempContainer.className = 'alert alert-danger mt-3';
                tempContainer.innerHTML = 'Erreur: Conteneur de résultats non trouvé. Veuillez rafraîchir la page.';
                
                // Essayer d'insérer le conteneur temporaire dans la page
                if (elements.dateDebutInput && elements.dateDebutInput.parentNode) {
                    const parent = elements.dateDebutInput.closest('.form-group') || elements.dateDebutInput.parentNode;
                    parent.appendChild(tempContainer);
                    logInfo('Conteneur temporaire créé pour afficher l\'erreur');
                } else {
                    logError('Impossible de créer un conteneur temporaire pour afficher l\'erreur');
                }
                return;
            }
            
            // Vérifier que les champs requis sont remplis
            if (!shouldAutoVerify(elements)) {
                logWarning('Champs requis manquants');
                elements.resultsContainer.innerHTML = 
                    '<div class="alert alert-warning">' +
                        '<i class="fas fa-exclamation-triangle me-2"></i> ' +
                        '<strong>Informations manquantes</strong><br>' +
                        'Veuillez remplir tous les champs obligatoires (dates et type de déménagement)' +
                    '</div>';
                return;
            }
            
            // Log des valeurs pour le débogage
            logDebug('Valeurs des champs', {
                dateDebut: elements.dateDebutInput.value,
                dateFin: elements.dateFinInput.value,
                typeDemenagementId: elements.typeDemenagementSelect.value,
                prestationId: prestationId || 'non défini'
            });
            
            // Afficher un indicateur de chargement
            elements.resultsContainer.innerHTML = 
                '<div class="d-flex justify-content-center align-items-center p-4">' +
                    '<div class="spinner-border text-primary me-3" role="status">' +
                        '<span class="visually-hidden">Chargement...</span>' +
                    '</div>' +
                    '<div>Recherche des transporteurs disponibles...</div>' +
                '</div>';
            
            // Sauvegarder les transporteurs déjà sélectionnés
            const selectedIds = [];
            if (elements.transporteursSelect) {
                try {
                    // Vérifier si selectedOptions est disponible (navigateurs modernes)
                    if (elements.transporteursSelect.selectedOptions) {
                        for (let i = 0; i < elements.transporteursSelect.selectedOptions.length; i++) {
                            const option = elements.transporteursSelect.selectedOptions[i];
                            if (option && option.value) {
                                // Gérer les ID qui pourraient être des chaînes ou des nombres
                                const value = option.value.trim();
                                const id = parseInt(value, 10);
                                
                                if (!isNaN(id)) {
                                    selectedIds.push(id);
                                    
                                    // Ajouter des informations supplémentaires pour le débogage
                                    if (option.dataset && option.dataset.modelType) {
                                        logDebug(`Transporteur sélectionné ${id} de type ${option.dataset.modelType}`);
                                    }
                                } else {
                                    logWarning(`Valeur non numérique trouvée dans les options sélectionnées: '${value}'`);
                                }
                            }
                        }
                    } else {
                        // Fallback pour les navigateurs plus anciens
                        const options = elements.transporteursSelect.options;
                        for (let i = 0; i < options.length; i++) {
                            if (options[i].selected && options[i].value) {
                                const value = options[i].value.trim();
                                const id = parseInt(value, 10);
                                
                                if (!isNaN(id)) {
                                    selectedIds.push(id);
                                } else {
                                    logWarning(`Valeur non numérique trouvée dans les options sélectionnées (fallback): '${value}'`);
                                }
                            }
                        }
                    }
                    
                    if (selectedIds.length > 0) {
                        logInfo(`${selectedIds.length} transporteurs déjà sélectionnés: ${selectedIds.join(', ')}`);
                    } else {
                        logInfo('Aucun transporteur sélectionné');
                    }
                } catch (selectError) {
                    logError('Erreur lors de la récupération des transporteurs sélectionnés', selectError);
                }
            } else {
                logWarning('Select des transporteurs non disponible');
            }
            
            // Préparer les données à envoyer
            const formData = new FormData();
            formData.append('date_debut', elements.dateDebutInput.value);
            formData.append('date_fin', elements.dateFinInput.value);
            formData.append('type_demenagement_id', elements.typeDemenagementSelect.value);
            
            // Si on est en mode édition, ajouter l'ID de la prestation
            if (prestationId) {
                formData.append('prestation_id', prestationId);
                logInfo(`Mode édition: prestation_id=${prestationId}`);
            }
            
            // Créer une requête AJAX avec gestion d'erreur améliorée
            try {
                const xhr = new XMLHttpRequest();
                
                // Vérifier si l'API est disponible via une requête OPTIONS avant d'envoyer les données
                const checkXhr = new XMLHttpRequest();
                checkXhr.open('OPTIONS', '/check-disponibilite', false); // Synchrone pour simplifier
                try {
                    checkXhr.send();
                    if (checkXhr.status >= 400) {
                        logError(`L'API /check-disponibilite n'est pas disponible (statut: ${checkXhr.status})`);
                        displayError(elements.resultsContainer, `L'API de vérification des disponibilités n'est pas disponible (erreur ${checkXhr.status}). Veuillez contacter l'administrateur.`);
                        return;
                    }
                } catch (checkError) {
                    logWarning('Erreur lors de la vérification de disponibilité de l\'API', checkError);
                    // Continuer malgré l'erreur de vérification
                }
                
                xhr.open('POST', '/check-disponibilite', true);
                
                // Définir un timeout pour la requête
                xhr.timeout = 30000; // 30 secondes
                
                // Définir ce qui se passe en cas de succès
                xhr.onload = function() {
                    logDebug(`Réponse reçue avec statut: ${xhr.status}`);
                    
                    if (xhr.status === 200) {
                        try {
                            // Vérifier que la réponse n'est pas vide
                            if (!xhr.responseText) {
                                logError('Réponse vide reçue du serveur');
                                displayError(elements.resultsContainer, 'Réponse vide reçue du serveur');
                                return;
                            }
                            
                            // Essayer de parser la réponse JSON
                            let response;
                            try {
                                response = JSON.parse(xhr.responseText);
                            } catch (parseError) {
                                logError('Erreur lors du parsing de la réponse JSON', parseError);
                                logError('Réponse brute:', xhr.responseText);
                                displayError(elements.resultsContainer, 'Erreur lors du traitement de la réponse: ' + parseError.message);
                                return;
                            }
                            
                            logInfo('Réponse API parsée avec succès', response);
                            
                            // Traiter la réponse
                            processApiResponse(response, elements, selectedIds);
                        } catch (responseError) {
                            logError('Erreur lors du traitement de la réponse', responseError);
                            displayError(elements.resultsContainer, 'Erreur lors du traitement de la réponse: ' + responseError.message);
                        }
                    } else {
                        logError(`Erreur HTTP: ${xhr.status}`);
                        let errorMessage = `Erreur ${xhr.status} lors de la communication avec le serveur`;
                        
                        // Essayer d'extraire un message d'erreur plus précis
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            if (errorResponse && errorResponse.error) {
                                errorMessage += `: ${errorResponse.error}`;
                                logError('Message d\'erreur du serveur:', errorResponse.error);
                            }
                        } catch (e) {
                            // Ignorer les erreurs de parsing
                            logWarning('Impossible de parser la réponse d\'erreur', e);
                        }
                        
                        displayError(elements.resultsContainer, errorMessage);
                    }
                };
                
                // Définir ce qui se passe en cas d'erreur réseau
                xhr.onerror = function(event) {
                    logError('Erreur réseau lors de la requête', event);
                    displayError(elements.resultsContainer, 'Erreur réseau lors de la communication avec le serveur. Vérifiez votre connexion.');
                };
                
                // Définir ce qui se passe en cas de timeout
                xhr.ontimeout = function() {
                    logError('Timeout de la requête');
                    displayError(elements.resultsContainer, 'La requête a pris trop de temps. Veuillez réessayer.');
                };
                
                // Ajouter un gestionnaire d'abort
                xhr.onabort = function() {
                    logWarning('Requête annulée');
                    displayError(elements.resultsContainer, 'La requête a été annulée.');
                };
                
                // Envoyer la requête
                logInfo('Envoi de la requête AJAX...');
                xhr.send(formData);
                logInfo('Requête envoyée, en attente de réponse...');
            } catch (xhrError) {
                logError('Erreur lors de la création ou l\'envoi de la requête XHR', xhrError);
                displayError(elements.resultsContainer, 'Erreur technique lors de la communication avec le serveur: ' + xhrError.message);
            }
        } catch (error) {
            logError('Exception non gérée dans verifierDisponibilite', error);
            try {
                if (elements && elements.resultsContainer) {
                    displayError(elements.resultsContainer, 'Erreur inattendue: ' + error.message);
                } else {
                    // Essayer d'afficher l'erreur quelque part
                    const errorContainer = document.createElement('div');
                    errorContainer.className = 'alert alert-danger mt-3';
                    errorContainer.textContent = 'Erreur inattendue: ' + error.message;
                    
                    // Trouver un endroit où afficher l'erreur
                    const possibleContainers = [
                        document.querySelector('#transporteurs-disponibles-resultats'),
                        document.querySelector('.card-body'),
                        document.querySelector('main'),
                        document.body
                    ];
                    
                    for (const container of possibleContainers) {
                        if (container) {
                            container.appendChild(errorContainer);
                            break;
                        }
                    }
                }
            } catch (displayError) {
                // Dernier recours: alert
                alert('Erreur critique lors de la vérification des disponibilités: ' + error.message);
            }
        }
    }

    // Traiter la réponse de l'API
    function processApiResponse(response, elements, selectedIds) {
        try {
            logInfo('Traitement de la réponse API');
            
            // Vérifier si elements est défini
            if (!elements) {
                logError('Objet elements non défini dans processApiResponse');
                // Essayer d'afficher une erreur globale
                try {
                    const errorContainer = document.getElementById('transporteurs-error-global') || 
                                          document.createElement('div');
                    errorContainer.id = 'transporteurs-error-global';
                    errorContainer.className = 'alert alert-danger mt-3';
                    errorContainer.innerHTML = 'Erreur technique: Impossible de traiter la réponse API';
                    
                    if (!errorContainer.parentNode) {
                        document.body.prepend(errorContainer);
                    }
                } catch (displayError) {
                    console.error('Impossible d\'afficher le message d\'erreur global:', displayError);
                }
                return;
            }
            
            // Vérifier si resultsContainer est disponible
            if (!elements.resultsContainer) {
                logError('Conteneur de résultats non disponible dans processApiResponse');
                return;
            }
            
            // Vérifier si la réponse est valide
            if (!response) {
                logError('Réponse API invalide (null ou undefined)');
                displayError(elements.resultsContainer, 'Réponse invalide du serveur');
                return;
            }
            
            // Déboguer la réponse complète
            logDebug('Réponse API complète', response);
            
            // Vérifier si la réponse contient une erreur
            if (response.error || response.success === false) {
                // Gérer le cas des erreurs vides
                if (response.error) {
                    if (typeof response.error === 'object' && Object.keys(response.error).length === 0) {
                        logError('Erreur vide retournée par l\'API', {
                            errorType: typeof response.error,
                            errorContent: JSON.stringify(response.error)
                        });
                        displayError(elements.resultsContainer, 'Une erreur s\'est produite, mais aucun détail n\'est disponible. Veuillez vérifier les logs pour plus d\'informations.');
                    } else if (typeof response.error === 'string' && response.error.trim() === '') {
                        // Gérer les chaînes vides
                        logError('Erreur vide (chaîne vide) retournée par l\'API');
                        displayError(elements.resultsContainer, 'Une erreur s\'est produite, mais aucun message n\'a été fourni.');
                    } else {
                        logError('Erreur retournée par l\'API:', response.error);
                        displayError(elements.resultsContainer, `Erreur: ${response.error}`);
                    }
                } else {
                    logError('La réponse indique un échec (success: false) sans message d\'erreur spécifique');
                    displayError(elements.resultsContainer, 'La vérification a échoué sans message d\'erreur spécifique.');
                }
                return;
            }
            
            // Vérifier la structure de la nouvelle API
            // La nouvelle API utilise 'transporteurs' au lieu de 'transporteurs_disponibles'
            const transporteursArray = response.transporteurs || [];
            const soonAvailableArray = response.soon_available || [];
            
            logInfo(`Réponse API: ${transporteursArray.length} transporteurs disponibles, ${soonAvailableArray.length} bientôt disponibles`);
            
            // Vérifier si transporteurs est un tableau
            if (!Array.isArray(transporteursArray)) {
                logError('La propriété "transporteurs" n\'est pas un tableau', {
                    type: typeof transporteursArray,
                    value: transporteursArray
                });
                displayError(elements.resultsContainer, 'Format de réponse incorrect ("transporteurs" n\'est pas un tableau)');
                return;
            }
            
            // Normaliser et analyser les transporteurs pour résoudre la confusion entre modèles User et Transporteur
            const modelTypes = {};
            let transporteursValides = 0;
            let transporteursInvalides = 0;
            
            // Tableau pour stocker les transporteurs normalisés
            const transporteursNormalises = [];
            
            transporteursArray.forEach((t, index) => {
                if (!t) {
                    logWarning(`Transporteur à l'index ${index} est null ou undefined`);
                    transporteursInvalides++;
                    return;
                }
                
                if (typeof t !== 'object') {
                    logWarning(`Transporteur à l'index ${index} n'est pas un objet valide:`, t);
                    transporteursInvalides++;
                    return;
                }
                
                try {
                    // Normaliser les données du transporteur pour résoudre la confusion entre modèles
                    const transporteurNormalise = normalizeTransporteurData(t);
                    
                    // Ajouter au tableau des transporteurs normalisés
                    transporteursNormalises.push(transporteurNormalise);
                    
                    // Compter les types de modèles pour les statistiques
                    const type = transporteurNormalise.modelType;
                    modelTypes[type] = (modelTypes[type] || 0) + 1;
                    transporteursValides++;
                    
                    // Vérifier si les propriétés essentielles sont présentes
                    if (!transporteurNormalise.id) {
                        logWarning(`Transporteur sans ID détecté à l'index ${index}, type: ${type}`, transporteurNormalise);
                    }
                } catch (error) {
                    logError(`Erreur lors de la normalisation du transporteur à l'index ${index}:`, error);
                    transporteursInvalides++;
                }
            });
            
            logInfo(`Types de modèles détectés dans la réponse: ${JSON.stringify(modelTypes)}. Transporteurs valides: ${transporteursValides}, invalides: ${transporteursInvalides}`);
            
            // Utiliser les transporteurs normalisés au lieu des données brutes
            const transporteursDisponibles = transporteursNormalises;
            
            logInfo(`${transporteursDisponibles.length} transporteurs disponibles trouvés sur ${response.transporteurs.length} transporteurs au total`);
            
            // Formater les dates pour l'affichage en utilisant notre fonction formatDate
            try {
                // Utiliser notre fonction formatDate pour gérer différents formats de date
                const dateDebutStr = formatDate(elements.dateDebutInput.value, 'fr-FR');
                const dateFinStr = formatDate(elements.dateFinInput.value, 'fr-FR');
                
                logInfo(`Dates formatées pour l'affichage: ${dateDebutStr} - ${dateFinStr}`);
                
                // Afficher le résumé
                // Utiliser la nouvelle signature de displaySummary avec les transporteurs bientôt disponibles normalisés
                displaySummary(elements.resultsContainer, transporteursDisponibles, soonAvailableNormalises || [], dateDebutStr, dateFinStr);
            } catch (dateError) {
                logError('Erreur lors du formatage des dates:', dateError);
                // Continuer avec l'affichage sans les dates
                // Utiliser la nouvelle signature de displaySummary avec un tableau vide pour les transporteurs bientôt disponibles
                displaySummary(elements.resultsContainer, transporteursDisponibles, [], 'Date non valide', 'Date non valide');
            }
            
            // Mettre à jour la liste des transporteurs
            try {
                if (elements.transporteursSelect) {
                    updateTransporteursList(elements.transporteursSelect, transporteursDisponibles, selectedIds);
                } else {
                    console.warn('[TRANSPORTEURS-VERIFICATEUR] Élément transporteursSelect non trouvé pour la mise à jour');
                }
            } catch (listError) {
                console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur lors de la mise à jour de la liste des transporteurs:', listError);
            }
            
            // Afficher les transporteurs bientôt disponibles
            try {
                if (response.hasOwnProperty('soon_available') && Array.isArray(response.soon_available)) {
                    // Normaliser les transporteurs bientôt disponibles comme nous le faisons pour les transporteurs disponibles
                    const soonAvailableNormalises = [];
                    const soonAvailableModelTypes = {};
                    let soonAvailableValides = 0;
                    let soonAvailableInvalides = 0;
                    
                    response.soon_available.forEach((t, index) => {
                        if (!t) {
                            logWarning(`Transporteur bientôt disponible à l'index ${index} est null ou undefined`);
                            soonAvailableInvalides++;
                            return;
                        }
                        
                        if (typeof t !== 'object') {
                            logWarning(`Transporteur bientôt disponible à l'index ${index} n'est pas un objet valide:`, t);
                            soonAvailableInvalides++;
                            return;
                        }
                        
                        try {
                            // Normaliser les données du transporteur pour résoudre la confusion entre modèles
                            const transporteurNormalise = normalizeTransporteurData(t);
                            
                            // Ajouter au tableau des transporteurs normalisés
                            soonAvailableNormalises.push(transporteurNormalise);
                            
                            // Compter les types de modèles pour les statistiques
                            const type = transporteurNormalise.modelType;
                            soonAvailableModelTypes[type] = (soonAvailableModelTypes[type] || 0) + 1;
                            soonAvailableValides++;
                        } catch (error) {
                            logError(`Erreur lors de la normalisation du transporteur bientôt disponible à l'index ${index}:`, error);
                            soonAvailableInvalides++;
                        }
                    });
                    
                    logInfo(`Types de modèles détectés dans les transporteurs bientôt disponibles: ${JSON.stringify(soonAvailableModelTypes)}. Valides: ${soonAvailableValides}, invalides: ${soonAvailableInvalides}`);
                    
                    // Passer les transporteurs normalisés à la fonction d'affichage
                    displaySoonAvailableTransporteurs(elements, soonAvailableNormalises);
                } else {
                    logInfo('Aucune information sur les transporteurs bientôt disponibles');
                    if (elements.bientotDisponiblesDiv) {
                        elements.bientotDisponiblesDiv.style.display = 'none';
                    }
                }
            } catch (soonError) {
                logError('Erreur lors de l\'affichage des transporteurs bientôt disponibles:', soonError);
            }
            
            // Mettre à jour le compteur
            try {
                updateTransporteurCounter(elements);
            } catch (counterError) {
                console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur lors de la mise à jour du compteur:', counterError);
            }
            
            console.log('[TRANSPORTEURS-VERIFICATEUR] Traitement de la réponse API terminé avec succès');
        } catch (error) {
            console.error('[TRANSPORTEURS-VERIFICATEUR] Erreur non gérée lors du traitement de la réponse API:', error);
            displayError(elements.resultsContainer, 'Erreur lors du traitement des résultats: ' + error.message);
        }
    }

    /**
     * Détecte si l'objet transporteur est un modèle User ou Transporteur
     * @param {Object} transporteur - L'objet transporteur à analyser
     * @return {string} - 'user' ou 'transporteur'
     */
    function detectModelType(transporteur) {
        try {
            // Vérifier si c'est un objet valide
            if (!transporteur || typeof transporteur !== 'object') {
                logWarning('Impossible de détecter le type de modèle: objet invalide');
                return 'unknown';
            }
            
            // Utiliser l'ID pour le débogage si disponible
            const transporteurId = transporteur.id || 'sans ID';
            
            // Détection par propriétés discriminantes fortes
            if (transporteur.hasOwnProperty('transporteur_info') && typeof transporteur.transporteur_info === 'object') {
                logDebug(`Transporteur ${transporteurId} identifié comme 'user' par la présence de transporteur_info`);
                return 'user';
            }
            
            if (transporteur.hasOwnProperty('role') && transporteur.role === 'transporteur') {
                logDebug(`Transporteur ${transporteurId} identifié comme 'user' par role='transporteur'`);
                return 'user';
            }
            
            // Indices pour détecter un modèle User
            const userIndicators = [
                // Propriétés spécifiques au modèle User
                transporteur.hasOwnProperty('username'),
                transporteur.hasOwnProperty('first_name') && transporteur.hasOwnProperty('last_name'),
                transporteur.hasOwnProperty('email') && transporteur.email && transporteur.email.includes('@'),
                transporteur.hasOwnProperty('is_active'),
                transporteur.hasOwnProperty('date_joined')
            ];
            
            // Indices pour détecter un modèle Transporteur
            const transporteurIndicators = [
                // Propriétés spécifiques au modèle Transporteur
                transporteur.hasOwnProperty('vehicule') && transporteur.vehicule,
                transporteur.hasOwnProperty('type_vehicule'),
                transporteur.hasOwnProperty('vehicule_adapte') !== undefined,
                transporteur.hasOwnProperty('capacite') && typeof transporteur.capacite === 'number',
                transporteur.hasOwnProperty('disponible_le') && !transporteur.hasOwnProperty('transporteur_info')
            ];
            
            // Compter les indices pour chaque type avec pondération
            const userScore = userIndicators.filter(Boolean).length * 1.5; // Pondération plus forte pour user
            const transporteurScore = transporteurIndicators.filter(Boolean).length;
            
            // Déboguer les scores et les propriétés détectées
            const userProps = userIndicators.map((val, idx) => val ? Object.keys(transporteur)[idx] : null).filter(Boolean);
            const transporteurProps = transporteurIndicators.map((val, idx) => val ? Object.keys(transporteur)[idx] : null).filter(Boolean);
            
            logDebug(`Détection du type de modèle pour ${transporteurId}`, {
                userScore,
                transporteurScore,
                userProps,
                transporteurProps,
                objectKeys: Object.keys(transporteur).slice(0, 10) // Limiter à 10 clés pour la lisibilité
            });
            
            // Décider du type en fonction du score le plus élevé
            if (userScore > transporteurScore) {
                logDebug(`Transporteur ${transporteurId} identifié comme 'user' par score (${userScore} > ${transporteurScore})`);
                return 'user';
            } else if (transporteurScore > 0) {
                logDebug(`Transporteur ${transporteurId} identifié comme 'transporteur' par score (${transporteurScore} >= ${userScore})`);
                return 'transporteur';
            } else {
                // Vérification supplémentaire basée sur la structure des données
                if (transporteur.hasOwnProperty('nom') && transporteur.hasOwnProperty('prenom') && 
                    !transporteur.hasOwnProperty('first_name') && !transporteur.hasOwnProperty('last_name')) {
                    logDebug(`Transporteur ${transporteurId} identifié comme 'transporteur' par la présence de nom/prenom sans first_name/last_name`);
                    return 'transporteur';
                } else if (transporteur.hasOwnProperty('first_name') && transporteur.hasOwnProperty('last_name')) {
                    logDebug(`Transporteur ${transporteurId} identifié comme 'user' par la présence de first_name/last_name`);
                    return 'user';
                } else {
                    logWarning(`Type de modèle indéterminé pour ${transporteurId}, utilisation du type par défaut: transporteur`);
                    return 'transporteur'; // Type par défaut
                }
            }
        } catch (error) {
            const transporteurId = transporteur && transporteur.id ? transporteur.id : 'sans ID';
            logError(`Erreur lors de la détection du type de modèle pour ${transporteurId}`, error);
            return 'transporteur'; // Type par défaut en cas d'erreur
        }
    }
    
    /**
     * Normalise les données d'un transporteur pour une structure cohérente
     * indépendamment du modèle source (User ou Transporteur)
     * @param {Object} transporteur - L'objet transporteur à normaliser
     * @return {Object} - Objet normalisé avec une structure cohérente
     */
    function normalizeTransporteurData(transporteur) {
        try {
            // Vérifier si c'est un objet valide
            if (!transporteur || typeof transporteur !== 'object') {
                logWarning('Impossible de normaliser les données: objet invalide');
                return {};
            }
            
            // Détecter le type de modèle
            const modelType = detectModelType(transporteur);
            logDebug(`Normalisation des données pour un transporteur de type ${modelType}`);
            
            // Créer un objet normalisé avec une structure cohérente
            const normalized = {
                // Identifiants
                id: transporteur.id || transporteur.user_id || null,
                userId: modelType === 'user' ? transporteur.id : (transporteur.user_id || null),
                transporteurId: modelType === 'transporteur' ? transporteur.id : null,
                
                // Informations personnelles
                nom: modelType === 'user' 
                    ? (transporteur.last_name || transporteur.nom || '') 
                    : (transporteur.nom || ''),
                prenom: modelType === 'user' 
                    ? (transporteur.first_name || transporteur.prenom || '') 
                    : (transporteur.prenom || ''),
                nomComplet: '',  // Sera calculé ci-dessous
                
                // Coordonnées
                email: transporteur.email || (transporteur.user ? transporteur.user.email : null) || '',
                telephone: transporteur.telephone || transporteur.tel || 
                          (transporteur.transporteur_info ? transporteur.transporteur_info.telephone : null) || '',
                
                // Informations sur le véhicule
                vehicule: transporteur.vehicule || 
                          (transporteur.transporteur_info ? transporteur.transporteur_info.vehicule : null) || '',
                typeVehicule: transporteur.type_vehicule || 
                             (transporteur.transporteur_info ? transporteur.transporteur_info.type_vehicule : null) || '',
                capacite: transporteur.capacite || 
                         (transporteur.transporteur_info ? transporteur.transporteur_info.capacite : null) || 0,
                
                // Disponibilités
                disponible: transporteur.disponible === true || transporteur.disponible === 'true' || false,
                disponibleLe: transporteur.disponible_le || transporteur.date_disponible || null,
                
                // Métadonnées
                modelType: modelType,
                sourceData: transporteur  // Garder les données source pour référence
            };
            
            // Calculer le nom complet
            normalized.nomComplet = [normalized.prenom, normalized.nom]
                .filter(Boolean)
                .join(' ')
                .trim() || 'Transporteur sans nom';
            
            return normalized;
        } catch (error) {
            logError('Erreur lors de la normalisation des données du transporteur', error);
            return {
                id: transporteur.id || null,
                nomComplet: 'Erreur de normalisation',
                modelType: 'error',
                sourceData: transporteur
            };
        }
    }

    // Formater une date en gérant différents formats possibles
    function formatDate(dateStr, format = 'fr-FR') {
        if (!dateStr) return 'Non spécifié';
        
        try {
            // Essayer différents formats de date
            let date;
            
            // 1. Essayer d'abord le format standard ISO
            date = new Date(dateStr);
            
            // 2. Si ça ne fonctionne pas, essayer le format DD/MM/YYYY
            if (isNaN(date.getTime()) && typeof dateStr === 'string') {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    // Format français: jour/mois/année
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            
            // 3. Si ça ne fonctionne toujours pas, essayer le format DD-MM-YYYY
            if (isNaN(date.getTime()) && typeof dateStr === 'string') {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            
            // Vérifier si la date est valide
            if (!isNaN(date.getTime())) {
                // Formater la date selon le format demandé
                if (format === 'fr-FR') {
                    return date.toLocaleDateString('fr-FR');
                } else if (format === 'iso') {
                    return date.toISOString().split('T')[0];
                } else if (format === 'relative') {
                    // Calculer la différence en jours
                    const aujourdhui = new Date();
                    const diffJours = Math.ceil((date - aujourdhui) / (1000 * 60 * 60 * 24));
                    
                    let dateFormatee = date.toLocaleDateString('fr-FR');
                    
                    if (diffJours > 0) {
                        return `${dateFormatee} (dans ${diffJours} jour${diffJours > 1 ? 's' : ''})`;
                    } else if (diffJours === 0) {
                        return `${dateFormatee} (aujourd'hui)`;
                    } else {
                        return `${dateFormatee} (il y a ${Math.abs(diffJours)} jour${Math.abs(diffJours) > 1 ? 's' : ''})`;
                    }
                }
                
                // Par défaut, retourner la date au format local
                return date.toLocaleDateString();
            }
            
            // Si aucun format ne fonctionne, retourner la chaîne d'origine
            logWarning(`Format de date non reconnu: ${dateStr}`);
            return dateStr;
        } catch (error) {
            logError('Erreur lors du formatage de la date:', error);
            return dateStr;
        }
    }
    
    // Afficher une erreur
    function displayError(container, message) {
        if (!container) {
            logError('Impossible d\'afficher l\'erreur: container est null ou undefined');
            return;
        }
        
        logError('Affichage d\'une erreur:', message);
        
        // Ajouter un ID unique pour pouvoir référencer cette erreur plus tard
        const errorId = 'error-' + Date.now();
        
        container.innerHTML = 
            `<div class="alert alert-danger" id="${errorId}">` +
                '<div class="d-flex align-items-start">' +
                    '<div class="me-3">' +
                        '<i class="fas fa-exclamation-circle fa-2x"></i>' +
                    '</div>' +
                    '<div class="w-100">' +
                        '<div class="d-flex justify-content-between align-items-center">' +
                            '<h5 class="alert-heading mb-0">Erreur</h5>' +
                            '<button type="button" class="btn-close btn-sm" aria-label="Fermer" ' +
                                `onclick="document.getElementById('${errorId}').remove()"></button>` +
                        '</div>' +
                        `<p class="mb-0 mt-2">${message}</p>` +
                        '<p class="mt-2 mb-0 small">Si le problème persiste, veuillez contacter l\'administrateur.</p>' +
                    '</div>' +
                '</div>' +
            '</div>';
            
        // Ajouter un événement pour enregistrer les erreurs dans la console
        try {
            if (typeof window._transporteursErrors === 'undefined') {
                window._transporteursErrors = [];
            }
            window._transporteursErrors.push({
                id: errorId,
                message: message,
                timestamp: new Date().toISOString(),
                container: container.id || 'container-sans-id'
            });
        } catch (e) {
            // Ignorer les erreurs lors de l'enregistrement
        }
    }

    // Afficher le résumé des transporteurs disponibles
    function displaySummary(container, transporteursDisponibles, transporteursBientotDisponibles, dateDebutStr, dateFinStr) {
        try {
            if (!container) {
                logError('Conteneur non défini dans displaySummary');
                return;
            }
            
            const count = Array.isArray(transporteursDisponibles) ? transporteursDisponibles.length : 0;
            const countBientot = Array.isArray(transporteursBientotDisponibles) ? transporteursBientotDisponibles.length : 0;
            
            logInfo(`Affichage du résumé: ${count} transporteurs disponibles et ${countBientot} bientôt disponibles pour la période ${dateDebutStr} - ${dateFinStr}`);
            
            let statusClass = 'info';
            let statusIcon = 'info-circle';
            let statusMessage = '';
            
            if (count > 0) {
                statusClass = 'success';
                statusIcon = 'check-circle';
                statusMessage = 'Transporteurs disponibles pour votre déménagement';
            } else if (countBientot > 0) {
                statusClass = 'warning';
                statusIcon = 'clock';
                statusMessage = 'Transporteurs bientôt disponibles';
            } else {
                statusClass = 'danger';
                statusIcon = 'exclamation-circle';
                statusMessage = 'Aucun transporteur disponible pour ces dates';
            }
            
            // Construire le message avec plus d'informations
            let message = 
                `<div class="alert alert-${statusClass} mb-3">` +
                    '<div class="d-flex align-items-center">' +
                        '<div class="me-3">' +
                            `<i class="fas fa-${statusIcon} fa-2x"></i>` +
                        '</div>' +
                        '<div class="flex-grow-1">' +
                            '<h5 class="mb-1">';
            
            if (count > 0) {
                message += `${count} transporteur${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}`;
                if (countBientot > 0) {
                    message += ` et ${countBientot} bientôt disponible${countBientot > 1 ? 's' : ''}`;
                }
            } else if (countBientot > 0) {
                message += `${countBientot} transporteur${countBientot > 1 ? 's' : ''} bientôt disponible${countBientot > 1 ? 's' : ''}`;
            } else {
                message += 'Aucun transporteur disponible';
            }
            
            message += '</h5>' +
                            `<p class="mb-0">Période du ${dateDebutStr} au ${dateFinStr}</p>`;
            
            // Ajouter un message d'aide
            if (count === 0 && countBientot === 0) {
                message += `<div class="mt-2 small">Suggestions: <ul class="mb-0">
                    <li>Essayez de modifier les dates de votre déménagement</li>
                    <li>Essayez un autre type de véhicule</li>
                    <li>Contactez-nous pour une assistance personnalisée</li>
                </ul></div>`;
            } else if (count === 0 && countBientot > 0) {
                message += `<div class="mt-2 small">Suggestions: <ul class="mb-0">
                    <li>Consultez la liste des transporteurs bientôt disponibles ci-dessous</li>
                    <li>Modifiez vos dates pour correspondre à leurs disponibilités</li>
                    <li>Ou contactez-nous pour une assistance personnalisée</li>
                </ul></div>`;
            } else {
                message += `<div class="mt-2 small text-muted">Sélectionnez un ou plusieurs transporteurs dans la liste ci-dessous</div>`;
            }
            
            message += '</div>' +
                    '</div>' +
                '</div>';
            
            // Ajouter des badges pour indiquer le statut
            message += `<div class="mb-3">`;
            
            if (count > 0) {
                message += `<span class="badge bg-success me-2"><i class="fas fa-check-circle me-1"></i> ${count} disponible${count > 1 ? 's' : ''}</span>`;
            }
            
            if (countBientot > 0) {
                message += `<span class="badge bg-warning text-dark me-2"><i class="fas fa-clock me-1"></i> ${countBientot} bientôt disponible${countBientot > 1 ? 's' : ''}</span>`;
            }
            
            if (count === 0 && countBientot === 0) {
                message += `<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> Aucun transporteur disponible</span>`;
            }
            
            message += `</div>`;
            
            // Statistiques sur les types de modèles (pour débogage)
            if (count > 0 || countBientot > 0) {
                const modelStats = {};
                
                // Compter les types de modèles disponibles
                if (transporteursDisponibles && transporteursDisponibles.length > 0) {
                    transporteursDisponibles.forEach(t => {
                        const type = t.model_type || 'inconnu';
                        modelStats[type] = (modelStats[type] || 0) + 1;
                    });
                }
                
                // Ajouter les statistiques en commentaire HTML (invisible pour l'utilisateur)
                message += `<!-- Stats des modèles: ${JSON.stringify(modelStats)} -->`;
            }
            
            container.innerHTML = message;
            logDebug('Résumé affiché avec succès');
        } catch (error) {
            logError('Erreur lors de l\'affichage du résumé:', error);
            // Fallback en cas d'erreur
            try {
                const count = Array.isArray(transporteursDisponibles) ? transporteursDisponibles.length : 0;
                container.innerHTML = `<div class="alert alert-warning">Résultat: ${count} transporteur(s) disponible(s) du ${dateDebutStr} au ${dateFinStr}</div>`;
            } catch (fallbackError) {
                logError('Erreur lors de l\'affichage du message de secours:', fallbackError);
            }
        }
    }

    // Mettre à jour la liste des transporteurs
    function updateTransporteursList(selectElement, transporteurs, selectedIds) {
        try {
            // Vérifier que l'élément select existe
            if (!selectElement) {
                logError('Élément select non trouvé');
                return;
            }
            
            // Vérifier que selectedIds est un tableau
            if (!Array.isArray(selectedIds)) {
                logWarning('selectedIds n\'est pas un tableau, initialisation à []');
                selectedIds = [];
            }
            
            // Déboguer les transporteurs reçus
            logDebug(`Mise à jour de la liste avec ${transporteurs ? transporteurs.length : 0} transporteurs`, {
                transporteursCount: transporteurs ? transporteurs.length : 0,
                selectedIdsCount: selectedIds.length,
                selectedIds: selectedIds
            });
            
            // Activer le select
            selectElement.disabled = false;
            
            // Vider la liste
            selectElement.innerHTML = '';
            
            // Si aucun transporteur disponible
            if (!transporteurs || !Array.isArray(transporteurs) || transporteurs.length === 0) {
                console.log('[TRANSPORTEURS-VERIFICATEUR] Aucun transporteur disponible à afficher');
                // Ajouter une option par défaut
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.innerHTML = 'Aucun transporteur disponible';
                defaultOption.disabled = true;
                selectElement.appendChild(defaultOption);
                selectElement.disabled = true;
                return;
            }
            
            // Ajouter une option par défaut
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.innerHTML = '-- Sélectionnez un transporteur --';
            defaultOption.disabled = true;
            defaultOption.selected = selectedIds.length === 0;
            selectElement.appendChild(defaultOption);
            
            // Compteur de transporteurs ajoutés
            let transporteursAjoutes = 0;
            
            // Ajouter les transporteurs disponibles
            transporteurs.forEach(function(transporteur) {
                try {
                    // Vérifier que le transporteur est un objet valide
                    if (!transporteur || typeof transporteur !== 'object') {
                        logError('Transporteur invalide:', transporteur);
                        return;
                    }
                    
                    // Normaliser les données du transporteur pour résoudre la confusion entre modèles
                    const transporteurNormalise = normalizeTransporteurData(transporteur);
                    
                    // Vérifier que le transporteur a un ID
                    if (!transporteurNormalise.id) {
                        logError('Transporteur sans ID après normalisation:', transporteurNormalise);
                        return;
                    }
                    
                    // Créer l'option pour le select
                    const option = document.createElement('option');
                    option.value = transporteurNormalise.id;
                    option.dataset.modelType = transporteurNormalise.modelType;
                    
                    // Utiliser les données normalisées pour construire le libellé
                    let optionLabel = '';
                    
                    // Nom complet du transporteur
                    if (transporteurNormalise.prenom || transporteurNormalise.nom) {
                        optionLabel = `${transporteurNormalise.prenom} ${transporteurNormalise.nom}`.trim();
                    } else {
                        optionLabel = `Transporteur #${transporteurNormalise.id}`;
                    }
                    
                    // Informations sur le véhicule
                    let infoVehicule = transporteurNormalise.vehicule || 'Véhicule non spécifié';
                    
                    // Ajouter le type de véhicule s'il est disponible
                    if (transporteurNormalise.typeVehicule) {
                        infoVehicule += ` (${transporteurNormalise.typeVehicule})`;
                    }
                    
                    optionLabel += ` - ${infoVehicule}`;
                    option.innerHTML = optionLabel;
                    
                    // Utiliser la propriété vehiculeAdapte normalisée
                    const vehiculeAdapte = transporteurNormalise.vehiculeAdapte;
                    
                    // Style spécial pour les véhicules adaptés
                    if (vehiculeAdapte === true) {
                        option.innerHTML += ' ✅'; // Coche verte
                        option.style.color = '#198754';
                        option.style.fontWeight = 'bold';
                        option.dataset.adapte = 'true';
                    } else if (vehiculeAdapte === false) {
                        option.innerHTML += ' ⚠️'; // Triangle d'avertissement
                        option.style.color = '#fd7e14';
                        option.dataset.adapte = 'false';
                    } else {
                        option.dataset.adapte = 'unknown';
                    }
                    
                    // Ajouter des informations supplémentaires en attributs data en fonction du type de modèle
                    if (modelType === 'user') {
                        // Pour le modèle User
                        if (transporteur.email) option.dataset.email = transporteur.email;
                        
                        // Téléphone peut être dans l'objet principal ou dans transporteur_info
                        const telephone = transporteur.telephone || 
                            (transporteur.transporteur_info ? transporteur.transporteur_info.telephone : null);
                        if (telephone) option.dataset.telephone = telephone;
                        
                        // Capacité est généralement dans transporteur_info
                        const capacite = transporteur.capacite || 
                            (transporteur.transporteur_info ? transporteur.transporteur_info.capacite : null);
                        if (capacite) option.dataset.capacite = capacite;
                    } else {
                        // Pour le modèle Transporteur standard
                        if (transporteur.email) option.dataset.email = transporteur.email;
                        if (transporteur.telephone) option.dataset.telephone = transporteur.telephone;
                        if (transporteur.capacite) option.dataset.capacite = transporteur.capacite;
                    }
                    
                    // Conserver la sélection si c'était déjà sélectionné
                    try {
                        // Gérer les ID qui pourraient être des chaînes ou des nombres
                        const transporteurId = typeof transporteur.id === 'string' ? 
                            parseInt(transporteur.id, 10) : transporteur.id;
                            
                        // Vérifier si l'ID est dans la liste des ID sélectionnés
                        const isSelected = selectedIds.some(selectedId => {
                            // Convertir l'ID sélectionné en nombre si c'est une chaîne
                            const selectedIdNum = typeof selectedId === 'string' ? 
                                parseInt(selectedId, 10) : selectedId;
                                
                            return selectedIdNum === transporteurId;
                        });
                        
                        if (isSelected) {
                            option.selected = true;
                            logDebug(`Transporteur ${transporteurId} sélectionné`);
                        }
                    } catch (parseError) {
                        logError('Erreur lors du parsing de l\'ID:', parseError);
                    }
                    
                    selectElement.appendChild(option);
                    transporteursAjoutes++;
                } catch (optionError) {
                    logError('Erreur lors de la création d\'une option:', optionError);
                }
            });
            
            // Activer/désactiver le select en fonction du nombre de transporteurs
            if (transporteursAjoutes === 0) {
                logWarning('Aucun transporteur valide n\'a pu être ajouté à la liste');
                selectElement.disabled = true;
                
                // Ajouter une option par défaut si la liste est vide
                if (selectElement.options.length === 0) {
                    const noOption = document.createElement('option');
                    noOption.value = '';
                    noOption.innerHTML = 'Aucun transporteur disponible';
                    noOption.disabled = true;
                    selectElement.appendChild(noOption);
                }
            } else {
                // Ajouter un message d'aide si des transporteurs sont disponibles
                try {
                    const parentElement = selectElement.parentElement;
                    if (parentElement) {
                        // Vérifier si un message d'aide existe déjà
                        let helpText = parentElement.querySelector('.transporteur-help-text');
                        
                        if (!helpText) {
                            // Créer un nouveau message d'aide
                            helpText = document.createElement('small');
                            helpText.className = 'form-text text-muted transporteur-help-text mt-2';
                            parentElement.appendChild(helpText);
                        }
                        
                        // Mettre à jour le message d'aide
                        helpText.innerHTML = `<i class="fas fa-info-circle me-1"></i> ${transporteursAjoutes} transporteur(s) disponible(s) pour les dates sélectionnées.`;
                    }
                } catch (helpError) {
                    logWarning('Erreur lors de l\'ajout du message d\'aide:', helpError);
                }
            }
            
            logSuccess(`${transporteursAjoutes} transporteurs ajoutés à la liste sur ${transporteurs.length} transporteurs fournis`);
        } catch (error) {
            logError('Erreur lors de la mise à jour de la liste des transporteurs:', error);
            
            // Essayer de récupérer en ajoutant une option par défaut
            try {
                selectElement.innerHTML = '';
                const errorOption = document.createElement('option');
                errorOption.value = '';
                errorOption.innerHTML = 'Erreur lors du chargement des transporteurs';
                errorOption.disabled = true;
                selectElement.appendChild(errorOption);
                selectElement.disabled = true;
            } catch (recoveryError) {
                logError('Erreur lors de la récupération après erreur:', recoveryError);
            }
        }
    }

    // Afficher les transporteurs bientôt disponibles
    function displaySoonAvailableTransporteurs(elements, transporteurs) {
        try {
            // Vérifier que tous les éléments nécessaires sont présents
            if (!elements.bientotDisponiblesDiv || !elements.bientotDisponiblesResultats) {
                logWarning('Éléments manquants pour afficher les transporteurs bientôt disponibles');
                return;
            }
            
            // Vérifier le paramètre transporteurs
            if (!transporteurs || !Array.isArray(transporteurs)) {
                logError('Le paramètre transporteurs n\'est pas un tableau valide', transporteurs);
                elements.bientotDisponiblesResultats.innerHTML = '<div class="alert alert-danger">Erreur: données de transporteurs invalides</div>';
                return;
            }
            
            logInfo(`Affichage de ${transporteurs.length} transporteurs bientôt disponibles`);
            
            // Vérifier que transporteurs est un tableau valide et non vide
            if (!transporteurs || !Array.isArray(transporteurs) || transporteurs.length === 0) {
                logInfo('Aucun transporteur bientôt disponible à afficher');
                elements.bientotDisponiblesDiv.style.display = 'none';
                return;
            }
            
            // Déboguer les transporteurs reçus
            logDebug(`Traitement de ${transporteurs.length} transporteurs bientôt disponibles`, transporteurs);
            
            // Analyser les types de modèles présents dans les données déjà normalisées
            const modelTypes = {};
            transporteurs.forEach(t => {
                if (t && t.modelType) {
                    modelTypes[t.modelType] = (modelTypes[t.modelType] || 0) + 1;
                }
            });
            
            logInfo('Types de modèles détectés dans les transporteurs bientôt disponibles', modelTypes);
            
            // Filtrer les transporteurs valides en utilisant les données normalisées
            // Nous supposons que les données sont déjà normalisées par processApiResponse
            const transporteursValides = transporteurs.filter(function(t) {
                // Vérifier les critères de validité avec les données normalisées
                const isValide = (t.nom || t.prenom) && t.disponibleLe;
                
                // Déboguer les transporteurs non valides
                if (!isValide) {
                    logDebug(`Transporteur ${t.id} non valide pour l'affichage "bientôt disponible" (type: ${t.modelType})`, {
                        id: t.id,
                        nom: t.nom,
                        prenom: t.prenom,
                        disponibleLe: t.disponibleLe,
                        modelType: t.modelType
                    });
                }
                
                return isValide;
            });
            
            if (transporteursValides.length === 0) {
                logWarning('Aucun transporteur bientôt disponible valide');
                elements.bientotDisponiblesDiv.style.display = 'none';
                return;
            }
            
            // Déboguer les transporteurs valides
            logDebug(`${transporteursValides.length} transporteurs bientôt disponibles valides`, transporteursValides);
            
            // Afficher la section
            elements.bientotDisponiblesDiv.style.display = 'block';
            
            // Créer le tableau
            let tableHTML = '<div class="table-responsive">' +
                '<table class="table table-striped table-hover table-sm">' +
                '<thead class="table-light">' +
                    '<tr>' +
                        '<th>Transporteur</th>' +
                        '<th>Véhicule</th>' +
                        '<th>Disponible le</th>' +
                        '<th>Contact</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>';
            
            // Ajouter chaque transporteur (déjà normalisé)
            transporteursValides.forEach(function(t) {
                try {
                    // Utiliser directement les données normalisées
                    logDebug(`Traitement du transporteur normalisé ${t.id} de type ${t.modelType}`, t);
                    
                    // Les données sont déjà normalisées, pas besoin de détecter le type ou d'extraire les informations
                    const nom = t.nom || 'Sans nom';
                    const prenom = t.prenom || '';
                    const vehicule = t.vehicule || 'Non spécifié';
                    const typeVehicule = t.typeVehicule || 'Type non spécifié';
                    const vehiculeAdapte = t.vehiculeAdapte;
                    const disponibleLe = t.disponibleLe;
                    const telephone = t.telephone || 'Non renseigné';
                    const email = t.email || 'Non renseigné';
                    
                    // Utiliser la fonction formatDate pour gérer différents formats de date
                    let dateDisponible = 'Non spécifié';
                    if (disponibleLe) {
                        try {
                            // Utiliser le format relatif qui inclut automatiquement le nombre de jours
                            dateDisponible = formatDate(disponibleLe, 'relative');
                            logDebug(`Date formatée pour le transporteur ${t.id}: ${dateDisponible} (original: ${disponibleLe})`);
                        } catch (dateError) {
                            logWarning(`Erreur de formatage de date pour le transporteur ${t.id}:`, dateError);
                            // En cas d'erreur, afficher la date brute
                            dateDisponible = disponibleLe;
                        }
                    }
                    
                    // Formater les informations du véhicule
                    let vehiculeInfo = vehicule;
                    if (typeVehicule) {
                        if (typeof typeVehicule === 'object' && typeVehicule.nom) {
                            vehiculeInfo += ` (${typeVehicule.nom})`;
                        } else if (typeof typeVehicule === 'string') {
                            vehiculeInfo += ` (${typeVehicule})`;
                        }
                    }
                    
                    // Ajouter une icône pour les véhicules adaptés
                    if (vehiculeAdapte === true) {
                        vehiculeInfo += ' <span class="badge bg-success">Adapté</span>';
                    }
                    
                    // Formater les informations de contact
                    let contactInfo = '';
                    if (telephone) {
                        contactInfo += `<i class="fas fa-phone-alt me-1"></i>${telephone}<br>`;
                    }
                    if (email) {
                        contactInfo += `<i class="fas fa-envelope me-1"></i>${email}`;
                    }
                    if (!contactInfo) {
                        contactInfo = 'Non spécifié';
                    }
                    
                    // Créer la ligne avec les données formatées
                    const nomComplet = `${prenom || ''} ${nom || ''}`.trim() || 'Transporteur sans nom';
                    
                    // Ajouter un badge pour indiquer le type de modèle
                    const modelBadge = modelType === 'user' ? 
                        ' <span class="badge bg-info" data-bs-toggle="tooltip" title="Modèle User">U</span>' : 
                        ' <span class="badge bg-secondary" data-bs-toggle="tooltip" title="Modèle Transporteur">T</span>';
                    
                    // Ajouter des liens pour le téléphone et l'email
                    let contactHtml = contactInfo;
                    if (telephone && telephone !== 'Non spécifié') {
                        contactHtml = contactHtml.replace(telephone, `<a href="tel:${telephone}" class="text-decoration-none">${telephone}</a>`);
                    }
                    if (email && email !== 'Non spécifié') {
                        contactHtml = contactHtml.replace(email, `<a href="mailto:${email}" class="text-decoration-none">${email}</a>`);
                    }
                    
                    tableHTML += '<tr>' +
                        `<td><strong>${nomComplet}</strong>${modelBadge}</td>` +
                        `<td>${vehiculeInfo}</td>` +
                        `<td>${dateDisponible}</td>` +
                        `<td class="small">${contactHtml}</td>` +
                    '</tr>';
                } catch (rowError) {
                    logError('Erreur lors de la création d\'une ligne du tableau:', rowError);
                }
            });
            
            tableHTML += '</tbody></table></div>';
            
            // Ajouter un titre et une description avec des informations plus détaillées
            const headerHTML = 
                '<div class="alert alert-info">' +
                    '<div class="d-flex align-items-center">' +
                        '<div class="me-3">' +
                            '<i class="fas fa-calendar-alt fa-2x"></i>' +
                        '</div>' +
                        '<div>' +
                            `<h5 class="mb-1">${transporteursValides.length} transporteur(s) bientôt disponible(s)</h5>` +
                            '<p class="mb-0">Ces transporteurs ne sont pas disponibles pour les dates sélectionnées mais le seront prochainement.</p>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            
            // Ajouter un message d'aide si nécessaire
            let helpMessage = '';
            if (transporteursValides.length > 0) {
                helpMessage = '<div class="alert alert-light border mt-2">' +
                    '<small class="text-muted"><i class="fas fa-info-circle me-1"></i> ' +
                    'Vous pouvez contacter ces transporteurs pour planifier un transport futur.' +
                    '</small></div>';
            }
            
            // Mettre à jour le contenu
            elements.bientotDisponiblesResultats.innerHTML = headerHTML + tableHTML + helpMessage;
            
            // Activer les tooltips si Bootstrap est disponible
            try {
                if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                    const tooltips = elements.bientotDisponiblesResultats.querySelectorAll('[data-bs-toggle="tooltip"]');
                    tooltips.forEach(function(tooltip) {
                        new bootstrap.Tooltip(tooltip);
                    });
                }
            } catch (tooltipError) {
                logWarning('Impossible d\'initialiser les tooltips:', tooltipError);
            }
            
            logSuccess(`${transporteursValides.length} transporteurs bientôt disponibles affichés sur ${transporteurs.length} fournis`);
        } catch (error) {
            logError('Erreur lors de l\'affichage des transporteurs bientôt disponibles:', error);
            if (elements.bientotDisponiblesDiv) {
                elements.bientotDisponiblesDiv.style.display = 'none';
            }
        }
    }
})();
