/**
 * Module de gestion de l'API des transporteurs disponibles
 * Ce script se connecte à l'API /check-disponibilite pour afficher les transporteurs disponibles
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Module transporteurs-api-integration chargé');
    
    // Vérifier si on est sur la page d'édition ou de création de prestation
    const transporteursSection = document.querySelector('.transporteurs');
    if (!transporteursSection) {
        console.log('Section transporteurs non trouvée');
        return;
    }
    
    console.log('Section transporteurs trouvée, initialisation...');
    
    // Références aux éléments du DOM
    const verifierBtn = document.querySelector('button#verifier-disponibilite');
    const checkDispoBtn = document.querySelector('button#check-disponibilite');
    const calendarBtn = document.getElementById('show-calendar-btn');
    const resultsContainer = document.getElementById('transporteurs-disponibles-resultats');
    const transporteursSelect = document.getElementById('transporteurs');
    const bientotDisponiblesDiv = document.getElementById('transporteurs-bientot-disponibles');
    const bientotDisponiblesResultats = document.getElementById('transporteurs-bientot-disponibles-resultats');
    const transporteurCounter = document.getElementById('transporteur-counter');
    
    // Log des éléments trouvés pour le débogage
    console.log('Bouton vérifier disponibilité:', verifierBtn);
    console.log('Bouton check disponibilité:', checkDispoBtn);
    console.log('Conteneur résultats:', resultsContainer);
    console.log('Select transporteurs:', transporteursSelect);
    
    // Éléments du formulaire nécessaires pour la vérification
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    
    // Récupérer l'ID de la prestation actuelle (pour l'édition)
    let prestationId = null;
    const editForm = document.querySelector('form[method="POST"]');
    if (editForm && editForm.action) {
        const urlParts = editForm.action.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (!isNaN(parseInt(lastPart))) {
            prestationId = parseInt(lastPart);
        }
    }
    
    // Fonction pour mettre à jour le compteur de transporteurs sélectionnés
    function updateTransporteurCounter() {
        if (!transporteurCounter || !transporteursSelect) return;
        
        const selectedCount = transporteursSelect.selectedOptions.length;
        let message = `${selectedCount} transporteur(s) sélectionné(s)`;
        
        if (selectedCount === 0) {
            message += " - Aucun transporteur sélectionné";
            transporteurCounter.className = "mt-2 text-danger";
        } else {
            transporteurCounter.className = "mt-2 text-success";
        }
        
        transporteurCounter.textContent = message;
    }
    
    // Si le select existe, ajouter un écouteur pour mettre à jour le compteur
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', updateTransporteurCounter);
    }
    
    // Fonction pour afficher les transporteurs bientôt disponibles
    function afficherTransporteursBientotDisponibles(transporteurs) {
        if (!bientotDisponiblesDiv || !bientotDisponiblesResultats) return;
        
        if (!transporteurs || transporteurs.length === 0) {
            bientotDisponiblesDiv.style.display = 'none';
            return;
        }
        
        // Afficher la section
        bientotDisponiblesDiv.style.display = 'block';
        
        // Créer le tableau
        let tableHTML = `
            <table class="table table-striped table-sm">
                <thead>
                    <tr>
                        <th>Transporteur</th>
                        <th>Véhicule</th>
                        <th>Disponible le</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Ajouter chaque transporteur
        transporteurs.forEach(t => {
            tableHTML += `
                <tr>
                    <td>${t.prenom} ${t.nom}</td>
                    <td>${t.vehicule || 'Non spécifié'} ${t.type_vehicule ? `(${t.type_vehicule})` : ''}</td>
                    <td>${t.disponible_le}</td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody></table>';
        bientotDisponiblesResultats.innerHTML = tableHTML;
    }
    
    // Fonction pour afficher les résultats de disponibilité
    function afficherResultats(response) {
        if (!resultsContainer) return;
        
        // Vérifier si la réponse est valide
        if (!response || !response.transporteurs) {
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Une erreur est survenue lors de la récupération des transporteurs disponibles
                </div>
            `;
            return;
        }
        
        // Formater les dates pour l'affichage
        const dateDebut = dateDebutInput.value ? new Date(dateDebutInput.value) : null;
        const dateFin = dateFinInput.value ? new Date(dateFinInput.value) : null;
        
        let dateDebutStr = dateDebut ? dateDebut.toLocaleDateString('fr-FR') : '';
        let dateFinStr = dateFin ? dateFin.toLocaleDateString('fr-FR') : '';
        
        // Créer un message récapitulatif
        const disponiblesCount = response.transporteurs.length;
        const bientotDisponiblesCount = response.soon_available ? response.soon_available.length : 0;
        
        let statusClass = 'info';
        let statusIcon = 'info-circle';
        
        if (disponiblesCount > 0) {
            statusClass = 'success';
            statusIcon = 'check-circle';
        } else if (bientotDisponiblesCount > 0) {
            statusClass = 'warning';
            statusIcon = 'exclamation-triangle';
        } else {
            statusClass = 'danger';
            statusIcon = 'exclamation-circle';
        }
        
        let message = `
            <div class="alert alert-${statusClass} mb-3">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="fas fa-${statusIcon} fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">
        `;
        
        if (disponiblesCount > 0) {
            message += `${disponiblesCount} transporteur${disponiblesCount > 1 ? 's' : ''} disponible${disponiblesCount > 1 ? 's' : ''}`;
        } else {
            message += 'Aucun transporteur disponible';
        }
        
        message += `</h5>
                        <p class="mb-0">Période du ${dateDebutStr} au ${dateFinStr}</p>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = message;
        
        // Mettre à jour la liste déroulante des transporteurs
        if (transporteursSelect) {
            // Sauvegarder les transporteurs sélectionnés
            const selectedIds = Array.from(transporteursSelect.selectedOptions).map(option => parseInt(option.value));
            
            // Vider la liste
            transporteursSelect.innerHTML = '';
            
            // Ajouter les transporteurs disponibles
            if (response.transporteurs && response.transporteurs.length > 0) {
                response.transporteurs.forEach(transporteur => {
                    const option = document.createElement('option');
                    option.value = transporteur.id;
                    option.innerHTML = `${transporteur.prenom} ${transporteur.nom} - ${transporteur.vehicule || 'Véhicule non spécifié'}`;
                    
                    // Style spécial pour les véhicules adaptés
                    if (transporteur.vehicule_adapte) {
                        option.innerHTML += ' ✅';
                        option.style.color = '#198754';
                        option.style.fontWeight = 'bold';
                    } else {
                        option.innerHTML += ' ⚠️';
                        option.style.color = '#fd7e14';
                    }
                    
                    // Conserver la sélection si c'était déjà sélectionné
                    if (selectedIds.includes(parseInt(transporteur.id))) {
                        option.selected = true;
                    }
                    
                    transporteursSelect.appendChild(option);
                });
            }
            
            // Mettre à jour le compteur de transporteurs sélectionnés
            updateTransporteurCounter();
        }
        
        // Afficher les transporteurs bientôt disponibles
        afficherTransporteursBientotDisponibles(response.soon_available);
    }
    
    // Fonction pour vérifier la disponibilité des transporteurs
    function verifierDisponibilite() {
        console.log('Vérification des disponibilités...');
        
        // Vérifier que les champs requis sont remplis
        if (!dateDebutInput || !dateDebutInput.value || !dateFinInput || !dateFinInput.value || !typeDemenagementSelect || !typeDemenagementSelect.value) {
            console.log('Champs requis manquants');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> Veuillez remplir tous les champs obligatoires (dates et type de déménagement)
                    </div>
                `;
            }
            return;
        }
        
        console.log('Champs requis OK, préparation de la requête...');
        console.log('Date début:', dateDebutInput.value);
        console.log('Date fin:', dateFinInput.value);
        console.log('Type déménagement ID:', typeDemenagementSelect.value);
        
        // Afficher un indicateur de chargement
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="d-flex justify-content-center align-items-center p-4">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <div>Recherche des transporteurs disponibles...</div>
                </div>
            `;
        }
        
        // Préparer les données à envoyer
        const formData = new FormData();
        formData.append('date_debut', dateDebutInput.value);
        formData.append('date_fin', dateFinInput.value);
        formData.append('type_demenagement_id', typeDemenagementSelect.value);
        
        // Si on est en mode édition, ajouter l'ID de la prestation
        if (prestationId) {
            formData.append('prestation_id', prestationId);
        }
        
        // Appel à l'API
        console.log('Envoi de la requête à /check-disponibilite');
        
        // Utiliser jQuery pour l'appel AJAX si disponible (pour compatibilité avec le code existant)
        if (typeof $ !== 'undefined') {
            console.log('Utilisation de jQuery pour l\'appel AJAX');
            $.ajax({
                url: '/check-disponibilite',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(data) {
                    console.log('Réponse API (jQuery):', data);
                    afficherResultats(data);
                },
                error: function(xhr, status, error) {
                    console.error('Erreur lors de la vérification (jQuery):', error);
                    if (resultsContainer) {
                        resultsContainer.innerHTML = `
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-circle"></i> Une erreur est survenue lors de la communication avec le serveur
                            </div>
                        `;
                    }
                }
            });
        } else {
            // Utiliser fetch si jQuery n'est pas disponible
            console.log('Utilisation de fetch pour l\'appel AJAX');
            fetch('/check-disponibilite', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau');
                }
                return response.json();
            })
            .then(data => {
                console.log('Réponse API (fetch):', data);
                afficherResultats(data);
            })
            .catch(error => {
                console.error('Erreur lors de la vérification (fetch):', error);
                if (resultsContainer) {
                    resultsContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i> Une erreur est survenue lors de la communication avec le serveur
                        </div>
                    `;
                }
            });
        }
    }
    
    // Ajouter des écouteurs d'événements - Approche directe
    document.addEventListener('click', function(e) {
        // Vérifier si l'élément cliqué est le bouton ou un de ses enfants
        if (e.target && (e.target.id === 'verifier-disponibilite' || 
                        e.target.closest('#verifier-disponibilite'))) {
            console.log('Bouton verifier-disponibilite cliqué!');
            e.preventDefault();
            verifierDisponibilite();
        }
        
        // Vérifier également pour l'autre ID possible
        if (e.target && (e.target.id === 'check-disponibilite' || 
                        e.target.closest('#check-disponibilite'))) {
            console.log('Bouton check-disponibilite cliqué!');
            e.preventDefault();
            verifierDisponibilite();
        }
    });
    
    // Approche alternative avec les boutons directs
    if (verifierBtn) {
        console.log('Ajout d\'un écouteur sur le bouton verifier-disponibilite');
        verifierBtn.addEventListener('click', function(e) {
            console.log('Bouton verifier-disponibilite cliqué (direct)!');
            e.preventDefault();
            verifierDisponibilite();
        });
    } else {
        console.log('Bouton verifier-disponibilite non trouvé');
    }
    
    if (checkDispoBtn) {
        console.log('Ajout d\'un écouteur sur le bouton check-disponibilite');
        checkDispoBtn.addEventListener('click', function(e) {
            console.log('Bouton check-disponibilite cliqué (direct)!');
            e.preventDefault();
            verifierDisponibilite();
        });
    } else {
        console.log('Bouton check-disponibilite non trouvé');
    }
    
    // Déclencher automatiquement la vérification quand ces champs changent
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
    
    // Faire une vérification automatique au chargement si tous les champs sont remplis
    if (dateDebutInput && dateDebutInput.value && 
        dateFinInput && dateFinInput.value && 
        typeDemenagementSelect && typeDemenagementSelect.value) {
        // Attendre un peu pour que tout soit bien chargé
        setTimeout(verifierDisponibilite, 500);
    }
});
