
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const submitButton = document.getElementById('submit-button');
    
    if (!form || !submitButton) {
        console.error('Formulaire ou bouton de soumission non trouvé');
        return;
    }

    // Gestionnaire de soumission du formulaire
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Tentative de soumission du formulaire');
        
        // Vérifier si le type de déménagement est sélectionné
        const typeDemenagement = document.getElementById('type_demenagement_id');
        if (!typeDemenagement || !typeDemenagement.value) {
            console.log('Type de déménagement non sélectionné');
            alert('Veuillez sélectionner un type de déménagement');
            return;
        }

        if (this.checkValidity()) {
            console.log('Formulaire valide - Soumission...');
            this.submit();
        } else {
            console.log('Formulaire invalide - Affichage des erreurs');
            this.reportValidity();
        }
    });

    // Gestionnaire pour le bouton de soumission
    submitButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Clic sur le bouton de soumission');
        
        // Déclencher la soumission du formulaire
        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
        });
        form.dispatchEvent(submitEvent);
    });

    // Observer les changements sur le select du type de déménagement
    const typeSelect = document.getElementById('type_demenagement_id');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            console.log('Type de déménagement changé:', this.value);
            // S'assurer que le bouton reste cliquable
            submitButton.disabled = false;
        });
    }
});
