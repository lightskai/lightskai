import { CONFIG } from './config.js';
import { UI } from './ui-manager.js';

// Authentication logic and user management
export const Auth = {
    async checkSession() {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            
            if (session && session.user) {
                window.appState.currentUser = session.user;
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
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            window.appState.currentUser = data.user;
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
            const { data, error } = await window.supabaseClient.auth.signUp({
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
            const { data, error } = await window.supabaseClient.auth.signInWithOtp({
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
            const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
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

    async updatePassword(newPassword) {
        try {
            const { error } = await window.supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            UI.showAuthMessage('Password updated successfully!', 'success');
            return { success: true };
        } catch (error) {
            console.error('Password update error:', error);
            UI.showAuthMessage(error.message || 'Failed to update password.', 'error');
            return { success: false, error };
        }
    },

    async signOut() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;

            window.appState.currentUser = null;
            this.showAuth();
            
            // Clear file if FileHandler is available
            if (window.FileHandler) {
                window.FileHandler.removeFile();
            }
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Failed to sign out. Please try again.');
        }
    },

    showAuth() {
        const authContainer = document.getElementById('authContainer');
        const appContainer = document.getElementById('appContainer');
        
        if (authContainer) authContainer.classList.add('active');
        if (appContainer) appContainer.classList.remove('active');
    },

    showApp() {
        const authContainer = document.getElementById('authContainer');
        const appContainer = document.getElementById('appContainer');
        const userEmail = document.getElementById('userEmail');
        
        if (authContainer) authContainer.classList.remove('active');
        if (appContainer) appContainer.classList.add('active');
        if (userEmail) userEmail.textContent = window.appState.currentUser?.email || '';
        
        // Load data if DataLoader is available
        if (window.DataLoader) {
            window.DataLoader.loadAll();
        }
    },

    toggleAuthMode() {
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const authToggleText = document.getElementById('authToggleText');
        const authToggleLink = document.getElementById('authToggleLink');
        const passwordGroup = document.getElementById('passwordGroup');
        const passwordInput = document.getElementById('passwordInput');
        const magicLinkToggle = document.getElementById('magicLinkToggle');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
        
        window.appState.isLoginMode = !window.appState.isLoginMode;
        window.appState.isMagicLinkMode = false;
        window.appState.isForgotPasswordMode = false;
        
        if (window.appState.isLoginMode) {
            if (authTitle) authTitle.textContent = 'Welcome Back';
            if (authSubtitle) authSubtitle.textContent = 'Sign in to access your meeting intelligence platform';
            if (authSubmitBtn) authSubmitBtn.textContent = 'Sign In';
            if (authToggleText) authToggleText.textContent = "Don't have an account?";
            if (authToggleLink) authToggleLink.textContent = 'Sign Up';
            if (passwordGroup) passwordGroup.style.display = 'flex';
            if (passwordInput) passwordInput.required = true;
            if (magicLinkToggle) magicLinkToggle.style.display = 'flex';
            if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'block';
        } else {
            if (authTitle) authTitle.textContent = 'Create Account';
            if (authSubtitle) authSubtitle.textContent = 'Join the meeting intelligence platform';
            if (authSubmitBtn) authSubmitBtn.textContent = 'Sign Up';
            if (authToggleText) authToggleText.textContent = 'Already have an account?';
            if (authToggleLink) authToggleLink.textContent = 'Sign In';
            if (passwordGroup) passwordGroup.style.display = 'flex';
            if (passwordInput) passwordInput.required = true;
            if (magicLinkToggle) magicLinkToggle.style.display = 'none';
            if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'none';
        }
        
        UI.hideAuthMessage();
    },

    toggleMagicLinkMode() {
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const passwordGroup = document.getElementById('passwordGroup');
        const passwordInput = document.getElementById('passwordInput');
        const magicLinkToggle = document.getElementById('magicLinkToggle');
        const magicLinkToggleText = document.getElementById('magicLinkToggleText');
        const authBackLink = document.getElementById('authBackLink');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
        
        window.appState.isMagicLinkMode = !window.appState.isMagicLinkMode;
        window.appState.isForgotPasswordMode = false;
        
        if (window.appState.isMagicLinkMode) {
            if (authTitle) authTitle.textContent = 'Magic Link Sign In';
            if (authSubtitle) authSubtitle.textContent = 'Enter your email to receive a magic sign-in link';
            if (authSubmitBtn) authSubmitBtn.textContent = 'Send Magic Link';
            if (passwordGroup) passwordGroup.style.display = 'none';
            if (passwordInput) passwordInput.required = false;
            if (magicLinkToggle) magicLinkToggle.style.display = 'none';
            if (authBackLink) authBackLink.style.display = 'block';
            if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'none';
        } else {
            this.toggleAuthMode(); // Reset to normal mode
        }
        
        UI.hideAuthMessage();
    },

    toggleForgotPasswordMode() {
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const passwordGroup = document.getElementById('passwordGroup');
        const passwordInput = document.getElementById('passwordInput');
        const magicLinkToggle = document.getElementById('magicLinkToggle');
        const authBackLink = document.getElementById('authBackLink');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
        
        window.appState.isForgotPasswordMode = !window.appState.isForgotPasswordMode;
        window.appState.isMagicLinkMode = false;
        
        if (window.appState.isForgotPasswordMode) {
            if (authTitle) authTitle.textContent = 'Reset Password';
            if (authSubtitle) authSubtitle.textContent = 'Enter your email to receive password reset instructions';
            if (authSubmitBtn) authSubmitBtn.textContent = 'Reset Password';
            if (passwordGroup) passwordGroup.style.display = 'none';
            if (passwordInput) passwordInput.required = false;
            if (magicLinkToggle) magicLinkToggle.style.display = 'none';
            if (authBackLink) authBackLink.style.display = 'block';
            if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'none';
        } else {
            this.toggleAuthMode(); // Reset to normal mode
        }
        
        UI.hideAuthMessage();
    }
};