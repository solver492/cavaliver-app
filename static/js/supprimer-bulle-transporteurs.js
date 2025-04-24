/**
 * Script pour supprimer la bulle des transporteurs bientôt disponibles
 * qui apparaît en double sur les pages de prestation
 * Version améliorée avec suppression plus agressive
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour supprimer la bulle des transporteurs bientôt disponibles
    function supprimerBulleTransporteurs() {
        // 1. Supprimer par ID
        const bulle = document.getElementById('vehicules-suggeres-bubble');
        if (bulle) {
            if (bulle.parentNode) {
                bulle.parentNode.removeChild(bulle);
                console.log('Bulle des transporteurs bientôt disponibles supprimée (par ID)');
            } else {
                bulle.style.display = 'none';
                bulle.style.visibility = 'hidden';
                bulle.style.opacity = '0';
                bulle.style.height = '0';
                bulle.style.width = '0';
                bulle.style.overflow = 'hidden';
                bulle.style.position = 'absolute';
                bulle.style.zIndex = '-9999';
                console.log('Bulle des transporteurs bientôt disponibles masquée (par ID)');
            }
        }

        // 2. Supprimer par classe
        const bullesParClasse = document.querySelectorAll('.floating-bubble');
        bullesParClasse.forEach(function(element) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
                console.log('Bulle des transporteurs bientôt disponibles supprimée (par classe)');
            } else {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
            }
        });

        // 3. Supprimer par contenu
        const tousElements = document.querySelectorAll('div');
        tousElements.forEach(function(element) {
            if (element.textContent && element.textContent.includes('Transporteurs bientôt disponibles')) {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                    console.log('Bulle des transporteurs bientôt disponibles supprimée (par contenu)');
                } else {
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                }
            }
        });

        // 4. Supprimer spécifiquement les bulles dans la section transporteurs
        const sectionsTransporteurs = document.querySelectorAll('.transporteurs');
        sectionsTransporteurs.forEach(function(section) {
            const bullesDansSection = section.querySelectorAll('div');
            bullesDansSection.forEach(function(element) {
                if (element.id === 'vehicules-suggeres-bubble' || 
                    (element.textContent && element.textContent.includes('Transporteurs bientôt disponibles'))) {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                        console.log('Bulle des transporteurs bientôt disponibles supprimée (dans section transporteurs)');
                    } else {
                        element.style.display = 'none';
                        element.style.visibility = 'hidden';
                    }
                }
            });
        });
    }

    // Désactiver la création de la bulle en remplaçant les fonctions qui la créent
    window.createDraggableBubble = function() {
        console.log('Création de bulle désactivée');
        return null;
    };

    // Exécuter immédiatement
    supprimerBulleTransporteurs();

    // Exécuter à nouveau après un court délai pour s'assurer que la bulle est supprimée
    // même si elle est créée dynamiquement après le chargement initial
    const intervalId = setInterval(supprimerBulleTransporteurs, 200);
    
    // Arrêter l'intervalle après 10 secondes pour éviter de consommer des ressources inutilement
    setTimeout(function() {
        clearInterval(intervalId);
    }, 10000);

    // Observer les changements dans le DOM pour supprimer la bulle si elle est recréée
    const observer = new MutationObserver(function(mutations) {
        supprimerBulleTransporteurs();
    });

    // Observer le corps du document pour détecter les changements
    observer.observe(document.body, { childList: true, subtree: true });

    // Ajouter un gestionnaire d'événements pour supprimer la bulle après le chargement complet de la page
    window.addEventListener('load', function() {
        supprimerBulleTransporteurs();
        setTimeout(supprimerBulleTransporteurs, 500);
        setTimeout(supprimerBulleTransporteurs, 1000);
    });
});
