/**
 * Gestion du calendrier des transporteurs
 * Utilise FullCalendar pour afficher les prestations par transporteur
 */

// Fonction d'initialisation qui sera appelée quand jQuery sera disponible
function initTransporteurCalendrier() {
    // Vérifier que jQuery est disponible
    if (typeof window.jQuery === 'undefined') {
        console.error("jQuery n'est pas disponible pour le calendrier des transporteurs");
        return;
    }
    
    // Utiliser jQuery de manière sécurisée
    const $ = window.jQuery;
    
    $(document).ready(function() {
        // Élément où afficher le calendrier
        const calendarContainer = document.getElementById('transporteur-calendrier');
        
        // Si l'élément n'existe pas dans la page, on s'arrête
        if (!calendarContainer) return;
        
        // Référence au bouton du calendrier
        let calendarButton = $('#show-calendar-btn');
        
        // Si le bouton n'existe pas, on le crée
        if (calendarButton.length === 0) {
            const transporteursDiv = $('.form-group.transporteurs');
            if (transporteursDiv.length) {
                transporteursDiv.prepend(
                    '<button type="button" id="show-calendar-btn" class="btn btn-primary mb-2">' +
                    '<i class="fas fa-calendar-alt mr-2"></i> Afficher le calendrier des disponibilités' +
                    '</button>'
                );
                calendarButton = $('#show-calendar-btn');
            }
        }
        
        // Référence au sélecteur de transporteur dans le formulaire principal
        const transporteursSelect = $('#transporteurs');
        
        // Référence au filtre de transporteur dans la modale
        const transporteurFilter = $('#transporteur-filter');
        
        // Si on a un sélecteur de transporteurs, on remplit le filtre avec les mêmes options
        if (transporteursSelect.length && transporteurFilter.length) {
            // D'abord l'option "Tous les transporteurs"
            transporteurFilter.html('<option value="">Tous les transporteurs</option>');
            
            // Ensuite on ajoute toutes les options du sélecteur principal
            transporteursSelect.find('option').each(function() {
                const option = $(this);
                if (option.val()) {  // Ignorer les options sans valeur
                    const text = option.text().replace(/✅ Disponible|❌ Indisponible.*$/, '').trim();
                    transporteurFilter.append(
                        $('<option></option>').val(option.val()).text(text)
                    );
                }
            });
        }
        
        // Instance de FullCalendar
        let calendar;
        
        // Fonction pour initialiser le calendrier
        function initCalendar() {
            const calendarEl = document.getElementById('transporteur-calendrier');
            
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listMonth'
                },
                locale: 'fr',
                themeSystem: 'bootstrap',
                height: 'auto',
                navLinks: true,
                editable: false,
                selectable: false,
                nowIndicator: true,
                dayMaxEvents: true,
                events: function(info, successCallback, failureCallback) {
                    // Récupérer les prestations pour la période demandée
                    let url = `/api/transporteurs-calendrier?debut=${info.startStr}&fin=${info.endStr}`;
                    
                    // Ajouter le filtre de transporteur si spécifié
                    const transporteurId = transporteurFilter.val();
                    if (transporteurId) {
                        url += `&transporteur_id=${transporteurId}`;
                    }
                    
                    $.ajax({
                        url: url,
                        type: 'GET',
                        success: function(data) {
                            successCallback(data);
                        },
                        error: function(error) {
                            console.error('Erreur lors de la récupération des événements:', error);
                            failureCallback(error);
                        }
                    });
                },
                eventDidMount: function(info) {
                    // Ajouter des informations au survol
                    $(info.el).tooltip({
                        title: info.event.title,
                        placement: 'top',
                        trigger: 'hover',
                        container: 'body'
                    });
                },
                eventClick: function(info) {
                    // Afficher les détails de la prestation dans une modale
                    const event = info.event;
                    const props = event.extendedProps;
                    
                    // Formatter les dates
                    const dateDebut = new Date(event.start).toLocaleDateString('fr-FR');
                    const dateFin = new Date(event.end).toLocaleDateString('fr-FR');
                    
                    // Construire le HTML pour les détails
                    const transporteurs = Array.isArray(props.transporteurs) ? props.transporteurs.join(', ') : 'Aucun';
                    
                    const detailsHTML = `
                        <div class="modal" id="event-details-modal">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title">Détails de la prestation</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                                    </div>
                                    <div class="modal-body">
                                        <p><strong>Client:</strong> ${props.client}</p>
                                        <p><strong>Type:</strong> ${props.type_demenagement}</p>
                                        <p><strong>Dates:</strong> Du ${dateDebut} au ${dateFin}</p>
                                        <p><strong>Adresse départ:</strong> ${props.adresse_depart}</p>
                                        <p><strong>Adresse arrivée:</strong> ${props.adresse_arrivee}</p>
                                        <p><strong>Statut:</strong> ${props.statut}</p>
                                        <p><strong>Priorité:</strong> ${props.priorite}</p>
                                        <p><strong>Transporteurs:</strong> ${transporteurs}</p>
                                        ${props.observations ? `<p><strong>Observations:</strong> ${props.observations}</p>` : ''}
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Supprimer l'ancienne modale de détails si elle existe
                    $('#event-details-modal').remove();
                    
                    // Ajouter la nouvelle modale au document
                    $('body').append(detailsHTML);
                    
                    // Afficher la modale
                    const modal = new bootstrap.Modal(document.getElementById('event-details-modal'));
                    modal.show();
                }
            });
            
            calendar.render();
        }
        
        // Événement pour afficher le calendrier quand on clique sur le bouton
        $(document).on('click', '#show-calendar-btn', function() {
            // Afficher la modale
            const calendarModal = new bootstrap.Modal(document.getElementById('calendar-modal'));
            calendarModal.show();
            
            // Initialiser le calendrier à l'ouverture de la modale
            setTimeout(() => {
                if (!calendar) {
                    initCalendar();
                } else {
                    calendar.render();
                }
            }, 150);
        });
        
        // Mettre à jour le calendrier quand on change le filtre
        transporteurFilter.on('change', function() {
            if (calendar) {
                calendar.refetchEvents();
            }
        });
        
        // Réinitialiser le calendrier quand on ferme la modale
        $('#calendar-modal').on('hidden.bs.modal', function() {
            if (calendar) {
                calendar.destroy();
                calendar = null;
            }
        });
    });
}

// Attendre que le DOM soit chargé pour vérifier jQuery
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si jQuery est déjà disponible
    if (typeof window.jQuery !== 'undefined') {
        initTransporteurCalendrier();
    } else {
        // Si jQuery n'est pas encore disponible, attendre qu'il le soit
        const jQueryCheckInterval = setInterval(function() {
            if (typeof window.jQuery !== 'undefined') {
                clearInterval(jQueryCheckInterval);
                initTransporteurCalendrier();
            }
        }, 100);
        
        // Arrêter de vérifier après 10 secondes pour éviter une boucle infinie
        setTimeout(function() {
            clearInterval(jQueryCheckInterval);
            console.error("jQuery n'a pas été chargé après 10 secondes");
        }, 10000);
    }
});