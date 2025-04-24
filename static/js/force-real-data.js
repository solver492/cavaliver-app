/**
 * Script pour forcer l'affichage des vraies données d'étapes et de transporteurs
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de forçage des vraies données chargé');
    
    // Fonction pour extraire les données de la page
    function extractRealData() {
        // Récupérer les données depuis le script JSON intégré
        const prestationDataScript = document.getElementById('prestation-data');
        if (prestationDataScript) {
            try {
                const prestationData = JSON.parse(prestationDataScript.textContent);
                console.log('Données de prestation extraites du JSON:', prestationData);
                
                const data = {
                    prestationId: prestationData.id,
                    etapesDepart: [],
                    etapesArrivee: []
                };
                
                // Traiter les étapes de départ
                if (prestationData.etapes_depart && prestationData.etapes_depart.trim()) {
                    data.etapesDepart = prestationData.etapes_depart.split('||').filter(e => e.trim());
                    console.log(`Étapes de départ trouvées dans le JSON: ${data.etapesDepart.length}`);
                    console.log('Étapes de départ:', data.etapesDepart);
                }
                
                // Traiter les étapes d'arrivée
                if (prestationData.etapes_arrivee && prestationData.etapes_arrivee.trim()) {
                    data.etapesArrivee = prestationData.etapes_arrivee.split('||').filter(e => e.trim());
                    console.log(`Étapes d'arrivée trouvées dans le JSON: ${data.etapesArrivee.length}`);
                    console.log('Étapes d\'arrivée:', data.etapesArrivee);
                }
                
                return data;
            } catch (error) {
                console.error('Erreur lors du parsing du JSON:', error);
            }
        }
        
        // Méthode de secours: récupérer les données depuis les attributs data-* ou les balises script
        console.log('Utilisation de la méthode de secours pour extraire les données');
        
        // Récupérer l'ID de la prestation depuis l'URL
        const prestationIdMatch = window.location.pathname.match(/\/prestations\/view\/(\d+)/);
        if (!prestationIdMatch) {
            console.error('ID de prestation non trouvé dans l\'URL');
            return null;
        }
        
        const prestationId = prestationIdMatch[1];
        console.log(`Extraction des données pour la prestation ID: ${prestationId}`);
        
        // Récupérer les données d'étapes depuis les attributs data-* ou les balises script
        const pageHTML = document.documentElement.innerHTML;
        const data = {
            prestationId: prestationId,
            etapesDepart: [],
            etapesArrivee: []
        };
        
        // Rechercher les étapes de départ
        const etapesDepartMatch = pageHTML.match(/etapes_depart\s*=\s*["']([^"']*)["']/);
        if (etapesDepartMatch && etapesDepartMatch[1]) {
            data.etapesDepart = etapesDepartMatch[1].split('||').filter(e => e.trim());
            console.log(`Étapes de départ trouvées: ${data.etapesDepart.length}`);
            console.log('Étapes de départ:', data.etapesDepart);
        }
        
        // Rechercher les étapes d'arrivée
        const etapesArriveeMatch = pageHTML.match(/etapes_arrivee\s*=\s*["']([^"']*)["']/);
        if (etapesArriveeMatch && etapesArriveeMatch[1]) {
            data.etapesArrivee = etapesArriveeMatch[1].split('||').filter(e => e.trim());
            console.log(`Étapes d'arrivée trouvées: ${data.etapesArrivee.length}`);
            console.log('Étapes d\'arrivée:', data.etapesArrivee);
        }
        
        return data;
    }
    
    // Fonction pour forcer l'affichage des étapes de départ
    function forceEtapesDepart(etapesDepart) {
        if (!etapesDepart || etapesDepart.length === 0) {
            console.log('Aucune étape de départ à afficher');
            return;
        }
        
        console.log(`Forçage de l'affichage de ${etapesDepart.length} étapes de départ`);
        
        // Trouver l'emplacement où insérer les étapes
        const adresseDepart = document.querySelector('.card.mb-3.border-success');
        if (!adresseDepart) {
            console.error('Carte de départ non trouvée');
            return;
        }
        
        // Vérifier si le conteneur d'étapes existe déjà
        let etapesContainer = document.querySelector('.etapes-container');
        if (etapesContainer) {
            console.log('Conteneur d\'étapes existant trouvé, suppression...');
            etapesContainer.remove();
        }
        
        // Créer le conteneur d'étapes
        etapesContainer = document.createElement('div');
        etapesContainer.className = 'etapes-container mb-3';
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
        console.log('Étapes de départ injectées avec succès');
    }
    
    // Fonction pour forcer l'affichage des étapes d'arrivée
    function forceEtapesArrivee(etapesArrivee) {
        if (!etapesArrivee || etapesArrivee.length === 0) {
            console.log('Aucune étape d\'arrivée à afficher');
            return;
        }
        
        console.log(`Forçage de l'affichage de ${etapesArrivee.length} étapes d'arrivée`);
        
        // Trouver l'emplacement où insérer les étapes
        const adresseArrivee = document.querySelector('.card.mb-3.border-danger');
        if (!adresseArrivee) {
            console.error('Carte d\'arrivée non trouvée');
            return;
        }
        
        // Vérifier si le conteneur d'étapes existe déjà
        const etapesContainers = document.querySelectorAll('.etapes-container');
        let etapesContainer = etapesContainers.length > 1 ? etapesContainers[1] : null;
        if (etapesContainer) {
            console.log('Conteneur d\'étapes d\'arrivée existant trouvé, suppression...');
            etapesContainer.remove();
        }
        
        // Créer le conteneur d'étapes
        etapesContainer = document.createElement('div');
        etapesContainer.className = 'etapes-container mb-3';
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
        console.log('Étapes d\'arrivée injectées avec succès');
    }
    
    // Fonction principale pour forcer l'affichage des données
    function forceDisplayRealData() {
        const data = extractRealData();
        if (!data) {
            console.error('Impossible d\'extraire les données réelles');
            return;
        }
        
        // Forcer l'affichage des étapes
        forceEtapesDepart(data.etapesDepart);
        forceEtapesArrivee(data.etapesArrivee);
    }
    
    // Exécuter la fonction principale après un court délai
    setTimeout(forceDisplayRealData, 500);
});
