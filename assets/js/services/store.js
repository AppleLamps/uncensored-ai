/**
 * Store Service for T3 Chat
 * Centralized state management with reactive updates
 */

// State structure
const initialState = {
    // UI State
    ui: {
        sidebarOpen: false,
        sidebarCollapsed: false,
        activeView: 'chat',
        theme: 'light',
        colorTheme: 'modern-gray',
        isMobile: false,
        dropdownsOpen: {
            model: false,
            systemPrompt: false,
            reasoningEffort: false
        }
    },
    
    // Chat State
    chat: {
        activeConversationId: null,
        conversations: [],
        isLoading: false,
        streamingMessageId: null,
        attachments: [],
        isProcessingFiles: false
    },
    
    // API State
    api: {
        activeProvider: null,
        activeModel: null,
        reasoningEffort: null,
        temperature: 0.7,
        maxTokens: 2048,
        availableModels: {}
    },
    
    // System State
    system: {
        activeSystemPrompt: null,
        systemPrompts: [],
        memoryEnabled: true,
        messageUsage: {
            standard: 0,
            premium: 0,
            standardLimit: 1500,
            premiumLimit: 100,
            resetTime: null
        }
    },
    
    // Settings State
    settings: {
        preferLightModels: false,
        compactMessages: false,
        enableNotifications: true,
        enableSounds: false
    }
};

// Create a deep clone to avoid mutation
const state = JSON.parse(JSON.stringify(initialState));

// Event listeners for state changes
const listeners = new Map();
let listenerIdCounter = 0;

class Store {
    constructor() {
        this.state = state;
        this.listeners = listeners;
        this.loadPersistedState();
    }

    /**
     * Get the current state
     * @returns {object} Current state object
     */
    getState() {
        return this.state;
    }

    /**
     * Get a specific part of the state
     * @param {string} path - Dot notation path to the state property
     * @returns {*} The value at the specified path
     */
    getStateValue(path) {
        return this.getNestedValue(this.state, path);
    }

    /**
     * Subscribe to state changes
     * @param {string} path - Dot notation path to watch (optional, watches all changes if not provided)
     * @param {function} callback - Function to call when state changes
     * @returns {function} Unsubscribe function
     */
    subscribe(path, callback) {
        // If only callback is provided, watch all changes
        if (typeof path === 'function') {
            callback = path;
            path = '*';
        }

        const id = ++listenerIdCounter;
        this.listeners.set(id, { path, callback });

        // Return unsubscribe function
        return () => {
            this.listeners.delete(id);
        };
    }

