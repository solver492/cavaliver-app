/**
 * Script de correction pour le mode groupage - Version 2
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du script de correction pour le mode groupage v2.0');
    
    // Sélecteurs pour les éléments importants
    const radioGroupage = document.getElementById('radio-groupage');
    const sectionClientsSupplementaires = document.getElementById('section-clients-supplementaires');
    const clientsSupplementairesContainer = document.getElementById('clients-supplementaires');
    const ajouterClientBtn = document.getElementById('ajouter-client');
    let clientCounter = 0;

    function createClientField() {
        clientCounter++;
        const clientDiv = document.createElement('div');
        clientDiv.className = 'client-supplementaire mb-3 border-bottom pb-3 fade-in';

        const row = document.createElement('div');
        row.className = 'row g-3';

        // En-tête avec numéro de client
        const header = document.createElement('div');
        header.className = 'mb-2';
        header.innerHTML = `<h6>Client supplémentaire ${clientCounter}</h6>`;
        clientDiv.appendChild(header);

        // Colonne pour le select client
        const clientCol = document.createElement('div');
        clientCol.className = 'col-md-6';

        const selectClientContainer = document.createElement('div');
        selectClientContainer.className = 'mb-3';

        const selectClient = document.createElement('select');
        selectClient.className = 'form-select';
        selectClient.name = 'clients_supplementaires[]';
        selectClient.required = true;

        // Get original options and filter
        const originalSelect = document.querySelector('select[name="client_id"]');
        if (originalSelect) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Sélectionner un client';
            selectClient.appendChild(defaultOption);

            const isAdmin = {{ 'true' if current_user.is_admin() else 'false' }};
            const currentUserId = {{ current_user.id }};

            Array.from(originalSelect.options).forEach(option => {
                if (option.value) {
                    const commercialId = option.getAttribute('data-commercial-id');
                    if (isAdmin || (commercialId && parseInt(commercialId) === currentUserId)) {
                        const newOption = document.createElement('option');
                        newOption.value = option.value;
                        newOption.textContent = option.textContent;
                        newOption.setAttribute('data-commercial-id', commercialId);
                        selectClient.appendChild(newOption);
                    }
                }
            });
        }

        // Colonne pour le montant
        const montantCol = document.createElement('div');
        montantCol.className = 'col-md-5';

        const montantInput = document.createElement('input');
        montantInput.type = 'number';
        montantInput.className = 'form-control';
        montantInput.name = 'montants_supplementaires[]';
        montantInput.placeholder = 'Montant';
        montantInput.step = '0.01';
        montantInput.min = '0';
        montantInput.required = true;

        // Colonne pour le bouton de suppression
        const btnCol = document.createElement('div');
        btnCol.className = 'col-md-1 d-flex align-items-end';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.onclick = function() {
            clientDiv.classList.add('fade-out');
            setTimeout(() => {
                clientDiv.remove();
                updateClientNumbers();
            }, 300);
        };

        // Assembler les éléments
        selectClientContainer.appendChild(selectClient);
        clientCol.appendChild(selectClientContainer);
        montantCol.appendChild(montantInput);
        btnCol.appendChild(deleteBtn);

        row.appendChild(clientCol);
        row.appendChild(montantCol);
        row.appendChild(btnCol);

        clientDiv.appendChild(row);
        return clientDiv;
    }

    function updateClientNumbers() {
        const clients = document.querySelectorAll('.client-supplementaire h6');
        clients.forEach((header, index) => {
            header.textContent = `Client supplémentaire ${index + 1}`;
        });
        clientCounter = clients.length;
    }

    if (ajouterClientBtn && clientsSupplementairesContainer) {
        ajouterClientBtn.onclick = function() {
            clientsSupplementairesContainer.appendChild(createClientField());
        };
    }

    // Initialisation du mode groupage
    const modeGroupageSwitch = document.getElementById('mode_groupage');
    if (modeGroupageSwitch) {
        modeGroupageSwitch.addEventListener('change', function() {
            if (this.checked) {
                sectionClientsSupplementaires.classList.remove('d-none');
                if (clientsSupplementairesContainer.children.length === 0) {
                    clientsSupplementairesContainer.appendChild(createClientField());
                }
            } else {
                sectionClientsSupplementaires.classList.add('d-none');
                clientsSupplementairesContainer.innerHTML = '';
                clientCounter = 0;
            }
        });
    }

    // Rest of the original code that doesn't conflict with the edited code can be added here.  For example, the forceAfficherClientsSupplementaires function could be kept if needed for backward compatibility or other reasons.  However, the edited code's approach is generally preferred.

    // Exécuter les fonctions d'initialisation
    try {
        // Initialiser les gestionnaires d'événements

        // Si le mode groupage est déjà sélectionné, forcer l'affichage
        if (radioGroupage && radioGroupage.checked) {
            setTimeout(function(){ sectionClientsSupplementaires.classList.remove('d-none'); }, 100);
            setTimeout(function(){ sectionClientsSupplementaires.classList.remove('d-none'); }, 500);
            setTimeout(function(){ sectionClientsSupplementaires.classList.remove('d-none'); }, 1000);
        }

        console.log('FORCE: Initialisation du script de correction terminée avec succès');
    } catch (error) {
        console.error('FORCE: Erreur lors de l\'initialisation du script de correction:', error);
    }
});