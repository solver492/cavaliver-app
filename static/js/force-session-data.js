/**
 * Script pour forcer l'affichage des données d'étapes et de transporteurs depuis la session
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de forçage des données de session chargé');
    
    // Fonction pour récupérer les données de session via une requête AJAX
    function getSessionData() {
        fetch('/api/session-data')
            .then(response => response.json())
            .then(data => {
                console.log('Données de session récupérées:', data);
                if (data.success) {
                    displayEtapesDepart(data.etapes_depart);
                    displayEtapesArrivee(data.etapes_arrivee);
                    updateTransporteursDisplay(data.transporteurs);
                }
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des données de session:', error);
            });
    }
    
    // Fonction pour afficher les étapes de départ
    function displayEtapesDepart(etapes) {
        if (!etapes || etapes.length === 0) {
            console.log('Aucune étape de départ à afficher');
            return;
        }
        
        console.log(`Affichage de ${etapes.length} étapes de départ`);
        
        // Trouver l'emplacement où insérer les étapes
        const adresseDepart = document.querySelector('.card.mb-3.border-success');
        if (!adresseDepart) {
            console.error('Carte de départ non trouvée');
            return;
        }
        
        // Vérifier si le conteneur d'étapes existe déjà
        let etapesContainer = document.querySelector('.etapes-container');
        if (!etapesContainer) {
            // Créer le conteneur d'étapes
            etapesContainer = document.createElement('div');
            etapesContainer.className = 'etapes-container mb-3';
            
            // Créer le contenu HTML
            etapesContainer.innerHTML = `
                <div class="card border-info">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0">
                            <i class="fas fa-route"></i> Étapes intermédiaires (départ)
                            <span class="badge bg-light text-dark">${etapes.length}</span>
                        </h6>
                    </div>
                    <div class="card-body p-0">
                        <ol class="list-group list-group-numbered mb-0">
                            ${etapes.map(etape => `
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
            console.log('Étapes de départ injectées avec succès');
        } else {
            // Mettre à jour le conteneur existant
            const olElement = etapesContainer.querySelector('ol.list-group');
            if (olElement) {
                olElement.innerHTML = etapes.map(etape => `
                    <li class="list-group-item d-flex align-items-center">
                        <i class="fas fa-map-pin me-2 text-info"></i>
                        <span>${etape}</span>
                    </li>
                `).join('');
                
                // Mettre à jour le compteur
                const badge = etapesContainer.querySelector('.badge');
                if (badge) {
                    badge.textContent = etapes.length;
                }
                
                console.log('Étapes de départ mises à jour avec succès');
            }
        }
    }
    
    // Fonction pour afficher les étapes d'arrivée
    function displayEtapesArrivee(etapes) {
        if (!etapes || etapes.length === 0) {
            console.log('Aucune étape d\'arrivée à afficher');
            return;
        }
        
        console.log(`Affichage de ${etapes.length} étapes d'arrivée`);
        
        // Trouver l'emplacement où insérer les étapes
        const adresseArrivee = document.querySelector('.card.mb-3.border-danger');
        if (!adresseArrivee) {
            console.error('Carte d\'arrivée non trouvée');
            return;
        }
        
        // Vérifier si le conteneur d'étapes existe déjà
        const etapesContainers = document.querySelectorAll('.etapes-container');
        let etapesContainer = etapesContainers.length > 1 ? etapesContainers[1] : null;
        
        if (!etapesContainer) {
            // Créer le conteneur d'étapes
            etapesContainer = document.createElement('div');
            etapesContainer.className = 'etapes-container mb-3';
            
            // Créer le contenu HTML
            etapesContainer.innerHTML = `
                <div class="card border-info">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0">
                            <i class="fas fa-route"></i> Étapes intermédiaires (arrivée)
                            <span class="badge bg-light text-dark">${etapes.length}</span>
                        </h6>
                    </div>
                    <div class="card-body p-0">
                        <ol class="list-group list-group-numbered mb-0">
                            ${etapes.map(etape => `
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
            console.log('Étapes d\'arrivée injectées avec succès');
        } else {
            // Mettre à jour le conteneur existant
            const olElement = etapesContainer.querySelector('ol.list-group');
            if (olElement) {
                olElement.innerHTML = etapes.map(etape => `
                    <li class="list-group-item d-flex align-items-center">
                        <i class="fas fa-map-pin me-2 text-info"></i>
                        <span>${etape}</span>
                    </li>
                `).join('');
                
                // Mettre à jour le compteur
                const badge = etapesContainer.querySelector('.badge');
                if (badge) {
                    badge.textContent = etapes.length;
                }
                
                console.log('Étapes d\'arrivée mises à jour avec succès');
            }
        }
    }
    
    // Fonction pour mettre à jour l'affichage des transporteurs
    function updateTransporteursDisplay(transporteurs) {
        if (!transporteurs || transporteurs.length === 0) {
            console.log('Aucun transporteur à afficher');
            // Afficher le message "Aucun transporteur"
            const transporteursSection = document.querySelector('.card-header:has(i.fa-truck)');
            if (transporteursSection) {
                const cardBody = transporteursSection.nextElementSibling;
                if (cardBody) {
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
            return;
        }
        
        console.log(`Mise à jour de l'affichage pour ${transporteurs.length} transporteurs`);
        
        // Cette fonction sera implémentée ultérieurement si nécessaire
        // car elle nécessite de récupérer les détails des transporteurs
    }
    
    // Appeler la fonction pour récupérer les données de session
    setTimeout(getSessionData, 500);
});
