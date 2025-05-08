// Fonction pour filtrer les clients selon le rôle de l'utilisateur
function getFilteredClients() {
    console.log('getFilteredClients appelé');
    console.log('window.allClients:', window.allClients);
    console.log('window.currentUser:', window.currentUser);
    
    try {
        // Vérifier que les données sont disponibles
        if (!window.allClients) {
            console.error('window.allClients n\'est pas défini');
            return [];
        }
        
        if (!Array.isArray(window.allClients)) {
            console.error('window.allClients n\'est pas un tableau');
            return [];
        }
        
        if (!window.currentUser || !window.currentUser.role) {
            console.error('window.currentUser ou son rôle n\'est pas défini');
            return [];
        }
        
        // Filtrer les clients selon le rôle
        return window.allClients.filter(client => {
            // Vérifier que le client est valide
            if (!client || !client.id || !client.nom) {
                console.error('Client invalide:', client);
                return false;
            }
            
            // Filtrer selon le rôle
            if (window.currentUser.role === 'admin' || window.currentUser.role === 'superadmin') {
                return true; // Admin et superadmin voient tous les clients
            } else if (window.currentUser.role === 'commercial') {
                return client.commercial_id === window.currentUser.id; // Commercial ne voit que ses clients
            }
            return false; // Autres rôles ne voient aucun client
        });
    } catch (error) {
        console.error('Erreur lors du filtrage des clients:', error);
        return [];
    }
}

// Fonction pour créer les options du menu déroulant
function createClientOptions() {
    console.log('createClientOptions appelé');
    console.log('window.allClients disponible:', !!window.allClients);
    
    try {
        const filteredClients = getFilteredClients();
        console.log('filteredClients:', filteredClients);
        
        // Vérifier que nous avons des clients
        if (!Array.isArray(filteredClients)) {
            console.error('filteredClients n\'est pas un tableau');
            return '<option value="">Erreur: format de données incorrect</option>';
        }
        
        if (filteredClients.length === 0) {
            console.log('Aucun client filtré');
            return '<option value="">Aucun client disponible</option>';
        }
        
        // Générer les options
        const options = [
            '<option value="">Sélectionner un client</option>',
            ...filteredClients.map(client => {
                if (!client || !client.id || !client.nom) {
                    console.error('Client invalide:', client);
                    return '';
                }
                const nom = client.nom || '';
                const prenom = client.prenom || '';
                return `<option value="${client.id}">${nom} ${prenom}</option>`;
            }).filter(option => option !== '')
        ].join('');
        
        console.log('options générées:', options);
        return options;
    } catch (error) {
        console.error('Erreur lors de la création des options:', error);
        return '<option value="">Erreur lors du chargement des clients</option>';
    }
}

