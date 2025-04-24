/**
 * Script de débogage pour vérifier les données d'étapes dans la prestation
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de débogage des étapes chargé');
    
    // Fonction pour extraire l'ID de la prestation de l'URL
    function getPrestationId() {
        const match = window.location.pathname.match(/\/prestations\/view\/(\d+)/);
        return match ? match[1] : null;
    }
    
    // Fonction pour déboguer les étapes
    function debugEtapes() {
        const prestationId = getPrestationId();
        if (!prestationId) {
            console.error('ID de prestation non trouvé dans l\'URL');
            return;
        }
        
        console.log(`Débogage des étapes pour la prestation ID: ${prestationId}`);
        
        // Rechercher les données d'étapes dans le HTML
        const pageHTML = document.documentElement.innerHTML;
        
        // Rechercher les étapes de départ
        const etapesDepartMatch = pageHTML.match(/etapes_depart\s*=\s*["']([^"']*)["']/);
        if (etapesDepartMatch && etapesDepartMatch[1]) {
            const etapesDepart = etapesDepartMatch[1].split('||').filter(e => e.trim());
            console.log(`Étapes de départ trouvées dans le HTML: ${etapesDepart.length}`);
            console.log('Étapes de départ:', etapesDepart);
        } else {
            console.log('Aucune étape de départ trouvée dans le HTML');
        }
        
        // Rechercher les étapes d'arrivée
        const etapesArriveeMatch = pageHTML.match(/etapes_arrivee\s*=\s*["']([^"']*)["']/);
        if (etapesArriveeMatch && etapesArriveeMatch[1]) {
            const etapesArrivee = etapesArriveeMatch[1].split('||').filter(e => e.trim());
            console.log(`Étapes d'arrivée trouvées dans le HTML: ${etapesArrivee.length}`);
            console.log('Étapes d\'arrivée:', etapesArrivee);
        } else {
            console.log('Aucune étape d\'arrivée trouvée dans le HTML');
        }
        
        // Vérifier si les conteneurs d'étapes existent
        const etapesDepartContainer = document.querySelector('.etapes-container');
        if (etapesDepartContainer) {
            const etapesDepartItems = etapesDepartContainer.querySelectorAll('li');
            console.log(`Nombre d'étapes de départ affichées: ${etapesDepartItems.length}`);
            if (etapesDepartItems.length > 0) {
                console.log('Contenu des étapes de départ affichées:');
                etapesDepartItems.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.textContent.trim()}`);
                });
            }
        } else {
            console.log('Conteneur d\'étapes de départ non trouvé dans le DOM');
        }
        
        // Vérifier les transporteurs
        const transporteursSection = document.querySelector('.card-header:has(i.fa-truck)');
        if (transporteursSection) {
            const transporteursItems = document.querySelectorAll('.card-body .row .col-md-6');
            console.log(`Nombre de transporteurs affichés: ${transporteursItems.length}`);
            if (transporteursItems.length > 0) {
                console.log('Transporteurs affichés:');
                transporteursItems.forEach((item, index) => {
                    const nom = item.querySelector('h6')?.textContent.trim();
                    console.log(`  ${index + 1}. ${nom}`);
                });
            }
        } else {
            console.log('Section des transporteurs non trouvée dans le DOM');
        }
    }
    
    // Exécuter le débogage après un court délai
    setTimeout(debugEtapes, 1000);
});
