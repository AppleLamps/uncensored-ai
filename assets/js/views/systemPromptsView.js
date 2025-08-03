/**
 * System Prompts View for T3 Chat
 * Manages the system prompts panel in settings
 */

import systemPromptService from '../services/systemPromptService.js';

class SystemPromptsView {
    constructor() {
        this.currentEditingId = null;
        this.currentDeletingId = null;
        this.initElements();
        this.bindEvents();
        this.loadSystemPrompts();
    }

    /**
     * Initialize DOM elements
     */
    initElements() {
        this.systemPromptsPanel = document.getElementById('system-prompts-panel');
        this.systemPromptsList = document.getElementById('system-prompts-list');
        this.builtinPromptsList = document.getElementById('builtin-prompts-list');
        this.addPromptBtn = document.getElementById('add-prompt-btn');
        
        // Modal elements
        this.modal = document.getElementById('system-prompt-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalClose = document.getElementById('modal-close');
        this.promptNameInput = document.getElementById('prompt-name');
        this.promptContentInput = document.getElementById('prompt-content');
        this.cancelPromptBtn = document.getElementById('cancel-prompt-btn');
        this.savePromptBtn = document.getElementById('save-prompt-btn');
        
        // Delete modal elements
        this.deleteModal = document.getElementById('delete-prompt-modal');
        this.deleteModalClose = document.getElementById('delete-modal-close');
        this.deletePromptName = document.getElementById('delete-prompt-name');
        this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add new prompt button
        if (this.addPromptBtn) {
            this.addPromptBtn.addEventListener('click', () => this.openModal());
        }

        // Modal close events
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (this.cancelPromptBtn) {
            this.cancelPromptBtn.addEventListener('click', () => this.closeModal());
        }

        // Save prompt button
        if (this.savePromptBtn) {
            this.savePromptBtn.addEventListener('click', () => this.savePrompt());
        }

        // Delete modal close events
        if (this.deleteModalClose) {
            this.deleteModalClose.addEventListener('click', () => this.closeDeleteModal());
        }
        
        if (this.cancelDeleteBtn) {
            this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        }

        // Confirm delete button
        if (this.confirmDeleteBtn) {
            this.confirmDeleteBtn.addEventListener('click', () => this.deletePrompt());
        }

        // Close modal when clicking outside
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }

        if (this.deleteModal) {
            this.deleteModal.addEventListener('click', (e) => {
                if (e.target === this.deleteModal) {
                    this.closeDeleteModal();
                }
            });
        }
    }

    /**
     * Load and render system prompts
     */
    loadSystemPrompts() {
        // Ensure system prompt service is initialized
        if (!systemPromptService) {
            console.error('System prompt service not available');
            return;
        }
        
        this.renderCustomPrompts();
        this.renderBuiltinPrompts();
    }

    /**
     * Render custom system prompts
     */
    renderCustomPrompts() {
        if (!this.systemPromptsList) {
            console.error('systemPromptsList element not found');
            return;
        }

        const customPrompts = systemPromptService.getCustomPrompts();
        this.systemPromptsList.innerHTML = '';

        if (Object.keys(customPrompts).length === 0) {
            this.systemPromptsList.innerHTML = '<div class="empty-prompts">No custom prompts yet. Click "Add New Prompt" to create one.</div>';
            return;
        }

        for (const [id, prompt] of Object.entries(customPrompts)) {
            const promptCard = this.createPromptCard(prompt, false);
            this.systemPromptsList.appendChild(promptCard);
        }
    }

    /**
     * Render built-in system prompts
     */
    renderBuiltinPrompts() {
        if (!this.builtinPromptsList) {
            console.error('builtinPromptsList element not found');
            return;
        }

        const builtinPrompts = systemPromptService.getBuiltInPrompts();
        this.builtinPromptsList.innerHTML = '';

        for (const [id, prompt] of Object.entries(builtinPrompts)) {
            const promptCard = this.createPromptCard(prompt, true);
            this.builtinPromptsList.appendChild(promptCard);
        }
    }

