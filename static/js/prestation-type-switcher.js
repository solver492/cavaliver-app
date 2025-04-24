/**
 * Script pour gérer le sélecteur de type de prestation et le switcher de la liste des prestations
 */

document.addEventListener('DOMContentLoaded', function() {
    // Gestion du switch pour le type de prestation (page d'édition)
    const prestationTypeSwitch = document.getElementById('prestation-type-switch');
    const typeHiddenInput = document.getElementById('type_demenagement_hidden');
    const modeInfo = document.getElementById('mode-info');
    const clientsSupplementairesSection = document.getElementById('section-clients-supplementaires');
    const modeGroupageInput = document.querySelector('input[name="mode_groupage"]');
    
    if (prestationTypeSwitch && typeHiddenInput) {
        // Initialiser l'état du switch en fonction de la valeur actuelle
        prestationTypeSwitch.checked = typeHiddenInput.value === 'Groupage';
        
        // Mettre à jour l'interface en fonction de l'état initial
        updateInterfaceBasedOnType(prestationTypeSwitch.checked);
        
        // Ajouter l'événement de changement
        prestationTypeSwitch.addEventListener('change', function() {
            const isGroupage = this.checked;
            
            // Mettre à jour le champ caché pour le type de déménagement
            typeHiddenInput.value = isGroupage ? 'Groupage' : 'Standard';
            
            // Mettre à jour le champ mode_groupage si présent
            if (modeGroupageInput) {
                modeGroupageInput.value = isGroupage ? 'true' : 'false';
            }
            
            // Mettre à jour l'interface
            updateInterfaceBasedOnType(isGroupage);
            
            // Animation pour le changement
            if (modeInfo) {
                modeInfo.classList.add('fade-out');
                setTimeout(() => {
                    modeInfo.innerHTML = `<i class="fas fa-info-circle me-2"></i> ${isGroupage ? 
                        'Mode groupage: plusieurs clients, plusieurs points de départ et d\'arrivée' : 
                        'Mode standard: un seul client, un point de départ et un point d\'arrivée'}`;
                    modeInfo.classList.remove('fade-out');
                    modeInfo.classList.add('fade-in');
                    
                    setTimeout(() => {
                        modeInfo.classList.remove('fade-in');
                    }, 500);
                }, 300);
            }
            
            // Déclencher un événement personnalisé pour informer d'autres scripts du changement
            document.dispatchEvent(new CustomEvent('prestationTypeChanged', {
                detail: { isGroupage: isGroupage }
            }));
        });
    }
    
    // Fonction pour mettre à jour l'interface en fonction du type de prestation
    function updateInterfaceBasedOnType(isGroupage) {
        // Afficher/masquer la section des clients supplémentaires
        if (clientsSupplementairesSection) {
            clientsSupplementairesSection.style.display = isGroupage ? 'block' : 'none';
        }
        
        // Autres éléments à mettre à jour en fonction du type
        const etapesDepart = document.getElementById('ajouter-etape-depart');
        const etapesArrivee = document.getElementById('ajouter-etape-arrivee');
        const clientsMultiplesSection = document.querySelector('.clients-multiples-section');
        const adressesMultiplesSection = document.querySelector('.adresses-multiples-section');
        
        if (etapesDepart) {
            etapesDepart.style.display = isGroupage ? 'block' : 'none';
        }
        
        if (etapesArrivee) {
            etapesArrivee.style.display = isGroupage ? 'block' : 'none';
        }
        
        if (clientsMultiplesSection) {
            clientsMultiplesSection.style.display = isGroupage ? 'block' : 'none';
        }
        
        if (adressesMultiplesSection) {
            adressesMultiplesSection.style.display = isGroupage ? 'block' : 'none';
        }
        
        // Mettre à jour les classes CSS du body pour permettre des styles conditionnels
        document.body.classList.toggle('mode-groupage', isGroupage);
        document.body.classList.toggle('mode-standard', !isGroupage);
    }
    
    // Gestion du switcher pour la page de liste des prestations
    const prestationListSwitcher = document.getElementById('prestation-list-switcher');
    
    if (prestationListSwitcher) {
        const allButton = document.getElementById('show-all-prestations');
        const standardButton = document.getElementById('show-standard-prestations');
        const groupageButton = document.getElementById('show-groupage-prestations');
        
        // Fonction pour filtrer les prestations
        function filterPrestations(filterType) {
            const prestationRows = document.querySelectorAll('.prestation-row');
            
            prestationRows.forEach(row => {
                const prestationType = row.getAttribute('data-prestation-type');
                
                if (filterType === 'all' || prestationType === filterType) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Mettre à jour les classes actives des boutons
            if (allButton) allButton.classList.toggle('active', filterType === 'all');
            if (standardButton) standardButton.classList.toggle('active', filterType === 'standard');
            if (groupageButton) groupageButton.classList.toggle('active', filterType === 'groupage');
            
            // Sauvegarder la préférence de l'utilisateur
            localStorage.setItem('prestationListFilter', filterType);
        }
        
        // Ajouter les événements aux boutons
        if (allButton) {
            allButton.addEventListener('click', () => filterPrestations('all'));
        }
        
        if (standardButton) {
            standardButton.addEventListener('click', () => filterPrestations('standard'));
        }
        
        if (groupageButton) {
            groupageButton.addEventListener('click', () => filterPrestations('groupage'));
        }
        
        // Appliquer le filtre sauvegardé ou par défaut
        const savedFilter = localStorage.getItem('prestationListFilter') || 'all';
        filterPrestations(savedFilter);
    }
});
