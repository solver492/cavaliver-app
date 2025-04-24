/**
 * Script de débogage pour comprendre les problèmes d'affichage des transporteurs
 */

console.log("🔍 DEBUG: Script de débogage des transporteurs chargé");

// Fonction immédiatement exécutée
(function() {
    // Variables pour suivre l'état d'exécution
    window.debugTransporteurs = {
        initialized: false,
        events: [],
        elements: {},
        log: function(message) {
            console.log(`🔍 DEBUG: ${message}`);
            this.events.push({
                time: new Date().toISOString(),
                event: message
            });
        },
        error: function(message) {
            console.error(`🚨 ERREUR: ${message}`);
            this.events.push({
                time: new Date().toISOString(),
                event: `ERREUR: ${message}`,
                type: 'error'
            });
        }
    };
    
    // Initialiser au chargement de la page
    document.addEventListener('DOMContentLoaded', function() {
        const debug = window.debugTransporteurs;
        debug.log("Initialisation du débogage");
        
        // Récupérer les éléments importants
        const elements = {
            btnVerifierDisponibilite: document.getElementById('verifier-disponibilite'),
            dateDebut: document.getElementById('date_debut'),
            dateFin: document.getElementById('date_fin'),
            typeDemenagement: document.getElementById('type_demenagement_id'),
            resultsContainer: document.getElementById('transporteurs-disponibles-resultats'),
            transporteursSelect: document.getElementById('transporteurs')
        };
        
        // Vérifier si les éléments existent
        let missingElements = [];
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                missingElements.push(key);
            }
        }
        
        if (missingElements.length > 0) {
            debug.error(`Éléments manquants: ${missingElements.join(', ')}`);
        } else {
            debug.log("Tous les éléments requis sont présents");
        }
        
        debug.elements = elements;
        
        // Attacher un gestionnaire d'événements au bouton
        if (elements.btnVerifierDisponibilite) {
            debug.log("Attachement d'un gestionnaire d'événements au bouton vérifier disponibilité");
            
            elements.btnVerifierDisponibilite.addEventListener('click', function(event) {
                debug.log("Clic sur le bouton vérifier disponibilité détecté");
                
                // Vérifier si les champs requis sont remplis
                const dateDebut = elements.dateDebut ? elements.dateDebut.value : null;
                const dateFin = elements.dateFin ? elements.dateFin.value : null;
                const typeDemenagement = elements.typeDemenagement ? elements.typeDemenagement.value : null;
                
                debug.log(`Valeurs des champs: dateDebut=${dateDebut}, dateFin=${dateFin}, typeDemenagement=${typeDemenagement}`);
                
                if (!dateDebut || !dateFin || !typeDemenagement) {
                    debug.error("Champs incomplets pour la requête");
                    if (elements.resultsContainer) {
                        elements.resultsContainer.innerHTML = '<div class="alert alert-warning">Veuillez remplir tous les champs requis.</div>';
                    }
                    return;
                }
                
                // Afficher un message de chargement
                if (elements.resultsContainer) {
                    elements.resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div><p class="mt-2">Vérification des disponibilités en cours...</p></div>';
                }
                
                // Créer la requête
                const formData = new FormData();
                formData.append('date_debut', dateDebut);
                formData.append('date_fin', dateFin);
                formData.append('type_demenagement_id', typeDemenagement);
                
                // Récupérer l'ID de la prestation (à partir de l'URL)
                const urlParts = window.location.pathname.split('/');
                const prestationId = urlParts[urlParts.length - 1];
                if (prestationId && prestationId !== 'add') {
                    formData.append('prestation_id', prestationId);
                    debug.log(`ID de prestation: ${prestationId}`);
                }
                
                // Envoyer la requête
                debug.log("Envoi de la requête à /prestations/check-disponibilite");
                fetch('/prestations/check-disponibilite', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(response => {
                    debug.log(`Réponse reçue, statut: ${response.status}`);
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    debug.log(`Données reçues: ${JSON.stringify(data)}`);
                    
                    // Traiter la réponse
                    if (elements.resultsContainer) {
                        let html = '<div class="my-3">';
                        
                        // Traiter les transporteurs disponibles
                        if (data.transporteurs && data.transporteurs.length > 0) {
                            html += '<h5>Transporteurs disponibles:</h5>';
                            html += '<div class="list-group">';
                            
                            data.transporteurs.forEach(transporteur => {
                                const badgeClass = transporteur.disponible ? 'bg-success' : 'bg-warning text-dark';
                                const badgeText = transporteur.disponible ? 'Disponible' : 'Indisponible';
                                const btnAction = transporteur.disponible ? 
                                    `<button class="btn btn-sm btn-outline-primary ms-2 btn-assigner" 
                                             data-id="${transporteur.id}" 
                                             data-nom="${transporteur.nom}" 
                                             data-prenom="${transporteur.prenom}" 
                                             data-vehicule="${transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié'}">
                                        <i class="fas fa-plus-circle"></i> Assigner
                                     </button>` : '';
                                
                                html += `
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>${transporteur.nom} ${transporteur.prenom}</strong>
                                            <div class="small text-muted">Véhicule: ${transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié'}</div>
                                        </div>
                                        <div class="d-flex align-items-center">
                                            <span class="badge ${badgeClass}">${badgeText}</span>
                                            ${btnAction}
                                        </div>
                                    </div>
                                `;
                            });
                            
                            html += '</div>';
                        } else {
                            html += '<div class="alert alert-warning">Aucun transporteur trouvé pour cette période.</div>';
                        }
                        
                        // Transporteurs bientôt disponibles
                        if (data.soon_available && data.soon_available.length > 0) {
                            html += '<h5 class="mt-4">Transporteurs bientôt disponibles:</h5>';
                            html += '<div class="list-group">';
                            
                            data.soon_available.forEach(transporteur => {
                                html += `
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>${transporteur.nom} ${transporteur.prenom}</strong>
                                            <div class="small text-muted">Véhicule: ${transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié'}</div>
                                            <div class="small text-muted">Disponible le: ${transporteur.disponible_le}</div>
                                        </div>
                                        <span class="badge bg-warning text-dark">Bientôt disponible</span>
                                    </div>
                                `;
                            });
                            
                            html += '</div>';
                        }
                        
                        html += '</div>';
                        
                        elements.resultsContainer.innerHTML = html;
                        
                        // Attacher les gestionnaires d'événements aux boutons d'assignation
                        const btnAssigner = elements.resultsContainer.querySelectorAll('.btn-assigner');
                        btnAssigner.forEach(btn => {
                            btn.addEventListener('click', function() {
                                const id = this.dataset.id;
                                const nom = this.dataset.nom;
                                const prenom = this.dataset.prenom;
                                const vehicule = this.dataset.vehicule;
                                
                                debug.log(`Assignation du transporteur: ${nom} ${prenom} (ID: ${id})`);
                                
                                // Ajouter à la sélection
                                if (elements.transporteursSelect) {
                                    // Vérifier si déjà présent
                                    let exist = false;
                                    for (let i = 0; i < elements.transporteursSelect.options.length; i++) {
                                        if (elements.transporteursSelect.options[i].value === id) {
                                            elements.transporteursSelect.options[i].selected = true;
                                            exist = true;
                                            break;
                                        }
                                    }
                                    
                                    // Ajouter si non existant
                                    if (!exist) {
                                        const option = document.createElement('option');
                                        option.value = id;
                                        option.text = `${nom} ${prenom} - ${vehicule}`;
                                        option.selected = true;
                                        elements.transporteursSelect.appendChild(option);
                                    }
                                    
                                    // Mettre à jour l'UI
                                    const event = new Event('change');
                                    elements.transporteursSelect.dispatchEvent(event);
                                    
                                    // Mise à jour du bouton
                                    this.innerHTML = '<i class="fas fa-check"></i> Assigné';
                                    this.disabled = true;
                                    this.classList.remove('btn-outline-primary');
                                    this.classList.add('btn-success');
                                }
                            });
                        });
                    }
                })
                .catch(error => {
                    debug.error(`Erreur lors de la requête: ${error.message}`);
                    if (elements.resultsContainer) {
                        elements.resultsContainer.innerHTML = `<div class="alert alert-danger">Erreur: ${error.message}</div>`;
                    }
                });
            });
            
            // Simuler un clic automatique si toutes les données sont présentes
            const autoCheck = function() {
                const dateDebut = elements.dateDebut ? elements.dateDebut.value : null;
                const dateFin = elements.dateFin ? elements.dateFin.value : null;
                const typeDemenagement = elements.typeDemenagement ? elements.typeDemenagement.value : null;
                
                if (dateDebut && dateFin && typeDemenagement) {
                    debug.log("Conditions remplies pour vérification automatique");
                    setTimeout(() => {
                        debug.log("Exécution automatique de la vérification");
                        elements.btnVerifierDisponibilite.click();
                    }, 500);
                }
            };
            
            // Vérifier automatiquement au chargement de la page
            autoCheck();
            
            // Ajouter les écouteurs pour vérification automatique lors des changements
            if (elements.dateDebut) elements.dateDebut.addEventListener('change', autoCheck);
            if (elements.dateFin) elements.dateFin.addEventListener('change', autoCheck);
            if (elements.typeDemenagement) elements.typeDemenagement.addEventListener('change', autoCheck);
        }
        
        debug.initialized = true;
        debug.log("Initialisation du débogage terminée");
    });
})();
