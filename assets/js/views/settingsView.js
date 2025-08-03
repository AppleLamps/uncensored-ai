import '../services/chatService.js';
import chatService from '../services/chatService.js'; // Explicitly import for usage

/**
 * Settings View for T3 Chat
 * Handles all settings functionality and tab switching
 */
class SettingsView {
    constructor() {
        // Define tabs in a configuration object
        this.tabsConfig = [
            { id: 'account', label: 'Account', default: true }
        ];


        this.initializeElements();
        this.setupEventListeners();
        this.loadSavedSettings();
        this.handleUrlHash(); // Handle URL hash for direct navigation
    }

    initializeElements() {
        this.tabGroup = document.getElementById('settings-tab-group');
        this.panels = document.querySelectorAll('.settings-panel');
        this.generateTabs(); // Generate tabs from config
        this.tabButtons = document.querySelectorAll('.tab-button'); // Query the generated buttons

        this.customizeForm = document.querySelector('.customize-form');
        this.saveButton = document.querySelector('.save-preferences-btn');
        this.themeToggle = document.querySelector('#boring-theme');
        this.hidePersonalInfo = document.querySelector('#hide-personal-info');
        this.mainFontSelect = document.querySelector('#main-font');
        this.codeFontSelect = document.querySelector('#code-font');
        this.openaiApiKeyInput = document.querySelector('#openai-api-key');
        this.saveApiKeyButton = document.querySelector('#save-api-key-btn');
        this.xaiApiKeyInput = document.querySelector('#xai-api-key');
        this.saveXaiApiKeyButton = document.querySelector('#save-xai-api-key-btn');
        this.openrouterApiKeyInput = document.querySelector('#openrouter-api-key');
        this.saveOpenRouterApiKeyButton = document.querySelector('#save-openrouter-api-key-btn');
        this.themeToggleBtn = document.querySelector('.theme-toggle');
        
        // Web search settings elements
        this.webSearchEnabledToggle = document.querySelector('#web-search-enabled');
        this.webSearchMaxResultsInput = document.querySelector('#web-search-max-results');
        this.webSearchPromptInput = document.querySelector('#web-search-prompt');
        this.webSearchOptionsSelect = document.querySelector('#web-search-options');
        this.saveWebSearchSettingsButton = document.querySelector('#save-web-search-settings-btn');
        
        // Usage Elements
        this.standardUsageLabel = document.querySelector('.usage-type:nth-child(1) .usage-label span:nth-child(2)');
        this.standardProgressBar = document.querySelector('.usage-type:nth-child(1) .progress');
        this.standardRemainingText = document.querySelector('.usage-type:nth-child(1) .remaining');
        
        this.premiumUsageLabel = document.querySelector('.usage-type:nth-child(2) .usage-label span:nth-child(2)');
        this.premiumProgressBar = document.querySelector('.usage-type:nth-child(2) .progress');
        this.premiumRemainingText = document.querySelector('.usage-type:nth-child(2) .remaining');
        
        this.resetTimeLabel = document.querySelector('.reset-time');

    }

