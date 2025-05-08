$(document).ready(function() {
    // Initialisation de l'éditeur Summernote pour les nouvelles observations
    $('#nouvelle-observation').summernote({
        placeholder: 'Saisissez votre texte ici...',
        tabsize: 2,
        height: 100,
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link']],
            ['view', ['fullscreen', 'help']]
        ],
        lang: 'fr-FR'
    });

    // Gestionnaire pour le bouton d'ajout d'observation
    $('#ajouter-observation-btn').click(function() {
        var nouvelleObservation = $('#nouvelle-observation').summernote('code');
        var observationsActuelles = $('#observations-content').html();
        
        if (nouvelleObservation.trim() !== '') {
            // Ajouter la date et l'heure
            var maintenant = new Date();
            var dateStr = maintenant.toLocaleDateString('fr-FR') + ' ' + maintenant.toLocaleTimeString('fr-FR');
            
            // Créer le bloc d'observation avec la date
            var observationBlock = `
                <div class="observation-block border-top pt-3 mt-3">
                    <small class="text-muted">${dateStr}</small>
                    <div class="mt-2">${nouvelleObservation}</div>
                </div>
            `;

            // Mettre à jour le contenu
            var nouveauContenu = observationsActuelles + observationBlock;
            $('#observations-content').html(nouveauContenu);
            
            // Envoyer la mise à jour au serveur
            $.ajax({
                url: `/prestations/save_observations/${prestationId}`,
                method: 'POST',
                data: {
                    observations: nouveauContenu
                },
                success: function(response) {
                    // Réinitialiser l'éditeur
                    $('#nouvelle-observation').summernote('code', '');
                    // Fermer le modal
                    $('#ajout-observation-modal').modal('hide');
                    // Afficher un message de succès
                    toastr.success('Observation ajoutée avec succès');
                },
                error: function() {
                    toastr.error('Erreur lors de l\'ajout de l\'observation');
                }
            });
        }
    });
});