    /**
     * Create a prompt card element
     * @param {Object} prompt - Prompt object
     * @param {boolean} isBuiltIn - Whether this is a built-in prompt
     * @returns {HTMLElement} - Card element
     */
    createPromptCard(prompt, isBuiltIn) {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.dataset.promptId = prompt.id;

        const activePrompt = systemPromptService.getActiveSystemPrompt();
        const isActive = activePrompt && activePrompt.id === prompt.id;

        card.innerHTML = `
            <div class="prompt-header">
                <div class="prompt-title">
                    <h3>${prompt.name}</h3>
                    ${isActive ? '<span class="active-badge">Active</span>' : ''}
                </div>
                <div class="prompt-actions">
                    ${!isBuiltIn ? `
                        <button type="button" class="edit-prompt-btn" title="Edit prompt">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button type="button" class="delete-prompt-btn" title="Delete prompt">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="m19,6v14a2,2 0,0 1-2,2H7a2,2 0,0 1-2-2V6m3,0V4a2,2 0,0 1,2-2h4a2,2 0,0 1,2,2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="prompt-content">
                <p>${this.truncateText(prompt.prompt, 200)}</p>
            </div>
            <div class="prompt-meta">
                <span class="prompt-type">${isBuiltIn ? 'Built-in' : 'Custom'}</span>
                ${prompt.createdAt ? `<span class="prompt-date">Created: ${this.formatDate(prompt.createdAt)}</span>` : ''}
            </div>
        `;

        // Add event listeners for actions
        if (!isBuiltIn) {
            const editBtn = card.querySelector('.edit-prompt-btn');
            const deleteBtn = card.querySelector('.delete-prompt-btn');

            if (editBtn) {
                editBtn.addEventListener('click', () => this.editPrompt(prompt.id));
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.openDeleteModal(prompt.id));
            }
        }

        return card;
    }

    /**
     * Open the prompt modal for adding or editing
     * @param {string} promptId - ID of prompt to edit (null for new prompt)
     */
    openModal(promptId = null) {
        this.currentEditingId = promptId;
        
        if (promptId) {
            // Edit mode
            const prompt = systemPromptService.getSystemPrompt(promptId);
            if (prompt) {
                this.modalTitle.textContent = 'Edit System Prompt';
                this.promptNameInput.value = prompt.name;
                this.promptContentInput.value = prompt.prompt;
                this.savePromptBtn.textContent = 'Update Prompt';
            }
        } else {
            // Add mode
            this.modalTitle.textContent = 'Add New System Prompt';
            this.promptNameInput.value = '';
            this.promptContentInput.value = '';
            this.savePromptBtn.textContent = 'Save Prompt';
        }

        this.modal.style.display = 'flex';
        this.promptNameInput.focus();
    }

    /**
     * Close the prompt modal
     */
    closeModal() {
        this.modal.style.display = 'none';
        this.currentEditingId = null;
        this.promptNameInput.value = '';
        this.promptContentInput.value = '';
    }

    /**
     * Save the prompt (add or update)
     */
    savePrompt() {
        const name = this.promptNameInput.value.trim();
        const content = this.promptContentInput.value.trim();

        if (!name) {
            alert('Please enter a name for the prompt.');
            this.promptNameInput.focus();
            return;
        }

        if (!content) {
            alert('Please enter the prompt content.');
            this.promptContentInput.focus();
            return;
        }

        try {
            if (this.currentEditingId) {
                // Update existing prompt
                systemPromptService.updateSystemPrompt(this.currentEditingId, name, content);
                this.showNotification('System prompt updated successfully!');
            } else {
                // Create new prompt
                systemPromptService.createSystemPrompt(name, content);
                this.showNotification('System prompt created successfully!');
            }

            this.closeModal();
            this.loadSystemPrompts();

        } catch (error) {
            console.error('Error saving prompt:', error);
            alert('Error saving prompt: ' + error.message);
        }
    }

    /**
     * Edit a prompt
     * @param {string} promptId - ID of prompt to edit
     */
    editPrompt(promptId) {
        this.openModal(promptId);
    }

    /**
     * Open delete confirmation modal
     * @param {string} promptId - ID of prompt to delete
     */
    openDeleteModal(promptId) {
        this.currentDeletingId = promptId;
        const prompt = systemPromptService.getSystemPrompt(promptId);
        
        if (prompt) {
            this.deletePromptName.textContent = prompt.name;
            this.deleteModal.style.display = 'flex';
        }
    }

    /**
     * Close delete confirmation modal
     */
    closeDeleteModal() {
        this.deleteModal.style.display = 'none';
        this.currentDeletingId = null;
    }

    /**
     * Delete the prompt
     */
    deletePrompt() {
        if (!this.currentDeletingId) return;

        try {
            systemPromptService.deleteSystemPrompt(this.currentDeletingId);
            this.showNotification('System prompt deleted successfully!');
            this.closeDeleteModal();
            this.loadSystemPrompts();

        } catch (error) {
            console.error('Error deleting prompt:', error);
            alert('Error deleting prompt: ' + error.message);
        }
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Show notification
     * @param {string} message - Message to show
     */
    showNotification(message) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-success);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

export default SystemPromptsView; 