/**
 * Solution simplifiée pour la bulle de suggestion
 * Version entièrement réécrite pour assurer le fonctionnement
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Version améliorée de Bubble-fix.js chargée");
    
    // Gestion du z-index pour les bulles
    let maxZIndex = 1000;
    
    // 1. Définir makeDraggable au niveau global avec gestion améliorée
    if (typeof window.makeDraggable !== 'function') {
        window.makeDraggable = function(element) {
            if (!element) return;
            
            let offsetX, offsetY, isDragging = false;
            element.style.position = 'fixed';
            element.style.zIndex = maxZIndex++;
            
            // Stocker la position initiale
            let storedPosition = localStorage.getItem('bubble-position-' + element.id);
            if (storedPosition) {
                let pos = JSON.parse(storedPosition);
                element.style.left = pos.left;
                element.style.top = pos.top;
            }
            
            element.addEventListener('mousedown', function(e) {
                // Ne pas déclencher le drag si on clique sur un contenu interactif
                if (e.target.closest('.bubble-content, button, a, input, select, .close-content-btn')) {
                    return;
                }
                
                isDragging = true;
                element.classList.add('dragging');
                element.style.zIndex = maxZIndex++;
                offsetX = e.clientX - element.getBoundingClientRect().left;
                offsetY = e.clientY - element.getBoundingClientRect().top;
                
                // Empêcher la sélection de texte pendant le déplacement
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                e.preventDefault();
                
                const newX = e.clientX - offsetX;
                const newY = e.clientY - offsetY;
                
                // Limiter à la fenêtre
                const maxX = window.innerWidth - element.offsetWidth;
                const maxY = window.innerHeight - element.offsetHeight;
                const boundedX = Math.max(0, Math.min(newX, maxX));
                const boundedY = Math.max(0, Math.min(newY, maxY));
                
                element.style.left = boundedX + 'px';
                element.style.top = boundedY + 'px';
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            });
            
            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    element.classList.remove('dragging');
                    
                    // Sauvegarder la position
                    try {
                        localStorage.setItem('bubbleX', element.style.left);
                        localStorage.setItem('bubbleY', element.style.top);
                    } catch(e) {
                        console.log("Impossible de sauvegarder la position");
                    }
                }
            });
            
            console.log("makeDraggable appliqué avec succès à l'élément", element.id || element.className);
        };
    }
    
    // 2. Définir createDraggableBubble au niveau global si elle n'existe pas
    if (typeof window.createDraggableBubble !== 'function') {
        window.createDraggableBubble = function() {
            // Supprimer si elle existe déjà
            const existingBubble = document.querySelector('.bubble-container');
            if (existingBubble) {
                existingBubble.style.display = 'block';
                return existingBubble;
            }
            
            // Créer le conteneur de la bulle
            const bubbleContainer = document.createElement('div');
            bubbleContainer.className = 'bubble-container';
            bubbleContainer.id = 'vehicules-suggeres-bubble';
            
            // Définir la position initiale, ou utiliser des valeurs stockées
            const savedX = localStorage.getItem('bubbleX');
            const savedY = localStorage.getItem('bubbleY');
            
            bubbleContainer.style.position = 'fixed';
            bubbleContainer.style.zIndex = '9999';
            
            if (savedX && savedY) {
                bubbleContainer.style.left = savedX;
                bubbleContainer.style.top = savedY;
            } else {
                bubbleContainer.style.right = '20px';
                bubbleContainer.style.bottom = '20px';
            }
            
            // Créer l'icône du véhicule
            const vehicleIcon = document.createElement('div');
            vehicleIcon.className = 'bubble-toggle vehicle-icon';
            vehicleIcon.style.width = '50px';
            vehicleIcon.style.height = '50px';
            vehicleIcon.style.borderRadius = '50%';
            vehicleIcon.style.backgroundColor = '#007bff';
            vehicleIcon.style.display = 'flex';
            vehicleIcon.style.justifyContent = 'center';
            vehicleIcon.style.alignItems = 'center';
            vehicleIcon.style.cursor = 'pointer';
            vehicleIcon.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
            vehicleIcon.innerHTML = '<i class="fas fa-truck" style="color: white; font-size: 24px;"></i>';
            
            bubbleContainer.appendChild(vehicleIcon);
            
            // Créer le contenu de la bulle
            const bubbleContent = document.createElement('div');
            bubbleContent.className = 'bubble-content';
            bubbleContent.style.position = 'absolute';
            bubbleContent.style.bottom = '60px';
            bubbleContent.style.right = '0';
            bubbleContent.style.width = '300px';
            bubbleContent.style.padding = '15px';
            bubbleContent.style.backgroundColor = 'white';
            bubbleContent.style.borderRadius = '5px';
            bubbleContent.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
            bubbleContent.style.display = 'none';
            bubbleContainer.appendChild(bubbleContent);
            
            // Ajouter au document
            document.body.appendChild(bubbleContainer);
            
            // Rendre la bulle déplaçable
            window.makeDraggable(bubbleContainer);
            
            // Ajouter un événement pour afficher/masquer le contenu au clic sur l'icône
            vehicleIcon.addEventListener('click', function() {
                if (bubbleContent.style.display === 'none' || bubbleContent.style.display === '') {
                    bubbleContent.style.display = 'block';
                    bubbleContent.classList.add('visible');
                    // Forcer le contenu à être visible
                    setTimeout(function() {
                        const topPosition = -bubbleContent.offsetHeight - 10;
                        bubbleContent.style.bottom = topPosition + 'px';
                    }, 10);
                } else {
                    bubbleContent.style.display = 'none';
                    bubbleContent.classList.remove('visible');
                }
            });
            
            return bubbleContainer;
        };
    }
    
    /**
     * Solution fusionnée pour afficher les informations dans la bulle existante
     * Exposée globalement pour permettre l'appel depuis transporteur-disponibilite.js
     */
    window.afficherInfoBulle = function(typeDemenagement) {
        console.log('Affichage des infos pour:', typeDemenagement);
        
        // Informations sur les véhicules selon le type de déménagement
        const vehiculesInfo = {
            "Déménagement d'appartement": {
                vehicules: [
                    { nom: "Fourgonnette (3m³)", desc: "Parfait pour un studio ou petit appartement" },
                    { nom: "Camionnette (8m³)", desc: "Idéal pour un appartement T1/T2" },
                    { nom: "Camion 12m³", desc: "Recommandé pour appartement T3/T4" }
                ],
                icone: "fa-building"
            },
            "Déménagement de maison": {
                vehicules: [
                    { nom: "Camion 20m³", desc: "Parfait pour une maison standard" },
                    { nom: "Camion 30m³", desc: "Idéal pour grande maison" },
                    { nom: "Camion 40m³", desc: "Pour très grande maison avec jardin" }
                ],
                icone: "fa-home"
            },
            "Déménagement d'entreprise": {
                vehicules: [
                    { nom: "Camion 30m³", desc: "Adapté aux petites entreprises" },
                    { nom: "Camion 40m³", desc: "Pour bureaux moyens à grands" },
                    { nom: "Semi-remorque", desc: "Pour grandes entreprises" }
                ],
                icone: "fa-briefcase"
            },
            "Déménagement de piano/objets lourds": {
                vehicules: [
                    { nom: "Camion avec hayon", desc: "Facilite le chargement des objets lourds" },
                    { nom: "Véhicule spécial piano", desc: "Équipé pour transport de piano" }
                ],
                icone: "fa-dolly"
            },
            "Déménagement international": {
                vehicules: [
                    { nom: "Camion 40m³", desc: "Pour déménagement international complet" },
                    { nom: "Semi-remorque", desc: "Pour grands volumes vers l'étranger" }
                ],
                icone: "fa-globe-europe"
            },
            "Déménagement local (< 50km)": {
                vehicules: [
                    { nom: "Fourgonnette (3m³)", desc: "Pour petits volumes en local" },
                    { nom: "Camionnette (8m³)", desc: "Volumes moyens en zone locale" },
                    { nom: "Camion 12m³", desc: "Volumes importants en local" }
                ],
                icone: "fa-map-marker-alt"
            },
            "Déménagement national (> 200km)": {
                vehicules: [
                    { nom: "Camion 30m³", desc: "Pour longues distances nationales" },
                    { nom: "Camion 40m³", desc: "Grand volume sur longue distance" }
                ],
                icone: "fa-flag"
            },
            "Déménagement régional (50-200km)": {
                vehicules: [
                    { nom: "Camion 20m³", desc: "Idéal pour distances régionales" },
                    { nom: "Camion 30m³", desc: "Grand volume en régional" }
                ],
                icone: "fa-map"
            },
            "Garde-meuble/Stockage": {
                vehicules: [
                    { nom: "Camionnette (8m³)", desc: "Pour petit stockage temporaire" },
                    { nom: "Camion 12m³", desc: "Stockage mobilier standard" },
                    { nom: "Camion 20m³", desc: "Pour grand volume de stockage" }
                ],
                icone: "fa-warehouse"
            }
        };
        
        // Informations par défaut si le type n'est pas trouvé
        const info = vehiculesInfo[typeDemenagement] || {
            vehicules: [
                { nom: "Fourgonnette (3m³)", desc: "Pour petits volumes" },
                { nom: "Camion 12m³", desc: "Pour volumes moyens" },
                { nom: "Camion 30m³", desc: "Pour grands volumes" }
            ],
            icone: "fa-truck"
        };
        
        // Supprimer les panneaux d'information existants
        document.querySelectorAll('.bubble-info-panel').forEach(p => p.remove());
        
        // Vérifier si une bulle de contenu existe déjà
        let bubbleContent = document.querySelector('.bubble-content');
        
        // Si la bulle de contenu n'existe pas, chercher la bulle flottante et créer le contenu
        if (!bubbleContent) {
            const bubbleToggle = document.querySelector('.bubble-toggle');
            if (bubbleToggle) {
                // Créer un conteneur parent pour la bulle s'il n'existe pas déjà
                let parentContainer = bubbleToggle.parentElement;
                if (!parentContainer.classList.contains('bubble-container')) {
                    // Créer un nouveau conteneur
                    const newContainer = document.createElement('div');
                    newContainer.className = 'bubble-container';
                    newContainer.style.position = 'fixed';
                    newContainer.style.bottom = '20px';
                    newContainer.style.right = '20px';
                    newContainer.style.zIndex = '9999';
                    
                    // Replacer la bulle toggle dans le nouveau conteneur
                    parentContainer.replaceChild(newContainer, bubbleToggle);
                    newContainer.appendChild(bubbleToggle);
                    parentContainer = newContainer;
                }
                
                // Créer un nouveau contenu de bulle
                bubbleContent = document.createElement('div');
                bubbleContent.className = 'bubble-content';
                bubbleContent.style.position = 'absolute';
                bubbleContent.style.bottom = '60px';
                bubbleContent.style.right = '0';
                bubbleContent.style.width = '300px';
                bubbleContent.style.padding = '15px';
                bubbleContent.style.backgroundColor = 'white';
                bubbleContent.style.borderRadius = '5px';
                bubbleContent.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
                bubbleContent.style.zIndex = '9999';
                
                // Ajouter la bulle de contenu au conteneur parent
                parentContainer.appendChild(bubbleContent);
            } else {
                // Si aucune bulle flottante n'existe, créer un panneau d'information autonome
                const infoPanel = document.createElement('div');
                infoPanel.className = 'bubble-info-panel';
                infoPanel.style.position = 'fixed';
                infoPanel.style.bottom = '70px';
                infoPanel.style.right = '20px';
                infoPanel.style.width = '300px';
                infoPanel.style.backgroundColor = 'white';
                infoPanel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
                infoPanel.style.borderRadius = '5px';
                infoPanel.style.padding = '15px';
                infoPanel.style.zIndex = '9999';
                
                document.body.appendChild(infoPanel);
                bubbleContent = infoPanel;
            }
        }
        
        // Effacer tout contenu existant
        bubbleContent.innerHTML = '';
        
        // Créer le bouton de fermeture rouge
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '5px';
        closeBtn.style.background = 'red';
        closeBtn.style.color = 'white';
        closeBtn.style.width = '24px';
        closeBtn.style.height = '24px';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.textAlign = 'center';
        closeBtn.style.lineHeight = '22px';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.zIndex = '10000';
        closeBtn.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
        
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            bubbleContent.style.display = 'none';
        });
        
        // Créer le contenu informatif avec un design amélioré
        const contentInfo = document.createElement('div');
        contentInfo.className = 'vehicle-recommendation-panel';
        
        // Ajouter le style directement dans le HTML si pas déjà présent
        if (!document.getElementById('bubble-styles')) {
            const style = document.createElement('style');
            style.id = 'bubble-styles';
            style.textContent = `
                .vehicle-recommendation-panel {
                    font-family: 'Segoe UI', Arial, sans-serif;
                }
                .recommendation-title {
                    margin-top: 8px;
                    margin-bottom: 12px;
                    font-weight: bold;
                    color: #0d6efd;
                    border-bottom: 1px solid #dee2e6;
                    padding-bottom: 8px;
                    display: flex;
                    align-items: center;
                }
                .recommendation-title i {
                    margin-right: 8px;
                }
                .recommended-vehicle {
                    background-color: #f8f9fa;
                    border-left: 3px solid #20c997;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    transition: all 0.3s;
                }
                .recommended-vehicle:hover {
                    background-color: #e9ecef;
                    transform: translateX(3px);
                }
                .vehicle-name {
                    font-weight: bold;
                    color: #212529;
                }
                .vehicle-desc {
                    color: #6c757d;
                    font-size: 0.9em;
                    margin-top: 2px;
                }
                .soon-available-title {
                    margin-top: 15px;
                    margin-bottom: 10px;
                    font-weight: bold;
                    color: #0d6efd;
                    display: flex;
                    align-items: center;
                }
                .soon-available-title i {
                    margin-right: 8px;
                }
                .soon-available-item {
                    background-color: #f8f9fa;
                    border-left: 3px solid #ffc107;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                }
                .tip-section {
                    margin-top: 15px;
                    padding: 8px 12px;
                    border-radius: 4px;
                    background-color: #e7f5ff;
                    color: #0c63e4;
                    display: flex;
                    align-items: center;
                }
                .tip-section i {
                    margin-right: 8px;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Titre avec icône
        let htmlContent = `
            <div class="recommendation-title">
                <i class="fas ${info.icone || 'fa-truck'}"></i> Véhicules recommandés pour ${typeDemenagement}
            </div>
        `;
        
        // Ajouter chaque véhicule recommandé
        info.vehicules.forEach(vehicule => {
            htmlContent += `
                <div class="recommended-vehicle">
                    <div class="vehicle-name">${vehicule.nom}</div>
                    <div class="vehicle-desc">${vehicule.desc}</div>
                </div>
            `;
        });
        
        // Astuce pour la sélection de transporteurs (sans section sur les transporteurs bientôt disponibles)
        htmlContent += `
            <div class="tip-section">
                <i class="fas fa-info-circle"></i> Maintenez la touche Ctrl pour sélectionner plusieurs transporteurs.
            </div>
        `;
        
        contentInfo.innerHTML = htmlContent;
        
        // Ajouter les éléments au contenu de la bulle
        bubbleContent.appendChild(closeBtn);
        bubbleContent.appendChild(contentInfo);
        
        // Afficher la bulle
        bubbleContent.style.display = 'block';
        bubbleContent.style.visibility = 'visible';
        
        console.log('Bulle fusionnée affichée avec succès');
    }
    
    // Gérer l'affichage lorsque le type de déménagement change
    document.addEventListener('change', function(e) {
        // Gérer à la fois type_de_demenagement et type_demenagement_id
        if (e.target && (e.target.id === 'type_de_demenagement' || e.target.id === 'type_demenagement_id')) {
            if (e.target.value) {
                let typeText = e.target.options[e.target.selectedIndex].text;
                console.log('Changement de type détecté:', typeText);
                afficherInfoBulle(typeText);
                
                // Déclencher la vérification des disponibilités si les dates sont remplies
                const dateDebut = document.getElementById('date_debut');
                const dateFin = document.getElementById('date_fin');
                if (dateDebut && dateFin && dateDebut.value && dateFin.value) {
                    const verifierBtn = document.getElementById('verifier-disponibilite');
                    if (verifierBtn) {
                        console.log('Déclencher vérification auto');
                        verifierBtn.click();
                    }
                }
            }
        }
    });
    
    // Gérer le clic sur "Voir les disponibilités"
    const btnDisponibilites = document.getElementById('show-calendar-btn');
    if (btnDisponibilites) {
        btnDisponibilites.addEventListener('click', function() {
            // Chercher en priorité type_demenagement_id (format base de données) puis type_de_demenagement (ancien format)
            const typeSelect = document.getElementById('type_demenagement_id') || document.getElementById('type_de_demenagement');
            if (typeSelect && typeSelect.value) {
                let typeText = typeSelect.options[typeSelect.selectedIndex].text;
                console.log('Clic sur disponibilités avec type:', typeText);
                setTimeout(() => afficherInfoBulle(typeText), 300);
                
                // Déclencher également la vérification des disponibilités
                const verifierBtn = document.getElementById('verifier-disponibilite');
                if (verifierBtn) {
                    setTimeout(() => verifierBtn.click(), 500);
                }
            }
        });
    }
    
    // Attacher un événement au bouton de vérification des disponibilités
    const verifierBtn = document.getElementById('verifier-disponibilite');
    if (verifierBtn) {
        verifierBtn.addEventListener('click', function() {
            // S'assurer que la vérification est bien effectuée puis afficher la bulle
            const typeSelect = document.getElementById('type_demenagement_id') || document.getElementById('type_de_demenagement');
            if (typeSelect && typeSelect.value) {
                let typeText = typeSelect.options[typeSelect.selectedIndex].text;
                setTimeout(() => afficherInfoBulle(typeText), 1000); // Délai pour s'assurer que la vérification a eu lieu
            }
        });
    }
    
    // Ajouter l'événement de clic sur la bulle flottante
    document.body.addEventListener('click', function(e) {
        // Si on clique sur l'icône de la bulle
        if (e.target.closest('.bubble-toggle') || e.target.closest('.vehicle-icon') || e.target.closest('[class*="fa-truck"]')) {
            // Chercher les deux formats possibles de sélecteur
            const typeSelect = document.getElementById('type_demenagement_id') || document.getElementById('type_de_demenagement');
            if (typeSelect && typeSelect.value) {
                let typeText = typeSelect.options[typeSelect.selectedIndex].text;
                console.log('Clic sur icône camion avec type détecté:', typeText);
                afficherInfoBulle(typeText);
                
                // Déclencher la vérification des disponibilités si les dates sont remplies
                const dateDebut = document.getElementById('date_debut');
                const dateFin = document.getElementById('date_fin');
                if (dateDebut && dateFin && dateDebut.value && dateFin.value) {
                    const verifierBtn = document.getElementById('verifier-disponibilite');
                    if (verifierBtn) {
                        setTimeout(() => verifierBtn.click(), 300);
                    }
                }
            } else {
                console.log('Clic sur icône camion sans type sélectionné');
                afficherInfoBulle("Déménagement standard");
            }
        }
        
        // Si on clique sur le bouton "Vérifier les disponibilités"
        if (e.target.closest('#verifier-disponibilite') || 
            e.target.closest('#verifier-disponibilites-btn') ||
            (e.target.tagName === 'BUTTON' && e.target.textContent.includes('disponibilités'))) {
            
            console.log('Clic détecté sur bouton de vérification');
            setTimeout(function() {
                const typeSelect = document.getElementById('type_demenagement_id') || document.getElementById('type_de_demenagement');
                if (typeSelect && typeSelect.value) {
                    let typeText = typeSelect.options[typeSelect.selectedIndex].text;
                    console.log('Affichage de la bulle après vérification pour:', typeText);
                    afficherInfoBulle(typeText);
                    
                    // Récupérer les véhicules sélectionnés
                    const transporteursSelect = document.getElementById('transporteurs');
                    if (transporteursSelect) {
                        // S'assurer que la sélection est visible dans la bulle
                        console.log('Transporteurs sélectionnés:', transporteursSelect.selectedOptions.length);
                    }
                }
            }, 1000); // Délai suffisant pour attendre la réponse AJAX
        }
    });
    
    // Attacher directement un gestionnaire d'événements à l'icône de camion
    setTimeout(function() {
        // Sélectionner toutes les icônes de camion possibles
        const iconeCamions = document.querySelectorAll('.bubble-toggle, .fa-truck, [class*="vehicle"]');
        iconeCamions.forEach(icone => {
            // S'assurer que l'icône est cliquable
            icone.style.cursor = 'pointer';
            
            // Supprimer les gestionnaires d'événements existants pour éviter les doublons
            const newIcon = icone.cloneNode(true);
            if (icone.parentNode) {
                icone.parentNode.replaceChild(newIcon, icone);
            }
            
            // Ajouter le nouveau gestionnaire d'événements
            newIcon.addEventListener('click', function(e) {
                e.stopPropagation();
                const typeSelect = document.getElementById('type_de_demenagement');
                if (typeSelect && typeSelect.value) {
                    let typeText = typeSelect.options[typeSelect.selectedIndex].text;
                    afficherInfoBulle(typeText);
                } else {
                    afficherInfoBulle("Déménagement standard");
                }
            });
        });
        
        // S'assurer que la bulle s'affiche automatiquement au chargement
        const typeSelect = document.getElementById('type_de_demenagement');
        if (typeSelect && typeSelect.value) {
            setTimeout(() => {
                afficherInfoBulle(typeSelect.options[typeSelect.selectedIndex].text);
                // S'assurer que la bulle est visible
                const bubbleContent = document.querySelector('.bubble-content, .bubble-info-panel');
                if (bubbleContent) {
                    bubbleContent.style.display = 'block';
                    bubbleContent.style.visibility = 'visible';
                }
            }, 200);
        }
    }, 500);
});
