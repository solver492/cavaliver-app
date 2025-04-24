/**
 * Script simple pour la vérification des transporteurs sans dépendance jQuery
 * Utilisé pour la page d'édition des prestations
 */

// Attendre que tous les éléments du DOM soient chargés
document.addEventListener('DOMContentLoaded', function() {
    console.log("Script transporteurs-check-vanilla.js chargé");
    
    // Sélectionner les éléments nécessaires
    const btnVerifier = document.querySelector('#verifier-disponibilite') || document.querySelector('#verifier-disponibilites');
    const dateDebut = document.getElementById('date_debut');
    const dateFin = document.getElementById('date_fin');
    const typeDemenagement = document.getElementById('type_demenagement_id');
    const resultsContainer = document.getElementById('transporteurs-disponibles-resultats');
    const transporteursSelect = document.getElementById('transporteurs');
    
    console.log("Éléments trouvés:", {
        btnVerifier: btnVerifier ? true : false,
        dateDebut: dateDebut ? true : false,
        dateFin: dateFin ? true : false,
        typeDemenagement: typeDemenagement ? true : false,
        resultsContainer: resultsContainer ? true : false,
        transporteursSelect: transporteursSelect ? true : false
    });
    
    // Fonction pour obtenir les transporteurs déjà assignés
    function getAssignedTransporters() {
        if (!transporteursSelect) return [];
        
        const assignedIds = [];
        for (const option of transporteursSelect.options) {
            if (option.selected) {
                assignedIds.push(option.value);
            }
        }
        return assignedIds;
    }
    
    // Fonction pour mettre à jour le compteur de transporteurs
    function updateCounter() {
        const counterElement = document.getElementById('transporteur-counter');
        if (!counterElement || !transporteursSelect) return;
        
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
    
    // Fonction pour vérifier les disponibilités
    function checkAvailability() {
        console.log("Vérification des disponibilités...");
        
        // Vérifier que tous les champs nécessaires sont renseignés
        if (!dateDebut || !dateDebut.value || !dateFin || !dateFin.value || !typeDemenagement || !typeDemenagement.value) {
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Veuillez renseigner les dates de début et de fin ainsi que le type de déménagement.
                    </div>
                `;
            }
            return;
        }
        
        // Afficher un indicateur de chargement
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center my-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2">Vérification des disponibilités en cours...</p>
                </div>
            `;
        }
        
        // Récupérer l'ID de la prestation à partir de l'URL
        const urlParts = window.location.pathname.split('/');
        const prestationId = urlParts[urlParts.length - 1];
        
        // Créer l'objet FormData pour la requête
        const formData = new FormData();
        formData.append('date_debut', dateDebut.value);
        formData.append('date_fin', dateFin.value);
        formData.append('type_demenagement_id', typeDemenagement.value);
        
        // Ajouter l'ID de la prestation si nous sommes en mode édition
        if (prestationId && /^[0-9]+$/.test(prestationId)) {
            formData.append('prestation_id', prestationId);
        }
        
        // Envoyer la requête
        fetch('/prestations/check-disponibilite', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => {
            console.log("Status de la réponse:", response.status);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Données reçues:", data);
            
            // Afficher les résultats
            displayResults(data);
        })
        .catch(error => {
            console.error("Erreur lors de la vérification:", error);
            
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Une erreur s'est produite: ${error.message}
                    </div>
                `;
            }
        });
    }
    
    // Fonction pour afficher les résultats
    function displayResults(data) {
        if (!resultsContainer) return;
        
        // Récupérer les transporteurs déjà assignés
        const assignedIds = getAssignedTransporters();
        console.log("Transporteurs assignés:", assignedIds);
        
        let html = '<div class="my-3">';
        
        // Afficher les transporteurs disponibles
        if (data.transporteurs && data.transporteurs.length > 0) {
            html += '<h5 class="mb-3">Transporteurs disponibles:</h5>';
            html += '<div class="list-group mb-4">';
            
            // Trier les transporteurs: d'abord assignés, puis disponibles, puis indisponibles
            const transporteurs = [...data.transporteurs].sort((a, b) => {
                const aAssigne = assignedIds.includes(a.id.toString());
                const bAssigne = assignedIds.includes(b.id.toString());
                
                if (aAssigne && !bAssigne) return -1;
                if (!aAssigne && bAssigne) return 1;
                if (a.disponible && !b.disponible) return -1;
                if (!a.disponible && b.disponible) return 1;
                return 0;
            });
            
            for (const transporteur of transporteurs) {
                const estDejaAssigne = assignedIds.includes(transporteur.id.toString());
                
                // Définir les classes et le contenu en fonction du statut
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
                        <button type="button" class="btn btn-sm btn-outline-primary ms-2 btn-assigner" 
                                data-id="${transporteur.id}" data-nom="${transporteur.nom}" 
                                data-prenom="${transporteur.prenom}" data-vehicule="${transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié'}">
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
                            <div class="small text-muted">Véhicule: ${transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié'}</div>
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
        
        // Afficher les transporteurs bientôt disponibles
        if (data.soon_available && data.soon_available.length > 0) {
            html += '<h5 class="mt-4 mb-3">Transporteurs bientôt disponibles:</h5>';
            html += '<div class="list-group">';
            
            for (const transporteur of data.soon_available) {
                html += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${transporteur.nom} ${transporteur.prenom}</strong>
                            <div class="small text-muted">Véhicule: ${transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié'}</div>
                            <div class="small text-muted">Disponible le: ${transporteur.disponible_le}</div>
                        </div>
                        <span class="badge bg-warning text-dark">Bientôt disponible</span>
                    </div>
                `;
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        
        // Afficher les résultats
        resultsContainer.innerHTML = html;
        
        // Ajouter les écouteurs d'événements aux boutons d'assignation
        const btnAssigner = resultsContainer.querySelectorAll('.btn-assigner');
        btnAssigner.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const nom = this.dataset.nom;
                const prenom = this.dataset.prenom;
                const vehicule = this.dataset.vehicule;
                
                console.log(`Assignation du transporteur: ${nom} ${prenom} (ID: ${id})`);
                
                // Ajouter ce transporteur à la sélection
                if (transporteursSelect) {
                    // Vérifier s'il est déjà présent
                    let optionExists = false;
                    for (let i = 0; i < transporteursSelect.options.length; i++) {
                        if (transporteursSelect.options[i].value === id) {
                            transporteursSelect.options[i].selected = true;
                            optionExists = true;
                            break;
                        }
                    }
                    
                    // Ajouter l'option si elle n'existe pas
                    if (!optionExists) {
                        const option = document.createElement('option');
                        option.value = id;
                        option.text = `${nom} ${prenom} - ${vehicule}`;
                        option.selected = true;
                        transporteursSelect.appendChild(option);
                    }
                    
                    // Mettre à jour le compteur
                    updateCounter();
                    
                    // Mettre à jour l'UI
                    this.innerHTML = '<i class="fas fa-check"></i> Assigné';
                    this.disabled = true;
                    this.classList.remove('btn-outline-primary');
                    this.classList.add('btn-success');
                    this.closest('.list-group-item').classList.add('list-group-item-success');
                    
                    // Changer le badge
                    const badge = this.parentNode.querySelector('.badge');
                    if (badge) {
                        badge.className = 'badge bg-success';
                        badge.textContent = 'Assigné';
                    }
                }
            });
        });
    }
    
    // Attacher l'événement au bouton
    if (btnVerifier) {
        console.log("Ajout de l'événement click au bouton de vérification");
        btnVerifier.addEventListener('click', checkAvailability);
        
        // Vérifier les disponibilités automatiquement au chargement si tous les champs sont remplis
        if (dateDebut && dateDebut.value && dateFin && dateFin.value && typeDemenagement && typeDemenagement.value) {
            console.log("Vérification automatique des disponibilités...");
            setTimeout(checkAvailability, 500);
        }
    } else {
        console.error("Bouton de vérification des disponibilités introuvable");
    }
    
    // Attacher l'événement change au select pour mettre à jour le compteur
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', updateCounter);
        
        // Initialiser le compteur
        updateCounter();
    }
});
