import apiService from '../services/apiService.js';

/**
 * Models View for T3 Chat
 * Handles the models panel in settings
 */
class ModelsView {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.loadSavedSettings();
    }

    /**
     * Initialize DOM elements
     */
    initElements() {
        this.modelsPanel = document.getElementById('models-panel');
        this.modelListContainer = document.getElementById('model-list-container'); // New container for dynamic models
        this.temperatureSlider = document.getElementById('temperature-slider');
        this.temperatureValue = document.querySelector('.slider-value');
        this.maxTokensInput = document.getElementById('max-tokens-input');
        this.saveButton = document.getElementById('save-model-settings');
        this.reasoningEffortDropdown = document.querySelector('.reasoning-effort-dropdown');
        this.reasoningEffortSelect = document.getElementById('reasoning-effort');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Temperature slider
        if (this.temperatureSlider && this.temperatureValue) {
            this.temperatureSlider.addEventListener('input', () => {
                const value = this.temperatureSlider.value;
                this.temperatureValue.textContent = value;
            });
        }

        // Save button
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => this.saveSettings());
        }

        // Reasoning effort select
        if (this.reasoningEffortSelect) {
            this.reasoningEffortSelect.addEventListener('change', () => {
                // When reasoning effort changes, re-select the model to apply the new setting
                const activeModel = apiService.getActiveModel();
                if (activeModel.model === 'o4-mini') {
                    this.selectModel(activeModel.provider, activeModel.model, 
                        document.querySelector(`button[data-model='o4-mini'][data-provider='openai']`));
                }
            });
        }
    }

    /**
     * Load saved model settings
     */
    loadSavedSettings() {
        this.renderModels(); // Render models dynamically

        // Load reasoning effort setting
        const reasoningEffort = localStorage.getItem('t3chat_reasoning_effort') || 'medium';
        if (this.reasoningEffortSelect) {
            this.reasoningEffortSelect.value = reasoningEffort;
        }

        // Load temperature setting
        const temperature = localStorage.getItem('t3chat_temperature') || 0.7;
        if (this.temperatureSlider && this.temperatureValue) {
            this.temperatureSlider.value = temperature;
            this.temperatureValue.textContent = temperature;
        }

        // Load max tokens setting
        const maxTokens = localStorage.getItem('t3chat_max_tokens') || 2048;
        if (this.maxTokensInput) {
            this.maxTokensInput.value = maxTokens;
        }
    }

    /**
     * Select a model (simplified - no selection needed since only one model)
     * @param {string} provider - The provider name
     * @param {string} model - The model name
     * @param {HTMLElement} selectedButton - The button that was clicked
     */
    selectModel(provider, model, selectedButton) {
        // Model is already set and fixed, no action needed
        this.showNotification('UNCENSORED AI is the only available model and is already active.');
    }

    /**
     * Save model settings
     */
    saveSettings() {
        // Save temperature
        if (this.temperatureSlider) {
            localStorage.setItem('t3chat_temperature', this.temperatureSlider.value);
            apiService.setTemperature(parseFloat(this.temperatureSlider.value));
        }

        // Save max tokens
        if (this.maxTokensInput) {
            localStorage.setItem('t3chat_max_tokens', this.maxTokensInput.value);
            apiService.setMaxTokens(parseInt(this.maxTokensInput.value, 10));
        }

        // Show confirmation message
        this.showNotification('Model settings saved successfully!');
    }

    /**
     * Show a notification message
     * @param {string} message - The message to display
     */
    showNotification(message) {
        alert(message); // Simple notification for now
    }

    /**
     * Render the current model information (simplified for single model)
     */
    renderModels() {
        const activeModel = apiService.getActiveModel();
        this.modelListContainer.innerHTML = ''; // Clear existing content

        // Create a simple info display for the single model
        const modelInfo = document.createElement('div');
        modelInfo.className = 'model-info-card';
        modelInfo.innerHTML = `
            <div class="model-header">
                <h3>Current Model</h3>
                <span class="model-status active">Active</span>
            </div>
            <div class="model-details">
                <h4>UNCENSORED AI</h4>
                <p>Google UNCENSORED AI - Fast and efficient AI model</p>
                <div class="model-provider">Provider: OpenRouter</div>
                <div class="model-id">Model ID: google/gemini-2.5-flash</div>
            </div>
        `;

        this.modelListContainer.appendChild(modelInfo);

        // Hide reasoning effort dropdown since it's not needed for this model
        if (this.reasoningEffortDropdown) {
            this.reasoningEffortDropdown.style.display = 'none';
        }
    }
}

// Export as singleton
const modelsView = new ModelsView();
export default modelsView;
