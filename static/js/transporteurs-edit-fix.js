/**
 * Script correctif spécifique pour la page d'édition des prestations
 * Ce script garantit que les transporteurs disponibles s'affichent correctement
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script correctif pour la page d'édition des prestations chargé");
    
    // Référence au bouton de vérification des disponibilités
    const btnVerifierDispo = document.getElementById('verifier-disponibilite');
    const transporteursResultatsDiv = document.getElementById('transporteurs-disponibles-resultats');
    const transporteursSelect = document.getElementById('transporteurs');
    
    if (btnVerifierDispo && transporteursResultatsDiv) {
        console.log('Script correctif: Éléments trouvés');
        
        // Attacher un nouveau gestionnaire d'événement directement au bouton
        btnVerifierDispo.addEventListener('click', function() {
            console.log('Script correctif: Clic sur le bouton Vérifier les disponibilités');
            
            // Récupérer à nouveau les valeurs (au cas où elles auraient changé)
            const dateDebut = document.getElementById('date_debut').value;
            const dateFin = document.getElementById('date_fin').value;
            const typeDemenagement = document.getElementById('type_demenagement_id').value;
            const prestationId = document.querySelector('input[name="id"]') ? document.querySelector('input[name="id"]').value : '';
            
            if (!dateDebut || !dateFin || !typeDemenagement) {
                transporteursResultatsDiv.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> Veuillez sélectionner les dates de début et de fin ainsi que le type de déménagement.</div>';
                return;
            }
            
            // Afficher un indicateur de chargement
            transporteursResultatsDiv.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Vérification des disponibilités...</p></div>';
            
            // Récupérer les transporteurs déjà assignés
            const transporteursAssignes = [];
            if (transporteursSelect) {
                for (let i = 0; i < transporteursSelect.options.length; i++) {
                    if (transporteursSelect.options[i].selected) {
                        transporteursAssignes.push(transporteursSelect.options[i].value);
                    }
                }
            }
            console.log('Transporteurs déjà assignés:', transporteursAssignes);
            
            // Créer FormData pour la requête
            const formData = new FormData();
            formData.append('date_debut', dateDebut);
            formData.append('date_fin', dateFin);
            formData.append('type_demenagement_id', typeDemenagement);
            if (prestationId) {
                formData.append('prestation_id', prestationId);
            }
            
            // Effectuer la requête pour vérifier les disponibilités
            fetch('/prestations/check-disponibilite', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Réponse reçue:', data);
                
                // Afficher les transporteurs disponibles
                let html = '';
                
                if (data.transporteurs && data.transporteurs.length > 0) {
                    html += '<div class="list-group mt-2">';
                    
                    for (const transporteur of data.transporteurs) {
                        // Vérifier si ce transporteur est déjà assigné
                        const estDejaDansListe = transporteursAssignes.includes(transporteur.id.toString());
                        
                        // Déterminer les classes et le style selon le statut
                        let itemClass = "list-group-item d-flex justify-content-between align-items-center";
                        let badgeClass = "badge";
                        let badgeText = "";
                        
                        if (estDejaDansListe) {
                            itemClass += " list-group-item-success";
                            badgeClass += " bg-success";
                            badgeText = "Déjà assigné";
                        } else if (!transporteur.disponible) {
                            itemClass += " list-group-item-warning";
                            badgeClass += " bg-warning text-dark";
                            badgeText = "Indisponible";
                        } else {
                            badgeClass += " bg-primary";
                            badgeText = "Disponible";
                        }
                        
                        html += `
                            <div class="${itemClass}">
                                <div>
                                    <strong>${transporteur.nom} ${transporteur.prenom}</strong>
                                    <div class="small text-muted">Véhicule: ${transporteur.vehicule}</div>
                                </div>
                                <span class="${badgeClass}">${badgeText}</span>
                                ${!estDejaDansListe && transporteur.disponible ? 
                                    `<button type="button" class="btn btn-sm btn-outline-primary ms-2 btn-assigner-transporteur" 
                                            data-id="${transporteur.id}" data-nom="${transporteur.nom}" data-prenom="${transporteur.prenom}" data-vehicule="${transporteur.type_vehicule || transporteur.vehicule}">
                                        <i class="fas fa-plus-circle"></i> Assigner
                                    </button>` : ''}
                            </div>
                        `;
                    }
                    
                    html += '</div>';
                } else {
                    html = '<div class="alert alert-warning">Aucun transporteur disponible pour cette période.</div>';
                }
                
                // Afficher les transporteurs bientôt disponibles si présents
                if (data.soon_available && data.soon_available.length > 0) {
                    html += `
                        <div class="mt-4">
                            <h5 class="text-warning">Transporteurs bientôt disponibles</h5>
                            <div class="list-group mt-2">
                    `;
                    
                    for (const transporteur of data.soon_available) {
                        html += `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${transporteur.nom} ${transporteur.prenom}</strong>
                                    <div class="small text-muted">Véhicule: ${transporteur.vehicule}</div>
                                    <div class="small text-muted">Disponible le: ${transporteur.disponible_le}</div>
                                </div>
                                <span class="badge bg-warning text-dark">Bientôt disponible</span>
                            </div>
                        `;
                    }
                    
                    html += '</div></div>';
                }
                
                // Afficher le résultat
                transporteursResultatsDiv.innerHTML = html;
                
                // Ajouter des écouteurs d'événements pour les boutons d'assignation
                const btnAssigner = transporteursResultatsDiv.querySelectorAll('.btn-assigner-transporteur');
                btnAssigner.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const transporteurId = this.dataset.id;
                        const transporteurNom = this.dataset.nom;
                        const transporteurPrenom = this.dataset.prenom;
                        const transporteurVehicule = this.dataset.vehicule;
                        
                        // Ajouter au select des transporteurs sélectionnés
                        if (transporteursSelect) {
                            // Vérifier si ce transporteur est déjà dans la liste
                            let optionExiste = false;
                            for (let i = 0; i < transporteursSelect.options.length; i++) {
                                if (transporteursSelect.options[i].value === transporteurId) {
                                    transporteursSelect.options[i].selected = true;
                                    optionExiste = true;
                                    break;
                                }
                            }
                            
                            // Si le transporteur n'est pas dans la liste, l'ajouter
                            if (!optionExiste) {
                                const option = document.createElement('option');
                                option.value = transporteurId;
                                option.text = `${transporteurNom} ${transporteurPrenom} - ${transporteurVehicule}`;
                                option.selected = true;
                                transporteursSelect.appendChild(option);
                            }
                            
                            // Déclencher l'événement change pour mettre à jour l'UI
                            const event = new Event('change');
                            transporteursSelect.dispatchEvent(event);
                            
                            // Mise à jour du compteur manuel
                            const counterElement = document.getElementById('transporteur-counter');
                            if (counterElement) {
                                const selectedCount = Array.from(transporteursSelect.options)
                                    .filter(opt => opt.selected).length;
                                    
                                let message = `${selectedCount} transporteur(s) sélectionné(s)`;
                                if (selectedCount === 0) {
                                    message += " - Aucun transporteur sélectionné";
                                } else if (selectedCount === 1) {
                                    const selectedOption = Array.from(transporteursSelect.options).find(opt => opt.selected);
                                    if (selectedOption) {
                                        message += ` - ${selectedOption.text}`;
                                    }
                                } else {
                                    message += " - Plusieurs transporteurs sélectionnés";
                                }
                                
                                counterElement.textContent = message;
                            }
                        }
                        
                        // Mise à jour de l'UI
                        this.parentNode.classList.add('list-group-item-success');
                        const badge = this.parentNode.querySelector('.badge');
                        if (badge) {
                            badge.className = 'badge bg-success';
                            badge.textContent = 'Assigné';
                        }
                        this.style.display = 'none';
                    });
                });
            })
            .catch(error => {
                console.error('Erreur:', error);
                transporteursResultatsDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Erreur lors de la vérification: ${error.message}</div>`;
            });
        });
    } else {
        console.error('Éléments nécessaires non trouvés dans le DOM');
    }
});
