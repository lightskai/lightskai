// Company Branding Handler
document.addEventListener('DOMContentLoaded', function() {
    const logoTypeSelect = document.getElementById('logoTypeSelect');
    const logoTextGroup = document.getElementById('logoTextGroup');
    const logoImageGroup = document.getElementById('logoImageGroup');
    const logoTextInput = document.getElementById('logoTextInput');
    const companyNameInput = document.getElementById('companyNameInput');
    const companyNameColorInput = document.getElementById('companyNameColorInput');
    const companyNameColorText = document.getElementById('companyNameColorText');
    const pageTitleInput = document.getElementById('pageTitleInput');
    const pageTitleColorInput = document.getElementById('pageTitleColorInput');
    const pageTitleColorText = document.getElementById('pageTitleColorText');
    const pageSubtitleInput = document.getElementById('pageSubtitleInput');
    const pageSubtitleColorInput = document.getElementById('pageSubtitleColorInput');
    const pageSubtitleColorText = document.getElementById('pageSubtitleColorText');
    const logoImageInput = document.getElementById('logoImageInput');
    const applyLogoBtn = document.getElementById('applyLogoBtn');
    const resetLogoBtn = document.getElementById('resetLogoBtn');
    const logoPreview = document.getElementById('logoPreview');
    const logoPreviewImg = document.getElementById('logoPreviewImg');

    // Load saved branding
    loadBranding();

    // Color picker sync - company name color
    if (companyNameColorInput) {
        companyNameColorInput.addEventListener('input', function() {
            companyNameColorText.value = this.value;
        });
    }

    if (companyNameColorText) {
        companyNameColorText.addEventListener('input', function() {
            const color = this.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                companyNameColorInput.value = color;
            }
        });

        companyNameColorText.addEventListener('blur', function() {
            const color = this.value.trim();
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                this.value = companyNameColorInput.value;
            }
        });
    }

    // Color picker sync - page title color
    if (pageTitleColorInput) {
        pageTitleColorInput.addEventListener('input', function() {
            pageTitleColorText.value = this.value;
        });
    }

    if (pageTitleColorText) {
        pageTitleColorText.addEventListener('input', function() {
            const color = this.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                pageTitleColorInput.value = color;
            }
        });

        pageTitleColorText.addEventListener('blur', function() {
            const color = this.value.trim();
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                this.value = pageTitleColorInput.value;
            }
        });
    }

    // Color picker sync - page subtitle color
    if (pageSubtitleColorInput) {
        pageSubtitleColorInput.addEventListener('input', function() {
            pageSubtitleColorText.value = this.value;
        });
    }

    if (pageSubtitleColorText) {
        pageSubtitleColorText.addEventListener('input', function() {
            const color = this.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                pageSubtitleColorInput.value = color;
            }
        });

        pageSubtitleColorText.addEventListener('blur', function() {
            const color = this.value.trim();
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                this.value = pageSubtitleColorInput.value;
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
            const pageTitle = pageTitleInput.value.trim() || 'Meeting Intelligence Platform';
            const pageTitleColor = pageTitleColorInput.value;
            const pageSubtitle = pageSubtitleInput.value.trim() || 'Upload your meeting notes or transcriptions to generate a comprehensive report.';
            const pageSubtitleColor = pageSubtitleColorInput.value;

            if (logoType === 'text') {
                // Save text logo
                const branding = {
                    type: 'text',
                    logoText: logoText,
                    companyName: companyName,
                    companyNameColor: companyNameColor,
                    pageTitle: pageTitle,
                    pageTitleColor: pageTitleColor,
                    pageSubtitle: pageSubtitle,
                    pageSubtitleColor: pageSubtitleColor
                };
                localStorage.setItem('companyBranding', JSON.stringify(branding));
                applyBranding(branding);
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
                        companyNameColor: companyNameColor,
                        pageTitle: pageTitle,
                        pageTitleColor: pageTitleColor,
                        pageSubtitle: pageSubtitle,
                        pageSubtitleColor: pageSubtitleColor
                    };
                    localStorage.setItem('companyBranding', JSON.stringify(branding));
                    applyBranding(branding);
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
                pageTitleInput.value = 'Meeting Intelligence Platform';
                pageTitleColorInput.value = '#1e293b';
                pageTitleColorText.value = '#1e293b';
                pageSubtitleInput.value = 'Upload your meeting notes or transcriptions to generate a comprehensive report.';
                pageSubtitleColorInput.value = '#64748b';
                pageSubtitleColorText.value = '#64748b';
                logoTextGroup.style.display = 'block';
                logoImageGroup.style.display = 'none';
                logoPreview.style.display = 'none';
                
                applyBranding({
                    type: 'text',
                    logoText: 'LS',
                    companyName: 'Light Skai',
                    companyNameColor: '#1e293b',
                    pageTitle: 'Meeting Intelligence Platform',
                    pageTitleColor: '#1e293b',
                    pageSubtitle: 'Upload your meeting notes or transcriptions to generate a comprehensive report.',
                    pageSubtitleColor: '#64748b'
                });
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
                pageTitleInput.value = branding.pageTitle || 'Meeting Intelligence Platform';
                pageTitleColorInput.value = branding.pageTitleColor || '#1e293b';
                pageTitleColorText.value = branding.pageTitleColor || '#1e293b';
                pageSubtitleInput.value = branding.pageSubtitle || 'Upload your meeting notes or transcriptions to generate a comprehensive report.';
                pageSubtitleColorInput.value = branding.pageSubtitleColor || '#64748b';
                pageSubtitleColorText.value = branding.pageSubtitleColor || '#64748b';
                
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
        const pageTitleElement = document.querySelector('.page-title');
        const pageSubtitleElement = document.querySelector('.page-subtitle');
        
        if (!logoElement || !brandNameElement || !logoSection) return;

        // Update company name and color
        brandNameElement.textContent = branding.companyName || 'Light Skai';
        
        // Apply color with !important to override gradient
        const color = branding.companyNameColor || '#1e293b';
        brandNameElement.style.setProperty('color', color, 'important');
        brandNameElement.style.setProperty('background', 'none', 'important');
        brandNameElement.style.setProperty('-webkit-text-fill-color', color, 'important');
        brandNameElement.style.setProperty('background-clip', 'unset', 'important');
        brandNameElement.style.setProperty('-webkit-background-clip', 'unset', 'important');

        // Update page title and color
        if (pageTitleElement) {
            pageTitleElement.textContent = branding.pageTitle || 'Meeting Intelligence Platform';
            const titleColor = branding.pageTitleColor || '#1e293b';
            pageTitleElement.style.setProperty('color', titleColor, 'important');
        }

        // Update page subtitle and color
        if (pageSubtitleElement) {
            pageSubtitleElement.textContent = branding.pageSubtitle || 'Upload your meeting notes or transcriptions to generate a comprehensive report.';
            const subtitleColor = branding.pageSubtitleColor || '#64748b';
            pageSubtitleElement.style.setProperty('color', subtitleColor, 'important');
        }

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
