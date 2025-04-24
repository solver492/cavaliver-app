/**
 * Script de correction pour la page d'édition des prestations
 * Corrige spécifiquement :
 * - L'ajout de nouveaux clients dans le mode groupage
 * - La sélection des transporteurs
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script de correction pour la page d'édition des prestations chargé");
    
    // 1. Correction de l'ajout de nouveaux clients
    try {
        const btnAjouterClient = document.getElementById('ajouter-client');
        if (btnAjouterClient) {
            console.log("Réparation du bouton d'ajout de client");
            
            // Supprimer les écouteurs existants
            const newBtnAjouterClient = btnAjouterClient.cloneNode(true);
            btnAjouterClient.parentNode.replaceChild(newBtnAjouterClient, btnAjouterClient);
            
            // Ajouter le nouvel écouteur
            newBtnAjouterClient.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("Bouton ajouter client cliqué");
                
                const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
                if (!clientsSupplementairesDiv) {
                    console.error("Élément 'clients-supplementaires' non trouvé");
                    return;
                }
                
                // Récupérer la liste des clients
                const clientSelect = document.getElementById('client_id');
                if (!clientSelect) {
                    console.error("Élément 'client_id' non trouvé");
                    return;
                }
                
                // Créer un nouveau conteneur pour ce client
                const clientDiv = document.createElement('div');
                clientDiv.className = 'input-group mt-2 client-supplementaire';
                
                // Créer une copie de la liste des clients
                const selectHtml = document.createElement('select');
                selectHtml.className = 'form-select';
                selectHtml.name = 'clients_supplementaires[]';
                
                // Option par défaut
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Sélectionner un client';
                selectHtml.appendChild(defaultOption);
                
                // Ajouter les options de clients
                Array.from(clientSelect.options).forEach(option => {
                    if (option.value) {
                        const newOption = document.createElement('option');
                        newOption.value = option.value;
                        newOption.textContent = option.textContent;
                        selectHtml.appendChild(newOption);
                    }
                });
                
                // Ajouter le select au div
                clientDiv.appendChild(selectHtml);
                
                // Ajouter le bouton de suppression
                const btnSupprimer = document.createElement('button');
                btnSupprimer.type = 'button';
                btnSupprimer.className = 'btn btn-outline-danger supprimer-client';
                btnSupprimer.innerHTML = '<i class="fas fa-trash-alt"></i>';
                btnSupprimer.addEventListener('click', function() {
                    clientDiv.remove();
                });
                
                clientDiv.appendChild(btnSupprimer);
                
                // Ajouter le client au conteneur
                clientsSupplementairesDiv.appendChild(clientDiv);
            });
            
            console.log("Bouton ajouter client réparé avec succès");
        }
    } catch (error) {
        console.error("Erreur lors de la réparation du bouton d'ajout de client:", error);
    }
    
    // 2. Correction de la sélection des transporteurs
    try {
        const transporteursSelect = document.getElementById('transporteurs');
        if (transporteursSelect) {
            console.log("Réparation de la sélection des transporteurs");
            
            // Supprimer les styles qui pourraient interférer avec la sélection
            transporteursSelect.style.pointerEvents = 'auto';
            transporteursSelect.style.userSelect = 'auto';
            
            // Ajouter des styles pour améliorer la visibilité des options
            const options = transporteursSelect.querySelectorAll('option');
            options.forEach(option => {
                option.style.padding = '8px';
                option.style.margin = '2px 0';
                option.style.borderRadius = '4px';
                option.style.cursor = 'pointer';
            });
            
            // Réinitialiser les écouteurs d'événements
            const newTransporteursSelect = transporteursSelect.cloneNode(true);
            transporteursSelect.parentNode.replaceChild(newTransporteursSelect, transporteursSelect);
            
            // Ajouter l'écouteur pour mettre à jour le compteur
            newTransporteursSelect.addEventListener('change', function() {
                updateTransporteursCount();
            });
            
            // Ajouter l'écouteur pour le clic sur les options
            newTransporteursSelect.addEventListener('click', function(e) {
                if (e.target.tagName === 'OPTION') {
                    // Toggle la sélection au clic
                    e.target.selected = !e.target.selected;
                    
                    // Déclencher l'événement change
                    const event = new Event('change');
                    this.dispatchEvent(event);
                }
            });
            
            // Fonction pour mettre à jour le compteur
            function updateTransporteursCount() {
                const selectedCount = Array.from(newTransporteursSelect.selectedOptions).length;
                const countDisplay = document.querySelector('.selected-transporteurs-count');
                if (countDisplay) {
                    countDisplay.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
                }
            }
            
            // Initialiser le compteur
            updateTransporteursCount();
            
            console.log("Sélection des transporteurs réparée avec succès");
        }
    } catch (error) {
        console.error("Erreur lors de la réparation de la sélection des transporteurs:", error);
    }
    
    // 3. Correction du bouton de groupage
    try {
        const btnGroupage = document.getElementById('btn-groupage');
        const btnStandard = document.getElementById('btn-standard');
        
        if (btnGroupage && btnStandard) {
            console.log("Réparation des boutons de mode de prestation");
            
            // Supprimer les écouteurs existants
            const newBtnGroupage = btnGroupage.cloneNode(true);
            const newBtnStandard = btnStandard.cloneNode(true);
            
            btnGroupage.parentNode.replaceChild(newBtnGroupage, btnGroupage);
            btnStandard.parentNode.replaceChild(newBtnStandard, btnStandard);
            
            // Ajouter les nouveaux écouteurs
            newBtnGroupage.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("Bouton groupage cliqué");
                
                // Mettre à jour les classes CSS
                this.classList.add('active');
                newBtnStandard.classList.remove('active');
                
                // Afficher les sections spécifiques au groupage
                const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
                if (clientsSupplementairesDiv) clientsSupplementairesDiv.style.display = 'block';
                
                const btnAjouterClient = document.getElementById('ajouter-client');
                if (btnAjouterClient) btnAjouterClient.style.display = 'block';
                
                // Mettre à jour le texte d'information
                const modeInfo = document.getElementById('mode-info');
                if (modeInfo) modeInfo.innerHTML = '<i class="fas fa-info-circle"></i> Mode groupage: plusieurs clients, plusieurs points de départ/arrivée';
                
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
            
            newBtnStandard.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("Bouton standard cliqué");
                
                // Mettre à jour les classes CSS
                this.classList.add('active');
                newBtnGroupage.classList.remove('active');
                
                // Masquer les sections spécifiques au groupage
                const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
                if (clientsSupplementairesDiv) clientsSupplementairesDiv.style.display = 'none';
                
                const btnAjouterClient = document.getElementById('ajouter-client');
                if (btnAjouterClient) btnAjouterClient.style.display = 'none';
                
                // Mettre à jour le texte d'information
                const modeInfo = document.getElementById('mode-info');
                if (modeInfo) modeInfo.innerHTML = '<i class="fas fa-info-circle"></i> Mode standard: un seul client, de point A à point B';
                
                // Mettre à jour les champs cachés
                const typeHidden = document.getElementById('type_demenagement');
                if (typeHidden) typeHidden.value = 'Standard';
                
                // Créer ou mettre à jour le champ est_groupage
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
            
            console.log("Boutons de mode de prestation réparés avec succès");
        }
    } catch (error) {
        console.error("Erreur lors de la réparation des boutons de mode de prestation:", error);
    }
    
    // 4. Correction des boutons de suppression existants
    try {
        console.log("Réparation des boutons de suppression existants");
        
        // Boutons de suppression des clients supplémentaires
        const btnsSupprimerClient = document.querySelectorAll('.supprimer-client');
        btnsSupprimerClient.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const clientDiv = this.closest('.client-supplementaire');
                if (clientDiv) {
                    clientDiv.remove();
                }
            });
        });
        
        // Boutons de suppression des étapes
        const btnsSupprimerEtape = document.querySelectorAll('.supprimer-etape');
        btnsSupprimerEtape.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const etapeDiv = this.closest('.etape-depart, .etape-arrivee');
                if (etapeDiv) {
                    etapeDiv.remove();
                }
            });
        });
        
        console.log("Boutons de suppression réparés avec succès");
    } catch (error) {
        console.error("Erreur lors de la réparation des boutons de suppression:", error);
    }
    
    console.log("Script de correction pour la page d'édition des prestations terminé");
});
