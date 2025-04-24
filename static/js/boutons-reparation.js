/**
 * Script de réparation pour les boutons qui ne fonctionnent pas :
 * - Bouton prestation groupage
 * - Bouton ajouter une étape
 * - Bouton ajouter une observation
 * - Bouton ajouter un client
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du script de réparation des boutons...");
    
    // Réparer le bouton de prestation groupage
    repairGroupageButton();
    
    // Réparer les boutons d'ajout d'étapes
    repairEtapeButtons();
    
    // Réparer le bouton d'ajout d'observation
    repairObservationButton();
    
    // Réparer le bouton d'ajout de client
    repairAjouterClientButton();
});

/**
 * Répare le bouton de prestation groupage
 */
function repairGroupageButton() {
    const btnGroupage = document.getElementById('btn-groupage');
    const btnStandard = document.getElementById('btn-standard');
    
    if (!btnGroupage || !btnStandard) {
        console.log("Boutons de groupage non trouvés, aucune réparation nécessaire");
        return;
    }
    
    console.log("Réparation du bouton de prestation groupage...");
    
    // Initialiser l'état par défaut (mode standard)
    const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
    const btnAjouterClient = document.getElementById('ajouter-client');
    const modeInfoDiv = document.getElementById('mode-info');
    
    if (clientsSupplementairesDiv) {
        clientsSupplementairesDiv.style.display = 'none';
    }
    
    if (btnAjouterClient) {
        btnAjouterClient.style.display = 'none';
    }
    
    if (modeInfoDiv) {
        modeInfoDiv.innerHTML = '<i class="fas fa-info-circle"></i> Mode standard: un seul client, un point de départ et un point d\'arrivée';
    }
    
    // Supprimer les anciens écouteurs d'événements
    const newBtnGroupage = btnGroupage.cloneNode(true);
    btnGroupage.parentNode.replaceChild(newBtnGroupage, btnGroupage);
    
    const newBtnStandard = btnStandard.cloneNode(true);
    btnStandard.parentNode.replaceChild(newBtnStandard, btnStandard);
    
    // Ajouter les nouveaux écouteurs d'événements
    newBtnGroupage.addEventListener('click', function() {
        console.log("Bouton groupage cliqué");
        
        // Mettre à jour l'apparence des boutons
        newBtnGroupage.classList.add('active');
        newBtnStandard.classList.remove('active');
        
        // Afficher les sections spécifiques au groupage
        const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
        const btnAjouterClient = document.getElementById('ajouter-client');
        const modeInfoDiv = document.getElementById('mode-info');
        
        if (clientsSupplementairesDiv) {
            clientsSupplementairesDiv.style.display = 'block';
        }
        
        if (btnAjouterClient) {
            btnAjouterClient.style.display = 'block';
        }
        
        if (modeInfoDiv) {
            modeInfoDiv.innerHTML = '<i class="fas fa-info-circle"></i> Mode groupage: plusieurs clients, plusieurs points de prise en charge';
            modeInfoDiv.style.display = 'block';
            modeInfoDiv.style.color = '#0d6efd';
            modeInfoDiv.style.fontWeight = 'bold';
        }
        
        // Mettre à jour le type de déménagement
        const typeHidden = document.querySelector('input[name="type_demenagement"]');
        if (typeHidden) {
            typeHidden.value = 'Groupage';
        }
        
        // Ajouter un champ caché pour indiquer que c'est un groupage
        let estGroupageInput = document.getElementById('est_groupage');
        if (!estGroupageInput) {
            estGroupageInput = document.createElement('input');
            estGroupageInput.type = 'hidden';
            estGroupageInput.id = 'est_groupage';
            estGroupageInput.name = 'est_groupage';
            document.querySelector('form').appendChild(estGroupageInput);
        }
        estGroupageInput.value = 'true';
    });
    
    newBtnStandard.addEventListener('click', function() {
        console.log("Bouton standard cliqué");
        
        // Mettre à jour l'apparence des boutons
        newBtnStandard.classList.add('active');
        newBtnGroupage.classList.remove('active');
        
        // Masquer les sections spécifiques au groupage
        const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
        const btnAjouterClient = document.getElementById('ajouter-client');
        const modeInfoDiv = document.getElementById('mode-info');
        
        if (clientsSupplementairesDiv) {
            clientsSupplementairesDiv.style.display = 'none';
        }
        
        if (btnAjouterClient) {
            btnAjouterClient.style.display = 'none';
        }
        
        if (modeInfoDiv) {
            modeInfoDiv.innerHTML = '<i class="fas fa-info-circle"></i> Mode standard: un seul client, un point de départ et un point d\'arrivée';
            modeInfoDiv.style.display = 'block';
        }
        
        // Mettre à jour le champ caché pour indiquer que ce n'est pas un groupage
        let estGroupageInput = document.getElementById('est_groupage');
        if (!estGroupageInput) {
            estGroupageInput = document.createElement('input');
            estGroupageInput.type = 'hidden';
            estGroupageInput.id = 'est_groupage';
            estGroupageInput.name = 'est_groupage';
            document.querySelector('form').appendChild(estGroupageInput);
        }
        estGroupageInput.value = 'false';
    });
    
    // Initialiser l'état en fonction de la classe active
    if (newBtnGroupage.classList.contains('active')) {
        newBtnGroupage.click();
    } else {
        newBtnStandard.click();
    }
}

