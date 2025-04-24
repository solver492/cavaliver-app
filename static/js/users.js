/**
 * Users management specific JavaScript for Cavalier Déménagement
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the user management page
    if (!document.querySelector('.user-page')) return;
    
    // Handle role change to show/hide vehicle field
    const roleSelect = document.getElementById('role');
    const vehicleGroup = document.getElementById('vehicle-group');
    
    if (roleSelect && vehicleGroup) {
        // Function to toggle vehicle field visibility
        const toggleVehicleField = function() {
            if (roleSelect.value === 'transporteur') {
                vehicleGroup.classList.remove('d-none');
                
                // Rendre le champ permis de conduire obligatoire
                const permisInput = document.getElementById('permis_conduire');
                if (permisInput) {
                    permisInput.setAttribute('required', 'required');
                }
                
                // Rendre le champ type de véhicule obligatoire
                const typeVehiculeSelect = document.getElementById('type_vehicule_id');
                if (typeVehiculeSelect) {
                    typeVehiculeSelect.setAttribute('required', 'required');
                }
                
                // Rendre le champ description véhicule obligatoire
                const vehiculeInput = document.getElementById('vehicule');
                if (vehiculeInput) {
                    vehiculeInput.setAttribute('required', 'required');
                }
            } else {
                vehicleGroup.classList.add('d-none');
                
                // Enlever le caractère obligatoire des champs
                const permisInput = document.getElementById('permis_conduire');
                if (permisInput) {
                    permisInput.removeAttribute('required');
                }
                
                const typeVehiculeSelect = document.getElementById('type_vehicule_id');
                if (typeVehiculeSelect) {
                    typeVehiculeSelect.removeAttribute('required');
                }
                
                const vehiculeInput = document.getElementById('vehicule');
                if (vehiculeInput) {
                    vehiculeInput.removeAttribute('required');
                }
            }
        };
        
        // Handle role change
        roleSelect.addEventListener('change', toggleVehicleField);
        
        // Initial state setup
        toggleVehicleField();
    }
    
    // Password strength meter
    const passwordInput = document.getElementById('password');
    const passwordStrength = document.getElementById('password-strength');
    
    if (passwordInput && passwordStrength) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            
            // Update password strength indicator
            passwordStrength.innerHTML = '';
            
            if (password) {
                const indicator = document.createElement('div');
                indicator.className = 'progress';
                
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                progressBar.style.width = `${strength.score * 25}%`;
                progressBar.setAttribute('role', 'progressbar');
                progressBar.setAttribute('aria-valuenow', strength.score);
                progressBar.setAttribute('aria-valuemin', '0');
                progressBar.setAttribute('aria-valuemax', '4');
                
                // Set color based on strength
                if (strength.score <= 1) {
                    progressBar.classList.add('bg-danger');
                } else if (strength.score === 2) {
                    progressBar.classList.add('bg-warning');
                } else if (strength.score === 3) {
                    progressBar.classList.add('bg-info');
                } else {
                    progressBar.classList.add('bg-success');
                }
                
                indicator.appendChild(progressBar);
                
                const feedbackText = document.createElement('small');
                feedbackText.className = 'form-text mt-1';
                feedbackText.textContent = strength.feedback;
                
                passwordStrength.appendChild(indicator);
                passwordStrength.appendChild(feedbackText);
            }
        });
    }
    
    // Password confirmation validation
    const passwordConfirmInput = document.getElementById('confirm_password');
    const passwordMatchFeedback = document.getElementById('password-match-feedback');
    
    if (passwordInput && passwordConfirmInput && passwordMatchFeedback) {
        const validatePasswordMatch = function() {
            const password = passwordInput.value;
            const confirmPassword = passwordConfirmInput.value;
            
            if (confirmPassword) {
                if (password === confirmPassword) {
                    passwordConfirmInput.classList.remove('is-invalid');
                    passwordConfirmInput.classList.add('is-valid');
                    passwordMatchFeedback.textContent = 'Les mots de passe correspondent.';
                    passwordMatchFeedback.className = 'valid-feedback';
                } else {
                    passwordConfirmInput.classList.remove('is-valid');
                    passwordConfirmInput.classList.add('is-invalid');
                    passwordMatchFeedback.textContent = 'Les mots de passe ne correspondent pas.';
                    passwordMatchFeedback.className = 'invalid-feedback';
                }
            } else {
                passwordConfirmInput.classList.remove('is-valid', 'is-invalid');
                passwordMatchFeedback.textContent = '';
            }
        };
        
        passwordInput.addEventListener('input', validatePasswordMatch);
        passwordConfirmInput.addEventListener('input', validatePasswordMatch);
    }
    
    // Handle user delete confirmation
    const deleteButtons = document.querySelectorAll('.delete-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const userName = this.dataset.userName;
            
            confirmAction(
                `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`, 
                () => {
                    window.location.href = this.href;
                }
            );
        });
    });
    
    // Username validation (check for unique username)
    const usernameInput = document.getElementById('username');
    const usernameFeedback = document.getElementById('username-feedback');
    
    if (usernameInput && usernameFeedback) {
        usernameInput.addEventListener('blur', function() {
            const username = this.value.trim();
            const currentUsername = this.dataset.currentUsername || '';
            
            if (username && username !== currentUsername) {
                // In a real app, this would check against the database
                // For demonstration, we'll just show a success message
                usernameInput.classList.add('is-valid');
                usernameFeedback.textContent = 'Nom d\'utilisateur disponible.';
                usernameFeedback.className = 'valid-feedback';
            }
        });
    }
});

/**
 * Check password strength
 * @param {string} password - Password to check
 * @return {Object} Strength assessment object
 */
function checkPasswordStrength(password) {
    // This is a simple implementation
    // In a real app, use a library like zxcvbn for better assessment
    
    if (!password) {
        return { score: 0, feedback: 'Veuillez saisir un mot de passe.' };
    }
    
    let score = 0;
    let feedback = '';
    
    // Length check
    if (password.length >= 8) {
        score += 1;
    }
    
    // Complexity checks
    if (/[A-Z]/.test(password)) {
        score += 1;
    }
    
    if (/[0-9]/.test(password)) {
        score += 1;
    }
    
    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
    }
    
    // Provide feedback based on score
    switch (score) {
        case 0:
            feedback = 'Mot de passe très faible. Ajoutez au moins 8 caractères.';
            break;
        case 1:
            feedback = 'Mot de passe faible. Ajoutez des majuscules, chiffres et caractères spéciaux.';
            break;
        case 2:
            feedback = 'Mot de passe moyen. Continuez à améliorer sa complexité.';
            break;
        case 3:
            feedback = 'Mot de passe fort.';
            break;
        case 4:
            feedback = 'Mot de passe très fort !';
            break;
    }
    
    return { score, feedback };
}
