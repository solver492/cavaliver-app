/**
 * Système de notifications
 */

// Fonction pour charger les notifications
function loadNotifications() {
    fetch('/api/notifications/count')
        .then(response => response.json())
        .then(data => {
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = data.count;
                badge.style.display = data.count > 0 ? 'inline' : 'none';
            }
        })
        .catch(error => console.error('Erreur lors du chargement des notifications:', error));
}

// Initialiser le système de notifications
function initNotifications() {
    loadNotifications();
    // Rafraîchir toutes les 5 minutes
    setInterval(loadNotifications, 5 * 60 * 1000);
}

// Démarrer le système de notifications quand la page est chargée
document.addEventListener('DOMContentLoaded', initNotifications);
