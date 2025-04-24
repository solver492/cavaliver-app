/**
 * Script pour améliorer l'interface des transporteurs avec une barre de recherche
 * et une meilleure organisation visuelle
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Script de recherche de transporteurs chargé");
    
    // Récupérer la section des transporteurs
    const transporteursSection = document.querySelector('.transporteurs');
    
    if (!transporteursSection) {
        console.error("Section des transporteurs non trouvée");
        return;
    }
    
    // Récupérer la liste des transporteurs
    const transporteursSelect = document.getElementById('transporteurs');
    
    if (!transporteursSelect) {
        console.error("Liste des transporteurs non trouvée");
        return;
    }
    
    // Créer un conteneur pour la barre de recherche et les options
    const searchContainer = document.createElement('div');
    searchContainer.className = 'transporteurs-search-container mb-3';
    searchContainer.style.width = '100%';
    
    // Créer la barre de recherche
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'transporteurs-search';
    searchInput.className = 'form-control mb-2';
    searchInput.placeholder = 'Rechercher un transporteur par nom...';
    
    // Ajouter un compteur de transporteurs
    const transporteursCount = document.createElement('div');
    transporteursCount.className = 'selected-transporteurs-count text-primary mb-2';
    transporteursCount.style.fontWeight = 'bold';
    
    // Ajouter des boutons pour sélectionner/désélectionner tous les transporteurs
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'btn-group mb-3';
    buttonsContainer.style.width = '100%';
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.type = 'button';
    selectAllBtn.className = 'btn btn-outline-primary';
    selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Tout sélectionner';
    
    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.type = 'button';
    deselectAllBtn.className = 'btn btn-outline-secondary';
    deselectAllBtn.innerHTML = '<i class="fas fa-square"></i> Tout désélectionner';
    
    buttonsContainer.appendChild(selectAllBtn);
    buttonsContainer.appendChild(deselectAllBtn);
    
    // Ajouter les éléments au conteneur de recherche
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(transporteursCount);
    searchContainer.appendChild(buttonsContainer);
    
    // Insérer le conteneur de recherche avant la liste des transporteurs
    transporteursSelect.parentNode.insertBefore(searchContainer, transporteursSelect);
    
    // Fonction pour mettre à jour le compteur de transporteurs sélectionnés
    function updateTransporteursCount() {
        const selectedCount = Array.from(transporteursSelect.selectedOptions).length;
        transporteursCount.textContent = `${selectedCount} transporteur(s) sélectionné(s)`;
    }
    
    // Fonction pour filtrer les transporteurs
    function filterTransporteurs() {
        const searchTerm = searchInput.value.toLowerCase();
        const options = Array.from(transporteursSelect.options);
        
        options.forEach(option => {
            const text = option.text.toLowerCase();
            const match = text.includes(searchTerm);
            option.style.display = match ? '' : 'none';
        });
    }
    
    // Ajouter des écouteurs d'événements
    searchInput.addEventListener('input', filterTransporteurs);
    transporteursSelect.addEventListener('change', updateTransporteursCount);
    
    selectAllBtn.addEventListener('click', function() {
        Array.from(transporteursSelect.options).forEach(option => {
            if (option.style.display !== 'none') {
                option.selected = true;
            }
        });
        updateTransporteursCount();
    });
    
    deselectAllBtn.addEventListener('click', function() {
        Array.from(transporteursSelect.options).forEach(option => {
            option.selected = false;
        });
        updateTransporteursCount();
    });
    
    // Initialiser le compteur
    updateTransporteursCount();
    
    // Améliorer le style de la liste des transporteurs
    transporteursSelect.style.width = '100%';
    transporteursSelect.style.minWidth = '100%';
    transporteursSelect.style.boxSizing = 'border-box';
    transporteursSelect.style.display = 'block';
    transporteursSelect.style.position = 'static';
    transporteursSelect.style.appearance = 'listbox';
    transporteursSelect.style.height = 'auto';
    transporteursSelect.style.minHeight = '400px';
    transporteursSelect.style.maxHeight = '450px';
    transporteursSelect.style.padding = '15px 20px';
    transporteursSelect.style.margin = '0';
    transporteursSelect.style.border = '3px solid #0d6efd';
    transporteursSelect.style.borderRadius = '10px';
    transporteursSelect.style.boxShadow = '0 0 30px rgba(13, 110, 253, 0.25)';
    transporteursSelect.style.fontFamily = 'Arial, sans-serif';
    transporteursSelect.style.fontSize = '1.3rem';
    transporteursSelect.style.fontWeight = '400';
    transporteursSelect.style.lineHeight = '2';
    transporteursSelect.style.letterSpacing = '0.5px';
    transporteursSelect.style.color = '#333';
    
    // Ajouter des styles pour les options
    Array.from(transporteursSelect.options).forEach(option => {
        option.style.padding = '8px 12px';
        option.style.margin = '2px 0';
        option.style.borderRadius = '5px';
    });
    
    console.log("Interface des transporteurs améliorée avec barre de recherche");
});
