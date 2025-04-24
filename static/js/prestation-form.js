/**
 * Script pour gérer le formulaire de prestation
 * Résout les problèmes de sélection de type de déménagement et de validation
 * et gère les clients multiples en mode groupage
 */

document.addEventListener('DOMContentLoaded', function() {
    // Référence aux éléments du formulaire
    const typeSelect = document.getElementById('type_demenagement_id');
    const typeHidden = document.getElementById('type_demenagement');
    const clientSelect = document.getElementById('client_id');
    const btnStandard = document.getElementById('btn-standard');
    const btnGroupage = document.getElementById('btn-groupage');
    const clientsSupplementairesDiv = document.getElementById('clients-supplementaires');
    
    // Initialiser le champ caché avec la valeur du select si disponible
    if (typeSelect && typeHidden) {
        // Au chargement, mettre à jour le champ caché avec le texte de l'option sélectionnée
        updateHiddenTypeField();
        
        // Écouter les changements sur le select
        typeSelect.addEventListener('change', updateHiddenTypeField);
    }
    
    // Fonction pour mettre à jour le champ caché avec le texte de l'option sélectionnée
    function updateHiddenTypeField() {
        if (typeSelect.selectedIndex >= 0) {
            // Récupérer le texte de l'option sélectionnée
            const selectedOption = typeSelect.options[typeSelect.selectedIndex];
            
            // Si l'utilisateur a sélectionné "Sélectionnez un type", utiliser une valeur par défaut
            if (typeSelect.value === '0') {
                if (btnGroupage.classList.contains('active')) {
                    typeHidden.value = 'Groupage';
                } else {
                    typeHidden.value = 'Standard';
                }
            } else {
                typeHidden.value = selectedOption.text;
            }
            
            console.log('Type déménagement mis à jour:', typeHidden.value);
        }
    }
    
    // Gérer les boutons de type de prestation (Standard/Groupage)
    if (btnStandard && btnGroupage) {
        btnStandard.addEventListener('click', function() {
            // Activer le bouton Standard et désactiver Groupage
            btnStandard.classList.add('active');
            btnGroupage.classList.remove('active');
            
            // Mettre à jour le type de déménagement en fonction de la sélection
            if (typeSelect.value === '0') {
                typeHidden.value = 'Standard';
            } else {
                updateHiddenTypeField();
            }
            
            // Masquer la section des clients supplémentaires en mode standard
            if (clientsSupplementairesDiv) {
                clientsSupplementairesDiv.style.display = 'none';
                const btnAjouterClient = document.getElementById('ajouter-client');
                if (btnAjouterClient) {
                    btnAjouterClient.style.display = 'none';
                }
            }
        });
        
        btnGroupage.addEventListener('click', function() {
            // Activer le bouton Groupage et désactiver Standard
            btnGroupage.classList.add('active');
            btnStandard.classList.remove('active');
            
            // Mettre à jour le type de déménagement en fonction de la sélection
            typeHidden.value = 'Groupage';
            
            // Afficher la section des clients supplémentaires en mode groupage
            if (clientsSupplementairesDiv) {
                clientsSupplementairesDiv.style.display = 'block';
                const btnAjouterClient = document.getElementById('ajouter-client');
                if (btnAjouterClient) {
                    btnAjouterClient.style.display = 'block';
                }
            }
        });
    }
    
    // Vérifier si le formulaire est valide avant la soumission
    const prestationForm = document.querySelector('form');
    if (prestationForm) {
        prestationForm.addEventListener('submit', function(event) {
            // Vérifier que le client est sélectionné
            if (clientSelect && clientSelect.value === '0') {
                event.preventDefault();
                alert('Veuillez sélectionner un client');
                return false;
            }
            
            // En mode groupage, vérifier qu'au moins un client supplémentaire est sélectionné
            if (btnGroupage && btnGroupage.classList.contains('active') && clientsSupplementairesDiv) {
                const clientsSupplementaires = clientsSupplementairesDiv.querySelectorAll('select');
                if (clientsSupplementaires.length === 0) {
                    event.preventDefault();
                    alert('En mode groupage, veuillez ajouter au moins un client supplémentaire');
                    return false;
                }
                
                // Vérifier que tous les clients supplémentaires sont sélectionnés
                let clientInvalide = false;
                clientsSupplementaires.forEach(select => {
                    if (!select.value) {
                        clientInvalide = true;
                    }
                });
                
                if (clientInvalide) {
                    event.preventDefault();
                    alert('Veuillez sélectionner tous les clients supplémentaires ou supprimer les champs vides');
                    return false;
                }
            }
            
            // S'assurer que le champ caché type_demenagement a une valeur
            if (typeHidden && !typeHidden.value) {
                if (typeSelect.value === '0') {
                    // Si aucun type sélectionné, utiliser Standard ou Groupage selon le bouton actif
                    if (btnGroupage.classList.contains('active')) {
                        typeHidden.value = 'Groupage';
                    } else {
                        typeHidden.value = 'Standard';
                    }
                } else {
                    // Sinon, utiliser le texte de l'option sélectionnée
                    updateHiddenTypeField();
                }
            }
            
            // Vérifier que les transporteurs sont sélectionnés
            const transporteursSelect = document.getElementById('transporteurs');
            if (transporteursSelect && transporteursSelect.selectedOptions.length === 0) {
                const confirmer = confirm('Aucun transporteur sélectionné. Voulez-vous continuer sans transporteur ?');
                if (!confirmer) {
                    event.preventDefault();
                    return false;
                }
            }
            
            // Afficher un message de validation
            console.log('Formulaire validé, type de déménagement:', typeHidden.value);
        });
    }
    
    // Fonction pour ajouter un client supplémentaire en mode groupage
    const btnAjouterClient = document.getElementById('ajouter-client');
    if (btnAjouterClient && clientsSupplementairesDiv) {
        btnAjouterClient.addEventListener('click', function() {
            // Compter les clients supplémentaires existants
            const numClients = clientsSupplementairesDiv.querySelectorAll('.client-supplementaire').length;
            
            // Créer un nouveau conteneur pour ce client
            const clientDiv = document.createElement('div');
            clientDiv.className = 'client-supplementaire input-group mt-2';
            clientDiv.innerHTML = `
                <select class="form-select" name="client_supplementaire_${numClients + 1}" required>
                    <option value="">Sélectionnez un client supplémentaire</option>
                    ${Array.from(document.getElementById('client_id').options)
                        .filter(opt => opt.value !== '0')
                        .map(opt => `<option value="${opt.value}">${opt.text}</option>`)
                        .join('')}
                </select>
                <button type="button" class="btn btn-outline-danger btn-supprimer-client">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Ajouter au conteneur
            clientsSupplementairesDiv.appendChild(clientDiv);
            
            // Ajouter l'écouteur d'événement pour le bouton de suppression
            const btnSupprimer = clientDiv.querySelector('.btn-supprimer-client');
            btnSupprimer.addEventListener('click', function() {
                clientDiv.remove();
            });
        });
        
        // Afficher ou masquer selon le mode actuel
        if (btnGroupage.classList.contains('active')) {
            btnAjouterClient.style.display = 'block';
            clientsSupplementairesDiv.style.display = 'block';
        } else {
            btnAjouterClient.style.display = 'none';
            clientsSupplementairesDiv.style.display = 'none';
        }
    }
    
    // Fixer le problème des erreurs dans la console
    window.addEventListener('error', function(event) {
        // Ne pas intercepter les erreurs vides ou non significatives
        if (!event.message || event.message === "Script error." || event.message === "Erreur: {}") {
            return; // Laisser l'erreur s'afficher normalement
        }
        
        // Capturer l'erreur pour analyse mais empêcher l'affichage dans la console
        console.log('Erreur interceptée:', {
            message: event.message,
            source: event.filename,
            line: event.lineno,
            column: event.colno,
            error: event.error ? (event.error.stack || event.error.toString()) : 'Non disponible'
        });
        
        // Empêcher l'affichage de l'erreur dans la console seulement pour les erreurs que nous gérons
        if (event.filename && event.filename.includes('transporteurs-disponibilite.js')) {
            event.preventDefault();
        }
    });
});
