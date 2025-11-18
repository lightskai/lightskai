// Configuration
const CONFIG = {
    SUPABASE_URL: 'https://khhrkgevrhtdlwcdxvbs.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaHJrZ2V2cmh0ZGx3Y2R4dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzA5NTIsImV4cCI6MjA3ODQ0Njk1Mn0.wqd6Uds-7pEr0p1MCrZKRzLzqOPS7ziZO8eGNs_G59c',
    MAX_FILE_SIZE: 1024 * 1024 * 1024, // 1GB
    PRODUCTION_URL: 'https://lightskai.com',
    getRedirectUrl() {
        // Use local development URL if running on localhost
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? window.location.origin + window.location.pathname 
            : this.PRODUCTION_URL;
    }
};

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// State Management
const state = {
    currentUser: null,
    currentFile: null,
    reportOptions: [],
    reportOptionsWithPrompts: [],
    openAIKey: null,
    aiResults: '',
    meetingTypes: [],
    frameworks: [],
    industries: [],
    isLoginMode: true,
    isMagicLinkMode: false,
    isForgotPasswordMode: false,
    userPreferences: {
        selectedReportOption: '',
        selectedMeetingType: '',
        selectedMethodology: '',
        selectedIndustry: ''
    },
    defaultSettings: {
        defaultMeetingType: '',
        defaultMethodology: '',
        defaultIndustry: ''
    }
};

