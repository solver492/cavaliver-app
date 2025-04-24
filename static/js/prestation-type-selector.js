/**
 * Script spécial pour gérer les sélecteurs du formulaire de prestation
 * Ce script assure la compatibilité entre les environnements locaux et hébergés
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sélectionner le champ de type de déménagement
    const typeSelector = document.getElementById('type_demenagement_id');
    const vehiculesContainer = document.getElementById('vehicules_suggeres');
    
    if (typeSelector && vehiculesContainer) {
        // Écouter les changements sur le sélecteur de type
        typeSelector.addEventListener('change', function() {
            const selectedType = this.value;
            
            // Vider la zone des véhicules suggérés
            vehiculesContainer.value = '';
            
            // Si un type valide est sélectionné
            if (selectedType && selectedType !== '') {
                // Afficher un message d'attente
                vehiculesContainer.value = 'Chargement des véhicules suggérés...';
                
                // Faire une requête AJAX pour récupérer les véhicules adaptés
                fetch(`/prestations/check-disponibilite?type_id=${selectedType}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Formater les véhicules suggérés
                            const vehicleText = data.vehicules_adaptes && data.vehicules_adaptes.length > 0 
                                ? `Véhicules recommandés pour ce type de déménagement:\n${data.vehicules_adaptes.join('\n')}` 
                                : 'Aucun véhicule spécifique recommandé pour ce type de déménagement.';
                            
                            // Mettre à jour le contenu du textarea
                            vehiculesContainer.value = vehicleText;
                        } else {
                            vehiculesContainer.value = 'Erreur lors de la récupération des véhicules suggérés.';
                        }
                    })
                    .catch(error => {
                        console.error('Erreur:', error);
                        vehiculesContainer.value = 'Erreur de connexion lors de la recherche des véhicules suggérés.';
                    });
            }
        });
    }
    
    // Gérer l'affichage des calendriers
    const calendarBtn = document.getElementById('show-calendar-btn');
    const calendarModal = document.getElementById('calendar-modal');
    
    if (calendarBtn && calendarModal) {
        calendarBtn.addEventListener('click', function() {
            const dateDebut = document.getElementById('date_debut').value;
            const dateFin = document.getElementById('date_fin').value;
            
            if (!dateDebut || !dateFin) {
                alert('Veuillez d\'abord sélectionner les dates de début et de fin.');
                return;
            }
            
            // Afficher le modal
            const modalInstance = new bootstrap.Modal(calendarModal);
            modalInstance.show();
            
            // Charger les disponibilités des transporteurs (si le code est présent)
            if (typeof loadTransporteurAvailability === 'function') {
                loadTransporteurAvailability(dateDebut, dateFin);
            }
        });
    }
});
