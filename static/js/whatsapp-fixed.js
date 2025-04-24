/**
 * Intégration WhatsApp pour R-cavalier (version corrigée)
 * Ajoute des boutons d'appel WhatsApp à côté des numéros de téléphone uniquement
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    console.log('Chargement de l\'intégration WhatsApp améliorée...');
    
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
        button.setAttribute('aria-label', 'Appeler par WhatsApp');
        
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
    
    // Fonction principale pour ajouter les boutons WhatsApp
    function addWhatsAppButtons() {
        // Supprimer d'abord tous les boutons WhatsApp existants
        // pour éviter les duplications
        document.querySelectorAll('.whatsapp-btn').forEach(btn => {
            btn.parentNode.removeChild(btn);
        });
        
        // ÉTAPE 1: Gérer les champs Téléphone explicites
        // Rechercher tous les éléments avec des libellés explicites de téléphone
        const phoneLabels = Array.from(document.querySelectorAll('label, th, td, div, span, strong'))
            .filter(el => {
                const text = el.textContent.toLowerCase();
                return text.includes('téléphone') || 
                       text.includes('telephon') || 
                       text.includes('tél') || 
                       text.includes('tel') || 
                       text.includes('portable') || 
                       text.includes('mobile');
            });
        
        // Pour chaque label, trouver l'élément associé et ajouter un bouton
        phoneLabels.forEach(label => {
            let phoneElement;
            
            // Cas 1: label HTML standard
            if (label.htmlFor) {
                phoneElement = document.getElementById(label.htmlFor);
            } 
            // Cas 2: cellule de tableau suivante
            else if (label.tagName === 'TD' || label.tagName === 'TH') {
                const nextCell = label.nextElementSibling;
                if (nextCell && nextCell.tagName === 'TD') {
                    phoneElement = nextCell;
                }
            }
            // Cas 3: élément voisin
            else {
                // Chercher un élément après ce label
                let sibling = label.nextElementSibling;
                while (sibling) {
                    // Si c'est un champ de saisie ou un texte qui ressemble à un numéro
                    if (sibling.tagName === 'INPUT' || sibling.tagName === 'SPAN' || sibling.tagName === 'DIV') {
                        const text = sibling.textContent || sibling.value || '';
                        if (text.match(/\\d/) && !sibling.classList.contains('whatsapp-btn')) {
                            phoneElement = sibling;
                            break;
                        }
                    }
                    sibling = sibling.nextElementSibling;
                }
            }
            
            // Si on a trouvé un élément associé au téléphone
            if (phoneElement) {
                let phoneNumber;
                
                // Selon le type d'élément
                if (phoneElement.tagName === 'INPUT') {
                    phoneNumber = phoneElement.value;
                } else {
                    phoneNumber = phoneElement.textContent;
                }
                
                // Si on a un numéro valide, ajouter le bouton
                if (phoneNumber && phoneNumber.match(/\\d/)) {
                    // Vérifier qu'il n'y a pas déjà un bouton
                    if (!phoneElement.nextElementSibling || !phoneElement.nextElementSibling.classList.contains('whatsapp-btn')) {
                        phoneElement.insertAdjacentElement('afterend', createWhatsAppButton(phoneNumber));
                    }
                }
            }
        });
        
        // ÉTAPE 2: Cas spécifique de la page de détails client
        // Trouver spécifiquement le champ téléphone
        document.querySelectorAll('dt, .field-label').forEach(label => {
            if (label.textContent.toLowerCase().includes('téléphone') || 
                label.textContent.toLowerCase().includes('tél')) {
                
                const valueElement = label.nextElementSibling;
                if (valueElement && valueElement.textContent.match(/\\d/)) {
                    if (!valueElement.querySelector('.whatsapp-btn')) {
                        valueElement.appendChild(createWhatsAppButton(valueElement.textContent));
                    }
                }
            }
        });
        
        // ÉTAPE 3: Traitement spécifique de la page client
        // Pour la fiche client, utiliser le sélecteur spécifique des champs
        const telephoneFields = document.querySelectorAll('.row:has(strong:contains("Téléphone")) span, .row:has(label:contains("Téléphone")) span');
        telephoneFields.forEach(field => {
            if (field.textContent.match(/\\d/) && !field.querySelector('.whatsapp-btn')) {
                field.appendChild(createWhatsAppButton(field.textContent));
            }
        });
        
        // SUPPRESSION EXPLICITE des boutons sur les codes postaux
        // Cette étape est critique pour éviter les boutons sur les codes postaux
        document.querySelectorAll('*').forEach(el => {
            // Trouver les labels qui pourraient indiquer un code postal
            if (el.textContent && 
                (el.textContent.toLowerCase().includes('code postal') || 
                 el.textContent.toLowerCase().includes('cp'))) {
                
                // Chercher les éléments voisins qui pourraient avoir un bouton WhatsApp
                let sibling = el.nextElementSibling;
                while (sibling) {
                    const whatsappBtn = sibling.querySelector('.whatsapp-btn');
                    if (whatsappBtn) {
                        whatsappBtn.parentNode.removeChild(whatsappBtn);
                    }
                    sibling = sibling.nextElementSibling;
                }
            }
        });
        
        // Supprimer spécifiquement les boutons à côté des codes postaux
        document.querySelectorAll('[id*="code_postal"], [id*="codePostal"], [name*="code_postal"], [name*="codePostal"]').forEach(postalElement => {
            // Rechercher et supprimer les boutons WhatsApp à proximité
            let sibling = postalElement.nextElementSibling;
            while (sibling) {
                if (sibling.classList.contains('whatsapp-btn')) {
                    sibling.parentNode.removeChild(sibling);
                }
                sibling = sibling.nextElementSibling;
            }
        });
    }
    
    // NOUVEAU: Fonction spécifique pour gérer les cas de la fiche client
    function handleFicheClient() {
        // Recherche spécifique des éléments de la fiche client
        const ficheClient = document.querySelector('.fiche-client, .client-details, #client-details');
        
        // Traitement spécial pour la page de détails client
        // Ajouter explicitement le bouton au téléphone
        const telephoneLabels = document.querySelectorAll('strong, label');
        telephoneLabels.forEach(label => {
            if (label.textContent && label.textContent.includes('léphone')) {
                // Trouver le contenu du téléphone
                let phoneElement = label.nextElementSibling;
                // Si pas d'element suivant direct, chercher dans le parent
                if (!phoneElement || !phoneElement.textContent.match(/\d/)) {
                    const parentRow = label.closest('.row, tr, .form-group');
                    if (parentRow) {
                        // Chercher un élément avec un numéro dans cette ligne
                        const phoneElements = parentRow.querySelectorAll('*');
                        for (let el of phoneElements) {
                            if (el !== label && el.textContent && el.textContent.match(/\d{3,}/)) {
                                phoneElement = el;
                                break;
                            }
                        }
                    }
                }
                
                // Si on a trouvé un élément contenant un numéro
                if (phoneElement && phoneElement.textContent && phoneElement.textContent.match(/\d{3,}/)) {
                    // Supprimer d'abord tout bouton existant
                    const existingButtons = phoneElement.parentNode.querySelectorAll('.whatsapp-btn');
                    existingButtons.forEach(btn => btn.parentNode.removeChild(btn));
                    
                    // Créer et ajouter le bouton après le numéro
                    const whatsappButton = createWhatsAppButton(phoneElement.textContent);
                    phoneElement.appendChild(whatsappButton);
                }
            }
        });
        
        // Trouver la section Code postal et supprimer tout bouton WhatsApp
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent && (el.textContent.includes('Code postal') || el.textContent.includes('code postal'))) {
                let parent = el.closest('.row, tr, .form-group');
                if (parent) {
                    const whatsappBtns = parent.querySelectorAll('.whatsapp-btn');
                    whatsappBtns.forEach(btn => btn.parentNode.removeChild(btn));
                }
            }
        });
    }
    
    // Exécution principale
    addWhatsAppButtons();
    handleFicheClient();
    
    // Ré-exécuter après un court délai pour s'assurer que tout est chargé
    setTimeout(() => {
        addWhatsAppButtons();
        handleFicheClient();
    }, 500);
    
    // Observer les modifications du DOM pour ajouter les boutons aux nouveaux éléments
    const observer = new MutationObserver(() => {
        setTimeout(() => {
            addWhatsAppButtons();
            handleFicheClient();
        }, 200);
    });
    
    // Observer le document pour les changements
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
