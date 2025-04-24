/**
 * Intégration WhatsApp pour R-cavalier (version optimisée)
 * Ajoute des boutons d'appel WhatsApp UNIQUEMENT à côté des numéros de téléphone
 * Version 2.0 avec détection précise des numéros de téléphone
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    console.log('Chargement de l\'intégration WhatsApp optimisée v2.0...');
    
    /**
     * Vérifie si une chaîne de caractères est un numéro de téléphone valide
     * @param {string} text - Texte à vérifier
     * @returns {boolean} - Vrai si c'est un numéro de téléphone valide
     */
    function isValidPhoneNumber(text) {
        if (!text) return false;
        
        // Nettoyer le texte
        const cleaned = text.trim();
        
        // Vérifier si le texte est trop court pour être un numéro de téléphone
        if (cleaned.length < 8) return false;
        
        // Vérifier si le texte contient suffisamment de chiffres pour être un numéro
        const digits = cleaned.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 15) return false;
        
        // Vérifier si le texte ressemble à un numéro de téléphone français
        // Format: 0X XX XX XX XX ou +33 X XX XX XX XX
        const frPhoneRegex = /^(\+33|0)[1-9]([-. ]?\d{2}){4}$/;
        const intlPhoneRegex = /^\+[1-9]\d{1,3}([-. ]?\d{2,3}){2,5}$/;
        
        // Format sans espaces ni formatage (juste des chiffres)
        const rawDigitsRegex = /^\d{9,15}$/;
        
        // Vérifier si c'est un numéro de téléphone valide selon l'un des formats
        return frPhoneRegex.test(cleaned) || intlPhoneRegex.test(cleaned) || rawDigitsRegex.test(digits);
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
        console.log('Début de l\'analyse des numéros de téléphone...');
        
        // Supprimer d'abord tous les boutons WhatsApp existants
        // pour éviter les duplications
        document.querySelectorAll('.whatsapp-btn').forEach(btn => {
            btn.parentNode.removeChild(btn);
        });
        
        // Compteur pour le débogage
        let phoneNumbersFound = 0;
        let buttonsAdded = 0;
        
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
                        if (text.match(/\d/) && !sibling.classList.contains('whatsapp-btn')) {
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
                if (phoneNumber && isValidPhoneNumber(phoneNumber)) {
                    phoneNumbersFound++;
                    // Vérifier qu'il n'y a pas déjà un bouton
                    if (!phoneElement.nextElementSibling || !phoneElement.nextElementSibling.classList.contains('whatsapp-btn')) {
                        phoneElement.insertAdjacentElement('afterend', createWhatsAppButton(phoneNumber));
                        buttonsAdded++;
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
                if (valueElement && isValidPhoneNumber(valueElement.textContent)) {
                    phoneNumbersFound++;
                    if (!valueElement.querySelector('.whatsapp-btn')) {
                        valueElement.appendChild(createWhatsAppButton(valueElement.textContent));
                        buttonsAdded++;
                    }
                }
            }
        });
        
        // ÉTAPE 3: Traitement spécifique de la page client
        // Pour la fiche client, utiliser une approche plus compatible et plus précise
        
        // Détection spécifique des champs de téléphone dans la fiche client
        
        // 1. Détection dans les tableaux (structure de la page client)
        document.querySelectorAll('th').forEach(th => {
            if (th.textContent.trim() === 'Téléphone:') {
                // Trouver la cellule adjacente qui contient le numéro
                const tr = th.closest('tr');
                if (tr) {
                    const td = tr.querySelector('td');
                    if (td && td.textContent.trim() && !td.querySelector('.whatsapp-btn')) {
                        const phoneNumber = td.textContent.trim();
                        console.log('Numéro de téléphone trouvé dans tableau:', phoneNumber);
                        
                        // Ajouter le bouton WhatsApp même si le numéro ne correspond pas aux formats standards
                        // car nous sommes sûrs que c'est un numéro de téléphone
                        phoneNumbersFound++;
                        td.appendChild(createWhatsAppButton(phoneNumber));
                        buttonsAdded++;
                        console.log('Bouton WhatsApp ajouté au champ Téléphone dans tableau');
                    }
                }
            }
        });
        
        // 2. Détection dans les labels et strong
        document.querySelectorAll('strong, label').forEach(label => {
            if (label.textContent.trim() === 'Téléphone:') {
                // Trouver le texte adjacent qui contient le numéro de téléphone
                let phoneElement = label.nextElementSibling;
                while (phoneElement && !phoneElement.textContent.trim()) {
                    phoneElement = phoneElement.nextElementSibling;
                }
                
                if (phoneElement && phoneElement.textContent.trim() && !phoneElement.querySelector('.whatsapp-btn')) {
                    const phoneNumber = phoneElement.textContent.trim();
                    console.log('Numéro de téléphone trouvé après label:', phoneNumber);
                    
                    // Ajouter le bouton WhatsApp même si le numéro ne correspond pas aux formats standards
                    phoneNumbersFound++;
                    phoneElement.appendChild(createWhatsAppButton(phoneNumber));
                    buttonsAdded++;
                    console.log('Bouton WhatsApp ajouté au champ Téléphone après label');
                }
            }
        });
        
        // Recherche générale dans les lignes
        const rows = document.querySelectorAll('.row');
        rows.forEach(row => {
            // Vérifier si la ligne contient un label ou strong avec "Téléphone"
            const strongElements = row.querySelectorAll('strong');
            const labelElements = row.querySelectorAll('label');
            let hasPhoneLabel = false;
            
            // Vérifier les éléments strong
            for (let i = 0; i < strongElements.length; i++) {
                if (strongElements[i].textContent.includes('Téléphone')) {
                    hasPhoneLabel = true;
                    break;
                }
            }
            
            // Vérifier les éléments label si nécessaire
            if (!hasPhoneLabel) {
                for (let i = 0; i < labelElements.length; i++) {
                    if (labelElements[i].textContent.includes('Téléphone')) {
                        hasPhoneLabel = true;
                        break;
                    }
                }
            }
            
            // Si on a trouvé un label de téléphone, chercher les spans
            if (hasPhoneLabel) {
                const spans = row.querySelectorAll('span');
                spans.forEach(span => {
                    // Vérification stricte que le contenu est un numéro de téléphone valide
                    if (isValidPhoneNumber(span.textContent) && !span.querySelector('.whatsapp-btn')) {
                        phoneNumbersFound++;
                        span.appendChild(createWhatsAppButton(span.textContent));
                        buttonsAdded++;
                    }
                });
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
        
        // Afficher un message de débogage
        console.log(`WhatsApp: ${phoneNumbersFound} numéros de téléphone détectés, ${buttonsAdded} boutons ajoutés`);
    }
    
    // Exécuter la fonction principale
    addWhatsAppButtons();
    
    // Réexécuter la fonction si le DOM change (pour les contenus chargés dynamiquement)
    // Utiliser un MutationObserver pour détecter les changements dans le DOM
    const observer = new MutationObserver(function(mutations) {
        // Vérifier si les mutations concernent des éléments pertinents
        let shouldRefresh = false;
        
        mutations.forEach(function(mutation) {
            // Si des nœuds ont été ajoutés
            if (mutation.addedNodes.length) {
                shouldRefresh = true;
            }
        });
        
        if (shouldRefresh) {
            // Attendre un peu pour laisser le DOM se stabiliser
            setTimeout(addWhatsAppButtons, 500);
        }
    });
    
    // Observer le corps du document pour les changements
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
