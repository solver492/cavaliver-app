/**
 * Module de gestion des transporteurs disponibles pour l'édition des prestations
 * Ce script permet d'afficher les transporteurs disponibles dans la page d'édition
 * en utilisant l'API /check-disponibilite
 */

document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si on est sur la page d'édition
    const prestationPage = document.querySelector('.prestation-page');
    const editForm = document.querySelector('form[action*="/edit/"]');
    
    if (!prestationPage || !editForm) return;
    
    // Références aux éléments du DOM
    const verifierDisponibiliteBtn = document.getElementById('verifier-disponibilite');
    const showCalendarBtn = document.getElementById('show-calendar-btn');
    const transporteursResultatsDiv = document.getElementById('transporteurs-disponibles-resultats');
    const transporteursSelect = document.getElementById('transporteurs');
    const transporteursBientotDisponiblesDiv = document.getElementById('transporteurs-bientot-disponibles');
    const transporteursBientotDisponiblesTable = transporteursBientotDisponiblesDiv ? transporteursBientotDisponiblesDiv.querySelector('tbody') : null;
    
    // Éléments du formulaire nécessaires pour la vérification
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement');
    const prestationId = editForm.action.split('/').pop(); // Récupérer l'ID depuis l'URL
    
    // Fonction pour afficher les résultats
    function afficherResultats(response) {
        // Nettoyer les conteneurs
        if (transporteursResultatsDiv) {
            transporteursResultatsDiv.innerHTML = '';
            transporteursResultatsDiv.style.display = 'block';
        }
        
        if (transporteursSelect) {
            // Sauvegarder les transporteurs actuellement sélectionnés
            const selectedIds = Array.from(transporteursSelect.selectedOptions).map(option => option.value);
            
            // Effacer les options existantes
            transporteursSelect.innerHTML = '';
            
            // Afficher les transporteurs disponibles
            if (response.transporteurs && response.transporteurs.length > 0) {
                response.transporteurs.forEach(transporteur => {
                    const option = document.createElement('option');
                    option.value = transporteur.id;
                    
                    // Marquer comme sélectionné si l'était auparavant
                    if (selectedIds.includes(transporteur.id.toString())) {
                        option.selected = true;
                    }
                    
                    // Style pour les véhicules adaptés ou non
                    if (transporteur.vehicule_adapte) {
                        option.classList.add('vehicule-adapte');
                        option.innerHTML = `${transporteur.prenom} ${transporteur.nom} - <strong>${transporteur.vehicule}</strong> ✅`;
                    } else {
                        option.classList.add('vehicule-non-adapte');
                        option.innerHTML = `${transporteur.prenom} ${transporteur.nom} - ${transporteur.vehicule} ⚠️`;
                    }
                    
                    transporteursSelect.appendChild(option);
                });
            } else {
                // Message s'il n'y a pas de transporteurs disponibles
                const option = document.createElement('option');
                option.disabled = true;
                option.textContent = 'Aucun transporteur disponible pour cette période';
                transporteursSelect.appendChild(option);
            }
        }
        
        // Afficher les résultats dans le div prévu
        if (transporteursResultatsDiv) {
            // Créer un message récapitulatif
            const disponiblesCount = response.transporteurs ? response.transporteurs.length : 0;
            const bientotDisponiblesCount = response.soon_available ? response.soon_available.length : 0;
            
            let message = `<div class="alert alert-${disponiblesCount > 0 ? 'success' : 'warning'} mb-3">`;
            message += `<i class="fas fa-${disponiblesCount > 0 ? 'check-circle' : 'exclamation-triangle'}"></i> `;
            
            if (disponiblesCount > 0) {
                message += `<strong>${disponiblesCount}</strong> transporteur${disponiblesCount > 1 ? 's' : ''} disponible${disponiblesCount > 1 ? 's' : ''} `;
            } else {
                message += `<strong>Aucun transporteur disponible</strong> `;
            }
            
            message += `pour la période du <strong>${dateDebutInput.value.split('-').reverse().join('/')}</strong> au <strong>${dateFinInput.value.split('-').reverse().join('/')}</strong>`;
            
            if (bientotDisponiblesCount > 0) {
                message += `<br><small>${bientotDisponiblesCount} transporteur${bientotDisponiblesCount > 1 ? 's' : ''} sera${bientotDisponiblesCount > 1 ? 'ont' : ''} bientôt disponible${bientotDisponiblesCount > 1 ? 's' : ''}</small>`;
            }
            
            message += '</div>';
            
            transporteursResultatsDiv.innerHTML = message;
        }
        
        // Afficher le tableau des transporteurs bientôt disponibles
        if (transporteursBientotDisponiblesDiv && transporteursBientotDisponiblesTable) {
            transporteursBientotDisponiblesTable.innerHTML = '';
            
            if (response.soon_available && response.soon_available.length > 0) {
                transporteursBientotDisponiblesDiv.style.display = 'block';
                
                response.soon_available.forEach(transporteur => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${transporteur.prenom} ${transporteur.nom}</td>
                        <td>${transporteur.vehicule}</td>
                        <td>${transporteur.type_vehicule || 'Non spécifié'}</td>
                        <td>${transporteur.disponible_le}</td>
                    `;
                    transporteursBientotDisponiblesTable.appendChild(row);
                });
            } else {
                transporteursBientotDisponiblesDiv.style.display = 'none';
            }
        }
        
        // Mettre à jour le compteur de transporteurs sélectionnés
        if (typeof updateSelectedCount === 'function') {
            updateSelectedCount();
        }
    }
    
    // Fonction pour vérifier la disponibilité
    function verifierDisponibilite() {
        // Vérification des champs obligatoires
        if (!dateDebutInput || !dateDebutInput.value || !dateFinInput || !dateFinInput.value || !typeDemenagementSelect || !typeDemenagementSelect.value) {
            if (transporteursResultatsDiv) {
                transporteursResultatsDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Veuillez remplir tous les champs obligatoires (dates et type de déménagement)
                    </div>
                `;
                transporteursResultatsDiv.style.display = 'block';
            }
            return;
        }
        
        // Afficher un indicateur de chargement
        if (transporteursResultatsDiv) {
            transporteursResultatsDiv.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2">Recherche des transporteurs disponibles...</p>
                </div>
            `;
            transporteursResultatsDiv.style.display = 'block';
        }
        
        // Préparation des données
        const formData = new FormData();
        formData.append('date_debut', dateDebutInput.value);
        formData.append('date_fin', dateFinInput.value);
        formData.append('type_demenagement_id', typeDemenagementSelect.value);
        formData.append('prestation_id', prestationId);
        
        // Appel de l'API
        fetch('/check-disponibilite', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            afficherResultats(data);
        })
        .catch(error => {
            console.error('Erreur lors de la vérification de disponibilité:', error);
            if (transporteursResultatsDiv) {
                transporteursResultatsDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Une erreur est survenue lors de la vérification de disponibilité
                    </div>
                `;
            }
        });
    }
    
    // Écouteurs d'événements
    if (verifierDisponibiliteBtn) {
        verifierDisponibiliteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            verifierDisponibilite();
        });
    }
    
    // Écouteurs pour déclencher automatiquement la vérification
    function triggerVerification() {
        // Vérifier que tous les champs sont remplis avant de lancer automatiquement
        if (dateDebutInput && dateDebutInput.value && 
            dateFinInput && dateFinInput.value && 
            typeDemenagementSelect && typeDemenagementSelect.value) {
            verifierDisponibilite();
        }
    }
    
    // Ajouter des écouteurs pour les champs pertinents
    if (dateDebutInput) dateDebutInput.addEventListener('change', triggerVerification);
    if (dateFinInput) dateFinInput.addEventListener('change', triggerVerification);
    if (typeDemenagementSelect) typeDemenagementSelect.addEventListener('change', triggerVerification);
    
    // Vérification initiale si tous les champs sont remplis
    if (dateDebutInput && dateDebutInput.value && 
        dateFinInput && dateFinInput.value && 
        typeDemenagementSelect && typeDemenagementSelect.value) {
        // Attendre un peu pour laisser la page se charger complètement
        setTimeout(verifierDisponibilite, 1000);
    }
});
