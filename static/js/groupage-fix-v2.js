
document.addEventListener('DOMContentLoaded', function() {
    const sectionClientsSupplementaires = document.getElementById('section-clients-supplementaires');
    const clientsSupplementairesContainer = document.getElementById('clients-supplementaires');
    const ajouterClientBtn = document.getElementById('ajouter-client');
    const modeGroupageSwitch = document.getElementById('mode_groupage');

    function createClientField() {
        const clientNumber = document.querySelectorAll('.client-supplementaire').length + 2;
        const clientDiv = document.createElement('div');
        clientDiv.className = 'client-supplementaire card mb-3 fade-in';
        clientDiv.style.borderLeft = '4px solid #28a745';

        // Get original select options
        const clientSelect = document.getElementById('client_id');
        const options = Array.from(clientSelect.options)
            .filter(option => option.value)
            .sort((a, b) => a.text.localeCompare(b.text));

        clientDiv.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">
                        <i class="fas fa-user"></i> Client ${clientNumber}
                    </h6>
                    <button type="button" class="btn btn-sm btn-outline-danger supprimer-client">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="row g-3">
                    <div class="col-md-8">
                        <label class="form-label">Sélectionner un client</label>
                        <select class="form-select" name="clients_supplementaires[]" required>
                            <option value="">Choisir un client...</option>
                            ${options.map(option => 
                                `<option value="${option.value}">${option.text}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Montant</label>
                        <div class="input-group">
                            <input type="number" class="form-control" name="montants_supplementaires[]" 
                                   step="0.01" min="0" placeholder="0.00" required>
                            <span class="input-group-text">€</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const deleteBtn = clientDiv.querySelector('.supprimer-client');
        deleteBtn.addEventListener('click', () => {
            clientDiv.classList.add('fade-out');
            setTimeout(() => clientDiv.remove(), 300);
        });

        return clientDiv;
    }

    if (modeGroupageSwitch) {
        modeGroupageSwitch.addEventListener('change', function() {
            if (this.checked) {
                sectionClientsSupplementaires.classList.remove('d-none');
                // Clear existing clients when switching to groupage mode
                if (clientsSupplementairesContainer) {
                    clientsSupplementairesContainer.innerHTML = '';
                }
            } else {
                sectionClientsSupplementaires.classList.add('d-none');
                if (clientsSupplementairesContainer) {
                    clientsSupplementairesContainer.innerHTML = '';
                }
            }
        });
    }

    if (ajouterClientBtn && clientsSupplementairesContainer) {
        ajouterClientBtn.addEventListener('click', () => {
            clientsSupplementairesContainer.appendChild(createClientField());
        });
    }
});
