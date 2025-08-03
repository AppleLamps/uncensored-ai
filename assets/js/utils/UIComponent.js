/**
 * UI Component System for T3 Chat
 * Provides a lightweight component architecture for reusable UI elements
 */

import store from '../services/store.js';

/**
 * Base UI Component class
 */
export class UIComponent {
    constructor(selector, options = {}) {
        this.selector = selector;
        this.element = null;
        this.children = new Map();
        this.eventListeners = new Map();
        this.storeSubscriptions = [];
        this.options = {
            autoMount: true,
            reactive: true,
            ...options
        };
        
        this.state = {};
        this.props = {};
        
        if (this.options.autoMount) {
            this.mount();
        }
    }

    /**
     * Mount the component to the DOM
     */
    mount() {
        if (typeof this.selector === 'string') {
            this.element = document.querySelector(this.selector);
        } else if (this.selector instanceof HTMLElement) {
            this.element = this.selector;
        }

        if (!this.element) {
            console.warn(`Element not found for selector: ${this.selector}`);
            return;
        }

        this.init();
        this.bindEvents();
        this.render();
        
        if (this.options.reactive) {
            this.subscribeToStore();
        }
    }

    /**
     * Initialize the component (override in subclasses)
     */
    init() {}

    /**
     * Render the component (override in subclasses)
     */
    render() {}

    /**
     * Update the component props and re-render
     * @param {object} newProps - New props to merge
     */
    updateProps(newProps) {
        this.props = { ...this.props, ...newProps };
        this.render();
    }

    /**
     * Update the component state and re-render
     * @param {object} newState - New state to merge
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    /**
     * Subscribe to store changes
     */
    subscribeToStore() {
        // Override in subclasses to define what store changes to listen to
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Override in subclasses to define event listeners
    }

    /**
     * Add event listener to element
     * @param {string} event - Event type
     * @param {function} handler - Event handler
     * @param {object} options - Event options
     */
    addEventListener(event, handler, options = {}) {
        if (!this.element) return;
        
        const boundHandler = handler.bind(this);
        this.element.addEventListener(event, boundHandler, options);
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push({ handler: boundHandler, options });
    }

