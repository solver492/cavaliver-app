/**
 * Script de correction pour le mode groupage
 * Ce script force l'affichage et le fonctionnement de la section clients supplémentaires
 * en mode groupage, en contournant les problèmes d'événements et de visibilité.
 * Version 2.0 avec gestion d'erreur améliorée
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
    
    // Fonction pour ajouter directement un gestionnaire d'événement au bouton
    function ajouterGestionnaireAjoutClient() {
        // Vérifier si les éléments nécessaires existent
        if (!ajouterClientBtn) {
            console.error('FORCE: Bouton d\'ajout de client non trouvé');
            return;
        }
        
        if (!clientsSupplementairesContainer) {
            console.error('FORCE: Conteneur des clients supplémentaires non trouvé');
            return;
        }
        
        console.log('FORCE: Ajout du gestionnaire d\'événements pour l\'ajout de clients');
        
        // Supprimer les gestionnaires d'événements existants en utilisant une méthode plus sûre
        ajouterClientBtn.onclick = null;
            
            // Ajouter un nouveau gestionnaire d'événements
            newBtn.addEventListener('click', function() {
                console.log('FORCE: Clic sur le bouton ajouter client');
                
                // Créer un compteur local si nécessaire
                const compteurClients = document.querySelectorAll('.client-supplementaire').length + 1;
                
                // Créer le nouvel élément client
                const clientDiv = document.createElement('div');
                clientDiv.className = 'card mb-3 client-supplementaire fade-in';
                clientDiv.style.borderLeft = '4px solid #0d6efd';
                
                // Récupérer les options du select client original
                const optionsClients = Array.from(document.getElementById('client_id').options);
                let optionsHTML = '';
                optionsClients.forEach(option => {
                    optionsHTML += `<option value="${option.value}">${option.text}</option>`;
                });
                
                // Définir le contenu HTML
                clientDiv.innerHTML = `
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0"><i class="fas fa-user"></i> Client ${compteurClients}</h6>
                            <button type="button" class="btn btn-sm btn-outline-danger supprimer-client" title="Supprimer ce client">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Sélectionner un client</label>
                            <select class="form-select" name="client_supplementaire_${compteurClients}">
                                ${optionsHTML}
                            </select>
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
                            clientsSupplementairesContainer.removeChild(clientDiv);
                        }, 300);
                    });
                }
            });
            
            console.log('FORCE: Gestionnaire d\'événements pour l\'ajout de clients réinitialisé avec succès');
        } else {
            console.error('FORCE: Bouton d\'ajout de client ou conteneur non trouvé');
        }
    }
    
    // Fonction pour activer le mode groupage
    function activerModeGroupage() {
        if (radioGroupage) {
            console.log('FORCE: Activation du mode groupage');
            
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
        } else {
            console.error('FORCE: Bouton radio Groupage non trouvé');
        }
    }
    
    // Ajouter des gestionnaires d'événements pour le bouton radio groupage
    if (radioGroupage) {
        // Gestionnaire pour le changement d'état
        radioGroupage.addEventListener('change', function() {
            if (this.checked) {
                console.log('FORCE: Bouton radio Groupage sélectionné (événement change)');
                activerModeGroupage();
                reinitialiserAjoutClient();
            }
        });
        
        // Gestionnaire pour le clic direct
        radioGroupage.addEventListener('click', function() {
            console.log('FORCE: Clic direct sur le bouton radio Groupage');
            setTimeout(forceAfficherClientsSupplementaires, 100);
            setTimeout(reinitialiserAjoutClient, 200);
        });
        
        // Gestionnaire pour le clic sur le label
        const labelGroupage = document.querySelector('label[for="radio-groupage"]');
        if (labelGroupage) {
            labelGroupage.addEventListener('click', function() {
                console.log('FORCE: Clic sur le label du bouton radio Groupage');
                setTimeout(forceAfficherClientsSupplementaires, 100);
                setTimeout(reinitialiserAjoutClient, 200);
            });
        }
        
        // Si le bouton est déjà coché, activer le mode groupage
        if (radioGroupage.checked) {
            console.log('FORCE: Bouton radio Groupage déjà coché, activation automatique');
            setTimeout(activerModeGroupage, 100);
            setTimeout(reinitialiserAjoutClient, 200);
        }
    }
    
    // Exécuter les fonctions après un court délai pour s'assurer que tous les éléments sont chargés
    setTimeout(function() {
        // Si le bouton radio groupage est coché, activer le mode groupage
        if (radioGroupage && radioGroupage.checked) {
            activerModeGroupage();
            reinitialiserAjoutClient();
        }
        
        // Ajouter un bouton de secours pour forcer l'affichage
        const formContainer = document.querySelector('form');
        if (formContainer) {
            const boutonSecours = document.createElement('button');
            boutonSecours.type = 'button';
            boutonSecours.className = 'btn btn-warning mt-3';
            boutonSecours.innerHTML = '<i class="fas fa-tools"></i> Forcer l\'affichage des clients supplémentaires';
            boutonSecours.style.position = 'fixed';
            boutonSecours.style.bottom = '20px';
            boutonSecours.style.right = '20px';
            boutonSecours.style.zIndex = '9999';
            
            boutonSecours.addEventListener('click', function() {
                activerModeGroupage();
                reinitialiserAjoutClient();
            });
            
            document.body.appendChild(boutonSecours);
        }
    }, 500);
});
