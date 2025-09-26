import { URLHashManager } from '../utils/url-hash-manager.js';

/**
 * FormHandler - Manages form submission and validation
 */
export class FormHandler {
    constructor(questions, config) {
        this.questions = questions;
        this.config = config;
    }
    
    handleSubmit(event, onSuccess) {
        event.preventDefault();
        
        // Pass both questions and config to collectAnswersFromForm
        const answersArray = URLHashManager.collectAnswersFromForm(this.questions, this.config);
        
        // Safety check
        if (!Array.isArray(answersArray)) {
            console.error('answersArray is not an array:', answersArray);
            return false;
        }
        
        // Convert array to object for validation and hash update
        const answersObject = {};
        answersArray.forEach(answer => {
            if (answer && answer.questionId && answer.value !== undefined) {
                answersObject[answer.questionId] = answer.value;
            }
        });
        
        const incomplete = this.questions.filter(q => !(q.id in answersObject));
        
        if (incomplete.length > 0) {
            this.showValidationErrors(incomplete);
            return false;
        }
        
        this.clearValidationErrors();
        
        const scores = URLHashManager.calculateScores(answersArray, this.questions, this.config);
        URLHashManager.updateHash(answersObject, this.questions, this.config);
        
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
        console.log('🎛️ [DEBUG] Setting up radio change listeners with config:', {
            hasQuestions: !!this.questions,
            hasConfig: !!this.config,
            questionsCount: this.questions?.length,
            bookmarkEncoding: this.config?.bookmark_encoding
        });
        
        document.addEventListener('change', (event) => {
            if (event.target.type === 'radio' && event.target.name.startsWith('question-')) {
                console.log('📻 [DEBUG] Radio button changed:', {
                    name: event.target.name,
                    value: event.target.value,
                    questionId: event.target.name.replace('question-', '')
                });
                
                const questionId = event.target.name.replace('question-', '');
                this.clearQuestionErrorMarking(questionId);
                
                // Hash-Update für Bookmarking
                console.log('🔄 [DEBUG] About to update hash from radio change...');
                this.updateHashFromCurrentAnswers();
            }
        });
    }
    
    /**
     * Aktualisiert den URL-Hash basierend auf den aktuellen Antworten
     */
    updateHashFromCurrentAnswers() {
        console.log('🔍 [DEBUG] updateHashFromCurrentAnswers called');
        
        const form = document.getElementById('quiz-form');
        if (!form || !this.questions || !this.config) {
            console.log('❌ [DEBUG] Missing dependencies:', {
                form: !!form,
                questions: !!this.questions,
                config: !!this.config,
                questionsLength: this.questions?.length,
                configBookmarkEncoding: this.config?.bookmark_encoding
            });
            return;
        }
        
        console.log('✅ [DEBUG] Form and config found:', {
            questionsCount: this.questions.length,
            bookmarkEncoding: this.config.bookmark_encoding,
            configKeys: Object.keys(this.config)
        });
        
        const formData = new FormData(form);
        const answers = {};
        
        // Sammle alle Antworten
        this.questions.forEach(question => {
            const value = formData.get(`question-${question.id}`);
            if (value !== null) {
                answers[question.id] = parseInt(value, 10);
            }
        });
        
        console.log('📝 [DEBUG] Collected answers:', {
            answersCount: Object.keys(answers).length,
            answers: answers,
            firstFewAnswers: Object.entries(answers).slice(0, 5)
        });
        
        // Aktualisiere Hash mit Base64 falls konfiguriert
        console.log('🔄 [DEBUG] About to call URLHashManager.updateHash with:', {
            answersCount: Object.keys(answers).length,
            questionsCount: this.questions.length,
            bookmarkEncoding: this.config.bookmark_encoding
        });
        
        URLHashManager.updateHash(answers, this.questions, this.config);
        
        console.log('✅ [DEBUG] URLHashManager.updateHash completed');
        console.log('🌐 [DEBUG] Current URL after update:', window.location.href);
        
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
            console.log('🔗 [DEBUG] Updating share link display:', {
                currentUrl: currentUrl,
                hash: window.location.hash,
                isBase64Hash: window.location.hash.startsWith('#c=')
            });
            shareLinkInput.value = currentUrl;
            console.log('✅ [DEBUG] Share link display updated to:', shareLinkInput.value);
        } else {
            console.log('❌ [DEBUG] Share link input element not found during live update');
        }
    }
    
    getEffectiveDisplayMode(displayMode) {
        if (displayMode === 'responsive') {
            return window.innerWidth > 900 ? 'column' : 'inline';
        }
        return displayMode;
    }
}
