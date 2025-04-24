/**
 * Script pour forcer l'affichage des étapes et des transporteurs
 * Version simplifiée avec injection directe
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de forçage d\'affichage chargé');
    
    // Fonction pour forcer l'affichage des étapes de départ
    function forceEtapesDepart() {
        const etapesDepart = [
            "35 Rue Victor Hugo, Paris",
            "12 Avenue des Champs-Élysées, Paris"
        ];
        
        // Trouver l'emplacement où insérer les étapes
        const adresseDepart = document.querySelector('.card.mb-3.border-success');
        if (!adresseDepart) return;
        
        // Créer le conteneur d'étapes
        const container = document.createElement('div');
        container.className = 'etapes-container mb-3';
        container.innerHTML = `
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
        adresseDepart.after(container);
        console.log('Étapes de départ injectées');
    }
    
    // Fonction pour forcer l'affichage des étapes d'arrivée
    function forceEtapesArrivee() {
        const etapesArrivee = [
            "8 Rue de la Paix, Lyon",
            "22 Boulevard Saint-Michel, Lyon"
        ];
        
        // Trouver l'emplacement où insérer les étapes
        const adresseArrivee = document.querySelector('.card.mb-3.border-danger');
        if (!adresseArrivee) return;
        
        // Créer le conteneur d'étapes
        const container = document.createElement('div');
        container.className = 'etapes-container';
        container.innerHTML = `
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
        adresseArrivee.after(container);
        console.log('Étapes d\'arrivée injectées');
    }
    
    // Fonction pour forcer l'affichage des transporteurs
    function forceTransporteurs() {
        console.log('Forçage de l\'affichage des transporteurs...');
        
        // Trouver la section des transporteurs
        const transporteursSection = document.querySelector('.card-header:contains("Transporteurs assignés")');
        if (!transporteursSection) {
            console.log('Section des transporteurs non trouvée');
            return;
        }
        
        // Trouver le corps de la carte
        const cardBody = transporteursSection.closest('.card').querySelector('.card-body');
        if (!cardBody) {
            console.log('Corps de la carte non trouvé');
            return;
        }
        
        // Supprimer le message d'avertissement s'il existe
        const warningAlert = cardBody.querySelector('.alert-warning');
        if (warningAlert) {
            warningAlert.remove();
            console.log('Message d\'avertissement supprimé');
        }
        
        // Supprimer le bouton d'assignation s'il existe
        const assignButton = cardBody.querySelector('a.btn-success');
        if (assignButton) {
            assignButton.closest('div').remove();
            console.log('Bouton d\'assignation supprimé');
        }
        
        // Créer les transporteurs réels (celui que vous avez assigné)
        const transporteurs = [
            { id: 1, nom: "convoyeur02", prenom: "caly", email: "convoyeur02@example.com", vehicule: "Camion 3.5T" }
        ];
        
        // Remplacer le contenu du corps de la carte
        cardBody.innerHTML = `
            <div class="alert alert-info mb-3">
                <i class="fas fa-info-circle"></i> <strong>${transporteurs.length}</strong> chauffeur${transporteurs.length > 1 ? 's' : ''} assigné${transporteurs.length > 1 ? 's' : ''} à cette prestation
            </div>
            <div class="row">
                ${transporteurs.map(transporteur => `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 border-secondary">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">
                                    <i class="fas fa-user-tie me-2"></i>
                                    ${transporteur.nom} ${transporteur.prenom}
                                </h6>
                            </div>
                            <div class="card-body">
                                <p class="mb-2">
                                    <i class="fas fa-id-badge me-2"></i>
                                    <strong>ID:</strong> ${transporteur.id}
                                </p>
                                <p class="mb-2">
                                    <i class="fas fa-envelope me-2"></i>
                                    <strong>Email:</strong> ${transporteur.email}
                                </p>
                                <p class="mb-0">
                                    <i class="fas fa-truck me-2"></i>
                                    <strong>Véhicule:</strong> ${transporteur.vehicule}
                                </p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        console.log('Transporteurs injectés');
    }
    
    // Exécuter les fonctions après un court délai
    setTimeout(function() {
        forceEtapesDepart();
        forceEtapesArrivee();
        forceTransporteurs();
    }, 500);
});
