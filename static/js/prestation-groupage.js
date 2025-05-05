document.addEventListener('DOMContentLoaded', function() {
    const modeGroupageSwitch = document.getElementById('mode-groupage-switch');
    const clientsContainer = document.getElementById('clients-supplementaires-container');
    const clientsList = document.getElementById('clients-list');
    const ajouterClientBtn = document.getElementById('ajouter-client-btn');
    let clientCounter = 0;

    // Fonction pour créer un nouveau champ client avec son montant
    function createClientField() {
        const clientDiv = document.createElement('div');
        clientDiv.className = 'client-supplementaire mb-3 border-bottom pb-3';
        
        const row = document.createElement('div');
        row.className = 'row g-3';

        // Colonne pour le select client
        const clientCol = document.createElement('div');
        clientCol.className = 'col-md-6';

        const clientLabel = document.createElement('label');
        clientLabel.className = 'form-label';
        clientLabel.textContent = 'Client Supplémentaire';

        const selectClient = document.createElement('select');
        selectClient.className = 'form-select';
        selectClient.name = 'clients_supplementaires[]';
        selectClient.required = true;

        // Copier les options du select client principal
        const originalSelect = document.querySelector('select[name="client_id"]');
        if (originalSelect) {
            // Ajouter une option vide par défaut
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Sélectionnez un client';
            selectClient.appendChild(defaultOption);

            // Copier les autres options
            originalSelect.querySelectorAll('option:not(:first-child)').forEach(option => {
                const newOption = option.cloneNode(true);
                selectClient.appendChild(newOption);
            });
        }

        // Colonne pour le montant
        const montantCol = document.createElement('div');
        montantCol.className = 'col-md-5';

        const montantLabel = document.createElement('label');
        montantLabel.className = 'form-label';
        montantLabel.textContent = 'Montant';

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
            clientDiv.remove();
        };

        // Assembler les éléments
        clientCol.appendChild(clientLabel);
        clientCol.appendChild(selectClient);
        
        montantCol.appendChild(montantLabel);
        montantCol.appendChild(montantInput);
        
        btnCol.appendChild(deleteBtn);
        
        row.appendChild(clientCol);
        row.appendChild(montantCol);
        row.appendChild(btnCol);
        
        clientDiv.appendChild(row);

        return clientDiv;
    }

    // Gérer l'affichage du mode groupage
    if (modeGroupageSwitch) {
        modeGroupageSwitch.addEventListener('change', function() {
            const isGroupage = this.checked;
            
            // Afficher/masquer la section des clients supplémentaires
            if (clientsContainer) {
                if (isGroupage) {
                    clientsContainer.classList.remove('d-none');
                } else {
                    clientsContainer.classList.add('d-none');
                    if (clientsList) {
                        clientsList.innerHTML = '';
                    }
                }
            }

            // Mettre à jour le champ caché mode_groupage
            let modeGroupageInput = document.querySelector('input[name="mode_groupage"]');
            if (!modeGroupageInput) {
                modeGroupageInput = document.createElement('input');
                modeGroupageInput.type = 'hidden';
                modeGroupageInput.name = 'mode_groupage';
                document.querySelector('form').appendChild(modeGroupageInput);
            }
            modeGroupageInput.value = isGroupage ? 'true' : 'false';
        });
    }

    // Gérer l'ajout de nouveaux clients
    if (ajouterClientBtn) {
        ajouterClientBtn.addEventListener('click', function() {
            if (clientsList) {
                clientsList.appendChild(createClientField());
                clientCounter++;
            }
        });
    }

    // Initialiser l'état du mode groupage au chargement
    if (modeGroupageSwitch) {
        modeGroupageSwitch.dispatchEvent(new Event('change'));
    }
});
