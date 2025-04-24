/**
 * Gestion de la disponibilité des transporteurs pour Cavalier Déménagement
 */

document.addEventListener('DOMContentLoaded', function() {
    // Éléments du formulaire
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    const transporteursSelect = document.getElementById('transporteurs');
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const verifierDisponibiliteBtn = document.getElementById('verifier-disponibilite');
    const prestationIdInput = document.getElementById('prestation_id');
    const vehiculesSuggeresTextarea = document.getElementById('vehicules_suggeres');
    
    if (!dateDebutInput || !dateFinInput || !transporteursSelect) {
        // Ne pas exécuter si nous ne sommes pas sur la page de formulaire
        return;
    }
    
    // Créer le bouton de vérification s'il n'existe pas déjà
    if (!verifierDisponibiliteBtn) {
        const container = transporteursSelect.parentElement;
        const btn = document.createElement('button');
        btn.id = 'verifier-disponibilite';
        btn.type = 'button';
        btn.className = 'btn btn-info btn-sm mt-2';
        btn.textContent = 'Vérifier les disponibilités';
        container.appendChild(btn);
    }
    
    // Container pour afficher les transporteurs bientôt disponibles
    let soonAvailableContainer = document.getElementById('soon-available-container');
    if (!soonAvailableContainer) {
        soonAvailableContainer = document.createElement('div');
        soonAvailableContainer.id = 'soon-available-container';
        soonAvailableContainer.className = 'mt-3 p-3 border rounded bg-light d-none';
        soonAvailableContainer.innerHTML = '<h5 class="mb-3">Transporteurs bientôt disponibles</h5><div id="soon-available-list"></div>';
        
        // Ajouter le container après le select des transporteurs
        transporteursSelect.parentElement.appendChild(soonAvailableContainer);
    }
    
    // Variable globale pour indiquer qu'une vérification est en cours
    let verificationEnCours = false;
    
    // Exposer globalement la fonction pour qu'elle soit accessible par d'autres scripts
    window.verifierDisponibiliteTransporteurs = function() {
        verifierDisponibilite();
    };
    
    // Fonction pour vérifier la disponibilité
    function verifierDisponibilite() {
        // Éviter les vérifications multiples simultanées
        if (verificationEnCours) {
            console.log('Vérification déjà en cours, ignorant cette demande');
            return;
        }
        
        // Définir dates par défaut si elles sont vides
        if (!dateDebutInput.value) {
            const aujourdhui = new Date();
            dateDebutInput.valueAsDate = aujourdhui;
        }
        
        if (!dateFinInput.value) {
            const demain = new Date();
            demain.setDate(demain.getDate() + 1);
            dateFinInput.valueAsDate = demain;
        }
        
        const dateDebut = dateDebutInput.value;
        const dateFin = dateFinInput.value;
        const typeDemenagement = typeDemenagementSelect ? typeDemenagementSelect.value : '';
        
        if (!dateDebut || !dateFin) {
            alert('Veuillez sélectionner les dates de début et de fin');
            return;
        }
        
        console.log('Vérification des disponibilités avec le type:', typeDemenagement);
        
        // Préparer les données
        const formData = new FormData();
        formData.append('date_debut', dateDebut);
        formData.append('date_fin', dateFin);
        
        // Ajouter l'ID de prestation si on est en mode édition
        const prestationId = prestationIdInput ? prestationIdInput.value : '';
        if (prestationId) {
            formData.append('prestation_id', prestationId);
        }
        
        // Ajouter le type de déménagement si disponible
        if (typeDemenagement) {
            formData.append('type_demenagement_id', typeDemenagement);
        }
        
        // Afficher un indicateur de chargement
        document.body.style.cursor = 'wait';
        verificationEnCours = true;
        
        // S'assurer que le select des transporteurs est visible
        if (transporteursSelect) {
            transporteursSelect.style.opacity = '0.5';
            const loadingMsg = document.createElement('div');
            loadingMsg.id = 'loading-transporteurs';
            loadingMsg.className = 'text-primary mt-2';
            loadingMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement des disponibilités...';
            transporteursSelect.parentElement.appendChild(loadingMsg);
        }
        
        // Récupérer le jeton CSRF
        const csrfToken = document.querySelector('input[name="csrf_token"]')?.value;
        if (csrfToken) {
            formData.append('csrf_token', csrfToken);
        }
        
        // Faire la requête AJAX
        fetch('/prestations/check-disponibilite', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la vérification des disponibilités');
            }
            return response.json();
        })
        .then(data => {
            console.log('Disponibilités reçues:', data);
            // Mettre à jour le sélecteur de transporteurs et afficher les recommandations
            updateTransporteurSelect(data);
            
            // Déclencher un événement personnalisé pour indiquer que les transporteurs ont été mis à jour
            const event = new CustomEvent('transporteursUpdated', { detail: data });
            document.dispatchEvent(event);
            
            // Déclencher l'affichage de la bulle si la fonction existe
            if (typeof window.afficherInfoBulle === 'function' && typeDemenagementSelect) {
                const typeText = typeDemenagementSelect.options[typeDemenagementSelect.selectedIndex].text;
                setTimeout(() => window.afficherInfoBulle(typeText), 500);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Une erreur est survenue lors de la vérification des disponibilités');
        })
        .finally(() => {
            document.body.style.cursor = 'default';
            verificationEnCours = false;
            
            // Restaurer l'apparence du select
            if (transporteursSelect) {
                transporteursSelect.style.opacity = '1';
                const loadingMsg = document.getElementById('loading-transporteurs');
                if (loadingMsg) {
                    loadingMsg.remove();
                }
            }
        });
    }
    
    // Mettre à jour le select des transporteurs avec les informations de disponibilité
    function updateTransporteurSelect(data) {
        // Extraction des données
        const transporteurs = data.transporteurs || [];
        const soonAvailable = data.soon_available || [];
        const vehiculesRecommandes = data.vehicules_recommandes || [];
        
        // Conserver les valeurs sélectionnées actuellement
        const selectedValues = Array.from(transporteursSelect.selectedOptions).map(opt => opt.value);
        
        // Vider et reconstruire les options
        transporteursSelect.innerHTML = '';
        
        // Créer un groupe pour les transporteurs avec véhicules adaptés et disponibles
        const groupeRecommandes = document.createElement('optgroup');
        groupeRecommandes.label = 'Recommandés et disponibles';
        
        // Créer un groupe pour les autres transporteurs disponibles
        const groupeDisponibles = document.createElement('optgroup');
        groupeDisponibles.label = 'Autres transporteurs disponibles';
        
        // Créer un groupe pour les transporteurs indisponibles
        const groupeIndisponibles = document.createElement('optgroup');
        groupeIndisponibles.label = 'Transporteurs indisponibles';
        
        // Classer les transporteurs dans les groupes appropriés
        transporteurs.forEach(transporteur => {
            const option = document.createElement('option');
            option.value = transporteur.id;
            
            // Déterminer si le transporteur a un véhicule adapté
            const iconeVehicule = transporteur.vehicule_adapte ? '🚚' : '🚗';
            
            // Afficher le statut de disponibilité
            const disponibiliteStatus = transporteur.disponible ? 
                '✅ Disponible' : `❌ Indisponible (jusqu'au ${transporteur.prochaine_disponibilite || 'N/A'})`;
            
            option.textContent = `${iconeVehicule} ${transporteur.nom} ${transporteur.prenom} - ${transporteur.type_vehicule} - ${disponibiliteStatus}`;
            
            // Ajouter une classe pour le style visuel
            if (!transporteur.disponible) {
                option.classList.add('transporteur-indisponible');
                groupeIndisponibles.appendChild(option);
            } else if (transporteur.vehicule_adapte) {
                option.classList.add('transporteur-recommande');
                groupeRecommandes.appendChild(option);
            } else {
                groupeDisponibles.appendChild(option);
            }
            
            // Restaurer la sélection si elle était déjà sélectionnée
            if (selectedValues.includes(transporteur.id.toString())) {
                option.selected = true;
            }
        });
        
        // Ajouter les groupes au select s'ils contiennent des options
        if (groupeRecommandes.children.length > 0) {
            transporteursSelect.appendChild(groupeRecommandes);
        }
        
        if (groupeDisponibles.children.length > 0) {
            transporteursSelect.appendChild(groupeDisponibles);
        }
        
        if (groupeIndisponibles.children.length > 0) {
            transporteursSelect.appendChild(groupeIndisponibles);
        }
        
        // Afficher les transporteurs bientôt disponibles
        updateSoonAvailableList(soonAvailable);
        
        // Afficher les véhicules recommandés dans la zone de texte si disponible
        updateVehiculesRecommandes(vehiculesRecommandes);
        
        // Afficher un message
        alert('Disponibilités des transporteurs mises à jour!');
    }
    
    // Fonction pour afficher les transporteurs bientôt disponibles - DÉSACTIVÉE
    function updateSoonAvailableList(soonAvailable) {
        // Ne rien faire - Cette fonction est désactivée pour ne plus afficher ce panneau
        // Log pour debugging
        console.log('Affichage des transporteurs bientôt disponibles désactivé');
        
        // Forcer la suppression de tout conteneur existant
        const containers = document.querySelectorAll('#soon-available-container, [id*="soon-available"], h5:contains("Transporteurs bientôt disponibles"), .card:has(h5:contains("Transporteurs bientôt disponibles"))');
        containers.forEach(container => {
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            } else if (container) {
                container.style.display = 'none';
                container.style.visibility = 'hidden';
            }
        });
        
        // Supprimer aussi les éléments avec la classe card contenant ces titres
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const title = card.querySelector('h4, h5');
            if (title && title.textContent && title.textContent.includes('Transporteurs bientôt disponibles')) {
                if (card.parentNode) {
                    card.parentNode.removeChild(card);
                } else {
                    card.style.display = 'none';
                    card.style.visibility = 'hidden';
                }
            }
        });
        
        // Supprimer toutes les sections avec cette classe
        document.querySelectorAll('.transporteurs-bientot-disponibles').forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    }
    
    // Mettre à jour la liste des véhicules recommandés dans la zone de texte
    function updateVehiculesRecommandes(vehiculesRecommandes) {
        if (!vehiculesSuggeresTextarea) return;
        
        let message = 'Véhicules recommandés pour ce type de déménagement :\n';
        
        if (vehiculesRecommandes.length === 0) {
            message += '- Aucun type de véhicule recommandé\n';
        } else {
            vehiculesRecommandes.forEach(vehicule => {
                message += `- ${vehicule.nom}${vehicule.capacite ? ' (' + vehicule.capacite + ')' : ''}\n`;
            });
        }
        
        vehiculesSuggeresTextarea.value = message;
    }
    
    // Ajouter un calendrier à afficher pour le bouton "Voir les disponibilités"
    function afficherCalendrier() {
        // Vérifier si le container de calendrier existe déjà
        let calendarContainer = document.getElementById('availability-calendar-container');
        
        // S'il n'existe pas, le créer
        if (!calendarContainer) {
            calendarContainer = document.createElement('div');
            calendarContainer.id = 'availability-calendar-container';
            calendarContainer.className = 'calendar-container mt-3 p-3 border rounded bg-white';
            calendarContainer.style.position = 'relative';
            calendarContainer.style.zIndex = '999';
            
            // Créer le bouton de fermeture
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'btn-close position-absolute';
            closeBtn.style.top = '10px';
            closeBtn.style.right = '10px';
            closeBtn.addEventListener('click', function() {
                calendarContainer.style.display = 'none';
            });
            
            // Créer le titre
            const title = document.createElement('h5');
            title.className = 'mb-3';
            title.innerHTML = '<i class="fas fa-calendar-alt"></i> Calendrier des disponibilités';
            
            // Créer la grille de calendrier (exemple simplié)
            const calendarGrid = document.createElement('div');
            calendarGrid.className = 'calendar-grid';
            
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
                }
                .calendar-day.available {
                    background-color: #d1e7dd;
                    color: #0f5132;
                }
                .calendar-day.unavailable {
                    background-color: #f8d7da;
                    color: #842029;
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
                .legend {
                    display: flex;
                    justify-content: center;
                    margin-top: 15px;
                    gap: 15px;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    font-size: 0.9em;
                }
                .legend-color {
                    width: 15px;
                    height: 15px;
                    margin-right: 5px;
                    border: 1px solid #dee2e6;
                }
            `;
            document.head.appendChild(style);
            
            // Entêtes des jours de la semaine
            const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            days.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day-header';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });
            
            // Générer 30 jours (4 semaines + quelques jours)
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const day = new Date();
                day.setDate(today.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                if (i === 0) dayElement.classList.add('today');
                
                // Générer aléatoirement des jours disponibles et indisponibles pour l'exemple
                if (Math.random() > 0.3) {
                    dayElement.classList.add('available');
                } else {
                    dayElement.classList.add('unavailable');
                }
                
                dayElement.textContent = day.getDate();
                calendarGrid.appendChild(dayElement);
            }
            
            // Créer une légende
            const legend = document.createElement('div');
            legend.className = 'legend';
            legend.innerHTML = `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #d1e7dd;"></div>
                    <span>Disponible</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #f8d7da;"></div>
                    <span>Indisponible</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #f8f9fa; border: 2px solid #0d6efd;"></div>
                    <span>Aujourd'hui</span>
                </div>
            `;
            
            // Lier l'action sur les jours disponibles
            calendarGrid.addEventListener('click', function(e) {
                if (e.target.classList.contains('calendar-day') && e.target.classList.contains('available')) {
                    // Lorsqu'on clique sur un jour disponible, on déclenche la vérification des disponibilités
                    verifierDisponibilite();
                    
                    // et on masque le calendrier
                    setTimeout(() => {
                        calendarContainer.style.display = 'none';
                    }, 500);
                }
            });
            
            // Assembler les éléments
            calendarContainer.appendChild(closeBtn);
            calendarContainer.appendChild(title);
            calendarContainer.appendChild(calendarGrid);
            calendarContainer.appendChild(legend);
            
            // Ajouter au DOM après le bouton de vérification
            const buttonContainer = document.querySelector('#show-calendar-btn').parentElement;
            buttonContainer.appendChild(calendarContainer);
        }
        
        // Afficher ou masquer le calendrier
        calendarContainer.style.display = calendarContainer.style.display === 'none' ? 'block' : 'none';
    }
    
    // Fonction pour mettre en évidence les transporteurs recommandés selon le type
    function highlightRecommendedTransporters() {
        if (!typeDemenagementSelect || !transporteursSelect) return;
        
        // Réinitialiser tous les styles des options
        for (let i = 0; i < transporteursSelect.options.length; i++) {
            transporteursSelect.options[i].classList.remove('transporteur-recommande');
        }
        
        // Obtenir l'ID du type de déménagement sélectionné
        const typeId = typeDemenagementSelect.value;
        if (!typeId) return;
        
        // Correspondance entre les types de déménagement et les types de véhicules recommandés
        const vehiculesRecommandes = {
            // Type ID -> [Mots clés à rechercher dans les options]
            "1": ["fourgon", "12m"],   // Appartement
            "2": ["20m", "30m"],       // Maison
            "3": ["30m", "semi"],      // Entreprise
            "4": ["hayon", "piano"],   // Piano/objets lourds
            "5": ["40m", "semi"],      // International
            "6": ["fourgon", "12m"],   // Local
            "7": ["30m", "40m"],       // National
            "8": ["20m", "30m"],       // Régional
            "9": ["fourgon", "20m"]    // Garde-meuble/Stockage
        };
        
        // Si nous avons des recommandations pour ce type
        if (vehiculesRecommandes[typeId]) {
            const keywords = vehiculesRecommandes[typeId];
            
            // Parcourir toutes les options
            for (let i = 0; i < transporteursSelect.options.length; i++) {
                const option = transporteursSelect.options[i];
                const text = option.textContent.toLowerCase();
                
                // Vérifier si l'option contient un des mots-clés
                for (const keyword of keywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        option.classList.add('transporteur-recommande');
                        break;
                    }
                }
            }
            
            // Sélectionner automatiquement le premier transporteur recommandé
            // si aucun n'est déjà sélectionné
            if (transporteursSelect.selectedOptions.length === 0) {
                for (let i = 0; i < transporteursSelect.options.length; i++) {
                    if (transporteursSelect.options[i].classList.contains('transporteur-recommande')) {
                        transporteursSelect.options[i].selected = true;
                        break;
                    }
                }
                
                // Mettre à jour le compteur
                const countElement = document.querySelector('.selected-transporteurs-count');
                if (countElement) {
                    countElement.textContent = '1 transporteur(s) sélectionné(s)';
                    countElement.classList.remove('text-danger');
                    countElement.classList.add('text-success');
                }
            }
        }
    }
    
    // Ajouter l'écouteur d'événement au bouton de vérification et au bouton du calendrier
    document.addEventListener('click', function(e) {
        // Bouton vérifier disponibilités
        if (e.target && e.target.id === 'verifier-disponibilite') {
            console.log('Clic sur bouton vérifier disponibilités');
            verifierDisponibilite();
        }
        
        // Bouton voir les disponibilités (calendrier)
        if (e.target && (e.target.id === 'show-calendar-btn' || e.target.closest('#show-calendar-btn'))) {
            console.log('Clic sur bouton voir les disponibilités');
            afficherCalendrier();
        }
    });
    
    // Vérifier automatiquement la disponibilité lorsque le type de déménagement change
    if (typeDemenagementSelect) {
        typeDemenagementSelect.addEventListener('change', function() {
            console.log('TYPE CHANGED:', this.options[this.selectedIndex].text);
            // Force les dates à avoir une valeur par défaut si elles sont vides
            if (!dateDebutInput.value) {
                const aujourdhui = new Date();
                dateDebutInput.valueAsDate = aujourdhui;
            }
            
            if (!dateFinInput.value) {
                const demain = new Date();
                demain.setDate(demain.getDate() + 1);
                dateFinInput.valueAsDate = demain;
            }
            
            // Déclencher automatiquement la vérification des disponibilités
            setTimeout(() => {
                console.log('Déclenchement automatique vérif après changement type');
                verifierDisponibilite();
                
                // Déclencher l'affichage de la bulle d'information si elle existe
                if (typeof afficherInfoBulle === 'function') {
                    const typeText = typeDemenagementSelect.options[typeDemenagementSelect.selectedIndex].text;
                    setTimeout(() => afficherInfoBulle(typeText), 500);
                }
            }, 100);
        });
    }
    
    // Ajouter du CSS pour mettre en évidence les transporteurs
    const style = document.createElement('style');
    style.textContent = `
        .transporteur-indisponible {
            color: #ff6b6b;
            background-color: #ffeaea;
        }
        .transporteur-recommande {
            color: #20c997;
            background-color: #e6f7f2;
            font-weight: bold;
        }
        #soon-available-container {
            max-height: 200px;
            overflow-y: auto;
        }
    `;
    document.head.appendChild(style);
});