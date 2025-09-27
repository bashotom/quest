import { AppState } from './app-state.js';
import { UIManager } from './ui-manager.js';
import { NavigationHandler } from './navigation-handler.js';
import { FormEventHandler } from './form-event-handler.js';
import { QuestionnaireRenderer } from './questionnaire-renderer.js';
import { DebugManager } from '../utils/debug-manager.js';

/**
 * QuestionnaireApp - Main application class (Refactored)
 * Orchestrates all application modules and maintains backward compatibility
 */
export class QuestionnaireApp {
    constructor() {
        window.questionnaireApp = this; // Expose instance for debugging
        
        // Initialize modular components
        this.appState = new AppState();
        this.uiManager = new UIManager();
        this.navigationHandler = new NavigationHandler(this.appState, this.uiManager);
        this.formEventHandler = new FormEventHandler(this.appState, this.uiManager, this.navigationHandler);
        this.questionnaireRenderer = new QuestionnaireRenderer(this.appState, this.uiManager, this.formEventHandler);
        
        // Set circular references
        this.navigationHandler.setQuestionnaireRenderer(this.questionnaireRenderer);
        
        // Initialize debug mode
        DebugManager.initialize();
        DebugManager.showDebugElements();
        
        if (DebugManager.isDebugMode()) {
            this.setupDebugFeatures();
        }
    }
    

    
    // Delegate methods to appropriate modules
    showError(message) { 
        return this.uiManager.showError(message); 
    }
    
    showTemporaryMessage(message, type) { 
        return this.uiManager.showTemporaryMessage(message, type); 
    }

    showContent() {
        return this.uiManager.showContent();
    }
    
    async showForm() { 
        return this.uiManager.showForm(this.appState.config, this.appState.currentFolder); 
    }
    
    showEvaluation(scores) {
        return this.navigationHandler.showEvaluation(scores);
    }


    


    
    // Main interface methods
    async init() {
        window.questionnaireApp = this;
        await this.questionnaireRenderer.loadQuestionnaire();
    }
    setupDebugFeatures() {
        DebugManager.log('QuestionnaireApp Debug Features Initialized', {
            currentFolder: this.appState.currentFolder,
            questions: this.appState.questions?.length,
            config: this.appState.config
        });

        // Add debug buttons to main debug panel
        DebugManager.addDebugButton('Show App State', () => {
            console.table({
                currentFolder: this.appState.currentFolder,
                questionsCount: this.appState.questions?.length || 0,
                configType: typeof this.appState.config,
                labelState: this.appState.labelState
            });
        });

        DebugManager.addDebugButton('Show Config', () => {
            console.log('🐛 Full Config:', this.appState.config);
        });

        DebugManager.addDebugButton('Show Questions', () => {
            console.log('🐛 All Questions:', this.appState.questions);
        });

        DebugManager.addDebugButton('Clear LocalStorage', () => {
            const keys = Object.keys(localStorage);
            localStorage.clear();
            DebugManager.showNotification(`LocalStorage cleared! (${keys.length} items)`, 'success');
        });

        DebugManager.addDebugButton('Test Error', () => {
            throw new Error('🐛 Debug test error - this is intentional!');
        });
        
        // Add debug info
        DebugManager.addDebugInfo('App Version', '2.0 (Modular)');
        DebugManager.addDebugInfo('Current URL', window.location.href);
        DebugManager.addDebugInfo('URL Params', Object.fromEntries(new URLSearchParams(window.location.search)));
    }

    // Accessor properties for backward compatibility
    get questions() { return this.appState.questions; }
    get config() { return this.appState.config; }
    get currentFolder() { return this.appState.currentFolder; }
    get formHandler() { return this.appState.formHandler; }
    get elements() { return this.uiManager.elements; }
    
    set questions(value) { this.appState.questions = value; }
    set config(value) { this.appState.config = value; }
    set currentFolder(value) { this.appState.currentFolder = value; }
    set formHandler(value) { this.appState.formHandler = value; }
}

// Helper function for autoscroll to next question
window.scrollToNextQuestion = function(currentQuestionId) {
    const app = window.questionnaireApp;
    if (!app || !app.config || !app.config.questionUi || !app.config.questionUi.autoscroll) {
        return; // Autoscroll not enabled
    }
    
    if (!app.questions || app.questions.length === 0) {
        return; // No questions available
    }
    
    // Find current question index
    const currentIndex = app.questions.findIndex(q => q.id === currentQuestionId);
    if (currentIndex === -1 || currentIndex >= app.questions.length - 1) {
        return; // Current question not found or is the last question
    }
    
    // Get next question
    const nextQuestion = app.questions[currentIndex + 1];
    if (!nextQuestion) {
        return;
    }
    
    // Find the next question element and scroll to it
    setTimeout(() => {
        const nextQuestionElement = document.querySelector(`input[name="question-${nextQuestion.id}"]`);
        if (nextQuestionElement) {
            // Find the row or card container
            const container = nextQuestionElement.closest('tr') || nextQuestionElement.closest('.border');
            if (container) {
                container.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }
    }, 200); // Small delay to allow for DOM updates
};

// Global function for table mode (backward compatibility)
window.selectRadio = function(qid, aval) {
    const radio = document.querySelector(`input[name='question-${qid}'][value='${aval}']`);
    if (radio) {
        // First, reset all cells in this question row to default colors
        const allRadiosInQuestion = document.querySelectorAll(`input[name='question-${qid}']`);
        allRadiosInQuestion.forEach(r => {
            const cell = r.closest('td');
            if (cell) {
                cell.style.backgroundColor = '';
                cell.style.color = '';
                cell.classList.remove('font-medium');
            }
        });
        
        // Set the selected radio button
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Update cell background color based on answer color
        const app = window.questionnaireApp;
        if (app && app.config && app.config.answers) {
            const answer = app.config.answers[parseInt(aval)];
            if (answer && answer.color) {
                const cell = radio.closest('td');
                if (cell) {
                    cell.style.backgroundColor = answer.color;
                    cell.style.color = '#374151'; // Dark gray text for better contrast with pastel colors
                    cell.classList.add('font-medium'); // Make selected text bold
                }
            }
        }
        
        // Trigger autoscroll to next question
        window.scrollToNextQuestion(qid);
    }
};

