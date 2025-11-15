// UI state management and manipulation
export const UI = {
    showFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const step1Container = document.getElementById('step1Container');
        
        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            fileInfo.classList.add('active');
            fileInfo.style.display = 'block';
        }
        
        if (step1Container) {
            step1Container.style.display = 'block';
        }
    },

    hideFileInfo() {
        const fileInfo = document.getElementById('fileInfo');
        const step1Container = document.getElementById('step1Container');
        
        if (fileInfo) {
            fileInfo.classList.remove('active');
            fileInfo.style.display = 'none';
        }
        
        if (step1Container) {
            step1Container.style.display = 'none';
        }
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    updateAIButton() {
        const runAIBtn = document.getElementById('runAIBtn');
        const currentFile = window.appState?.currentFile;
        
        if (runAIBtn) {
            runAIBtn.disabled = !currentFile;
        }
    },

    updateGenerateReportButton() {
        const runBtn = document.getElementById('runBtn');
        const currentFile = window.appState?.currentFile;
        const aiResults = window.appState?.aiResults;
        
        if (runBtn) {
            const hasFile = currentFile !== null;
            const hasResults = aiResults && aiResults.length > 0;
            runBtn.disabled = !(hasFile && hasResults);
        }
    },

    showAuthMessage(message, type) {
        const authMessage = document.getElementById('authMessage');
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.className = `auth-message ${type} active`;
        }
    },

    hideAuthMessage() {
        const authMessage = document.getElementById('authMessage');
        if (authMessage) {
            authMessage.classList.remove('active');
        }
    },

    populateSelect(selectElement, data, valueKey, placeholder) {
        if (!selectElement || !data) return;
        
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id || item.ID || '';
            option.textContent = item[valueKey] || '';
            selectElement.appendChild(option);
        });
    },

    renderReportOptions(data) {
        const reportOptionsContainer = document.getElementById('reportOptionsContainer');
        if (!reportOptionsContainer || !data) return;

        reportOptionsContainer.innerHTML = '';
        
        data.forEach((option, index) => {
            const optionHTML = `
                <div class="report-option">
                    <div class="report-option-header">
                        <input type="radio" id="reportOption${index}" name="reportOption" value="${option.id || index}" class="report-option-radio">
                        <label for="reportOption${index}" class="report-option-label">
                            <h3 class="report-title">${option.title || 'Untitled Option'}</h3>
                        </label>
                    </div>
                    <div class="report-option-content">
                        <p class="report-description">${option.description || 'No description available'}</p>
                        ${option.subcategories ? this.renderSubcategories(option.subcategories, index) : ''}
                    </div>
                </div>
            `;
            reportOptionsContainer.innerHTML += optionHTML;
        });
    },

    renderSubcategories(subcategories, parentIndex) {
        if (!subcategories || subcategories.length === 0) return '';
        
        let html = '<div class="subcategories">';
        subcategories.forEach((sub, subIndex) => {
            html += `
                <div class="subcategory">
                    <label class="subcategory-label">
                        <input type="checkbox" class="report-checkbox" value="${sub.id || `${parentIndex}-${subIndex}`}">
                        <span class="subcategory-text">${sub.title || 'Untitled Subcategory'}</span>
                    </label>
                    ${sub.description ? `<p class="subcategory-description">${sub.description}</p>` : ''}
                </div>
            `;
        });
        html += '</div>';
        return html;
    },

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.add('active');
        }
    },

    hideError(element) {
        if (element) {
            element.classList.remove('active');
        }
    },

    showLoadingState(button, loadingText = 'Processing...') {
        if (button) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
        }
    },

    hideLoadingState(button) {
        if (button && button.dataset.originalText) {
            button.disabled = false;
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    },

    updateAIPrompt() {
        // Implementation for updating AI prompt based on selected options
        const checkedOptions = this.getSelectedOptions();
        // Additional logic for prompt updates
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
    }
};