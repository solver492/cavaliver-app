/**
 * Script principal pour les fonctionnalités globales du site Cavalier
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser tous les tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Gérer la fermeture des alertes
    var alertList = [].slice.call(document.querySelectorAll('.alert'));
    alertList.map(function (alertEl) {
        return new bootstrap.Alert(alertEl);
    });
    
    // Ajouter la classe active aux liens de navigation correspondant à la page actuelle
    const currentLocation = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentLocation.includes(href.replace(/^\//, ''))) {
            link.classList.add('active');
        }
    });
    
    // Amélioration de l'accessibilité pour les utilisateurs de clavier
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.classList.add('keyboard-focus');
        });
        
        element.addEventListener('blur', function() {
            this.classList.remove('keyboard-focus');
        });
    });
});