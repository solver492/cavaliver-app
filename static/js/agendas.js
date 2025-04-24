document.addEventListener('DOMContentLoaded', function() {
    // Validation du formulaire
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Gestion des observations
    const observationsContainer = document.getElementById('observationsContainer');
    if (observationsContainer) {
        observationsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('add-observation') || e.target.closest('.add-observation')) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group mb-2';
                inputGroup.innerHTML = `
                    <input type="text" name="observations[]" class="form-control" placeholder="Observation">
                    <button type="button" class="btn btn-outline-danger remove-observation">
                        <i class="fas fa-minus"></i>
                    </button>
                `;
                document.querySelector('.observation-inputs').appendChild(inputGroup);
            } else if (e.target.classList.contains('remove-observation') || e.target.closest('.remove-observation')) {
                e.target.closest('.input-group').remove();
            }
        });
    }

    // Gestion des couleurs d'agenda
    const agendaCards = document.querySelectorAll('.agenda-card');
    agendaCards.forEach(card => {
        const color = card.dataset.color;
        if (color) {
            card.style.borderColor = color;
            const header = card.querySelector('.agenda-header');
            if (header) {
                header.style.backgroundColor = color;
            }
        }
    });

    // Initialisation des tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Fonction pour éditer un agenda
function editAgenda(agendaId, agendaNom) {
    // Récupérer les détails de l'agenda
    fetch(`/calendrier/api/agendas/${agendaId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const agenda = data.agenda;
                
                // Remplir le formulaire de modification
                document.getElementById('edit_agenda_id').value = agenda.id;
                document.getElementById('edit_nom').value = agenda.nom;
                document.getElementById('edit_type_agenda').value = agenda.type_agenda;
                document.getElementById('edit_description').value = agenda.description || '';
                document.getElementById('edit_couleur').value = agenda.couleur;

                // Gérer les observations
                const observationsContainer = document.getElementById('edit_observations_container');
                observationsContainer.innerHTML = '';
                
                if (agenda.observations && agenda.observations.length > 0) {
                    agenda.observations.forEach(observation => {
                        const inputGroup = document.createElement('div');
                        inputGroup.className = 'input-group mb-2';
                        inputGroup.innerHTML = `
                            <input type="text" name="observations[]" class="form-control" value="${observation}">
                            <button type="button" class="btn btn-outline-danger" onclick="removeObservation(this)">
                                <i class="bi bi-dash"></i>
                            </button>
                        `;
                        observationsContainer.appendChild(inputGroup);
                    });
                }

                // Afficher le modal
                const modal = new bootstrap.Modal(document.getElementById('modifierAgendaModal'));
                modal.show();
            } else {
                alert('Erreur lors de la récupération des détails de l\'agenda');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Une erreur est survenue lors de la récupération des détails de l\'agenda');
        });
}

// Fonction pour supprimer une observation
function removeObservation(button) {
    button.closest('.input-group').remove();
}

// Fonction pour ajouter une observation
function addObservation() {
    const container = document.getElementById('observations-container');
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group mb-2';
    inputGroup.innerHTML = `
        <input type="text" name="observations[]" class="form-control">
        <button type="button" class="btn btn-outline-danger" onclick="removeObservation(this)">
            <i class="bi bi-dash"></i>
        </button>
    `;
    container.appendChild(inputGroup);
}
