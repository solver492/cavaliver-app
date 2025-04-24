/**
 * Logo Carousel - Contrôle le défilement automatique des logos partenaires
 */
document.addEventListener('DOMContentLoaded', function() {
    // Configuration du carousel
    const logoCarousel = document.getElementById('logoCarousel');
    if (logoCarousel) {
        // Initialiser le carousel Bootstrap avec une durée de défilement plus lente
        const carousel = new bootstrap.Carousel(logoCarousel, {
            interval: 3000, // Défilement toutes les 3 secondes
            wrap: true,     // Boucle continue
            touch: true,    // Activer le swipe sur mobile
            pause: 'hover'  // Pause au survol
        });
        
        // Ajouter des animations sur le hover des logos
        const logos = document.querySelectorAll('.logo-item');
        logos.forEach(logo => {
            logo.addEventListener('mouseenter', function() {
                // Arrêter le défilement automatique au survol d'un logo
                carousel.pause();
            });
            
            logo.addEventListener('mouseleave', function() {
                // Reprendre le défilement automatique
                carousel.cycle();
            });
        });
    }
});