    /**
     * Remove event listener from element
     * @param {string} event - Event type
     * @param {function} handler - Event handler
     */
    removeEventListener(event, handler) {
        if (!this.element) return;
        
        this.element.removeEventListener(event, handler);
        
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.findIndex(l => l.handler === handler);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Add a child component
     * @param {string} key - Child key
     * @param {UIComponent} component - Child component
     */
    addChild(key, component) {
        this.children.set(key, component);
    }

    /**
     * Remove a child component
     * @param {string} key - Child key
     */
    removeChild(key) {
        const child = this.children.get(key);
        if (child) {
            child.destroy();
            this.children.delete(key);
        }
    }

    /**
     * Get a child component
     * @param {string} key - Child key
     * @returns {UIComponent} Child component
     */
    getChild(key) {
        return this.children.get(key);
    }

    /**
     * Create an element with attributes and content
     * @param {string} tag - HTML tag
     * @param {object} attributes - Element attributes
     * @param {string|HTMLElement|Array} content - Element content
     * @returns {HTMLElement} Created element
     */
    createElement(tag, attributes = {}, content = null) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });

        // Set content
        if (content !== null) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            } else if (Array.isArray(content)) {
                content.forEach(item => {
                    if (typeof item === 'string') {
                        element.appendChild(document.createTextNode(item));
                    } else if (item instanceof HTMLElement) {
                        element.appendChild(item);
                    }
                });
            }
        }

        return element;
    }

    /**
     * Find element within component
     * @param {string} selector - CSS selector
     * @returns {HTMLElement} Found element
     */
    find(selector) {
        return this.element ? this.element.querySelector(selector) : null;
    }

    /**
     * Find all elements within component
     * @param {string} selector - CSS selector
     * @returns {NodeList} Found elements
     */
    findAll(selector) {
        return this.element ? this.element.querySelectorAll(selector) : [];
    }

    /**
     * Toggle a CSS class on the component element
     * @param {string} className - Class name to toggle
     * @param {boolean} force - Force add/remove
     */
    toggleClass(className, force) {
        if (this.element) {
            this.element.classList.toggle(className, force);
        }
    }

    /**
     * Add CSS class to the component element
     * @param {string} className - Class name to add
     */
    addClass(className) {
        if (this.element) {
            this.element.classList.add(className);
        }
    }

    /**
     * Remove CSS class from the component element
     * @param {string} className - Class name to remove
     */
    removeClass(className) {
        if (this.element) {
            this.element.classList.remove(className);
        }
    }

    /**
     * Set HTML content
     * @param {string} html - HTML content
     */
    setHTML(html) {
        if (this.element) {
            this.element.innerHTML = html;
        }
    }

    /**
     * Set text content
     * @param {string} text - Text content
     */
    setText(text) {
        if (this.element) {
            this.element.textContent = text;
        }
    }

    /**
     * Show the component
     */
    show() {
        if (this.element) {
            this.element.style.display = '';
            this.element.classList.remove('hidden');
        }
    }

    /**
     * Hide the component
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.element.classList.add('hidden');
        }
    }

    /**
     * Destroy the component and clean up
     */
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach((listeners, event) => {
            listeners.forEach(({ handler }) => {
                this.element?.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();

        // Unsubscribe from store
        this.storeSubscriptions.forEach(unsubscribe => unsubscribe());
        this.storeSubscriptions = [];

        // Destroy children
        this.children.forEach(child => child.destroy());
        this.children.clear();

        // Remove from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.element = null;
    }
}

/**
 * Dropdown Component
 */
export class DropdownComponent extends UIComponent {
    constructor(selector, options = {}) {
        super(selector, {
            items: [],
            activeItem: null,
            onSelect: null,
            ...options
        });
    }

    init() {
        this.state = {
            isOpen: false,
            items: this.options.items || [],
            activeItem: this.options.activeItem || null
        };
    }

    bindEvents() {
        this.addEventListener('click', this.toggle);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.close();
            }
        });
    }

    toggle() {
        this.setState({ isOpen: !this.state.isOpen });
    }

    open() {
        this.setState({ isOpen: true });
    }

    close() {
        this.setState({ isOpen: false });
    }

    setItems(items) {
        this.setState({ items });
    }

    setActiveItem(item) {
        this.setState({ activeItem: item });
        if (this.options.onSelect) {
            this.options.onSelect(item);
        }
    }

    render() {
        if (!this.element) return;

        const { isOpen, items, activeItem } = this.state;
        
        this.toggleClass('show', isOpen);
        
        // Update dropdown items
        const dropdownContent = this.find('.dropdown-content');
        if (dropdownContent && items.length > 0) {
            dropdownContent.innerHTML = '';
            items.forEach(item => {
                const itemElement = this.createElement('div', {
                    className: `dropdown-item ${item.id === activeItem?.id ? 'active' : ''}`,
                    'data-value': item.id
                }, item.name);
                
                itemElement.addEventListener('click', () => {
                    this.setActiveItem(item);
                    this.close();
                });
                
                dropdownContent.appendChild(itemElement);
            });
        }
    }
}

/**
 * Button Component
 */
export class ButtonComponent extends UIComponent {
    constructor(selector, options = {}) {
        super(selector, {
            text: '',
            icon: null,
            disabled: false,
            loading: false,
            onClick: null,
            ...options
        });
    }

    init() {
        this.state = {
            text: this.options.text || this.element?.textContent || '',
            icon: this.options.icon || null,
            disabled: this.options.disabled || false,
            loading: this.options.loading || false
        };
    }

    bindEvents() {
        this.addEventListener('click', this.handleClick);
    }

    handleClick(e) {
        if (this.state.disabled || this.state.loading) {
            e.preventDefault();
            return;
        }

        if (this.options.onClick) {
            this.options.onClick(e);
        }
    }

    setText(text) {
        this.setState({ text });
    }

    setDisabled(disabled) {
        this.setState({ disabled });
    }