    generateTabs() {
        if (!this.tabGroup) return;
        
        this.tabGroup.innerHTML = ''; // Clear any existing buttons

        this.tabsConfig.forEach(tab => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tab-button';
            button.dataset.target = tab.id;
            button.textContent = tab.label;
            
            if (tab.default) {
                button.classList.add('active');
            }
            
            this.tabGroup.appendChild(button);
        });
    }



    setupEventListeners() {
        // Tab switching - bind to dynamically generated buttons
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button));
        });

        // Form submission
        if (this.customizeForm) {
            this.customizeForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Theme toggle
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Visual options
        if (this.themeToggle) {
            this.themeToggle.addEventListener('change', () => this.toggleBoringTheme());
        }

        if (this.hidePersonalInfo) {
            this.hidePersonalInfo.addEventListener('change', () => this.togglePersonalInfo());
        }

        // Font changes
        if (this.mainFontSelect) {
            this.mainFontSelect.addEventListener('change', () => this.updateMainFont());
        }

        if (this.codeFontSelect) {
            this.codeFontSelect.addEventListener('change', () => this.updateCodeFont());
        }

        // API Key saving
        if (this.saveApiKeyButton) {
            this.saveApiKeyButton.addEventListener('click', () => this.saveOpenAIApiKey());
        }
        if (this.saveXaiApiKeyButton) {
            this.saveXaiApiKeyButton.addEventListener('click', () => this.saveXaiApiKey());
        }
        if (this.saveOpenRouterApiKeyButton) {
            this.saveOpenRouterApiKeyButton.addEventListener('click', () => this.saveOpenRouterApiKey());
        }
        
        // Web search settings
        if (this.saveWebSearchSettingsButton) {
            this.saveWebSearchSettingsButton.addEventListener('click', () => this.saveWebSearchSettings());
        }
        
        // Set up a timer to update the usage UI every minute
        setInterval(() => this.updateUsageUI(), 60000);
    }
    
    /**
     * Update the usage UI elements
     */
    updateUsageUI() {
        // Get current usage stats
        const usage = chatService.getMessageUsage();
        const resetTimeFormatted = chatService.getFormattedResetTime();
        
        // Update Standard usage
        if (this.standardUsageLabel) {
            this.standardUsageLabel.textContent = `${usage.standard}/${usage.standardLimit}`;
        }
        
        if (this.standardProgressBar) {
            const standardPercent = Math.min(100, (usage.standard / usage.standardLimit) * 100);
            this.standardProgressBar.style.width = `${standardPercent}%`;
            this.standardProgressBar.setAttribute('aria-valuenow', standardPercent);
            
            // Change color when nearing limit
            if (standardPercent > 90) {
                this.standardProgressBar.style.backgroundColor = 'var(--color-warning)';
            } else if (standardPercent > 75) {
                this.standardProgressBar.style.backgroundColor = 'var(--color-warning-dark)';
            } else {
                this.standardProgressBar.style.backgroundColor = 'var(--color-primary)';
            }
        }
        
        if (this.standardRemainingText) {
            this.standardRemainingText.textContent = `${usage.standardRemaining} messages remaining`;
        }
        
        // Update Premium usage
        if (this.premiumUsageLabel) {
            this.premiumUsageLabel.textContent = `${usage.premium}/${usage.premiumLimit}`;
        }
        
        if (this.premiumProgressBar) {
            const premiumPercent = Math.min(100, (usage.premium / usage.premiumLimit) * 100);
            this.premiumProgressBar.style.width = `${premiumPercent}%`;
            this.premiumProgressBar.setAttribute('aria-valuenow', premiumPercent);
            
            // Change color when nearing limit
            if (premiumPercent > 90) {
                this.premiumProgressBar.style.backgroundColor = 'var(--color-warning)';
            } else if (premiumPercent > 75) {
                this.premiumProgressBar.style.backgroundColor = 'var(--color-warning-dark)';
            } else {
                this.premiumProgressBar.style.backgroundColor = 'var(--color-primary)';
            }
        }
        
        if (this.premiumRemainingText) {
            this.premiumRemainingText.textContent = `${usage.premiumRemaining} messages remaining`;
        }
        
        // Update reset time
        if (this.resetTimeLabel) {
            this.resetTimeLabel.textContent = `Resets ${resetTimeFormatted}`;
        }
    }

    switchTab(selectedButton) {
        // Remove active class from all buttons and panels
        this.tabButtons.forEach(button => button.classList.remove('active'));
        this.panels.forEach(panel => panel.classList.remove('active'));

        // Add active class to selected button and corresponding panel
        selectedButton.classList.add('active');
        
        // Get the target panel using data-target attribute
        const targetId = selectedButton.getAttribute('data-target');
        if (targetId) {
            const targetPanel = document.getElementById(`${targetId}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        }
        
        // Update URL hash for deep linking
        window.location.hash = targetId;

    }

    handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.customizeForm);
        const preferences = Object.fromEntries(formData);
        
        // Save to localStorage
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        
        // Show success message
        this.showNotification('Preferences saved successfully!');
    }

    loadSavedSettings() {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
            const preferences = JSON.parse(savedPreferences);
            
            // Populate form fields
            Object.entries(preferences).forEach(([key, value]) => {
                const input = this.customizeForm?.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = value;
                }
            });

            // Apply visual preferences
            if (preferences.boringTheme && this.themeToggle) this.themeToggle.checked = true;
            if (preferences.hidePersonalInfo && this.hidePersonalInfo) this.hidePersonalInfo.checked = true;
            if (preferences.mainFont && this.mainFontSelect) this.mainFontSelect.value = preferences.mainFont;
            if (preferences.codeFont && this.codeFontSelect) this.codeFontSelect.value = preferences.codeFont;
        }

        // Load saved API keys
        const savedOpenaiKey = localStorage.getItem('openai_api_key');
        if (savedOpenaiKey && this.openaiApiKeyInput) {
            this.openaiApiKeyInput.value = savedOpenaiKey;
        }
        const savedXaiKey = localStorage.getItem('xai_api_key');
        if (savedXaiKey && this.xaiApiKeyInput) {
            this.xaiApiKeyInput.value = savedXaiKey;
        }
        const savedOpenRouterKey = localStorage.getItem('openrouter_api_key');
        if (savedOpenRouterKey && this.openrouterApiKeyInput) {
            this.openrouterApiKeyInput.value = savedOpenRouterKey;
        }
        
        // Load web search settings
        const webSearchEnabled = localStorage.getItem('t3chat_web_search_enabled') === 'true';
        if (this.webSearchEnabledToggle) {
            this.webSearchEnabledToggle.checked = webSearchEnabled;
        }
        
        const webSearchMaxResults = localStorage.getItem('t3chat_web_search_max_results') || '5';
        if (this.webSearchMaxResultsInput) {
            this.webSearchMaxResultsInput.value = webSearchMaxResults;
        }
        
        const webSearchPrompt = localStorage.getItem('t3chat_web_search_prompt') || '';
        if (this.webSearchPromptInput) {
            this.webSearchPromptInput.value = webSearchPrompt;
        }
        
        const webSearchOptions = localStorage.getItem('t3chat_web_search_options') || 'medium';
        if (this.webSearchOptionsSelect) {
            this.webSearchOptionsSelect.value = webSearchOptions;
        }
    }

    saveOpenAIApiKey() {
        if (this.openaiApiKeyInput) {
            const apiKey = this.openaiApiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem('openai_api_key', apiKey);
                this.showNotification('OpenAI API Key saved successfully!');
            } else {
                localStorage.removeItem('openai_api_key');
                this.showNotification('OpenAI API Key removed.');
            }
        }
    }

    saveXaiApiKey() {
        if (this.xaiApiKeyInput) {
            const apiKey = this.xaiApiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem('xai_api_key', apiKey);
                this.showNotification('xAI API Key saved successfully!');
            } else {
                localStorage.removeItem('xai_api_key');
                this.showNotification('xAI API Key removed.');
            }
        }
    }

    saveOpenRouterApiKey() {
        if (this.openrouterApiKeyInput) {
            const apiKey = this.openrouterApiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem('openrouter_api_key', apiKey);
                this.showNotification('OpenRouter API Key saved successfully!');
            } else {
                localStorage.removeItem('openrouter_api_key');
                this.showNotification('OpenRouter API Key removed.');
            }
        }
    }
    
    saveWebSearchSettings() {
        // Save web search enabled setting
        const webSearchEnabled = this.webSearchEnabledToggle?.checked || false;
        localStorage.setItem('t3chat_web_search_enabled', webSearchEnabled.toString());
        
        // Save max results setting
        const maxResults = this.webSearchMaxResultsInput?.value || '5';
        localStorage.setItem('t3chat_web_search_max_results', maxResults);
        
        // Save search prompt setting
        const searchPrompt = this.webSearchPromptInput?.value || '';
        localStorage.setItem('t3chat_web_search_prompt', searchPrompt);
        
        // Save search options setting
        const searchOptions = this.webSearchOptionsSelect?.value || 'medium';
        localStorage.setItem('t3chat_web_search_options', searchOptions);
        
        this.showNotification('Web search settings saved successfully!');
    }

    toggleBoringTheme() {
        document.documentElement.classList.toggle('boring', this.themeToggle?.checked);
        this.saveVisualPreferences();
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        document.documentElement.classList.toggle('light', !isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Update icon display if they exist
        const sunIcon = this.themeToggleBtn.querySelector('.icon-sun');
        const moonIcon = this.themeToggleBtn.querySelector('.icon-moon');
        
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isDark ? 'none' : 'block';
            moonIcon.style.display = isDark ? 'block' : 'none';
        }
    }

    togglePersonalInfo() {
        document.body.classList.toggle('hide-personal', this.hidePersonalInfo?.checked);
        this.saveVisualPreferences();
    }

    updateMainFont() {
        document.documentElement.style.setProperty('--font-main', this.mainFontSelect.value);
        this.saveVisualPreferences();
    }

    updateCodeFont() {
        document.documentElement.style.setProperty('--font-code', this.codeFontSelect.value);
        this.saveVisualPreferences();
    }

    saveVisualPreferences() {
        const visualPrefs = {
            boringTheme: this.themeToggle?.checked || false,
            hidePersonalInfo: this.hidePersonalInfo?.checked || false,
            mainFont: this.mainFontSelect?.value,
            codeFont: this.codeFontSelect?.value
        };
        localStorage.setItem('visualPreferences', JSON.stringify(visualPrefs));
    }

    showNotification(message) {
        const toast = document.getElementById('toast');
        if (!toast) return alert(message);
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    handleUrlHash() {
        const hash = window.location.hash;
        console.log('Handling URL hash:', hash);
        
        if (hash) {
            const targetTab = hash.substring(1); // Remove # from hash
            console.log('Target tab:', targetTab);
            
            const tabButton = document.querySelector(`.tab-button[data-target="${targetTab}"]`);
            console.log('Found tab button:', tabButton);
            
            if (tabButton) {
                this.switchTab(tabButton);
                
                // Scroll to the panel to show it
                const panel = document.getElementById(`${targetTab}-panel`);
                console.log('Found panel:', panel);
                
                if (panel) {
                    panel.scrollIntoView({ behavior: 'smooth' });
                }

            } else {
                console.log('Tab button not found for target:', targetTab);
            }
        }
    }
}

// Export as a singleton
const settingsView = new SettingsView();
export default settingsView;
