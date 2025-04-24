/**
 * Script pour gérer les étapes d'arrêt intermédiaires 
 * dans les formulaires de création et modification de prestation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Référence aux éléments du formulaire
    const etapesArretDiv = document.getElementById('etapes-arret');
    const btnAjouterEtape = document.getElementById('ajouter-etape');
    
    // Fonction pour ajouter une nouvelle étape d'arrêt
    function ajouterEtapeArret() {
        if (!etapesArretDiv) return;
        
        // Compter les étapes existantes pour générer un ID unique
        const numEtapes = etapesArretDiv.querySelectorAll('.etape-arret').length;
        
        // Créer un nouveau conteneur pour cette étape
        const etapeDiv = document.createElement('div');
        etapeDiv.className = 'etape-arret mb-3 p-3 border rounded';
        etapeDiv.dataset.etapeId = numEtapes + 1;
        
        // Créer le contenu de l'étape
        etapeDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="m-0">Étape d'arrêt ${numEtapes + 1}</h5>
                <button type="button" class="btn btn-sm btn-outline-danger btn-supprimer-etape">
                    <i class="fas fa-times"></i> Supprimer
                </button>
            </div>
            <div class="form-group mb-2">
                <label for="etape_adresse_${numEtapes + 1}">Adresse de l'étape</label>
                <input type="text" class="form-control etape-adresse" id="etape_adresse_${numEtapes + 1}" 
                       name="etape_adresse_${numEtapes + 1}" placeholder="123 rue exemple, Ville" required>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="etape_date_${numEtapes + 1}">Date</label>
                        <input type="date" class="form-control etape-date" id="etape_date_${numEtapes + 1}" 
                               name="etape_date_${numEtapes + 1}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="etape_type_${numEtapes + 1}">Type d'étape</label>
                        <select class="form-control etape-type" id="etape_type_${numEtapes + 1}" 
                                name="etape_type_${numEtapes + 1}" required>
                            <option value="chargement">Chargement</option>
                            <option value="dechargement">Déchargement</option>
                            <option value="mixte">Chargement & Déchargement</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="form-group mt-2">
                <label for="etape_notes_${numEtapes + 1}">Notes</label>
                <textarea class="form-control etape-notes" id="etape_notes_${numEtapes + 1}" 
                          name="etape_notes_${numEtapes + 1}" rows="2" 
                          placeholder="Instructions spécifiques pour cette étape..."></textarea>
            </div>
        `;
        
        // Ajouter au conteneur principal
        etapesArretDiv.appendChild(etapeDiv);
        
        // Configurer la date à la date du jour par défaut
        const dateInput = etapeDiv.querySelector('.etape-date');
        if (dateInput) {
            const today = new Date();
            const year = today.getFullYear();
            let month = today.getMonth() + 1;
            let day = today.getDate();
            
            // Formater le mois et le jour avec un zéro initial si nécessaire
            month = month < 10 ? '0' + month : month;
            day = day < 10 ? '0' + day : day;
            
            dateInput.value = `${year}-${month}-${day}`;
        }
        
        // Ajouter l'écouteur d'événement pour le bouton de suppression
        const btnSupprimer = etapeDiv.querySelector('.btn-supprimer-etape');
        if (btnSupprimer) {
            btnSupprimer.addEventListener('click', function() {
                etapeDiv.remove();
                renumeroterEtapes();
            });
        }
        
        // Mettre à jour le champ caché avec la liste des étapes
        mettreAJourChampsEtapes();
        
        // Retourner l'élément créé pour permettre aux autres fonctions d'y accéder
        return etapeDiv;
    }
    
    // Fonction pour renuméroter les étapes après suppression
    function renumeroterEtapes() {
        if (!etapesArretDiv) return;
        
        const etapes = etapesArretDiv.querySelectorAll('.etape-arret');
        etapes.forEach((etape, index) => {
            // Mettre à jour l'ID de l'étape
            etape.dataset.etapeId = index + 1;
            
            // Mettre à jour le titre
            const titre = etape.querySelector('h5');
            if (titre) {
                titre.textContent = `Étape d'arrêt ${index + 1}`;
            }
            
            // Mettre à jour les attributs name et id des champs
            const champs = etape.querySelectorAll('input, select, textarea');
            champs.forEach(champ => {
                const baseName = champ.name.split('_').slice(0, -1).join('_');
                const baseId = champ.id.split('_').slice(0, -1).join('_');
                
                champ.name = `${baseName}_${index + 1}`;
                champ.id = `${baseId}_${index + 1}`;
            });
        });
        
        // Mettre à jour le champ caché avec la liste des étapes
        mettreAJourChampsEtapes();
    }
    
    // Fonction pour mettre à jour le champ caché avec la liste des étapes
    function mettreAJourChampsEtapes() {
        if (!etapesArretDiv) return;
        
        // Collecter toutes les données des étapes
        const etapes = etapesArretDiv.querySelectorAll('.etape-arret');
        const etapesData = [];
        
        etapes.forEach(etape => {
            const etapeId = etape.dataset.etapeId;
            const adresse = etape.querySelector('.etape-adresse').value;
            const date = etape.querySelector('.etape-date').value;
            const type = etape.querySelector('.etape-type').value;
            const notes = etape.querySelector('.etape-notes').value;
            
            etapesData.push({
                id: etapeId,
                adresse: adresse,
                date: date,
                type: type,
                notes: notes
            });
        });
        
        // Créer ou mettre à jour le champ caché
        let etapesInput = document.getElementById('etapes_arret_json');
        if (!etapesInput) {
            etapesInput = document.createElement('input');
            etapesInput.type = 'hidden';
            etapesInput.id = 'etapes_arret_json';
            etapesInput.name = 'etapes_arret_json';
            document.querySelector('form').appendChild(etapesInput);
        }
        
        // Mettre à jour la valeur du champ
        etapesInput.value = JSON.stringify(etapesData);
    }
    
    // Attacher l'écouteur d'événement au bouton d'ajout d'étape
    if (btnAjouterEtape) {
        btnAjouterEtape.addEventListener('click', ajouterEtapeArret);
    }
    
    // Initialiser avec les étapes existantes si présentes (pour le mode édition)
    if (etapesArretDiv && etapesArretDiv.dataset.etapes) {
        try {
            const etapesExistantes = JSON.parse(etapesArretDiv.dataset.etapes);
            if (Array.isArray(etapesExistantes) && etapesExistantes.length > 0) {
                etapesExistantes.forEach(etapeData => {
                    const etapeDiv = ajouterEtapeArret();
                    if (etapeDiv) {
                        // Remplir les champs avec les données existantes
                        etapeDiv.querySelector('.etape-adresse').value = etapeData.adresse || '';
                        etapeDiv.querySelector('.etape-date').value = etapeData.date || '';
                        etapeDiv.querySelector('.etape-type').value = etapeData.type || 'chargement';
                        etapeDiv.querySelector('.etape-notes').value = etapeData.notes || '';
                    }
                });
            }
        } catch (e) {
            console.error('Erreur lors du chargement des étapes existantes:', e);
        }
    }
    
    // Mettre à jour le champ caché lors de la soumission du formulaire
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(event) {
            // Mettre à jour le champ caché avec les données les plus récentes
            mettreAJourChampsEtapes();
        });
    }
    
    // Mettre à jour les étapes quand les champs changent
    document.addEventListener('change', function(event) {
        if (event.target.closest('.etape-arret')) {
            mettreAJourChampsEtapes();
        }
    });
});
