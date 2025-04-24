// Gestion des événements du calendrier

// Fonction utilitaire pour afficher des notifications
function showNotification(message, type) {
    try {
        // Utiliser Toastr si disponible
        if (typeof toastr !== 'undefined') {
            if (type === 'success') {
                toastr.success(message);
            } else if (type === 'error') {
                toastr.error(message);
            } else if (type === 'warning') {
                toastr.warning(message);
            } else {
                toastr.info(message);
            }
        } else {
            // Sinon, utiliser alert
            alert(message);
        }
    } catch (error) {
        console.error('Erreur lors de l\'affichage de la notification:', error);
        alert(message);
    }
}

// Fonction pour créer un nouvel événement
function soumettreEvenement() {
    try {
        console.log('Début de la soumission de l\'\u00e9vénement');
        const form = document.getElementById('evenementForm');
        if (!form) {
            console.error('Formulaire non trouvé');
            alert('Erreur: Formulaire non trouvé');
            return;
        }

        const formData = new FormData(form);
        const agendaId = formData.get('agenda_id');

        if (!agendaId) {
            console.error('ID d\'agenda manquant');
            alert('Erreur: ID d\'agenda manquant');
            return;
        }

        console.log('Envoi de la requête pour créer l\'\u00e9vénement');
        fetch(`/calendrier/agendas/${agendaId}/evenements/creer`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('Réponse reçue:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Données reçues:', data);
            if (data.success) {
                // Fermer le modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('nouvelEvenementModal'));
                if (modal) modal.hide();

                // Rafraîchir le calendrier
                if (window.calendar) {
                    console.log('Rafraîchissement du calendrier');
                    window.calendar.refetchEvents();
                } else {
                    console.log('Rechargement de la page');
                    window.location.reload();
                }

                // Notification de succès
                showNotification('Événement créé avec succès', 'success')
            } else {
                console.error('Erreur lors de la création:', data.error);
                showNotification('Erreur lors de la création: ' + (data.error || 'Erreur inconnue'), 'error')
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la création de l\'\u00e9vénement', 'error')
        });
    } catch (error) {
        console.error('Erreur dans soumettreEvenement:', error);
        alert('Une erreur est survenue lors de la création de l\'\u00e9vénement');
    }
}

// Variable globale pour stocker l'ID de l'événement actuel
let currentEventId = null;
let currentEvent = null;

// Fonction pour afficher les détails d'un événement (rendue globale)
window.voirDetails = function(eventId) {
    try {
        console.log('Affichage des détails pour l\'\u00e9vénement ID:', eventId);
        currentEventId = eventId;

        // Récupérer l'événement depuis le calendrier
        const event = window.calendar.getEventById(eventId);
        if (!event) {
            console.error('Événement non trouvé:', eventId);
            alert('Erreur: Événement non trouvé');
            return;
        }

        console.log('Événement trouvé:', event);
        currentEvent = event;

        // Mettre à jour les informations de l'événement de manière sécurisée
        const elements = {
            title: document.getElementById('eventTitle'),
            dates: document.getElementById('eventDates'),
            type: document.getElementById('eventType'),
            observations: document.getElementById('eventObservations'),
            prestationDiv: document.getElementById('eventPrestation'),
            prestationActions: document.getElementById('prestationActions'),
            prestationInfo: document.getElementById('prestationInfo')
        };

        // Vérifier que tous les éléments nécessaires existent
        if (!elements.title || !elements.dates || !elements.type) {
            console.error('Éléments du modal manquants:', elements);
            alert('Erreur: Éléments du modal manquants');
            return;
        }

        // Mettre à jour les valeurs
        elements.title.textContent = event.title || '';
        elements.dates.textContent = formatDates(event.start, event.end);
        elements.type.textContent = event.extendedProps.type || '';

        // Mettre à jour les observations si l'élément existe
        if (elements.observations) {
            elements.observations.value = event.extendedProps.observations || '';
        }

        // Gérer l'affichage de la prestation si les éléments existent
        if (elements.prestationDiv && elements.prestationActions) {
            if (event.extendedProps.prestation) {
                elements.prestationDiv.classList.remove('d-none');
                elements.prestationActions.style.display = 'none';

                // Afficher les informations de la prestation si l'élément existe
                if (elements.prestationInfo) {
                    elements.prestationInfo.textContent = 'Prestation assignée';
                }
            } else {
                elements.prestationDiv.classList.add('d-none');
                elements.prestationActions.style.display = 'block';
            }
        }

        // Charger les documents
        if (typeof chargerDocuments === 'function') {
            chargerDocuments(eventId);
        }

        // Mettre à jour le bouton d'archive
        if (typeof updateArchiveButton === 'function') {
            updateArchiveButton(event.extendedProps.archive);
        }

        // Afficher le modal de manière sécurisée
        const modalElement = document.getElementById('detailsEvenementModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('Modal non trouvé');
            alert('Erreur: Modal non trouvé');
        }
    } catch (error) {
        console.error('Erreur dans voirDetails:', error);
        alert('Une erreur est survenue lors de l\'affichage des détails');
    }
};

