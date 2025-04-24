/**
 * Main JavaScript file for Cavalier Déménagement application
 */

// Initialize tooltips and popovers
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Auto-dismiss alerts
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert:not(.alert-persistent)');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
    
    // Calculate TTC from HT in invoice forms
    const montantHtInput = document.getElementById('montant_ht');
    const tauxTvaInput = document.getElementById('taux_tva');
    const montantTtcInput = document.getElementById('montant_ttc');
    
    if (montantHtInput && tauxTvaInput && montantTtcInput) {
        const calculateTTC = function() {
            const ht = parseFloat(montantHtInput.value) || 0;
            const tva = parseFloat(tauxTvaInput.value) || 0;
            const ttc = ht * (1 + tva / 100);
            montantTtcInput.value = ttc.toFixed(2);
        };
        
        montantHtInput.addEventListener('input', calculateTTC);
        tauxTvaInput.addEventListener('input', calculateTTC);
    }
    
    // AJAX prestation fetch for invoices
    const clientSelect = document.getElementById('client_id');
    const prestationSelect = document.getElementById('prestation_id');
    
    if (clientSelect && prestationSelect) {
        clientSelect.addEventListener('change', function() {
            const clientId = this.value;
            if (clientId) {
                fetch(`/factures/get_prestations/${clientId}`)
                    .then(response => response.json())
                    .then(data => {
                        // Clear current options
                        prestationSelect.innerHTML = '';
                        
                        // Add new options
                        data.forEach(prestation => {
                            const option = document.createElement('option');
                            option.value = prestation.id;
                            option.text = prestation.text;
                            prestationSelect.appendChild(option);
                        });
                    })
                    .catch(error => console.error('Error fetching prestations:', error));
            }
        });
    }
    
    // Handle form submissions with confirmation
    const confirmForms = document.querySelectorAll('form[data-confirm]');
    confirmForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = this.getAttribute('data-confirm');
            if (confirm(message)) {
                this.submit();
            }
        });
    });
    
    // Toggle for showing archived items
    const archiveToggle = document.getElementById('archive-toggle');
    if (archiveToggle) {
        archiveToggle.addEventListener('change', function() {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('archives', this.checked ? 'true' : 'false');
            window.location.href = currentUrl.toString();
        });
    }
    
    // Toggle for filter options
    const filterToggle = document.querySelector('.filter-toggle');
    const filterOptions = document.querySelector('.filter-options');
    
    if (filterToggle && filterOptions) {
        filterToggle.addEventListener('click', function() {
            filterOptions.classList.toggle('d-none');
            
            // Update icon
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-chevron-down')) {
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        });
    }
    
    // Document preview handling
    const documentInputs = document.querySelectorAll('input[type="file"][accept=".pdf"]');
    documentInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const fileCount = this.files.length;
            const fileList = this.parentElement.querySelector('.file-list');
            
            if (fileList) {
                fileList.innerHTML = '';
                
                if (fileCount > 0) {
                    const fileCountText = document.createElement('div');
                    fileCountText.className = 'selected-files-count';
                    fileCountText.textContent = `${fileCount} fichier(s) sélectionné(s)`;
                    fileList.appendChild(fileCountText);
                    
                    for (let i = 0; i < fileCount; i++) {
                        const fileName = document.createElement('div');
                        fileName.className = 'selected-file';
                        fileName.innerHTML = `<i class="fa fa-file-pdf"></i> ${this.files[i].name}`;
                        fileList.appendChild(fileName);
                    }
                }
            }
        });
    });
});

/**
 * Format date as dd/mm/yyyy
 * @param {Date} date - Date to format
 * @return {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format currency as EUR
 * @param {number} amount - Amount to format
 * @return {string} Formatted currency string
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {function} callback - Function to call if confirmed
 */
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

/**
 * Create tag elements from comma-separated string
 * @param {string} tagsString - Comma-separated tags
 * @param {HTMLElement} container - Container to append tags to
 */
function createTagElements(tagsString, container) {
    if (!tagsString || !container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Split the string and create tags
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        container.appendChild(tagElement);
    });
}
