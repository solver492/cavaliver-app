/**
 * Prestations management specific JavaScript for Cavalier Déménagement
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the prestation page
    if (!document.querySelector('.prestation-page')) return;
    
    // Amélioration de la gestion des dates
    const dateDebutInput = document.getElementById('date_debut');
    const dateFinInput = document.getElementById('date_fin');
    
    if (dateDebutInput && dateFinInput) {
        // Définir la date du jour comme date minimale par défaut
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];
        
        // Définir les dates minimales pour éviter les dates dans le passé
        if (!dateDebutInput.value) {
            dateDebutInput.value = formattedToday;
            // Pour la date de fin, proposer le lendemain par défaut
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateFinInput.value = tomorrow.toISOString().split('T')[0];
        }
        
        dateDebutInput.addEventListener('change', function() {
            // Assurer que date_fin est toujours après ou égale à date_debut
            const dateDebut = new Date(this.value);
            const dateFin = new Date(dateFinInput.value);
            
            // Ajouter un style visuel temporaire pour indiquer le changement
            this.classList.add('date-changed');
            setTimeout(() => {
                this.classList.remove('date-changed');
            }, 1000);
            
            if (dateFin < dateDebut) {
                // Définir date_fin à date_debut + 1 jour
                const newDateFin = new Date(dateDebut);
                newDateFin.setDate(newDateFin.getDate() + 1);
                dateFinInput.value = newDateFin.toISOString().split('T')[0];
                
                // Ajouter un style visuel pour indiquer le changement automatique
                dateFinInput.classList.add('date-auto-adjusted');
                setTimeout(() => {
                    dateFinInput.classList.remove('date-auto-adjusted');
                }, 1000);
            }
        });
        
        dateFinInput.addEventListener('change', function() {
            // Assurer que date_fin est toujours après ou égale à date_debut
            const dateDebut = new Date(dateDebutInput.value);
            const dateFin = new Date(this.value);
            
            // Ajouter un style visuel temporaire pour indiquer le changement
            this.classList.add('date-changed');
            setTimeout(() => {
                this.classList.remove('date-changed');
            }, 1000);
            
            if (dateFin < dateDebut) {
                // Afficher un message d'erreur avec une UI plus conviviale
                const errorMsg = document.createElement('div');
                errorMsg.className = 'alert alert-warning alert-dismissible fade show mt-2';
                errorMsg.innerHTML = `
                    <strong>Attention !</strong> La date de fin doit être postérieure à la date de début.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
                `;
                
                // Insérer juste après le champ date_fin
                this.parentNode.appendChild(errorMsg);
                
                // Auto-fermer l'alerte après 3 secondes
                setTimeout(() => {
                    errorMsg.remove();
                }, 3000);
                
                // Réinitialiser à date_debut + 1 jour
                const newDateFin = new Date(dateDebut);
                newDateFin.setDate(newDateFin.getDate() + 1);
                this.value = newDateFin.toISOString().split('T')[0];
            }
        });
    }
    
    // Optimisation de la recherche prestation
    const searchInput = document.getElementById('prestation-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            // Si utilisation du filtrage côté client
            const prestationRows = document.querySelectorAll('tbody tr');
            let found = false;
            
            prestationRows.forEach(row => {
                const prestationData = row.textContent.toLowerCase();
                if (searchTerm === '' || prestationData.includes(searchTerm)) {
                    row.style.display = '';
                    found = true;
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Afficher un message "Aucun résultat" si nécessaire
            const noResultsMessage = document.getElementById('no-results-message');
            if (noResultsMessage) {
                noResultsMessage.style.display = found ? 'none' : 'block';
            }
        }, 300));
    }
    
    // Amélioration de l'affichage des tags dans la liste des prestations
    const tagContainers = document.querySelectorAll('.prestation-tags');
    tagContainers.forEach(container => {
        const tagsText = container.dataset.tags;
        if (tagsText) {
            createTagElements(tagsText, container);
        }
    });
    
    // Amélioration de la confirmation de suppression de prestation
    const deleteButtons = document.querySelectorAll('.delete-prestation');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const prestationId = this.dataset.prestationId;
            
            // Récupérer les informations de la prestation
            const row = this.closest('tr');
            const prestationInfo = row ? [
                row.querySelector('td:nth-child(1)')?.textContent, // Client
                row.querySelector('td:nth-child(2)')?.textContent, // Date début
                row.querySelector('td:nth-child(3)')?.textContent  // Date fin
            ].filter(Boolean).join(' - ') : '';
            
            confirmAction(
                `<h5>Supprimer la prestation #${prestationId} ?</h5>
                ${prestationInfo ? `<p class="text-muted">${prestationInfo}</p>` : ''}
                <p class="text-danger"><strong>Cette action est irréversible.</strong></p>`, 
                () => {
                    window.location.href = this.href;
                }
            );
        });
    });
    
    // Optimisation de la sélection multiple pour les transporteurs
    const transporteursSelect = document.getElementById('transporteurs');
    if (transporteursSelect) {
        // Amélioration de l'affichage du nombre de transporteurs sélectionnés
        const updateSelectedCount = function() {
            const count = transporteursSelect.selectedOptions.length;
            const countDisplay = document.querySelector('.selected-transporteurs-count');
            if (countDisplay) {
                countDisplay.textContent = `${count} transporteur(s) sélectionné(s)`;
                
                // Mise à jour visuelle en fonction du nombre de transporteurs
                if (count === 0) {
                    countDisplay.className = 'selected-transporteurs-count mt-1 small text-danger';
                    countDisplay.textContent += ' - Aucun transporteur sélectionné';
                } else if (count > 3) {
                    countDisplay.className = 'selected-transporteurs-count mt-1 small text-warning';
                    countDisplay.textContent += ' - Attention : beaucoup de transporteurs assignés';
                } else {
                    countDisplay.className = 'selected-transporteurs-count mt-1 small text-success';
                }
            }
        };
        
        transporteursSelect.addEventListener('change', updateSelectedCount);
        
        // Mise à jour initiale du compteur
        updateSelectedCount();
    }
    
    // Amélioration de la validation des adresses
    const addressInputs = document.querySelectorAll('textarea[name="adresse_depart"], textarea[name="adresse_arrivee"]');
    addressInputs.forEach(input => {
        // Nettoyer les validations existantes au chargement
        input.classList.remove('is-invalid');
        const existingError = input.nextElementSibling;
        if (existingError && existingError.classList.contains('invalid-feedback')) {
            existingError.remove();
        }
        
        input.addEventListener('blur', function() {
            const address = this.value.trim();
            // Validation moins stricte (5 caractères minimum au lieu de 10)
            if (address.length < 5 && address.length > 0) {
                this.classList.add('is-invalid');
                
                // Ajouter un message de validation si inexistant
                let errorMessage = this.nextElementSibling;
                if (!errorMessage || !errorMessage.classList.contains('invalid-feedback')) {
                    errorMessage = document.createElement('div');
                    errorMessage.className = 'invalid-feedback';
                    errorMessage.textContent = 'L\'adresse semble trop courte. Veuillez fournir plus de détails si possible.';
                    this.parentNode.insertBefore(errorMessage, this.nextSibling);
                }
            } else {
                this.classList.remove('is-invalid');
                
                // Supprimer le message de validation s'il existe
                const errorMessage = this.nextElementSibling;
                if (errorMessage && errorMessage.classList.contains('invalid-feedback')) {
                    errorMessage.remove();
                }
            }
        });
        
        // Nettoyer les validations au focus
        input.addEventListener('focus', function() {
            this.classList.remove('is-invalid');
            const errorMessage = this.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('invalid-feedback')) {
                errorMessage.remove();
            }
        });
    });
    
    // Activation de l'autocomplétion pour le champ tags
    const tagsInput = document.getElementById('tags');
    if (tagsInput) {
        // Liste de suggestions prédéfinies pour les tags
        const tagSuggestions = ['urgent', 'fragile', 'volumineux', 'prioritaire', 'spécial', 'international', 'entreprise'];
        
        // Système d'autocomplétion simple
        tagsInput.addEventListener('input', function() {
            const inputVal = this.value.trim();
            const lastTag = inputVal.split(',').pop().trim().toLowerCase();
            
            // Supprimer l'autocomplétion existante
            const existingAutocomplete = document.getElementById('tags-autocomplete');
            if (existingAutocomplete) {
                existingAutocomplete.remove();
            }
            
            // Ne rien faire si le tag en cours est trop court
            if (lastTag.length < 2) return;
            
            // Filtrer les suggestions correspondantes
            const matchingSuggestions = tagSuggestions.filter(tag => 
                tag.toLowerCase().startsWith(lastTag) && tag.toLowerCase() !== lastTag
            );
            
            // Créer l'élément d'autocomplétion si on a des correspondances
            if (matchingSuggestions.length > 0) {
                const autocompleteDiv = document.createElement('div');
                autocompleteDiv.id = 'tags-autocomplete';
                autocompleteDiv.className = 'tags-autocomplete';
                
                matchingSuggestions.forEach(suggestion => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'autocomplete-item';
                    suggestionItem.textContent = suggestion;
                    
                    // Ajouter au clic
                    suggestionItem.addEventListener('click', () => {
                        const tags = inputVal.split(',');
                        tags.pop(); // Supprimer le tag incomplet
                        tags.push(suggestion); // Ajouter le tag suggéré
                        this.value = tags.join(', ') + ', '; // Ajouter une virgule pour le prochain tag
                        autocompleteDiv.remove(); // Fermer l'autocomplétion
                        this.focus(); // Garder le focus
                    });
                    
                    autocompleteDiv.appendChild(suggestionItem);
                });
                
                // Insérer après le champ de tags
                this.parentNode.appendChild(autocompleteDiv);
            }
        });
        
        // Fermer l'autocomplétion quand on clique ailleurs
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#tags') && !e.target.closest('#tags-autocomplete')) {
                const autocomplete = document.getElementById('tags-autocomplete');
                if (autocomplete) autocomplete.remove();
            }
        });
    }
});

/**
 * Debounce function to limit how often a function can be called
 * @param {function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @return {function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format date as dd/mm/yyyy
 * @param {Date} date - Date to format
 * @return {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format currency as EUR
 * @param {number} amount - Amount to format
 * @return {string} Formatted currency string
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {function} callback - Function to call if confirmed
 */
