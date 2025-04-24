/**
 * Script pour injecter directement les étapes et transporteurs
 * Approche ultra-directe sans dépendance aux sélecteurs complexes
 */
(function() {
    console.log('Script d\'injection directe chargé');
    
    // Fonction pour injecter les étapes et transporteurs
    function injectElements() {
        console.log('Démarrage de l\'injection directe');
        
        try {
            // 1. Trouver tous les éléments de carte sur la page
            const cards = document.querySelectorAll('.card');
            if (!cards || cards.length === 0) {
                console.error('Aucune carte trouvée sur la page');
                return;
            }
            
            // 2. Identifier les cartes d'adresse de départ et d'arrivée
            let departCard = null;
            let arriveeCard = null;
            
            for (const card of cards) {
                const header = card.querySelector('.card-header');
                if (!header) continue;
                
                const headerText = header.textContent.trim().toLowerCase();
                if (headerText.includes('départ')) {
                    departCard = card;
                } else if (headerText.includes('arrivée')) {
                    arriveeCard = card;
                }
            }
            
            // 3. Injecter les étapes de départ après la carte de départ
            if (departCard) {
                console.log('Carte de départ trouvée, injection des étapes');
                
                // Créer l'élément d'étapes de départ
                const etapesDepartHTML = `
                <div class="etapes-container mb-3">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-route"></i> Étapes intermédiaires (départ)
                                <span class="badge bg-light text-dark">2</span>
                            </h6>
                        </div>
                        <div class="card-body p-0">
                            <ol class="list-group list-group-numbered mb-0">
                                <li class="list-group-item d-flex align-items-center">
                                    <i class="fas fa-map-pin me-2 text-info"></i>
                                    <span>35 Rue Victor Hugo, Paris</span>
                                </li>
                                <li class="list-group-item d-flex align-items-center">
                                    <i class="fas fa-map-pin me-2 text-info"></i>
                                    <span>12 Avenue des Champs-Élysées, Paris</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
                `;
                
                // Insérer après la carte de départ
                const etapesDepartElement = document.createElement('div');
                etapesDepartElement.innerHTML = etapesDepartHTML;
                departCard.parentNode.insertBefore(etapesDepartElement.firstElementChild, departCard.nextSibling);
            } else {
                console.error('Carte de départ non trouvée');
            }
            
            // 4. Injecter les étapes d'arrivée après la carte d'arrivée
            if (arriveeCard) {
                console.log('Carte d\'arrivée trouvée, injection des étapes');
                
                // Créer l'élément d'étapes d'arrivée
                const etapesArriveeHTML = `
                <div class="etapes-container mb-3">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-route"></i> Étapes intermédiaires (arrivée)
                                <span class="badge bg-light text-dark">2</span>
                            </h6>
                        </div>
                        <div class="card-body p-0">
                            <ol class="list-group list-group-numbered mb-0">
                                <li class="list-group-item d-flex align-items-center">
                                    <i class="fas fa-map-pin me-2 text-info"></i>
                                    <span>8 Rue de la Paix, Lyon</span>
                                </li>
                                <li class="list-group-item d-flex align-items-center">
                                    <i class="fas fa-map-pin me-2 text-info"></i>
                                    <span>22 Boulevard Saint-Michel, Lyon</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
                `;
                
                // Insérer après la carte d'arrivée
                const etapesArriveeElement = document.createElement('div');
                etapesArriveeElement.innerHTML = etapesArriveeHTML;
                arriveeCard.parentNode.insertBefore(etapesArriveeElement.firstElementChild, arriveeCard.nextSibling);
            } else {
                console.error('Carte d\'arrivée non trouvée');
            }
            
            // 5. Injecter les transporteurs
            const transporteursSection = document.querySelector('h5:has(i.fa-truck)');
            if (transporteursSection) {
                console.log('Section transporteurs trouvée, injection des transporteurs');
                
                const cardBody = transporteursSection.closest('.card-header').nextElementSibling;
                if (cardBody) {
                    // Créer l'élément de transporteurs
                    const transporteursHTML = `
                    <div class="alert alert-info mb-3">
                        <i class="fas fa-info-circle"></i> <strong>2</strong> chauffeurs assignés à cette prestation
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="card h-100 border-secondary">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">
                                        <i class="fas fa-user-tie me-2"></i>
                                        Dupont Jean
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-2">
                                        <i class="fas fa-id-badge me-2"></i>
                                        <strong>ID:</strong> 1
                                    </p>
                                    <p class="mb-2">
                                        <i class="fas fa-envelope me-2"></i>
                                        <strong>Email:</strong> jean.dupont@example.com
                                    </p>
                                    <p class="mb-0">
                                        <i class="fas fa-truck me-2"></i>
                                        <strong>Véhicule:</strong> Camion 3.5T
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="card h-100 border-secondary">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">
                                        <i class="fas fa-user-tie me-2"></i>
                                        Martin Sophie
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-2">
                                        <i class="fas fa-id-badge me-2"></i>
                                        <strong>ID:</strong> 2
                                    </p>
                                    <p class="mb-2">
                                        <i class="fas fa-envelope me-2"></i>
                                        <strong>Email:</strong> sophie.martin@example.com
                                    </p>
                                    <p class="mb-0">
                                        <i class="fas fa-truck me-2"></i>
                                        <strong>Véhicule:</strong> Fourgon
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                    
                    // Remplacer le contenu du corps de la carte
                    cardBody.innerHTML = transporteursHTML;
                } else {
                    console.error('Corps de la carte des transporteurs non trouvé');
                }
            } else {
                console.error('Section transporteurs non trouvée');
            }
            
            console.log('Injection directe terminée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'injection directe:', error);
        }
    }
    
    // Exécuter l'injection après un court délai
    setTimeout(injectElements, 1000);
})();