    setLoading(loading) {
        this.setState({ loading });
    }

    render() {
        if (!this.element) return;

        const { text, icon, disabled, loading } = this.state;
        
        this.element.disabled = disabled || loading;
        this.toggleClass('loading', loading);
        
        // Update button content
        if (icon) {
            this.element.innerHTML = `${icon} ${text}`;
        } else {
            this.element.textContent = text;
        }
    }
}

/**
 * Form Component
 */
export class FormComponent extends UIComponent {
    constructor(selector, options = {}) {
        super(selector, {
            fields: {},
            validators: {},
            onSubmit: null,
            ...options
        });
    }

    init() {
        this.state = {
            values: {},
            errors: {},
            isSubmitting: false,
            isValid: true
        };
        
        // Initialize field values
        this.findAll('input, textarea, select').forEach(field => {
            this.state.values[field.name] = field.value;
        });
    }

    bindEvents() {
        this.addEventListener('submit', this.handleSubmit);
        this.addEventListener('input', this.handleInput);
        this.addEventListener('change', this.handleChange);
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.state.isSubmitting) return;
        
        this.validate();
        
        if (this.state.isValid && this.options.onSubmit) {
            this.setState({ isSubmitting: true });
            this.options.onSubmit(this.state.values);
        }
    }

    handleInput(e) {
        if (e.target.matches('input, textarea, select')) {
            this.updateFieldValue(e.target.name, e.target.value);
        }
    }

    handleChange(e) {
        if (e.target.matches('input, textarea, select')) {
            this.updateFieldValue(e.target.name, e.target.value);
        }
    }

    updateFieldValue(fieldName, value) {
        this.setState({
            values: { ...this.state.values, [fieldName]: value }
        });
    }

    validate() {
        const errors = {};
        let isValid = true;

        Object.entries(this.options.validators || {}).forEach(([fieldName, validator]) => {
            const value = this.state.values[fieldName];
            const error = validator(value);
            
            if (error) {
                errors[fieldName] = error;
                isValid = false;
            }
        });

        this.setState({ errors, isValid });
        return isValid;
    }

    getFieldValue(fieldName) {
        return this.state.values[fieldName];
    }

    setFieldValue(fieldName, value) {
        this.updateFieldValue(fieldName, value);
        
        const field = this.find(`[name="${fieldName}"]`);
        if (field) {
            field.value = value;
        }
    }

    setSubmitting(isSubmitting) {
        this.setState({ isSubmitting });
    }

    render() {
        if (!this.element) return;

        const { errors, isSubmitting } = this.state;
        
        this.toggleClass('submitting', isSubmitting);
        
        // Update error display
        Object.entries(errors).forEach(([fieldName, error]) => {
            const field = this.find(`[name="${fieldName}"]`);
            const errorElement = this.find(`.error-${fieldName}`);
            
            if (field) {
                field.classList.toggle('error', !!error);
            }
            
            if (errorElement) {
                errorElement.textContent = error || '';
                errorElement.style.display = error ? 'block' : 'none';
            }
        });
    }
}

/**
 * Modal Component
 */
export class ModalComponent extends UIComponent {
    constructor(selector, options = {}) {
        super(selector, {
            title: '',
            closable: true,
            backdrop: true,
            onOpen: null,
            onClose: null,
            ...options
        });
    }

    init() {
        this.state = {
            isOpen: false,
            title: this.options.title || ''
        };
    }

    bindEvents() {
        // Close button
        const closeBtn = this.find('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        if (this.options.backdrop) {
            this.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.close();
            }
        });
    }

    open() {
        this.setState({ isOpen: true });
        if (this.options.onOpen) {
            this.options.onOpen();
        }
    }

    close() {
        if (!this.options.closable) return;
        
        this.setState({ isOpen: false });
        if (this.options.onClose) {
            this.options.onClose();
        }
    }

    setTitle(title) {
        this.setState({ title });
    }

    render() {
        if (!this.element) return;

        const { isOpen, title } = this.state;
        
        this.toggleClass('show', isOpen);
        
        const titleElement = this.find('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
}

export default UIComponent; 