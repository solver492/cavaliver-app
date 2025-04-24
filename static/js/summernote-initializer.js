/**
 * Script pour initialiser correctement l'éditeur de texte enrichi Summernote
 * et éviter les erreurs d'initialisation
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation de l'éditeur de texte enrichi...");
    
    try {
        // Vérifier si des éléments avec la classe summernote-editor existent
        const summernoteElements = document.querySelectorAll('.summernote-editor');
        
        if (summernoteElements && summernoteElements.length > 0) {
            // Vérifier si la fonction summernote est disponible (jQuery et Summernote sont chargés)
            if (typeof $ !== 'undefined' && typeof $.fn.summernote !== 'undefined') {
                console.log(`Initialisation de Summernote pour ${summernoteElements.length} éditeurs`);
                
                // Initialiser Summernote pour chaque élément trouvé
                $('.summernote-editor').summernote({
                    lang: 'fr-FR',
                    height: 200,
                    toolbar: [
                        ['style', ['style']],
                        ['font', ['bold', 'underline', 'clear']],
                        ['color', ['color']],
                        ['para', ['ul', 'ol', 'paragraph']],
                        ['table', ['table']],
                        ['insert', ['link']],
                        ['view', ['fullscreen', 'codeview', 'help']]
                    ],
                    placeholder: 'Saisissez votre texte ici...'
                });
                
                console.log("Éditeur(s) de texte enrichi initialisé(s) avec succès");
            } else {
                console.error("[ERROR-DEBUGGER] jQuery ou Summernote n'est pas chargé correctement");
                // Utiliser un textarea normal si Summernote n'est pas disponible
                summernoteElements.forEach(element => {
                    element.classList.add('form-control');
                    element.setAttribute('rows', '6');
                });
            }
        } else {
            console.log("Aucun éditeur Summernote à initialiser sur cette page");
        }
    } catch (error) {
        console.error("[ERROR-DEBUGGER] Erreur lors de l'initialisation de l'éditeur de texte enrichi:", error);
    }
});