    /**
     * Dispatch an action to update the state
     * @param {object} action - Action object with type and payload
     */
    dispatch(action) {
        const { type, payload } = action;
        const previousState = JSON.parse(JSON.stringify(this.state));

        try {
            switch (type) {
                // UI Actions
                case 'UI_SET_SIDEBAR_OPEN':
                    this.state.ui.sidebarOpen = payload;
                    break;
                case 'UI_SET_SIDEBAR_COLLAPSED':
                    this.state.ui.sidebarCollapsed = payload;
                    break;
                case 'UI_SET_THEME':
                    this.state.ui.theme = payload;
                    this.persistValue('theme', payload);
                    break;
                case 'UI_SET_COLOR_THEME':
                    this.state.ui.colorTheme = payload;
                    this.persistValue('t3chat_color_theme', payload);
                    break;
                case 'UI_SET_MOBILE':
                    this.state.ui.isMobile = payload;
                    break;
                case 'UI_TOGGLE_DROPDOWN':
                    Object.keys(this.state.ui.dropdownsOpen).forEach(key => {
                        this.state.ui.dropdownsOpen[key] = key === payload;
                    });
                    break;
                case 'UI_CLOSE_DROPDOWNS':
                    Object.keys(this.state.ui.dropdownsOpen).forEach(key => {
                        this.state.ui.dropdownsOpen[key] = false;
                    });
                    break;

                // Chat Actions
                case 'CHAT_SET_ACTIVE_CONVERSATION':
                    this.state.chat.activeConversationId = payload;
                    this.persistValue('t3chat_active_conversation', payload);
                    break;
                case 'CHAT_SET_CONVERSATIONS':
                    this.state.chat.conversations = payload;
                    this.persistValue('t3chat_conversations', JSON.stringify(payload));
                    break;
                case 'CHAT_ADD_CONVERSATION':
                    this.state.chat.conversations.push(payload);
                    this.persistValue('t3chat_conversations', JSON.stringify(this.state.chat.conversations));
                    break;
                case 'CHAT_UPDATE_CONVERSATION':
                    const index = this.state.chat.conversations.findIndex(c => c.id === payload.id);
                    if (index !== -1) {
                        this.state.chat.conversations[index] = { ...this.state.chat.conversations[index], ...payload };
                        this.persistValue('t3chat_conversations', JSON.stringify(this.state.chat.conversations));
                    }
                    break;
                case 'CHAT_DELETE_CONVERSATION':
                    this.state.chat.conversations = this.state.chat.conversations.filter(c => c.id !== payload);
                    this.persistValue('t3chat_conversations', JSON.stringify(this.state.chat.conversations));
                    break;
                case 'CHAT_SET_LOADING':
                    this.state.chat.isLoading = payload;
                    break;
                case 'CHAT_SET_STREAMING_MESSAGE':
                    this.state.chat.streamingMessageId = payload;
                    break;
                case 'CHAT_SET_ATTACHMENTS':
                    this.state.chat.attachments = payload;
                    break;
                case 'CHAT_SET_PROCESSING_FILES':
                    this.state.chat.isProcessingFiles = payload;
                    break;

                // API Actions
                case 'API_SET_ACTIVE_MODEL':
                    this.state.api.activeProvider = payload.provider;
                    this.state.api.activeModel = payload.model;
                    this.state.api.reasoningEffort = payload.reasoningEffort || null;
                    this.persistValue('t3chat_active_provider', payload.provider);
                    this.persistValue('t3chat_active_model', payload.model);
                    if (payload.reasoningEffort) {
                        this.persistValue('t3chat_reasoning_effort', payload.reasoningEffort);
                    } else {
                        this.removePersistedValue('t3chat_reasoning_effort');
                    }
                    break;
                case 'API_SET_AVAILABLE_MODELS':
                    this.state.api.availableModels = payload;
                    break;
                case 'API_SET_TEMPERATURE':
                    this.state.api.temperature = payload;
                    this.persistValue('t3chat_temperature', payload);
                    break;
                case 'API_SET_MAX_TOKENS':
                    this.state.api.maxTokens = payload;
                    this.persistValue('t3chat_max_tokens', payload);
                    break;

                // System Actions
                case 'SYSTEM_SET_ACTIVE_PROMPT':
                    this.state.system.activeSystemPrompt = payload;
                    this.persistValue('t3chat_active_system_prompt', payload);
                    break;
                case 'SYSTEM_SET_PROMPTS':
                    this.state.system.systemPrompts = payload;
                    this.persistValue('t3chat_system_prompts', JSON.stringify(payload));
                    break;
                case 'SYSTEM_SET_MEMORY_ENABLED':
                    this.state.system.memoryEnabled = payload;
                    this.persistValue('t3chat_enable_memory', payload);
                    break;
                case 'SYSTEM_SET_MESSAGE_USAGE':
                    this.state.system.messageUsage = { ...this.state.system.messageUsage, ...payload };
                    this.persistValue('t3chat_message_usage', JSON.stringify(this.state.system.messageUsage));
                    break;

                // Settings Actions
                case 'SETTINGS_SET_PREFER_LIGHT_MODELS':
                    this.state.settings.preferLightModels = payload;
                    this.persistValue('t3chat_prefer_light_models', payload);
                    break;
                case 'SETTINGS_SET_COMPACT_MESSAGES':
                    this.state.settings.compactMessages = payload;
                    this.persistValue('t3chat_compact_messages', payload);
                    break;
                case 'SETTINGS_UPDATE':
                    this.state.settings = { ...this.state.settings, ...payload };
                    Object.entries(payload).forEach(([key, value]) => {
                        this.persistValue(`t3chat_${key}`, value);
                    });
                    break;

                default:
                    console.warn(`Unknown action type: ${type}`);
                    return;
            }

            // Notify listeners
            this.notifyListeners(previousState, this.state);
        } catch (error) {
            console.error('Error dispatching action:', error);
            // Restore previous state on error
            this.state = previousState;
        }
    }

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        try {
            // Load UI state
            this.state.ui.theme = localStorage.getItem('theme') || 'light';
            this.state.ui.colorTheme = localStorage.getItem('t3chat_color_theme') || 'modern-gray';

            // Load chat state
            this.state.chat.activeConversationId = localStorage.getItem('t3chat_active_conversation');
            const conversations = localStorage.getItem('t3chat_conversations');
            if (conversations) {
                this.state.chat.conversations = JSON.parse(conversations);
            }

            // Load API state
            this.state.api.activeProvider = localStorage.getItem('t3chat_active_provider');
            this.state.api.activeModel = localStorage.getItem('t3chat_active_model');
            this.state.api.reasoningEffort = localStorage.getItem('t3chat_reasoning_effort');
            this.state.api.temperature = parseFloat(localStorage.getItem('t3chat_temperature')) || 0.7;
            this.state.api.maxTokens = parseInt(localStorage.getItem('t3chat_max_tokens')) || 2048;

            // Load system state
            this.state.system.activeSystemPrompt = localStorage.getItem('t3chat_active_system_prompt');
            const systemPrompts = localStorage.getItem('t3chat_system_prompts');
            if (systemPrompts) {
                this.state.system.systemPrompts = JSON.parse(systemPrompts);
            }
            this.state.system.memoryEnabled = localStorage.getItem('t3chat_enable_memory') !== 'false';
            const messageUsage = localStorage.getItem('t3chat_message_usage');
            if (messageUsage) {
                this.state.system.messageUsage = { ...this.state.system.messageUsage, ...JSON.parse(messageUsage) };
            }

            // Load settings state
            this.state.settings.preferLightModels = localStorage.getItem('t3chat_prefer_light_models') === 'true';
            this.state.settings.compactMessages = localStorage.getItem('t3chat_compact_messages') === 'true';
        } catch (error) {
            console.error('Error loading persisted state:', error);
        }
    }

    /**
     * Persist a value to localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    persistValue(key, value) {
        try {
            if (typeof value === 'boolean') {
                localStorage.setItem(key, value.toString());
            } else if (typeof value === 'object') {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.setItem(key, value);
            }
        } catch (error) {
            console.error('Error persisting value:', error);
        }
    }

    /**
     * Remove a persisted value from localStorage
     * @param {string} key - Storage key
     */
    removePersistedValue(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing persisted value:', error);
        }
    }

    /**
     * Get a nested value from an object using dot notation
     * @param {object} obj - Object to search
     * @param {string} path - Dot notation path
     * @returns {*} Value at path
     */
    getNestedValue(obj, path) {
        if (path === '*') return obj;
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Check if a path has changed between two states
     * @param {object} oldState - Previous state
     * @param {object} newState - Current state
     * @param {string} path - Path to check
     * @returns {boolean} True if changed
     */
    hasPathChanged(oldState, newState, path) {
        if (path === '*') return true;
        const oldValue = this.getNestedValue(oldState, path);
        const newValue = this.getNestedValue(newState, path);
        return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }

    /**
     * Notify listeners of state changes
     * @param {object} previousState - Previous state
     * @param {object} currentState - Current state
     */
    notifyListeners(previousState, currentState) {
        this.listeners.forEach(({ path, callback }) => {
            try {
                if (this.hasPathChanged(previousState, currentState, path)) {
                    callback(currentState, previousState);
                }
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.state = JSON.parse(JSON.stringify(initialState));
        this.notifyListeners({}, this.state);
    }

    /**
     * Get a snapshot of the current state for debugging
     * @returns {object} State snapshot
     */
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }
}

// Create and export singleton instance
const store = new Store();
export default store; 