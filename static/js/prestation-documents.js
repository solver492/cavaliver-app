/**
 * prestation-documents.js
 * Gestion des documents et observations supplémentaires pour les prestations
 */

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialiser l'éditeur de texte enrichi pour les observations supplémentaires
        if (document.getElementById('observations_supplementaires')) {
            initRichTextEditor();
        }

        // Gestionnaire pour l'ajout de documents
        initDocumentUpload();

        // Gestionnaire pour la suppression de documents
        initDocumentDeletion();
        
        // Initialiser le glisser-déposer pour les fichiers
        initDragAndDrop();
        
        // Écouter les événements de réessai
        document.addEventListener('document-action-retry', function() {
            reloadDocumentsList();
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des fonctionnalités de documents:', error);
    }
});

/**
 * Initialise l'éditeur de texte enrichi pour les observations supplémentaires
 */
function initRichTextEditor() {
    try {
        $('#observations_supplementaires').summernote({
            placeholder: 'Ajoutez des observations supplémentaires ici...',
            height: 150,
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'clear']],
                ['font', ['strikethrough']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['link']]
            ],
            callbacks: {
                onImageUpload: function(files) {
                    // Désactiver l'upload d'images directement dans l'éditeur
                    alert('Veuillez utiliser la section "Ajouter un document" pour les images.');
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'éditeur de texte enrichi:', error);
    }
}

/**
 * Initialise le gestionnaire d'upload de documents
 */
function initDocumentUpload() {
    try {
        const btnAjouterDocument = document.getElementById('btn-ajouter-document');
        if (!btnAjouterDocument) {
            console.log('Bouton d\'ajout de document non trouvé dans le DOM');
            return;
        }

        btnAjouterDocument.addEventListener('click', function() {
            try {
                // Récupération des éléments du formulaire avec vérification
                const nomInput = document.querySelector('input[name="document_nom"]');
                const typeSelect = document.querySelector('select[name="document_type"]');
                const fichierInput = document.getElementById('document_fichier');
                
                if (!nomInput || !typeSelect || !fichierInput) {
                    console.error('Éléments du formulaire manquants:', {
                        nomInput: !!nomInput,
                        typeSelect: !!typeSelect,
                        fichierInput: !!fichierInput
                    });
                    showAlert('Erreur: Certains éléments du formulaire sont manquants', 'danger');
                    return;
                }
                
                const nomDocument = nomInput.value;
                const typeDocument = typeSelect.value;
                const fichier = fichierInput.files[0];
                
                // Validation basique
                if (!nomDocument) {
                    showAlert('Veuillez saisir un nom pour le document', 'danger');
                    return;
                }
                
                if (!typeDocument) {
                    showAlert('Veuillez sélectionner un type de document', 'danger');
                    return;
                }
                
                if (!fichier) {
                    showAlert('Veuillez sélectionner un fichier à télécharger', 'danger');
                    return;
                }
                
                // Vérification de la taille du fichier (max 10MB)
                if (fichier.size > 10 * 1024 * 1024) {
                    showAlert('Le fichier est trop volumineux. Taille maximale: 10MB', 'danger');
                    return;
                }
                
                // Récupération de l'ID de prestation avec vérification
                const prestationId = getPrestationId();
                if (!prestationId) {
                    showAlert('Erreur: Impossible de déterminer l\'ID de la prestation', 'danger');
                    console.error('ID de prestation non trouvé');
                    return;
                }
                
                // Création d'un FormData pour l'envoi du fichier
                const formData = new FormData();
                formData.append('nom', nomDocument);
                formData.append('type', typeDocument);
                formData.append('fichier', fichier);
                formData.append('prestation_id', prestationId);
                
                // Afficher un indicateur de chargement
                showLoading();
                
                // Envoi de la requête AJAX
                fetch('/documents/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(response => {
                    hideLoading();
                    if (!response.ok) {
                        console.error('Erreur de réponse du serveur:', response.status, response.statusText);
                        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
                    }
                    return response.json().catch(err => {
                        console.error('Erreur de parsing JSON:', err);
                        throw new Error('Réponse du serveur invalide');
                    });
                })
                .then(data => {
                    if (data.success) {
                        showAlert('Document ajouté avec succès', 'success');
                        // Réinitialiser le formulaire
                        nomInput.value = '';
                        typeSelect.value = '';
                        fichierInput.value = '';
                        
                        // Recharger la liste des documents
                        reloadDocumentsList();
                    } else {
                        console.error('Erreur retournée par le serveur:', data);
                        showAlert(data.message || 'Erreur lors de l\'ajout du document', 'danger');
                    }
                })
                .catch(error => {
                    hideLoading();
                    console.error('Erreur lors de l\'upload du document:', error);
                    showAlert('Erreur lors de l\'ajout du document: ' + error.message, 'danger');
                });
            } catch (error) {
                console.error('Erreur non capturée dans le gestionnaire de clic:', error);
                showAlert('Une erreur inattendue s\'est produite', 'danger');
                hideLoading();
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du gestionnaire d\'upload:', error);
    }
}

/**
 * Initialise les gestionnaires d'événements pour la suppression de documents
 */
function initDocumentDeletion() {
    // Utiliser la délégation d'événements pour gérer les boutons de suppression
    document.addEventListener('click', function(event) {
        if (event.target.closest('.delete-document')) {
            const button = event.target.closest('.delete-document');
            const documentId = button.getAttribute('data-document-id');
            
            if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                deleteDocument(documentId);
            }
        }
    });
}

