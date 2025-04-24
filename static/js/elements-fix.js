/**
 * Script correctif pour repositionner les éléments flottants
 * Ce script déplace les éléments "Transporteurs bientôt disponibles" et "Véhicules suggérés"
 * qui se retrouvent en bas de page pour les placer au bon endroit
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    console.log('Chargement du correctif de positionnement des éléments...');
    
    // Fonction pour repositionner les éléments
    function repositionnerElements() {
        console.log('Repositionnement des éléments flottants...');
        
        // 1. Récupérer et améliorer la bulle des véhicules suggérés
        const bulleSuggestions = document.getElementById('vehicules-suggeres-bubble');
        if (bulleSuggestions) {
            // Trouver la section des transporteurs
            const sectionTransporteurs = document.querySelector('.transporteurs') || 
                                         document.querySelector('#transporteurs')?.closest('.row');
            
            if (sectionTransporteurs) {
                // Déplacer la bulle après la section des transporteurs
                sectionTransporteurs.after(bulleSuggestions);
                
                // Marquer comme positionné
                bulleSuggestions.classList.add('positioned');
                
                // Appliquer des styles pour qu'elle s'affiche correctement
                bulleSuggestions.style.position = 'static';
                bulleSuggestions.style.transform = 'none';
                bulleSuggestions.style.margin = '20px 0';
                bulleSuggestions.style.maxWidth = '100%';
                bulleSuggestions.style.width = '100%';
                bulleSuggestions.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
                bulleSuggestions.style.borderRadius = '8px';
                bulleSuggestions.style.padding = '15px';
                bulleSuggestions.style.border = '1px solid #0d6efd';
                bulleSuggestions.style.background = '#f8f9fa';
                bulleSuggestions.style.display = 'block';
                bulleSuggestions.style.opacity = '1';
                
                // Mettre à jour le contenu avec les transporteurs bientôt disponibles
                updateBubbleContent();
            }
        } else {
            // Si la bulle n'existe pas, la créer
            createBubble();
        }
        
        // 2. Déplacer le conteneur des transporteurs bientôt disponibles
        const soonAvailableContainer = document.getElementById('soon-available-container');
        if (soonAvailableContainer) {
            // Trouver l'endroit où insérer
            const transporteursSelect = document.getElementById('transporteurs');
            if (transporteursSelect) {
                const parentDiv = transporteursSelect.closest('.row');
                if (parentDiv) {
                    // Placer après le sélecteur de transporteurs
                    parentDiv.appendChild(soonAvailableContainer);
                    
                    // Styles
                    soonAvailableContainer.style.marginTop = '15px';
                    soonAvailableContainer.style.width = '100%';
                    soonAvailableContainer.style.boxSizing = 'border-box';
                }
            }
        }
        
        // 3. Gérer les messages système (supprimer uniquement ceux-ci)
        const messageSystemBtn = document.getElementById('comment-system-btn');
        if (messageSystemBtn) {
            // Le supprimer complètement si nécessaire
            if (messageSystemBtn.parentNode) {
                messageSystemBtn.parentNode.removeChild(messageSystemBtn);
            }
        }
        
        // 4. Supprimer la fenêtre popup des messages système
        const messagePanel = document.querySelector('.comment-panel');
        if (messagePanel) {
            if (messagePanel.parentNode) {
                messagePanel.parentNode.removeChild(messagePanel);
            }
        }
    }
    
    // Fonction pour créer la bulle si elle n'existe pas
    function createBubble() {
        if (document.getElementById('vehicules-suggeres-bubble')) {
            return; // Déjà existante
        }
        
        // Création de la bulle
        const bubble = document.createElement('div');
        bubble.id = 'vehicules-suggeres-bubble';
        bubble.className = 'floating-bubble positioned';
        
        // En-tête
        const header = document.createElement('div');
        header.className = 'bubble-header';
        header.innerHTML = '<i class="fas fa-truck"></i> Transporteurs bientôt disponibles';
        
        // Contenu
        const content = document.createElement('div');
        content.id = 'vehicules-suggeres-content';
        content.innerHTML = 'Chargement des informations...';
        
        // Assembler
        bubble.appendChild(header);
        bubble.appendChild(content);
        
        // Trouver où insérer
        const transporteursSection = document.querySelector('.transporteurs');
        if (transporteursSection) {
            transporteursSection.parentNode.insertBefore(bubble, transporteursSection.nextSibling);
        } else {
            // Sinon, l'ajouter au corps de la page
            document.body.appendChild(bubble);
        }
        
        // Styles
        bubble.style.position = 'static';
        bubble.style.margin = '20px 0';
        bubble.style.padding = '15px';
        bubble.style.border = '1px solid #0d6efd';
        bubble.style.borderRadius = '8px';
        bubble.style.background = '#f8f9fa';
        bubble.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        bubble.style.width = '100%';
        
        // Remplir le contenu
        updateBubbleContent();
    }
    
    // Fonction pour mettre à jour le contenu de la bulle
    function updateBubbleContent() {
        const content = document.getElementById('vehicules-suggeres-content');
        if (!content) return;
        
        // Récupérer les informations des transporteurs bientôt disponibles
        const transporteursBientotDispo = [];
        const container = document.getElementById('soon-available-container');
        if (container) {
            const items = container.querySelectorAll('.mb-2.p-2.border-bottom');
            items.forEach(item => {
                transporteursBientotDispo.push(item.innerText);
            });
        }
        
        // Si pas d'infos, essayer de récupérer depuis la section des transporteurs
        if (transporteursBientotDispo.length === 0) {
            const transporteursText = document.querySelector('#transporteurs')?.innerText;
            if (transporteursText) {
                transporteursBientotDispo.push('Transporteurs disponibles : ' + transporteursText);
            }
        }
        
        // Générer le contenu
        if (transporteursBientotDispo.length > 0) {
            let htmlContent = '<ul style="padding-left: 20px; margin-top: 10px;">';
            transporteursBientotDispo.forEach(item => {
                htmlContent += `<li style="margin-bottom: 8px;">${item}</li>`;
            });
            htmlContent += '</ul>';
            htmlContent += '<p><i class="fas fa-info-circle"></i> Maintenez Ctrl pour sélectionner plusieurs transporteurs.</p>';
            
            content.innerHTML = htmlContent;
        } else {
            content.innerHTML = 'Aucun transporteur bientôt disponible n\'a été trouvé.<br><br>Maintenez Ctrl pour sélectionner plusieurs transporteurs.';
        }
    }
    
    // Exécuter le repositionnement immédiatement
    repositionnerElements();
    
    // Et aussi après un délai pour s'assurer que tous les éléments sont chargés
    setTimeout(repositionnerElements, 500);
    setTimeout(repositionnerElements, 1000);
    
    // Observer les modifications du DOM pour savoir quand réagir
    const observer = new MutationObserver(function() {
        setTimeout(repositionnerElements, 100);
    });
    
    // Observer le corps entier du document
    observer.observe(document.body, { 
        childList: true,
        subtree: true
    });
});
