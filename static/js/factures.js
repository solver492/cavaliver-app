/**
 * Factures management specific JavaScript for Cavalier Déménagement
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the facture page
    if (!document.querySelector('.facture-page')) return;
    
    // Handle client selection and prestation fetch
    const clientSelect = document.getElementById('client_id');
    const prestationSelect = document.getElementById('prestation_id');
    
    if (clientSelect && prestationSelect) {
        clientSelect.addEventListener('change', function() {
            const clientId = this.value;
            
            // Disable prestation select while loading
            prestationSelect.disabled = true;
            
            // Show loading indicator
            const loadingMsg = document.createElement('small');
            loadingMsg.id = 'loading-prestations';
            loadingMsg.className = 'text-muted ms-2';
            loadingMsg.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Chargement des prestations...';
            
            const existingMsg = document.getElementById('loading-prestations');
            if (existingMsg) {
                existingMsg.remove();
            }
            
            prestationSelect.parentNode.appendChild(loadingMsg);
            
            // Fetch prestations for the selected client
            fetch(`/factures/get-prestations/${clientId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur de chargement des prestations');
                    }
                    return response.json();
                })
                .then(data => {
                    // Clear current options
                    prestationSelect.innerHTML = '';
                    
                    // Add new options
                    data.forEach(prestation => {
                        const option = document.createElement('option');
                        option.value = prestation.id;
                        
                        // Format the text with all available information
                        let optionText = prestation.text;
                        if (prestation.description) {
                            optionText += ` (${prestation.description})`;
                        }
                        if (prestation.date) {
                            optionText += ` - ${prestation.date}`;
                        }
                        if (prestation.status) {
                            optionText += ` [${prestation.status}]`;
                        }
                        
                        option.textContent = optionText;
                        prestationSelect.appendChild(option);
                    });
                    
                    // Enable prestation select
                    prestationSelect.disabled = false;
                    
                    // Remove loading indicator
                    const loadingMsg = document.getElementById('loading-prestations');
                    if (loadingMsg) {
                        loadingMsg.remove();
                    }
                })
                .catch(error => {
                    console.error('Error fetching prestations:', error);
                    
                    // Show error message
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'alert alert-danger mt-2';
                    errorMsg.textContent = 'Erreur lors du chargement des prestations. Veuillez réessayer.';
                    prestationSelect.parentNode.appendChild(errorMsg);
                    
                    // Remove loading indicator
                    const loadingMsg = document.getElementById('loading-prestations');
                    if (loadingMsg) {
                        loadingMsg.remove();
                    }
                    
                    // Remove error after 5 seconds
                    setTimeout(() => {
                        if (errorMsg.parentNode) {
                            errorMsg.parentNode.removeChild(errorMsg);
                        }
                    }, 5000);
                    
                    // Enable prestation select
                    prestationSelect.disabled = false;
                });
        });
    }
    
    // Handle TTC calculation based on HT and TVA
    const montantHtInput = document.getElementById('montant_ht');
    const tauxTvaInput = document.getElementById('taux_tva');
    const montantTtcInput = document.getElementById('montant_ttc');
    
    if (montantHtInput && tauxTvaInput && montantTtcInput) {
        // Function to calculate TTC
        const calculateResteAPayer = function() {
            const montantTotal = parseFloat(montantHtInput.value) || 0;
            const montantAcompte = parseFloat(tauxTvaInput.value) || 0;
            
            // Calcul du reste à payer (montant total - acompte)
            const resteAPayer = montantTotal - montantAcompte;
            
            // Mettre à jour l'affichage du reste à payer
            const resteAPayerDisplay = document.getElementById('reste-a-payer');
            if (resteAPayerDisplay) {
                resteAPayerDisplay.textContent = resteAPayer.toFixed(2) + ' €';
            }

            // On ne calcule plus automatiquement la commission commerciale
            // L'utilisateur saisit directement le montant de la commission
        };
        
        // Calculate on input change
        montantHtInput.addEventListener('input', calculateResteAPayer);
        tauxTvaInput.addEventListener('input', calculateResteAPayer);
        
        // Initial calculation
        calculateResteAPayer();
    }
    
    // Handle facture date validation
    const dateEmissionInput = document.getElementById('date_emission');
    const dateEcheanceInput = document.getElementById('date_echeance');
    
    if (dateEmissionInput && dateEcheanceInput) {
        dateEmissionInput.addEventListener('change', function() {
            // Ensure date_echeance is always after date_emission
            const dateEmission = new Date(this.value);
            const dateEcheance = new Date(dateEcheanceInput.value);
            
            if (dateEcheance < dateEmission) {
                // Set date_echeance to date_emission + 30 days by default
                const newDateEcheance = new Date(dateEmission);
                newDateEcheance.setDate(newDateEcheance.getDate() + 30);
                dateEcheanceInput.value = newDateEcheance.toISOString().split('T')[0];
            }
        });
        
        dateEcheanceInput.addEventListener('change', function() {
            // Ensure date_echeance is always after date_emission
            const dateEmission = new Date(dateEmissionInput.value);
            const dateEcheance = new Date(this.value);
            
            if (dateEcheance < dateEmission) {
                // Show error message
                alert('La date d\'échéance doit être postérieure à la date d\'émission.');
                
                // Reset to date_emission + 30 days
                const newDateEcheance = new Date(dateEmission);
                newDateEcheance.setDate(newDateEcheance.getDate() + 30);
                this.value = newDateEcheance.toISOString().split('T')[0];
            }
        });
    }
    
    // Handle facture search/filter form
    const resetFilterButton = document.getElementById('reset-filter');
    if (resetFilterButton) {
        resetFilterButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Reset all form fields
            const filterForm = this.closest('form');
            if (filterForm) {
                const selects = filterForm.querySelectorAll('select');
                selects.forEach(select => {
                    select.selectedIndex = 0;
                });
                
                const dateInputs = filterForm.querySelectorAll('input[type="date"]');
                dateInputs.forEach(input => {
                    input.value = '';
                });
                
                // Submit the form to reset filters
                filterForm.submit();
            }
        });
    }
    
    // Handle facture delete confirmation
    const deleteButtons = document.querySelectorAll('.delete-facture');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const factureNum = this.dataset.factureNum;
            
            confirmAction(
                `Êtes-vous sûr de vouloir supprimer la facture ${factureNum} ? Cette action est irréversible.`, 
                () => {
                    window.location.href = this.href;
                }
            );
        });
    });
    
    // Auto-generate invoice number if empty
    const generateInvoiceNumberButton = document.getElementById('generate-invoice-number');
    if (generateInvoiceNumberButton) {
        generateInvoiceNumberButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const numeroInput = document.getElementById('numero');
            if (numeroInput) {
                // Generate a new invoice number based on current date
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                
                // Generate a random 3-digit sequence
                const sequence = Math.floor(Math.random() * 900) + 100;
                
                // Format: FAC-YYYYMMDD-XXX
                const invoiceNumber = `FAC-${year}${month}${day}-${sequence}`;
                numeroInput.value = invoiceNumber;
            }
        });
    }
});
