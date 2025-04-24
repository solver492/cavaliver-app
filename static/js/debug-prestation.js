/**
 * Script de débogage pour les prestations
 * Ce script aide à identifier les problèmes avec les étapes supplémentaires et les clients en mode groupage
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de débogage des prestations chargé');
    
    // Vérifier si nous sommes sur la page de détail d'une prestation
    const prestationId = window.location.pathname.match(/\/prestations\/view\/(\d+)/);
    if (prestationId) {
        console.log(`Page de détail de la prestation #${prestationId[1]}`);
        
        // Vérifier les étapes de départ
        const etapesDepartContainer = document.querySelector('.etapes-container:nth-of-type(1)');
        if (etapesDepartContainer) {
            const etapesDepart = etapesDepartContainer.querySelectorAll('li');
            console.log(`Étapes de départ affichées: ${etapesDepart.length}`);
            etapesDepart.forEach((etape, index) => {
                console.log(`  Étape ${index + 1}: ${etape.textContent.trim()}`);
            });
        } else {
            console.log('Aucune étape de départ affichée');
        }
        
        // Vérifier les étapes d'arrivée
        const etapesArriveeContainer = document.querySelector('.etapes-container:nth-of-type(2)');
        if (etapesArriveeContainer) {
            const etapesArrivee = etapesArriveeContainer.querySelectorAll('li');
            console.log(`Étapes d'arrivée affichées: ${etapesArrivee.length}`);
            etapesArrivee.forEach((etape, index) => {
                console.log(`  Étape ${index + 1}: ${etape.textContent.trim()}`);
            });
        } else {
            console.log('Aucune étape d\'arrivée affichée');
        }
        
        // Vérifier les clients
        const clientsContainer = document.querySelector('.list-group');
        if (clientsContainer) {
            const clients = clientsContainer.querySelectorAll('.list-group-item');
            console.log(`Clients affichés: ${clients.length}`);
            clients.forEach((client, index) => {
                const nom = client.querySelector('h6')?.textContent.trim() || 'Nom inconnu';
                console.log(`  Client ${index + 1}: ${nom}`);
            });
        } else {
            console.log('Aucun client supplémentaire affiché');
        }
        
        // Vérifier les transporteurs
        const transporteursContainer = document.querySelector('.card-body .row');
        if (transporteursContainer) {
            const transporteurs = transporteursContainer.querySelectorAll('.col-md-6');
            console.log(`Transporteurs affichés: ${transporteurs.length}`);
            transporteurs.forEach((transporteur, index) => {
                const nom = transporteur.querySelector('h6')?.textContent.trim() || 'Nom inconnu';
                console.log(`  Transporteur ${index + 1}: ${nom}`);
            });
        } else {
            console.log('Aucun transporteur affiché');
        }
    }
    
    // Vérifier si nous sommes sur la page d'ajout ou d'édition d'une prestation
    if (window.location.pathname.match(/\/prestations\/(add|edit\/\d+)/)) {
        console.log('Page d\'ajout ou d\'édition de prestation');
        
        // Surveiller les boutons d'ajout d'étapes
        const btnAjouterEtapeDepart = document.getElementById('ajouter-etape-depart');
        const btnAjouterEtapeArrivee = document.getElementById('ajouter-etape-arrivee');
        
        if (btnAjouterEtapeDepart) {
            console.log('Bouton d\'ajout d\'étape de départ trouvé');
            btnAjouterEtapeDepart.addEventListener('click', function() {
                console.log('Bouton d\'ajout d\'étape de départ cliqué');
                setTimeout(() => {
                    const etapesDepart = document.querySelectorAll('#etapes-depart-container .etape-depart');
                    console.log(`Nombre d'étapes de départ après ajout: ${etapesDepart.length}`);
                }, 100);
            });
        } else {
            console.error('Bouton d\'ajout d\'étape de départ non trouvé');
        }
        
        if (btnAjouterEtapeArrivee) {
            console.log('Bouton d\'ajout d\'étape d\'arrivée trouvé');
            btnAjouterEtapeArrivee.addEventListener('click', function() {
                console.log('Bouton d\'ajout d\'étape d\'arrivée cliqué');
                setTimeout(() => {
                    const etapesArrivee = document.querySelectorAll('#etapes-arrivee-container .etape-arrivee');
                    console.log(`Nombre d'étapes d'arrivée après ajout: ${etapesArrivee.length}`);
                }, 100);
            });
        } else {
            console.error('Bouton d\'ajout d\'étape d\'arrivée non trouvé');
        }
        
        // Surveiller la soumission du formulaire
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                console.log('Formulaire soumis');
                
                // Vérifier les étapes de départ
                const etapesDepart = document.querySelectorAll('#etapes-depart-container .etape-depart input');
                console.log(`Étapes de départ à envoyer: ${etapesDepart.length}`);
                etapesDepart.forEach((input, index) => {
                    console.log(`  Étape ${index + 1}: ${input.value}`);
                });
                
                // Vérifier les étapes d'arrivée
                const etapesArrivee = document.querySelectorAll('#etapes-arrivee-container .etape-arrivee input');
                console.log(`Étapes d'arrivée à envoyer: ${etapesArrivee.length}`);
                etapesArrivee.forEach((input, index) => {
                    console.log(`  Étape ${index + 1}: ${input.value}`);
                });
            });
        }
    }
});