// Fonction pour ajouter un nouveau client
function ajouterNouveauClient() {
    console.log('ajouterNouveauClient appelé');
    const container = document.getElementById('clients-supplementaires');
    if (!container) {
        console.log('Conteneur non trouvé');
        return;
    }

    // Générer les options du menu déroulant
    const clientOptions = createClientOptions();
    console.log('Options générées pour le nouveau client:', clientOptions);

    // Template HTML pour un nouveau client
    const template = `
        <div class="client-supplementaire card mb-3">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Client Supplémentaire</label>
                        <select class="form-select" name="clients_supplementaires[]" required>
                            ${clientOptions}
                        </select>
                    </div>
                    <div class="col-md-5">
                        <label class="form-label">Montant</label>
                        <div class="input-group">
                            <input type="number" class="form-control" 
                                   name="montants_supplementaires[]" 
                                   required min="0" step="0.01" 
                                   placeholder="Montant">
                            <span class="input-group-text">€</span>
                        </div>
                    </div>
                    <div class="col-md-1 d-flex align-items-end">
                        <button type="button" class="btn btn-outline-danger btn-remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Ajouter le nouveau client au conteneur
    console.log('Ajout du template au conteneur');
    container.insertAdjacentHTML('beforeend', template);

    // Ajouter le gestionnaire d'événement pour le bouton de suppression
    const newClientDiv = container.lastElementChild;
    const btnRemove = newClientDiv.querySelector('.btn-remove');
    if (btnRemove) {
        console.log('Ajout du gestionnaire d\'\u00e9vénement pour le bouton de suppression');
        btnRemove.addEventListener('click', function() {
            newClientDiv.remove();
        });
    }

    // Vérifier que le menu déroulant a été correctement initialisé
    const newSelect = newClientDiv.querySelector('select');
    console.log('Nouveau menu déroulant:', newSelect);
    console.log('Options du nouveau menu déroulant:', newSelect ? newSelect.innerHTML : 'non trouvé');
}

// Initialisation au chargement de la page
// Fonction pour gérer l'affichage de la section clients supplémentaires
function toggleClientsSupplementaires() {
    console.log('toggleClientsSupplementaires appelé');
    const modeGroupage = document.querySelector('input[type="checkbox"][name="mode_groupage"]');
    console.log('modeGroupage:', modeGroupage);
    const clientsSupplementairesSection = document.querySelector('#section-clients-supplementaires');
    console.log('clientsSupplementairesSection:', clientsSupplementairesSection);
    const modeDescription = document.getElementById('mode-description');
    console.log('modeDescription:', modeDescription);

    if (modeGroupage && clientsSupplementairesSection) {
        const isGroupageEnabled = modeGroupage.checked;
        console.log('isGroupageEnabled:', isGroupageEnabled);
        
        // Mettre à jour l'affichage de la section
        clientsSupplementairesSection.style.display = isGroupageEnabled ? 'block' : 'none';
        console.log('Nouveau display:', clientsSupplementairesSection.style.display);
        
        // Mettre à jour le texte de description
        if (modeDescription) {
            modeDescription.textContent = isGroupageEnabled 
                ? 'Mode groupage: plusieurs clients, plusieurs points de départ et d\'arrivée'
                : 'Mode standard: un seul client, un point de départ et un point d\'arrivée';
            console.log('Texte de description mis à jour:', modeDescription.textContent);
        }
    } else {
        console.log('Un des éléments est manquant');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    
    // Initialiser les boutons de suppression existants
    const removeButtons = document.querySelectorAll('.btn-remove');
    console.log('Boutons de suppression trouvés:', removeButtons.length);
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const clientDiv = this.closest('.client-supplementaire');
            if (clientDiv) {
                clientDiv.remove();
            }
        });
    });

    // Initialiser le bouton d'ajout de client
    const btnAjouterClient = document.querySelector('#ajouter-client');
    console.log('Bouton ajouter client:', btnAjouterClient);
    if (btnAjouterClient) {
        btnAjouterClient.addEventListener('click', ajouterNouveauClient);
    }

    // Initialiser les menus déroulants existants
    const existingSelects = document.querySelectorAll('select[name="clients_supplementaires[]"]');
    console.log('Menus déroulants existants:', existingSelects.length);
    existingSelects.forEach(select => {
        const selectedValue = select.value;
        select.innerHTML = `
            <option value="">Sélectionner un client</option>
            ${createClientOptions()}
        `;
        select.value = selectedValue;
    });

    // Gérer le changement du mode groupage
    const modeGroupage = document.querySelector('input[type="checkbox"][name="mode_groupage"]');
    console.log('Checkbox mode groupage:', modeGroupage);
    if (modeGroupage) {
        console.log('Ajout du listener change sur mode groupage');
        modeGroupage.addEventListener('change', function(event) {
            console.log('Change event sur mode groupage:', event.target.checked);
            toggleClientsSupplementaires();
        });
        // Initialiser l'état au chargement
        console.log('Appel initial de toggleClientsSupplementaires');
        toggleClientsSupplementaires();
    } else {
        console.log('Checkbox mode groupage non trouvée');
    }
});
