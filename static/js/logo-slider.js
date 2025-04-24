// Script pour l'animation du diaporama de logos
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.logo-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    // Fonction pour afficher le slide suivant
    function showNextSlide() {
        // Masquer tous les slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Afficher le slide suivant
        slides[currentSlide].classList.add('active');
        
        // Incrémenter et boucler si nécessaire
        currentSlide = (currentSlide + 1) % slides.length;
    }
    
    // Afficher le premier slide immédiatement
    showNextSlide();
    
    // Changer de slide toutes les 3 secondes
    setInterval(showNextSlide, 3000);
});
