/**
 * Script de débogage pour la vue détaillée des prestations
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de débogage de la vue détaillée chargé');
    
    // Vérifier les étapes de départ
    const etapesDepartContainer = document.querySelector('.etapes-container');
    if (etapesDepartContainer) {
        console.log('Conteneur d\'étapes de départ trouvé');
        const etapesItems = etapesDepartContainer.querySelectorAll('li');
        console.log(`Nombre d'étapes de départ affichées: ${etapesItems.length}`);
        etapesItems.forEach((item, index) => {
            console.log(`Étape ${index + 1}: ${item.textContent.trim()}`);
        });
    } else {
        console.log('Aucun conteneur d\'étapes de départ trouvé');
    }
    
    // Vérifier les transporteurs
    const transporteursHeaders = Array.from(document.querySelectorAll('.card-header'));
    const transporteursHeader = transporteursHeaders.find(header => header.textContent.includes('Transporteurs assignés'));
    
    if (transporteursHeader) {
        const badge = transporteursHeader.querySelector('.badge');
        if (badge) {
            console.log(`Nombre de transporteurs selon le badge: ${badge.textContent.trim()}`);
        }
        
        const transporteurCards = document.querySelectorAll('.card-body .row .col-md-6');
        console.log(`Nombre de transporteurs affichés: ${transporteurCards.length}`);
        transporteurCards.forEach((card, index) => {
            const nom = card.querySelector('h6')?.textContent.trim();
            console.log(`Transporteur ${index + 1}: ${nom}`);
        });
    } else {
        console.log('Section des transporteurs non trouvée');
    }
    
    // Vérifier les clients (mode groupage)
    const clientsHeaders = Array.from(document.querySelectorAll('.card-header'));
    const clientsHeader = clientsHeaders.find(header => header.textContent.includes('Clients'));
    
    if (clientsHeader) {
        const badge = clientsHeader.querySelector('.badge');
        if (badge) {
            console.log(`Nombre de clients selon le badge: ${badge.textContent.trim()}`);
        }
        
        const clientItems = document.querySelectorAll('.list-group-item');
        console.log(`Nombre de clients affichés: ${clientItems.length}`);
        clientItems.forEach((item, index) => {
            const nom = item.querySelector('strong')?.textContent.trim();
            console.log(`Client ${index + 1}: ${nom}`);
        });
    } else {
        console.log('Section des clients non trouvée');
    }
});
