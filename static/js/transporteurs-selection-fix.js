/**
 * Script de correction spécifique pour la sélection des transporteurs
 * Utilise une approche plus robuste avec des écouteurs d'événements personnalisés
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script de correction pour la sélection des transporteurs chargé");
    
    // Fonction pour améliorer la sélection des transporteurs
    function enhanceTransporteursSelection() {
        const transporteursSelect = document.getElementById('transporteurs');
        if (!transporteursSelect) {
            console.error("Élément 'transporteurs' non trouvé");
            return;
        }
        
        console.log("Amélioration de la sélection des transporteurs");
        
        // Créer un conteneur personnalisé pour remplacer le select multiple
        const customSelectContainer = document.createElement('div');
        customSelectContainer.className = 'custom-transporteurs-container';
        customSelectContainer.style.cssText = `
            height: 250px;
            overflow-y: auto;
            border: 1px solid #ced4da;
            border-radius: 0.25rem;
            padding: 0.5rem;
            background-color: #fff;
        `;
        
        // Créer un champ de recherche
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'form-control mb-2';
        searchInput.placeholder = 'Rechercher un transporteur...';
        
        // Créer une liste pour les options
        const optionsList = document.createElement('div');
        optionsList.className = 'transporteurs-options-list';
        
        // Créer un champ caché pour stocker les valeurs sélectionnées
        const hiddenInput = document.createElement('select');
        hiddenInput.name = 'transporteurs';
        hiddenInput.multiple = true;
        hiddenInput.style.display = 'none';
        
        // Récupérer les options actuelles et les valeurs sélectionnées
        const currentOptions = Array.from(transporteursSelect.options);
        const selectedValues = Array.from(transporteursSelect.selectedOptions).map(opt => opt.value);
        
        // Ajouter les options au champ caché
        currentOptions.forEach(option => {
            const newOption = document.createElement('option');
            newOption.value = option.value;
            newOption.textContent = option.textContent;
            
            if (selectedValues.includes(option.value)) {
                newOption.selected = true;
            }
            
            hiddenInput.appendChild(newOption);
        });
        
        // Créer les éléments d'option personnalisés
        currentOptions.forEach(option => {
            if (!option.value) return; // Ignorer les options vides
            
            const optionElement = document.createElement('div');
            optionElement.className = 'transporteur-option p-2 mb-1';
            optionElement.dataset.value = option.value;
            optionElement.textContent = option.textContent;
            
            // Appliquer des styles
            optionElement.style.cssText = `
                border-radius: 4px;
                cursor: pointer;
                padding: 8px;
                margin-bottom: 4px;
                border: 1px solid #e9ecef;
                transition: all 0.2s;
            `;
            
            // Marquer comme sélectionné si nécessaire
            if (selectedValues.includes(option.value)) {
                optionElement.classList.add('selected');
                optionElement.style.backgroundColor = '#e7f3ff';
                optionElement.style.borderColor = '#b8daff';
                optionElement.innerHTML = `<i class="fas fa-check-circle me-2"></i>${option.textContent}`;
            }
            
            // Ajouter l'écouteur de clic
            optionElement.addEventListener('click', function() {
                const value = this.dataset.value;
                const isSelected = this.classList.contains('selected');
                
                // Mettre à jour l'apparence
                if (isSelected) {
                    this.classList.remove('selected');
                    this.style.backgroundColor = '';
                    this.style.borderColor = '#e9ecef';
                    this.textContent = option.textContent;
                } else {
                    this.classList.add('selected');
                    this.style.backgroundColor = '#e7f3ff';
                    this.style.borderColor = '#b8daff';
                    this.innerHTML = `<i class="fas fa-check-circle me-2"></i>${option.textContent}`;
                }
                
                // Mettre à jour le champ caché
                Array.from(hiddenInput.options).forEach(opt => {
                    if (opt.value === value) {
                        opt.selected = !isSelected;
                    }
                });
                
                // Mettre à jour le compteur
                updateTransporteursCount();
            });
            
            optionsList.appendChild(optionElement);
        });
        
        // Fonction de recherche
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            Array.from(optionsList.children).forEach(option => {
                const text = option.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            });
        });
        
        // Fonction pour mettre à jour le compteur
        function updateTransporteursCount() {
            const selectedCount = Array.from(hiddenInput.selectedOptions).length;
            const countDisplay = document.querySelector('.selected-transporteurs-count');
            if (countDisplay) {
                countDisplay.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
            }
        }
        
        // Assembler le tout
        customSelectContainer.appendChild(searchInput);
        customSelectContainer.appendChild(optionsList);
        
        // Remplacer le select d'origine
        transporteursSelect.parentNode.insertBefore(customSelectContainer, transporteursSelect);
        transporteursSelect.parentNode.insertBefore(hiddenInput, transporteursSelect);
        transporteursSelect.parentNode.removeChild(transporteursSelect);
        
        // Initialiser le compteur
        updateTransporteursCount();
        
        console.log("Sélection des transporteurs améliorée avec succès");
    }
    
    // Attendre un court instant pour s'assurer que tous les autres scripts sont chargés
    setTimeout(enhanceTransporteursSelection, 500);
});
