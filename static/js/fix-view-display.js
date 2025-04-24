/**
 * Script pour corriger l'affichage des étapes et des transporteurs dans la vue détaillée des prestations
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de correction d\'affichage chargé');
    
    // Fonction pour extraire les données de la page
    function extractDataFromPage() {
        const pageHTML = document.documentElement.innerHTML;
        const data = {};
        
        // Extraire l'ID de la prestation
        const prestationIdMatch = window.location.pathname.match(/\/prestations\/view\/(\d+)/);
        if (prestationIdMatch) {
            data.prestationId = prestationIdMatch[1];
        }
        
        // Extraire les étapes de départ
        const etapesDepartMatch = pageHTML.match(/etapes_depart\s*=\s*["']([^"']*)["']/);
        if (etapesDepartMatch && etapesDepartMatch[1]) {
            data.etapesDepart = etapesDepartMatch[1].split('||').filter(e => e.trim());
        } else {
            // Essayer de trouver les étapes dans le HTML
            const adresseDepart = document.querySelector('.card.mb-3.border-success');
            if (adresseDepart) {
                const nextElement = adresseDepart.nextElementSibling;
                if (nextElement && nextElement.classList.contains('etapes-container')) {
                    const etapes = Array.from(nextElement.querySelectorAll('li span')).map(el => el.textContent);
                    if (etapes.length > 0) {
                        data.etapesDepart = etapes;
                    }
                }
            }
        }
        
        // Extraire les étapes d'arrivée
        const etapesArriveeMatch = pageHTML.match(/etapes_arrivee\s*=\s*["']([^"']*)["']/);
        if (etapesArriveeMatch && etapesArriveeMatch[1]) {
            data.etapesArrivee = etapesArriveeMatch[1].split('||').filter(e => e.trim());
        } else {
            // Essayer de trouver les étapes dans le HTML
            const adresseArrivee = document.querySelector('.card.mb-3.border-danger');
            if (adresseArrivee) {
                const nextElement = adresseArrivee.nextElementSibling;
                if (nextElement && nextElement.classList.contains('etapes-container')) {
                    const etapes = Array.from(nextElement.querySelectorAll('li span')).map(el => el.textContent);
                    if (etapes.length > 0) {
                        data.etapesArrivee = etapes;
                    }
                }
            }
        }
        
        // Extraire les transporteurs
        const transporteursSection = document.querySelector('.card-header:has(i.fa-truck)');
        if (transporteursSection) {
            const transporteursCards = document.querySelectorAll('.card-body .row .col-md-6');
            if (transporteursCards.length > 0) {
                data.transporteurs = Array.from(transporteursCards).map(card => {
                    const nom = card.querySelector('h6')?.textContent.trim();
                    const id = card.querySelector('p:has(i.fa-id-badge)')?.textContent.match(/ID:\s*(\d+)/)?.[1];
                    return { id, nom };
                });
            }
        }
        
        return data;
    }
    
    // Fonction pour forcer l'affichage des étapes
    function forceDisplayEtapes() {
        const data = extractDataFromPage();
        console.log('Données extraites:', data);
        
        // Forcer l'affichage des étapes de départ
        if (data.etapesDepart && data.etapesDepart.length > 0) {
            console.log(`Forçage de l'affichage de ${data.etapesDepart.length} étapes de départ`);
            
            // Vérifier si le conteneur d'étapes existe déjà
            let etapesDepartContainer = document.querySelector('.etapes-container');
            const adresseDepart = document.querySelector('.card.mb-3.border-success');
            
            if (!etapesDepartContainer && adresseDepart) {
                // Créer le conteneur d'étapes
                etapesDepartContainer = document.createElement('div');
                etapesDepartContainer.className = 'etapes-container mb-3';
                etapesDepartContainer.innerHTML = `
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-route"></i> Étapes intermédiaires (départ)
                                <span class="badge bg-light text-dark">${data.etapesDepart.length}</span>
                            </h6>
                        </div>
                        <div class="card-body p-0">
                            <ol class="list-group list-group-numbered mb-0">
                                ${data.etapesDepart.map(etape => `
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
                adresseDepart.after(etapesDepartContainer);
            }
        }
        
        // Forcer l'affichage des étapes d'arrivée
        if (data.etapesArrivee && data.etapesArrivee.length > 0) {
            console.log(`Forçage de l'affichage de ${data.etapesArrivee.length} étapes d'arrivée`);
            
            // Vérifier si le conteneur d'étapes existe déjà
            const etapesContainers = document.querySelectorAll('.etapes-container');
            let etapesArriveeContainer = etapesContainers.length > 1 ? etapesContainers[1] : null;
            const adresseArrivee = document.querySelector('.card.mb-3.border-danger');
            
            if (!etapesArriveeContainer && adresseArrivee) {
                // Créer le conteneur d'étapes
                etapesArriveeContainer = document.createElement('div');
                etapesArriveeContainer.className = 'etapes-container';
                etapesArriveeContainer.innerHTML = `
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-route"></i> Étapes intermédiaires (arrivée)
                                <span class="badge bg-light text-dark">${data.etapesArrivee.length}</span>
                            </h6>
                        </div>
                        <div class="card-body p-0">
                            <ol class="list-group list-group-numbered mb-0">
                                ${data.etapesArrivee.map(etape => `
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
                adresseArrivee.after(etapesArriveeContainer);
            }
        }
    }
    
    // Appliquer la correction après un court délai pour s'assurer que la page est complètement chargée
    setTimeout(forceDisplayEtapes, 500);
});
