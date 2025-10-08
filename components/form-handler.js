import { URLHashManager } from '../utils/url-hash-manager.js';
import { PersistenceManagerFactory } from '../services/persistence-manager-factory.js';
import { DebugManager } from '../utils/debug-manager.js';

/**
 * FormHandler - Manages form submission and validation
 */
export class FormHandler {
    constructor(questions, config, currentFolder = '') {
        this.questions = questions;
        this.config = config;
        this.currentFolder = currentFolder;
    }
    
    async handleSubmit(event, onSuccess) {
        event.preventDefault();
        
        DebugManager.log('Form submission started', {
            questionsCount: this.questions?.length,
            currentFolder: this.currentFolder,
            configType: typeof this.config
        });
        
        // Check if in stepper mode - collect answers from stepper state
        let answersObject = {};
        if (this.config.questionUi?.stepper === true) {
            // Import QuestionRenderer to access stepper state
            const { QuestionRenderer } = await import('./question-renderer.js');
            if (QuestionRenderer.stepperState && QuestionRenderer.stepperState.answers) {
                answersObject = QuestionRenderer.stepperState.answers;
            }
        } else {
            // Normal mode - collect from form
            const answersArray = URLHashManager.collectAnswersFromForm(this.questions, this.config);
            
            DebugManager.log('Answers collected', { 
                answersArray,
                isArray: Array.isArray(answersArray) 
            });
            
            // Safety check
            if (!Array.isArray(answersArray)) {
                console.error('answersArray is not an array:', answersArray);
                return false;
            }
            
            // Convert array to object for validation and hash update
            answersArray.forEach(answer => {
                if (answer && answer.questionId && answer.value !== undefined) {
                    answersObject[answer.questionId] = answer.value;
                }
            });
        }
        
        const incomplete = this.questions.filter(q => !(q.id in answersObject));
        
        if (incomplete.length > 0) {
            this.showValidationErrors(incomplete);
            return false;
        }
        
        this.clearValidationErrors();
        
        // Convert answersObject to array format for score calculation
        const answersArray = Object.entries(answersObject).map(([questionId, value]) => ({
            questionId,
            value
        }));
        
        const scores = URLHashManager.calculateScores(answersArray, this.questions, this.config);
        URLHashManager.updateHash(answersObject, this.questions, this.config);
        
        // Save answers using appropriate persistence manager
        // Server persistence: Only on form submission (not on individual question changes)
        // LocalStorage persistence: Real-time auto-save
        if (this.currentFolder) {
            const PersistenceManager = PersistenceManagerFactory.create(this.config);
            try {
                await PersistenceManager.saveAnswers(this.currentFolder, answersObject, this.config);
            } catch (error) {
                console.warn('[FormHandler] Auto-save failed:', error);
            }
        }
        
        if (onSuccess) {
            onSuccess(scores);
        }
        
        return true;
    }
    
    showValidationErrors(incomplete) {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.textContent = 'Es gibt noch unbeantwortete Fragen, in Rot markiert. Bitte ausfüllen und erneut absenden.';
            errorMsg.classList.remove('hidden');
        }
        
        // Markiere unbeantwortete Fragen mit roter Umrandung
        this.markIncompleteQuestions(incomplete);
        
