import { QuestionRenderer } from '../components/question-renderer.js';
import { FormHandler } from '../components/form-handler.js';
import { PersistenceManagerFactory } from '../services/persistence-manager-factory.js';
import { TableModeRenderer } from '../components/renderers/table-mode-renderer.js';
import { InlineModeRenderer } from '../components/renderers/inline-mode-renderer.js';

/**
 * FormEventHandler - Handles all form-related events
 * Manages form interactions, button clicks, and answer persistence
 */
export class FormEventHandler {
    constructor(appState, uiManager, navigationHandler) {
        this.appState = appState;
        this.uiManager = uiManager;
        this.navigationHandler = navigationHandler;
    }

    /**
     * Setup all form event listeners
     */
    setupFormEvents() {
        this.setupDisplayModeButtons();
        this.setupFormHandler();
        this.setupAnswerButtons();
        this.setupClearButton();
    }

    /**
     * Setup display mode toggle buttons
     */
    setupDisplayModeButtons() {
        const modes = ['column', 'inline', 'responsive'];
        modes.forEach(mode => {
            document.getElementById(`btn-${mode}`)?.addEventListener('click', () => {
                localStorage.setItem('displayMode', mode);
                if (this.questionnaireRenderer) {
                    this.questionnaireRenderer.renderQuestions();
                }
            });
        });
    }

    /**
     * Set reference to questionnaire renderer
     * @param {Object} questionnaireRenderer - QuestionnaireRenderer instance
     */
    setQuestionnaireRenderer(questionnaireRenderer) {
        this.questionnaireRenderer = questionnaireRenderer;
    }

    /**
     * Setup form submission handler
     */
    setupFormHandler() {
        this.appState.formHandler = new FormHandler(
            this.appState.questions, 
            this.appState.config, 
            this.appState.currentFolder
        );
        this.appState.formHandler.setupRadioChangeListeners();
        
        document.getElementById('quiz-form')?.addEventListener('submit', async (event) => {
            await this.appState.formHandler.handleSubmit(event, (scores) => {
                this.navigationHandler.showEvaluation(scores);
            });
        });
    }

    /**
     * Setup answer preset buttons (min, random, max)
     */
    setupAnswerButtons() {
        const answerTypes = [
            { id: 'min-answers-btn', type: 'min' },
            { id: 'random-answers-btn', type: 'random' },
            { id: 'max-answers-btn', type: 'max' }
        ];

        answerTypes.forEach(({ id, type }) => {
            document.getElementById(id)?.addEventListener('click', async () => {
                await this.setAnswers(type);
            });
        });
    }

    /**
     * Setup clear saved answers button
     */
    setupClearButton() {
        document.getElementById('clear-saved-btn')?.addEventListener('click', async () => {
            const PersistenceManager = PersistenceManagerFactory.create(this.appState.config);
            await PersistenceManager.clearAnswers(this.appState.currentFolder);
            
            // Clear current form
            document.querySelectorAll('input[type="radio"]').forEach(input => {
                input.checked = false;
            });
            
            QuestionRenderer.resetAllColors();
            await this.uiManager.updateClearButtonVisibility(this.appState.config, this.appState.currentFolder);
            this.uiManager.showTemporaryMessage('Gespeicherte Antworten wurden gelöscht.', 'success');
        });
    }

    /**
     * Set answers for all questions based on type
     * @param {string} type - Answer type: 'min', 'random', or 'max'
     */
    async setAnswers(type) {
        QuestionRenderer.setAllAnswers(this.appState.questions, type);
        
        const displayMode = localStorage.getItem('displayMode') || 'column';
        const effectiveMode = this.appState.getEffectiveDisplayMode(displayMode);
        
        if (effectiveMode === 'column') {
            TableModeRenderer.applyAnswerColors(this.appState.config);
        } else {
            InlineModeRenderer.applyAnswerColors(this.appState.config);
        }
        
        // Auto-save for localStorage persistence
        if (this.shouldAutoSave()) {
            await this.autoSaveAnswers(type);
        }
    }

    /**
     * Check if answers should be auto-saved
     * @returns {boolean} True if auto-save should occur
     */
    shouldAutoSave() {
        return this.appState.currentFolder && 
               PersistenceManagerFactory.isEnabled(this.appState.config) &&
               PersistenceManagerFactory.getType(this.appState.config) === 'localstorage';
    }

    /**
     * Auto-save answers based on type
     * @param {string} type - Answer type: 'min', 'random', or 'max'
     */
    async autoSaveAnswers(type) {
        const answers = {};
        
        if (type === 'min') {
            this.appState.questions.forEach(question => {
                answers[question.id] = 0;
            });
        } else if (type === 'max') {
            const maxValue = this.appState.config.answers ? this.appState.config.answers.length - 1 : 4;
            this.appState.questions.forEach(question => {
                answers[question.id] = maxValue;
            });
        } else if (type === 'random') {
            const form = document.getElementById('quiz-form');
            if (form) {
                const formData = new FormData(form);
                this.appState.questions.forEach(question => {
                    const value = formData.get(`question-${question.id}`);
                    if (value !== null) {
                        answers[question.id] = parseInt(value, 10);
                    }
                });
            }
        }

        const PersistenceManager = PersistenceManagerFactory.create(this.appState.config);
        await PersistenceManager.saveAnswers(this.appState.currentFolder, answers, this.appState.config);
    }
}