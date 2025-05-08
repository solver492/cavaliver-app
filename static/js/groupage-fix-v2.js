/**
 * SOLUTION FINALE - MODE GROUPAGE
 * Script complètement réécrit pour résoudre tous les problèmes d'interférence
 */

// IMPORTANT: Utiliser le chargement complet de la page + délai important
// pour être sûr d'être le dernier à s'exécuter
window.addEventListener('load', function() {
    console.log('INITIALISATION FINALE DU MODE GROUPAGE');
    
    // S'assurer que le mode groupage est activé si le bouton radio est coché
    const modeGroupageSwitch = document.getElementById('mode_groupage');
    if (modeGroupageSwitch && modeGroupageSwitch.checked) {
        // Mettre à jour le champ caché pour forcer le mode groupage
        const typeHidden = document.getElementById('type_demenagement_hidden');
        if (typeHidden) {
            typeHidden.value = 'Groupage';
            console.log('Le mode groupage a été forcé à "Groupage"');
        }
        
        // S'assurer que le formulaire sait qu'il est en mode groupage
        const form = document.querySelector('form');
        if (form) {
            form.setAttribute('data-mode', 'groupage');
        }
    }
    
    // Attendre 1 seconde pour être sûr que tout est chargé
    setTimeout(function() {
        // D'abord, trouver les éléments principaux
        console.log('Début de l\'initialisation du groupage après délai');
        const sectionGroupage = document.getElementById('section-clients-supplementaires');
        const conteneurClients = document.getElementById('clients-supplementaires');
        const boutonAjouter = document.getElementById('ajouter-client');
        
        // S'assurer que les éléments existent
        if (!sectionGroupage || !conteneurClients || !boutonAjouter) {
            console.error('ERREUR: Éléments HTML importants manquants!');
            return; // Arrêter si les éléments n'existent pas
        }

        // 1. Rendre visible la section
        sectionGroupage.classList.remove('d-none');
        
        // 2. Nettoyer complètement le conteneur
        conteneurClients.innerHTML = '';

        // 3. Vérifier si l'API des clients fonctionne
        console.log('Test de l\'API clients:');
        fetch('/api/clients')
            .then(response => {
                console.log('Réponse de l\'API:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Données clients reçues:', data);
            })
            .catch(error => {
                console.error('Erreur API clients:', error);
            });
        
        // 4. Détruire et recréer le bouton pour supprimer tous les gestionnaires
        const nouveauBouton = document.createElement('button');
        nouveauBouton.type = 'button';
        nouveauBouton.className = boutonAjouter.className;
        nouveauBouton.id = 'ajouter-client';
        nouveauBouton.innerHTML = '<i class="fas fa-plus"></i> Ajouter un client';
        
        // Remplacer l'ancien bouton par le nouveau
        boutonAjouter.parentNode.replaceChild(nouveauBouton, boutonAjouter);
        
        // 5. Ajouter notre unique gestionnaire
        nouveauBouton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clic sur Ajouter Client détecté');
            ajouterNouveauClient();
            return false;
        };
        
        // 6. Ajouter le gestionnaire de suppression
        conteneurClients.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-remove') || e.target.closest('.btn-remove')) {
                const ligne = e.target.closest('.ligne-client');
                if (ligne) ligne.remove();
            }
        });
        
        // 7. Ajouter un gestionnaire pour le formulaire avant soumission
        const formulaire = document.querySelector('form');
        if (formulaire) {
            formulaire.addEventListener('submit', function(e) {
                const modeGroupageSwitch = document.getElementById('mode_groupage');
                if (modeGroupageSwitch && modeGroupageSwitch.checked) {
                    // Vérifier que le type caché est bien mis à Groupage
                    const typeHidden = document.getElementById('type_demenagement_hidden');
                    if (typeHidden) {
                        typeHidden.value = 'Groupage';
                    }
                    
                    // Ajouter un champ caché pour confirmer le mode groupage
                    const confirmGroupageField = document.createElement('input');
                    confirmGroupageField.type = 'hidden';
                    confirmGroupageField.name = 'est_groupage';
                    confirmGroupageField.value = 'true';
                    formulaire.appendChild(confirmGroupageField);
                    
                    console.log('Formulaire soumis en mode GROUPAGE');
                }
            });
        }
        
        console.log('Initialisation du mode groupage terminée avec succès!');
    }, 1000); // Attendre 1 seconde complète
});

/**
 * Fonction complètement réécrite pour ajouter un client et son montant
 */
function ajouterNouveauClient() {
    console.log('Début de la fonction ajouterNouveauClient');
    const conteneur = document.getElementById('clients-supplementaires');
    if (!conteneur) {
        console.error('Conteneur clients-supplementaires introuvable!');
        return;
    }
    
    // Créer la ligne principale avec fond gris clair
    const ligne = document.createElement('div');
    ligne.className = 'ligne-client row mb-3 bg-light p-3 rounded';
    
    // Créer la structure de base avec des noms de champs explicites pour le backend
    ligne.innerHTML = `
        <div class="col-md-6">
            <select class="form-select" name="clients_supplementaires[]" required>
                <option value="">Sélectionner un client...</option>
            </select>
        </div>
        <div class="col-md-4">
            <input type="number" class="form-control" name="montants_supplementaires[]" placeholder="Montant" required min="0" step="0.01">
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger btn-sm btn-remove w-100">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Ajouter la ligne au conteneur
    conteneur.appendChild(ligne);
    
    // Récupérer le select pour ajouter les options
    const select = ligne.querySelector('select');
    
    // Récupérer les clients depuis l'API
    console.log('Récupération des clients depuis API...');
    fetch('/api/clients')
        .then(response => {
            console.log('Réponse API reçue:', response.status);
            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Données clients reçues:', data);
            
            // Si les données sont dans un objet avec une propriété 'clients'
            const clients = Array.isArray(data) ? data : (data.clients || []);
            
            if (clients.length === 0) {
                console.warn('Aucun client reçu de l\'API!');
            }
            
            // Ajouter chaque client comme option
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                
                // Formatter le nom avec prénom si disponible
                let nomComplet = '';
                if (client.prenom) {
                    nomComplet = `${client.nom} ${client.prenom}`;
                } else if (client.nom && client.prenom) {
                    nomComplet = `${client.nom} ${client.prenom}`;
                } else if (client.firstname && client.lastname) {
                    nomComplet = `${client.lastname} ${client.firstname}`;
                } else if (client.nom_complet) {
                    nomComplet = client.nom_complet;
                } else {
                    nomComplet = client.nom || client.name || `Client #${client.id}`;
                }
                
                option.textContent = nomComplet;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des clients:', error);
            // Ajouter des clients par défaut en cas d'erreur
            select.innerHTML += '<option value="1">Client de secours 1</option>';
            select.innerHTML += '<option value="2">Client de secours 2</option>';
        });
}