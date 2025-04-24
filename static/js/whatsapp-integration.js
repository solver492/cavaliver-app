/**
 * Intégration WhatsApp pour R-cavalier
 * Permet d'ajouter facilement des boutons d'appel WhatsApp à côté des numéros de téléphone
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    console.log('Chargement de l\'intégration WhatsApp...');
    
    // Vérifier si l'intégration WhatsApp est désactivée sur cette page
    function isWhatsAppDisabled() {
        return document.body.classList.contains('disable-global-whatsapp');
    }
    
    // Fonction pour vérifier si une chaîne ressemble à un numéro de téléphone
    function isPhoneNumber(text) {
        // Doit contenir au moins 8 chiffres et pas plus de 15 chiffres
        const digitCount = (text.match(/\d/g) || []).length;
        if (digitCount < 8 || digitCount > 15) return false;
        
        // Les codes postaux français ont généralement 5 chiffres
        if (digitCount === 5 && text.match(/^\d{5}$/)) return false;
        
        // Vérifier d'autres conditions spécifiques
        // Pas un code postal étendu ou un simple nombre
        if (text.match(/^\d{4,6}$/)) return false;
        
        // Doit contenir des séparateurs typiques des numéros de téléphone
        // ou commencer par des indicatifs internationaux courants
        return text.match(/[\.\s\-\+\(\)]/) || 
               text.match(/^(\+|00|33|0)/) || 
               text.match(/\d{2}[\s\.-]?\d{2}[\s\.-]?\d{2}[\s\.-]?\d{2}/);
    }
    
    // Fonction pour formater un numéro de téléphone pour WhatsApp
    function formatPhoneForWhatsApp(phoneNumber) {
        // Supprimer tous les caractères non numériques
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // Si le numéro commence par un 0, le remplacer par +33
        if (cleaned.startsWith('0')) {
            cleaned = '33' + cleaned.substring(1);
        }
        
        // S'assurer que le numéro commence par un + si ce n'est pas déjà le cas
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        
        return cleaned;
    }
    
    // Fonction pour créer un lien WhatsApp
    function createWhatsAppLink(phoneNumber) {
        const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
        return `https://wa.me/${formattedPhone}`;
    }
    
    // Fonction pour créer un bouton WhatsApp
    function createWhatsAppButton(phoneNumber) {
        const button = document.createElement('a');
        button.href = createWhatsAppLink(phoneNumber);
        button.className = 'whatsapp-btn';
        button.target = '_blank';
        button.innerHTML = '<i class="fab fa-whatsapp"></i>';
        button.title = 'Contacter par WhatsApp';
        
        // Style moderne et professionnel
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.width = '36px';
        button.style.height = '36px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#25D366';
        button.style.color = 'white';
        button.style.textDecoration = 'none';
        button.style.marginLeft = '8px';
        button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        button.style.transition = 'all 0.3s ease';
        button.style.border = 'none';
        button.style.fontSize = '1.2rem';
        
        // Effets au survol
        button.onmouseover = function() {
            this.style.backgroundColor = '#128C7E';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        };
        
        button.onmouseout = function() {
            this.style.backgroundColor = '#25D366';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        };
        
        return button;
    }
    
    // Fonction pour ajouter des boutons WhatsApp à tous les numéros de téléphone
    function addWhatsAppButtons() {
        // Si l'intégration WhatsApp est désactivée sur cette page, ne rien faire
        if (isWhatsAppDisabled()) {
            console.log('Intégration WhatsApp globale désactivée sur cette page');
            return;
        }
        
        // 1. Rechercher tous les éléments qui contiennent des numéros de téléphone
        
        // Cas 1: Éléments avec l'attribut data-phone
        const phoneElements = document.querySelectorAll('[data-phone]');
        phoneElements.forEach(element => {
            const phone = element.getAttribute('data-phone');
            if (phone && phone.trim().length > 5) {
                // Vérifier si le bouton n'existe pas déjà
                if (!element.querySelector('.whatsapp-btn')) {
                    element.appendChild(createWhatsAppButton(phone));
                }
            }
        });
        
        // Cas 2: Éléments avec la classe "phone-number"
        const phoneClassElements = document.querySelectorAll('.phone-number');
        phoneClassElements.forEach(element => {
            const phone = element.textContent || element.innerText;
            if (phone && phone.trim().length > 5) {
                // Vérifier si le bouton n'existe pas déjà
                if (!element.parentNode.querySelector('.whatsapp-btn')) {
                    const button = createWhatsAppButton(phone);
                    element.insertAdjacentElement('afterend', button);
                }
            }
        });
        
        // Cas 3: Champs de formulaire avec un ID ou une classe contenant "telephone"
        const phoneFields = document.querySelectorAll('input[id*="telephone"], input[id*="phone"], input[class*="telephone"], input[class*="phone"]');
        phoneFields.forEach(field => {
            const phone = field.value;
            if (phone && phone.trim().length > 5) {
                // Créer un conteneur pour le bouton s'il n'existe pas déjà
                let buttonContainer = field.nextElementSibling;
                if (!buttonContainer || !buttonContainer.classList.contains('whatsapp-container')) {
                    buttonContainer = document.createElement('div');
                    buttonContainer.className = 'whatsapp-container';
                    buttonContainer.style.marginTop = '5px';
                    field.parentNode.insertBefore(buttonContainer, field.nextSibling);
                }
                
                // Vérifier si le bouton n'existe pas déjà
                if (!buttonContainer.querySelector('.whatsapp-btn')) {
                    buttonContainer.appendChild(createWhatsAppButton(phone));
                }
            }
        });
        
        // Cas 4: Table cells contenant des numéros de téléphone (recherche heuristique)
        const tableCells = document.querySelectorAll('td');
        tableCells.forEach(cell => {
            const text = cell.textContent || cell.innerText;
            
            // Vérifier si le texte ressemble à un numéro de téléphone
            const phonePattern = /(\+?\d{1,4}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{2,3}[-.\s]?\d{2,3}([-.\s]?\d{2,3})?/;
            if (phonePattern.test(text) && text.length <= 20) {
                // Vérifier si le bouton n'existe pas déjà
                if (!cell.querySelector('.whatsapp-btn')) {
                    const phone = text.match(phonePattern)[0];
                    cell.innerHTML = text.replace(phone, `${phone} `);
                    cell.appendChild(createWhatsAppButton(phone));
                }
            }
        });
        
        // Cas 5: Les transporteurs dans la liste des transporteurs
        const transporteurSelect = document.getElementById('transporteurs');
        if (transporteurSelect) {
            const transporteurOptions = transporteurSelect.querySelectorAll('option');
            transporteurOptions.forEach(option => {
                // Vérifier si l'option contient un numéro de téléphone
                const text = option.textContent || option.innerText;
                const phonePattern = /(\+?\d{1,4}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{2,3}[-.\s]?\d{2,3}([-.\s]?\d{2,3})?/;
                if (phonePattern.test(text)) {
                    const phone = text.match(phonePattern)[0];
                    
                    // Ajouter un attribut data pour le téléphone
                    option.setAttribute('data-phone', phone);
                    
                    // On ne peut pas ajouter directement un bouton dans une option,
                    // donc on ajoutera cette fonctionnalité autrement
                }
            });
            
            // Ajouter un gestionnaire d'événements pour afficher un bouton WhatsApp
            // quand un transporteur est sélectionné
            transporteurSelect.addEventListener('change', function() {
                const selectedOption = transporteurSelect.options[transporteurSelect.selectedIndex];
                if (selectedOption.hasAttribute('data-phone')) {
                    const phone = selectedOption.getAttribute('data-phone');
                    
                    // Trouver ou créer un conteneur pour le bouton WhatsApp
                    let whatsappContainer = document.getElementById('transporteur-whatsapp-container');
                    if (!whatsappContainer) {
                        whatsappContainer = document.createElement('div');
                        whatsappContainer.id = 'transporteur-whatsapp-container';
                        whatsappContainer.style.marginTop = '10px';
                        transporteurSelect.parentNode.insertBefore(whatsappContainer, transporteurSelect.nextSibling);
                    }
                    
                    // Mettre à jour le contenu
                    whatsappContainer.innerHTML = '';
                    const button = createWhatsAppButton(phone);
                    button.className = 'btn btn-success whatsapp-btn';
                    button.style.width = 'auto';
                    whatsappContainer.appendChild(button);
                }
            });
        }
    }
    
    // Exécuter la fonction principale
    addWhatsAppButtons();
    
    // Ré-exécuter la fonction après un délai pour s'assurer que tout est chargé
    setTimeout(addWhatsAppButtons, 1000);
    
    // Observer les modifications du DOM pour ajouter les boutons aux nouveaux éléments
    const observer = new MutationObserver(function() {
        setTimeout(addWhatsAppButtons, 200);
    });
    
    // Observer les modifications du document
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
