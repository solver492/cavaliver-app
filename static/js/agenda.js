// Fonction pour ajouter une observation
function ajouterObservation() {
    const container = document.getElementById('observations-container');
    const newEntry = document.createElement('div');
    newEntry.className = 'observation-entry mb-2';
    newEntry.innerHTML = `
        <textarea class="form-control" name="observations[]" rows="2"></textarea>
    `;
    container.appendChild(newEntry);
}

// Fonction pour modifier un agenda
function modifierAgenda(agendaId) {
    fetch(`/calendrier/agendas/${agendaId}/edit`)
        .then(response => response.json())
        .then(data => {
            document.querySelector('input[name="nom"]').value = data.nom;
            document.querySelector('select[name="type_agenda"]').value = data.type_agenda;
            document.querySelector('input[name="couleur"]').value = data.couleur;
            document.querySelector('textarea[name="description"]').value = data.description;

            const modal = new bootstrap.Modal(document.getElementById('nouvelAgendaModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de la récupération des données');
        });
}

// Fonction pour archiver un agenda
function archiverAgenda(agendaId) {
    if (confirm('Êtes-vous sûr de vouloir archiver cet agenda ?')) {
        fetch(`/calendrier/agendas/${agendaId}/archive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Erreur réseau');
            return response.json();
        })
        .then(() => window.location.reload())
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'archivage');
        });
    }
}

// Fonction pour supprimer un agenda
function supprimerAgenda(agendaId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet agenda ? Cette action est irréversible.')) {
        fetch(`/calendrier/agendas/${agendaId}/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Erreur réseau');
            return response.json();
        })
        .then(() => window.location.reload())
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression');
        });
    }
}

// Fonction pour mettre à jour l'affichage des événements
function updateAgendaEvents(agendaId) {
    fetch(`/calendrier/agendas/${agendaId}/evenements`)
        .then(response => response.json())
        .then(events => {
            const container = document.querySelector(`[data-agenda-id="${agendaId}"] .agenda-events`);
            if (!container) return;
            
            container.innerHTML = '';
            if (events.length === 0) {
                container.innerHTML = '<li class="text-muted">Aucun événement programmé</li>';
                return;
            }
            
            events.forEach(event => {
                const eventElement = document.createElement('li');
                eventElement.className = 'agenda-event';
                eventElement.innerHTML = `
                    <strong>${event.type_demenagement || event.titre}</strong>
                    <small class="text-muted d-block">${new Date(event.date_debut).toLocaleDateString()}</small>
                `;
                container.appendChild(eventElement);
            });
        });
}

// Fonction pour créer un événement
function creerEvenement(agendaId) {
    document.getElementById('agenda_id').value = agendaId;
    const modal = new bootstrap.Modal(document.getElementById('nouvelEvenementModal'));
    modal.show();
}

// Fonction pour soumettre un événement
function soumettreEvenement() {
    const form = document.getElementById('evenementForm');
    const type = document.getElementById('type_evenement').value;
    const formData = new FormData(form);
    const agendaId = document.getElementById('agenda_id').value;
    
    // Mettre à jour l'affichage après soumission
    const submitPromise = new Promise((resolve) => {
        if (type === 'prestation') {
            const queryParams = new URLSearchParams(formData);
            window.location.href = `/prestations/add?${queryParams.toString()}`;
            resolve();
        } else if (type === 'stockage') {
            const queryParams = new URLSearchParams(formData);
            window.location.href = `/stockages/add?${queryParams.toString()}`;
            resolve();
        }
    });
    
    submitPromise.then(() => updateAgendaEvents(agendaId));

    let redirectUrl = '';
    if (type === 'prestation') {
        redirectUrl = '/prestations/add';
    } else if (type === 'stockage') {
        redirectUrl = '/stockages/add';
    }

    if (redirectUrl) {
        const queryParams = new URLSearchParams(formData);
        queryParams.append('agenda_id', agendaId);
        window.location.href = `${redirectUrl}?${queryParams.toString()}`;
    }
}

// Pour la couleur de l'agenda
document.addEventListener('DOMContentLoaded', function() {
    const colorInput = document.querySelector('input[name="couleur"]');
    if (colorInput) {
        colorInput.addEventListener('input', function() {
            const preview = document.getElementById('agenda-preview');
            const agendaHeader = this.closest('.modal-body').querySelector('.agenda-header');
            if (preview) {
                preview.style.setProperty('--agenda-color', this.value);
            }
            if (agendaHeader) {
                agendaHeader.style.setProperty('--agenda-color', this.value);
            }
        });
    }
    
    // Appliquer les couleurs aux agendas existants
    document.querySelectorAll('.agenda-card').forEach(card => {
        const color = card.dataset.color;
        if (color) {
            const header = card.querySelector('.agenda-header');
            if (header) {
                card.style.setProperty('--agenda-color', color);
            }
        }
    });
});