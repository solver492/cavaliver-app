/**
 * Script pour garantir l'affichage correct des étapes et des transporteurs
 * Ce script utilise les données JSON exposées dans la page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script ensure-display chargé');
    
    // Récupérer les données JSON
    const prestationDataElement = document.getElementById('prestation-data');
    if (!prestationDataElement) {
        console.error('Élément prestation-data non trouvé');
        return;
    }
    
    try {
        const prestationData = JSON.parse(prestationDataElement.textContent);
        console.log('Données prestation chargées:', prestationData);
        
        // Vérifier si les étapes de départ sont affichées correctement
        ensureEtapesDepartDisplay(prestationData.etapes_depart);
        
        // Vérifier si les étapes d'arrivée sont affichées correctement
        ensureEtapesArriveeDisplay(prestationData.etapes_arrivee);
        
        // Vérifier si les transporteurs sont affichés correctement
        ensureTransporteursDisplay(prestationData.debug_data.transporteurs);
        
    } catch (error) {
        console.error('Erreur lors du parsing des données JSON:', error);
    }
    
    /**
     * Vérifie et garantit l'affichage des étapes de départ
     */
    function ensureEtapesDepartDisplay(etapesDepart) {
        if (!etapesDepart || etapesDepart.length === 0) {
            console.log('Aucune étape de départ à afficher');
            return;
        }
        
        console.log(`Vérification de l'affichage de ${etapesDepart.length} étapes de départ`);
        
        // Vérifier si les étapes sont déjà affichées
        const etapesContainer = document.querySelector('.etapes-container');
        if (!etapesContainer) {
            console.log('Conteneur d\'étapes non trouvé, création...');
            createEtapesDepartDisplay(etapesDepart);
        } else {
            // Vérifier si le nombre d'étapes affichées correspond
            const etapesItems = etapesContainer.querySelectorAll('li');
            if (etapesItems.length !== etapesDepart.length) {
                console.log(`Nombre d'étapes incorrect (${etapesItems.length} vs ${etapesDepart.length}), mise à jour...`);
                updateEtapesDepartDisplay(etapesContainer, etapesDepart);
            } else {
                console.log('Nombre d\'étapes de départ correct');
            }
        }
    }
    
    /**
     * Vérifie et garantit l'affichage des étapes d'arrivée
     */
    function ensureEtapesArriveeDisplay(etapesArrivee) {
        if (!etapesArrivee || etapesArrivee.length === 0) {
            console.log('Aucune étape d\'arrivée à afficher');
            return;
        }
        
        console.log(`Vérification de l'affichage de ${etapesArrivee.length} étapes d'arrivée`);
        
        // Vérifier si les étapes sont déjà affichées
        const etapesContainers = document.querySelectorAll('.etapes-container');
        const etapesContainer = etapesContainers.length > 1 ? etapesContainers[1] : null;
        
        if (!etapesContainer) {
            console.log('Conteneur d\'étapes d\'arrivée non trouvé, création...');
            createEtapesArriveeDisplay(etapesArrivee);
        } else {
            // Vérifier si le nombre d'étapes affichées correspond
            const etapesItems = etapesContainer.querySelectorAll('li');
            if (etapesItems.length !== etapesArrivee.length) {
                console.log(`Nombre d'étapes d'arrivée incorrect (${etapesItems.length} vs ${etapesArrivee.length}), mise à jour...`);
                updateEtapesArriveeDisplay(etapesContainer, etapesArrivee);
            } else {
                console.log('Nombre d\'étapes d\'arrivée correct');
            }
        }
    }
    
    /**
     * Vérifie et garantit l'affichage des transporteurs
     */
    function ensureTransporteursDisplay(transporteurs) {
        if (!transporteurs || transporteurs.length === 0) {
            console.log('Aucun transporteur à afficher');
            
            // Vérifier si le message "Aucun transporteur" est affiché
            const transporteursSection = document.querySelector('.card-header:has(i.fa-truck)');
            if (transporteursSection) {
                const cardBody = transporteursSection.nextElementSibling;
                if (cardBody) {
                    const alertElement = cardBody.querySelector('.alert-warning');
                    if (!alertElement) {
                        console.log('Message "Aucun transporteur" non trouvé, création...');
                        cardBody.innerHTML = `
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle"></i> Aucun transporteur n'a encore été assigné à cette prestation.
                            </div>
                            <button class="btn btn-primary">
                                <i class="fas fa-plus-circle"></i> Assigner des transporteurs
                            </button>
                        `;
                    }
                }
            }
            return;
        }
        
        console.log(`Vérification de l'affichage de ${transporteurs.length} transporteurs`);
        
        // Vérifier si les transporteurs sont déjà affichés
        const transporteursSection = document.querySelector('.card-header:has(i.fa-truck)');
        if (transporteursSection) {
            const cardBody = transporteursSection.nextElementSibling;
            if (cardBody) {
                const transporteursItems = cardBody.querySelectorAll('.col-md-6');
                if (transporteursItems.length !== transporteurs.length) {
                    console.log(`Nombre de transporteurs incorrect (${transporteursItems.length} vs ${transporteurs.length}), mise à jour...`);
                    // La mise à jour des transporteurs nécessite des données supplémentaires
                    // que nous n'avons pas, donc nous ne pouvons pas la faire ici
                }
            }
        }
    }
    
    /**
     * Crée l'affichage des étapes de départ
     */
    function createEtapesDepartDisplay(etapesDepart) {
        // Trouver l'emplacement où insérer les étapes
        const adresseDepart = document.querySelector('.card.mb-3.border-success');
        if (!adresseDepart) {
            console.error('Carte de départ non trouvée');
            return;
        }
        
        // Créer le conteneur d'étapes
        const etapesContainer = document.createElement('div');
        etapesContainer.className = 'etapes-container mb-3';
        
        // Créer le contenu HTML
        etapesContainer.innerHTML = `
            <div class="card border-info">
                <div class="card-header bg-info text-white">
                    <h6 class="mb-0">
                        <i class="fas fa-route"></i> Étapes intermédiaires (départ)
                        <span class="badge bg-light text-dark">${etapesDepart.length}</span>
                    </h6>
                </div>
                <div class="card-body p-0">
                    <ol class="list-group list-group-numbered mb-0">
                        ${etapesDepart.map(etape => `
                            <li class="list-group-item d-flex align-items-center">
                                <i class="fas fa-map-pin me-2 text-info"></i>
                                <span>${etape}</span>
                            </li>
                        `).join('')}
                    </ol>
                </div>
            </div>
        `;
        
        // Insérer le conteneur après l'adresse de départ
        adresseDepart.after(etapesContainer);
        console.log('Étapes de départ créées avec succès');
    }
    
    /**
     * Met à jour l'affichage des étapes de départ
     */
    function updateEtapesDepartDisplay(container, etapesDepart) {
        const olElement = container.querySelector('ol.list-group');
        if (olElement) {
            olElement.innerHTML = etapesDepart.map(etape => `
                <li class="list-group-item d-flex align-items-center">
                    <i class="fas fa-map-pin me-2 text-info"></i>
                    <span>${etape}</span>
                </li>
            `).join('');
            
            // Mettre à jour le compteur
            const badge = container.querySelector('.badge');
            if (badge) {
                badge.textContent = etapesDepart.length;
            }
            
            console.log('Étapes de départ mises à jour avec succès');
        }
    }
    
    /**
     * Crée l'affichage des étapes d'arrivée
     */
    function createEtapesArriveeDisplay(etapesArrivee) {
        // Trouver l'emplacement où insérer les étapes
        const adresseArrivee = document.querySelector('.card.mb-3.border-danger');
        if (!adresseArrivee) {
            console.error('Carte d\'arrivée non trouvée');
            return;
        }
        
        // Créer le conteneur d'étapes
        const etapesContainer = document.createElement('div');
        etapesContainer.className = 'etapes-container mb-3';
        
        // Créer le contenu HTML
        etapesContainer.innerHTML = `
            <div class="card border-info">
                <div class="card-header bg-info text-white">
                    <h6 class="mb-0">
                        <i class="fas fa-route"></i> Étapes intermédiaires (arrivée)
                        <span class="badge bg-light text-dark">${etapesArrivee.length}</span>
                    </h6>
                </div>
                <div class="card-body p-0">
                    <ol class="list-group list-group-numbered mb-0">
                        ${etapesArrivee.map(etape => `
                            <li class="list-group-item d-flex align-items-center">
                                <i class="fas fa-map-pin me-2 text-info"></i>
                                <span>${etape}</span>
                            </li>
                        `).join('')}
                    </ol>
                </div>
            </div>
        `;
        
        // Insérer le conteneur après l'adresse d'arrivée
        adresseArrivee.after(etapesContainer);
        console.log('Étapes d\'arrivée créées avec succès');
    }
    
    /**
     * Met à jour l'affichage des étapes d'arrivée
     */
    function updateEtapesArriveeDisplay(container, etapesArrivee) {
        const olElement = container.querySelector('ol.list-group');
        if (olElement) {
            olElement.innerHTML = etapesArrivee.map(etape => `
                <li class="list-group-item d-flex align-items-center">
                    <i class="fas fa-map-pin me-2 text-info"></i>
                    <span>${etape}</span>
                </li>
            `).join('');
            
            // Mettre à jour le compteur
            const badge = container.querySelector('.badge');
            if (badge) {
                badge.textContent = etapesArrivee.length;
            }
            
            console.log('Étapes d\'arrivée mises à jour avec succès');
        }
    }
});
