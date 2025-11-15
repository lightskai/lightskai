import { Utils } from './utils.js';
import { UI } from './ui-manager.js';

// File upload, validation, and text extraction
export const FileHandler = {
    handleFile(file) {
        const validation = Utils.validateFile(file);
        
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        window.appState.currentFile = file;
        UI.showFileInfo(file);
        UI.updateGenerateReportButton();
        UI.updateAIButton();
    },

    removeFile() {
        window.appState.currentFile = null;
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        UI.hideFileInfo();
        UI.updateGenerateReportButton();
        UI.updateAIButton();
    },

    async extractTextFromFile(file) {
        const fileType = file.type;
        
        try {
            if (fileType === 'text/plain') {
                return await this.extractTextFromTxt(file);
            } else if (fileType === 'application/pdf') {
                return await this.extractTextFromPdf(file);
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                return await this.extractTextFromDocx(file);
            } else {
                throw new Error(`Unsupported file type: ${fileType || 'unknown'}. Please upload a TXT, PDF, or DOCX file.`);
            }
        } catch (error) {
            console.error('Text extraction error:', error);
            throw error;
        }
    },

    async extractTextFromTxt(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    resolve(e.target.result);
                } catch (error) {
                    reject(new Error('Failed to read TXT file: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read TXT file'));
            reader.readAsText(file);
        });
    },

    async extractTextFromPdf(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (!window.pdfjsLib) {
                        throw new Error('PDF.js library not loaded');
                    }

                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items
                            .map(item => item.str)
                            .join(' ')
                            .replace(/\\s+/g, ' ')
                            .trim();
                        
                        if (pageText) {
                            fullText += pageText + '\\n\\n';
                        }
                    }

                    if (!fullText.trim()) {
                        throw new Error('No text content found in PDF. The PDF might be image-based or encrypted.');
                    }

                    resolve(fullText.trim());
                } catch (error) {
                    reject(new Error('Failed to extract text from PDF: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            reader.readAsArrayBuffer(file);
        });
    },

    async extractTextFromDocx(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (!window.mammoth) {
                        throw new Error('Mammoth library not loaded');
                    }

                    const arrayBuffer = e.target.result;
                    const result = await window.mammoth.extractRawText({ arrayBuffer });
                    
                    if (!result.value || !result.value.trim()) {
                        throw new Error('No text content found in DOCX file.');
                    }

                    resolve(result.value.trim());
                } catch (error) {
                    reject(new Error('Failed to extract text from DOCX: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read DOCX file'));
            reader.readAsArrayBuffer(file);
        });
    },

    // File input change handler
    handleFileSelect(e) {
        if (e.target.files && e.target.files[0]) {
            FileHandler.handleFile(e.target.files[0]);
        }
    },

    // Drag and drop handlers
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    },

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            FileHandler.handleFile(files[0]);
        }
    }
};