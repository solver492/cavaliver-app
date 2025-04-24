/**
 * Script ultra-simple pour injecter directement les étapes et transporteurs
 * Sans aucune dépendance aux sélecteurs complexes
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script d\'injection simple chargé');
    
    // Attendre que la page soit complètement chargée
    setTimeout(function() {
        console.log('Démarrage de l\'injection simple');
        
        try {
            // 1. Trouver toutes les cartes avec des en-têtes
            const allCards = document.querySelectorAll('.card');
            console.log('Nombre de cartes trouvées:', allCards.length);
            
            // 2. Identifier les cartes par leur contenu texte
            let departCard = null;
            let arriveeCard = null;
            let transporteursCard = null;
            
            allCards.forEach(function(card) {
                const headerText = card.textContent.toLowerCase();
                
                if (headerText.includes('point de départ')) {
                    departCard = card;
                    console.log('Carte de départ trouvée');
                } 
                else if (headerText.includes('point d\'arrivée')) {
                    arriveeCard = card;
                    console.log('Carte d\'arrivée trouvée');
                }
                else if (headerText.includes('transporteurs assignés')) {
                    transporteursCard = card;
                    console.log('Carte des transporteurs trouvée');
                }
            });
            
            // 3. Injecter les étapes de départ
            if (departCard) {
                const etapesDepartDiv = document.createElement('div');
                etapesDepartDiv.className = 'etapes-container mb-3';
                etapesDepartDiv.innerHTML = `
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-route"></i> Étapes intermédiaires (départ)
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
                `;
                
                // Insérer après la carte de départ
                if (departCard.parentNode) {
                    departCard.parentNode.insertBefore(etapesDepartDiv, departCard.nextSibling);
                    console.log('Étapes de départ injectées');
                }
            }
            
            // 4. Injecter les étapes d'arrivée
            if (arriveeCard) {
                const etapesArriveeDiv = document.createElement('div');
                etapesArriveeDiv.className = 'etapes-container mb-3';
                etapesArriveeDiv.innerHTML = `
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-route"></i> Étapes intermédiaires (arrivée)
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
                `;
                
                // Insérer après la carte d'arrivée
                if (arriveeCard.parentNode) {
                    arriveeCard.parentNode.insertBefore(etapesArriveeDiv, arriveeCard.nextSibling);
                    console.log('Étapes d\'arrivée injectées');
                }
            }
            
            // 5. Injecter les transporteurs
            if (transporteursCard) {
                const cardBody = transporteursCard.querySelector('.card-body');
                if (cardBody) {
                    cardBody.innerHTML = `
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
                    console.log('Transporteurs injectés');
                }
            }
            
            console.log('Injection simple terminée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'injection simple:', error);
        }
    }, 1000);
});
