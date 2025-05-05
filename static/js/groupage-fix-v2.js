/**
 * Script de correction pour le mode groupage - Version 2
 * Ce script force l'affichage et le fonctionnement de la section clients supplémentaires
 * en mode groupage, avec une meilleure gestion d'erreur.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du script de correction pour le mode groupage v2.0');

    // Sélecteurs pour les éléments importants
    const radioGroupage = document.getElementById('radio-groupage');
    const sectionClientsSupplementaires = document.getElementById('section-clients-supplementaires');
    const clientsSupplementairesContainer = document.getElementById('clients-supplementaires');
    const ajouterClientBtn = document.getElementById('ajouter-client');

    // Fonction pour forcer l'affichage de la section clients supplémentaires
    function forceAfficherClientsSupplementaires() {
        console.log('FORCE: Affichage forcé de la section clients supplémentaires');

        if (sectionClientsSupplementaires) {
            // Forcer l'affichage avec plusieurs propriétés CSS
            sectionClientsSupplementaires.style.display = 'block';
            sectionClientsSupplementaires.style.visibility = 'visible';
            sectionClientsSupplementaires.style.opacity = '1';
            sectionClientsSupplementaires.style.height = 'auto';
            sectionClientsSupplementaires.style.overflow = 'visible';

            // Ajouter une bordure pour le rendre plus visible
            sectionClientsSupplementaires.style.border = '2px solid #0d6efd';
            sectionClientsSupplementaires.style.borderRadius = '5px';
            sectionClientsSupplementaires.style.padding = '5px';

            console.log('FORCE: Section clients supplémentaires affichée avec succès');
        } else {
            console.error('FORCE: Section clients supplémentaires non trouvée');
        }
    }

    // Fonction pour ajouter un client supplémentaire de manière sécurisée
    function ajouterClientSupplementaire() {
        console.log('FORCE: Ajout d\'un client supplémentaire');

        // Vérifier si le conteneur existe
        if (!clientsSupplementairesContainer) {
            console.error('FORCE: Conteneur des clients supplémentaires non trouvé');
            return;
        }

        // Créer un compteur local
        const compteurClients = document.querySelectorAll('.client-supplementaire').length + 1;

        // Créer le nouvel élément client
        const clientDiv = document.createElement('div');
        clientDiv.className = 'card mb-3 client-supplementaire fade-in';
        clientDiv.style.borderLeft = '4px solid #0d6efd';

        try {
            // Récupérer les options du select client original
            const clientSelect = document.getElementById('client_id');
            if (!clientSelect) {
                throw new Error('Select client original non trouvé');
            }

            const optionsClients = Array.from(clientSelect.options);
            let optionsHTML = '';
            optionsClients.forEach(option => {
                optionsHTML += `<option value="${option.value}">${option.text}</option>`;
            });

            // Définir le contenu HTML -  Removed card-header
            clientDiv.innerHTML = `
                <div class="card-body p-3">
                    <div class="form-group">
                        <label class="form-label">Sélectionnez un client</label>
                        <select class="form-select" name="clients_supplementaires[]">
                            ${optionsHTML}
                        </select>
                    </div>
                    <div class="form-group mt-2">
                        <label class="form-label">Montant</label>
                        <input type="number" class="form-control" name="montants_supplementaires[]" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
            `;

            // Ajouter le client au conteneur
            clientsSupplementairesContainer.appendChild(clientDiv);

            // Ajouter l'événement pour supprimer ce client
            const supprimerBtn = clientDiv.querySelector('.supprimer-client');
            if (supprimerBtn) {
                supprimerBtn.addEventListener('click', function() {
                    // Ajouter une animation de transition
                    clientDiv.classList.add('fade-out');
                    setTimeout(() => {
                        if (clientDiv.parentNode) {
                            clientDiv.parentNode.removeChild(clientDiv);
                        }
                    }, 300);
                });
            }

            console.log('FORCE: Client supplémentaire ajouté avec succès');
        } catch (error) {
            console.error('FORCE: Erreur lors de l\'ajout d\'un client supplémentaire:', error);

            // Afficher un message d'erreur à l'utilisateur
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger mt-3';
            errorMessage.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                Erreur lors de l'ajout d'un client supplémentaire: ${error.message}
            `;

            // Ajouter le message d'erreur au conteneur
            if (clientsSupplementairesContainer) {
                clientsSupplementairesContainer.appendChild(errorMessage);

                // Supprimer le message après 5 secondes
                setTimeout(() => {
                    if (errorMessage.parentNode) {
                        errorMessage.parentNode.removeChild(errorMessage);
                    }
                }, 5000);
            }
        }
    }

    // Fonction pour activer le mode groupage
    function activerModeGroupage() {
        console.log('FORCE: Activation du mode groupage');

        // Vérifier si le bouton radio existe
        if (!radioGroupage) {
            console.error('FORCE: Bouton radio Groupage non trouvé');
            return;
        }

        // Cocher le bouton radio groupage
        radioGroupage.checked = true;

        // Mettre à jour le champ caché
        const typeHidden = document.getElementById('type_demenagement_hidden');
        if (typeHidden) {
            typeHidden.value = 'Groupage';
        }

        // Forcer l'affichage de la section clients supplémentaires
        forceAfficherClientsSupplementaires();

        // Mettre à jour le message d'information
        const modeInfo = document.getElementById('mode-info');
        if (modeInfo) {
            modeInfo.innerHTML = '<i class="fas fa-info-circle me-2"></i> Mode groupage: plusieurs clients, plusieurs points de départ et d\'arrivée';
        }

        console.log('FORCE: Mode groupage activé avec succès');
    }

    // Initialiser les gestionnaires d'événements
    function initialiserGestionnaires() {
        console.log('FORCE: Initialisation des gestionnaires d\'événements');

        // Gestionnaire pour le bouton d'ajout de client
        if (ajouterClientBtn) {
            // Supprimer les gestionnaires existants et ajouter le nouveau
            ajouterClientBtn.onclick = null;
            ajouterClientBtn.addEventListener('click', ajouterClientSupplementaire);
            console.log('FORCE: Gestionnaire d\'événement ajouté au bouton d\'ajout de client');
        } else {
            console.error('FORCE: Bouton d\'ajout de client non trouvé');
        }

        // Gestionnaire pour le bouton radio groupage
        if (radioGroupage) {
            // Gestionnaire pour le changement d'état
            radioGroupage.addEventListener('change', function() {
                if (this.checked) {
                    console.log('FORCE: Bouton radio Groupage sélectionné (événement change)');
                    activerModeGroupage();
                }
            });

            // Gestionnaire pour le clic direct
            radioGroupage.addEventListener('click', function() {
                console.log('FORCE: Clic direct sur le bouton radio Groupage');
                setTimeout(forceAfficherClientsSupplementaires, 100);
            });

            // Gestionnaire pour le label
            const labelGroupage = document.querySelector('label[for="radio-groupage"]');
            if (labelGroupage) {
                labelGroupage.addEventListener('click', function() {
                    console.log('FORCE: Clic sur le label du bouton radio Groupage');
                    setTimeout(forceAfficherClientsSupplementaires, 100);
                });
            }

            // Si le bouton est déjà coché, activer le mode groupage
            if (radioGroupage.checked) {
                console.log('FORCE: Bouton radio Groupage déjà coché, activation automatique');
                setTimeout(activerModeGroupage, 100);
            }

            console.log('FORCE: Gestionnaires d\'événements ajoutés au bouton radio groupage');
        } else {
            console.error('FORCE: Bouton radio Groupage non trouvé');
        }
    }

    // Fonction pour le bouton de secours supprimée car non nécessaire

    // Exécuter les fonctions d'initialisation
    try {
        // Initialiser les gestionnaires d'événements
        initialiserGestionnaires();

        // Si le mode groupage est déjà sélectionné, forcer l'affichage
        if (radioGroupage && radioGroupage.checked) {
            setTimeout(forceAfficherClientsSupplementaires, 100);
            setTimeout(forceAfficherClientsSupplementaires, 500);
            setTimeout(forceAfficherClientsSupplementaires, 1000);
        }

        console.log('FORCE: Initialisation du script de correction terminée avec succès');
    } catch (error) {
        console.error('FORCE: Erreur lors de l\'initialisation du script de correction:', error);
    }
});