/**
 * Modern Chat View for T3 Chat
 * Demonstrates integration with centralized store and UI components
 */

import store from '../services/store.js';
import { UIComponent, DropdownComponent, ButtonComponent, FormComponent } from '../utils/UIComponent.js';
import chatService from '../services/chatService.js';
import apiService from '../services/apiService.js';
import systemPromptService from '../services/systemPromptService.js';

class ModernChatView extends UIComponent {
    constructor() {
        super('#chat-area', {
            autoMount: true,
            reactive: true
        });
        
        // Initialize child components
        this.initializeComponents();
    }

    init() {
        // Initialize local state
        this.state = {
            isInitialized: false,
            streamingTimer: null,
            currentStreamContent: '',
            usageWarningDisplayed: false,
            scrollAnimationFrame: null
        };

        // Subscribe to global store
        this.subscribeToStore();
    }

    subscribeToStore() {
        // Subscribe to chat state changes
        const chatUnsubscribe = store.subscribe('chat', (newState, oldState) => {
            this.handleChatStateChange(newState.chat, oldState.chat);
        });
        this.storeSubscriptions.push(chatUnsubscribe);

        // Subscribe to API state changes
        const apiUnsubscribe = store.subscribe('api', (newState, oldState) => {
            this.handleApiStateChange(newState.api, oldState.api);
        });
        this.storeSubscriptions.push(apiUnsubscribe);

        // Subscribe to UI state changes
        const uiUnsubscribe = store.subscribe('ui', (newState, oldState) => {
            this.handleUIStateChange(newState.ui, oldState.ui);
        });
        this.storeSubscriptions.push(uiUnsubscribe);
    }

    initializeComponents() {
        // Initialize model selector dropdown
        this.modelSelector = new DropdownComponent('.model-selector-btn', {
            items: [],
            activeItem: null,
            onSelect: (item) => this.handleModelSelect(item)
        });
        this.addChild('modelSelector', this.modelSelector);

        // Initialize system prompt selector
        this.systemPromptSelector = new DropdownComponent('.system-prompt-selector-btn', {
            items: [],
            activeItem: null,
            onSelect: (item) => this.handleSystemPromptSelect(item)
        });
        this.addChild('systemPromptSelector', this.systemPromptSelector);

        // Initialize chat form
        this.chatForm = new FormComponent('#chat-form', {
            validators: {
                'chat-input': (value) => {
                    if (!value.trim()) return 'Message cannot be empty';
                    return null;
                }
            },
            onSubmit: (values) => this.handleChatSubmit(values)
        });
        this.addChild('chatForm', this.chatForm);

        // Initialize new chat button
        this.newChatBtn = new ButtonComponent('.new-chat-btn', {
            onClick: () => this.handleNewChat()
        });
        this.addChild('newChatBtn', this.newChatBtn);

        // Initialize send button
        this.sendBtn = new ButtonComponent('.send-btn', {
            onClick: () => this.handleSendClick()
        });
        this.addChild('sendBtn', this.sendBtn);
    }

    handleChatStateChange(newChatState, oldChatState) {
        const { activeConversationId, conversations, isLoading, attachments } = newChatState;

        // Update active conversation
        if (activeConversationId !== oldChatState.activeConversationId) {
            this.renderActiveConversation(activeConversationId);
        }

        // Update conversation list
        if (conversations !== oldChatState.conversations) {
            this.renderConversationList(conversations);
        }

        // Update loading state
        if (isLoading !== oldChatState.isLoading) {
            this.updateLoadingState(isLoading);
        }

        // Update attachments
        if (attachments !== oldChatState.attachments) {
            this.updateAttachments(attachments);
        }
    }