function confirmAction(message, callback) {
    // Version améliorée avec Bootstrap modal au lieu de confirm() natif
    let modalId = 'confirmActionModal';
    let confirmModal = document.getElementById(modalId);
    
    // Créer le modal s'il n'existe pas
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.className = 'modal fade';
        confirmModal.id = modalId;
        confirmModal.setAttribute('tabindex', '-1');
        confirmModal.setAttribute('aria-hidden', 'true');
        
        confirmModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirmation</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-danger confirm-btn">Confirmer</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
    }
    
    // Mettre à jour le contenu
    confirmModal.querySelector('.modal-body').innerHTML = message;
    
    // Configurer les actions
    const confirmBtn = confirmModal.querySelector('.confirm-btn');
    
    // Supprimer les listeners précédents
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Ajouter le nouveau listener
    newConfirmBtn.addEventListener('click', function() {
        // Fermer le modal
        const modal = bootstrap.Modal.getInstance(confirmModal);
        modal.hide();
        
        // Exécuter le callback
        callback();
    });
    
    // Afficher le modal
    const modal = new bootstrap.Modal(confirmModal);
    modal.show();
}

/**
 * Create tag elements from comma-separated string
 * @param {string} tagsString - Comma-separated tags
 * @param {HTMLElement} container - Container to append tags to
 */
function createTagElements(tagsString, container) {
    if (!tagsString || !container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Split the string and create tags
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        
        // Ajouter une classe spécifique selon le tag
        if (['urgent', 'prioritaire'].includes(tag.toLowerCase())) {
            tagElement.classList.add('tag-urgent');
        } else if (['fragile'].includes(tag.toLowerCase())) {
            tagElement.classList.add('tag-fragile');
        } else if (['volumineux', 'lourd'].includes(tag.toLowerCase())) {
            tagElement.classList.add('tag-volumineux');
        } else if (['international'].includes(tag.toLowerCase())) {
            tagElement.classList.add('tag-international');
        } else if (['entreprise', 'société', 'professionnel'].includes(tag.toLowerCase())) {
            tagElement.classList.add('tag-enterprise');
        }
        
        tagElement.textContent = tag;
        container.appendChild(tagElement);
    });
}
