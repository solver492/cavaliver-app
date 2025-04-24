/**
 * Script spécifique pour l'affichage des transporteurs dans la page d'édition
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script transporteurs-editpage.js chargé");
    
    // Référence aux éléments spécifiques de la page d'édition
    const btnVerifierDispo = document.getElementById('verifier-disponibilite'); // Noter l'absence du "s" à la fin
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const transporteursSelect = document.getElementById('transporteurs');
    const transporteursResultatsDiv = document.getElementById('transporteurs-disponibles-resultats');
    
    // Vérifier que les éléments existent
    console.log("Éléments de la page d'édition:", {
        btnVerifierDispo,
        dateDebutInput,
        dateFinInput,
        typeDemenagementSelect,
        transporteursSelect,
        transporteursResultatsDiv
    });
    
    if (!btnVerifierDispo) {
        console.error("Bouton vérifier disponibilité introuvable");
        return;
    }
    
    if (!transporteursResultatsDiv) {
        console.error("Div pour afficher les résultats introuvable");
        return;
    }
    
    // Fonction pour obtenir les transporteurs déjà assignés
    function getTransporteursAssignes() {
        const transporteursAssignes = [];
        if (transporteursSelect) {
            for (let i = 0; i < transporteursSelect.options.length; i++) {
                if (transporteursSelect.options[i].selected) {
                    transporteursAssignes.push(transporteursSelect.options[i].value);
                }
            }
        }
        return transporteursAssignes;
    }
    
    // Fonction pour mettre à jour le compteur de transporteurs
    function updateTransporteurCounter() {
        const counterElement = document.getElementById('transporteur-counter');
        if (!counterElement || !transporteursSelect) return;
        
        const selectedCount = Array.from(transporteursSelect.options)
            .filter(opt => opt.selected).length;
            
        let message = `${selectedCount} transporteur(s) sélectionné(s)`;
        
        // Ajouter des informations supplémentaires
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
    
    // Fonction pour vérifier les disponibilités
    function verifierDisponibilites() {
        console.log("Vérification des disponibilités en cours...");
        
        // Vérifier que les données nécessaires sont présentes
        if (!dateDebutInput || !dateFinInput || !typeDemenagementSelect) {
            console.error("Éléments du formulaire manquants");
            return;
        }
        
        const dateDebut = dateDebutInput.value;
        const dateFin = dateFinInput.value;
        const typeDemenagementId = typeDemenagementSelect.value;
        
        // Vérifier que les dates sont valides
        if (!dateDebut || !dateFin) {
            if (transporteursResultatsDiv) {
                transporteursResultatsDiv.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> Veuillez sélectionner les dates de début et de fin.</div>';
            }
            return;
        }
        
        // Vérifier que le type de déménagement est sélectionné
        if (!typeDemenagementId || typeDemenagementId === '0') {
            if (transporteursResultatsDiv) {
                transporteursResultatsDiv.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> Veuillez sélectionner un type de déménagement.</div>';
            }
            return;
        }
        
        // Obtenir l'ID de la prestation en cours d'édition (à partir de l'URL)
        const urlParts = window.location.pathname.split('/');
        const prestationId = urlParts[urlParts.length - 1]; 
        
        // Afficher un indicateur de chargement
        if (transporteursResultatsDiv) {
            transporteursResultatsDiv.innerHTML = `
                <div class="text-center my-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2">Vérification des disponibilités en cours...</p>
                </div>
            `;
        }
        
        // Préparer les données pour la requête
        const formData = new FormData();
        formData.append('date_debut', dateDebut);
        formData.append('date_fin', dateFin);
        formData.append('type_demenagement_id', typeDemenagementId);
        if (prestationId && prestationId !== 'add') {
            formData.append('prestation_id', prestationId);
        }
        
        // Envoyer la requête AJAX
        fetch('/prestations/check-disponibilite', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Réponse du serveur:", data);
            afficherResultats(data);
        })
        .catch(error => {
            console.error("Erreur lors de la vérification:", error);
            if (transporteursResultatsDiv) {
                transporteursResultatsDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Une erreur s'est produite lors de la vérification des disponibilités: ${error.message}
                    </div>
                `;
            }
        });
    }
    
    // Fonction pour afficher les résultats
    function afficherResultats(data) {
        if (!transporteursResultatsDiv) {
            console.error("Div pour les résultats introuvable");
            return;
        }
        
        const transporteursAssignes = getTransporteursAssignes();
        console.log("Transporteurs déjà assignés:", transporteursAssignes);
        
        // Créer la section des transporteurs disponibles
        let html = '';
        
        if (data.transporteurs && data.transporteurs.length > 0) {
            html += '<div class="list-group my-3">';
            
            // Trier les transporteurs: d'abord assignés, puis disponibles, puis indisponibles
            const transporteurs = [...data.transporteurs].sort((a, b) => {
                const aAssigne = transporteursAssignes.includes(a.id.toString());
                const bAssigne = transporteursAssignes.includes(b.id.toString());
                
                if (aAssigne && !bAssigne) return -1;
                if (!aAssigne && bAssigne) return 1;
                if (a.disponible && !b.disponible) return -1;
                if (!a.disponible && b.disponible) return 1;
                return 0;
            });
            
            for (const transporteur of transporteurs) {
                const estDejaAssigne = transporteursAssignes.includes(transporteur.id.toString());
                
                // Déterminer les classes CSS et l'état pour cet élément
                let itemClass = "list-group-item d-flex justify-content-between align-items-center";
                let badgeClass = "badge";
                let badgeText = "";
                let btnAction = "";
                
                if (estDejaAssigne) {
                    itemClass += " list-group-item-success";
                    badgeClass += " bg-success";
                    badgeText = "Déjà assigné";
                } else if (transporteur.disponible) {
                    badgeClass += " bg-primary";
                    badgeText = "Disponible";
                    btnAction = `
                        <button type="button" class="btn btn-sm btn-outline-primary ms-2 btn-assigner-transporteur" 
                                data-id="${transporteur.id}" data-nom="${transporteur.nom}" 
                                data-prenom="${transporteur.prenom}" data-vehicule="${transporteur.vehicule || transporteur.type_vehicule}">
                            <i class="fas fa-plus-circle"></i> Assigner
                        </button>
                    `;
                } else {
                    itemClass += " list-group-item-warning";
                    badgeClass += " bg-warning text-dark";
                    badgeText = "Indisponible";
                }
                
                html += `
                    <div class="${itemClass}">
                        <div>
                            <strong>${transporteur.nom} ${transporteur.prenom}</strong>
                            <div class="small text-muted">Véhicule: ${transporteur.vehicule || transporteur.type_vehicule}</div>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="${badgeClass}">${badgeText}</span>
                            ${btnAction}
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        } else {
            html += `
                <div class="alert alert-warning my-3">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Aucun transporteur disponible pour cette période.
                </div>
            `;
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
                            <div class="small text-muted">Véhicule: ${transporteur.vehicule || transporteur.type_vehicule}</div>
                            <div class="small text-muted">Disponible le: ${transporteur.disponible_le}</div>
                        </div>
                        <span class="badge bg-warning text-dark">Bientôt disponible</span>
                    </div>
                `;
            }
            
            html += '</div></div>';
        }
        
        // Insérer le HTML dans le div des résultats
        transporteursResultatsDiv.innerHTML = html;
        
        // Ajouter les écouteurs d'événement pour les boutons d'assignation
        const btnAssigner = transporteursResultatsDiv.querySelectorAll('.btn-assigner-transporteur');
        btnAssigner.forEach(btn => {
            btn.addEventListener('click', function() {
                const transporteurId = this.dataset.id;
                const transporteurNom = this.dataset.nom;
                const transporteurPrenom = this.dataset.prenom;
                const transporteurVehicule = this.dataset.vehicule;
                
                // Ajouter ce transporteur à la sélection
                if (transporteursSelect) {
                    // Vérifier si ce transporteur est déjà dans la liste
                    let existe = false;
                    for (let i = 0; i < transporteursSelect.options.length; i++) {
                        if (transporteursSelect.options[i].value === transporteurId) {
                            transporteursSelect.options[i].selected = true;
                            existe = true;
                            break;
                        }
                    }
                    
                    // Si le transporteur n'est pas dans la liste, l'ajouter
                    if (!existe) {
                        const option = document.createElement('option');
                        option.value = transporteurId;
                        option.text = `${transporteurNom} ${transporteurPrenom} - ${transporteurVehicule}`;
                        option.selected = true;
                        transporteursSelect.appendChild(option);
                    }
                    
                    // Mettre à jour le compteur
                    updateTransporteurCounter();
                    
                    // Mettre à jour l'interface
                    this.innerHTML = '<i class="fas fa-check"></i> Assigné';
                    this.classList.remove('btn-outline-primary');
                    this.classList.add('btn-success');
                    this.disabled = true;
                    this.parentNode.parentNode.classList.add('list-group-item-success');
                }
            });
        });
    }
    
    // Attacher l'écouteur d'événement au bouton de vérification
    if (btnVerifierDispo) {
        btnVerifierDispo.addEventListener('click', verifierDisponibilites);
        console.log("Écouteur d'événement attaché au bouton de vérification");
    }
    
    // Attacher un écouteur d'événement au select des transporteurs pour mettre à jour le compteur
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', updateTransporteurCounter);
    }
    
    // Initialiser le compteur au chargement de la page
    updateTransporteurCounter();
    
    // Vérifier les disponibilités automatiquement si les dates sont déjà remplies
    if (dateDebutInput && dateDebutInput.value && 
        dateFinInput && dateFinInput.value && 
        typeDemenagementSelect && typeDemenagementSelect.value) {
        // Déclencher la vérification après un court délai
        console.log("Vérification automatique des disponibilités...");
        setTimeout(verifierDisponibilites, 500);
    }
    
    // Exposer les fonctions globalement pour une utilisation dans d'autres scripts
    window.transporteursEditPage = {
        verifierDisponibilites,
        afficherResultats,
        getTransporteursAssignes,
        updateTransporteurCounter
    };
});