// DOM Elements
const elements = {
    authContainer: document.getElementById('authContainer'),
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authSubtitle: document.getElementById('authSubtitle'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authToggleText: document.getElementById('authToggleText'),
    authToggleLink: document.getElementById('authToggleLink'),
    authMessage: document.getElementById('authMessage'),
    emailInput: document.getElementById('emailInput'),
    passwordInput: document.getElementById('passwordInput'),
    magicLinkToggle: document.getElementById('magicLinkToggle'),
    magicLinkToggleText: document.getElementById('magicLinkToggleText'),
    passwordGroup: document.getElementById('passwordGroup'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    authBackLink: document.getElementById('authBackLink'),
    appContainer: document.getElementById('appContainer'),
    userEmail: document.getElementById('userEmail'),
    logoutBtn: document.getElementById('logoutBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    removeFile: document.getElementById('removeFile'),
    runBtn: document.getElementById('runBtn'),
    reportOptionsContainer: document.getElementById('reportOptionsContainer'),
    meetingTypeSelect: document.getElementById('meetingTypeSelect'),
    methodologySelect: document.getElementById('methodologySelect'),
    industrySelect: document.getElementById('industrySelect'),
    optionsError: document.getElementById('optionsError'),
    selectorsError: document.getElementById('selectorsError'),
    aiPromptDisplay: document.getElementById('aiPromptDisplay'),
    copyPromptBtn: document.getElementById('copyPromptBtn'),
    runAIBtn: document.getElementById('runAIBtn'),
    aiResultsDisplay: document.getElementById('aiResultsDisplay'),
    copyResultsBtn: document.getElementById('copyResultsBtn'),
    adminPanel: document.getElementById('adminPanel'),
    adminClose: document.getElementById('adminClose'),
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

// User Preferences Storage
const UserPreferences = {
    PREFERENCE_TYPE_SESSION: 'session',
    PREFERENCE_TYPE_DEFAULTS: 'defaults',

    async save() {
        if (!state.currentUser) return;

        const prefs = {
            selectedReportOption: this.getSelectedReportOption(),
            selectedMeetingType: elements.meetingTypeSelect.value,
            selectedMethodology: elements.methodologySelect.value,
            selectedIndustry: elements.industrySelect.value,
            lastUpdated: new Date().toISOString()
        };

        try {
            const { data, error } = await supabaseClient
                .from('user_preferences')
                .upsert({
                    user_id: state.currentUser.id,
                    preference_type: this.PREFERENCE_TYPE_SESSION,
                    settings: prefs,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,preference_type'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving preferences:', error);
            localStorage.setItem(`mip_prefs_${state.currentUser.id}`, JSON.stringify(prefs));
        }
    },

    getSelectedReportOption() {
        const selectedRadio = document.querySelector('.report-option-radio:checked');
        return selectedRadio ? selectedRadio.value : '';
    },

    applySelectedReportOption(selectedOption) {
        if (!selectedOption) return;
        
        const radios = document.querySelectorAll('.report-option-radio');
        radios.forEach(radio => {
            if (radio.value === selectedOption) {
                radio.checked = true;
            }
        });
    },

    async load() {
        if (!state.currentUser) return null;

        try {
            const { data, error } = await supabaseClient
                .from('user_preferences')
                .select('settings')
                .eq('user_id', state.currentUser.id)
                .eq('preference_type', this.PREFERENCE_TYPE_SESSION)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    const localData = localStorage.getItem(`mip_prefs_${state.currentUser.id}`);
                    if (localData) {
                        const prefs = JSON.parse(localData);
                        state.userPreferences = prefs;
                        return prefs;
                    }
                    return null;
                }
                throw error;
            }

            if (data && data.settings) {
                state.userPreferences = data.settings;
                return data.settings;
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            const localData = localStorage.getItem(`mip_prefs_${state.currentUser.id}`);
            if (localData) {
                const prefs = JSON.parse(localData);
                state.userPreferences = prefs;
                return prefs;
            }
        }
        return null;
    },

    async saveDefaults(defaults) {
        if (!state.currentUser) return false;

        const defaultSettings = {
            defaultMeetingType: defaults.defaultMeetingType || '',
            defaultMethodology: defaults.defaultMethodology || '',
            defaultIndustry: defaults.defaultIndustry || '',
            lastUpdated: new Date().toISOString()
        };

        try {
            const { data, error } = await supabaseClient
                .from('user_preferences')
                .upsert({
                    user_id: state.currentUser.id,
                    preference_type: this.PREFERENCE_TYPE_DEFAULTS,
                    settings: defaultSettings,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,preference_type'
                });

            if (error) throw error;

            state.defaultSettings = defaultSettings;
            return true;
        } catch (error) {
            console.error('Error saving defaults:', error);
            try {
                localStorage.setItem(`mip_defaults_${state.currentUser.id}`, JSON.stringify(defaultSettings));
                state.defaultSettings = defaultSettings;
                return true;
            } catch (localError) {
                console.error('localStorage fallback failed:', localError);
                return false;
            }
        }
    },

    async loadDefaults() {
        if (!state.currentUser) return null;

        try {
            const { data, error } = await supabaseClient
                .from('user_preferences')
                .select('settings')
                .eq('user_id', state.currentUser.id)
                .eq('preference_type', this.PREFERENCE_TYPE_DEFAULTS)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    const localData = localStorage.getItem(`mip_defaults_${state.currentUser.id}`);
                    if (localData) {
                        const defaults = JSON.parse(localData);
                        state.defaultSettings = defaults;
                        return defaults;
                    }
                    return null;
                }
                throw error;
            }

            if (data && data.settings) {
                state.defaultSettings = data.settings;
                return data.settings;
            }
        } catch (error) {
            console.error('Error loading defaults:', error);
            const localData = localStorage.getItem(`mip_defaults_${state.currentUser.id}`);
            if (localData) {
                const defaults = JSON.parse(localData);
                state.defaultSettings = defaults;
                return defaults;
            }
        }
        return null;
    },

    async deleteDefaults() {
        if (!state.currentUser) return;

        try {
            const { error } = await supabaseClient
                .from('user_preferences')
                .delete()
                .eq('user_id', state.currentUser.id)
                .eq('preference_type', this.PREFERENCE_TYPE_DEFAULTS);

            if (error) throw error;

            state.defaultSettings = {
                defaultMeetingType: '',
                defaultMethodology: '',
                defaultIndustry: ''
            };
            
            localStorage.removeItem(`mip_defaults_${state.currentUser.id}`);
        } catch (error) {
            console.error('Error deleting defaults:', error);
        }
    },

    applySelectValues(prefs) {
        if (prefs.selectedReportOption) {
            this.applySelectedReportOption(prefs.selectedReportOption);
        }
        if (prefs.selectedMeetingType) {
            elements.meetingTypeSelect.value = prefs.selectedMeetingType;
        }
        if (prefs.selectedMethodology) {
            elements.methodologySelect.value = prefs.selectedMethodology;
        }
        if (prefs.selectedIndustry) {
            elements.industrySelect.value = prefs.selectedIndustry;
        }
    }
};

// Admin Panel Management
const AdminPanel = {
    open() {
        elements.adminPanel.classList.add('active');
        this.loadCurrentSettings();
        this.clearPasswordFields();
    },

    close() {
        elements.adminPanel.classList.remove('active');
        this.hideSuccessMessage();
        this.clearPasswordFields();
    },

    clearPasswordFields() {
        if (elements.adminNewPassword) elements.adminNewPassword.value = '';
        if (elements.adminConfirmPassword) elements.adminConfirmPassword.value = '';
        if (elements.passwordStrengthBar) {
            elements.passwordStrengthBar.className = 'password-strength-bar';
            elements.passwordStrengthBar.style.width = '0%';
        }
        this.updatePasswordRequirements('');
    },

    checkPasswordStrength(password) {
        if (!password) return 0;
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        return Math.min(strength, 3);
    },

    updatePasswordRequirements(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password)
        };

        document.querySelectorAll('.password-requirement').forEach(req => {
            const type = req.getAttribute('data-requirement');
            const icon = req.querySelector('.password-requirement-icon');
            
            if (requirements[type]) {
                req.classList.add('met');
                icon.textContent = '✓';
            } else {
                req.classList.remove('met');
                icon.textContent = '○';
            }
        });

        return Object.values(requirements).every(v => v);
    },

    async changePassword() {
        const newPassword = elements.adminNewPassword.value;
        const confirmPassword = elements.adminConfirmPassword.value;

        if (!newPassword || !confirmPassword) {
            UI.showAuthMessage('Please fill in all password fields.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            UI.showAuthMessage('New passwords do not match.', 'error');
            return;
        }

        if (newPassword.length < 8) {
            UI.showAuthMessage('Password must be at least 8 characters long.', 'error');
            return;
        }

        if (!this.updatePasswordRequirements(newPassword)) {
            UI.showAuthMessage('Password does not meet all requirements.', 'error');
            return;
        }

        const confirmed = confirm('Are you sure you want to change your password?');
        if (!confirmed) return;

        elements.adminChangePasswordBtn.disabled = true;
        elements.adminChangePasswordBtn.textContent = 'Updating...';

        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            UI.showAuthMessage('Password updated successfully!', 'success');
            this.clearPasswordFields();
            
            setTimeout(() => {
                UI.hideAuthMessage();
            }, 3000);

        } catch (error) {
            console.error('Password change error:', error);
            UI.showAuthMessage(error.message || 'Failed to update password.', 'error');
        }

        elements.adminChangePasswordBtn.disabled = false;
        elements.adminChangePasswordBtn.textContent = 'Update Password';
    },

    async loadCurrentSettings() {
        const defaults = await UserPreferences.loadDefaults();
        this.populateDropdowns(defaults);
    },

    populateDropdowns(defaults) {
        elements.adminMeetingType.innerHTML = '<option value="">None (User will select)</option>';
        state.meetingTypes.forEach(item => {
            const option = document.createElement('option');
            option.value = item.Type;
            option.textContent = item.Type;
            if (defaults && defaults.defaultMeetingType === item.Type) {
                option.selected = true;
            }
            elements.adminMeetingType.appendChild(option);
        });

        elements.adminMethodology.innerHTML = '<option value="">None (User will select)</option>';
        state.frameworks.forEach(item => {
            const option = document.createElement('option');
            option.value = item.Method;
            option.textContent = item.Method;
            if (defaults && defaults.defaultMethodology === item.Method) {
                option.selected = true;
            }
            elements.adminMethodology.appendChild(option);
        });

        elements.adminIndustry.innerHTML = '<option value="">None (User will select)</option>';
        state.industries.forEach(item => {
            const option = document.createElement('option');
            option.value = item.Industry_Name;
            option.textContent = item.Industry_Name;
            if (defaults && defaults.defaultIndustry === item.Industry_Name) {
                option.selected = true;
            }
            elements.adminIndustry.appendChild(option);
        });
    },

    async saveDefaults() {
        const confirmed = confirm('Save these settings as your defaults?\n\nThese settings will be applied whenever you start a new session.');
        
        if (!confirmed) return;

        elements.adminSaveBtn.disabled = true;
        elements.adminSaveBtn.textContent = 'Saving...';

        const defaults = {
            defaultMeetingType: elements.adminMeetingType.value,
            defaultMethodology: elements.adminMethodology.value,
            defaultIndustry: elements.adminIndustry.value
        };

        const success = await UserPreferences.saveDefaults(defaults);
        
        elements.adminSaveBtn.disabled = false;
        elements.adminSaveBtn.textContent = 'Save Defaults';
        
        if (success) {
            await this.applyDefaultsToMain();
            this.showSuccessMessage();
        } else {
            alert('Failed to save default settings. Please try again.');
        }
    },

    async applyDefaultsToMain() {
        const defaults = state.defaultSettings;

        if (defaults.defaultMeetingType) {
            elements.meetingTypeSelect.value = defaults.defaultMeetingType;
        }
        if (defaults.defaultMethodology) {
            elements.methodologySelect.value = defaults.defaultMethodology;
        }
        if (defaults.defaultIndustry) {
            elements.industrySelect.value = defaults.defaultIndustry;
        }

        await UserPreferences.save();
    },

    async resetToSystemDefaults() {
        if (confirm('Are you sure you want to reset to system defaults? This will clear all your custom default settings.')) {
            await UserPreferences.deleteDefaults();
            
            this.populateDropdowns(null);
            
            elements.meetingTypeSelect.value = '';
            elements.methodologySelect.value = '';
            elements.industrySelect.value = '';
            
            await UserPreferences.save();
            
            this.showSuccessMessage();
        }
    },

    showSuccessMessage() {
        elements.adminSuccessMessage.classList.add('active');
    },

    hideSuccessMessage() {
        elements.adminSuccessMessage.classList.remove('active');
    },

    closeAfterSuccess() {
        this.hideSuccessMessage();
        this.close();
    }
};

