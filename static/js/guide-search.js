document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('#guide-search');
    if (!searchInput) return;

    // Sélectionner tous les éléments de contenu
    const guideItems = document.querySelectorAll('.guide-item');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Gérer le bouton de fermeture
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            window.location.href = '/dashboard';
        });
    }

    // Créer le message "aucun résultat"
    const noResultsMessage = document.createElement('div');
    noResultsMessage.className = 'alert alert-info mt-3';
    noResultsMessage.style.display = 'none';
    noResultsMessage.innerHTML = '<i class="fas fa-info-circle"></i> Aucun résultat trouvé';
    searchInput.parentElement.appendChild(noResultsMessage);

    // Fonction pour changer d'onglet
    function switchTab(tabId) {
        // Désactiver tous les onglets
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activer l'onglet sélectionné
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
        const selectedContent = document.getElementById(tabId);
        
        if (selectedButton && selectedContent) {
            selectedButton.classList.add('active');
            selectedContent.classList.add('active');
        }
    }

    // Ajouter les écouteurs d'événements pour les onglets
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
            // Réinitialiser la recherche quand on change d'onglet
            searchInput.value = '';
            searchContent('');
        });
    });

    // Fonction pour mettre en surbrillance le texte trouvé
    function highlightText(element, searchTerm) {
        if (!element || !searchTerm) {
            if (element) {
                element.innerHTML = element.innerHTML.replace(/<mark class="highlight">(.*?)<\/mark>/g, '$1');
            }
            return;
        }

        const regex = new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        element.innerHTML = element.innerHTML.replace(/<mark class="highlight">(.*?)<\/mark>/g, '$1');
        element.innerHTML = element.innerHTML.replace(regex, match => `<mark class="highlight">${match}</mark>`);
    }

    // Fonction pour rechercher dans le contenu
    function searchContent(searchTerm) {
        searchTerm = searchTerm.toLowerCase().trim();
        let hasResults = false;
        let visibleTabs = new Set();

        // Si la recherche est vide, tout afficher
        if (!searchTerm) {
            guideItems.forEach(item => {
                item.style.display = '';
                highlightText(item.querySelector('h3'), '');
                highlightText(item.querySelector('p'), '');
            });
            tabContents.forEach(tab => tab.style.display = tab.classList.contains('active') ? '' : 'none');
            tabButtons.forEach(btn => btn.style.display = '');
            noResultsMessage.style.display = 'none';
            return;
        }

        // Rechercher dans chaque élément
        guideItems.forEach(item => {
            const title = item.querySelector('h3')?.textContent.toLowerCase() || '';
            const content = item.querySelector('p')?.textContent.toLowerCase() || '';
            const keywords = searchTerm.split(' ').filter(word => word.length > 0);
            
            const matches = keywords.every(word => 
                title.includes(word) || content.includes(word)
            );

            if (matches) {
                item.style.display = '';
                highlightText(item.querySelector('h3'), searchTerm);
                highlightText(item.querySelector('p'), searchTerm);
                hasResults = true;
                
                // Trouver l'onglet parent
                let tabContent = item.closest('.tab-content');
                if (tabContent) {
                    visibleTabs.add(tabContent.id);
                }
            } else {
                item.style.display = 'none';
                highlightText(item.querySelector('h3'), '');
                highlightText(item.querySelector('p'), '');
            }
        });

        // Mettre à jour l'affichage des onglets
        tabButtons.forEach(btn => {
            const tabId = btn.getAttribute('data-tab');
            if (visibleTabs.has(tabId)) {
                btn.style.display = '';
                // Si aucun onglet n'est actif et visible, activer celui-ci
                const activeTab = document.querySelector('.tab-button.active');
                if (!activeTab || activeTab.style.display === 'none') {
                    switchTab(tabId);
                }
            } else {
                btn.style.display = 'none';
                if (btn.classList.contains('active')) {
                    // Si l'onglet actif est caché, activer le premier onglet visible
                    const firstVisibleTab = document.querySelector('.tab-button[style=""]');
                    if (firstVisibleTab) {
                        switchTab(firstVisibleTab.getAttribute('data-tab'));
                    }
                }
            }
        });

        // Afficher/masquer le message "aucun résultat"
        noResultsMessage.style.display = hasResults ? 'none' : 'block';
    }

    // Ajouter le style pour la surbrillance
    const style = document.createElement('style');
    style.textContent = `
        .highlight {
            background-color: #fff3cd;
            padding: 0 2px;
            border-radius: 2px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    // Écouter les changements dans la barre de recherche
    let searchTimeout;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        // Ajouter un délai pour éviter trop de recherches pendant la frappe
        searchTimeout = setTimeout(() => {
            searchContent(e.target.value);
        }, 200);
    });

    // Écouter le focus sur la barre de recherche
    searchInput.addEventListener('focus', function() {
        this.select();
    });

    // Initialiser l'onglet actif
    const defaultTab = 'avantages';
    switchTab(defaultTab);
});
