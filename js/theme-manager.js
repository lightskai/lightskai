// Theme management functionality
export const ThemeManager = {
    init() {
        // Load saved theme or default to light
        this.loadTheme();
        
        // Set up theme selector
        const savedTheme = localStorage.getItem('lightskai-theme') || 'light';
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
        
        // Apply theme button event
        const applyThemeBtn = document.getElementById('applyThemeBtn');
        if (applyThemeBtn) {
            applyThemeBtn.addEventListener('click', () => {
                this.applySelectedTheme();
            });
        }
        
        // Auto-detect system theme changes if auto is selected
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (themeSelect && themeSelect.value === 'auto') {
                this.applyTheme('auto');
            }
        });
    },
    
    applySelectedTheme() {
        const themeSelect = document.getElementById('themeSelect');
        const applyThemeBtn = document.getElementById('applyThemeBtn');
        
        if (!themeSelect || !applyThemeBtn) return;
        
        const selectedTheme = themeSelect.value;
        this.applyTheme(selectedTheme);
        this.saveTheme(selectedTheme);
        
        // Show success message briefly
        const originalText = applyThemeBtn.textContent;
        applyThemeBtn.textContent = 'Applied!';
        applyThemeBtn.disabled = true;
        
        setTimeout(() => {
            applyThemeBtn.textContent = originalText;
            applyThemeBtn.disabled = false;
        }, 1500);
    },
    
    applyTheme(theme) {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('light-theme', 'dark-theme');
        
        // Determine actual theme to apply
        let actualTheme = theme;
        if (theme === 'auto') {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        // Apply theme class
        body.classList.add(`${actualTheme}-theme`);
    },
    
    saveTheme(theme) {
        localStorage.setItem('lightskai-theme', theme);
    },
    
    loadTheme() {
        const savedTheme = localStorage.getItem('lightskai-theme') || 'light';
        this.applyTheme(savedTheme);
    }
};