// Authentication Service
const Auth = {
    async checkSession() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                state.currentUser = session.user;
                this.showApp();
                return true;
            } else {
                this.showAuth();
                return false;
            }
        } catch (error) {
            console.error('Session check error:', error);
            this.showAuth();
            return false;
        }
    },

    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            state.currentUser = data.user;
            UI.showAuthMessage('Successfully signed in!', 'success');
            
            setTimeout(() => {
                this.showApp();
            }, 1000);

            return { success: true };
        } catch (error) {
            console.error('Sign in error:', error);
            UI.showAuthMessage(error.message || 'Failed to sign in. Please check your credentials.', 'error');
            return { success: false, error };
        }
    },

    async signUp(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: CONFIG.getRedirectUrl()
                }
            });

            if (error) throw error;

            UI.showAuthMessage('Account created! Please check your email to verify your account.', 'success');
            
            setTimeout(() => {
                this.toggleAuthMode();
            }, 3000);

            return { success: true };
        } catch (error) {
            console.error('Sign up error:', error);
            UI.showAuthMessage(error.message || 'Failed to create account.', 'error');
            return { success: false, error };
        }
    },

    async signInWithMagicLink(email) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: CONFIG.getRedirectUrl()
                }
            });

            if (error) throw error;

            UI.showAuthMessage('If you have an account, a Magic link will be sent within 5 minutes. Check your email to sign in.', 'success');
            return { success: true };
        } catch (error) {
            console.error('Magic link error:', error);
            UI.showAuthMessage('If you have an account, a Magic link will be sent within 5 minutes. Check your email to sign in.', 'success');
            return { success: true };
        }
    },

    async resetPassword(email) {
        try {
            const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: CONFIG.getRedirectUrl()
            });

            if (error) throw error;

            UI.showAuthMessage('If this email is registered, a password reset email will be sent. Check your inbox or Spam folder.', 'success');
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            UI.showAuthMessage('If this email is registered, a password reset email will be sent. Check your inbox or Spam folder.', 'success');
            return { success: true };
        }
    },

    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            state.currentUser = null;
            this.showAuth();
            FileHandler.removeFile();
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Failed to sign out. Please try again.');
        }
    },

    showAuth() {
        elements.authContainer.classList.add('active');
        elements.appContainer.classList.remove('active');
    },

    showApp() {
        elements.authContainer.classList.remove('active');
        elements.appContainer.classList.add('active');
        elements.userEmail.textContent = state.currentUser?.email || '';
        DataLoader.loadAll();
    },

    toggleAuthMode() {
        state.isLoginMode = !state.isLoginMode;
        state.isMagicLinkMode = false;
        state.isForgotPasswordMode = false;
        
        if (state.isLoginMode) {
            elements.authTitle.textContent = 'Welcome Back';
            elements.authSubtitle.textContent = 'Sign in to access your meeting intelligence platform';
            elements.authSubmitBtn.textContent = 'Sign In';
            elements.authToggleText.textContent = "Don't have an account?";
            elements.authToggleLink.textContent = 'Sign Up';
            elements.passwordGroup.style.display = 'flex';
            elements.passwordInput.required = true;
            elements.magicLinkToggle.style.display = 'flex';
            elements.forgotPasswordLink.parentElement.style.display = 'block';
            elements.authBackLink.style.display = 'none';
        } else {
            elements.authTitle.textContent = 'Create Account';
            elements.authSubtitle.textContent = 'Sign up to start using the meeting intelligence platform';
            elements.authSubmitBtn.textContent = 'Sign Up';
            elements.authToggleText.textContent = 'Already have an account?';
            elements.authToggleLink.textContent = 'Sign In';
            elements.passwordGroup.style.display = 'flex';
            elements.passwordInput.required = true;
            elements.magicLinkToggle.style.display = 'flex';
            elements.forgotPasswordLink.parentElement.style.display = 'none';
            elements.authBackLink.style.display = 'none';
        }
        
        UI.hideAuthMessage();
        elements.authForm.reset();
    },

    toggleMagicLinkMode() {
        state.isMagicLinkMode = !state.isMagicLinkMode;
        state.isForgotPasswordMode = false;
        
        if (state.isMagicLinkMode) {
            elements.authTitle.textContent = 'Magic Link Sign In';
            elements.authSubtitle.textContent = 'Enter your email and we\'ll send you a magic link to sign in';
            elements.authSubmitBtn.textContent = 'Send Magic Link';
            elements.passwordGroup.style.display = 'none';
            elements.passwordInput.required = false;
            elements.magicLinkToggleText.textContent = 'Use Password Instead';
            elements.authToggleText.textContent = "Don't have an account?";
            elements.authToggleLink.textContent = 'Sign Up';
            elements.forgotPasswordLink.parentElement.style.display = 'none';
            elements.authBackLink.style.display = 'none';
        } else {
            if (state.isLoginMode) {
                elements.authTitle.textContent = 'Welcome Back';
                elements.authSubtitle.textContent = 'Sign in to access your meeting intelligence platform';
                elements.authSubmitBtn.textContent = 'Sign In';
                elements.forgotPasswordLink.parentElement.style.display = 'block';
            } else {
                elements.authTitle.textContent = 'Create Account';
                elements.authSubtitle.textContent = 'Sign up to start using the meeting intelligence platform';
                elements.authSubmitBtn.textContent = 'Sign Up';
            }
            elements.passwordGroup.style.display = 'flex';
            elements.passwordInput.required = true;
            elements.magicLinkToggleText.textContent = 'Sign in with Magic Link';
            elements.authBackLink.style.display = 'none';
        }
        
        UI.hideAuthMessage();
        elements.authForm.reset();
    },

    toggleForgotPasswordMode() {
        state.isForgotPasswordMode = !state.isForgotPasswordMode;
        state.isMagicLinkMode = false;
        
        if (state.isForgotPasswordMode) {
            elements.authTitle.textContent = 'Reset Password';
            elements.authSubtitle.textContent = 'Enter your email and we\'ll send you a password reset link';
            elements.authSubmitBtn.textContent = 'Send Reset Link';
            elements.passwordGroup.style.display = 'none';
            elements.passwordInput.required = false;
            elements.magicLinkToggle.style.display = 'none';
            elements.forgotPasswordLink.parentElement.style.display = 'none';
            elements.authToggleText.textContent = '';
            elements.authToggleLink.style.display = 'none';
            elements.authBackLink.style.display = 'block';
        } else {
            elements.authTitle.textContent = 'Welcome Back';
            elements.authSubtitle.textContent = 'Sign in to access your meeting intelligence platform';
            elements.authSubmitBtn.textContent = 'Sign In';
            elements.passwordGroup.style.display = 'flex';
            elements.passwordInput.required = true;
            elements.magicLinkToggle.style.display = 'flex';
            elements.forgotPasswordLink.parentElement.style.display = 'block';
            elements.authToggleText.textContent = "Don't have an account?";
            elements.authToggleLink.style.display = 'inline';
            elements.authBackLink.style.display = 'none';
        }
        
        UI.hideAuthMessage();
        elements.authForm.reset();
    }
};

