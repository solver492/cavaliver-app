/**
 * Sélecteur de véhicules et vérification des disponibilités
 * Version 2.0 améliorée pour résoudre le problème de disparition des transporteurs
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    console.log('Chargement du sélecteur de véhicules v2.0');
    
    // Sauvegarde des options initiales
    let transporteursSauvegardes = [];
    
    // Références DOM
    const transporteursSelect = document.getElementById('transporteurs');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const btnShowCalendar = document.getElementById('show-calendar-btn');
    const btnVerifierDispo = document.getElementById('verifier-disponibilite');
    
    // Détection précoce des éléments
    console.log('Détection des éléments:');
    console.log('- Select transporteurs:', transporteursSelect ? 'trouvé' : 'manquant');
    console.log('- Select type déménagement:', typeDemenagementSelect ? 'trouvé' : 'manquant');
    console.log('- Bouton calendrier:', btnShowCalendar ? 'trouvé' : 'manquant');
    console.log('- Bouton vérification:', btnVerifierDispo ? 'trouvé' : 'manquant');
    
    // Sauvegarde initiale des transporteurs
    if (transporteursSelect && transporteursSelect.options.length > 0) {
        for (let i = 0; i < transporteursSelect.options.length; i++) {
            transporteursSauvegardes.push({
                value: transporteursSelect.options[i].value,
                text: transporteursSelect.options[i].textContent
            });
        }
        console.log('Options sauvegardées:', transporteursSauvegardes.length);
        
        // Réinitialiser tous les styles avant d'appliquer les nouveaux
        transporteursSelect.removeAttribute('style');
        
        // Augmenter le nombre d'éléments visibles pour en voir plus à la fois
        transporteursSelect.setAttribute('size', '10');
        
        // Forcer l'affichage en mode liste (pas en dropdown)
        transporteursSelect.style.width = '100%';
        transporteursSelect.style.minWidth = '100%';
        transporteursSelect.style.boxSizing = 'border-box';
        transporteursSelect.style.display = 'block';
        transporteursSelect.style.position = 'static';
        transporteursSelect.style.appearance = 'listbox';
        transporteursSelect.style.webkitAppearance = 'listbox';
        
        // Augmenter significativement la hauteur pour voir plus de transporteurs
        transporteursSelect.style.height = 'auto';
        transporteursSelect.style.minHeight = '400px';  // Hauteur augmentée
        transporteursSelect.style.maxHeight = '450px';  // Hauteur maximum augmentée
        
        // Style visuel amélioré
        transporteursSelect.style.padding = '15px 20px';
        transporteursSelect.style.margin = '0';
        transporteursSelect.style.border = '3px solid #0d6efd'; // Bordure plus épaisse
        transporteursSelect.style.borderRadius = '10px';       // Coins plus arrondis
        transporteursSelect.style.boxShadow = '0 0 30px rgba(13, 110, 253, 0.25)';
        
        // Amélioration de la typographie
        transporteursSelect.style.fontFamily = 'Arial, sans-serif';
        transporteursSelect.style.fontSize = '1.3rem';         // Police plus grande
        transporteursSelect.style.fontWeight = '400';          // Texte normal
        transporteursSelect.style.lineHeight = '2.0';          // Espacement vertical important
        transporteursSelect.style.letterSpacing = '0.5px';     // Espacement des lettres
        transporteursSelect.style.color = '#333333';
        
        // Assurer que la largeur est toujours maximale
        window.addEventListener('resize', function() {
            transporteursSelect.style.width = '100%';
        });
        
        // Style pour les options
        for (let i = 0; i < transporteursSelect.options.length; i++) {
            const option = transporteursSelect.options[i];
            option.style.padding = '15px 20px';  // Padding plus grand
            option.style.margin = '5px 0';       // Espacement vertical plus important
            option.style.borderRadius = '6px';   // Coins plus arrondis
            option.style.transition = 'all 0.3s ease';
            option.style.cursor = 'pointer';
            option.style.borderBottom = '1px solid #e9ecef';
            option.style.fontWeight = '500';     // Texte un peu plus épais
            option.style.letterSpacing = '0.3px'; // Meilleur espacement des lettres
            
            // Style par défaut pour chaque option
            if (!option.style.backgroundColor) {
                option.style.backgroundColor = '#ffffff';
                option.style.color = '#333333';
            }
            
            // Effet de survol
            option.addEventListener('mouseover', function() {
                if (!this.selected) {
                    this.style.backgroundColor = '#f1f8ff';
                    this.style.transform = 'translateX(5px)';
                }
            });
            
            option.addEventListener('mouseout', function() {
                if (!this.selected) {
                    this.style.backgroundColor = '#ffffff';
                    this.style.transform = 'translateX(0)';
                }
            });
        }
    }
    
    // Fonction pour restaurer les transporteurs qui ont été supprimés
    function restaurerTransporteurs() {
        // Vérifier si le select est vide alors qu'on a des options sauvegardées
        if (transporteursSelect && transporteursSelect.options.length === 0 && transporteursSauvegardes.length > 0) {
            console.log('Restauration des transporteurs...');
            transporteursSauvegardes.forEach(function(transporteur) {
                const option = document.createElement('option');
                option.value = transporteur.value;
                option.textContent = transporteur.text;
                transporteursSelect.appendChild(option);
            });
            console.log('Transporteurs restaurés avec succès!');
            
            // Surligner les transporteurs recommandés
            if (typeDemenagementSelect && typeDemenagementSelect.value) {
                mettreEnSurbrillanceTransporteursRecommandes();
            }
        }
    }
    
    // Fonction pour mettre en surbrillance les transporteurs recommandés selon le type de déménagement
    function mettreEnSurbrillanceTransporteursRecommandes() {
        if (!transporteursSelect || !typeDemenagementSelect) return;
        
        // Réinitialiser les styles
        for (let i = 0; i < transporteursSelect.options.length; i++) {
            const option = transporteursSelect.options[i];
            option.style.backgroundColor = '';
            option.style.color = '';
            option.style.fontWeight = '';
        }
        
        // Mapping des types de déménagement aux mots-clés de véhicules recommandés
        const typeId = typeDemenagementSelect.value;
        const typeLabel = typeDemenagementSelect.options[typeDemenagementSelect.selectedIndex]?.text || '';
        
        console.log('Recommandations pour:', typeLabel, '(ID:', typeId, ')');
        
        // Définir les mots-clés pour chaque type de déménagement
        const keywordsByType = {
            // Déménagement d'appartement
            "1": ["fourgon", "12m", "3m", "8m"],
            // Déménagement de maison
            "2": ["20m", "30m"],
            // Déménagement d'entreprise
            "3": ["30m", "40m", "semi"],
            // Piano/objets lourds
            "4": ["hayon", "piano"],
            // Déménagement international
            "5": ["40m", "semi"],
            // Déménagement local
            "6": ["fourgon", "12m"],
            // Déménagement national
            "7": ["30m", "40m"],
            // Déménagement régional
            "8": ["20m", "30m"],
            // Garde-meuble/Stockage
            "9": ["12m", "20m"]
        };
        
        // Si nous avons des mots-clés pour ce type
        const keywords = keywordsByType[typeId];
        if (keywords && keywords.length > 0) {
            let found = false;
            
            // Appliquer le style aux options correspondantes
            for (let i = 0; i < transporteursSelect.options.length; i++) {
                const option = transporteursSelect.options[i];
                const text = option.textContent.toLowerCase();
                
                for (const keyword of keywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        option.style.backgroundColor = '#d1e7dd';
                        option.style.color = '#0f5132';
                        option.style.fontWeight = 'bold';
                        found = true;
                        break;
                    }
                }
            }
            
            console.log('Transporteurs recommandés trouvés:', found);
        }
    }
    
    // Fonction pour afficher un calendrier simple
    function afficherCalendrier() {
        // Vérifier si le calendrier existe déjà
        let calendrierContainer = document.getElementById('calendrier-container');
        
        if (calendrierContainer) {
            // Basculer la visibilité
            calendrierContainer.style.display = calendrierContainer.style.display === 'none' ? 'block' : 'none';
            return;
        }
        
        // Créer le conteneur du calendrier
        calendrierContainer = document.createElement('div');
        calendrierContainer.id = 'calendrier-container';
        calendrierContainer.className = 'mt-3 p-3 border rounded bg-white shadow';
        calendrierContainer.style.position = 'relative';
        
        // Ajouter un titre
        const titre = document.createElement('h5');
        titre.innerHTML = '<i class="fas fa-calendar-alt"></i> Calendrier des disponibilités';
        calendrierContainer.appendChild(titre);
        
        // Ajouter un bouton de fermeture
        const btnFermer = document.createElement('button');
        btnFermer.type = 'button';
        btnFermer.className = 'btn-close';
        btnFermer.style.position = 'absolute';
        btnFermer.style.top = '10px';
        btnFermer.style.right = '10px';
        btnFermer.addEventListener('click', function() {
            calendrierContainer.style.display = 'none';
        });
        calendrierContainer.appendChild(btnFermer);
        
        // Créer une grille de calendrier simple
        const grille = document.createElement('div');
        grille.style.display = 'grid';
        grille.style.gridTemplateColumns = 'repeat(7, 1fr)';
        grille.style.gap = '2px';
        
        // Jours de la semaine
        const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        jours.forEach(function(jour) {
            const jourElement = document.createElement('div');
            jourElement.textContent = jour;
            jourElement.style.padding = '8px';
            jourElement.style.textAlign = 'center';
            jourElement.style.fontWeight = 'bold';
            jourElement.style.backgroundColor = '#e9ecef';
            jourElement.style.border = '1px solid #dee2e6';
            grille.appendChild(jourElement);
        });
        
        // Générer le calendrier du mois actuel
        const aujourdhui = new Date();
        const jourActuel = aujourdhui.getDate();
        
        // Générer 30 jours à partir d'aujourd'hui
        for (let i = 1; i <= 30; i++) {
            const jour = document.createElement('div');
            jour.textContent = i;
            jour.style.padding = '8px';
            jour.style.textAlign = 'center';
            jour.style.border = '1px solid #dee2e6';
            jour.style.cursor = 'pointer';
            
            // Marquer le jour actuel
            if (i === jourActuel) {
                jour.style.fontWeight = 'bold';
                jour.style.border = '2px solid #0d6efd';
            }
            
            // Pour l'exemple, rendre certains jours disponibles ou non
            if (Math.random() > 0.3) {
                jour.style.backgroundColor = '#d1e7dd';
                jour.style.color = '#0f5132';
                jour.classList.add('jour-disponible');
            } else {
                jour.style.backgroundColor = '#f8d7da';
                jour.style.color = '#842029';
                jour.style.cursor = 'not-allowed';
            }
            
            // Ajouter un événement au clic
            jour.addEventListener('click', function() {
                if (jour.classList.contains('jour-disponible')) {
                    // Fermer le calendrier
                    calendrierContainer.style.display = 'none';
                    
                    // Simuler un test de disponibilité
                    if (btnVerifierDispo) {
                        btnVerifierDispo.click();
                    }
                }
            });
            
            grille.appendChild(jour);
        }
        
        calendrierContainer.appendChild(grille);
        
        // Ajouter une légende
        const legende = document.createElement('div');
        legende.className = 'd-flex justify-content-center mt-3 gap-3';
        legende.innerHTML = `
            <div><span style="display:inline-block; width:15px; height:15px; background-color:#d1e7dd; border:1px solid #dee2e6;"></span> Disponible</div>
            <div><span style="display:inline-block; width:15px; height:15px; background-color:#f8d7da; border:1px solid #dee2e6;"></span> Indisponible</div>
            <div><span style="display:inline-block; width:15px; height:15px; border:2px solid #0d6efd;"></span> Aujourd'hui</div>
        `;
        calendrierContainer.appendChild(legende);
        
        // Insérer le calendrier après le bouton
        if (btnShowCalendar && btnShowCalendar.parentNode) {
            btnShowCalendar.parentNode.appendChild(calendrierContainer);
        }
    }
    
    // Vérification périodique pour s'assurer que le select n'est pas vidé
    setInterval(restaurerTransporteurs, 300);
    
    // Écouteurs d'événements
    if (btnShowCalendar) {
        btnShowCalendar.addEventListener('click', function() {
            console.log('Clic sur bouton voir les disponibilités');
            afficherCalendrier();
        });
    }
    
    if (btnVerifierDispo) {
        btnVerifierDispo.addEventListener('click', function() {
            console.log('Clic sur bouton vérifier les disponibilités');
            setTimeout(mettreEnSurbrillanceTransporteursRecommandes, 100);
        });
    }
    
    if (typeDemenagementSelect) {
        typeDemenagementSelect.addEventListener('change', function() {
            console.log('Changement de type de déménagement:', this.options[this.selectedIndex]?.text);
            setTimeout(mettreEnSurbrillanceTransporteursRecommandes, 100);
        });
    }
    
    // Exécuter immédiatement si un type est déjà sélectionné
    if (typeDemenagementSelect && typeDemenagementSelect.value) {
        mettreEnSurbrillanceTransporteursRecommandes();
    }
    
    // Créer un calendrier
    function createCalendar() {
        // Vérifier si le calendrier existe déjà
        let calendarContainer = document.getElementById('calendar-container');
        if (calendarContainer) {
            calendarContainer.style.display = 'block';
            return calendarContainer;
        }
        
        // Créer le container
        calendarContainer = document.createElement('div');
        calendarContainer.id = 'calendar-container';
        calendarContainer.className = 'border rounded p-3 mt-3 bg-white shadow';
        calendarContainer.style.position = 'relative';
        
        // Ajouter un bouton de fermeture
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close position-absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '10px';
        closeBtn.addEventListener('click', function() {
            calendarContainer.style.display = 'none';
        });
        
        // Titre du calendrier
        const title = document.createElement('h5');
        title.className = 'mb-3';
        title.innerHTML = '<i class="fas fa-calendar-alt"></i> Calendrier des disponibilités';
        
        // Corps du calendrier (exemple simplifié)
        const calendarBody = document.createElement('div');
        calendarBody.className = 'calendar-body';
        calendarBody.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-outline-secondary prev-month"><i class="fas fa-chevron-left"></i></button>
                <h6 class="mb-0 month-title">Avril 2025</h6>
                <button class="btn btn-sm btn-outline-secondary next-month"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="calendar-grid"></div>
        `;
        
        // Ajouter du CSS pour le calendrier
        const style = document.createElement('style');
        style.textContent = `
            .calendar-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
            }
            .calendar-day {
                padding: 8px;
                text-align: center;
                border: 1px solid #dee2e6;
                background-color: #f8f9fa;
                cursor: pointer;
                transition: all 0.2s;
            }
            .calendar-day:hover {
                background-color: #e9ecef;
                transform: scale(1.05);
            }
            .calendar-day.available {
                background-color: #d1e7dd;
                color: #0f5132;
            }
            .calendar-day.unavailable {
                background-color: #f8d7da;
                color: #842029;
                cursor: not-allowed;
            }
            .calendar-day.today {
                font-weight: bold;
                border: 2px solid #0d6efd;
            }
            .calendar-day-header {
                font-weight: bold;
                background-color: #e9ecef;
                padding: 8px;
                text-align: center;
                border: 1px solid #dee2e6;
            }
        `;
        document.head.appendChild(style);
        
        // Générer la grille du calendrier
        const gridContainer = calendarBody.querySelector('.calendar-grid');
        
        // Jours de la semaine
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            gridContainer.appendChild(dayHeader);
        });
        
        // Générer le mois (exemple simplifié)
        const today = new Date();
        const daysInMonth = 31;
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = i;
            
            // Marquer le jour actuel
            if (i === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Marquer aléatoirement des jours comme disponibles ou non (pour l'exemple)
            if (Math.random() > 0.3) {
                dayElement.classList.add('available');
            } else {
                dayElement.classList.add('unavailable');
            }
            
            dayElement.addEventListener('click', function() {
                if (dayElement.classList.contains('available')) {
                    // Définir les dates
                    const selectedDate = new Date(today.getFullYear(), today.getMonth(), i);
                    if (dateDebutInput && !dateDebutInput.value) {
                        dateDebutInput.valueAsDate = selectedDate;
                    }
                    
                    // Vérifier les disponibilités
                    verifierDisponibilites();
                    
                    // Fermer le calendrier
                    setTimeout(() => {
                        calendarContainer.style.display = 'none';
                    }, 300);
                }
            });
            
            gridContainer.appendChild(dayElement);
        }
        
        // Légende
        const legend = document.createElement('div');
        legend.className = 'd-flex justify-content-around mt-3';
        legend.innerHTML = `
            <div><span class="badge bg-success me-1">■</span> Disponible</div>
            <div><span class="badge bg-danger me-1">■</span> Indisponible</div>
            <div><span class="badge bg-primary me-1">■</span> Aujourd'hui</div>
        `;
        
        // Assembler
        calendarContainer.appendChild(closeBtn);
        calendarContainer.appendChild(title);
        calendarContainer.appendChild(calendarBody);
        calendarContainer.appendChild(legend);
        
        // Insérer dans le DOM - utiliser un sélecteur plus robuste
        const container = document.querySelector('.transporteurs, .widget-transport-module, .transporteur-widget-container');
        
        // Si aucun conteneur spécifique n'est trouvé, utiliser le body comme fallback
        if (container) {
            container.appendChild(calendarContainer);
        } else {
            console.log('Conteneur des transporteurs non trouvé, utilisation du body comme fallback');
            document.body.appendChild(calendarContainer);
            // Ajuster le style pour un affichage modal au centre de l'écran
            calendarContainer.style.position = 'fixed';
            calendarContainer.style.top = '50%';
            calendarContainer.style.left = '50%';
            calendarContainer.style.transform = 'translate(-50%, -50%)';
            calendarContainer.style.zIndex = '1050';
            calendarContainer.style.maxHeight = '90vh';
            calendarContainer.style.overflowY = 'auto';
        }
        
        return calendarContainer;
    }
    
    // Fonction pour mettre en surbrillance les véhicules recommandés
    function highlightRecommendedVehicles() {
        console.log('Mise en surbrillance des véhicules recommandés');
        if (!typeDemenagementSelect || !transporteursSelect) return;
        
        // Réinitialiser les styles
        for (let i = 0; i < transporteursSelect.options.length; i++) {
            const option = transporteursSelect.options[i];
            option.classList.remove('recommended');
            option.style.backgroundColor = '';
            option.style.fontWeight = '';
            option.style.color = '';
        }
        
        // Obtenir le type de déménagement
        const typeId = typeDemenagementSelect.value;
        if (!typeId) return;
        
        // Type de véhicule recommandé selon le type de déménagement
        const recommendedVehicles = {
            // Appartement
            "1": ["fourgonnet", "3m", "8m", "12m"],
            // Maison
            "2": ["20m", "30m", "40m"],
            // Entreprise
            "3": ["30m", "40m", "semi"],
            // Piano/objets lourds
            "4": ["hayon", "piano"],
            // International
            "5": ["40m", "semi"],
            // Local
            "6": ["fourgonnet", "12m"],
            // National
            "7": ["30m", "40m"],
            // Régional
            "8": ["20m", "30m"],
            // Stockage
            "9": ["12m", "20m"]
        };
        
        // Appliquer le style si le type est reconnu
        if (recommendedVehicles[typeId]) {
            const keywords = recommendedVehicles[typeId];
            
            for (let i = 0; i < transporteursSelect.options.length; i++) {
                const option = transporteursSelect.options[i];
                const text = option.textContent.toLowerCase();
                
                for (const keyword of keywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        option.classList.add('recommended');
                        option.style.backgroundColor = '#d1e7dd';
                        option.style.fontWeight = 'bold';
                        option.style.color = '#0f5132';
                        break;
                    }
                }
            }
            
            // Sélectionner automatiquement le premier véhicule recommandé
            if (transporteursSelect.selectedOptions.length === 0) {
                for (let i = 0; i < transporteursSelect.options.length; i++) {
                    if (transporteursSelect.options[i].classList.contains('recommended')) {
                        transporteursSelect.options[i].selected = true;
                        break;
                    }
                }
            }
        }
        
        // Mettre à jour le compteur
        updateTransporteurCount();
    }
    
    // Mettre à jour le compteur de transporteurs
    function updateTransporteurCount() {
        const countElement = document.querySelector('.selected-transporteurs-count');
        if (!countElement) return;
        
        const count = transporteursSelect.selectedOptions.length;
        countElement.textContent = count + ' transporteur(s) sélectionné(s)';
        
        if (count === 0) {
            countElement.textContent += ' - Aucun transporteur sélectionné';
            countElement.classList.remove('text-success');
            countElement.classList.add('text-danger');
        } else {
            countElement.classList.remove('text-danger');
            countElement.classList.add('text-success');
        }
    }
    
    // Vérifier les disponibilités
    function verifierDisponibilites() {
        console.log('Vérification des disponibilités...');
        
        // Initialiser les éléments du DOM
        const dateDebutInput = document.getElementById('date_debut');
        const dateFinInput = document.getElementById('date_fin');
        const transporteursSelect = document.getElementById('transporteurs');
        
        // S'assurer que les dates sont définies
        if (dateDebutInput && !dateDebutInput.value) {
            const today = new Date();
            dateDebutInput.valueAsDate = today;
        }
        
        if (dateFinInput && !dateFinInput.value) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateFinInput.valueAsDate = tomorrow;
        }
        
        // Effet visuel pendant le chargement
        if (transporteursSelect) {
            transporteursSelect.style.opacity = '0.5';
            
            // Ajouter un indicateur de chargement
            let loadingIndicator = document.getElementById('loading-indicator');
            if (!loadingIndicator) {
                loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loading-indicator';
                loadingIndicator.className = 'text-center mt-2';
                loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement des véhicules disponibles...';
                transporteursSelect.parentNode.insertBefore(loadingIndicator, transporteursSelect.nextSibling);
            } else {
                loadingIndicator.style.display = 'block';
            }
            
            // Simuler un délai de chargement (normalement ce serait un appel AJAX)
            setTimeout(() => {
                // Fin du chargement
                transporteursSelect.style.opacity = '1';
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Mettre en surbrillance les véhicules recommandés
                highlightRecommendedVehicles();
                
                // Afficher les infos dans la bulle
                if (typeof window.afficherInfoBulle === 'function' && typeDemenagementSelect) {
                    const typeText = typeDemenagementSelect.options[typeDemenagementSelect.selectedIndex].text;
                    window.afficherInfoBulle(typeText);
                }
            }, 800);
        }
    }
    
    // Gérer le clic sur "Voir les disponibilités"
    if (btnShowCalendar) {
        btnShowCalendar.addEventListener('click', function() {
            console.log('Clic sur Voir les disponibilités');
            createCalendar();
        });
    }
    
    // Gérer le clic sur "Vérifier les disponibilités"
    if (btnVerifierDispo) {
        btnVerifierDispo.addEventListener('click', function() {
            console.log('Clic sur Vérifier les disponibilités');
            verifierDisponibilites();
        });
    }
    
    // Gérer le changement de type de déménagement
    if (typeDemenagementSelect) {
        typeDemenagementSelect.addEventListener('change', function() {
            console.log('Changement de type de déménagement:', this.options[this.selectedIndex].text);
            
            // Vérifier automatiquement les disponibilités
            setTimeout(() => {
                verifierDisponibilites();
            }, 100);
        });
    }
    
    // Gérer le changement de sélection des transporteurs
    if (transporteursSelect) {
        transporteursSelect.addEventListener('change', function() {
            updateTransporteurCount();
        });
    }
    
    // Initialisation
    console.log('Initialisation terminée');
    
    // Vérifier si un type est déjà sélectionné
    if (typeDemenagementSelect && typeDemenagementSelect.value) {
        // Mettre en surbrillance les véhicules recommandés
        setTimeout(() => {
            highlightRecommendedVehicles();
        }, 500);
    }
});
