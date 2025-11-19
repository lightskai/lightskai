// auth.js - Authentication Module
// This file requires: supabaseClient, state, elements, CONFIG, UI, DataLoader, FileHandler

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
            FileHandler.removeFile();
            
            // Redirect to login page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Failed to sign out. Please try again.');
        }
    },

    showAuth() {
        if (elements.authContainer) {
            elements.authContainer.classList.add('active');
        }
        if (elements.appContainer) {
            elements.appContainer.classList.remove('active');
        }
    },

    showApp() {
        if (elements.authContainer) {
            elements.authContainer.classList.remove('active');
        }
        if (elements.appContainer) {
            elements.appContainer.classList.add('active');
        }
        if (elements.userEmail && state.currentUser) {
            elements.userEmail.textContent = state.currentUser.email || '';
        }
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
