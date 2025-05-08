/**
 * Script pour gérer la bulle d'accès rapide améliorée
 * Cette version inclut des animations et des fonctionnalités supplémentaires
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour gérer la bulle d'accès rapide
    function gererBulleAccesRapide() {
        console.log('Initialisation de la bulle d\'accès rapide...');
        
        // Vérifier si nous sommes sur la page de création de prestation
        const urlCourante = window.location.pathname;
        if (urlCourante === '/prestations/add' || urlCourante.includes('/prestations/edit/')) {
            console.log('Page de création/modification de prestation détectée, pas de bulle d\'accès rapide');
            return;
        }
        
        // Supprimer les bulles en double
        const bulles = document.querySelectorAll('.quick-access-bubble');
        if (bulles.length > 1) {
            console.log(`${bulles.length} bulles trouvées, suppression des doublons...`);
            for (let i = 1; i < bulles.length; i++) {
                bulles[i].remove();
            }
        } else if (bulles.length === 1) {
            console.log('Une bulle existante trouvée, vérification...');
            // Si la bulle existe déjà mais est mal configurée, la supprimer
            if (!bulles[0].querySelector('.bubble-toggle') || !bulles[0].querySelector('.bubble-content')) {
                console.log('Bulle mal configurée, suppression...');
                bulles[0].remove();
                creerBulleAccesRapide();
            }
        } else {
            console.log('Aucune bulle trouvée, création d\'une nouvelle bulle...');
            creerBulleAccesRapide();
        }
    }
    
    // Fonction pour créer la bulle d'accès rapide
    function creerBulleAccesRapide() {
        // Vérifier si la bulle existe déjà
        if (document.querySelector('.quick-access-bubble')) {
            console.log('La bulle existe déjà, annulation de la création.');
            return;
        }
        
        // Vérifier si l'utilisateur est admin ou super_admin
        const userRole = document.body.dataset.userRole;
        if (!userRole) {
            console.log('Rôle utilisateur non détecté, la bulle sera créée quand même.');
        }

        console.log('Création de la bulle d\'accès rapide...');
        
        // Créer la bulle
        const bulle = document.createElement('div');
        bulle.id = 'quick-access-bubble';
        bulle.className = 'quick-access-bubble';
        
        // Créer le bouton toggle
        const toggle = document.createElement('button');
        toggle.className = 'bubble-toggle';
        toggle.innerHTML = '<i class="fas fa-plus"></i>';
        toggle.setAttribute('title', 'Actions rapides');
        
        // Créer le contenu
        const content = document.createElement('div');
        content.className = 'bubble-content';
        content.innerHTML = `
            <div class="quick-access-buttons">
                <a href="/prestations/add" class="btn btn-success mb-2">
                    <i class="fas fa-truck-loading"></i> Nouvelle Prestation
                </a>
                <a href="/clients/clients/liste" class="btn btn-info mb-2">
                    <i class="fas fa-users"></i> Liste des Clients
                </a>
                <a href="/utilisateurs/users/liste" class="btn btn-warning mb-2">
                    <i class="fas fa-truck"></i> Liste des Chauffeurs
                </a>
                <a href="/prestations" class="btn btn-primary mb-2">
                    <i class="fas fa-list"></i> Liste des Prestations
                </a>
                <a href="/calendrier/agendas" class="btn btn-secondary mb-2">
                    <i class="fas fa-calendar-alt"></i> Gestion des agendas
                </a>
                <a href="${window.appUrls ? window.appUrls.guide : '/guide'}" class="btn btn-info mb-2">
                    <i class="fas fa-book"></i> Guide et bonnes pratiques
                </a>
            </div>
        `;
        
        // Assembler la bulle
        bulle.appendChild(toggle);
        bulle.appendChild(content);
        document.body.appendChild(bulle);
        
        console.log('Bulle créée et ajoutée au document.');
        
        // Ajouter l'animation d'entrée
        setTimeout(() => {
            bulle.classList.add('animated');
        }, 100);
        
        // Ajouter l'événement de clic pour le toggle
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            bulle.classList.toggle('active');
            
            // Mettre à jour l'icône du bouton
            if (bulle.classList.contains('active')) {
                toggle.innerHTML = '<i class="fas fa-times"></i>';
                toggle.setAttribute('title', 'Fermer');
            } else {
                toggle.innerHTML = '<i class="fas fa-plus"></i>';
                toggle.setAttribute('title', 'Actions rapides');
            }
        });
        
        // Fermer la bulle quand on clique en dehors
        document.addEventListener('click', function(e) {
            if (bulle.classList.contains('active') && !bulle.contains(e.target)) {
                bulle.classList.remove('active');
                toggle.innerHTML = '<i class="fas fa-plus"></i>';
                toggle.setAttribute('title', 'Actions rapides');
            }
        });
        
        // Ajouter un effet de survol pour les boutons
        const buttons = bulle.querySelectorAll('.quick-access-buttons a');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateX(5px)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateX(0)';
            });
        });
    }
    
    // Exécuter la gestion de la bulle au chargement avec un léger délai
    setTimeout(() => {
        gererBulleAccesRapide();
    }, 500);
    
    // Exposer les fonctions globalement
    window.gererBulleAccesRapide = gererBulleAccesRapide;
    window.creerBulleAccesRapide = creerBulleAccesRapide;
    
    // Réinitialiser la bulle lors du redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
        const bulle = document.querySelector('.quick-access-bubble');
        if (bulle && bulle.classList.contains('active')) {
            bulle.classList.remove('active');
            const toggle = bulle.querySelector('.bubble-toggle');
            if (toggle) {
                toggle.innerHTML = '<i class="fas fa-plus"></i>';
                toggle.setAttribute('title', 'Actions rapides');
            }
        }
    });
});
