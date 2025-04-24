/**
 * Script de débogage et de vérification des transporteurs
 * Version améliorée avec gestion d'erreurs robuste
 */

// Fonction d'initialisation avec gestion des erreurs
(function() {
    try {
        // Attendre que le DOM soit complètement chargé
        document.addEventListener("DOMContentLoaded", function() {
            console.log("[Transporteurs Debug] Initialisation du script de débogage");
            
            // Détection de la page
            const isEditPage = window.location.pathname.includes('/edit/');
            const isAddPage = window.location.pathname.includes('/add');
            const isTransporteurPage = window.location.pathname.includes('/transporteurs');
            
            console.log("[Transporteurs Debug] Type de page détecté:", { 
                isEditPage, 
                isAddPage, 
                isTransporteurPage,
                path: window.location.pathname 
            });
            
            // Éléments du formulaire - Utiliser des sélecteurs plus robustes
            const dateDebutInput = document.getElementById('date_debut');
            const dateFinInput = document.getElementById('date_fin');
            const transporteursSelect = document.getElementById('transporteurs');
            const typeDemenagementSelect = document.getElementById('type_demenagement_id');
            
            // Différents sélecteurs pour le bouton de vérification
            const verifierBtns = [
                document.getElementById('verifier-disponibilite'),
                document.getElementById('verifier-disponibilites'),
                document.querySelector('.btn-verifier-disponibilite'),
                document.querySelector('[data-action="verifier-disponibilite"]')
            ].filter(Boolean);
            
            const verifierDisponibiliteBtn = verifierBtns.length > 0 ? verifierBtns[0] : null;
            
            // Récupérer l'ID de la prestation à partir de l'URL si on est en mode édition
            const urlParts = window.location.pathname.split('/');
            const prestationId = urlParts[urlParts.length - 1];
            
            // Conteneur pour afficher les résultats de la vérification
            let resultsContainer = document.getElementById('transporteurs-disponibles-resultats');
            
            // Si le conteneur n'existe pas, le créer
            if (!resultsContainer && transporteursSelect) {
                console.log("[Transporteurs Debug] Création du conteneur de résultats");
                resultsContainer = document.createElement('div');
                resultsContainer.id = 'transporteurs-disponibles-resultats';
                resultsContainer.className = 'mb-3 border p-3 rounded';
                
                // Insérer le conteneur avant le select des transporteurs
                if (transporteursSelect.parentElement) {
                    transporteursSelect.parentElement.insertBefore(resultsContainer, transporteursSelect);
                }
            }
            
            console.log("[Transporteurs Debug] Éléments détectés:", {
                dateDebut: dateDebutInput ? true : false,
                dateFin: dateFinInput ? true : false,
                transporteurs: transporteursSelect ? true : false,
                typeDemenagement: typeDemenagementSelect ? true : false,
                btnVerifier: verifierDisponibiliteBtn ? true : false,
                resultsContainer: resultsContainer ? true : false,
                prestationId: prestationId || 'non détecté'
            });
            
            // Si nous ne sommes pas sur la bonne page, ne pas exécuter le reste du script
            if (!dateDebutInput || !dateFinInput || !transporteursSelect) {
                console.log("[Transporteurs Debug] Page de prestation non détectée, script abandonné");
                return;
            }
            
            // Fonction pour vérifier les disponibilités avec gestion d'erreurs améliorée
            function verifierDisponibilites(event) {
                try {
                    // Empêcher le comportement par défaut du bouton
                    if (event) event.preventDefault();
                    
                    console.log("[Transporteurs Debug] Vérification des disponibilités lancée");
                    
                    // Si le conteneur de résultats n'existe pas, on le crée
                    if (!resultsContainer) {
                        console.log("[Transporteurs Debug] Création d'un conteneur de résultats");
                        const container = transporteursSelect.parentElement;
                        resultsContainer = document.createElement('div');
                        resultsContainer.id = 'transporteurs-disponibles-resultats';
                        resultsContainer.className = 'mb-3 border p-3 rounded';
                        container.insertBefore(resultsContainer, transporteursSelect);
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
                    
                    console.log("[Transporteurs Debug] Données envoyées:", {
                        date_debut: dateDebutInput.value,
                        date_fin: dateFinInput.value,
                        type_demenagement_id: typeDemenagementSelect ? typeDemenagementSelect.value : 'non disponible',
                        prestation_id: prestationId && /^\d+$/.test(prestationId) ? prestationId : 'non disponible'
                    });
                    
                    // Envoyer la requête au serveur
                    fetch('/prestations/check-disponibilite', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => {
                        console.log("[Transporteurs Debug] Status de la réponse:", response.status);
                        
                        if (!response.ok) {
                            return response.text().then(text => {
                                try {
                                    // Essayer de parser comme JSON
                                    const jsonData = JSON.parse(text);
                                    throw new Error(jsonData.message || `Erreur HTTP: ${response.status}`);
                                } catch (e) {
                                    // Si ce n'est pas du JSON, renvoyer le texte brut ou l'erreur HTTP
                                    throw new Error(text || `Erreur HTTP: ${response.status}`);
                                }
                            });
                        }
                        
                        return response.json();
                    })
                    .then(data => {
                        console.log("[Transporteurs Debug] Données reçues:", data);
                        
                        // Vérifier si les données sont valides
                        if (!data || typeof data !== 'object') {
                            throw new Error("Format de réponse invalide");
                        }
                        
                        // Afficher les résultats
                        displayResults(data);
                        
                        // Mettre à jour le select des transporteurs
                        updateTransporteurSelect(data);
                    })
                    .catch(error => {
                        console.error("[Transporteurs Debug] Erreur lors de la vérification:", error);
                        
                        if (resultsContainer) {
                            resultsContainer.innerHTML = `
                                <div class="alert alert-danger">
                                    <i class="fas fa-exclamation-circle"></i> 
                                    Une erreur s'est produite lors de la vérification: ${error.message || "Erreur inconnue"}
                                </div>
                                <div class="small text-muted">
                                    Détails techniques: ${error.stack || "Non disponible"}
                                </div>
                            `;
                        }
                    });
                } catch (error) {
                    console.error("[Transporteurs Debug] Erreur critique:", error);
                    
                    if (resultsContainer) {
                        resultsContainer.innerHTML = `
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-circle"></i> 
                                Erreur critique: ${error.message || "Erreur inconnue"}
                            </div>
                        `;
                    }
                }
            }
            
            // Fonction pour afficher les résultats dans le conteneur dédié
            function displayResults(data) {
                try {
                    if (!resultsContainer) return;
                    
                    let html = '';
                    
                    // Afficher les transporteurs disponibles
                    if (data.transporteurs && Array.isArray(data.transporteurs) && data.transporteurs.length > 0) {
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
                    if (data.soon_available && Array.isArray(data.soon_available) && data.soon_available.length > 0) {
                        html += `
                            <div class="mt-3">
                                <h5>Transporteurs bientôt disponibles :</h5>
                                <ul class="list-group">
                        `;
                        
                        data.soon_available.forEach(transporteur => {
                            html += `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${transporteur.nom || ''} ${transporteur.prenom || ''}</strong>
                                        <div class="small text-muted">Véhicule: ${transporteur.vehicule || transporteur.type_vehicule || 'Non spécifié'}</div>
                                    </div>
                                    <span class="badge bg-warning text-dark">Disponible le ${transporteur.disponible_le || 'bientôt'}</span>
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
                } catch (error) {
                    console.error("[Transporteurs Debug] Erreur d'affichage des résultats:", error);
                    resultsContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i> 
                            Erreur lors de l'affichage des résultats: ${error.message || "Erreur inconnue"}
                        </div>
                    `;
                }
            }
            
            // Fonction pour mettre à jour le select des transporteurs
            function updateTransporteurSelect(data) {
                try {
                    if (!transporteursSelect) return;
                    
                    const transporteurs = data.transporteurs || [];
                    
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
                } catch (error) {
                    console.error("[Transporteurs Debug] Erreur de mise à jour du select:", error);
                }
            }
            
            // Fonction pour mettre à jour le compteur de transporteurs
            function updateTransporteurCounter() {
                try {
                    const counterElement = document.getElementById('transporteur-counter');
                    if (!counterElement || !transporteursSelect) return;
                    
                    const selectedOptions = Array.from(transporteursSelect.options).filter(opt => opt.selected);
                    const selectedCount = selectedOptions.length;
                    
                    let message = `${selectedCount} transporteur(s) sélectionné(s)`;
                    
                    if (selectedCount === 0) {
                        message += " - Aucun transporteur sélectionné";
                    } else if (selectedCount === 1) {
                        message += ` - ${selectedOptions[0].text}`;
                    } else {
                        message += " - Plusieurs transporteurs sélectionnés";
                    }
                    
                    counterElement.textContent = message;
                } catch (error) {
                    console.error("[Transporteurs Debug] Erreur de mise à jour du compteur:", error);
                }
            }
            
            // Attacher les événements avec gestion d'erreurs
            if (verifierDisponibiliteBtn) {
                console.log("[Transporteurs Debug] Ajout de l'événement au bouton de vérification");
                
                // Supprimer les gestionnaires d'événements existants pour éviter les doublons
                const newBtn = verifierDisponibiliteBtn.cloneNode(true);
                verifierDisponibiliteBtn.parentNode.replaceChild(newBtn, verifierDisponibiliteBtn);
                
                // Ajouter le nouveau gestionnaire d'événements
                newBtn.addEventListener('click', verifierDisponibilites);
            } else {
                console.warn("[Transporteurs Debug] Bouton de vérification non trouvé");
            }
            
            // Attacher l'événement de mise à jour du compteur au select
            if (transporteursSelect) {
                transporteursSelect.addEventListener('change', updateTransporteurCounter);
                
                // Initialiser le compteur
                updateTransporteurCounter();
            }
            
            // Résoudre le problème de confusion entre User et Transporteur
            console.log("[Transporteurs Debug] Vérification de la cohérence des modèles de données");
            
            // Vérifier si nous avons des transporteurs dans le select
            if (transporteursSelect && transporteursSelect.options.length > 0) {
                console.log("[Transporteurs Debug] Nombre d'options dans le select:", transporteursSelect.options.length);
            }
            
            console.log("[Transporteurs Debug] Initialisation terminée avec succès");
        });
    } catch (error) {
        console.error("[Transporteurs Debug] Erreur critique lors de l'initialisation:", error);
    }
})();
