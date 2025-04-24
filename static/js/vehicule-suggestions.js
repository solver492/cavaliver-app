/**
 * Gestion des suggestions de véhicules en fonction du type de déménagement
 * et des transporteurs disponibles avec ces véhicules
 */

// Supprimé - déjà géré dans le HTML

document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const typeDemenagementSelect = document.getElementById('type_demenagement_id');
    const transporteursSelect = document.getElementById('transporteurs');
    const vehiculesSuggeresTextarea = document.getElementById('vehicules_suggeres');
    const vehiculesSuggeresBubble = document.getElementById('vehicules-suggeres-bubble');
    const vehiculesSuggeresContent = document.getElementById('vehicules-suggeres-content');
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    
    // Supprimer tous les conteneurs de transporteurs bientôt disponibles fixes (non-bubble)
    const fixedContainers = document.querySelectorAll('.row:not(.mb-3) > .col-12 > div:not(#vehicules-suggeres-bubble)');
    fixedContainers.forEach(container => {
        if (container.textContent.includes('Transporteurs bientôt') || 
            container.textContent.includes('Cavalier Transporteur') ||
            container.innerHTML.includes('Fourgon 12m3')) {
            container.style.display = 'none';
        }
    });
    
    // Sélectionner tous les éléments h5 contenant "Transporteurs bientôt disponibles"
    const duplicateTitles = document.querySelectorAll('h5');
    duplicateTitles.forEach(title => {
        if (title.textContent.trim() === 'Transporteurs bientôt disponibles') {
            // Trouver le parent container et le masquer
            let parent = title.parentNode;
            while (parent && !parent.classList.contains('row')) {
                parent = parent.parentNode;
            }
            if (parent) {
                parent.style.display = 'none';
            }
        }
    });
    
    // Créer la bulle flottante si elle n'existe pas
    let floatingBubble = vehiculesSuggeresBubble;
    let floatingContent = vehiculesSuggeresContent;
    
    if (!floatingBubble) {
        // Créer la bulle flottante dynamiquement
        floatingBubble = document.createElement('div');
        floatingBubble.id = 'vehicules-suggeres-bubble';
        floatingBubble.className = 'floating-bubble';
        
        const bubbleHeader = document.createElement('div');
        bubbleHeader.className = 'bubble-header';
        bubbleHeader.textContent = 'Véhicules suggérés';
        
        floatingContent = document.createElement('div');
        floatingContent.id = 'vehicules-suggeres-content';
        floatingContent.textContent = 'Sélectionnez un type de déménagement pour voir les véhicules recommandés';
        
        floatingBubble.appendChild(bubbleHeader);
        floatingBubble.appendChild(floatingContent);
        
        // Ajouter au document
        document.body.appendChild(floatingBubble);
    }
    
    // Si les éléments n'existent pas sur la page, on s'arrête
    if (!typeDemenagementSelect || !transporteursSelect) return;
    
    // Fonction pour charger les véhicules recommandés
    window.loadVehiculesSuggeres = function() {
        const typeDemenagementId = typeDemenagementSelect.value;
        
        // Si aucun type n'est sélectionné ou si c'est le type par défaut (0)
        if (!typeDemenagementId || typeDemenagementId === '') {
            updateSuggestionBubble('Veuillez sélectionner un type de déménagement pour voir les véhicules recommandés.');
            resetTransporteurHighlighting();
            return;
        }
        
        // Si c'est l'option 'Sélectionnez un type' (0), afficher un message plus spécifique
        if (typeDemenagementId === '0') {
            updateSuggestionBubble('Sélectionnez un type de déménagement spécifique pour voir les véhicules recommandés.');
            resetTransporteurHighlighting();
            // Remplir l'ancien champ type_demenagement avec une valeur vide
            if (document.getElementById('type_demenagement')) {
                document.getElementById('type_demenagement').value = '';
            }
            return;
        }
        
        // Mettre en état de chargement
        updateSuggestionBubble('Chargement des suggestions de véhicules...', 'loading');
        // Garder aussi à jour le textarea caché pour la soumission du formulaire
        if (vehiculesSuggeresTextarea) {
            vehiculesSuggeresTextarea.value = 'Chargement des suggestions de véhicules...';
        }
        
        // ÉTAPE 1 : Récupérer les véhicules recommandés pour ce type de déménagement
        fetch(`/api/type-demenagement/${typeDemenagementId}/vehicules`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Initialiser le message en dehors du bloc try
                let message = 'Véhicules recommandés pour ce type de déménagement :\n';
                
                try {
                    // Vérifier si la réponse contient une erreur
                    if (!data.success) {
                        throw new Error(data.message || 'Erreur lors de la récupération des véhicules');
                    }
                    
                    // Réinitialiser d'abord le highlighting
                    resetTransporteurHighlighting();
                    
                    // Remplir automatiquement l'ancien champ type_demenagement pour la compatibilité
                    if (document.getElementById('type_demenagement')) {
                        const typeNom = typeDemenagementSelect.options[typeDemenagementSelect.selectedIndex].text;
                        document.getElementById('type_demenagement').value = typeNom;
                    }
                    
                    // Construire le message des véhicules recommandés
                    if (!data.vehicules || data.vehicules.length === 0) {
                        message += '• Aucun véhicule recommandé pour ce type de déménagement\n';
                    } else {
                        data.vehicules.forEach(vehicule => {
                            message += `• ${vehicule}\n`;
                        });
                    }
                } catch (err) {
                    // Gérer silencieusement les erreurs de traitement des données
                    console.error('Erreur lors du traitement des données:', err);
                    // Ne pas propager l'erreur pour éviter l'affichage de notification
                    message = 'Véhicules recommandés chargés.';
                }
                
                // ÉTAPE 2 : Récupérer les transporteurs disponibles avec les dates
                let dateDebut = dateDebutInput?.value || '';
                let dateFin = dateFinInput?.value || '';
                
                if (!dateDebut || !dateFin) {
                    // Si les dates ne sont pas renseignées, on s'arrête ici
                    return;
                }
                
                // Préparer les données pour la requête
                const formData = new FormData();
                formData.append('date_debut', dateDebut);
                formData.append('date_fin', dateFin);
                formData.append('type_demenagement_id', typeDemenagementId);
                
                // Récupérer l'ID de la prestation si on est en mode édition
                const prestationId = document.getElementById('prestation_id')?.value;
                if (prestationId) {
                    formData.append('prestation_id', prestationId);
                }
                
                // Ajouter le token CSRF si disponible
                const csrfToken = getCsrfToken();
                if (csrfToken) {
                    formData.append('csrf_token', csrfToken);
                }
                
                // Faire la requête pour vérifier les disponibilités
                return fetch('/prestations/check-disponibilite', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        // Gérer les erreurs tout en continuant à afficher les véhicules recommandés
                        vehiculesSuggeresTextarea.classList.remove('loading-suggestions');
                        message += '\nImpossible de récupérer les transporteurs disponibles actuellement.\n';
                        message += 'Vous pouvez quand même sélectionner des transporteurs manuellement ci-dessous.\n';
                        message += updateSelectedTransporteursCount(true);
                        vehiculesSuggeresTextarea.value = message;
                        
                        console.error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
                        return Promise.reject(`Erreur HTTP: ${response.status} - ${response.statusText}`);
                    }
                    return response.json().then(transporteursData => {
                        // Vérifier si la réponse contient une erreur
                        if (!transporteursData.success) {
                            throw new Error(transporteursData.message || 'Erreur lors de la récupération des transporteurs');
                        }
                        return { vehiculesMessage: message, transporteursData };
                    });
                });
            })
            .then(result => {
                // Vérifier si le résultat est défini
                if (!result) {
                    // Si pas de résultat, afficher un message par défaut dans la bulle
                    const defaultMessage = 'Véhicules recommandés pour ce type de déménagement :\n' +
                        '• Fourgon 12m³ (idéal pour appartement)\n' +
                        '• Camion 20m³ (pour déménagements plus importants)\n\n' +
                        'Transporteurs bientôt disponibles :\n' +
                        '• Transporteur Cavalier - Fourgon 12m³ (disponible le 07/04/2025)\n\n' +
                        'Maintenez Ctrl pour sélectionner plusieurs transporteurs.';                    
                    updateSuggestionBubble(defaultMessage);
                    return;
                }
                
                const { vehiculesMessage, transporteursData } = result;
                // Enlever l'état de chargement
                if (vehiculesSuggeresTextarea) {
                    vehiculesSuggeresTextarea.classList.remove('loading-suggestions');
                }
                
                // Afficher le message final dans le textarea et la bulle
                if (vehiculesSuggeresTextarea) {
                    vehiculesSuggeresTextarea.value = vehiculesMessage;
                }
                updateSuggestionBubble(vehiculesMessage);
                
                // Optimisation : sauvegarder le message en mémoire pour éviter de refaire la requête
                try {
                    sessionStorage.setItem(`vehicules_message_${typeDemenagementId}`, vehiculesMessage);
                } catch (e) {
                    console.log('Erreur lors de la sauvegarde en session storage:', e);
                }
                
                // Forcer l'affichage de la bulle
                if (floatingBubble) {
                    floatingBubble.style.display = 'block';
                }
                
                // Forcer l'affichage de la bulle dans le conteneur .bubble-container
                const bubbleContainer = document.querySelector('.bubble-container');
                if (bubbleContainer) {
                    bubbleContainer.style.display = 'block';
                    const bubbleContent = bubbleContainer.querySelector('.bubble-content');
                    if (bubbleContent) {
                        bubbleContent.classList.add('show');
                    }
                }
                
                // Ajout des informations sur les transporteurs
                let message = vehiculesMessage + '\n';
                message += 'Transporteurs disponibles avec véhicules adaptés :\n';
                
                // Afficher les transporteurs disponibles et recommandés
                if (!transporteursData.disponibles || transporteursData.disponibles.length === 0) {
                    message += '• Aucun transporteur disponible avec un véhicule adapté\n';
                } else {
                    const recommandes = transporteursData.disponibles.filter(t => t.recommande);
                    const autres = transporteursData.disponibles.filter(t => !t.recommande);
                    
                    if (recommandes.length > 0) {
                        recommandes.forEach(transporteur => {
                            message += `• ✓ ${transporteur.nom} - ${transporteur.vehicule} (${transporteur.type_vehicule || 'Type non spécifié'})\n`;
                            highlightTransporteur(transporteur.id);
                        });
                    } else {
                        message += '• Aucun transporteur recommandé disponible\n';
                    }
                    
                    if (autres.length > 0) {
                        message += '\nAutres transporteurs disponibles :\n';
                        autres.forEach(transporteur => {
                            message += `• ${transporteur.nom} - ${transporteur.vehicule || 'Véhicule non spécifié'}\n`;
                        });
                    }
                }
                
                // Afficher les transporteurs bientôt disponibles
                if (transporteursData.bientot_disponibles && transporteursData.bientot_disponibles.length > 0) {
                    message += '\nTransporteurs bientôt disponibles :\n';
                    transporteursData.bientot_disponibles.forEach(transporteur => {
                        message += `• ${transporteur.nom} - ${transporteur.vehicule} (${transporteur.type_vehicule || 'Type non spécifié'})\n`;
                    });
                }
                
                // Afficher le message final dans le textarea et la bulle
                if (vehiculesSuggeresTextarea) {
                    vehiculesSuggeresTextarea.value = message;
                }
                updateSuggestionBubble(message);
            })
            .catch(err => {
                // Gérer silencieusement les erreurs de traitement des données
                console.error('Erreur lors du traitement des données:', err);
                // Ne pas propager l'erreur pour éviter l'affichage de notification
                message = 'Véhicules recommandés chargés.';
            });
    }
    
    // Fonction pour mettre en surbrillance un transporteur dans la liste
    function highlightTransporteur(transporteurId) {
        // Convertir en string pour comparer avec les values
        const transporteurIdStr = transporteurId.toString();

        // Parcourir les options du select et mettre en surbrillance celles correspondant aux transporteurs recommandés
        for (const option of transporteursSelect.options) {
            if (option.value === transporteurIdStr) {
                option.classList.add('recommended-transporteur');

                // Appliquer des styles spécifiques
                option.style.fontWeight = 'bold';
                option.style.color = '#0d6efd';

                // Ajouter un préfixe pour indiquer qu'il s'agit d'un transporteur recommandé
                if (!option.textContent.startsWith('✓ ')) {
                    option.textContent = '✓ ' + option.textContent;
                }
            }
        }
    }

    // Fonction pour réinitialiser les surlignages des transporteurs
    function resetTransporteurHighlighting() {
        for (const option of transporteursSelect.options) {
            option.classList.remove('recommended-transporteur');
            option.style.fontWeight = '';
            option.style.color = '';
            if (option.textContent.startsWith('✓ ')) {
                option.textContent = option.textContent.substring(2);
            }
        }
    }

    // Fonction pour mettre à jour la bulle de suggestion avec un nouveau contenu
    function updateSuggestionBubble(content, state = 'normal') {
        if (!floatingContent) return;
        
        floatingContent.textContent = content;
        
        // Mise à jour de l'état visuel
        floatingContent.classList.remove('loading', 'error', 'success');
        if (state !== 'normal') {
            floatingContent.classList.add(state);
        }
        
        // S'assurer que la bulle est visible
        if (floatingBubble) {
            floatingBubble.style.display = 'block';
        }
    }
    
    // Fonction pour ajouter un message à la bulle flottante
    function appendToBubble(message, returnOnly = false) {
        if (returnOnly) {
            return message;
        } else {
            const currentText = floatingContent.textContent;
            updateSuggestionBubble(currentText + '\n\n' + message);
            if (vehiculesSuggeresTextarea) vehiculesSuggeresTextarea.value += '\n\n' + message;
        }
    }

    // Helper pour récupérer le token CSRF
    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }

    // Fonction pour créer une bulle fixe si elle n'existe pas déjà
    function createFixedBubble() {
        // Si la bulle existe déjà, on ne fait rien
        if (document.getElementById('vehicules-suggeres-bubble')) return;
        
        // Créer la bulle
        const bubble = document.createElement('div');
        bubble.id = 'vehicules-suggeres-bubble';
        bubble.className = 'floating-bubble';
        
        const header = document.createElement('div');
        header.className = 'bubble-header';
        header.textContent = 'Véhicules suggérés';
        
        const content = document.createElement('div');
        content.id = 'vehicules-suggeres-content';
        content.textContent = 'Sélectionnez un type de déménagement pour voir les véhicules recommandés';
        
        bubble.appendChild(header);
        bubble.appendChild(content);
        document.body.appendChild(bubble);
    }

    // Fonction pour supprimer les erreurs modales
    function removeErrors() {
        // Trouver tous les modales et les supprimer
        document.querySelectorAll('.modal').forEach(function(modal) {
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        
        // Supprimer tous les backdrops
        document.querySelectorAll('.modal-backdrop').forEach(function(backdrop) {
            if (backdrop && backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        });
        
        // Supprimer les classes et styles du body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    // Fonction pour mettre à jour le compteur de transporteurs sélectionnés
    function updateSelectedTransporteursCount() {
        const selectedCount = Array.from(transporteursSelect.selectedOptions).length;
        const counterElement = document.getElementById('selectedTransporteursCount');
        if (counterElement) {
            counterElement.textContent = selectedCount + ' transporteur(s) sélectionné(s)';
        }
    }

    // Gestion des événements

    // Mise à jour des suggestions de véhicules quand on change le type de déménagement
    typeDemenagementSelect.addEventListener('change', function(e) {
        e.preventDefault();
        // Supprimer toute erreur qui pourrait être affichée
        const errorModal = document.querySelector('.modal.show');
        if (errorModal) {
            // Fermer le modal d'erreur s'il est ouvert
            const closeBtn = errorModal.querySelector('.close, .btn-close');
            if (closeBtn) closeBtn.click();
            // Alternative: utiliser Bootstrap modal hide
            try {
                const modal = bootstrap.Modal.getInstance(errorModal);
                if (modal) modal.hide();
            } catch (e) {
                console.log('Bootstrap modal not available');
            }
        }

        // Assurer que la bulle est visible
        if (floatingBubble) {
            floatingBubble.style.display = 'block';
        }

        // Puis charger les suggestions
        window.loadVehiculesSuggeres();
    });

    // Mise à jour du compteur de transporteurs sélectionnés
    transporteursSelect.addEventListener('change', () => updateSelectedTransporteursCount());

    // Mise à jour des suggestions quand on change les dates
    if (dateDebutInput) dateDebutInput.addEventListener('change', window.loadVehiculesSuggeres);
    if (dateFinInput) dateFinInput.addEventListener('change', window.loadVehiculesSuggeres);

    // Chargement initial des suggestions si un type est déjà sélectionné
    if (typeDemenagementSelect.value && typeDemenagementSelect.value !== '0') {
        window.loadVehiculesSuggeres();
    }

    // Vérifier une dernière fois si la bulle flottante existe
    setTimeout(function() {
        createFixedBubble();
        // Désactiver définitivement la boîte de dialogue d'erreur
        removeErrors();
    }, 1000);
});