// Company Branding Handler
document.addEventListener('DOMContentLoaded', function() {
    const logoTypeSelect = document.getElementById('logoTypeSelect');
    const logoTextGroup = document.getElementById('logoTextGroup');
    const logoImageGroup = document.getElementById('logoImageGroup');
    const logoTextInput = document.getElementById('logoTextInput');
    const companyNameInput = document.getElementById('companyNameInput');
    const companyNameColorInput = document.getElementById('companyNameColorInput');
    const companyNameColorText = document.getElementById('companyNameColorText');
    const logoImageInput = document.getElementById('logoImageInput');
    const applyLogoBtn = document.getElementById('applyLogoBtn');
    const resetLogoBtn = document.getElementById('resetLogoBtn');
    const logoPreview = document.getElementById('logoPreview');
    const logoPreviewImg = document.getElementById('logoPreviewImg');

    // Load saved branding
    loadBranding();

    // Color picker sync - update text input when color picker changes
    if (companyNameColorInput) {
        companyNameColorInput.addEventListener('input', function() {
            companyNameColorText.value = this.value;
        });
    }

    // Text input sync - update color picker when text input changes
    if (companyNameColorText) {
        companyNameColorText.addEventListener('input', function() {
            const color = this.value.trim();
            // Validate hex color format
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                companyNameColorInput.value = color;
            }
        });

        // Also handle on blur to correct invalid values
        companyNameColorText.addEventListener('blur', function() {
            const color = this.value.trim();
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                // Reset to color picker value if invalid
                this.value = companyNameColorInput.value;
            }
        });
    }

    // Logo type selector handler
    if (logoTypeSelect) {
        logoTypeSelect.addEventListener('change', function() {
            if (this.value === 'text') {
                logoTextGroup.style.display = 'block';
                logoImageGroup.style.display = 'none';
            } else {
                logoTextGroup.style.display = 'none';
                logoImageGroup.style.display = 'block';
            }
        });
    }

    // Logo image preview handler
    if (logoImageInput) {
        logoImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (max 200KB)
                if (file.size > 200 * 1024) {
                    alert('Image size must be less than 200KB');
                    this.value = '';
                    logoPreview.style.display = 'none';
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = function(event) {
                    logoPreviewImg.src = event.target.result;
                    logoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                logoPreview.style.display = 'none';
            }
        });
    }

    // Apply branding button handler
    if (applyLogoBtn) {
        applyLogoBtn.addEventListener('click', function() {
            const logoType = logoTypeSelect.value;
            const logoText = logoTextInput.value.trim() || 'LS';
            const companyName = companyNameInput.value.trim() || 'Light Skai';
            const companyNameColor = companyNameColorInput.value;

            if (logoType === 'text') {
                // Save text logo
                const branding = {
                    type: 'text',
                    logoText: logoText,
                    companyName: companyName,
                    companyNameColor: companyNameColor
                };
                localStorage.setItem('companyBranding', JSON.stringify(branding));
                applyBranding(branding);
                alert('Branding applied successfully!');
            } else {
                // Save image logo
                const file = logoImageInput.files[0];
                if (!file) {
                    alert('Please select a logo image');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    const branding = {
                        type: 'image',
                        logoImage: event.target.result,
                        companyName: companyName,
                        companyNameColor: companyNameColor
                    };
                    localStorage.setItem('companyBranding', JSON.stringify(branding));
                    applyBranding(branding);
                    alert('Branding applied successfully!');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Reset branding button handler
    if (resetLogoBtn) {
        resetLogoBtn.addEventListener('click', function() {
            if (confirm('Reset to default branding?')) {
                localStorage.removeItem('companyBranding');
                logoTypeSelect.value = 'text';
                logoTextInput.value = 'LS';
                companyNameInput.value = 'Light Skai';
                companyNameColorInput.value = '#1e293b';
                companyNameColorText.value = '#1e293b';
                logoTextGroup.style.display = 'block';
                logoImageGroup.style.display = 'none';
                logoPreview.style.display = 'none';
                
                applyBranding({
                    type: 'text',
                    logoText: 'LS',
                    companyName: 'Light Skai',
                    companyNameColor: '#1e293b'
                });
                alert('Branding reset to default!');
            }
        });
    }

    // Function to load saved branding
    function loadBranding() {
        const savedBranding = localStorage.getItem('companyBranding');
        if (savedBranding) {
            try {
                const branding = JSON.parse(savedBranding);
                
                // Update form fields
                logoTypeSelect.value = branding.type;
                companyNameInput.value = branding.companyName || 'Light Skai';
                companyNameColorInput.value = branding.companyNameColor || '#1e293b';
                companyNameColorText.value = branding.companyNameColor || '#1e293b';
                
                if (branding.type === 'text') {
                    logoTextInput.value = branding.logoText || 'LS';
                    logoTextGroup.style.display = 'block';
                    logoImageGroup.style.display = 'none';
                } else {
                    logoPreviewImg.src = branding.logoImage;
                    logoPreview.style.display = 'block';
                    logoTextGroup.style.display = 'none';
                    logoImageGroup.style.display = 'block';
                }
                
                // Apply to navbar
                applyBranding(branding);
            } catch (e) {
                console.error('Error loading branding:', e);
            }
        }
    }

    // Function to apply branding to navbar
    function applyBranding(branding) {
        const logoElement = document.querySelector('.logo');
        const brandNameElement = document.querySelector('.brand-name');
        const logoSection = document.querySelector('.logo-section');
        
        if (!logoElement || !brandNameElement || !logoSection) return;

        // Update company name and color
        brandNameElement.textContent = branding.companyName || 'Light Skai';
        brandNameElement.style.color = branding.companyNameColor || '#1e293b';

        // Remove any existing custom logo image
        const existingCustomLogo = logoSection.querySelector('.custom-logo-image');
        if (existingCustomLogo) {
            existingCustomLogo.remove();
        }

        if (branding.type === 'text') {
            // Text logo - show the original logo element
            logoElement.style.display = '';
            logoElement.textContent = branding.logoText || 'LS';
            logoElement.style.backgroundImage = '';
            logoElement.style.fontSize = '';
        } else {
            // Image logo - hide the original logo element and create img element
            logoElement.style.display = 'none';
            
            // Create and insert custom logo image
            const customLogoImg = document.createElement('img');
            customLogoImg.className = 'custom-logo-image';
            customLogoImg.src = branding.logoImage;
            customLogoImg.alt = 'Company Logo';
            customLogoImg.style.width = '40px';
            customLogoImg.style.height = '40px';
            customLogoImg.style.objectFit = 'contain';
            customLogoImg.style.marginRight = '12px';
            customLogoImg.style.borderRadius = '4px';
            
            // Insert before the brand name
            logoSection.insertBefore(customLogoImg, brandNameElement);
        }
    }
});
