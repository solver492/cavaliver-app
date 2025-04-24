/**
 * Script pour gérer le défilement automatique des logos partenaires
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour dupliquer les logos et assurer un défilement continu
    function setupPartnerScroll() {
        const scrollContainer = document.querySelector('.partners-scroll');
        if (!scrollContainer) return;
        
        // Récupérer tous les logos originaux
        const originalLogos = scrollContainer.querySelectorAll('.partner-logo');
        const logoCount = originalLogos.length / 2; // Divisé par 2 car nous avons déjà dupliqué les logos dans le HTML
        
        // Ajuster la vitesse de défilement en fonction du nombre de logos
        scrollContainer.style.animationDuration = (logoCount * 5) + 's';
        
        // Ajouter des effets de survol
        originalLogos.forEach(logo => {
            logo.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.2)';
                this.style.opacity = '1';
                scrollContainer.style.animationPlayState = 'paused';
            });
            
            logo.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.opacity = '0.7';
                scrollContainer.style.animationPlayState = 'running';
            });
        });
    }
    
    // Initialiser le défilement des logos
    setupPartnerScroll();
    
    // Réinitialiser si la fenêtre est redimensionnée
    window.addEventListener('resize', setupPartnerScroll);
});
