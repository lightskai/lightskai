// Utility functions and validators
export const Utils = {
    validateFile(file) {
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Invalid file type. Please upload PDF, TXT, or DOCX files only.' };
        }
        
        if (file.size > 1024 * 1024 * 1024) { // 1GB limit
            return { valid: false, error: 'File size too large. Maximum size is 1GB.' };
        }
        
        return { valid: true };
    },

    getSelectedOptions() {
        const checkboxes = document.querySelectorAll('.report-checkbox:checked');
        const selectedOptions = [];
        
        checkboxes.forEach(checkbox => {
            const container = checkbox.closest('.report-option');
            if (container) {
                const title = container.querySelector('.report-title')?.textContent?.trim();
                const description = container.querySelector('.report-description')?.textContent?.trim();
                
                if (title) {
                    selectedOptions.push({
                        title: title,
                        description: description || ''
                    });
                }
            }
        });
        
        return selectedOptions;
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password)
        };
        
        return {
            isValid: Object.values(requirements).every(req => req),
            requirements: requirements
        };
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};