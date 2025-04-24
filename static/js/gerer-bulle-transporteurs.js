/**
 * Script pour gérer la bulle d'accès rapide
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour gérer la bulle d'accès rapide
    function gererBulleAccesRapide() {
        // Supprimer les bulles en double
        const bulles = document.querySelectorAll('#vehicules-suggeres-bubble');
        if (bulles.length > 1) {
            for (let i = 1; i < bulles.length; i++) {
                bulles[i].remove();
            }
        }
        
        // Récupérer la bulle (s'il en reste une)
        const bulle = document.getElementById('vehicules-suggeres-bubble');
        
        if (!bulle) {
            // Créer une nouvelle bulle
            creerBulleAccesRapide();
        }
    }
    
    // Fonction pour créer la bulle d'accès rapide
    function creerBulleAccesRapide() {
        // Vérifier si la bulle existe déjà
        if (document.getElementById('vehicules-suggeres-bubble')) {
            return;
        }
        
        // Vérifier si l'utilisateur est admin ou super_admin
        const userRole = document.body.dataset.userRole;
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            return;
        }

        // Créer la bulle
        const bulle = document.createElement('div');
        bulle.id = 'vehicules-suggeres-bubble';
        bulle.className = 'quick-access-bubble';
        
        // Créer le bouton toggle
        const toggle = document.createElement('button');
        toggle.className = 'bubble-toggle';
        toggle.innerHTML = '<i class="fas fa-plus"></i>';
        
        // Créer le contenu
        const content = document.createElement('div');
        content.className = 'bubble-content';
        content.innerHTML = `
            <div class="quick-access-buttons">
                <a href="/factures/factures/add" class="btn btn-primary">
                    <i class="fas fa-file-invoice"></i> Nouvelle Facture
                </a>
                <a href="/prestations/add" class="btn btn-success">
                    <i class="fas fa-truck-loading"></i> Nouvelle Prestation
                </a>
                <a href="/stockage/add" class="btn btn-info">
                    <i class="fas fa-warehouse"></i> Nouveau Stockage
                </a>
                <a href="/clients/clients/liste" class="btn btn-info">
                    <i class="fas fa-users"></i> Liste des Clients
                </a>
                <a href="/utilisateurs/users/liste" class="btn btn-warning">
                    <i class="fas fa-truck"></i> Liste des Chauffeurs
                </a>
            </div>
        `;
        
        // Assembler la bulle
        bulle.appendChild(toggle);
        bulle.appendChild(content);
        document.body.appendChild(bulle);
        
        // Ajouter l'événement de clic pour le toggle
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            bulle.classList.toggle('active');
        });
        
        // Fermer la bulle quand on clique en dehors
        document.addEventListener('click', function(e) {
            if (!bulle.contains(e.target)) {
                bulle.classList.remove('active');
            }
        });
    }
    
    // Exécuter la gestion de la bulle au chargement
    gererBulleAccesRapide();
    
    // Exposer les fonctions globalement
    window.gererBulleAccesRapide = gererBulleAccesRapide;
    window.creerBulleAccesRapide = creerBulleAccesRapide;
});