    handleApiStateChange(newApiState, oldApiState) {
        const { activeProvider, activeModel, availableModels } = newApiState;

        // Update model selector
        if (activeProvider !== oldApiState.activeProvider || activeModel !== oldApiState.activeModel) {
            this.updateModelSelector(activeProvider, activeModel);
        }

        // Update available models
        if (availableModels !== oldApiState.availableModels) {
            this.updateAvailableModels(availableModels);
        }
    }

    handleUIStateChange(newUIState, oldUIState) {
        const { dropdownsOpen, theme, colorTheme } = newUIState;

        // Update dropdown states
        if (dropdownsOpen !== oldUIState.dropdownsOpen) {
            this.updateDropdownStates(dropdownsOpen);
        }

        // Update theme
        if (theme !== oldUIState.theme || colorTheme !== oldUIState.colorTheme) {
            this.updateTheme(theme, colorTheme);
        }
    }

    handleModelSelect(model) {
        // Dispatch action to update store
        store.dispatch({
            type: 'API_SET_ACTIVE_MODEL',
            payload: {
                provider: model.provider,
                model: model.id,
                reasoningEffort: model.reasoningEffort
            }
        });

        // Close dropdown
        store.dispatch({
            type: 'UI_CLOSE_DROPDOWNS'
        });
    }

    handleSystemPromptSelect(prompt) {
        // Dispatch action to update store
        store.dispatch({
            type: 'SYSTEM_SET_ACTIVE_PROMPT',
            payload: prompt.id
        });

        // Close dropdown
        store.dispatch({
            type: 'UI_CLOSE_DROPDOWNS'
        });
    }

    handleChatSubmit(values) {
        const message = values['chat-input'];
        if (!message.trim()) return;

        // Dispatch loading state
        store.dispatch({
            type: 'CHAT_SET_LOADING',
            payload: true
        });

        // Send message through chat service
        this.sendMessage(message);
    }

    handleNewChat() {
        // Create new conversation
        const newConversationId = chatService.createConversation();
        
        // Update store
        store.dispatch({
            type: 'CHAT_SET_ACTIVE_CONVERSATION',
            payload: newConversationId
        });

        // Clear chat input
        this.chatForm.setFieldValue('chat-input', '');
    }

    handleSendClick() {
        // Trigger form submission
        this.chatForm.element.dispatchEvent(new Event('submit'));
    }

    async sendMessage(message) {
        try {
            const state = store.getState();
            const activeConversationId = state.chat.activeConversationId;
            
            if (!activeConversationId) {
                throw new Error('No active conversation');
            }

            // Add user message to conversation
            await chatService.addMessage(activeConversationId, message, 'user');

            // Update conversations in store
            store.dispatch({
                type: 'CHAT_SET_CONVERSATIONS',
                payload: chatService.getConversations()
            });

            // Clear input
            this.chatForm.setFieldValue('chat-input', '');

            // Send API request
            const response = await chatService.sendMessage(
                message,
                (streamContent) => this.handleStreamUpdate(streamContent)
            );

            // Handle response
            if (response && response.content) {
                await chatService.addMessage(activeConversationId, response.content, 'assistant');
                
                // Update store
                store.dispatch({
                    type: 'CHAT_SET_CONVERSATIONS',
                    payload: chatService.getConversations()
                });
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message. Please try again.');
        } finally {
            // Clear loading state
            store.dispatch({
                type: 'CHAT_SET_LOADING',
                payload: false
            });
        }
    }

    handleStreamUpdate(content) {
        // Update streaming content
        this.currentStreamContent = content;
        
        // Update UI with streaming content
        this.updateStreamingMessage(content);
    }

    updateStreamingMessage(content) {
        // Find or create streaming message element
        let streamingElement = this.find('.streaming-message');
        
        if (!streamingElement) {
            streamingElement = this.createElement('div', {
                className: 'chat-message bot-message streaming-message'
            });
            
            const chatLog = this.find('#chat-log');
            if (chatLog) {
                chatLog.appendChild(streamingElement);
            }
        }

        // Update content
        streamingElement.innerHTML = this.formatMessage(content);
        
        // Scroll to bottom
        this.scrollToBottomStreaming();
    }

    renderActiveConversation(conversationId) {
        const conversation = chatService.getConversation(conversationId);
        
        if (!conversation) {
            this.clearChatLog();
            return;
        }

        // Render conversation messages
        this.renderConversationMessages(conversation);
    }

    renderConversationMessages(conversation) {
        const chatLog = this.find('#chat-log');
        if (!chatLog) return;

        // Clear existing messages
        chatLog.innerHTML = '';

        // Render each message
        conversation.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            chatLog.appendChild(messageElement);
        });