/**
 * Répare les boutons d'ajout d'étapes
 */
function repairEtapeButtons() {
    const btnAjouterEtapeDepart = document.getElementById('ajouter-etape-depart');
    const btnAjouterEtapeArrivee = document.getElementById('ajouter-etape-arrivee');
    
    // Réparer le bouton d'ajout d'étape de départ
    if (btnAjouterEtapeDepart) {
        console.log("Réparation du bouton d'ajout d'étape de départ...");
        
        // Supprimer les anciens écouteurs d'événements
        const newBtnAjouterEtapeDepart = btnAjouterEtapeDepart.cloneNode(true);
        btnAjouterEtapeDepart.parentNode.replaceChild(newBtnAjouterEtapeDepart, btnAjouterEtapeDepart);
        
        // Ajouter les nouveaux écouteurs d'événements
        newBtnAjouterEtapeDepart.addEventListener('click', function() {
            console.log("Bouton ajouter étape départ cliqué");
            
            // Récupérer le conteneur des étapes de départ
            const etapesDepartContainer = document.getElementById('etapes-depart-container');
            if (!etapesDepartContainer) {
                console.error("Conteneur des étapes de départ non trouvé");
                return;
            }
            
            // Créer une nouvelle étape
            const etapeIndex = etapesDepartContainer.querySelectorAll('.etape-supplementaire').length + 1;
            const etapeId = `etape-depart-${etapeIndex}`;
            
            const etapeHtml = `
                <div class="etape-supplementaire mb-3" id="${etapeId}">
                    <div class="input-group">
                        <input type="text" name="etapes_depart[]" class="form-control" placeholder="Adresse étape ${etapeIndex}">
                        <button type="button" class="btn btn-outline-danger btn-remove-etape" data-target="${etapeId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Ajouter l'étape au conteneur
            etapesDepartContainer.insertAdjacentHTML('beforeend', etapeHtml);
            
            // Ajouter un écouteur d'événement pour le bouton de suppression
            const btnRemove = etapesDepartContainer.querySelector(`#${etapeId} .btn-remove-etape`);
            if (btnRemove) {
                btnRemove.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.remove();
                    }
                });
            }
        });
    } else {
        console.error("Bouton ajouter-etape-depart non trouvé");
    }
    
    // Réparer le bouton d'ajout d'étape d'arrivée
    if (btnAjouterEtapeArrivee) {
        console.log("Réparation du bouton d'ajout d'étape d'arrivée...");
        
        // Supprimer les anciens écouteurs d'événements
        const newBtnAjouterEtapeArrivee = btnAjouterEtapeArrivee.cloneNode(true);
        btnAjouterEtapeArrivee.parentNode.replaceChild(newBtnAjouterEtapeArrivee, btnAjouterEtapeArrivee);
        
        // Ajouter les nouveaux écouteurs d'événements
        newBtnAjouterEtapeArrivee.addEventListener('click', function() {
            console.log("Bouton ajouter étape arrivée cliqué");
            
            // Récupérer le conteneur des étapes d'arrivée
            const etapesArriveeContainer = document.getElementById('etapes-arrivee-container');
            if (!etapesArriveeContainer) {
                console.error("Conteneur des étapes d'arrivée non trouvé");
                return;
            }
            
            // Créer une nouvelle étape
            const etapeIndex = etapesArriveeContainer.querySelectorAll('.etape-supplementaire').length + 1;
            const etapeId = `etape-arrivee-${etapeIndex}`;
            
            const etapeHtml = `
                <div class="etape-supplementaire mb-3" id="${etapeId}">
                    <div class="input-group">
                        <input type="text" name="etapes_arrivee[]" class="form-control" placeholder="Adresse étape ${etapeIndex}">
                        <button type="button" class="btn btn-outline-danger btn-remove-etape" data-target="${etapeId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Ajouter l'étape au conteneur
            etapesArriveeContainer.insertAdjacentHTML('beforeend', etapeHtml);
            
            // Ajouter un écouteur d'événement pour le bouton de suppression
            const btnRemove = etapesArriveeContainer.querySelector(`#${etapeId} .btn-remove-etape`);
            if (btnRemove) {
                btnRemove.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.remove();
                    }
                });
            }
        });
    } else {
        console.error("Bouton ajouter-etape-arrivee non trouvé");
    }
}

/**
 * Répare le bouton d'ajout d'observation
 */
