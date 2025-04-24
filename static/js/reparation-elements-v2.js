/**
 * Script de réparation amélioré pour les éléments de l'interface de prestation
 * Version 2.0 - Corrige spécifiquement les problèmes avec :
 * - Le bouton btn-groupage
 * - Les div de transporteurs
 * - Les boutons d'ajout d'étapes
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script de réparation des éléments v2 chargé");
    
    // Fonction utilitaire pour remplacer un élément et ses écouteurs
    function replaceElementAndListeners(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Élément '${elementId}' non trouvé`);
            return null;
        }
        
        // Cloner l'élément pour supprimer tous les écouteurs
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        // Ajouter le nouvel écouteur
        newElement.addEventListener(eventType, handler);
        
        return newElement;
    }
    
    // 1. Correction du bouton de groupage
    try {
        const btnGroupage = replaceElementAndListeners('btn-groupage', 'click', function(e) {
            e.preventDefault();
            console.log("Bouton groupage cliqué");
            
            // Récupérer ou créer le bouton standard
            const btnStandard = document.getElementById('btn-standard');
            
            // Mettre à jour les classes CSS
            this.classList.add('active');
            if (btnStandard) btnStandard.classList.remove('active');
            
            // Afficher les sections spécifiques au groupage
            const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
            if (clientsSupplementairesDiv) clientsSupplementairesDiv.style.display = 'block';
            
            const btnAjouterClient = document.getElementById('ajouter-client');
            if (btnAjouterClient) btnAjouterClient.style.display = 'block';
            
            // Mettre à jour les champs cachés
            const typeHidden = document.getElementById('type_demenagement');
            if (typeHidden) typeHidden.value = 'Groupage';
            
            // Créer ou mettre à jour le champ est_groupage
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
        
        if (btnGroupage) {
            console.log("Bouton groupage réparé avec succès");
        }
    } catch (error) {
        console.error("Erreur lors de la réparation du bouton groupage:", error);
    }
    
    // 2. Correction des boutons d'ajout d'étapes
    try {
        const btnAjouterEtapeDepart = replaceElementAndListeners('ajouter-etape-depart', 'click', function(e) {
            e.preventDefault();
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
        
        if (btnAjouterEtapeDepart) {
            console.log("Bouton ajouter étape départ réparé avec succès");
        }
    } catch (error) {
        console.error("Erreur lors de la réparation du bouton ajouter étape départ:", error);
    }
    
    try {
        const btnAjouterEtapeArrivee = replaceElementAndListeners('ajouter-etape-arrivee', 'click', function(e) {
            e.preventDefault();
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
        
        if (btnAjouterEtapeArrivee) {
            console.log("Bouton ajouter étape arrivée réparé avec succès");
        }
    } catch (error) {
        console.error("Erreur lors de la réparation du bouton ajouter étape arrivée:", error);
    }
    
    // 3. Correction du div des transporteurs
    try {
        const transporteursDiv = document.querySelector('.transporteurs');
        if (transporteursDiv) {
            console.log("Réparation du div des transporteurs");
            
            // S'assurer que le div est correctement affiché
            transporteursDiv.style.display = 'block';
            
            // Correction du bouton de vérification des disponibilités
            const btnVerifierDisponibilite = document.getElementById('verifier-disponibilite');
            if (btnVerifierDisponibilite) {
                // Remplacer l'écouteur d'événement
                const newBtnVerifier = btnVerifierDisponibilite.cloneNode(true);
                btnVerifierDisponibilite.parentNode.replaceChild(newBtnVerifier, btnVerifierDisponibilite);
                
                newBtnVerifier.addEventListener('click', function(e) {
                    e.preventDefault();
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
                    
                    // Créer ou récupérer le div de résultats
                    let transporteursResultatsDiv = document.getElementById('transporteurs-resultats');
                    if (!transporteursResultatsDiv) {
                        transporteursResultatsDiv = document.createElement('div');
                        transporteursResultatsDiv.id = 'transporteurs-resultats';
                        transporteursDiv.appendChild(transporteursResultatsDiv);
                    }
                    
                    // Afficher un indicateur de chargement
                    transporteursResultatsDiv.innerHTML = '<div class="alert alert-info"><i class="fas fa-spinner fa-spin"></i> Vérification en cours...</div>';
                    
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
                                    // Mettre en évidence les transporteurs disponibles
                                    Array.from(transporteursSelect.options).forEach(option => {
                                        option.classList.remove('disponible', 'indisponible');
                                        
                                        const transporteurId = option.value;
                                        const isDisponible = transporteursDisponibles.some(t => 
                                            (t.id && t.id.toString() === transporteurId) || 
                                            (t.user_id && t.user_id.toString() === transporteurId)
                                        );
                                        
                                        if (isDisponible) {
                                            option.classList.add('disponible');
                                        } else {
                                            option.classList.add('indisponible');
                                        }
                                    });
                                }
                            } else {
                                html += '<div class="alert alert-warning mb-3">';
                                html += '<strong>Aucun transporteur disponible</strong> pour cette période';
                                html += '</div>';
                            }
                        } else {
                            html += '<div class="alert alert-danger mb-3">';
                            html += `<strong>Erreur:</strong> ${data.message || 'Une erreur est survenue lors de la vérification'}`;
                            html += '</div>';
                        }
                        
                        transporteursResultatsDiv.innerHTML = html;
                    })
                    .catch(error => {
                        console.error('Erreur:', error);
                        transporteursResultatsDiv.innerHTML = `
                            <div class="alert alert-danger mb-3">
                                <strong>Erreur:</strong> ${error.message || 'Une erreur est survenue lors de la vérification'}
                            </div>
                        `;
                    });
                });
                
                console.log("Bouton vérifier disponibilité réparé avec succès");
            }
            
            // Correction du compteur de transporteurs sélectionnés
            const transporteursSelect = document.getElementById('transporteurs');
            const countDisplay = document.querySelector('.selected-transporteurs-count');
            
            if (transporteursSelect && countDisplay) {
                // Fonction pour mettre à jour le compteur
                function updateTransporteursCount() {
                    const selectedCount = Array.from(transporteursSelect.selectedOptions).length;
                    countDisplay.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
                }
                
                // Supprimer les anciens écouteurs d'événements
                const newTransporteursSelect = transporteursSelect.cloneNode(true);
                transporteursSelect.parentNode.replaceChild(newTransporteursSelect, transporteursSelect);
                
                // Ajouter le nouvel écouteur
                newTransporteursSelect.addEventListener('change', updateTransporteursCount);
                
                // Mettre à jour le compteur au chargement
                updateTransporteursCount();
                
                console.log("Compteur de transporteurs réparé avec succès");
            }
        }
    } catch (error) {
        console.error("Erreur lors de la réparation du div des transporteurs:", error);
    }
    
    console.log("Script de réparation des éléments v2 terminé");
});
