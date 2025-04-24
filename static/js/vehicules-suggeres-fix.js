/**
 * Script pour corriger l'affichage des véhicules suggérés
 * Ce script détecte et corrige les problèmes d'affichage liés aux véhicules suggérés
 */
document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour corriger l'affichage des véhicules suggérés
    function corrigerVehiculesSuggeres() {
        // Trouver la section des véhicules suggérés en bas de page
        const vehiculesSuggeresSection = document.querySelector('.vehicules-suggeres');
        
        // S'il y a une erreur dans l'affichage (détection basée sur le texte)
        const texteErreur = document.body.innerText.includes('Véhicules recommandés pour ce type de déménagement') && 
                           document.body.innerText.includes('Aucun transporteur disponible avec un véhicule adapté');
        
        if (texteErreur) {
            // Récupérer tous les véhicules suggérés depuis les checkboxes
            const vehiculesCheckboxes = document.querySelectorAll('input[name="vehicule"]');
            let vehiculesList = [];
            
            vehiculesCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    vehiculesList.push(checkbox.value);
                }
            });
            
            // Créer une nouvelle section correctement formatée
            const nouvelleSection = document.createElement('div');
            nouvelleSection.className = 'vehicules-suggeres mt-3 alert alert-info';
            nouvelleSection.innerHTML = `
                <h5 class="mb-2"><i class="fas fa-truck"></i> Véhicules suggérés</h5>
                <p>${vehiculesList.length > 0 ? vehiculesList.join(', ') : 'Aucun véhicule sélectionné'}</p>
            `;
            
            // Remplacer l'ancienne section ou ajouter la nouvelle si l'ancienne n'existe pas
            if (vehiculesSuggeresSection) {
                vehiculesSuggeresSection.replaceWith(nouvelleSection);
            } else {
                // Trouver un endroit approprié pour ajouter la section
                const form = document.querySelector('form');
                if (form) {
                    const lastSection = form.querySelector('.row:last-child');
                    if (lastSection) {
                        lastSection.after(nouvelleSection);
                    }
                }
            }
            
            // Cacher la section d'erreur au bas de la page
            const footerInfo = document.querySelector('footer');
            if (footerInfo) {
                const errorLines = footerInfo.querySelectorAll('div');
                errorLines.forEach(line => {
                    if (line.innerText.includes('Véhicules recommandés') || 
                        line.innerText.includes('Aucun transporteur disponible')) {
                        line.style.display = 'none';
                    }
                });
            }
        }
    }
    
    // Exécuter la correction
    corrigerVehiculesSuggeres();
    
    // Réappliquer après chaque modification
    const checkboxes = document.querySelectorAll('input[name="vehicule"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', corrigerVehiculesSuggeres);
    });
});
