/**
 * Script de réparation pour les éléments de l'interface de prestation
 * Corrige les problèmes avec les boutons et les fonctionnalités
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script de réparation des éléments chargé");
    
    // 1. Correction du bouton de vérification des disponibilités
    const btnVerifierDisponibilite = document.getElementById('verifier-disponibilite');
    if (btnVerifierDisponibilite) {
        console.log("Réparation du bouton verifier-disponibilite");
        
        // Supprimer les anciens écouteurs d'événements pour éviter les doublons
        const newBtn = btnVerifierDisponibilite.cloneNode(true);
        btnVerifierDisponibilite.parentNode.replaceChild(newBtn, btnVerifierDisponibilite);
        
        newBtn.addEventListener('click', function() {
            console.log("Bouton vérifier disponibilité cliqué");
            
            // Récupérer les données du formulaire
            const dateDebut = document.getElementById('date_debut').value;
            const dateFin = document.getElementById('date_fin').value;
            const typeDemenagementId = document.getElementById('type_demenagement_id').value;
            const prestationId = document.querySelector('input[name="id"]') ? 
                                document.querySelector('input[name="id"]').value : '';
            
            if (!dateDebut || !dateFin) {
                alert("Veuillez remplir les dates de début et de fin");
                return;
            }
            
            console.log("Vérification des disponibilités pour:", {
                dateDebut,
                dateFin,
                typeDemenagementId,
                prestationId
            });
            
            // Afficher un indicateur de chargement
            const transporteursResultatsDiv = document.getElementById('transporteurs-resultats') || 
                                            document.createElement('div');
            transporteursResultatsDiv.id = 'transporteurs-resultats';
            transporteursResultatsDiv.innerHTML = '<div class="alert alert-info"><i class="fas fa-spinner fa-spin"></i> Vérification en cours...</div>';
            
            // Insérer le div de résultats s'il n'existe pas
            if (!document.getElementById('transporteurs-resultats')) {
                const transporteursSection = document.querySelector('.transporteurs');
                if (transporteursSection) {
                    transporteursSection.appendChild(transporteursResultatsDiv);
                }
            }
            
            // Appeler l'API pour vérifier les disponibilités
            fetch('/api/check_disponibilite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date_debut: dateDebut,
                    date_fin: dateFin,
                    type_demenagement_id: typeDemenagementId,
                    prestation_id: prestationId
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log("Réponse de l'API:", data);
                
                // Traiter et afficher les résultats
                let html = '';
                
                if (data.success) {
                    // Compter les transporteurs disponibles
                    const transporteursDisponibles = data.transporteurs_disponibles || [];
                    const transporteursBientotDisponibles = data.transporteurs_bientot_disponibles || [];
                    
                    if (transporteursDisponibles.length > 0) {
                        html += '<div class="alert alert-success mb-3">';
                        html += `<strong>${transporteursDisponibles.length} transporteur(s) disponible(s)</strong> pour cette période`;
                        html += '</div>';
                        
                        // Mettre à jour la liste des transporteurs disponibles
                        const transporteursSelect = document.getElementById('transporteurs');
                        if (transporteursSelect) {
                            // Conserver les transporteurs sélectionnés
                            const selectedIds = Array.from(transporteursSelect.selectedOptions).map(opt => opt.value);
                            
                            // Mettre en évidence les transporteurs disponibles
                            Array.from(transporteursSelect.options).forEach(option => {
                                const transporteurId = option.value;
                                const isDisponible = transporteursDisponibles.some(t => 
                                    (t.id && t.id.toString() === transporteurId) || 
                                    (t.user_id && t.user_id.toString() === transporteurId)
                                );
                                
                                if (isDisponible) {
                                    option.classList.add('bg-success', 'text-white');
                                } else {
                                    option.classList.remove('bg-success', 'text-white');
                                    option.classList.add('text-muted');
                                }
                            });
                        }
                    } else {
                        html += '<div class="alert alert-warning mb-3">';
                        html += '<strong>Aucun transporteur disponible</strong> pour cette période';
                        html += '</div>';
                    }
                    
                    // Afficher les transporteurs bientôt disponibles
                    if (transporteursBientotDisponibles.length > 0) {
                        html += '<div class="mt-3">';
                        html += '<h5>Transporteurs bientôt disponibles</h5>';
                        html += '<ul class="list-group">';
                        
                        transporteursBientotDisponibles.forEach(t => {
                            const nom = t.nom || (t.prenom && t.nom ? `${t.prenom} ${t.nom}` : 'Transporteur');
                            const vehicule = t.vehicule || 'Non spécifié';
                            
                            html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${nom}</strong> (${vehicule})
                                    <br><small>Disponible à partir du ${new Date(t.disponible_a_partir).toLocaleDateString()}</small>
                                </div>
                            </li>`;
                        });
                        
                        html += '</ul>';
                        html += '</div>';
                    }
                } else {
                    html += '<div class="alert alert-danger">';
                    html += '<strong>Erreur:</strong> ' + (data.message || 'Impossible de vérifier les disponibilités');
                    html += '</div>';
                }
                
                transporteursResultatsDiv.innerHTML = html;
            })
            .catch(error => {
                console.error('Erreur lors de la vérification:', error);
                transporteursResultatsDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <strong>Erreur:</strong> Impossible de vérifier les disponibilités. 
                        Détails: ${error.message}
                    </div>
                `;
            });
        });
    } else {
        console.error("Bouton verifier-disponibilite non trouvé");
    }
    
    // 2. Correction du bouton de calendrier
    const btnShowCalendar = document.getElementById('show-calendar-btn');
    if (btnShowCalendar) {
        console.log("Réparation du bouton show-calendar-btn");
        
        // Supprimer les anciens écouteurs d'événements
        const newCalendarBtn = btnShowCalendar.cloneNode(true);
        btnShowCalendar.parentNode.replaceChild(newCalendarBtn, btnShowCalendar);
        
        newCalendarBtn.addEventListener('click', function() {
            console.log("Bouton calendrier cliqué");
            
            // Afficher le modal du calendrier
            const calendarModal = document.getElementById('calendar-modal');
            if (calendarModal) {
                // Utiliser Bootstrap pour afficher le modal
                const modal = new bootstrap.Modal(calendarModal);
                modal.show();
            } else {
                // Créer un modal de calendrier si nécessaire
                const modalHtml = `
                <div class="modal fade" id="calendar-modal" tabindex="-1" aria-labelledby="calendar-modal-label" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="calendar-modal-label">Calendrier des disponibilités</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-info">
                                    Fonctionnalité de calendrier en cours de développement.
                                </div>
                                <div id="calendar-container" class="p-3">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <button id="prev-month" class="btn btn-sm btn-outline-secondary">
                                            <i class="fas fa-chevron-left"></i> Mois précédent
                                        </button>
                                        <h4 id="calendar-month-year" class="m-0">Avril 2025</h4>
                                        <button id="next-month" class="btn btn-sm btn-outline-secondary">
                                            Mois suivant <i class="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                    <table class="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Lun</th>
                                                <th>Mar</th>
                                                <th>Mer</th>
                                                <th>Jeu</th>
                                                <th>Ven</th>
                                                <th>Sam</th>
                                                <th>Dim</th>
                                            </tr>
                                        </thead>
                                        <tbody id="calendar-body">
                                            <!-- Le calendrier sera généré ici -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                
                // Ajouter le modal au document
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHtml;
                document.body.appendChild(modalContainer);
                
                // Afficher le modal
                const modal = new bootstrap.Modal(document.getElementById('calendar-modal'));
                modal.show();
            }
        });
    } else {
        console.error("Bouton show-calendar-btn non trouvé");
    }
    
    // 3. Correction des boutons d'ajout d'étape
    const btnAjouterEtapeDepart = document.getElementById('ajouter-etape-depart');
    const btnAjouterEtapeArrivee = document.getElementById('ajouter-etape-arrivee');
    
    if (btnAjouterEtapeDepart) {
        console.log("Réparation du bouton ajouter-etape-depart");
        
        // Supprimer les anciens écouteurs d'événements
        const newBtnDepart = btnAjouterEtapeDepart.cloneNode(true);
        btnAjouterEtapeDepart.parentNode.replaceChild(newBtnDepart, btnAjouterEtapeDepart);
        
        newBtnDepart.addEventListener('click', function() {
            console.log("Bouton ajouter étape départ cliqué");
            
            const etapesDepartDiv = document.getElementById('etapes-depart');
            if (!etapesDepartDiv) {
                console.error("Élément 'etapes-depart' non trouvé");
                return;
            }
            
            // Créer un nouveau conteneur pour cette étape
            const etapeDiv = document.createElement('div');
            etapeDiv.className = 'input-group mt-2 etape-depart';
            
            // Créer le contenu de l'étape
            etapeDiv.innerHTML = `
                <input type="text" name="etape_depart[]" class="form-control" placeholder="Adresse intermédiaire de départ">
                <button type="button" class="btn btn-outline-danger supprimer-etape">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            // Ajouter l'étape au conteneur
            etapesDepartDiv.appendChild(etapeDiv);
            
            // Ajouter l'écouteur d'événement pour le bouton de suppression
            const btnSupprimer = etapeDiv.querySelector('.supprimer-etape');
            if (btnSupprimer) {
                btnSupprimer.addEventListener('click', function() {
                    etapeDiv.remove();
                });
            }
        });
    } else {
        console.error("Bouton ajouter-etape-depart non trouvé");
    }
    
    if (btnAjouterEtapeArrivee) {
        console.log("Réparation du bouton ajouter-etape-arrivee");
        
        // Supprimer les anciens écouteurs d'événements
        const newBtnArrivee = btnAjouterEtapeArrivee.cloneNode(true);
        btnAjouterEtapeArrivee.parentNode.replaceChild(newBtnArrivee, btnAjouterEtapeArrivee);
        
        newBtnArrivee.addEventListener('click', function() {
            console.log("Bouton ajouter étape arrivée cliqué");
            
            const etapesArriveeDiv = document.getElementById('etapes-arrivee');
            if (!etapesArriveeDiv) {
                console.error("Élément 'etapes-arrivee' non trouvé");
                return;
            }
            
            // Créer un nouveau conteneur pour cette étape
            const etapeDiv = document.createElement('div');
            etapeDiv.className = 'input-group mt-2 etape-arrivee';
            
            // Créer le contenu de l'étape
            etapeDiv.innerHTML = `
                <input type="text" name="etape_arrivee[]" class="form-control" placeholder="Adresse intermédiaire d'arrivée">
                <button type="button" class="btn btn-outline-danger supprimer-etape">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            // Ajouter l'étape au conteneur
            etapesArriveeDiv.appendChild(etapeDiv);
            
            // Ajouter l'écouteur d'événement pour le bouton de suppression
            const btnSupprimer = etapeDiv.querySelector('.supprimer-etape');
            if (btnSupprimer) {
                btnSupprimer.addEventListener('click', function() {
                    etapeDiv.remove();
                });
            }
        });
    } else {
        console.error("Bouton ajouter-etape-arrivee non trouvé");
    }
    
    // 4. Correction du bouton de groupage
    const btnGroupage = document.getElementById('btn-groupage');
    const btnStandard = document.getElementById('btn-standard');
    
    if (btnGroupage && btnStandard) {
        console.log("Réparation des boutons de type de prestation");
        
        // Supprimer les anciens écouteurs d'événements
        const newBtnGroupage = btnGroupage.cloneNode(true);
        btnGroupage.parentNode.replaceChild(newBtnGroupage, btnGroupage);
        
        const newBtnStandard = btnStandard.cloneNode(true);
        btnStandard.parentNode.replaceChild(newBtnStandard, btnStandard);
        
        const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
        const btnAjouterClient = document.getElementById('ajouter-client');
        
        newBtnGroupage.addEventListener('click', function() {
            console.log("Bouton groupage cliqué");
            
            newBtnGroupage.classList.add('active');
            newBtnStandard.classList.remove('active');
            
            if (clientsSupplementairesDiv) {
                clientsSupplementairesDiv.style.display = 'block';
            }
            
            if (btnAjouterClient) {
                btnAjouterClient.style.display = 'block';
            }
            
            // Mettre à jour le champ caché du type de déménagement
            const typeHidden = document.getElementById('type_demenagement');
            if (typeHidden) {
                typeHidden.value = 'Groupage';
            }
            
            // Ajouter un champ caché pour indiquer que c'est un groupage
            let estGroupageInput = document.getElementById('est_groupage');
            if (!estGroupageInput) {
                estGroupageInput = document.createElement('input');
                estGroupageInput.type = 'hidden';
                estGroupageInput.id = 'est_groupage';
                estGroupageInput.name = 'est_groupage';
                document.querySelector('form').appendChild(estGroupageInput);
            }
            estGroupageInput.value = 'true';
        });
        
        newBtnStandard.addEventListener('click', function() {
            console.log("Bouton standard cliqué");
            
            newBtnStandard.classList.add('active');
            newBtnGroupage.classList.remove('active');
            
            if (clientsSupplementairesDiv) {
                clientsSupplementairesDiv.style.display = 'none';
            }
            
            if (btnAjouterClient) {
                btnAjouterClient.style.display = 'none';
            }
            
            // Mettre à jour le champ caché du type de déménagement
            const typeHidden = document.getElementById('type_demenagement');
            if (typeHidden) {
                typeHidden.value = 'Standard';
            }
            
            // Mettre à jour le champ caché pour indiquer que ce n'est pas un groupage
            let estGroupageInput = document.getElementById('est_groupage');
            if (!estGroupageInput) {
                estGroupageInput = document.createElement('input');
                estGroupageInput.type = 'hidden';
                estGroupageInput.id = 'est_groupage';
                estGroupageInput.name = 'est_groupage';
                document.querySelector('form').appendChild(estGroupageInput);
            }
            estGroupageInput.value = 'false';
        });
    } else {
        console.error("Boutons de type de prestation non trouvés");
    }
    
    // 5. Correction du compteur de transporteurs sélectionnés
    const transporteursSelect = document.getElementById('transporteurs');
    const countDisplay = document.querySelector('.selected-transporteurs-count');
    
    if (transporteursSelect && countDisplay) {
        console.log("Réparation du compteur de transporteurs");
        
        // Fonction pour mettre à jour le compteur
        function updateTransporteursCount() {
            const selectedCount = Array.from(transporteursSelect.selectedOptions).length;
            countDisplay.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
        }
        
        // Mettre à jour le compteur au chargement
        updateTransporteursCount();
        
        // Ajouter un écouteur d'événement pour les changements de sélection
        transporteursSelect.addEventListener('change', updateTransporteursCount);
    }
    
    console.log("Réparation des éléments terminée");
});
