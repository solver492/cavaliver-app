/**
 * Script simple pour la vérification des transporteurs disponibles
 * Ce script est conçu pour être robuste et facile à déboguer
 */

// Attendre que le DOM soit complètement chargé
window.addEventListener('DOMContentLoaded', function() {
    console.log('Script transporteurs-disponibilite-simple.js chargé');
    
    // Récupérer le bouton de vérification des disponibilités
    var btnVerifier = document.querySelector('button#verifier-disponibilite');
    
    // Récupérer le conteneur des résultats
    var resultsContainer = document.getElementById('transporteurs-disponibles-resultats');
    
    // Récupérer la liste des transporteurs
    var transporteursSelect = document.getElementById('transporteurs');
    
    // Récupérer la section des transporteurs bientôt disponibles
    var bientotDisponiblesDiv = document.getElementById('transporteurs-bientot-disponibles');
    var bientotDisponiblesResultats = document.getElementById('transporteurs-bientot-disponibles-resultats');
    
    // Récupérer le compteur de transporteurs
    var transporteurCounter = document.getElementById('transporteur-counter');
    
    // Récupérer les champs de formulaire nécessaires
    var dateDebutInput = document.getElementById('date_debut');
    var dateFinInput = document.getElementById('date_fin');
    var typeDemenagementSelect = document.getElementById('type_demenagement_id');
    
    // Log des éléments trouvés pour le débogage
    console.log('Bouton vérifier:', btnVerifier);
    console.log('Conteneur résultats:', resultsContainer);
    console.log('Select transporteurs:', transporteursSelect);
    console.log('Date début:', dateDebutInput);
    console.log('Date fin:', dateFinInput);
    console.log('Type déménagement:', typeDemenagementSelect);
    
    // Récupérer l'ID de la prestation actuelle (pour l'édition)
    var prestationId = null;
    var currentUrl = window.location.pathname;
    var urlParts = currentUrl.split('/');
    var lastPart = urlParts[urlParts.length - 1];
    if (!isNaN(parseInt(lastPart))) {
        prestationId = parseInt(lastPart);
        console.log('ID de prestation détecté:', prestationId);
    }
    
    // Fonction pour mettre à jour le compteur de transporteurs
    function updateTransporteurCounter() {
        if (!transporteurCounter || !transporteursSelect) return;
        
        var selectedCount = transporteursSelect.selectedOptions.length;
        var message = selectedCount + " transporteur(s) sélectionné(s)";
        
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
        var tableHTML = '<table class="table table-striped table-sm">' +
            '<thead>' +
                '<tr>' +
                    '<th>Transporteur</th>' +
                    '<th>Véhicule</th>' +
                    '<th>Disponible le</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>';
        
        // Ajouter chaque transporteur
        transporteurs.forEach(function(t) {
            tableHTML += '<tr>' +
                '<td>' + t.prenom + ' ' + t.nom + '</td>' +
                '<td>' + (t.vehicule || 'Non spécifié') + (t.type_vehicule ? ' (' + t.type_vehicule + ')' : '') + '</td>' +
                '<td>' + t.disponible_le + '</td>' +
            '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        bientotDisponiblesResultats.innerHTML = tableHTML;
    }
    
    // Fonction pour afficher les résultats de disponibilité
    function afficherResultats(response) {
        if (!resultsContainer) {
            console.error('Conteneur de résultats non trouvé');
            return;
        }
        
        console.log('Affichage des résultats:', response);
        
        // Vérifier si la réponse est valide
        if (!response || !response.transporteurs) {
            resultsContainer.innerHTML = 
                '<div class="alert alert-danger">' +
                    '<i class="fas fa-exclamation-circle"></i> Une erreur est survenue lors de la récupération des transporteurs disponibles' +
                '</div>';
            return;
        }
        
        // Filtrer uniquement les transporteurs disponibles
        var transporteursDisponibles = response.transporteurs.filter(function(t) {
            return t.disponible === true;
        });
        
        // Mettre à jour la réponse pour utiliser uniquement les transporteurs disponibles
        response.transporteurs = transporteursDisponibles;
        
        // Formater les dates pour l'affichage
        var dateDebut = dateDebutInput.value ? new Date(dateDebutInput.value) : null;
        var dateFin = dateFinInput.value ? new Date(dateFinInput.value) : null;
        
        var dateDebutStr = dateDebut ? dateDebut.toLocaleDateString('fr-FR') : '';
        var dateFinStr = dateFin ? dateFin.toLocaleDateString('fr-FR') : '';
        
        // Créer un message récapitulatif
        var disponiblesCount = response.transporteurs.length;
        var bientotDisponiblesCount = response.soon_available ? response.soon_available.length : 0;
        
        var statusClass = 'info';
        var statusIcon = 'info-circle';
        
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
        
        var message = 
            '<div class="alert alert-' + statusClass + ' mb-3">' +
                '<div class="d-flex align-items-center">' +
                    '<div class="me-3">' +
                        '<i class="fas fa-' + statusIcon + ' fa-2x"></i>' +
                    '</div>' +
                    '<div>' +
                        '<h5 class="mb-1">';
        
        if (disponiblesCount > 0) {
            message += disponiblesCount + ' transporteur' + (disponiblesCount > 1 ? 's' : '') + ' disponible' + (disponiblesCount > 1 ? 's' : '');
        } else {
            message += 'Aucun transporteur disponible';
        }
        
        message += '</h5>' +
                        '<p class="mb-0">Période du ' + dateDebutStr + ' au ' + dateFinStr + '</p>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        resultsContainer.innerHTML = message;
        
        // Mettre à jour la liste déroulante des transporteurs
        if (transporteursSelect) {
            // Sauvegarder les transporteurs sélectionnés
            var selectedIds = [];
            for (var i = 0; i < transporteursSelect.selectedOptions.length; i++) {
                selectedIds.push(parseInt(transporteursSelect.selectedOptions[i].value));
            }
            
            // Vider la liste
            transporteursSelect.innerHTML = '';
            
            // Ajouter les transporteurs disponibles
            if (response.transporteurs && response.transporteurs.length > 0) {
                response.transporteurs.forEach(function(transporteur) {
                    // Vérifier que le transporteur a toutes les propriétés nécessaires
                    if (!transporteur.id) {
                        console.error('Transporteur sans ID:', transporteur);
                        return;
                    }
                    
                    var option = document.createElement('option');
                    option.value = transporteur.id;
                    
                    // Gérer les différentes structures possibles
                    var nom = transporteur.nom || '';
                    var prenom = transporteur.prenom || '';
                    var vehicule = transporteur.vehicule || 'Véhicule non spécifié';
                    var typeVehicule = '';
                    
                    // Gérer le cas où type_vehicule est un objet ou une chaîne
                    if (transporteur.type_vehicule) {
                        if (typeof transporteur.type_vehicule === 'object' && transporteur.type_vehicule.nom) {
                            typeVehicule = ' (' + transporteur.type_vehicule.nom + ')';
                        } else if (typeof transporteur.type_vehicule === 'string') {
                            typeVehicule = ' (' + transporteur.type_vehicule + ')';
                        }
                    }
                    
                    option.innerHTML = prenom + ' ' + nom + ' - ' + vehicule + typeVehicule;
                    
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
                    if (selectedIds.indexOf(parseInt(transporteur.id)) !== -1) {
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
                resultsContainer.innerHTML = 
                    '<div class="alert alert-warning">' +
                        '<i class="fas fa-exclamation-triangle"></i> Veuillez remplir tous les champs obligatoires (dates et type de déménagement)' +
                    '</div>';
            }
            return;
        }
        
        console.log('Champs requis OK, préparation de la requête...');
        console.log('Date début:', dateDebutInput.value);
        console.log('Date fin:', dateFinInput.value);
        console.log('Type déménagement ID:', typeDemenagementSelect.value);
        
        // Afficher un indicateur de chargement
        if (resultsContainer) {
            resultsContainer.innerHTML = 
                '<div class="d-flex justify-content-center align-items-center p-4">' +
                    '<div class="spinner-border text-primary me-3" role="status">' +
                        '<span class="visually-hidden">Chargement...</span>' +
                    '</div>' +
                    '<div>Recherche des transporteurs disponibles...</div>' +
                '</div>';
        }
        
        // Préparer les données à envoyer
        var formData = new FormData();
        formData.append('date_debut', dateDebutInput.value);
        formData.append('date_fin', dateFinInput.value);
        formData.append('type_demenagement_id', typeDemenagementSelect.value);
        
        // Si on est en mode édition, ajouter l'ID de la prestation
        if (prestationId) {
            formData.append('prestation_id', prestationId);
        }
        
        // Créer une requête AJAX
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/check-disponibilite', true);
        
        // Définir ce qui se passe en cas de succès
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log('Réponse reçue de l\'API');
                try {
                    var response = JSON.parse(xhr.responseText);
                    console.log('Réponse API:', response);
                    afficherResultats(response);
                } catch (e) {
                    console.error('Erreur lors du parsing de la réponse:', e);
                    if (resultsContainer) {
                        resultsContainer.innerHTML = 
                            '<div class="alert alert-danger">' +
                                '<i class="fas fa-exclamation-circle"></i> Erreur lors du traitement de la réponse' +
                            '</div>';
                    }
                }
            } else {
                console.error('Erreur lors de la requête:', xhr.status);
                if (resultsContainer) {
                    resultsContainer.innerHTML = 
                        '<div class="alert alert-danger">' +
                            '<i class="fas fa-exclamation-circle"></i> Erreur ' + xhr.status + ' lors de la communication avec le serveur' +
                        '</div>';
                }
            }
        };
        
        // Définir ce qui se passe en cas d'erreur
        xhr.onerror = function() {
            console.error('Erreur réseau lors de la requête');
            if (resultsContainer) {
                resultsContainer.innerHTML = 
                    '<div class="alert alert-danger">' +
                        '<i class="fas fa-exclamation-circle"></i> Erreur réseau lors de la communication avec le serveur' +
                    '</div>';
            }
        };
        
        // Envoyer la requête
        console.log('Envoi de la requête...');
        xhr.send(formData);
    }
    
    // Ajouter un écouteur d'événement au bouton
    if (btnVerifier) {
        console.log('Ajout d\'un écouteur d\'événement au bouton verifier-disponibilite');
        btnVerifier.addEventListener('click', function(e) {
            console.log('Bouton verifier-disponibilite cliqué!');
            e.preventDefault();
            verifierDisponibilite();
        });
    } else {
        console.log('Bouton verifier-disponibilite non trouvé, ajout d\'un écouteur global');
        // Ajouter un écouteur global pour le cas où le bouton n'est pas trouvé directement
        document.addEventListener('click', function(e) {
            if (e.target && (e.target.id === 'verifier-disponibilite' || e.target.closest('#verifier-disponibilite'))) {
                console.log('Bouton verifier-disponibilite cliqué via délégation!');
                e.preventDefault();
                verifierDisponibilite();
            }
        });
    }
    
    // Déclencher automatiquement la vérification quand ces champs changent
    function triggerVerification() {
        // Vérifier que tous les champs sont remplis avant de lancer automatiquement
        if (dateDebutInput && dateDebutInput.value && 
            dateFinInput && dateFinInput.value && 
            typeDemenagementSelect && typeDemenagementSelect.value) {
            console.log('Déclenchement automatique de la vérification suite à un changement de champ');
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
        console.log('Vérification automatique au chargement de la page');
        // Attendre un peu pour que tout soit bien chargé
        setTimeout(verifierDisponibilite, 500);
    }
});