        // Scrolle zur ersten unbeantworteten Frage
        if (incomplete.length > 0) {
            this.scrollToQuestion(incomplete[0].id);
        }
    }
    
    clearValidationErrors() {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.classList.add('hidden');
        }
        
        // Entferne Markierungen von allen Fragen
        this.questions.forEach(question => {
            this.clearQuestionErrorMarking(question.id);
        });
    }
    
    markIncompleteQuestions(incompleteQuestions) {
        incompleteQuestions.forEach(question => {
            this.markQuestionAsIncomplete(question.id);
        });
    }

    markQuestionAsIncomplete(questionId) {
        const displayMode = localStorage.getItem('displayMode') || 'column';
        const effectiveMode = this.getEffectiveDisplayMode(displayMode);
        
        if (effectiveMode === 'column') {
            // Tabellen-Modus: Markiere die Tabellenzeile
            const row = document.querySelector(`input[name="question-${questionId}"]`)?.closest('tr');
            if (row) {
                row.classList.add('bg-red-50', 'border-red-300');
                row.style.borderColor = '#fca5a5';
                row.style.borderWidth = '2px';
            }
        } else {
            // Karten-Modus: Markiere die Karte
            const card = document.querySelector(`input[name="question-${questionId}"]`)?.closest('.border');
            if (card) {
                card.classList.remove('border-gray-200');
                card.classList.add('border-red-300', 'bg-red-50');
                card.style.borderColor = '#fca5a5';
                card.style.borderWidth = '2px';
            }
        }
    }

    clearQuestionErrorMarking(questionId) {
        const displayMode = localStorage.getItem('displayMode') || 'column';
        const effectiveMode = this.getEffectiveDisplayMode(displayMode);
        
        if (effectiveMode === 'column') {
            // Tabellen-Modus: Entferne Markierung von der Tabellenzeile
            const row = document.querySelector(`input[name="question-${questionId}"]`)?.closest('tr');
            if (row) {
                row.classList.remove('bg-red-50', 'border-red-300');
                row.style.borderColor = '';
                row.style.borderWidth = '';
            }
        } else {
            // Karten-Modus: Entferne Markierung von der Karte
            const card = document.querySelector(`input[name="question-${questionId}"]`)?.closest('.border');
            if (card) {
                card.classList.remove('border-red-300', 'bg-red-50');
                card.classList.add('border-gray-200');
                card.style.borderColor = '';
                card.style.borderWidth = '';
            }
        }
    }

    scrollToQuestion(questionId) {
        const element = document.querySelector(`input[name="question-${questionId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    setupRadioChangeListeners() {
        // Event-Listener für Radio-Buttons hinzufügen (Entfernung der Fehler-Markierung und Hash-Update)
        document.addEventListener('change', async (event) => {
            if (event.target.type === 'radio' && event.target.name.startsWith('question-')) {
                const questionId = event.target.name.replace('question-', '');
                this.clearQuestionErrorMarking(questionId);
                
                // Hash-Update für Bookmarking
                await this.updateHashFromCurrentAnswers();
                
                // Trigger autoscroll to next question
                if (window.scrollToNextQuestion) {
                    window.scrollToNextQuestion(questionId);
                }
                
                // Auto-save to localStorage if persistence is enabled
                if (this.currentFolder) {
                    const formData = new FormData(document.getElementById('quiz-form'));
                    const answers = {};
                    
                    this.questions.forEach(question => {
                        const value = formData.get(`question-${question.id}`);
                        if (value !== null) {
                            answers[question.id] = parseInt(value, 10);
                        }
                    });
                    
                    // Auto-save using appropriate persistence manager (only LocalStorage, not Server)
                    if (this.currentFolder && PersistenceManagerFactory.isEnabled(this.config)) {
                        const persistenceType = PersistenceManagerFactory.getType(this.config);
                        if (persistenceType === 'localstorage') {
                            const PersistenceManager = PersistenceManagerFactory.create(this.config);
                            try {
                                await PersistenceManager.saveAnswers(this.currentFolder, answers, this.config);
                            } catch (error) {
                                console.warn('[FormHandler] Auto-save on change failed:', error);
                            }
                        }
                    }
                    
                    // Update clear button visibility since answers were saved
                    if (window.questionnaireApp && window.questionnaireApp.updateClearButtonVisibility) {
                        window.questionnaireApp.updateClearButtonVisibility();
                    }
                }
            }
        });
    }
    
    /**
     * Aktualisiert den URL-Hash basierend auf den aktuellen Antworten
     */
    async updateHashFromCurrentAnswers() {
        const form = document.getElementById('quiz-form');
        if (!form || !this.questions || !this.config) {
            return;
        }
        
        const formData = new FormData(form);
        const answers = {};
        
        // Sammle alle Antworten
        this.questions.forEach(question => {
            const value = formData.get(`question-${question.id}`);
            if (value !== null) {
                answers[question.id] = parseInt(value, 10);
            }
        });
        
        // Aktualisiere Hash mit Base64 falls konfiguriert
        URLHashManager.updateHash(answers, this.questions, this.config);
        
        // Auto-save using appropriate persistence manager (only LocalStorage, not Server)
        if (this.currentFolder && PersistenceManagerFactory.isEnabled(this.config)) {
            const persistenceType = PersistenceManagerFactory.getType(this.config);
            if (persistenceType === 'localstorage') {
                const PersistenceManager = PersistenceManagerFactory.create(this.config);
                try {
                    await PersistenceManager.saveAnswers(this.currentFolder, answers, this.config);
                } catch (error) {
                    console.warn('[FormHandler] Auto-save on hash change failed:', error);
                }
            }
        }
        
        // WICHTIG: Share-Link auch aktualisieren bei Live-Updates!
        this.updateShareLinkDisplay();
    }
    
    /**
     * Aktualisiert die Share-Link-Anzeige mit der aktuellen URL
     */
    updateShareLinkDisplay() {
        const shareLinkInput = document.getElementById('share-link');
        if (shareLinkInput) {
            const currentUrl = window.location.href;
            shareLinkInput.value = currentUrl;
        }
    }
    
    getEffectiveDisplayMode(displayMode) {
        if (displayMode === 'responsive') {
            return window.innerWidth > 900 ? 'column' : 'inline';
        }
        return displayMode;
    }
}
