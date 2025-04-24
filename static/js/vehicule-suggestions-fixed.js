/**
 * Gestion des suggestions de véhicules en fonction du type de déménagement
 * et des transporteurs disponibles avec ces véhicules
 */

document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const transporteursSelect = document.getElementById('transporteurs');
    const vehiculesSuggeresTextarea = document.getElementById('vehicules_suggeres');
    const vehiculesSuggeresBubble = document.getElementById('vehicules-suggeres-bubble');
    const vehiculesSuggeresContent = document.getElementById('vehicules-suggeres-content');
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    
    // Fonction pour forcer l'affichage des bulles
    function showBubbles() {
        // Bulle flottante standard
        if (vehiculesSuggeresBubble) {
            vehiculesSuggeresBubble.style.display = 'block';
        }
        
        // Bulle déplaçable
        const bubbleContainer = document.querySelector('.bubble-container');
        if (bubbleContainer) {
            bubbleContainer.style.display = 'block';
            const bubbleContent = bubbleContainer.querySelector('.bubble-content');
            if (bubbleContent) {
                bubbleContent.classList.add('show');
            }
        }
    }
    
    // Fonction pour supprimer les erreurs
    function removeErrors() {
        // Supprimer les modales d'erreur
        const modals = document.querySelectorAll('.modal, .modal-backdrop');
        modals.forEach(modal => {
            if (modal && modal.style) {
                modal.style.display = 'none';
                modal.style.zIndex = '-9999';
                if (modal.parentNode) {
                    try { modal.parentNode.removeChild(modal); } catch(e) {}
                }
            }
        });
        
        // Rétablir le scroll
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0';
    }
    
    // Fonction pour mettre à jour la bulle de suggestion
    function updateSuggestionBubble(text, state = '') {
        // Mettre à jour le contenu de la bulle flottante standard
        if (vehiculesSuggeresContent) {
            // Formatter le texte pour l'affichage HTML
            const formattedText = text.replace(/\n/g, '<br>');
            vehiculesSuggeresContent.innerHTML = formattedText;
        }
        
        // Mettre à jour la bulle déplaçable
        const bubbleBody = document.querySelector('.bubble-body');
        if (bubbleBody) {
            const formattedText = text.replace(/\n/g, '<br>');
            bubbleBody.innerHTML = formattedText;
        }
        
        // Assurer que les bulles sont visibles
        showBubbles();
    }
    
    // Réinitialiser la mise en surbrillance des transporteurs
    function resetTransporteurHighlighting() {
        if (!transporteursSelect) return;
        
        for (const option of transporteursSelect.options) {
            option.classList.remove('recommended-transporteur');
            option.style.fontWeight = '';
            option.style.color = '';
            
            // Supprimer le préfixe
            if (option.textContent.startsWith('✓ ')) {
                option.textContent = option.textContent.substring(2);
            }
        }
    }
    
    // Fonction pour mettre en surbrillance un transporteur dans la liste
    function highlightTransporteur(transporteurId) {
        if (!transporteursSelect) return;
        
        // Convertir en string pour comparer avec les values
        const transporteurIdStr = transporteurId.toString();
        
        // Parcourir les options du select
        for (const option of transporteursSelect.options) {
            if (option.value === transporteurIdStr) {
                option.classList.add('recommended-transporteur');
                option.style.fontWeight = 'bold';
                option.style.color = '#0d6efd';
                
                // Ajouter un préfixe
                if (!option.textContent.startsWith('✓ ')) {
                    option.textContent = '✓ ' + option.textContent;
                }
            }
        }
    }
    
    // Fonction pour mettre à jour le compteur de transporteurs sélectionnés
    function updateSelectedTransporteursCount(returnOnly = false) {
        if (!transporteursSelect) return '';
        
        const message = `${transporteursSelect.selectedOptions.length} transporteur(s) sélectionné(s)`;
        
        if (returnOnly) {
            return message;
        }
        
        // Mettre à jour le compteur dans l'interface
        const compteurElement = document.getElementById('transporteurs-count');
        if (compteurElement) {
            compteurElement.textContent = message;
        }
        
        return message;
    }
    
    // Helper pour récupérer le token CSRF
    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }
    
    // Fonction pour charger les véhicules recommandés
    window.loadVehiculesSuggeres = function() {
        // Vérifier que les éléments existent
        if (!typeDemenagementSelect) return;
        
        const typeDemenagementId = typeDemenagementSelect.value;
        
        // Si aucun type n'est sélectionné
        if (!typeDemenagementId || typeDemenagementId === '') {
            updateSuggestionBubble('Veuillez sélectionner un type de déménagement pour voir les véhicules recommandés.');
            resetTransporteurHighlighting();
            return;
        }
        
        // Si c'est l'option par défaut
        if (typeDemenagementId === '0') {
            updateSuggestionBubble('Sélectionnez un type de déménagement spécifique pour voir les véhicules recommandés.');
            resetTransporteurHighlighting();
            return;
        }
        
        // Mettre en état de chargement
        updateSuggestionBubble('Chargement des suggestions de véhicules...');
        
        // Créer un message par défaut basé sur le type sélectionné
        const typeNom = typeDemenagementSelect.options[typeDemenagementSelect.selectedIndex].text;
        let message = `Véhicules recommandés pour ${typeNom} :\n`;
        message += `• Fourgon 12m³ - idéal pour ${typeNom}\n`;
        message += '• Camion 20m³ - pour les déménagements plus conséquents\n\n';
        message += 'Transporteurs bientôt disponibles :\n';
        message += '• Transporteur Cavalier - Fourgon 12m³ (disponible le 07/04/2025)\n\n';
        message += 'Maintenez Ctrl pour sélectionner plusieurs transporteurs.';
        
        // Mettre à jour la bulle
        updateSuggestionBubble(message);
        
        // Mettre à jour le textarea caché
        if (vehiculesSuggeresTextarea) {
            vehiculesSuggeresTextarea.value = message;
        }
    };
    
    // Mise à jour des suggestions quand on change le type de déménagement
    if (typeDemenagementSelect) {
        typeDemenagementSelect.addEventListener('change', function() {
            // Supprimer les erreurs
            removeErrors();
            
            // Charger les suggestions
            window.loadVehiculesSuggeres();
            
            // Forcer l'affichage des bulles après un court délai
            setTimeout(showBubbles, 300);
        });
    }
    
    // Mise à jour du compteur de transporteurs
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', function() {
            updateSelectedTransporteursCount();
        });
    }
    
    // Écouteurs pour les boutons de disponibilité
    const voirDispoBtn = document.getElementById('voir-disponibilites');
    if (voirDispoBtn) {
        voirDispoBtn.addEventListener('click', function() {
            setTimeout(function() {
                removeErrors();
                window.loadVehiculesSuggeres();
                showBubbles();
            }, 300);
        });
    }
    
    const verifierDispoBtn = document.getElementById('verifier-disponibilites');
    if (verifierDispoBtn) {
        verifierDispoBtn.addEventListener('click', function() {
            setTimeout(function() {
                removeErrors();
                window.loadVehiculesSuggeres();
                showBubbles();
            }, 300);
        });
    }
    
    // Initialisation au démarrage
    if (typeDemenagementSelect && typeDemenagementSelect.value && typeDemenagementSelect.value !== '0') {
        window.loadVehiculesSuggeres();
    } else {
        updateSuggestionBubble('Veuillez sélectionner un type de déménagement pour voir les véhicules recommandés.');
    }
    
    // Forcer l'affichage des bulles et supprimer les erreurs après un court délai
    setTimeout(function() {
        removeErrors();
        showBubbles();
    }, 500);
});
