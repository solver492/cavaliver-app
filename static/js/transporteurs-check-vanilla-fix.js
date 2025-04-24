/**
 * Script de vérification des transporteurs disponibles sans dépendance jQuery
 * Version corrigée pour la page d'édition des prestations
 */

// Attendre que le DOM soit complètement chargé
document.addEventListener("DOMContentLoaded", function() {
    console.log("Script de vérification des transporteurs initialisé");
    
    // Éléments du formulaire - Utiliser la même structure que sur la page d'ajout
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const transporteursSelect = document.getElementById('transporteurs');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const verifierDisponibiliteBtn = document.getElementById('verifier-disponibilite');
    const voirDisponibilitesBtn = document.getElementById('show-calendar-btn');
    
    // Récupérer l'ID de la prestation à partir de l'URL si on est en mode édition
    const urlParts = window.location.pathname.split('/');
    const prestationId = urlParts[urlParts.length - 1];
    
    // Conteneur pour afficher les résultats de la vérification
    const resultsContainer = document.getElementById('transporteurs-disponibles-resultats');
    
    console.log("Éléments trouvés:", {
        dateDebut: !!dateDebutInput,
        dateFin: !!dateFinInput,
        transporteurs: !!transporteursSelect,
        typeDemenagement: !!typeDemenagementSelect,
        btnVerifier: !!verifierDisponibiliteBtn,
        btnVoir: !!voirDisponibilitesBtn,
        resultsContainer: !!resultsContainer,
        prestationId: prestationId
    });
    
    // Si nous ne sommes pas sur la bonne page, ne pas exécuter le reste du script
    if (!dateDebutInput || !dateFinInput || !transporteursSelect) {
        console.log("Page de prestation non détectée, script abandonné");
        return;
    }
    
    // Fonction pour vérifier les disponibilités
    function verifierDisponibilites() {
        console.log("=== Vérification des disponibilités lancée ===");
        
        // Si le conteneur de résultats n'existe pas, on le crée
        if (!resultsContainer) {
            console.log("Création d'un conteneur de résultats");
            const container = transporteursSelect.parentElement;
            const newContainer = document.createElement('div');
            newContainer.id = 'transporteurs-disponibles-resultats';
            newContainer.className = 'mb-3 border p-3 rounded';
            container.insertBefore(newContainer, transporteursSelect.parentElement.firstChild);
        }
        
        // Afficher l'indicateur de chargement
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center my-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2">Vérification des disponibilités en cours...</p>
                </div>
            `;
        }
        
        // Vérifier que tous les champs requis sont remplis
        if (!dateDebutInput.value || !dateFinInput.value) {
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Veuillez sélectionner les dates de début et de fin.
                    </div>
                `;
            }
            return;
        }
        
        // Préparer les données pour la requête
        const formData = new FormData();
        formData.append('date_debut', dateDebutInput.value);
        formData.append('date_fin', dateFinInput.value);
        
        // Ajouter le type de déménagement si disponible
        if (typeDemenagementSelect && typeDemenagementSelect.value) {
            formData.append('type_demenagement_id', typeDemenagementSelect.value);
        }
        
        // Ajouter l'ID de la prestation si on est en mode édition
        if (prestationId && /^\d+$/.test(prestationId)) {
            formData.append('prestation_id', prestationId);
        }
        
        console.log("Données envoyées:", {
            date_debut: dateDebutInput.value,
            date_fin: dateFinInput.value,
            type_demenagement_id: typeDemenagementSelect ? typeDemenagementSelect.value : 'non disponible',
            prestation_id: prestationId && /^\d+$/.test(prestationId) ? prestationId : 'non disponible'
        });
        
        // Envoyer la requête au serveur
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
            
            // Mettre à jour le select des transporteurs
            updateTransporteurSelect(data);
        })
        .catch(error => {
            console.error("Erreur lors de la vérification:", error);
            
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Une erreur s'est produite lors de la vérification: ${error.message}
                    </div>
                `;
            }
        });
    }
    
    // Fonction pour afficher les résultats dans le conteneur dédié
    function displayResults(data) {
        if (!resultsContainer) return;
        
        let html = '';
        
        // Afficher les transporteurs disponibles
        if (data.transporteurs && data.transporteurs.length > 0) {
            html += `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> 
                    ${data.transporteurs.length} transporteur(s) disponible(s) pour cette période.
                </div>
                <div class="small text-muted mb-2">Vous pouvez sélectionner ces transporteurs dans la liste ci-dessous.</div>
            `;
        } else {
            html += `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Aucun transporteur disponible pour cette période.
                </div>
            `;
        }
        
        // Afficher les transporteurs bientôt disponibles
        if (data.soon_available && data.soon_available.length > 0) {
            html += `
                <div class="mt-3">
                    <h5>Transporteurs bientôt disponibles :</h5>
                    <ul class="list-group">
            `;
            
            data.soon_available.forEach(transporteur => {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${transporteur.nom} ${transporteur.prenom}</strong>
                            <div class="small text-muted">Véhicule: ${transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié'}</div>
                        </div>
                        <span class="badge bg-warning text-dark">Disponible le ${transporteur.disponible_le}</span>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Afficher les résultats
        resultsContainer.innerHTML = html;
    }
    
    // Fonction pour mettre à jour le select des transporteurs
    function updateTransporteurSelect(data) {
        if (!transporteursSelect) return;
        
        const transporteurs = data.transporteurs || [];
        const currentlySelected = Array.from(transporteursSelect.selectedOptions).map(opt => opt.value);
        
        // Mettre à jour les options du select
        for (let i = 0; i < transporteursSelect.options.length; i++) {
            const option = transporteursSelect.options[i];
            const transporteurId = option.value;
            
            // Réinitialiser les classes
            option.classList.remove('transporteur-recommande', 'transporteur-indisponible');
            
            // Vérifier si ce transporteur est disponible
            const transporteurDisponible = transporteurs.find(t => t.id == transporteurId);
            
            if (transporteurDisponible) {
                // Si transporteur disponible, le mettre en évidence
                option.classList.add('transporteur-recommande');
            } else if (transporteurId != 0) {
                // Si transporteur non disponible, le griser
                option.classList.add('transporteur-indisponible');
            }
        }
        
        // Ajouter du CSS pour les classes transporteur-* si nécessaire
        if (!document.getElementById('transporteurs-style')) {
            const style = document.createElement('style');
            style.id = 'transporteurs-style';
            style.textContent = `
                .transporteur-indisponible {
                    color: #ff6b6b;
                    background-color: #ffeaea;
                }
                .transporteur-recommande {
                    color: #20c997;
                    background-color: #e6f7f2;
                    font-weight: bold;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Mettre à jour le compteur de transporteurs sélectionnés
        updateTransporteurCounter();
    }
    
    // Fonction pour mettre à jour le compteur de transporteurs
    function updateTransporteurCounter() {
        const countElement = document.querySelector('.selected-transporteurs-count');
        if (!countElement || !transporteursSelect) return;
        
        const selectedCount = Array.from(transporteursSelect.selectedOptions).length;
        countElement.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
        
        // Mettre à jour la couleur selon si des transporteurs sont sélectionnés
        if (selectedCount > 0) {
            countElement.classList.remove('text-danger');
            countElement.classList.add('text-success');
        } else {
            countElement.classList.remove('text-success');
            countElement.classList.add('text-danger');
        }
    }
    
    // Attacher les événements
    if (verifierDisponibiliteBtn) {
        console.log("Ajout de l'événement au bouton de vérification");
        verifierDisponibiliteBtn.addEventListener('click', verifierDisponibilites);
    }
    
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', updateTransporteurCounter);
    }
    
    // Vérifier automatiquement les disponibilités au chargement si tous les champs sont remplis
    if (dateDebutInput.value && dateFinInput.value) {
        console.log("Vérification automatique des disponibilités au chargement");
        setTimeout(verifierDisponibilites, 300);
    }
    
    // Ajouter une fonction globale pour permettre l'appel depuis d'autres scripts
    window.checkTransporteurAvailability = verifierDisponibilites;
    
    console.log("Initialisation du script de vérification des transporteurs terminée");
});
