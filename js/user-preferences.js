// User preferences storage and management
export const UserPreferences = {
    PREFERENCE_TYPE_SESSION: 'session',
    PREFERENCE_TYPE_DEFAULTS: 'defaults',

    async save() {
        if (!window.appState.currentUser) return;

        const prefs = {
            selectedReportOption: this.getSelectedReportOption(),
            selectedMeetingType: document.getElementById('meetingTypeSelect')?.value || '',
            selectedMethodology: document.getElementById('methodologySelect')?.value || '',
            selectedIndustry: document.getElementById('industrySelect')?.value || '',
            lastUpdated: new Date().toISOString()
        };

        try {
            const { data, error } = await window.supabaseClient
                .from('user_preferences')
                .upsert({
                    user_id: window.appState.currentUser.id,
                    preference_type: this.PREFERENCE_TYPE_SESSION,
                    settings: prefs,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,preference_type'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving preferences:', error);
            localStorage.setItem(`mip_prefs_${window.appState.currentUser.id}`, JSON.stringify(prefs));
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
        if (!window.appState.currentUser) return null;

        try {
            const { data, error } = await window.supabaseClient
                .from('user_preferences')
                .select('settings')
                .eq('user_id', window.appState.currentUser.id)
                .eq('preference_type', this.PREFERENCE_TYPE_SESSION)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    const localData = localStorage.getItem(`mip_prefs_${window.appState.currentUser.id}`);
                    if (localData) {
                        const prefs = JSON.parse(localData);
                        window.appState.userPreferences = prefs;
                        return prefs;
                    }
                    return null;
                }
                throw error;
            }

            if (data && data.settings) {
                window.appState.userPreferences = data.settings;
                return data.settings;
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            const localData = localStorage.getItem(`mip_prefs_${window.appState.currentUser.id}`);
            if (localData) {
                const prefs = JSON.parse(localData);
                window.appState.userPreferences = prefs;
                return prefs;
            }
        }
        return null;
    },

    async saveDefaults(defaults) {
        if (!window.appState.currentUser) return false;

        const defaultSettings = {
            defaultMeetingType: defaults.defaultMeetingType || '',
            defaultMethodology: defaults.defaultMethodology || '',
            defaultIndustry: defaults.defaultIndustry || '',
            lastUpdated: new Date().toISOString()
        };

        try {
            const { data, error } = await window.supabaseClient
                .from('user_preferences')
                .upsert({
                    user_id: window.appState.currentUser.id,
                    preference_type: this.PREFERENCE_TYPE_DEFAULTS,
                    settings: defaultSettings,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,preference_type'
                });

            if (error) throw error;

            window.appState.defaultSettings = defaultSettings;
            return true;
        } catch (error) {
            console.error('Error saving defaults:', error);
            try {
                localStorage.setItem(`mip_defaults_${window.appState.currentUser.id}`, JSON.stringify(defaultSettings));
                window.appState.defaultSettings = defaultSettings;
                return true;
            } catch (localError) {
                console.error('localStorage fallback failed:', localError);
                return false;
            }
        }
    },

    async loadDefaults() {
        if (!window.appState.currentUser) return null;

        try {
            const { data, error } = await window.supabaseClient
                .from('user_preferences')
                .select('settings')
                .eq('user_id', window.appState.currentUser.id)
                .eq('preference_type', this.PREFERENCE_TYPE_DEFAULTS)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    const localData = localStorage.getItem(`mip_defaults_${window.appState.currentUser.id}`);
                    if (localData) {
                        const defaults = JSON.parse(localData);
                        window.appState.defaultSettings = defaults;
                        return defaults;
                    }
                    return null;
                }
                throw error;
            }

            if (data && data.settings) {
                window.appState.defaultSettings = data.settings;
                return data.settings;
            }
        } catch (error) {
            console.error('Error loading defaults:', error);
            const localData = localStorage.getItem(`mip_defaults_${window.appState.currentUser.id}`);
            if (localData) {
                const defaults = JSON.parse(localData);
                window.appState.defaultSettings = defaults;
                return defaults;
            }
        }
        return null;
    },

    applyDefaults(defaults) {
        if (!defaults) return;

        const meetingTypeSelect = document.getElementById('meetingTypeSelect');
        const methodologySelect = document.getElementById('methodologySelect');
        const industrySelect = document.getElementById('industrySelect');

        if (defaults.defaultMeetingType && meetingTypeSelect) {
            meetingTypeSelect.value = defaults.defaultMeetingType;
        }
        if (defaults.defaultMethodology && methodologySelect) {
            methodologySelect.value = defaults.defaultMethodology;
        }
        if (defaults.defaultIndustry && industrySelect) {
            industrySelect.value = defaults.defaultIndustry;
        }
    },

    async resetToSystemDefaults() {
        if (!window.appState.currentUser) return false;

        try {
            const { error } = await window.supabaseClient
                .from('user_preferences')
                .delete()
                .eq('user_id', window.appState.currentUser.id)
                .eq('preference_type', this.PREFERENCE_TYPE_DEFAULTS);

            if (error) throw error;

            // Clear local storage
            localStorage.removeItem(`mip_defaults_${window.appState.currentUser.id}`);
            window.appState.defaultSettings = null;

            // Reset form values
            const meetingTypeSelect = document.getElementById('adminMeetingType');
            const methodologySelect = document.getElementById('adminMethodology');
            const industrySelect = document.getElementById('adminIndustry');

            if (meetingTypeSelect) meetingTypeSelect.value = '';
            if (methodologySelect) methodologySelect.value = '';
            if (industrySelect) industrySelect.value = '';

            return true;
        } catch (error) {
            console.error('Error resetting defaults:', error);
            return false;
        }
    }
};