/**
 * Supprime un document via une requête AJAX
 * @param {string} documentId - ID du document à supprimer
 */
function deleteDocument(documentId) {
    try {
        if (!documentId) {
            console.error('ID de document manquant pour la suppression');
            showAlert('Erreur: ID de document manquant', 'danger');
            return;
        }
        
        // Vérifier que le token CSRF est disponible
        const csrfToken = getCSRFToken();
        if (!csrfToken) {
            console.error('Token CSRF manquant');
            showAlert('Erreur de sécurité: Token CSRF manquant', 'danger');
            return;
        }
        
        showLoading();
        
        fetch(`/documents/delete/${documentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'same-origin'
        })
        .then(response => {
            try {
                hideLoading();
                if (!response.ok) {
                    console.error('Erreur de réponse du serveur lors de la suppression:', response.status, response.statusText);
                    throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
                }
                return response.json().catch(err => {
                    console.error('Erreur de parsing JSON lors de la suppression:', err);
                    throw new Error('Réponse du serveur invalide');
                });
            } catch (error) {
                console.error('Erreur non capturée lors du traitement de la réponse:', error);
                throw error; // Propager l'erreur pour qu'elle soit capturée par le bloc catch suivant
            }
        })
        .then(data => {
            if (data.success) {
                showAlert('Document supprimé avec succès', 'success');
                // Recharger la liste des documents
                reloadDocumentsList();
            } else {
                console.error('Erreur retournée par le serveur lors de la suppression:', data);
                showAlert(data.message || 'Erreur lors de la suppression du document', 'danger');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Erreur lors de la suppression du document:', error);
            showAlert('Erreur lors de la suppression du document: ' + error.message, 'danger');
        });
    } catch (error) {
        hideLoading();
        console.error('Erreur non capturée lors de la suppression du document:', error);
        showAlert('Une erreur inattendue s\'est produite lors de la suppression', 'danger');
    }
}

/**
 * Recharge la liste des documents
 */
function reloadDocumentsList() {
    try {
        const prestationId = getPrestationId();
        if (!prestationId) {
            console.error('ID de prestation manquant pour le rechargement de la liste');
            return;
        }
        
        // Essayer plusieurs sélecteurs pour trouver le tableau des documents
        let documentsTable = document.querySelector('.table-hover tbody');
        
        // Si le sélecteur principal ne fonctionne pas, essayer un sélecteur alternatif
        if (!documentsTable) {
            documentsTable = document.querySelector('.card-body .table tbody');
        }
        
        // Afficher un indicateur de chargement si le tableau est trouvé
        if (documentsTable) {
            documentsTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div></td></tr>';
        } else {
            console.warn('Tableau des documents non trouvé pour afficher le chargement');
        }
        
        // Effectuer une requête AJAX pour récupérer la liste des documents
        fetch(`/documents/list/${prestationId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                console.error('Erreur de réponse du serveur lors du rechargement:', response.status, response.statusText);
                throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.documents) {
                // Mettre à jour le tableau des documents
                updateDocumentsTable(data.documents);
            } else {
                console.error('Erreur lors du chargement des documents:', data.message || 'Erreur inconnue');
                showAlert('Erreur lors du chargement des documents.', 'danger');
                
                if (documentsTable) {
                    documentsTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erreur lors du chargement des documents.</td></tr>';
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors du rechargement de la liste des documents:', error);
            showAlert('Erreur lors du chargement des documents.', 'danger');
            
            try {
                if (documentsTable) {
                    documentsTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erreur lors du chargement des documents. Veuillez rafraîchir la page.</td></tr>';
                }
            } catch (domError) {
                console.error('Erreur lors de la mise à jour du DOM après erreur de chargement:', domError);
            }
        });
    } catch (error) {
        console.error('Erreur non capturée lors du rechargement de la liste:', error);
    }
}

/**
 * Met à jour le tableau des documents avec les données fournies
 * @param {Array} documents - Liste des documents à afficher
 */
function updateDocumentsTable(documents) {
    // Essayer plusieurs sélecteurs pour trouver le tableau des documents
    let documentsTable = document.querySelector('.table-hover tbody');
    
    // Si le sélecteur principal ne fonctionne pas, essayer un sélecteur alternatif
    if (!documentsTable) {
        documentsTable = document.querySelector('.card-body .table tbody');
    }
    
    // Si aucun sélecteur ne fonctionne, afficher une erreur et sortir
    if (!documentsTable) {
        console.error('Tableau des documents non trouvé dans le DOM');
        return;
    }
    
    if (documents.length === 0) {
        // Aucun document à afficher
        documentsTable.innerHTML = '<tr><td colspan="5" class="text-center">Aucun document associé à cette prestation.</td></tr>';
        return;
    }
    
    // Générer le HTML pour chaque document
    let html = '';
    documents.forEach(doc => {
        const date = new Date(doc.date_upload);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        html += `
        <tr>
            <td>${doc.nom}</td>
            <td><span class="badge bg-secondary">${doc.type}</span></td>
            <td>${(doc.taille / 1024).toFixed(1)} KB</td>
            <td>${formattedDate}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <a href="/documents/download/${doc.id}" class="btn btn-outline-primary" title="Télécharger">
                        <i class="fas fa-download"></i>
                    </a>
                    <a href="/documents/edit/${doc.id}" class="btn btn-outline-secondary" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </a>
                    <button type="button" class="btn btn-outline-danger delete-document" data-document-id="${doc.id}" title="Supprimer">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    });
    
    // Mettre à jour le tableau
    documentsTable.innerHTML = html;
    
    // Réattacher les événements aux boutons de suppression
    initDocumentDeletion();
}

/**
 * Récupère l'ID de la prestation depuis l'URL
 * @returns {string|null} - ID de la prestation ou null si non trouvé
 */
function getPrestationId() {
    try {
        const url = window.location.pathname;
        const matches = url.match(/\/prestations\/edit\/(\d+)/);
        const prestationId = matches ? matches[1] : null;
        
        if (!prestationId) {
            console.warn('Impossible de trouver l\'ID de prestation dans l\'URL:', url);
        }
        
        return prestationId;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ID de prestation:', error);
        return null;
    }
}

/**
 * Récupère le token CSRF depuis les méta-tags
 * @returns {string} - Token CSRF ou chaîne vide si non trouvé
 */
function getCSRFToken() {
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (!csrfToken) {
            console.warn('Meta tag CSRF non trouvé dans le document');
            return '';
        }
        
        const token = csrfToken.getAttribute('content');
        if (!token) {
            console.warn('Attribut content manquant dans le meta tag CSRF');
        }
        
        return token || '';
    } catch (error) {
        console.error('Erreur lors de la récupération du token CSRF:', error);
        return '';
    }
}

/**
 * Affiche une alerte temporaire
 * @param {string} message - Message à afficher
 * @param {string} type - Type d'alerte (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
    try {
        // S'assurer que le message est une chaîne de caractères
        const safeMessage = message ? String(message) : 'Une action a été effectuée';
        
        // Créer l'élément d'alerte
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${safeMessage}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Ajouter l'alerte au conteneur approprié
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(alertDiv, form.firstChild);
        } else {
            // Fallback si le formulaire n'est pas trouvé
            const container = document.querySelector('.container') || document.querySelector('.card-body') || document.body;
            if (container) {
                if (container.firstChild) {
                    container.insertBefore(alertDiv, container.firstChild);
                } else {
                    container.appendChild(alertDiv);
                }
            } else {
                console.warn('Aucun conteneur trouvé pour afficher l\'alerte');
                return; // Sortir pour éviter de programmer la suppression d'un élément non ajouté
            }
        }
        
        // Supprimer l'alerte après 5 secondes
        setTimeout(() => {
            try {
                if (alertDiv && alertDiv.parentNode) {
                    alertDiv.remove();
                }
            } catch (removeError) {
                console.warn('Erreur lors de la suppression de l\'alerte:', removeError);
            }
        }, 5000);
    } catch (error) {
        console.error('Erreur lors de l\'affichage de l\'alerte:', error);
        // Utiliser une méthode alternative pour afficher le message
        try {
            console.log('Message d\'alerte non affiché:', message, '(Type:', type, ')');
        } catch (consoleError) {
            // Dernier recours, ne rien faire
        }
    }
}

/**
 * Affiche un indicateur de chargement
 */
function showLoading() {
    try {
        // Créer l'élément de chargement s'il n'existe pas déjà
        if (!document.getElementById('loading-indicator')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-indicator';
            loadingDiv.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50';
            loadingDiv.style.zIndex = '9999';
            loadingDiv.innerHTML = `
                <div class="spinner-border text-light" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
            `;
            document.body.appendChild(loadingDiv);
        } else {
            const indicator = document.getElementById('loading-indicator');
            if (indicator) {
                indicator.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'affichage de l\'indicateur de chargement:', error);
        // Ne pas propager l'erreur pour éviter de bloquer le flux d'exécution
    }
}

/**
 * Cache l'indicateur de chargement
 */
function hideLoading() {
    try {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'indicateur de chargement:', error);
        // Ne pas propager l'erreur pour éviter de bloquer le flux d'exécution
    }
}

/**
 * Initialise la fonctionnalité de glisser-déposer pour les fichiers
 */
function initDragAndDrop() {
    try {
        const dropZone = document.querySelector('.document-drop-zone');
        if (!dropZone) {
            console.log('Zone de glisser-déposer non trouvée dans le DOM');
            return;
        }
        
        // Initialiser le gestionnaire de fichiers
        const fileManagerList = document.querySelector('.file-manager-list');
        const batchActions = document.getElementById('batch-actions');
        const uploadProgress = document.getElementById('upload-progress');
        const uploadError = document.getElementById('upload-error');
        const uploadSuccess = document.getElementById('upload-success');
        const progressBar = uploadProgress ? uploadProgress.querySelector('.progress-bar') : null;
        
        // Tableau pour stocker les fichiers en attente d'upload
        let pendingFiles = [];
        
        // Empêcher le comportement par défaut pour permettre le drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Mettre en surbrillance la zone de dépôt
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropZone.classList.add('bg-light', 'border-primary');
        }
        
        function unhighlight() {
            dropZone.classList.remove('bg-light', 'border-primary');
        }
        
        // Gérer le dépôt de fichiers
        dropZone.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                handleFiles(files);
            }
        });
        
        // Gérer le clic pour sélectionner des fichiers
        dropZone.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    handleFiles(this.files);
                }
                document.body.removeChild(fileInput);
            });
            
            fileInput.click();
        });
        
        // Gérer les fichiers sélectionnés ou déposés
        function handleFiles(files) {
            Array.from(files).forEach(file => {
                // Vérifier la taille du fichier (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    showAlert(`Le fichier ${file.name} est trop volumineux. Taille maximale: 10MB`, 'danger');
                    return;
                }
                
                // Ajouter le fichier à la liste des fichiers en attente
                pendingFiles.push(file);
                
                // Créer un élément pour afficher le fichier dans le gestionnaire
                const fileItem = document.createElement('div');
                fileItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                fileItem.dataset.fileName = file.name;
                
                // Générer un ID unique pour ce fichier
                const fileId = 'file-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                fileItem.id = fileId;
                
                // Déterminer l'icône en fonction du type de fichier
                let fileIcon = 'fas fa-file';
                const fileExt = file.name.split('.').pop().toLowerCase();
                
                if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
                    fileIcon = 'fas fa-file-image';
                } else if (['pdf'].includes(fileExt)) {
                    fileIcon = 'fas fa-file-pdf';
                } else if (['doc', 'docx'].includes(fileExt)) {
                    fileIcon = 'fas fa-file-word';
                } else if (['xls', 'xlsx'].includes(fileExt)) {
                    fileIcon = 'fas fa-file-excel';
                } else if (['txt'].includes(fileExt)) {
                    fileIcon = 'fas fa-file-alt';
                }
                
                // Formater la taille du fichier
                const fileSize = formatFileSize(file.size);
                
                fileItem.innerHTML = `
                    <div>
                        <i class="${fileIcon} me-2"></i>
                        <span class="file-name">${file.name}</span>
                        <small class="text-muted ms-2">${fileSize}</small>
                    </div>
                    <div>
                        <button type="button" class="btn btn-sm btn-outline-primary edit-file-btn" data-file-id="${fileId}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger remove-file-btn" data-file-id="${fileId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
                // Ajouter l'élément à la liste
                if (fileManagerList) {
                    fileManagerList.appendChild(fileItem);
                }
                
                // Afficher les actions par lot si nécessaire
                if (batchActions && pendingFiles.length > 0) {
                    batchActions.classList.remove('d-none');
                }
            });
            
            // Afficher une notification
            if (files.length > 0) {
                showAlert(`${files.length} fichier(s) ajouté(s) à la file d'attente. Cliquez sur "Tout uploader" pour finaliser.`, 'info');
            }
        }
        
        // Formater la taille du fichier en KB, MB, etc.
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // Gérer les actions sur les fichiers
        if (fileManagerList) {
            fileManagerList.addEventListener('click', function(e) {
                // Gérer le bouton de suppression
                if (e.target.closest('.remove-file-btn')) {
                    const btn = e.target.closest('.remove-file-btn');
                    const fileId = btn.dataset.fileId;
                    const fileItem = document.getElementById(fileId);
                    
                    if (fileItem) {
                        const fileName = fileItem.dataset.fileName;
                        
                        // Supprimer le fichier de la liste des fichiers en attente
                        pendingFiles = pendingFiles.filter(file => file.name !== fileName);
                        
                        // Supprimer l'élément de la liste
                        fileItem.remove();
                        
                        // Masquer les actions par lot si nécessaire
                        if (pendingFiles.length === 0 && batchActions) {
                            batchActions.classList.add('d-none');
                        }
                        
                        showAlert(`Fichier ${fileName} supprimé de la file d'attente.`, 'warning');
                    }
                }
                
                // Gérer le bouton d'édition
                if (e.target.closest('.edit-file-btn')) {
                    const btn = e.target.closest('.edit-file-btn');
                    const fileId = btn.dataset.fileId;
                    const fileItem = document.getElementById(fileId);
                    
                    if (fileItem) {
                        const fileName = fileItem.dataset.fileName;
                        const file = pendingFiles.find(f => f.name === fileName);
                        
                        if (file) {
                            // Ouvrir une modal pour éditer les propriétés du fichier
                            // Pour l'instant, juste un exemple simple avec prompt
                            const newName = prompt('Entrez un nouveau nom pour ce fichier:', fileName.split('.')[0]);
                            
                            if (newName && newName.trim() !== '') {
                                // Mettre à jour l'affichage du nom dans l'UI
                                const fileNameElement = fileItem.querySelector('.file-name');
                                if (fileNameElement) {
                                    const ext = fileName.split('.').pop();
                                    fileNameElement.textContent = `${newName}.${ext}`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Gérer le bouton "Tout uploader"
        const uploadAllBtn = document.getElementById('upload-all-files');
        if (uploadAllBtn) {
            uploadAllBtn.addEventListener('click', function() {
                if (pendingFiles.length === 0) {
                    showAlert('Aucun fichier à uploader.', 'warning');
                    return;
                }
                
                uploadFiles(pendingFiles);
            });
        }
        
        // Gérer le bouton "Tout effacer"
        const clearAllBtn = document.getElementById('clear-all-files');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', function() {
                if (pendingFiles.length === 0) {
                    return;
                }
                
                if (confirm(`Êtes-vous sûr de vouloir supprimer tous les fichiers de la file d'attente (${pendingFiles.length} fichier(s)) ?`)) {
                    // Vider la liste des fichiers en attente
                    pendingFiles = [];
                    
                    // Vider la liste dans l'UI
                    if (fileManagerList) {
                        fileManagerList.innerHTML = '';
                    }
                    
                    // Masquer les actions par lot
                    if (batchActions) {
                        batchActions.classList.add('d-none');
                    }
                    
                    showAlert('Tous les fichiers ont été supprimés de la file d\'attente.', 'warning');
                }
            });
        }
        
        // Fonction pour uploader les fichiers
        function uploadFiles(files) {
            if (files.length === 0) return;
            
            // Afficher la barre de progression
            if (uploadProgress) {
                uploadProgress.classList.remove('d-none');
            }
            
            // Masquer les messages d'erreur/succès précédents
            if (uploadError) uploadError.classList.add('d-none');
            if (uploadSuccess) uploadSuccess.classList.add('d-none');
            
            // Récupérer l'ID de prestation
            const prestationId = getPrestationId();
            if (!prestationId) {
                showAlert('Erreur: Impossible de déterminer l\'ID de la prestation', 'danger');
                return;
            }
            
            // Compteur pour suivre les uploads réussis
            let successCount = 0;
            let errorCount = 0;
            let totalCount = files.length;
            
            // Uploader chaque fichier
            files.forEach((file, index) => {
                const formData = new FormData();
                formData.append('fichier', file);
                formData.append('prestation_id', prestationId);
                
                // Utiliser le nom du fichier sans extension comme nom par défaut
                const fileName = file.name.split('.');
                fileName.pop(); // Enlever l'extension
                formData.append('nom', fileName.join('.'));
                
                // Type par défaut
                formData.append('type', 'autre');
                
                // Mettre à jour la barre de progression
                if (progressBar) {
                    const progress = Math.round((index / totalCount) * 100);
                    progressBar.style.width = `${progress}%`;
                    progressBar.setAttribute('aria-valuenow', progress);
                }
                
                // Envoi de la requête AJAX
                fetch('/documents/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erreur serveur: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        successCount++;
                        
                        // Supprimer le fichier de la liste des fichiers en attente
                        const fileItem = Array.from(fileManagerList.children).find(item => item.dataset.fileName === file.name);
                        if (fileItem) fileItem.remove();
                        
                        // Mettre à jour la barre de progression
                        updateUploadProgress(index + 1, totalCount);
                        
                        // Vérifier si tous les fichiers ont été traités
                        checkUploadCompletion(successCount, errorCount, totalCount);
                    } else {
                        errorCount++;
                        console.error('Erreur lors de l\'upload:', data.message);
                        
                        // Mettre à jour la barre de progression
                        updateUploadProgress(index + 1, totalCount);
                        
                        // Vérifier si tous les fichiers ont été traités
                        checkUploadCompletion(successCount, errorCount, totalCount);
                    }
                })
                .catch(error => {
                    errorCount++;
                    console.error('Erreur lors de l\'upload:', error);
                    
                    // Mettre à jour la barre de progression
                    updateUploadProgress(index + 1, totalCount);
                    
                    // Vérifier si tous les fichiers ont été traités
                    checkUploadCompletion(successCount, errorCount, totalCount);
                });
            });
        }
        
        // Mettre à jour la barre de progression
        function updateUploadProgress(current, total) {
            if (progressBar) {
                const progress = Math.round((current / total) * 100);
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress);
            }
        }
        
        // Vérifier si tous les fichiers ont été traités
        function checkUploadCompletion(success, error, total) {
            if (success + error === total) {
                // Tous les fichiers ont été traités
                setTimeout(() => {
                    // Masquer la barre de progression
                    if (uploadProgress) {
                        uploadProgress.classList.add('d-none');
                    }
                    
                    // Afficher le message de succès/erreur
                    if (error === 0) {
                        if (uploadSuccess) {
                            uploadSuccess.textContent = `${success} fichier(s) uploadé(s) avec succès.`;
                            uploadSuccess.classList.remove('d-none');
                        }
                        showAlert(`${success} fichier(s) uploadé(s) avec succès.`, 'success');
                        
                        // Vider la liste des fichiers en attente
                        pendingFiles = [];
                        
                        // Masquer les actions par lot
                        if (batchActions) {
                            batchActions.classList.add('d-none');
                        }
                        
                        // Recharger la liste des documents après un court délai
                        setTimeout(() => {
                            reloadDocumentsList();
                        }, 1500);
                    } else {
                        if (uploadError) {
                            uploadError.textContent = `Erreur lors de l'upload: ${success} réussi(s), ${error} échoué(s).`;
                            uploadError.classList.remove('d-none');
                        }
                        showAlert(`Erreur lors de l'upload: ${success} réussi(s), ${error} échoué(s).`, 'danger');
                    }
                }, 500);
            }
        }
        
        console.log('Fonctionnalité de glisser-déposer initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du glisser-déposer:', error);
    }
}

// Initialiser le glisser-déposer
document.addEventListener('DOMContentLoaded', initDragAndDrop);