// Fonction pour formater les dates
window.formatDates = function(start, end) {
    try {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        let formatted = start.toLocaleDateString('fr-FR', options);
        if (end) {
            formatted += ' - ' + end.toLocaleDateString('fr-FR', options);
        }
        return formatted;
    } catch (error) {
        console.error('Erreur dans formatDates:', error);
        return 'Date non disponible';
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Gestionnaire pour le formulaire de modification d'événement
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const eventId = this.dataset.eventId;

            const formData = {
                titre: document.getElementById('eventTitle').value,
                date_debut: document.getElementById('eventStart').value,
                date_fin: document.getElementById('eventEnd').value,
                type_evenement: document.getElementById('eventType').value
            };

            try {
                const response = await fetch(`/api/evenements/${eventId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (data.success) {
                    // Mettre à jour l'affichage du calendrier
                    calendar.refetchEvents();
                    // Fermer le modal
                    $('#eventModal').modal('hide');
                    // Afficher un message de succès
                    showNotification('Événement modifié avec succès', 'success');
                } else {
                    showNotification(data.error || 'Erreur lors de la modification', 'error');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la modification', 'error');
            }
        });
    }

    // Gestionnaire pour l'ajout d'observations
    const observationForm = document.getElementById('observationForm');
    if (observationForm) {
        observationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const eventId = this.dataset.eventId;

            // Récupérer toutes les observations
            const observations = Array.from(document.querySelectorAll('.observation-input'))
                .map(input => input.value)
                .filter(text => text.trim() !== '');

            try {
                const response = await fetch(`/api/evenements/${eventId}/observations`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ observations })
                });

                const data = await response.json();
                if (data.success) {
                    toastr.success('Observations enregistrées');
                    // Mettre à jour l'affichage des observations
                    document.getElementById('observationsList').innerHTML = data.observations.split('\n---\n').map(
                        obs => `<div class="observation-item">${obs}</div>`
                    ).join('');
                } else {
                    toastr.error(data.error || 'Erreur lors de l\'enregistrement');
                }
            } catch (error) {
                console.error('Erreur:', error);
                toastr.error('Erreur lors de l\'enregistrement');
            }
        });
    }

    // Gestionnaire pour l'assignation de prestation
    const prestationForm = document.getElementById('prestationForm');
    if (prestationForm) {
        prestationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const eventId = this.dataset.eventId;
            const prestationId = document.getElementById('prestationSelect').value;

            if (!prestationId) {
                toastr.warning('Veuillez sélectionner une prestation');
                return;
            }

            try {
                const response = await fetch(`/api/evenements/${eventId}/assigner-prestation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prestation_id: prestationId })
                });

                const data = await response.json();
                if (data.success) {
                    toastr.success('Prestation assignée avec succès');
                    // Mettre à jour l'affichage de la prestation
                    document.getElementById('prestationInfo').innerHTML = `
                        <div class="prestation-details">
                            <p><strong>Type:</strong> ${data.prestation.type}</p>
                            <p><strong>Client:</strong> ${data.prestation.client}</p>
                            <p><strong>Date:</strong> ${new Date(data.prestation.date_debut).toLocaleDateString()}</p>
                        </div>
                    `;
                } else {
                    toastr.error(data.error || 'Erreur lors de l\'assignation');
                }
            } catch (error) {
                console.error('Erreur:', error);
                toastr.error('Erreur lors de l\'assignation');
            }
        });
    }

    // Gestionnaire pour l'upload de documents
    const documentForm = document.getElementById('documentForm');
    if (documentForm) {
        documentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const eventId = this.dataset.eventId;
            const fileInput = document.getElementById('documentFile');

            if (!fileInput.files.length) {
                toastr.warning('Veuillez sélectionner un fichier');
                return;
            }

            const formData = new FormData();
            formData.append('document', fileInput.files[0]);

            try {
                const response = await fetch(`/api/evenements/${eventId}/documents`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.success) {
                    toastr.success('Document ajouté avec succès');
                    // Ajouter le document à la liste
                    const documentsList = document.getElementById('documentsList');
                    const newDoc = document.createElement('div');
                    newDoc.className = 'document-item';
                    newDoc.innerHTML = `
                        <span>${data.document.nom}</span>
                        <small>${new Date(data.document.date_creation).toLocaleDateString()}</small>
                    `;
                    documentsList.appendChild(newDoc);
                    // Réinitialiser le formulaire
                    fileInput.value = '';
                } else {
                    toastr.error(data.error || 'Erreur lors de l\'ajout');
                }
            } catch (error) {
                console.error('Erreur:', error);
                toastr.error('Erreur lors de l\'ajout');
            }
        });
    }

    function chargerDocuments(eventId) {
        console.log('Chargement des documents pour l\'événement:', eventId);
        try {
            fetch(`/api/evenements/${eventId}/documents`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const documentsList = document.getElementById('documentsList');
                        if (!documentsList) {
                            console.error('Élément documentsList non trouvé');
                            return;
                        }

                        documentsList.innerHTML = '';

                        if (data.documents && data.documents.length > 0) {
                            data.documents.forEach(doc => {
                                const docItem = document.createElement('div');
                                docItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                                docItem.innerHTML = `
                                    <div>
                                        <h6 class="mb-0">${doc.nom}</h6>
                                        <small class="text-muted">${new Date(doc.date_creation).toLocaleDateString()}</small>
                                    </div>
                                    <div>
                                        <button class="btn btn-sm btn-outline-danger" onclick="supprimerDocument(${doc.id})">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                `;
                                documentsList.appendChild(docItem);
                            });
                        } else {
                            documentsList.innerHTML = '<div class="text-muted">Aucun document</div>';
                        }
                    } else {
                        console.error('Erreur lors du chargement des documents:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                });
        } catch (error) {
            console.error('Erreur dans chargerDocuments:', error);
        }
    }

    // Fonction utilitaire pour ajouter un champ d'observation
    window.addObservationField = function() {
        const container = document.getElementById('observationsContainer');
        const newField = document.createElement('div');
        newField.className = 'mb-3 observation-field';
        newField.innerHTML = `
            <div class="input-group">
                <textarea class="form-control observation-input" rows="2"></textarea>
                <button type="button" class="btn btn-danger" onclick="this.closest('.observation-field').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        container.appendChild(newField);
    };

    // Fonction pour ajouter un document
    window.ajouterDocument = function() {
        const fileInput = document.getElementById('documentFile');
        if (!fileInput || !fileInput.files.length) {
            toastr.warning('Veuillez sélectionner un fichier');
            return;
        }

        const formData = new FormData();
        formData.append('document', fileInput.files[0]);

        fetch(`/api/evenements/${currentEventId}/documents`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                toastr.success('Document ajouté avec succès');
                chargerDocuments(currentEventId);
                fileInput.value = '';
            } else {
                showNotification(data.error || 'Erreur lors de l\'ajout du document', 'error');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur lors de l\'ajout du document', 'error');
        });
    };

    // Fonction pour supprimer un document
    window.supprimerDocument = function(docId) {
        if (confirm('Voulez-vous vraiment supprimer ce document ?')) {
            fetch(`/api/documents/${docId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Document supprimé', 'success');
                    chargerDocuments(currentEventId);
                } else {
                    showNotification(data.error || 'Erreur lors de la suppression', 'error');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la suppression du document', 'error');
            });
        }
    };

    // Fonction pour ouvrir la page d'assignation de prestation dans une nouvelle fenêtre
    window.ouvrirAssignation = function() {
        try {
            console.log('Ouverture de la page d\'assignation de prestation');

            // Fermer le modal des détails de l'événement
            const detailsModal = bootstrap.Modal.getInstance(document.getElementById('detailsEvenementModal'));
            if (detailsModal) {
                detailsModal.hide();
            }

            // Récupérer l'ID de l'agenda et de l'événement
            const agendaId = window.location.pathname.split('/').pop();

            if (!currentEventId) {
                console.error('ID de l\'événement non défini');
                showNotification('Erreur: ID de l\'événement non défini', 'error');
                return;
            }

            // Ouvrir la page d'assignation dans une nouvelle fenêtre
            const url = `/calendrier/agendas/${agendaId}/evenements/${currentEventId}/assigner-prestation`;
            const windowFeatures = 'width=600,height=600,resizable=yes,scrollbars=yes,status=yes';
            window.open(url, 'AssignerPrestation', windowFeatures);

        } catch (error) {
            console.error('Erreur lors de l\'ouverture de la page d\'assignation:', error);
            showNotification('Erreur lors de l\'ouverture de la page d\'assignation', 'error');
        }
    };

    // Fonction pour confirmer l'assignation d'une prestation
    window.confirmerAssignationPrestation = function() {
        // Récupérer la prestation sélectionnée via les boutons radio
        const selectedRadio = document.querySelector('input[name="prestationRadio"]:checked');
        const prestationId = selectedRadio ? selectedRadio.value : null;

        if (!prestationId) {
            showNotification('Veuillez sélectionner une prestation', 'warning');
            return;
        }

        console.log('Prestation sélectionnée:', prestationId);

        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        fetch(`/api/evenements/${currentEventId}/assigner-prestation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ 'prestation_id': prestationId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                toastr.success('Prestation assignée avec succès');

                // Fermer le modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('assignerPrestationModal'));
                if (modal) modal.hide();

                // Mettre à jour l'affichage
                document.getElementById('eventPrestation').classList.remove('d-none');
                document.getElementById('prestationActions').style.display = 'none';
                document.getElementById('prestationInfo').innerHTML = `
                    <strong>${data.prestation.type}</strong> - ${data.prestation.client} (${new Date(data.prestation.date_debut).toLocaleDateString()})
                `;

                // Mettre à jour l'événement dans le calendrier
                const event = calendar.getEventById(currentEventId);
                if (event) {
                    event.setExtendedProp('prestation', data.prestation);
                    calendar.refetchEvents();
                }
            } else {
                toastr.error(data.error || 'Erreur lors de l\'assignation');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur lors de l\'assignation de la prestation', 'error');
        });
    };

    // Fonction pour ajouter une observation
    window.ajouterObservation = function() {
        const container = document.getElementById('observationsList');
        const newField = document.createElement('div');
        newField.className = 'mb-3 observation-field';
        newField.innerHTML = `
            <div class="input-group">
                <textarea class="form-control observation-text" rows="2"></textarea>
                <button type="button" class="btn btn-danger" onclick="supprimerObservation(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(newField);
    };

    // Fonction pour supprimer une observation
    window.supprimerObservation = function(button) {
        button.closest('.observation-field').remove();
    };

    // Fonction pour sauvegarder les observations
    window.sauvegarderObservations = function() {
        const observations = [];
        document.querySelectorAll('.observation-text').forEach(textarea => {
            if (textarea.value.trim()) {
                observations.push(textarea.value.trim());
            }
        });

        fetch(`/api/evenements/${currentEventId}/observations`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ observations })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Observations sauvegardées', 'success');
                document.getElementById('eventObservations').value = data.observations;

                // Mettre à jour l'événement dans le calendrier
                const event = calendar.getEventById(currentEventId);
                if (event) {
                    event.setExtendedProp('observations', data.observations);
                }
            } else {
                showNotification(data.error || 'Erreur lors de la sauvegarde', 'error');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la sauvegarde des observations', 'error');
        });
    };

    // Fonction pour ouvrir la modification d'un événement
    window.ouvrirModification = function() {
        if (!currentEvent) return;

        // Remplir le formulaire avec les données de l'événement
        document.getElementById('edit_event_id').value = currentEvent.id;
        document.getElementById('edit_titre').value = currentEvent.title;
        document.getElementById('edit_type').value = currentEvent.extendedProps.type || 'autre';

        // Formater les dates pour l'input datetime-local
        if (currentEvent.start) {
            const dateDebut = currentEvent.start.toISOString().slice(0, 16);
            document.getElementById('edit_date_debut').value = dateDebut;
        }

        if (currentEvent.end) {
            const dateFin = currentEvent.end.toISOString().slice(0, 16);
            document.getElementById('edit_date_fin').value = dateFin;
        } else {
            document.getElementById('edit_date_fin').value = '';
        }

        // Afficher la version
        document.getElementById('version_number').textContent = currentEvent.extendedProps.version || '1';

        // Fermer le modal de détails et ouvrir celui de modification
        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('detailsEvenementModal'));
        if (detailsModal) detailsModal.hide();

        const editModal = new bootstrap.Modal(document.getElementById('modifierEvenementModal'));
        editModal.show();
    };

    // Fonction pour sauvegarder les modifications
    window.sauvegarderModifications = function() {
        const eventId = document.getElementById('edit_event_id').value;
        const formData = {
            titre: document.getElementById('edit_titre').value,
            date_debut: document.getElementById('edit_date_debut').value,
            date_fin: document.getElementById('edit_date_fin').value,
            type_evenement: document.getElementById('edit_type').value
        };

        fetch(`/api/evenements/${eventId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Événement modifié avec succès', 'success');

                // Fermer le modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modifierEvenementModal'));
                if (modal) modal.hide();

                // Mettre à jour la version
                document.getElementById('version_number').textContent = data.version;

                // Rafraîchir le calendrier
                calendar.refetchEvents();
            } else {
                showNotification(data.error || 'Erreur lors de la modification', 'error');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la modification', 'error');
        });
    };

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function assignerPrestationDirecte(prestationId) {
        // Cette fonction est maintenant implémentée directement dans le template agenda_detail.html
        // pour éviter les conflits, nous redirigeons vers l'implémentation du template
        console.log("Redirection vers l'implémentation dans le template");
        
        if (typeof window.assignerPrestationDirecteTemplate === 'function') {
            // Si la fonction du template est disponible, l'utiliser
            window.assignerPrestationDirecteTemplate(prestationId);
        } else {
            // Sinon, afficher un message d'erreur
            console.error("La fonction assignerPrestationDirecteTemplate n'est pas disponible");
            alert("Erreur: La fonction d'assignation n'est pas disponible. Veuillez rafraîchir la page.");
        }
    }
});