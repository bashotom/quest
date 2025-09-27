import { URLHashManager } from '../utils/url-hash-manager.js';
import { DebugManager } from '../utils/debug-manager.js';

/**
 * NavigationHandler - Handles navigation and routing
 * Manages URL changes, hash changes, and menu navigation
 */
export class NavigationHandler {
    constructor(appState, uiManager) {
        this.appState = appState;
        this.uiManager = uiManager;
        this.questionnaireRenderer = null; // Will be set later
        this.setupEventListeners();
    }

    /**
     * Set reference to questionnaire renderer
     * @param {Object} questionnaireRenderer - QuestionnaireRenderer instance
     */
    setQuestionnaireRenderer(questionnaireRenderer) {
        this.questionnaireRenderer = questionnaireRenderer;
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        URLHashManager.onHashChange(() => this.handleHashChange());
        
        window.addEventListener('error', (event) => {
            console.error('Global Error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
        });
    }

    /**
     * Handle menu navigation click events
     * @param {Event} event - Click event
     * @param {string} folder - Target questionnaire folder
     */
    handleMenuNavigation(event, folder) {
        event.preventDefault();
        
        this.cleanupLoadAnswersButton();
        
        const cleanUrl = `${window.location.origin}${window.location.pathname}?q=${folder}`;
        window.history.pushState(null, null, cleanUrl);
        
        this.appState.currentFolder = folder;
        this.appState._forceShowForm = true;
        this.appState._suppressHashUpdates = true;
        
        window.questionnaire = this; // Make accessible globally
        
        if (this.questionnaireRenderer) {
            this.questionnaireRenderer.loadQuestionnaire();
        }
    }

    /**
     * Handle URL hash changes
     */
    async handleHashChange() {
        if (!this.appState.questions?.length || !this.appState.config) {
            return;
        }
        
        await this.uiManager.showForm(this.appState.config, this.appState.currentFolder);
        URLHashManager.setAnswersFromHash(this.appState.questions, this.appState.config);
    }

    /**
     * Show evaluation page with scores
     * @param {Object} scores - Calculated scores
     */
    showEvaluation(scores) {
        this.uiManager.elements.questionnaireForm.classList.add('hidden');
        this.uiManager.hideEvaluationElements();

        const hashData = URLHashManager.buildHashFromScores(scores);
        let resultUrl = `result.html?q=${this.appState.currentFolder}`;

        if (DebugManager.isDebugMode()) {
            resultUrl += '&debug=true';
        }

        resultUrl += `#${hashData}`;
        window.location.href = resultUrl;
    }

    /**
     * Clean up load answers button when switching questionnaires
     */
    cleanupLoadAnswersButton() {
        const container = document.getElementById('load-answers-container');
        if (container) {
            container.remove();
        }
    }
}