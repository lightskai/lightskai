// Main application entry point and coordination
import { CONFIG } from './config.js';
import { Auth } from './auth.js';
import { ThemeManager } from './theme-manager.js';
import { FileHandler } from './file-handler.js';
import { AIProcessor } from './ai-processor.js';
import { ReportGenerator } from './report-generator.js';
import { DataLoader, API } from './data-loader.js';
import { UserPreferences } from './user-preferences.js';
import { UI } from './ui-manager.js';
import { Utils } from './utils.js';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// Make global references for backward compatibility
window.supabaseClient = supabaseClient;
window.API = API;
window.DataLoader = DataLoader;
window.FileHandler = FileHandler;

// Application state management
export const appState = {
    currentUser: null,
    currentFile: null,
    reportOptions: [],
    reportOptionsWithPrompts: [],
    openAIKey: null,
    aiResults: '',
    meetingTypes: [],
    frameworks: [],
    industries: [],
    userPreferences: null,
    defaultSettings: null,
    isLoginMode: true,
    isMagicLinkMode: false,
    isForgotPasswordMode: false
};

// Make state globally accessible
window.appState = appState;

// DOM element references
export const elements = {
    authContainer: document.getElementById('authContainer'),
    appContainer: document.getElementById('appContainer'),
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authSubtitle: document.getElementById('authSubtitle'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authMessage: document.getElementById('authMessage'),
    authBackLink: document.getElementById('authBackLink'),
    authToggleText: document.getElementById('authToggleText'),
    authToggleLink: document.getElementById('authToggleLink'),
    emailInput: document.getElementById('emailInput'),
    passwordInput: document.getElementById('passwordInput'),
    passwordGroup: document.getElementById('passwordGroup'),
    emailGroup: document.getElementById('emailGroup'),
    magicLinkToggle: document.getElementById('magicLinkToggle'),
    magicLinkToggleText: document.getElementById('magicLinkToggleText'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    forgotPasswordContainer: document.getElementById('forgotPasswordContainer'),
    userEmail: document.getElementById('userEmail'),
    logoutBtn: document.getElementById('logoutBtn'),
    adminBtn: document.getElementById('adminBtn'),
    adminPanel: document.getElementById('adminPanel'),
    adminClose: document.getElementById('adminClose'),
    fileInput: document.getElementById('fileInput'),
    uploadArea: document.getElementById('uploadArea'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    removeFile: document.getElementById('removeFile'),
    meetingTypeSelect: document.getElementById('meetingTypeSelect'),
    methodologySelect: document.getElementById('methodologySelect'),
    industrySelect: document.getElementById('industrySelect'),
    reportOptionsContainer: document.getElementById('reportOptionsContainer'),
    copyPromptBtn: document.getElementById('copyPromptBtn'),
    runBtn: document.getElementById('runBtn'),
    runAIBtn: document.getElementById('runAIBtn'),
    aiResultsDisplay: document.getElementById('aiResultsDisplay'),
    copyResultsBtn: document.getElementById('copyResultsBtn'),
    selectorsError: document.getElementById('selectorsError'),
    optionsError: document.getElementById('optionsError'),
    adminMeetingType: document.getElementById('adminMeetingType'),
    adminMethodology: document.getElementById('adminMethodology'),
    adminIndustry: document.getElementById('adminIndustry'),
    themeSelect: document.getElementById('themeSelect'),
    applyThemeBtn: document.getElementById('applyThemeBtn'),
    adminSaveBtn: document.getElementById('adminSaveBtn'),
    adminCancelBtn: document.getElementById('adminCancelBtn'),
    adminResetBtn: document.getElementById('adminResetBtn'),
    adminSuccessMessage: document.getElementById('adminSuccessMessage'),
    adminSuccessCloseBtn: document.getElementById('adminSuccessCloseBtn'),
    adminNewPassword: document.getElementById('adminNewPassword'),
    adminConfirmPassword: document.getElementById('adminConfirmPassword'),
    adminChangePasswordBtn: document.getElementById('adminChangePasswordBtn'),
    passwordStrengthBar: document.getElementById('passwordStrengthBar'),
    passwordRequirements: document.querySelectorAll('.password-requirement')
};

// Event listeners setup
export const EventListeners = {
    init() {
        this.setupAuthListeners();
        this.setupFileListeners();
        this.setupAdminListeners();
        this.setupReportListeners();
        this.setupPasswordValidation();
        this.setupAuthStateListener();
    },

    setupAuthListeners() {
        // Auth form submission
        if (elements.authForm) {
            elements.authForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = elements.emailInput?.value?.trim();
                const password = elements.passwordInput?.value;

                if (!email || (!password && !appState.isMagicLinkMode && !appState.isForgotPasswordMode)) {
                    UI.showAuthMessage('Please fill in all required fields.', 'error');
                    return;
                }

                if (appState.isMagicLinkMode) {
                    await Auth.signInWithMagicLink(email);
                } else if (appState.isForgotPasswordMode) {
                    await Auth.resetPassword(email);
                } else if (appState.isLoginMode) {
                    await Auth.signIn(email, password);
                } else {
                    await Auth.signUp(email, password);
                }
            });
        }

        // Auth mode toggles
        if (elements.authToggleLink) {
            elements.authToggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.toggleAuthMode();
            });
        }

        if (elements.magicLinkToggle) {
            elements.magicLinkToggle.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.toggleMagicLinkMode();
            });
        }

        if (elements.forgotPasswordLink) {
            elements.forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.toggleForgotPasswordMode();
            });
        }

        if (elements.authBackLink) {
            elements.authBackLink.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.toggleAuthMode();
            });
        }

        // Logout button
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', Auth.signOut);
        }
    },

    setupFileListeners() {
        // File input change
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', FileHandler.handleFileSelect);
        }

        // Remove file button
        if (elements.removeFile) {
            elements.removeFile.addEventListener('click', () => FileHandler.removeFile());
        }

        // Drag and drop
        if (elements.uploadArea) {
            elements.uploadArea.addEventListener('dragover', FileHandler.handleDragOver);
            elements.uploadArea.addEventListener('dragleave', FileHandler.handleDragLeave);
            elements.uploadArea.addEventListener('drop', FileHandler.handleDrop);
            elements.uploadArea.addEventListener('click', () => elements.fileInput?.click());
        }
    },

    setupAdminListeners() {
        // Admin panel toggle
        if (elements.adminBtn) {
            elements.adminBtn.addEventListener('click', () => {
                elements.adminPanel?.classList.add('active');
            });
        }

        if (elements.adminClose) {
            elements.adminClose.addEventListener('click', () => {
                elements.adminPanel?.classList.remove('active');
            });
        }

        // Admin actions
        if (elements.adminSaveBtn) {
            elements.adminSaveBtn.addEventListener('click', async () => {
                const defaults = {
                    defaultMeetingType: elements.adminMeetingType?.value || '',
                    defaultMethodology: elements.adminMethodology?.value || '',
                    defaultIndustry: elements.adminIndustry?.value || ''
                };

                const success = await UserPreferences.saveDefaults(defaults);

                if (success) {
                    this.showSuccessMessage();
                } else {
                    alert('Failed to save defaults. Please try again.');
                }
            });
        }

        if (elements.adminResetBtn) {
            elements.adminResetBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to reset all defaults to system settings?')) {
                    const success = await UserPreferences.resetToSystemDefaults();
                    if (success) {
                        this.showSuccessMessage();
                    } else {
                        alert('Failed to reset defaults. Please try again.');
                    }
                }
            });
        }

        if (elements.adminCancelBtn) {
            elements.adminCancelBtn.addEventListener('click', () => {
                elements.adminPanel?.classList.remove('active');
            });
        }

        // Success message close
        if (elements.adminSuccessCloseBtn) {
            elements.adminSuccessCloseBtn.addEventListener('click', () => {
                this.hideSuccessMessage();
                elements.adminPanel?.classList.remove('active');
            });
        }

        // Change password
        if (elements.adminChangePasswordBtn) {
            elements.adminChangePasswordBtn.addEventListener('click', async () => {
                const newPassword = elements.adminNewPassword?.value;
                const confirmPassword = elements.adminConfirmPassword?.value;

                if (!newPassword || !confirmPassword) {
                    UI.showAuthMessage('Please fill in both password fields.', 'error');
                    return;
                }

                if (newPassword !== confirmPassword) {
                    UI.showAuthMessage('Passwords do not match.', 'error');
                    return;
                }

                const validation = Utils.validatePassword(newPassword);
                if (!validation.isValid) {
                    UI.showAuthMessage('Password does not meet requirements.', 'error');
                    return;
                }

                const result = await Auth.updatePassword(newPassword);
                if (result.success) {
                    elements.adminNewPassword.value = '';
                    elements.adminConfirmPassword.value = '';
                }
            });
        }
    },

    setupReportListeners() {
        // Run AI Analysis
        if (elements.runAIBtn) {
            elements.runAIBtn.addEventListener('click', () => {
                AIProcessor.runAIAnalysis();
            });
        }

        // Generate Report
        if (elements.runBtn) {
            elements.runBtn.addEventListener('click', () => {
                ReportGenerator.generateReport();
            });
        }

        // Copy buttons
        if (elements.copyPromptBtn) {
            elements.copyPromptBtn.addEventListener('click', (e) => {
                const text = e.target.dataset.promptText;
                if (text) {
                    navigator.clipboard.writeText(text).then(() => {
                        const originalText = e.target.textContent;
                        e.target.textContent = 'Copied!';
                        setTimeout(() => {
                            e.target.textContent = originalText;
                        }, 2000);
                    });
                }
            });
        }

        if (elements.copyResultsBtn) {
            elements.copyResultsBtn.addEventListener('click', (e) => {
                const text = e.target.dataset.resultsText;
                if (text) {
                    navigator.clipboard.writeText(text).then(() => {
                        const originalText = e.target.textContent;
                        e.target.textContent = 'Copied!';
                        setTimeout(() => {
                            e.target.textContent = originalText;
                        }, 2000);
                    });
                }
            });
        }
    },

    setupPasswordValidation() {
        if (elements.adminNewPassword) {
            elements.adminNewPassword.addEventListener('input', (e) => {
                this.validatePasswordStrength(e.target.value);
            });
        }
    },

    setupAuthStateListener() {
        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                appState.currentUser = session.user;
                Auth.showApp();
            } else if (event === 'SIGNED_OUT') {
                appState.currentUser = null;
                Auth.showAuth();
            }
        });
    },

    validatePasswordStrength(password) {
        const validation = Utils.validatePassword(password);
        const strengthBar = elements.passwordStrengthBar;

        if (strengthBar) {
            const strength = Object.values(validation.requirements).filter(Boolean).length;
            const percentage = (strength / 4) * 100;
            strengthBar.style.width = `${percentage}%`;

            if (percentage < 50) {
                strengthBar.style.backgroundColor = '#ef4444';
            } else if (percentage < 100) {
                strengthBar.style.backgroundColor = '#f59e0b';
            } else {
                strengthBar.style.backgroundColor = '#10b981';
            }
        }

        // Update requirement indicators
        if (elements.passwordRequirements) {
            elements.passwordRequirements.forEach(req => {
                const requirement = req.dataset.requirement;
                const icon = req.querySelector('.password-requirement-icon');
                
                if (validation.requirements[requirement]) {
                    req.classList.add('met');
                    if (icon) icon.textContent = '✓';
                } else {
                    req.classList.remove('met');
                    if (icon) icon.textContent = '○';
                }
            });
        }
    },

    showSuccessMessage() {
        if (elements.adminSuccessMessage) {
            elements.adminSuccessMessage.classList.add('active');
        }
    },

    hideSuccessMessage() {
        if (elements.adminSuccessMessage) {
            elements.adminSuccessMessage.classList.remove('active');
        }
    }
};

// Initialize Application
async function initApp() {
    console.log('Meeting Intelligence Platform initializing...');
    ThemeManager.init();
    EventListeners.init();
    await Auth.checkSession();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}