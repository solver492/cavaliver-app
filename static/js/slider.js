/**
 * Script pour gérer le défilement des titres dans le header
 */
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    
    // Fonction pour passer au slide suivant
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Changer de slide toutes les 4 secondes
    const slideInterval = setInterval(nextSlide, 4000);
    
    // Arrêter le défilement si l'utilisateur quitte la page
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            clearInterval(slideInterval);
        } else {
            setInterval(nextSlide, 4000);
        }
    });
});