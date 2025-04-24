/**
 * Script pour la gestion complète des transporteurs
 * - Supprime l'ancien système
 * - Affiche les vrais transporteurs de la base de données
 * - Gère la vérification des disponibilités
 */

(function() {
    console.log("=== SYSTÈME DE TRANSPORTEURS PROPRE ===");
    
    // Fonction pour nettoyer complètement l'ancien système
    function nettoyerAncienSysteme() {
        console.log("Nettoyage de l'ancien système...");
        
        // 1. Supprimer tous les éléments de l'ancien système
        const selecteursASupprimer = [
            // Sélecteurs spécifiques de l'ancien système
            '.widget-transport-module', 
            '.old-transporteur-widget',
            '.transporteur-widget-container',
            '#transporteurs-disponibles-resultats',
            '#transporteurs',
            '#valider-transporteurs',
            '.selected-transporteurs-count',
            '.transporteurs-counter',
            // Sélecteurs génériques qui pourraient être liés
            '[id*="transporteur"]',
            '[class*="transporteur"]',
            '.card:has(.fa-truck)',
            // Sélecteurs du nouveau système (pour éviter les doublons)
            '#nouveau-systeme-transporteurs',
            '#systeme-transporteurs-propre'
        ];
        
        // Supprimer les éléments correspondant aux sélecteurs
        selecteursASupprimer.forEach(selecteur => {
            try {
                document.querySelectorAll(selecteur).forEach(element => {
                    // Ne pas supprimer les éléments qui sont des inputs cachés (pour conserver les valeurs)
                    if (element.tagName !== 'INPUT' || !element.type === 'hidden') {
                        element.remove();
                        console.log(`Élément supprimé: ${selecteur}`);
                    }
                });
            } catch (error) {
                console.error(`Erreur lors de la suppression de ${selecteur}:`, error);
            }
        });
        
        // 2. Supprimer les scripts liés à l'ancien système
        const scriptsASupprimer = [
            'transporteurs-disponibilite.js',
            'force-nouveau-transporteurs.js',
            'nouveau-systeme-transporteurs.js'
        ];
        
        document.querySelectorAll('script').forEach(script => {
            if (script.src) {
                const nomScript = script.src.split('/').pop();
                if (scriptsASupprimer.some(s => nomScript.includes(s))) {
                    script.remove();
                    console.log(`Script supprimé: ${nomScript}`);
                }
            }
        });
        
        console.log("Nettoyage terminé");
    }
    
    // Fonction pour créer le nouveau système de transporteurs
    function creerNouveauSysteme() {
        console.log("Création du nouveau système...");
        
        // 1. Créer le conteneur principal
        const transporteurSection = document.createElement('div');
        transporteurSection.id = 'systeme-transporteurs-propre';
        transporteurSection.className = 'card mb-4';
        transporteurSection.style.zIndex = "1000";
        
        // 2. Définir le contenu HTML
        transporteurSection.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-truck"></i> Sélection des transporteurs</h5>
            </div>
            <div class="card-body">
                <!-- Boutons de vérification des disponibilités -->
                <div class="mb-3">
                    <button type="button" id="verifier-disponibilite-btn" class="btn btn-info">
                        <i class="fas fa-sync-alt"></i> Vérifier les disponibilités
                    </button>
                    <button type="button" id="voir-calendrier-btn" class="btn btn-outline-primary ms-2">
                        <i class="fas fa-calendar-alt"></i> Voir le calendrier
                    </button>
                </div>
                
                <!-- Résultats de vérification des disponibilités -->
                <div id="resultats-disponibilite" class="mb-3">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i> 
                        Remplissez les dates et le type de déménagement, puis cliquez sur "Vérifier les disponibilités" 
                        pour voir les transporteurs disponibles.
                    </div>
                </div>
                
                <!-- Widget principal de sélection des transporteurs -->
                <div id="conteneur-selection-transporteurs">
                    <!-- Barre de recherche -->
                    <div class="input-group mb-3">
                        <input type="text" id="recherche-transporteur" class="form-control" placeholder="Rechercher un transporteur...">
                        <button type="button" id="effacer-recherche" class="btn btn-outline-secondary">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Boutons de filtre -->
                    <div class="btn-group mb-3" role="group">
                        <button type="button" class="btn btn-outline-primary filtre-btn active" data-filter="tous">Tous</button>
                        <button type="button" class="btn btn-outline-success filtre-btn" data-filter="disponibles">Disponibles</button>
                    </div>
                    
                    <!-- Liste des transporteurs -->
                    <select id="liste-transporteurs" name="transporteurs" class="form-select" multiple size="10">
                        <option value="" disabled>Chargement des transporteurs...</option>
                    </select>
                    
                    <!-- Informations et compteur -->
                    <div class="d-flex justify-content-between align-items-center small mt-2">
                        <div>
                            <i class="fas fa-info-circle text-primary"></i>
                            Maintenez la touche Ctrl pour sélectionner plusieurs transporteurs
                        </div>
                        <div id="compteur-transporteurs" class="text-primary fw-bold">0 transporteur(s) sélectionné(s)</div>
                    </div>
                </div>
            </div>
        `;
        
        // 3. Trouver le meilleur endroit pour insérer le widget
        let inserted = false;
        
        // Option 1: Après la section d'observations
        const observationsSection = document.querySelector('#ajouter-observation');
        if (observationsSection) {
            const parent = observationsSection.closest('.card');
            if (parent && parent.parentNode) {
                parent.parentNode.insertBefore(transporteurSection, parent.nextSibling);
                console.log("Système inséré après les observations");
                inserted = true;
            }
        }
        
        // Option 2: Avant les boutons d'action
        if (!inserted) {
            const actionButtons = document.querySelector('.justify-content-md-end, .d-md-flex, .justify-content-end');
            if (actionButtons && actionButtons.parentNode) {
                actionButtons.parentNode.insertBefore(transporteurSection, actionButtons);
                console.log("Système inséré avant les boutons d'action");
                inserted = true;
            }
        }
        
        // Option 3: Dans le formulaire
        if (!inserted) {
            const form = document.querySelector('form');
            if (form) {
                // Chercher l'endroit approprié dans le formulaire
                const formFields = form.querySelectorAll('.card, .mb-3, .mb-4');
                if (formFields.length > 0) {
                    const lastField = formFields[formFields.length - 1];
                    lastField.parentNode.insertBefore(transporteurSection, lastField.nextSibling);
                    console.log("Système inséré après le dernier champ du formulaire");
                } else {
                    // Ajouter simplement à la fin du formulaire
                    form.appendChild(transporteurSection);
                    console.log("Système ajouté à la fin du formulaire");
                }
                inserted = true;
            }
        }
        
        // Option 4: Solution de secours - ajouter au body
        if (!inserted) {
            console.warn("Aucun emplacement idéal trouvé, ajout au body");
            transporteurSection.style.position = "fixed";
            transporteurSection.style.top = "100px";
            transporteurSection.style.left = "50%";
            transporteurSection.style.transform = "translateX(-50%)";
            transporteurSection.style.maxWidth = "800px";
            transporteurSection.style.width = "90%";
            transporteurSection.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.15)";
            
            document.body.appendChild(transporteurSection);
        }
        
        // 4. Ajouter des styles CSS
        const style = document.createElement('style');
        style.textContent = `
            #systeme-transporteurs-propre {
                margin-bottom: 2rem;
            }
            
            #conteneur-selection-transporteurs {
                max-height: 400px;
                overflow-y: auto;
            }
            
            #liste-transporteurs {
                width: 100%;
            }
            
            #liste-transporteurs option {
                padding: 8px;
                border-bottom: 1px solid #e9ecef;
            }
            
            #liste-transporteurs option[data-status="disponible"] {
                background-color: rgba(40, 167, 69, 0.1);
            }
            
            #liste-transporteurs option[data-status="occupe"] {
                background-color: rgba(255, 193, 7, 0.1);
            }
            
            #liste-transporteurs option:checked {
                background-color: #007bff !important;
                color: white !important;
            }
            
            .transporteur-disponible {
                color: #28a745;
            }
            
            .transporteur-occupe {
                color: #ffc107;
            }
        `;
        document.head.appendChild(style);
        
        console.log("Nouveau système créé");
    }
    
    // Fonction pour charger les transporteurs depuis l'API
    async function chargerTransporteurs() {
        console.log("Chargement des transporteurs...");
        
        try {
            const response = await fetch('/api/transporteurs/liste');
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.transporteurs) {
                afficherTransporteurs(data.transporteurs);
            } else {
                console.error("Erreur lors du chargement des transporteurs:", data.message || "Erreur inconnue");
                afficherTransporteursParDefaut();
            }
        } catch (error) {
            console.error("Erreur lors du chargement des transporteurs:", error);
            afficherTransporteursParDefaut();
        }
    }
    
    // Fonction pour afficher les transporteurs dans la liste
    function afficherTransporteurs(transporteurs) {
        const listeTransporteurs = document.getElementById('liste-transporteurs');
        
        if (!listeTransporteurs) {
            console.error("Élément liste-transporteurs non trouvé");
            return;
        }
        
        // Vider la liste
        listeTransporteurs.innerHTML = '';
        
        // Si aucun transporteur, afficher un message
        if (!transporteurs || transporteurs.length === 0) {
            const option = document.createElement('option');
            option.disabled = true;
            option.textContent = 'Aucun transporteur disponible';
            listeTransporteurs.appendChild(option);
            return;
        }
        
        // Ajouter chaque transporteur à la liste
        transporteurs.forEach(transporteur => {
            const option = document.createElement('option');
            option.value = transporteur.id;
            
            // Déterminer le statut et l'icône
            const statut = transporteur.disponible ? 'disponible' : 'occupe';
            const icone = transporteur.disponible ? '🟢' : '🟠';
            
            // Déterminer les informations sur le véhicule
            const infoVehicule = transporteur.vehicule ? 
                `(${transporteur.vehicule})` : 
                transporteur.type_vehicule ? 
                    `(${transporteur.type_vehicule})` : 
                    '';
            
            // Définir le texte de l'option
            option.textContent = `${icone} ${transporteur.nom} ${transporteur.prenom} ${infoVehicule}`;
            
            // Ajouter des attributs data pour le filtrage
            option.dataset.status = statut;
            option.dataset.nom = `${transporteur.nom} ${transporteur.prenom}`.toLowerCase();
            option.dataset.vehicule = (transporteur.vehicule || transporteur.type_vehicule || '').toLowerCase();
            
            listeTransporteurs.appendChild(option);
        });
        
        console.log(`${transporteurs.length} transporteurs affichés`);
    }
    
    // Fonction pour afficher des transporteurs par défaut en cas d'erreur
    function afficherTransporteursParDefaut() {
        const listeTransporteurs = document.getElementById('liste-transporteurs');
        
        if (!listeTransporteurs) {
            console.error("Élément liste-transporteurs non trouvé");
            return;
        }
        
        // Vider la liste
        listeTransporteurs.innerHTML = '';
        
        // Ajouter un message d'erreur
        const messageOption = document.createElement('option');
        messageOption.disabled = true;
        messageOption.textContent = "⚠️ Impossible de charger les transporteurs. Utilisez les transporteurs par défaut ci-dessous.";
        listeTransporteurs.appendChild(messageOption);
        
        // Ajouter quelques transporteurs par défaut
        const transporteursParDefaut = [
            { id: 1, nom: "Transporteur", prenom: "1", vehicule: "Camion 20m³", disponible: true },
            { id: 2, nom: "Transporteur", prenom: "2", vehicule: "Camionnette 12m³", disponible: true },
            { id: 3, nom: "Transporteur", prenom: "3", vehicule: "Camion 30m³", disponible: false }
        ];
        
        transporteursParDefaut.forEach(transporteur => {
            const option = document.createElement('option');
            option.value = transporteur.id;
            
            // Déterminer le statut et l'icône
            const statut = transporteur.disponible ? 'disponible' : 'occupe';
            const icone = transporteur.disponible ? '🟢' : '🟠';
            
            // Définir le texte de l'option
            option.textContent = `${icone} ${transporteur.nom} ${transporteur.prenom} (${transporteur.vehicule})`;
            
            // Ajouter des attributs data pour le filtrage
            option.dataset.status = statut;
            option.dataset.nom = `${transporteur.nom} ${transporteur.prenom}`.toLowerCase();
            option.dataset.vehicule = transporteur.vehicule.toLowerCase();
            
            listeTransporteurs.appendChild(option);
        });
        
        console.log("Transporteurs par défaut affichés");
    }
    
    // Fonction pour initialiser les événements
    function initialiserEvenements() {
        console.log("Initialisation des événements...");
        
        // 1. Événement de recherche
        const champRecherche = document.getElementById('recherche-transporteur');
        if (champRecherche) {
            champRecherche.addEventListener('input', function() {
                filtrerTransporteurs();
            });
        }
        
        // 2. Événement pour effacer la recherche
        const btnEffacerRecherche = document.getElementById('effacer-recherche');
        if (btnEffacerRecherche) {
            btnEffacerRecherche.addEventListener('click', function() {
                const champRecherche = document.getElementById('recherche-transporteur');
                if (champRecherche) {
                    champRecherche.value = '';
                    filtrerTransporteurs();
                }
            });
        }
        
        // 3. Événements pour les boutons de filtre
        const boutonsFiltres = document.querySelectorAll('.filtre-btn');
        boutonsFiltres.forEach(bouton => {
            bouton.addEventListener('click', function() {
                boutonsFiltres.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filtrerTransporteurs();
            });
        });
        
        // 4. Événement pour le compteur de transporteurs sélectionnés
        const listeTransporteurs = document.getElementById('liste-transporteurs');
        if (listeTransporteurs) {
            listeTransporteurs.addEventListener('change', function() {
                mettreAJourCompteur();
            });
        }
        
        // 5. Événement pour la vérification des disponibilités
        const btnVerifierDispo = document.getElementById('verifier-disponibilite-btn');
        if (btnVerifierDispo) {
            btnVerifierDispo.addEventListener('click', function() {
                verifierDisponibilites();
            });
        }
        
        // 6. Événement pour voir le calendrier
        const btnVoirCalendrier = document.getElementById('voir-calendrier-btn');
        if (btnVoirCalendrier) {
            btnVoirCalendrier.addEventListener('click', function() {
                window.location.href = '/calendrier';
            });
        }
        
        console.log("Événements initialisés");
    }
    
    // Fonction pour filtrer les transporteurs
    function filtrerTransporteurs() {
        const listeTransporteurs = document.getElementById('liste-transporteurs');
        const champRecherche = document.getElementById('recherche-transporteur');
        const filtreBoutonActif = document.querySelector('.filtre-btn.active');
        
        if (!listeTransporteurs) return;
        
        const recherche = champRecherche ? champRecherche.value.toLowerCase() : '';
        const filtre = filtreBoutonActif ? filtreBoutonActif.dataset.filter : 'tous';
        
        Array.from(listeTransporteurs.options).forEach(option => {
            if (option.disabled) return; // Ignorer les options désactivées
            
            const nomTransporteur = option.dataset.nom || '';
            const vehicule = option.dataset.vehicule || '';
            const statut = option.dataset.status || '';
            
            // Appliquer le filtre de recherche
            const correspondRecherche = 
                nomTransporteur.includes(recherche) || 
                vehicule.includes(recherche);
            
            // Appliquer le filtre de disponibilité
            const correspondFiltre = 
                filtre === 'tous' || 
                (filtre === 'disponibles' && statut === 'disponible');
            
            // Afficher ou masquer l'option
            option.style.display = correspondRecherche && correspondFiltre ? '' : 'none';
        });
    }
    
    // Fonction pour mettre à jour le compteur de transporteurs sélectionnés
    function mettreAJourCompteur() {
        const listeTransporteurs = document.getElementById('liste-transporteurs');
        const compteur = document.getElementById('compteur-transporteurs');
        
        if (!listeTransporteurs || !compteur) return;
        
        const nombreSelectionnes = Array.from(listeTransporteurs.selectedOptions).length;
        compteur.textContent = `${nombreSelectionnes} transporteur(s) sélectionné(s)`;
    }
    
    // Fonction pour vérifier les disponibilités des transporteurs
    async function verifierDisponibilites() {
        console.log("Vérification des disponibilités...");
        
        const resultatDiv = document.getElementById('resultats-disponibilite');
        
        if (!resultatDiv) {
            console.error("Élément resultats-disponibilite non trouvé");
            return;
        }
        
        // Afficher un message de chargement
        resultatDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-spinner fa-spin me-2"></i> 
                Vérification des disponibilités en cours...
            </div>
        `;
        
        try {
            // Récupérer les dates et le type de déménagement
            const dateDebut = document.querySelector('input[name="date_debut"]')?.value;
            const dateFin = document.querySelector('input[name="date_fin"]')?.value;
            const typeDemenagementId = document.querySelector('select[name="type_demenagement_id"]')?.value;
            const prestationId = document.querySelector('input[name="id"]')?.value;
            
            // Vérifier que les dates sont remplies
            if (!dateDebut || !dateFin) {
                resultatDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i> 
                        Veuillez remplir les dates de début et de fin pour vérifier les disponibilités.
                    </div>
                `;
                return;
            }
            
            // Préparer les données pour l'API
            const donnees = {
                date_debut: dateDebut,
                date_fin: dateFin,
                type_demenagement_id: typeDemenagementId || '',
                prestation_id: prestationId || ''
            };
            
            // Appeler l'API
            const response = await fetch('/api/transporteurs/check-disponibilite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(donnees)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Afficher les résultats
                const transporteursDisponibles = data.transporteurs_disponibles || [];
                const transporteursOccupes = data.transporteurs_occupes || [];
                
                const nombreDisponibles = transporteursDisponibles.length;
                const nombreOccupes = transporteursOccupes.length;
                const total = nombreDisponibles + nombreOccupes;
                
                const pourcentageDisponibles = total > 0 ? (nombreDisponibles / total * 100) : 0;
                const pourcentageOccupes = total > 0 ? (nombreOccupes / total * 100) : 0;
                
                resultatDiv.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i> 
                        Vérification terminée. Sélectionnez les transporteurs dans la liste ci-dessous.
                    </div>
                    <div class="mt-3 mb-3">
                        <div class="d-flex justify-content-between">
                            <span><strong>Transporteurs disponibles:</strong> ${nombreDisponibles}</span>
                            <span><strong>Transporteurs occupés:</strong> ${nombreOccupes}</span>
                        </div>
                        <div class="progress mt-2" style="height: 20px;">
                            <div class="progress-bar bg-success" role="progressbar" 
                                 style="width: ${pourcentageDisponibles}%" 
                                 aria-valuenow="${nombreDisponibles}" aria-valuemin="0" 
                                 aria-valuemax="${total}">
                                Disponibles
                            </div>
                            <div class="progress-bar bg-warning" role="progressbar" 
                                 style="width: ${pourcentageOccupes}%" 
                                 aria-valuenow="${nombreOccupes}" aria-valuemin="0" 
                                 aria-valuemax="${total}">
                                Occupés
                            </div>
                        </div>
                    </div>
                `;
                
                // Mettre à jour les transporteurs avec leur disponibilité
                const listeTransporteurs = document.getElementById('liste-transporteurs');
                
                if (listeTransporteurs) {
                    Array.from(listeTransporteurs.options).forEach(option => {
                        if (option.disabled) return;
                        
                        const transporteurId = parseInt(option.value);
                        
                        // Vérifier si le transporteur est disponible ou occupé
                        const estDisponible = transporteursDisponibles.some(t => t.id === transporteurId);
                        const estOccupe = transporteursOccupes.some(t => t.id === transporteurId);
                        
                        // Mettre à jour l'option
                        if (estDisponible || estOccupe) {
                            const statut = estDisponible ? 'disponible' : 'occupe';
                            const icone = estDisponible ? '🟢' : '🟠';
                            
                            // Mettre à jour le texte et les attributs
                            option.dataset.status = statut;
                            
                            // Mettre à jour le texte en conservant le nom et le véhicule
                            const texteActuel = option.textContent;
                            const match = texteActuel.match(/^[🟢🟠] (.+)/);
                            
                            if (match) {
                                option.textContent = `${icone} ${match[1]}`;
                            }
                        }
                    });
                    
                    // Appliquer les filtres
                    filtrerTransporteurs();
                }
            } else {
                throw new Error(data.message || "Erreur lors de la vérification des disponibilités");
            }
        } catch (error) {
            console.error("Erreur lors de la vérification des disponibilités:", error);
            
            resultatDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle me-2"></i> 
                    Erreur lors de la vérification des disponibilités: ${error.message || "Erreur inconnue"}
                </div>
            `;
        }
    }
    
    // Fonction principale pour initialiser le système
    function initialiserSystemeTransporteurs() {
        console.log("Initialisation du système de transporteurs...");
        
        // 1. Nettoyer l'ancien système
        nettoyerAncienSysteme();
        
        // 2. Créer le nouveau système
        creerNouveauSysteme();
        
        // 3. Initialiser les événements
        initialiserEvenements();
        
        // 4. Charger les transporteurs
        chargerTransporteurs();
        
        console.log("Système de transporteurs initialisé");
    }
    
    // Exécuter dès que le DOM est chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiserSystemeTransporteurs);
    } else {
        initialiserSystemeTransporteurs();
    }
    
    // Au cas où la page est lente à charger, essayer toutes les 100ms
    let attempts = 0;
    const maxAttempts = 50; // 5 secondes max
    const checkIntervalId = setInterval(function() {
        attempts++;
        if (attempts >= maxAttempts) {
            clearInterval(checkIntervalId);
            console.error("Abandon après 5 secondes d'essais");
            return;
        }
        
        if (!document.getElementById('systeme-transporteurs-propre')) {
            initialiserSystemeTransporteurs();
            console.log(`Tentative ${attempts} d'initialisation du système`);
        } else {
            clearInterval(checkIntervalId);
            console.log("Système de transporteurs déjà présent");
        }
    }, 100);
})();
