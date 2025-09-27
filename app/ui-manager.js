import { PersistenceManagerFactory } from '../services/persistence-manager-factory.js';

/**
 * UIManager - Handles all UI-related operations
 * Manages DOM elements, visibility states, and UI feedback
 */
export class UIManager {
    constructor() {
        this.elements = this.initializeElements();
    }

    /**
     * Initialize all DOM element references
     * @returns {Object} Object containing all DOM element references
     */
    initializeElements() {
        return {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('error-message'),
            appContent: document.getElementById('app-content'),
            questionnaireForm: document.getElementById('questionnaire-form'),
            questionnaireTitle: document.getElementById('questionnaire-title'),
            questionnaireDescription: document.getElementById('questionnaire-description'),
            questionnaireMenu: document.getElementById('questionnaire-menu')
        };
    }

    /**
     * Display error message and hide other content
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.elements.loading.style.display = 'none';
        this.elements.appContent.style.display = 'none';
        this.elements.error.style.display = 'block';
        this.elements.errorMessage.textContent = message;
    }

    /**
     * Show main application content
     */
    showContent() {
        this.elements.loading.style.display = 'none';
        this.elements.error.style.display = 'none';
        this.elements.appContent.style.display = 'block';
    }

    /**
     * Display temporary notification message
     * @param {string} message - Message to display
     * @param {string} type - Message type (success, error, info, warning)
     */
    showTemporaryMessage(message, type = 'info') {
        let messageEl = document.getElementById('temp-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'temp-message';
            messageEl.className = 'fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white font-medium transform translate-x-full transition-transform duration-300';
            document.body.appendChild(messageEl);
        }
        
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600',
            warning: 'bg-yellow-600'
        };
        
        messageEl.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white font-medium transition-transform duration-300 ${colors[type] || colors.info}`;
        messageEl.textContent = message;
        
        setTimeout(() => messageEl.style.transform = 'translateX(0)', 50);
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => messageEl.parentNode?.removeChild(messageEl), 300);
        }, 3000);
    }

    /**
     * Show the questionnaire form and related UI elements
     * @param {Object} config - Application configuration
     * @param {string} currentFolder - Current questionnaire folder
     */
    async showForm(config, currentFolder) {
        this.elements.questionnaireForm.classList.remove('hidden');

        // Show answer buttons
        ['min-answers-btn', 'random-answers-btn', 'max-answers-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = '';
        });
        
        // Show/hide clear saved button based on persistence settings
        await this.updateClearButtonVisibility(config, currentFolder);
        
        // Show navigation menu
        if (this.elements.questionnaireMenu?.parentElement) {
            this.elements.questionnaireMenu.parentElement.style.display = '';
        }
    }

    /**
     * Update visibility of the clear saved answers button
     * @param {Object} config - Application configuration
     * @param {string} currentFolder - Current questionnaire folder
     */
    async updateClearButtonVisibility(config, currentFolder) {
        const clearSavedBtn = document.getElementById('clear-saved-btn');
        if (clearSavedBtn) {
            if (PersistenceManagerFactory.isEnabled(config) && config.persistence?.try_reloading === true) {
                const PersistenceManager = PersistenceManagerFactory.create(config);
                const savedAnswers = await PersistenceManager.loadAnswers(currentFolder, config);
                clearSavedBtn.style.display = savedAnswers && Object.keys(savedAnswers).length > 0 ? '' : 'none';
            } else {
                clearSavedBtn.style.display = 'none';
            }
        }
    }

    /**
     * Hide evaluation-related UI elements and show form
     */
    hideEvaluationElements() {
        if (this.elements.questionnaireMenu?.parentElement) {
            this.elements.questionnaireMenu.parentElement.style.display = 'none';
        }
        
        ['min-answers-btn', 'random-answers-btn', 'max-answers-btn', 'clear-saved-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
    }
}