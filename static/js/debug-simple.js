/**
 * Script de débogage simple pour les prestations
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de débogage simple chargé');
    
    // Récupérer les données de la prestation depuis les attributs data
    const prestationData = document.querySelector('body');
    if (prestationData) {
        // Afficher toutes les balises h6 pour identifier les sections
        const headers = document.querySelectorAll('h6');
        console.log('Sections trouvées:');
        headers.forEach((header, index) => {
            console.log(`  Section ${index + 1}: ${header.textContent.trim()}`);
        });
        
        // Vérifier les conteneurs d'étapes
        const etapesContainers = document.querySelectorAll('.etapes-container');
        console.log(`Nombre de conteneurs d'étapes trouvés: ${etapesContainers.length}`);
        
        // Vérifier si les étapes sont présentes dans le HTML mais cachées
        const pageHTML = document.documentElement.innerHTML;
        const etapesDepartMatch = pageHTML.match(/etapes_depart\s*=\s*\[(.*?)\]/);
        if (etapesDepartMatch) {
            console.log(`Étapes de départ trouvées dans le HTML: ${etapesDepartMatch[1]}`);
        }
        
        const etapesArriveeMatch = pageHTML.match(/etapes_arrivee\s*=\s*\[(.*?)\]/);
        if (etapesArriveeMatch) {
            console.log(`Étapes d'arrivée trouvées dans le HTML: ${etapesArriveeMatch[1]}`);
        }
    }
});
