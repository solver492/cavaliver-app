/**
 * Script robuste pour la vérification des transporteurs disponibles
 * Résout les problèmes de confusion entre les modèles de données et améliore la gestion des erreurs
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script de vérification robuste des transporteurs chargé");
    
    // Éléments du DOM
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const btnVerifierDisponibilite = document.getElementById('verifier-disponibilite');
    const transporteursSelect = document.getElementById('transporteurs');
    
    // Vérifier si tous les éléments nécessaires sont présents
    if (!dateDebutInput || !dateFinInput || !typeDemenagementSelect) {
        console.error("Éléments du formulaire manquants pour la vérification des transporteurs");
        return;
    }
    
    // Fonction principale pour vérifier les disponibilités
    function verifierDisponibilitesRobuste() {
        console.log("Vérification robuste des disponibilités démarrée");
        
        try {
            // Récupérer les valeurs du formulaire
            const dateDebut = dateDebutInput.value;
            const dateFin = dateFinInput.value;
            const typeDemenagement = typeDemenagementSelect.value;
            const prestationId = document.querySelector('input[name="id"]') ? 
                                document.querySelector('input[name="id"]').value : '';
            
            // Validation des données
            if (!dateDebut || !dateFin) {
                afficherMessage("Veuillez remplir les dates de début et de fin", "warning");
                return;
            }
            
            if (!typeDemenagement) {
                afficherMessage("Veuillez sélectionner un type de déménagement", "warning");
                return;
            }
            
            // Afficher un indicateur de chargement
            afficherMessage("Vérification des disponibilités en cours...", "info", true);
            
            // Préparation des données pour l'API
            const donnees = {
                date_debut: dateDebut,
                date_fin: dateFin,
                type_demenagement_id: typeDemenagement,
                prestation_id: prestationId
            };
            
            console.log("Données envoyées à l'API:", donnees);
            
            // Appel à l'API
            fetch('/api/check_disponibilite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(donnees)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Réponse de l'API:", data);
                traiterResultatsDisponibilite(data);
            })
            .catch(error => {
                console.error("Erreur lors de la vérification:", error);
                afficherMessage(`Erreur lors de la vérification: ${error.message}`, "danger");
            });
        } catch (error) {
            console.error("Exception lors de la vérification:", error);
            afficherMessage(`Une erreur inattendue s'est produite: ${error.message}`, "danger");
        }
    }
    
    // Fonction pour traiter les résultats de l'API
    function traiterResultatsDisponibilite(data) {
        try {
            if (!data) {
                throw new Error("Aucune donnée reçue de l'API");
            }
            
            // Récupérer les transporteurs disponibles et bientôt disponibles
            const transporteursDisponibles = data.transporteurs || [];
            const transporteursBientotDisponibles = data.soon_available || [];
            
            // Créer le HTML pour afficher les résultats
            let html = '';
            
            if (data.success) {
                if (transporteursDisponibles.length > 0) {
                    html += '<div class="alert alert-success mb-3">';
                    html += `<strong>${transporteursDisponibles.length} transporteur(s) disponible(s)</strong> pour cette période`;
                    html += '</div>';
                    
                    // Mettre à jour la liste des transporteurs
                    mettreAJourListeTransporteurs(transporteursDisponibles);
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
                        // Gestion des différents formats de données possibles
                        const nom = t.nom || (t.prenom && t.nom ? `${t.prenom} ${t.nom}` : 'Transporteur');
                        const vehicule = t.vehicule || t.type_vehicule || 'Non spécifié';
                        const disponibleDate = t.disponible_a_partir || t.date_disponibilite;
                        
                        if (disponibleDate) {
                            const dateFormatee = new Date(disponibleDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            });
                            
                            html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${nom}</strong> (${vehicule})
                                    <br><small>Disponible à partir du ${dateFormatee}</small>
                                </div>
                            </li>`;
                        }
                    });
                    
                    html += '</ul>';
                    html += '</div>';
                }
            } else {
                html += '<div class="alert alert-danger">';
                html += '<strong>Erreur:</strong> ' + (data.message || 'Impossible de vérifier les disponibilités');
                html += '</div>';
            }
            
            // Afficher les résultats
            afficherMessage(html, "custom");
        } catch (error) {
            console.error("Erreur lors du traitement des résultats:", error);
            afficherMessage(`Erreur lors du traitement des résultats: ${error.message}`, "danger");
        }
    }
    
    // Fonction pour mettre à jour la liste des transporteurs
    function mettreAJourListeTransporteurs(transporteursDisponibles) {
        try {
            if (!transporteursSelect) {
                console.error("Élément select des transporteurs non trouvé");
                return;
            }
            
            // Conserver les transporteurs déjà sélectionnés
            const selectedIds = Array.from(transporteursSelect.selectedOptions).map(opt => opt.value);
            
            // Parcourir toutes les options et mettre à jour leur apparence
            Array.from(transporteursSelect.options).forEach(option => {
                const transporteurId = option.value;
                
                // Vérifier si le transporteur est disponible (gestion des deux formats possibles)
                const isDisponible = transporteursDisponibles.some(t => {
                    // Vérifier si l'ID correspond à l'un des formats possibles
                    return (t.id && t.id.toString() === transporteurId) || 
                           (t.user_id && t.user_id.toString() === transporteurId) ||
                           (t.transporteur_id && t.transporteur_id.toString() === transporteurId);
                });
                
                // Mettre à jour l'apparence de l'option
                if (isDisponible) {
                    option.classList.add('bg-success', 'text-white');
                    option.classList.remove('text-muted', 'bg-light');
                } else {
                    option.classList.remove('bg-success', 'text-white');
                    option.classList.add('text-muted', 'bg-light');
                }
            });
            
            // Mettre à jour le compteur de transporteurs sélectionnés
            const countDisplay = document.querySelector('.selected-transporteurs-count');
            if (countDisplay) {
                const selectedCount = Array.from(transporteursSelect.selectedOptions).length;
                countDisplay.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la liste des transporteurs:", error);
        }
    }
    
    // Fonction pour afficher des messages
    function afficherMessage(message, type, isLoading = false) {
        try {
            // Récupérer ou créer le conteneur de résultats
            let resultsContainer = document.getElementById('transporteurs-resultats');
            
            if (!resultsContainer) {
                resultsContainer = document.createElement('div');
                resultsContainer.id = 'transporteurs-resultats';
                
                // Trouver où insérer le conteneur
                const transporteursSection = document.querySelector('.transporteurs');
                if (transporteursSection) {
                    // Insérer après le titre "Transporteurs disponibles"
                    const titre = transporteursSection.querySelector('h4');
                    if (titre) {
                        titre.insertAdjacentElement('afterend', resultsContainer);
                    } else {
                        transporteursSection.appendChild(resultsContainer);
                    }
                } else {
                    // Fallback: insérer après le bouton de vérification
                    if (btnVerifierDisponibilite) {
                        btnVerifierDisponibilite.parentNode.insertAdjacentElement('afterend', resultsContainer);
                    }
                }
            }
            
            // Afficher le conteneur
            resultsContainer.style.display = 'block';
            
            // Définir le contenu en fonction du type
            if (type === "custom") {
                resultsContainer.innerHTML = message;
            } else {
                const iconClass = {
                    'info': 'fa-info-circle',
                    'success': 'fa-check-circle',
                    'warning': 'fa-exclamation-triangle',
                    'danger': 'fa-exclamation-circle'
                }[type] || 'fa-info-circle';
                
                const spinnerHtml = isLoading ? '<i class="fas fa-spinner fa-spin mr-2"></i> ' : '';
                
                resultsContainer.innerHTML = `
                    <div class="alert alert-${type} mb-3">
                        ${spinnerHtml}<i class="fas ${iconClass}"></i> ${message}
                    </div>
                `;
            }
        } catch (error) {
            console.error("Erreur lors de l'affichage du message:", error);
        }
    }
    
    // Ajouter l'écouteur d'événement au bouton de vérification
    if (btnVerifierDisponibilite) {
        console.log("Ajout de l'écouteur d'événement au bouton de vérification");
        
        // Supprimer les anciens écouteurs d'événements pour éviter les doublons
        const newBtn = btnVerifierDisponibilite.cloneNode(true);
        btnVerifierDisponibilite.parentNode.replaceChild(newBtn, btnVerifierDisponibilite);
        
        // Ajouter le nouvel écouteur d'événement
        newBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log("Bouton de vérification cliqué");
            verifierDisponibilitesRobuste();
        });
    } else {
        console.error("Bouton de vérification des disponibilités non trouvé");
    }
    
    console.log("Initialisation du vérificateur robuste des transporteurs terminée");
});
