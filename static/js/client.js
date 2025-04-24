/**
 * Client management specific JavaScript for Cavalier Déménagement
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the client page
    if (!document.querySelector('.client-page')) return;

    // Handle document uploads
    const documentInput = document.getElementById('documents');
    const fileListContainer = document.querySelector('.file-list');
    
    if (documentInput && fileListContainer) {
        documentInput.addEventListener('change', function() {
            // Clear previous file list
            fileListContainer.innerHTML = '';
            
            if (this.files.length > 0) {
                const fileCount = document.createElement('p');
                fileCount.className = 'mb-2';
                fileCount.textContent = `${this.files.length} fichier(s) sélectionné(s)`;
                fileListContainer.appendChild(fileCount);
                
                // Create list of selected files
                const fileList = document.createElement('ul');
                fileList.className = 'list-group';
                
                for (let i = 0; i < this.files.length; i++) {
                    const file = this.files[i];
                    const fileItem = document.createElement('li');
                    fileItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                    
                    // Create file info element
                    const fileInfo = document.createElement('div');
                    fileInfo.innerHTML = `<i class="fa fa-file-pdf text-danger me-2"></i> ${file.name}`;
                    
                    // Create file size element
                    const fileSize = document.createElement('span');
                    fileSize.className = 'badge bg-secondary';
                    fileSize.textContent = formatFileSize(file.size);
                    
                    fileItem.appendChild(fileInfo);
                    fileItem.appendChild(fileSize);
                    fileList.appendChild(fileItem);
                }
                
                fileListContainer.appendChild(fileList);
            }
        });
    }
    
    // Handle client search
    const searchInput = document.getElementById('client-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            // If using client-side filtering
            const clientRows = document.querySelectorAll('tbody tr');
            let found = false;
            
            clientRows.forEach(row => {
                const clientData = row.textContent.toLowerCase();
                if (searchTerm === '' || clientData.includes(searchTerm)) {
                    row.style.display = '';
                    found = true;
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Show no results message if needed
            const noResultsMessage = document.getElementById('no-results-message');
            if (noResultsMessage) {
                noResultsMessage.style.display = found ? 'none' : 'block';
            }
        }, 300));
    }
    
    // Handle tag display in client list
    const tagContainers = document.querySelectorAll('.client-tags');
    tagContainers.forEach(container => {
        const tagsText = container.dataset.tags;
        if (tagsText) {
            createTagElements(tagsText, container);
        }
    });
    
    // Handle client delete confirmation
    const deleteForms = document.querySelectorAll('.delete-client-form');
    deleteForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const clientName = this.dataset.clientName;
            
            confirmAction(
                `Êtes-vous sûr de vouloir supprimer le client "${clientName}" ? Cette action est irréversible.`, 
                () => {
                    this.submit();
                }
            );
        });
    });
});

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @return {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function to limit how often a function can be called
 * @param {function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @return {function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