        // Scroll to bottom
        this.scrollToBottom(true, true); // Force scroll with smooth animation when loading conversation
    }

    createMessageElement(message) {
        const messageClass = message.role === 'user' ? 'user-message' : 'bot-message';
        
        const messageElement = this.createElement('div', {
            className: `chat-message ${messageClass}`
        });

        const content = this.formatMessage(message.content);
        messageElement.innerHTML = content;

        // Add copy button for bot messages
        if (message.role === 'assistant') {
            const copyBtn = this.createElement('button', {
                className: 'copy-btn',
                'aria-label': 'Copy message'
            }, '📋');
            
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(message.content);
                this.showSuccess('Message copied to clipboard');
            });
            
            messageElement.appendChild(copyBtn);
        }

        return messageElement;
    }

    formatMessage(content) {
        // Basic markdown formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    updateModelSelector(provider, model) {
        // Update model selector button text
        const modelSelectorBtn = this.find('.model-selector-btn');
        if (modelSelectorBtn) {
            const availableModels = store.getStateValue('api.availableModels');
            const modelName = this.getModelName(provider, model, availableModels);
            modelSelectorBtn.textContent = modelName;
        }
    }

    updateAvailableModels(availableModels) {
        // Update model selector dropdown items
        const modelItems = this.formatModelItems(availableModels);
        this.modelSelector.setItems(modelItems);
    }

    formatModelItems(availableModels) {
        const items = [];
        
        Object.entries(availableModels).forEach(([provider, models]) => {
            models.forEach(model => {
                items.push({
                    id: model.id,
                    name: model.name,
                    provider: provider,
                    reasoningEffort: model.reasoningEffort
                });
            });
        });

        return items;
    }

    getModelName(provider, modelId, availableModels) {
        if (!provider || !modelId || !availableModels) return 'Select Model';
        
        const providerModels = availableModels[provider];
        if (!providerModels) return 'Select Model';
        
        const model = providerModels.find(m => m.id === modelId);
        return model ? model.name : 'Select Model';
    }

    updateLoadingState(isLoading) {
        // Update send button state
        this.sendBtn.setLoading(isLoading);
        
        // Update form state
        this.chatForm.setSubmitting(isLoading);
        
        // Show/hide loading indicator
        const loadingIndicator = this.find('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    updateAttachments(attachments) {
        // Update attachment display
        const attachmentContainer = this.find('.attachment-container');
        if (!attachmentContainer) return;

        // Clear existing attachments
        attachmentContainer.innerHTML = '';

        // Render attachments
        attachments.forEach(attachment => {
            const attachmentElement = this.createAttachmentElement(attachment);
            attachmentContainer.appendChild(attachmentElement);
        });
    }

    createAttachmentElement(attachment) {
        const element = this.createElement('div', {
            className: 'attachment-item'
        });

        const icon = this.createElement('span', {
            className: 'attachment-icon'
        }, '📎');

        const name = this.createElement('span', {
            className: 'attachment-name'
        }, attachment.name);

        const removeBtn = this.createElement('button', {
            className: 'attachment-remove',
            'aria-label': 'Remove attachment'
        }, '×');

        removeBtn.addEventListener('click', () => {
            this.removeAttachment(attachment.id);
        });

        element.appendChild(icon);
        element.appendChild(name);
        element.appendChild(removeBtn);

        return element;
    }

    removeAttachment(attachmentId) {
        const currentAttachments = store.getStateValue('chat.attachments');
        const updatedAttachments = currentAttachments.filter(a => a.id !== attachmentId);
        
        store.dispatch({
            type: 'CHAT_SET_ATTACHMENTS',
            payload: updatedAttachments
        });
    }

    clearChatLog() {
        const chatLog = this.find('#chat-log');
        if (chatLog) {
            chatLog.innerHTML = '';
        }
    }

    /**
     * Scroll chat log to the bottom with intelligent autoscroll
     * @param {boolean} force - Force scroll even if user has scrolled up
     * @param {boolean} smooth - Use smooth scrolling animation
     */
    scrollToBottom(force = false, smooth = false) {
        const chatLog = this.find('#chat-log');
        if (!chatLog) return;

        // Check if user is near the bottom (within 100px tolerance)
        const isNearBottom = chatLog.scrollTop + chatLog.clientHeight >= chatLog.scrollHeight - 100;
        
        // Only auto-scroll if user is near bottom or if forced
        if (force || isNearBottom) {
            if (smooth) {
                chatLog.scrollTo({
                    top: chatLog.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        }
    }

    /**
     * Enhanced scroll to bottom for streaming content
     * This version is optimized for frequent updates during streaming
     */
    scrollToBottomStreaming() {
        const chatLog = this.find('#chat-log');
        if (!chatLog) return;

        // Use requestAnimationFrame for smooth performance during streaming
        if (this.state.scrollAnimationFrame) {
            cancelAnimationFrame(this.state.scrollAnimationFrame);
        }
        
        this.state.scrollAnimationFrame = requestAnimationFrame(() => {
            // Check if user is near the bottom (within 150px tolerance for streaming)
            const isNearBottom = chatLog.scrollTop + chatLog.clientHeight >= chatLog.scrollHeight - 150;
            
            if (isNearBottom) {
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        });
    }

    showError(message) {
        // Show error notification
        const alertElement = this.createElement('div', {
            className: 'alert alert--error'
        });

        const icon = this.createElement('div', {
            className: 'alert__icon'
        }, '⚠️');

        const content = this.createElement('div', {
            className: 'alert__content'
        }, message);

        alertElement.appendChild(icon);
        alertElement.appendChild(content);

        // Add to notifications area
        const notificationsArea = this.find('.notifications') || document.body;
        notificationsArea.appendChild(alertElement);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertElement.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Show success notification
        const alertElement = this.createElement('div', {
            className: 'alert alert--success'
        });

        const icon = this.createElement('div', {
            className: 'alert__icon'
        }, '✅');

        const content = this.createElement('div', {
            className: 'alert__content'
        }, message);

        alertElement.appendChild(icon);
        alertElement.appendChild(content);

        // Add to notifications area
        const notificationsArea = this.find('.notifications') || document.body;
        notificationsArea.appendChild(alertElement);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            alertElement.remove();
        }, 3000);
    }

    render() {
        // This method is called automatically when state changes
        // Most rendering is handled by the change handlers above
        
        if (!this.state.isInitialized) {
            this.initializeView();
            this.state.isInitialized = true;
        }
    }

    initializeView() {
        // Load initial data into store
        const conversations = chatService.getConversations();
        const availableModels = apiService.getAvailableModels();
        
        store.dispatch({
            type: 'CHAT_SET_CONVERSATIONS',
            payload: conversations
        });

        store.dispatch({
            type: 'API_SET_AVAILABLE_MODELS',
            payload: availableModels
        });

        // Set active conversation if one exists
        const activeConversationId = store.getStateValue('chat.activeConversationId');
        if (activeConversationId) {
            this.renderActiveConversation(activeConversationId);
        }
    }
}

// Export for use in other modules
export default ModernChatView; 