function repairObservationButton() {
    const ajouterObservationBtn = document.getElementById('ajouter-observation');
    
    if (!ajouterObservationBtn) {
        console.error("Bouton ajouter-observation non trouvé");
        return;
    }
    
    console.log("Réparation du bouton d'ajout d'observation...");
    
    // Supprimer les anciens écouteurs d'événements
    const newAjouterObservationBtn = ajouterObservationBtn.cloneNode(true);
    ajouterObservationBtn.parentNode.replaceChild(newAjouterObservationBtn, ajouterObservationBtn);
    
    // Ajouter les nouveaux écouteurs d'événements
    newAjouterObservationBtn.addEventListener('click', function() {
        console.log("Bouton ajouter observation cliqué");
        
        // Récupérer le conteneur des observations supplémentaires
        const observationsContainer = document.getElementById('observations-supplementaires');
        if (!observationsContainer) {
            console.error("Conteneur des observations supplémentaires non trouvé");
            return;
        }
        
        // Créer une nouvelle observation
        const observationIndex = observationsContainer.querySelectorAll('.observation-supplementaire').length + 1;
        const observationId = `observation-${observationIndex}`;
        
        const observationHtml = `
            <div class="observation-supplementaire mt-3" id="${observationId}">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>Observation supplémentaire ${observationIndex}</span>
                        <button type="button" class="btn btn-sm btn-remove-observation" data-target="${observationId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <textarea name="observations_supplementaires[]" class="form-control" rows="3" placeholder="Ajoutez une observation supplémentaire ici..."></textarea>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter l'observation au conteneur
        observationsContainer.insertAdjacentHTML('beforeend', observationHtml);
        
        // Ajouter un écouteur d'événement pour le bouton de suppression
        const btnRemove = observationsContainer.querySelector(`#${observationId} .btn-remove-observation`);
        if (btnRemove) {
            btnRemove.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.remove();
                }
            });
        }
    });
}

/**
 * Répare le bouton d'ajout de client
 */
function repairAjouterClientButton() {
    const ajouterClientBtn = document.getElementById('ajouter-client');
    
    if (!ajouterClientBtn) {
        console.error("Bouton ajouter-client non trouvé");
        return;
    }
    
    console.log("Réparation du bouton d'ajout de client...");
    
    // Récupérer la liste des clients depuis l'API
    fetch('/api/clients')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Stocker la liste des clients pour une utilisation ultérieure
                window.clientsList = data.clients;
                console.log("Liste des clients récupérée:", window.clientsList.length, "clients trouvés");
            } else {
                console.error("Erreur lors de la récupération des clients:", data.message);
            }
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des clients:", error);
        });
    
    // Supprimer les anciens écouteurs d'événements
    const newAjouterClientBtn = ajouterClientBtn.cloneNode(true);
    ajouterClientBtn.parentNode.replaceChild(newAjouterClientBtn, ajouterClientBtn);
    
    // Ajouter les nouveaux écouteurs d'événements
    newAjouterClientBtn.addEventListener('click', function() {
        console.log("Bouton ajouter client cliqué");
        
        // Récupérer le conteneur des clients supplémentaires
        const clientsContainer = document.getElementById('clients-supplementaires');
        if (!clientsContainer) {
            console.error("Conteneur des clients supplémentaires non trouvé");
            return;
        }
        
        // Créer un nouveau client
        const clientIndex = clientsContainer.querySelectorAll('.client-supplementaire').length + 1;
        const clientId = `client-${clientIndex}`;
        
        // Générer les options pour le select des clients
        let clientOptions = '';
        if (window.clientsList && window.clientsList.length > 0) {
            clientOptions = window.clientsList.map(client => 
                `<option value="${client.id}">${client.nom} ${client.prenom}</option>`
            ).join('');
        }
        
        const clientHtml = `
            <div class="client-supplementaire mt-3 fade-in" id="${clientId}">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span><i class="fas fa-user icon-demenagement"></i> Client supplémentaire ${clientIndex}</span>
                        <button type="button" class="btn btn-sm btn-remove-client" data-target="${clientId}" title="Supprimer ce client">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="client_supplementaire_${clientIndex}"><i class="fas fa-address-card"></i> Sélectionner un client</label>
                            <select name="clients_supplementaires[]" id="client_supplementaire_${clientIndex}" class="form-control">
                                <option value="">Sélectionnez un client</option>
                                ${clientOptions}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter le client au conteneur
        clientsContainer.insertAdjacentHTML('beforeend', clientHtml);
        
        // Ajouter un écouteur d'événement pour le bouton de suppression
        const btnRemove = clientsContainer.querySelector(`#${clientId} .btn-remove-client`);
        if (btnRemove) {
            btnRemove.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.classList.add('fade-out');
                    setTimeout(() => {
                        targetElement.remove();
                    }, 300);
                }
            });
        }
    });
}
