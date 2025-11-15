import { UI } from './ui-manager.js';

// Data fetching from Supabase and API management
export const DataLoader = {
    async loadAll() {
        await Promise.all([
            this.loadReportOptions(),
            this.loadReportOptionsWithPrompts(),
            this.loadMeetingTypes(),
            this.loadFrameworks(),
            this.loadIndustries()
        ]);
    },

    async loadReportOptions() {
        try {
            const data = await window.API.getReportOptions();
            
            if (!data || data.length === 0) {
                const reportOptionsContainer = document.getElementById('reportOptionsContainer');
                if (reportOptionsContainer) {
                    reportOptionsContainer.innerHTML = '<p>No report options available. Please try refreshing the page.</p>';
                }
                return;
            }
            
            window.appState.reportOptions = data;
            UI.renderReportOptions(data);
            
            const optionsError = document.getElementById('optionsError');
            if (optionsError) {
                UI.hideError(optionsError);
            }
        } catch (error) {
            console.error('Error loading report options:', error);
            const reportOptionsContainer = document.getElementById('reportOptionsContainer');
            const optionsError = document.getElementById('optionsError');
            
            if (reportOptionsContainer) {
                reportOptionsContainer.innerHTML = '';
            }
            if (optionsError) {
                UI.showError(optionsError, 'Failed to load report options. Please refresh the page.');
            }
        }
    },

    async loadReportOptionsWithPrompts() {
        try {
            const data = await window.API.getReportOptionsWithPrompts();
            window.appState.reportOptionsWithPrompts = data || [];
        } catch (error) {
            console.error('Error loading report options with prompts:', error);
            window.appState.reportOptionsWithPrompts = [];
        }
    },

    async loadMeetingTypes() {
        try {
            const data = await window.API.getMeetingTypes();
            window.appState.meetingTypes = data;
            
            const meetingTypeSelect = document.getElementById('meetingTypeSelect');
            if (meetingTypeSelect) {
                UI.populateSelect(meetingTypeSelect, data, 'Type', 'Select Meeting Type');
            }
        } catch (error) {
            console.error('Error loading meeting types:', error);
            const meetingTypeSelect = document.getElementById('meetingTypeSelect');
            const selectorsError = document.getElementById('selectorsError');
            
            if (meetingTypeSelect) {
                meetingTypeSelect.innerHTML = '<option value="">Error loading</option>';
            }
            if (selectorsError) {
                UI.showError(selectorsError, 'Failed to load meeting types.');
            }
        }
    },

    async loadFrameworks() {
        try {
            const data = await window.API.getFrameworks();
            window.appState.frameworks = data;
            
            const methodologySelect = document.getElementById('methodologySelect');
            if (methodologySelect) {
                UI.populateSelect(methodologySelect, data, 'Method', 'Select Methodology');
            }
        } catch (error) {
            console.error('Error loading frameworks:', error);
            const methodologySelect = document.getElementById('methodologySelect');
            
            if (methodologySelect) {
                methodologySelect.innerHTML = '<option value="">Error loading</option>';
            }
        }
    },

    async loadIndustries() {
        try {
            const data = await window.API.getIndustries();
            window.appState.industries = data;
            
            const industrySelect = document.getElementById('industrySelect');
            if (industrySelect) {
                UI.populateSelect(industrySelect, data, 'Industry_Name', 'Select Industry');
            }
        } catch (error) {
            console.error('Error loading industries:', error);
            const industrySelect = document.getElementById('industrySelect');
            
            if (industrySelect) {
                industrySelect.innerHTML = '<option value="">Error loading</option>';
            }
        }
    }
};

// API wrapper for Supabase calls
export const API = {
    async getReportOptions() {
        try {
            const { data, error } = await window.supabaseClient
                .from('report_options')
                .select('*')
                .order('id');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('API Error - getReportOptions:', error);
            throw error;
        }
    },

    async getReportOptionsWithPrompts() {
        try {
            const { data, error } = await window.supabaseClient
                .from('report_options_with_prompts')
                .select('*')
                .order('id');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('API Error - getReportOptionsWithPrompts:', error);
            throw error;
        }
    },

    async getMeetingTypes() {
        try {
            const { data, error } = await window.supabaseClient
                .from('meeting_types')
                .select('*')
                .order('Type');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('API Error - getMeetingTypes:', error);
            throw error;
        }
    },

    async getFrameworks() {
        try {
            const { data, error } = await window.supabaseClient
                .from('frameworks')
                .select('*')
                .order('Method');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('API Error - getFrameworks:', error);
            throw error;
        }
    },

    async getIndustries() {
        try {
            const { data, error } = await window.supabaseClient
                .from('industries')
                .select('*')
                .order('Industry_Name');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('API Error - getIndustries:', error);
            throw error;
        }
    },

    async getOpenAIKey() {
        try {
            const { data, error } = await window.supabaseClient
                .from('config')
                .select('value')
                .eq('key', 'openai_api_key')
                .single();
            
            if (error) throw error;
            return data?.value;
        } catch (error) {
            console.error('API Error - getOpenAIKey:', error);
            throw error;
        }
    }
};