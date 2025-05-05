
document.addEventListener('DOMContentLoaded', function() {
    const modeGroupageSwitch = document.getElementById('mode_groupage');
    const sectionClientsSupplementaires = document.getElementById('section-clients-supplementaires');
    const clientsSupplementairesContainer = document.getElementById('clients-supplementaires');
    const ajouterClientBtn = document.getElementById('ajouter-client');
    let clientCounter = 1;

    function createClientField() {
        const clientNumber = document.querySelectorAll('.client-supplementaire').length + 2;
        const clientDiv = document.createElement('div');
        clientDiv.className = 'client-supplementaire card mb-3';
        clientDiv.style.borderLeft = '4px solid #28a745';

        // Récupérer les options du select original
        const originalSelect = document.getElementById('client_id');
        const options = Array.from(originalSelect.options)
            .filter(option => option.value)
            .map(option => ({
                value: option.value,
                text: option.text,
                commercialId: option.getAttribute('data-commercial-id')
            }))
            .sort((a, b) => a.text.localeCompare(b.text));

        clientDiv.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">
                        <i class="fas fa-user"></i> Client ${clientNumber}
                    </h6>
                    <button type="button" class="btn btn-sm btn-outline-danger supprimer-client">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="row">
                    <div class="col-12 mb-3">
                        <label class="form-label">Sélectionner un client</label>
                        <select class="form-select" name="clients_supplementaires[]" required>
                            <option value="">Choisir un client...</option>
                            ${options.map(opt => 
                                `<option value="${opt.value}" data-commercial-id="${opt.commercialId}">${opt.text}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Montant</label>
                        <div class="input-group">
                            <input type="number" class="form-control" name="montants_supplementaires[]" 
                                   step="0.01" min="0" placeholder="0.00" required>
                            <span class="input-group-text">€</span>
                        </div>
                    </div>
                </div>
            </div>`;

        const deleteBtn = clientDiv.querySelector('.supprimer-client');
        deleteBtn.addEventListener('click', () => {
            clientDiv.remove();
            updateClientNumbers();
        });

        return clientDiv;
    }

    function updateClientNumbers() {
        document.querySelectorAll('.client-supplementaire').forEach((div, index) => {
            const title = div.querySelector('h6');
            if (title) {
                title.innerHTML = `<i class="fas fa-user"></i> Client ${index + 2}`;
            }
        });
    }

    if (modeGroupageSwitch) {
        modeGroupageSwitch.addEventListener('change', function() {
            if (this.checked) {
                sectionClientsSupplementaires.classList.remove('d-none');
                clientsSupplementairesContainer.innerHTML = '';
            } else {
                sectionClientsSupplementaires.classList.add('d-none');
                clientsSupplementairesContainer.innerHTML = '';
            }
        });
    }

    if (ajouterClientBtn && clientsSupplementairesContainer) {
        ajouterClientBtn.addEventListener('click', () => {
            clientsSupplementairesContainer.appendChild(createClientField());
        });
    }
});
