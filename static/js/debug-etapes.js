/**
 * Script de débogage spécifique pour les étapes de prestation
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de débogage des étapes chargé');
    
    // Fonction pour vérifier le contenu d'un élément
    function verifierElement(selector, description) {
        const elements = Array.from(document.querySelectorAll(selector));
        const element = elements.find(el => el.textContent.includes(description));
        
        if (element) {
            console.log(`${description} trouvé`);
            console.log(`Contenu HTML: ${element.innerHTML}`);
            console.log(`Contenu texte: ${element.textContent.trim()}`);
            return true;
        } else {
            console.log(`${description} NON trouvé`);
            return false;
        }
    }
    
    // Vérifier si nous sommes sur la page de détail d'une prestation
    if (window.location.pathname.match(/\/prestations\/view\/\d+/)) {
        console.log('Page de détail de prestation détectée');
        
        // Vérifier les étapes de départ
        console.log('--- ÉTAPES DE DÉPART ---');
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
            
            // Vérifier si la condition d'affichage est satisfaite
            const prestationElement = document.querySelector('body');
            if (prestationElement) {
                console.log('Recherche de données de prestation dans le code source...');
                const pageSource = document.documentElement.outerHTML;
                
                // Rechercher des indices sur les étapes dans le code source
                const etapesDepartMatch = pageSource.match(/etapes_depart[^<>]*?:\s*([^<>]*)/);
                if (etapesDepartMatch) {
                    console.log(`Trouvé dans le code source: ${etapesDepartMatch[0]}`);
                }
                
                const etapesArriveeMatch = pageSource.match(/etapes_arrivee[^<>]*?:\s*([^<>]*)/);
                if (etapesArriveeMatch) {
                    console.log(`Trouvé dans le code source: ${etapesArriveeMatch[0]}`);
                }
            }
        }
        
        // Vérifier les étapes d'arrivée
        console.log('--- ÉTAPES D\'ARRIVÉE ---');
        const etapesArriveeContainer = document.querySelectorAll('.etapes-container')[1];
        if (etapesArriveeContainer) {
            console.log('Conteneur d\'étapes d\'arrivée trouvé');
            const etapesItems = etapesArriveeContainer.querySelectorAll('li');
            console.log(`Nombre d'étapes d'arrivée affichées: ${etapesItems.length}`);
            etapesItems.forEach((item, index) => {
                console.log(`Étape ${index + 1}: ${item.textContent.trim()}`);
            });
        } else {
            console.log('Aucun conteneur d\'étapes d\'arrivée trouvé');
        }
        
        // Vérifier les éléments clés de la page
        verifierElement('.card-header', 'Point de départ');
        verifierElement('.card-header', 'Point d\'arrivée');
        verifierElement('.card-header', 'Étapes intermédiaires (départ)');
        verifierElement('.card-header', 'Étapes intermédiaires (arrivée)');
    }
});