// API Service
const API = {
    async fetchData(table, selectFields = '*', orderBy = null) {
        try {
            let query = supabaseClient
                .from(table)
                .select(selectFields);
            
            if (orderBy) {
                query = query.order(orderBy, { ascending: true });
            }

            const { data, error } = await query;

            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error(`Error fetching from ${table}:`, error);
            throw error;
        }
    },

    async getReportOptions() {
        return await this.fetchData('report_options_public', 'report_option');
    },

    async getReportOptionsWithPrompts() {
        return await this.fetchData('report_options_public', 'report_option,reportoptionprompt');
    },

    async getMeetingTypes() {
        return await this.fetchData('meetingtype_public', 'Type', 'Type');
    },

    async getFrameworks() {
        return await this.fetchData('framework_public', 'Method', 'Method');
    },

    async getIndustries() {
        return await this.fetchData('industry_public', 'Industry_Name', 'Industry_Name');
    },

    async getOpenAIKey() {
        try {
            const data = await this.fetchData('api_key_public', 'key');
            
            if (data && data.length > 0) {
                return data[0].key;
            }
            return null;
        } catch (error) {
            console.error('Error fetching OpenAI key:', error);
            return null;
        }
    }
};

// UI Handlers
const UI = {
    showError(element, message) {
        element.textContent = message;
        element.classList.add('active');
    },

    hideError(element) {
        element.classList.remove('active');
    },

    showAuthMessage(message, type) {
        elements.authMessage.textContent = message;
        elements.authMessage.className = `auth-message active ${type}`;
    },

    hideAuthMessage() {
        elements.authMessage.classList.remove('active');
    },

    populateSelect(selectElement, data, textField, defaultText) {
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[textField];
            option.textContent = item[textField];
            selectElement.appendChild(option);
        });
    },

    renderReportOptions(data) {
        elements.reportOptionsContainer.innerHTML = '';
        data.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="radio" name="reportOption" id="option${index}" class="report-option-radio" value="${item.report_option || item.Report_Option}" ${index === 0 ? 'checked' : ''}>
                <label for="option${index}">${item.report_option || item.Report_Option}</label>
            `;
            elements.reportOptionsContainer.appendChild(div);
        });
        this.setupRadioListeners();
    },

    setupRadioListeners() {
        const radios = document.querySelectorAll('.report-option-radio');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                UI.updateAIPrompt();
                UserPreferences.save();
            });
        });
    },

    showFileInfo(file) {
        elements.fileName.textContent = file.name;
        elements.fileSize.textContent = Utils.formatFileSize(file.size);
        elements.fileInfo.classList.add('active');
        elements.uploadArea.classList.add('hidden');
    },

    hideFileInfo() {
        elements.fileInfo.classList.remove('active');
        elements.uploadArea.classList.remove('hidden');
        elements.fileName.textContent = '';
        elements.fileSize.textContent = '';
    },

    updateRunButton() {
        elements.runBtn.disabled = !state.currentFile;
    },

    updateGenerateReportButton() {
        // Only enable Generate Report if there's a file AND AI results
        const hasFile = state.currentFile !== null;
        const hasResults = state.aiResults && state.aiResults.length > 0;
        elements.runBtn.disabled = !(hasFile && hasResults);
    },

    updateAIButton() {
        // Only enable Run AI Analysis if there's a file
        elements.runAIBtn.disabled = !state.currentFile;
    },

    updateAIPrompt() {
        const checkedOptions = Utils.getSelectedOptions();
        
        if (checkedOptions.length === 0) {
            elements.aiPromptDisplay.innerHTML = `
                <div class="ai-prompt-empty">
                    Select report options above to see the AI prompt
                </div>
            `;
            elements.copyPromptBtn.style.display = 'none';
            return;
        }

        let promptHTML = '';
        let fullPromptText = '';

        checkedOptions.forEach((optionName, index) => {
            const optionData = state.reportOptionsWithPrompts.find(opt => {
                const dbOptionName = (opt.report_option || opt.Report_Option || '').trim();
                const searchName = optionName.trim();
                return dbOptionName === searchName;
            });

            if (optionData) {
                const prompt = optionData.reportoptionprompt || optionData.ReportOptionPrompt || '';
                
                if (prompt) {
                    promptHTML += `
                        <div class="ai-prompt-section">
                            <div class="ai-prompt-label">${index + 1}. ${optionName}</div>
                            <div class="ai-prompt-text">${prompt}</div>
                        </div>
                    `;
                    fullPromptText += `${index + 1}. ${optionName}\n${prompt}\n\n`;
                }
            }
        });

        if (promptHTML) {
            elements.aiPromptDisplay.innerHTML = promptHTML;
            elements.copyPromptBtn.style.display = 'inline-flex';
            elements.copyPromptBtn.dataset.promptText = fullPromptText;
            
            // Show Step 1 container
            const step1Container = document.getElementById('step1Container');
            if (step1Container) {
                step1Container.style.display = 'block';
            }
        } else {
            elements.aiPromptDisplay.innerHTML = `
                <div class="ai-prompt-empty">
                    No prompts available for selected options
                </div>
            `;
            elements.copyPromptBtn.style.display = 'none';
            
            // Hide Step 1 container
            const step1Container = document.getElementById('step1Container');
            if (step1Container) {
                step1Container.style.display = 'none';
            }
        }
    }
};

// Utility Functions
const Utils = {
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    validateFile(file) {
        const validExtensions = ['.pdf', '.txt', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            return { valid: false, error: 'Invalid file type. Please upload PDF, TXT, or DOCX files only.' };
        }
        
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            return { valid: false, error: 'File size exceeds 1GB limit.' };
        }
        
        return { valid: true };
    },

    getSelectedOptions() {
        const selectedRadio = document.querySelector('.report-option-radio:checked');
        if (selectedRadio) {
            return [selectedRadio.value];
        }
        return [];
    },

    getSelectValue(selectElement) {
        const index = selectElement.selectedIndex;
        return index > 0 ? selectElement.options[index].text : 'Not selected';
    }
};

// File Handler
const FileHandler = {
    handleFile(file) {
        const validation = Utils.validateFile(file);
        
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        state.currentFile = file;
        UI.showFileInfo(file);
        UI.updateGenerateReportButton();
        UI.updateAIButton();
    },

    removeFile() {
        state.currentFile = null;
        elements.fileInput.value = '';
        UI.hideFileInfo();
        UI.updateGenerateReportButton();
        UI.updateAIButton();
    }
};

// Report Generator
const ReportGenerator = {
    generate() {
        if (!state.currentFile) {
            alert('Please upload a file first!');
            return;
        }

        const selectedOptions = Utils.getSelectedOptions();
        const meetingType = Utils.getSelectValue(elements.meetingTypeSelect);
        const methodology = Utils.getSelectValue(elements.methodologySelect);
        const industry = Utils.getSelectValue(elements.industrySelect);

        this.generatePDF(meetingType, methodology, industry, selectedOptions, state.currentFile.name);
    },

    generatePDF(meetingType, methodology, industry, sections, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let y = 20;
        
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('Meeting Intelligence Report', 105, y, { align: 'center' });
        
        y += 15;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }), 105, y, { align: 'center' });
        
        y += 8;
        doc.text(`Generated by: ${state.currentUser?.email || 'Unknown'}`, 105, y, { align: 'center' });
        
        y += 15;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Meeting Configuration', 20, y);
        y += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        const config = [
            { label: 'Meeting Type:', value: meetingType },
            { label: 'Methodology & Framework:', value: methodology },
            { label: 'Industry:', value: industry },
            { label: 'Source File:', value: filename }
        ];

        config.forEach(item => {
            doc.text(item.label, 20, y);
            doc.setFont(undefined, 'bold');
            doc.text(item.value, 75, y);
            doc.setFont(undefined, 'normal');
            y += 8;
        });
        
        y += 7;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Report Sections Included', 20, y);
        y += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        sections.forEach((section, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(`${index + 1}. ${section}`, 25, y);
            y += 7;
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text('Light Skai Meeting Intelligence Platform', 105, 285, { align: 'center' });
            doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }
        
        doc.save(`Meeting_Report_${Date.now()}.pdf`);
    }
};

// Drag and Drop
const DragDrop = {
    draggedElement: null,
    
    init() {
        const items = elements.reportOptionsContainer.querySelectorAll('.checkbox-item');
        items.forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
            item.addEventListener('dragover', this.handleDragOver.bind(this));
            item.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    },

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';

        const afterElement = this.getDragAfterElement(elements.reportOptionsContainer, e.clientY);
        const draggable = this.draggedElement;

        if (afterElement == null) {
            elements.reportOptionsContainer.appendChild(draggable);
        } else {
            elements.reportOptionsContainer.insertBefore(draggable, afterElement);
        }

        return false;
    },

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        return false;
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.checkbox-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
};

// Radio Button Management
const CheckboxManager = {
    init() {
        // No select all needed for radio buttons
    },

    setupCheckboxListeners() {
        // Handled in UI.renderReportOptions
    }
};

// Event Listeners
const EventListeners = {
    init() {
        elements.authForm.addEventListener('submit', this.handleAuthSubmit.bind(this));
        elements.authToggleLink.addEventListener('click', () => Auth.toggleAuthMode());
        elements.magicLinkToggle.addEventListener('click', () => Auth.toggleMagicLinkMode());
        elements.forgotPasswordLink.addEventListener('click', () => Auth.toggleForgotPasswordMode());
        elements.authBackLink.addEventListener('click', () => Auth.toggleForgotPasswordMode());
        elements.logoutBtn.addEventListener('click', () => Auth.signOut());
        
        elements.settingsBtn.addEventListener('click', () => AdminPanel.open());
        elements.adminClose.addEventListener('click', () => AdminPanel.close());
        elements.adminCancelBtn.addEventListener('click', () => AdminPanel.close());
        elements.adminSaveBtn.addEventListener('click', () => AdminPanel.saveDefaults());
        elements.adminResetBtn.addEventListener('click', () => AdminPanel.resetToSystemDefaults());
        elements.adminSuccessCloseBtn.addEventListener('click', () => AdminPanel.closeAfterSuccess());
        
        if (elements.adminChangePasswordBtn) {
            elements.adminChangePasswordBtn.addEventListener('click', () => AdminPanel.changePassword());
        }
        
        if (elements.adminNewPassword) {
            elements.adminNewPassword.addEventListener('input', (e) => {
                const strength = AdminPanel.checkPasswordStrength(e.target.value);
                const bar = elements.passwordStrengthBar;
                
                bar.className = 'password-strength-bar';
                if (strength === 1) {
                    bar.classList.add('password-strength-weak');
                } else if (strength === 2) {
                    bar.classList.add('password-strength-medium');
                } else if (strength >= 3) {
                    bar.classList.add('password-strength-strong');
                }
                
                AdminPanel.updatePasswordRequirements(e.target.value);
            });
        }
        
        elements.adminPanel.addEventListener('click', (e) => {
            if (e.target === elements.adminPanel) {
                AdminPanel.close();
            }
        });
        
        elements.uploadArea.addEventListener('dragover', this.handleDragOver);
        elements.uploadArea.addEventListener('dragleave', this.handleDragLeave);
        elements.uploadArea.addEventListener('drop', this.handleDrop);
        elements.fileInput.addEventListener('change', this.handleFileSelect);
        elements.removeFile.addEventListener('click', () => FileHandler.removeFile());
        
        elements.runBtn.addEventListener('click', () => ReportGenerator.generate());

        if (elements.copyPromptBtn) {
            elements.copyPromptBtn.addEventListener('click', async () => {
                const promptText = elements.copyPromptBtn.dataset.promptText;
                if (promptText) {
                    try {
                        await navigator.clipboard.writeText(promptText);
                        const originalText = elements.copyPromptBtn.innerHTML;
                        elements.copyPromptBtn.innerHTML = '✓ Copied!';
                        elements.copyPromptBtn.classList.add('copied');
                        
                        setTimeout(() => {
                            elements.copyPromptBtn.innerHTML = originalText;
                            elements.copyPromptBtn.classList.remove('copied');
                        }, 2000);
                    } catch (err) {
                        alert('Failed to copy to clipboard');
                    }
                }
            });
        }

        if (elements.runAIBtn) {
            elements.runAIBtn.addEventListener('click', async () => {
                const promptText = elements.copyPromptBtn.dataset.promptText;
                if (!promptText) {
                    alert('No prompt available. Please select a report option.');
                    return;
                }
                
                if (!state.currentFile) {
                    alert('Please upload a file first.');
                    return;
                }
                
                elements.runAIBtn.disabled = true;
                
                // Status messages to cycle through
                const statusMessages = [
                    '⏳ Initializing...',
                    '📄 Reading document...',
                    '🔍 Extracting text...',
                    '🤖 Analyzing with AI...',
                    '💭 Processing insights...',
                    '✨ Finalizing results...'
                ];
                
                let messageIndex = 0;
                
                // Function to update button with spinner and message
                const updateButtonStatus = (message) => {
                    elements.runAIBtn.innerHTML = `
                        <span class="spinner-container">
                            <span class="ai-spinner"></span>
                        </span>
                        <span>${message}</span>
                    `;
                };
                
                // Start with first message
                updateButtonStatus(statusMessages[messageIndex]);
                
                // Rotate through status messages every 3 seconds
                const statusInterval = setInterval(() => {
                    messageIndex = (messageIndex + 1) % statusMessages.length;
                    updateButtonStatus(statusMessages[messageIndex]);
                }, 3000);
                
                // Show loading state in results
                elements.aiResultsDisplay.innerHTML = `
                    <div class="ai-results-loading">
                        <div class="ai-results-spinner"></div>
                        <div>Reading document and analyzing with AI...</div>
                        <div style="margin-top: 12px; font-size: 13px; color: #64748b;">This may take 30-60 seconds depending on file size</div>
                    </div>
                `;
                
                try {
                    // Step 1: Extract text from the uploaded file
                    updateButtonStatus('📄 Reading document...');
                    const fileText = await this.extractTextFromFile(state.currentFile);
                    
                    if (!fileText || fileText.trim().length === 0) {
                        throw new Error('Could not extract text from the file. Please ensure the file contains readable text.');
                    }
                    
                    // Step 2: Get OpenAI API key
                    updateButtonStatus('🔑 Connecting to AI...');
                    if (!state.openAIKey) {
                        state.openAIKey = await API.getOpenAIKey();
                        if (!state.openAIKey) {
                            throw new Error('OpenAI API key not configured. Please contact support.');
                        }
                    }
                    
                    // Step 3: Call OpenAI API with the document text and prompt
                    updateButtonStatus('🤖 AI is analyzing...');
                    elements.aiResultsDisplay.innerHTML = `
                        <div class="ai-results-loading">
                            <div class="ai-results-spinner"></div>
                            <div><strong>AI Analysis in Progress</strong></div>
                            <div style="margin-top: 12px; font-size: 13px; color: #64748b;">
                                Processing your document with advanced AI...<br>
                                Document length: ${Math.round(fileText.length / 1000)}K characters
                            </div>
                        </div>
                    `;
                    
                    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${state.openAIKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are an expert meeting analyst. Analyze the provided meeting transcript or notes and provide detailed insights based on the specific requirements given.'
                                },
                                {
                                    role: 'user',
                                    content: `${promptText}\n\n=== DOCUMENT CONTENT ===\n\n${fileText}`
                                }
                            ],
                            temperature: 0.7,
                            max_tokens: 4000
                        })
                    });
                    
                    if (!aiResponse.ok) {
                        const errorData = await aiResponse.json();
                        console.error('OpenAI API error:', errorData);
                        throw new Error(errorData.error?.message || `API request failed with status ${aiResponse.status}`);
                    }
                    
                    updateButtonStatus('✨ Finalizing results...');
                    const data = await aiResponse.json();
                    
                    if (!data.choices || data.choices.length === 0) {
                        throw new Error('No response received from AI. Please try again.');
                    }
                    
                    const result = data.choices[0].message.content;
                    
                    // Clear the interval
                    clearInterval(statusInterval);
                    
                    // Step 4: Display results
                    state.aiResults = result;
                    elements.aiResultsDisplay.innerHTML = result;
                    elements.copyResultsBtn.style.display = 'inline-flex';
                    elements.copyResultsBtn.dataset.resultsText = result;
                    
                    // Enable Generate Report button
                    UI.updateGenerateReportButton();
                    
                    // Success feedback
                    const successMsg = document.createElement('div');
                    successMsg.className = 'ai-success-badge';
                    successMsg.textContent = '✓ Analysis Complete';
                    successMsg.style.cssText = 'background: #d1fae5; color: #059669; padding: 8px 16px; border-radius: 6px; margin-bottom: 12px; font-weight: 600; text-align: center;';
                    elements.aiResultsDisplay.insertBefore(successMsg, elements.aiResultsDisplay.firstChild);
                    
                    // Show success state in button
                    elements.runAIBtn.innerHTML = '✓ Analysis Complete';
                    setTimeout(() => {
                        elements.runAIBtn.innerHTML = '🤖 Run AI Analysis';
                    }, 2000);
                    
                } catch (error) {
                    console.error('AI Analysis error:', error);
                    
                    // Clear the interval
                    clearInterval(statusInterval);
                    
                    elements.aiResultsDisplay.innerHTML = `
                        <div class="ai-results-error">
                            <strong>❌ Analysis Failed</strong><br><br>
                            ${error.message}<br><br>
                            <small>Please try again or contact support if the issue persists.</small>
                        </div>
                    `;
                    
                    elements.copyResultsBtn.style.display = 'none';
                    elements.runAIBtn.innerHTML = '🤖 Run AI Analysis';
                } finally {
                    elements.runAIBtn.disabled = false;
                }
            });
        }

        // Helper function to extract text from uploaded files
        this.extractTextFromFile = async function(file) {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();
            
            // Handle plain text files
            if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                return await file.text();
            }
            
            // Handle PDF files
            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                try {
                    // Use PDF.js library if available
                    if (window.pdfjsLib) {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        let fullText = '';
                        
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            fullText += pageText + '\n\n';
                        }
                        
                        return fullText;
                    } else {
                        throw new Error('PDF processing library not loaded. Please refresh the page and try again.');
                    }
                } catch (error) {
                    throw new Error(`Failed to extract text from PDF: ${error.message}`);
                }
            }
            
            // Handle DOCX files
            if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
                try {
                    // Use mammoth.js if available
                    if (window.mammoth) {
                        const arrayBuffer = await file.arrayBuffer();
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        return result.value;
                    } else {
                        throw new Error('DOCX processing library not loaded. Please refresh the page and try again.');
                    }
                } catch (error) {
                    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
                }
            }
            
            throw new Error(`Unsupported file type: ${fileType || 'unknown'}. Please upload a TXT, PDF, or DOCX file.`);
        };

        if (elements.copyResultsBtn) {
            elements.copyResultsBtn.addEventListener('click', async () => {
                const resultsText = elements.copyResultsBtn.dataset.resultsText;
                if (resultsText) {
                    try {
                        await navigator.clipboard.writeText(resultsText);
                        const originalText = elements.copyResultsBtn.innerHTML;
                        elements.copyResultsBtn.innerHTML = '✓ Copied!';
                        elements.copyResultsBtn.classList.add('copied');
                        
                        setTimeout(() => {
                            elements.copyResultsBtn.innerHTML = originalText;
                            elements.copyResultsBtn.classList.remove('copied');
                        }, 2000);
                    } catch (err) {
                        alert('Failed to copy to clipboard');
                    }
                }
            });
        }

        CheckboxManager.init();

        this.setupPreferenceSaving();

        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                state.currentUser = session.user;
                Auth.showApp();
            } else if (event === 'SIGNED_OUT') {
                state.currentUser = null;
                Auth.showAuth();
            }
        });
    },

    setupPreferenceSaving() {
        elements.reportOptionsContainer.addEventListener('change', () => {
            UserPreferences.save();
        });

        elements.meetingTypeSelect.addEventListener('change', () => {
            UserPreferences.save();
        });
        elements.methodologySelect.addEventListener('change', () => {
            UserPreferences.save();
        });
        elements.industrySelect.addEventListener('change', () => {
            UserPreferences.save();
        });

        let dragSaveTimeout;
        elements.reportOptionsContainer.addEventListener('dragend', () => {
            clearTimeout(dragSaveTimeout);
            dragSaveTimeout = setTimeout(() => {
                UserPreferences.save();
            }, 500);
        });
    },

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = elements.emailInput.value;
        const password = elements.passwordInput.value;

        elements.authSubmitBtn.disabled = true;
        UI.hideAuthMessage();

        if (state.isForgotPasswordMode) {
            elements.authSubmitBtn.textContent = 'Sending...';
            await Auth.resetPassword(email);
            elements.authSubmitBtn.textContent = 'Send Reset Link';
        } else if (state.isMagicLinkMode) {
            elements.authSubmitBtn.textContent = 'Sending...';
            await Auth.signInWithMagicLink(email);
            elements.authSubmitBtn.textContent = 'Send Magic Link';
        } else if (state.isLoginMode) {
            elements.authSubmitBtn.textContent = 'Signing in...';
            await Auth.signIn(email, password);
            elements.authSubmitBtn.textContent = 'Sign In';
        } else {
            elements.authSubmitBtn.textContent = 'Creating account...';
            await Auth.signUp(email, password);
            elements.authSubmitBtn.textContent = 'Sign Up';
        }

        elements.authSubmitBtn.disabled = false;
    },

    handleDragOver(e) {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    },

    handleDragLeave() {
        elements.uploadArea.classList.remove('dragover');
    },

    handleDrop(e) {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            FileHandler.handleFile(e.dataTransfer.files[0]);
        }
    },

    handleFileSelect(e) {
        if (e.target.files.length > 0) {
            FileHandler.handleFile(e.target.files[0]);
        }
    }
};

// Data Loader
const DataLoader = {
    async loadAll() {
        const defaults = await UserPreferences.loadDefaults();
        const prefs = await UserPreferences.load();
        
        await Promise.all([
            this.loadReportOptions(),
            this.loadReportOptionsWithPrompts(),
            this.loadMeetingTypes(),
            this.loadFrameworks(),
            this.loadIndustries()
        ]);

        const settingsToApply = prefs || defaults;
        
        if (settingsToApply) {
            if (prefs && prefs.selectedReportOption) {
                UserPreferences.applySelectedReportOption(prefs.selectedReportOption);
            }
            
            if (prefs) {
                UserPreferences.applySelectValues(prefs);
            } else if (defaults) {
                const defaultSelectValues = {
                    selectedMeetingType: defaults.defaultMeetingType || '',
                    selectedMethodology: defaults.defaultMethodology || '',
                    selectedIndustry: defaults.defaultIndustry || ''
                };
                UserPreferences.applySelectValues(defaultSelectValues);
            }
        } else {
            // First time - select first option by default
            const firstRadio = document.querySelector('.report-option-radio');
            if (firstRadio) firstRadio.checked = true;
        }

        UI.updateAIPrompt();
    },

    async loadReportOptions() {
        try {
            const data = await API.getReportOptions();
            
            if (!data || data.length === 0) {
                elements.reportOptionsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">No report options available</div>';
                return;
            }
            
            state.reportOptions = data;
            UI.renderReportOptions(data);
            UI.hideError(elements.optionsError);
        } catch (error) {
            console.error('Error loading report options:', error);
            elements.reportOptionsContainer.innerHTML = '';
            UI.showError(elements.optionsError, 'Failed to load report options. Please refresh the page.');
        }
    },

    async loadReportOptionsWithPrompts() {
        try {
            const data = await API.getReportOptionsWithPrompts();
            state.reportOptionsWithPrompts = data || [];
        } catch (error) {
            console.error('Error loading report options with prompts:', error);
            state.reportOptionsWithPrompts = [];
        }
    },

    async loadMeetingTypes() {
        try {
            const data = await API.getMeetingTypes();
            state.meetingTypes = data;
            UI.populateSelect(elements.meetingTypeSelect, data, 'Type', 'Select Meeting Type');
        } catch (error) {
            elements.meetingTypeSelect.innerHTML = '<option value="">Error loading</option>';
            UI.showError(elements.selectorsError, 'Failed to load meeting types.');
        }
    },

    async loadFrameworks() {
        try {
            const data = await API.getFrameworks();
            state.frameworks = data;
            UI.populateSelect(elements.methodologySelect, data, 'Method', 'Select Methodology');
        } catch (error) {
            elements.methodologySelect.innerHTML = '<option value="">Error loading</option>';
        }
    },

    async loadIndustries() {
        try {
            const data = await API.getIndustries();
            state.industries = data;
            UI.populateSelect(elements.industrySelect, data, 'Industry_Name', 'Select Industry');
        } catch (error) {
            elements.industrySelect.innerHTML = '<option value="">Error loading</option>';
        }
    }
};

// Theme Management
const ThemeManager = {
    init() {
        // Load saved theme or default to light
        this.loadTheme();
        
        // Set up theme selector
        const savedTheme = localStorage.getItem('lightskai-theme') || 'light';
        if (elements.themeSelect) {
            elements.themeSelect.value = savedTheme;
        }
        
        // Apply theme button event
        if (elements.applyThemeBtn) {
            elements.applyThemeBtn.addEventListener('click', () => {
                this.applySelectedTheme();
            });
        }
        
        // Auto-detect system theme changes if auto is selected
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (elements.themeSelect && elements.themeSelect.value === 'auto') {
                this.applyTheme('auto');
            }
        });
    },
    
    applySelectedTheme() {
        const selectedTheme = elements.themeSelect.value;
        this.applyTheme(selectedTheme);
        this.saveTheme(selectedTheme);
        
        // Show success message briefly
        const originalText = elements.applyThemeBtn.textContent;
        elements.applyThemeBtn.textContent = 'Applied!';
        elements.applyThemeBtn.disabled = true;
        
        setTimeout(() => {
            elements.applyThemeBtn.textContent = originalText;
            elements.applyThemeBtn.disabled = false;
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
