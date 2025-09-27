import { QuestionnaireLoader } from '../services/questionnaire-loader.js';
import { QuestionRenderer } from '../components/question-renderer.js';
import { URLHashManager } from '../utils/url-hash-manager.js';
import { PersistenceManagerFactory } from '../services/persistence-manager-factory.js';
import { DebugManager } from '../utils/debug-manager.js';

/**
 * QuestionnaireRenderer - Handles questionnaire rendering and loading
 * Manages questionnaire data loading, menu rendering, and form rendering
 */
export class QuestionnaireRenderer {
    constructor(appState, uiManager, formEventHandler) {
        this.appState = appState;
        this.uiManager = uiManager;
        this.formEventHandler = formEventHandler;
        
        // Set circular reference
        this.formEventHandler.setQuestionnaireRenderer(this);
    }

    /**
     * Render the questionnaire navigation menu
     */
    async renderMenu() {
        this.uiManager.elements.questionnaireMenu.innerHTML = '';
        
        try {
            const folders = await QuestionnaireLoader.getQuestionnaireFolders();
            
            folders.forEach(folder => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = `?q=${folder.folder}`;
                link.textContent = folder.name;
                
                if (folder.description) {
                    link.title = folder.description;
                }
                
                const isActive = folder.folder === this.appState.currentFolder;
                link.className = `px-4 py-2 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`;
                link.addEventListener('click', (e) => 
                    this.formEventHandler.navigationHandler.handleMenuNavigation(e, folder.folder)
                );
                
                li.appendChild(link);
                this.uiManager.elements.questionnaireMenu.appendChild(li);
            });
        } catch (error) {
            console.error('Fehler beim Rendern des Menüs:', error);
        }
    }

    /**
     * Render the questionnaire form
     */
    async renderForm() {
        this.uiManager.elements.questionnaireForm.innerHTML = this.getFormTemplate();
        await this.renderQuestions();
        this.formEventHandler.setupFormEvents();
        DebugManager.showDebugElements();
    }

    /**
     * Get the HTML template for the form
     * @returns {string} Form HTML template
     */
    getFormTemplate() {
        return `
            <div class="mb-4 flex justify-center gap-2 flex-wrap debug-only hidden">
                <button type="button" id="btn-column" class="border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm">Tabellen-Modus</button>
                <button type="button" id="btn-inline" class="border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm">Karten-Modus</button>
                <button type="button" id="btn-responsive" class="border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm">Responsive-Modus</button>
            </div>
            <p id="error-message" class="text-red-600 text-sm mb-4 hidden"></p>
            <form id="quiz-form">
                <div class="mb-6 sm:mb-8 flex justify-center">
                    <button type="submit" class="debug-only hidden bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-200 text-sm sm:text-base">
                        Fragebogen auswerten
                    </button>
                </div>
                <div class="questionnaire-table-scroll overflow-x-auto rounded-lg border border-gray-200 -mx-4 sm:mx-0">
                    <div id="questions-container"></div>
                </div>
                <div class="mt-6 sm:mt-8 flex justify-center">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-200 text-sm sm:text-base">
                        Fragebogen auswerten
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Render questions and handle answer loading
     */
    async renderQuestions() {
        const container = document.getElementById('questions-container');
        QuestionRenderer.render(this.appState.questions, this.appState.config, container);
        
        // Handle answer loading based on persistence settings
        if (this.appState.config.persistence?.try_reloading === true) {
            const PersistenceManager = PersistenceManagerFactory.create(this.appState.config);
            const savedAnswers = await PersistenceManager.loadAnswers(this.appState.currentFolder, this.appState.config);
            
            if (savedAnswers && Object.keys(savedAnswers).length > 0) {
                if (this.appState.config.persistence?.ask_reloading === true) {
                    this.showLoadAnswersButton(savedAnswers);
                    URLHashManager.setAnswersFromHash(this.appState.questions, this.appState.config);
                } else {
                    await this.loadSavedAnswers(savedAnswers);
                }
            } else {
                URLHashManager.setAnswersFromHash(this.appState.questions, this.appState.config);
            }
        } else {
            URLHashManager.setAnswersFromHash(this.appState.questions, this.appState.config);
        }
    }

    /**
     * Load questionnaire data and render UI
     */
    async loadQuestionnaire() {
        try {
            this.appState.currentFolder = await QuestionnaireLoader.getActiveQuestionnaire();
            const data = await QuestionnaireLoader.loadQuestionnaire(this.appState.currentFolder);
            
            this.formEventHandler.navigationHandler.cleanupLoadAnswersButton();
            
            this.appState.questions = data.questions;
            this.appState.config = data.config;
            
            this.uiManager.elements.questionnaireTitle.textContent = this.appState.config.title || 'Fragebogen';
            this.uiManager.elements.questionnaireDescription.textContent = this.appState.config.description || '';
            
            await this.renderMenu();
            await this.renderForm();
            this.uiManager.showContent();
            
            if (this.appState._forceShowForm) {
                this.appState._forceShowForm = false;
                await this.uiManager.showForm(this.appState.config, this.appState.currentFolder);
                URLHashManager.clearHash();
                this.appState._suppressHashUpdates = false;
            } else {
                await this.formEventHandler.navigationHandler.handleHashChange();
            }
        } catch (error) {
            console.error('Error loading questionnaire:', error);
            this.uiManager.showError(error.message);
        }
    }

    /**
     * Show button to manually load saved answers
     * @param {Object} savedAnswers - The saved answers data
     */
    showLoadAnswersButton(savedAnswers) {
        let container = document.getElementById('load-answers-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'load-answers-container';
            container.className = 'mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg';
            
            const description = document.getElementById('questionnaire-description');
            if (description?.parentNode) {
                description.parentNode.insertBefore(container, description.nextSibling);
            } else {
                const questionsContainer = document.getElementById('questions-container');
                if (questionsContainer?.parentNode) {
                    questionsContainer.parentNode.insertBefore(container, questionsContainer);
                }
            }
        }

        let timestampText = '';
        if (savedAnswers.timestamp) {
            const date = new Date(savedAnswers.timestamp);
            timestampText = ` vom ${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}`;
        }

        container.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-medium text-blue-900 mb-1">Gespeicherte Antworten gefunden</h3>
                    <p class="text-blue-700">Frühere Antworten${timestampText} sind verfügbar.</p>
                </div>
                <button id="load-answers-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Frühere Antworten laden
                </button>
            </div>
        `;

        const loadButton = document.getElementById('load-answers-btn');
        if (loadButton) {
            loadButton.addEventListener('click', async () => {
                await this.loadSavedAnswers(savedAnswers);
                container.remove();
            });
        }
    }

    /**
     * Load saved answers into the form
     * @param {Object} savedAnswers - The saved answers data with potential timestamp
     */
    async loadSavedAnswers(savedAnswers) {
        this.appState._suppressHashUpdates = true;
        window.questionnaire = this.appState; // Make accessible to URLHashManager
        
        const { timestamp, ...answersOnly } = savedAnswers;
        
        QuestionRenderer.setAnswers(answersOnly);
        this.appState._suppressHashUpdates = false;
        
        const displayMode = localStorage.getItem('displayMode') || 'column';
        const effectiveMode = this.appState.getEffectiveDisplayMode(displayMode);
        
        if (effectiveMode === 'column') {
            QuestionRenderer.applyAnswerColors(this.appState.config);
        } else {
            QuestionRenderer.applyInlineAnswerColors(this.appState.config);
        }
        
        this.uiManager.showTemporaryMessage('Gespeicherte Antworten wurden wiederhergestellt.', 'success');
    }
}