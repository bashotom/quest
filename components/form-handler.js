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
        URLHashManager.updateHash(answersObject);
        
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
        // Event-Listener für Radio-Buttons hinzufügen (Entfernung der Fehler-Markierung)
        document.addEventListener('change', (event) => {
            if (event.target.type === 'radio' && event.target.name.startsWith('question-')) {
                const questionId = event.target.name.replace('question-', '');
                this.clearQuestionErrorMarking(questionId);
            }
        });
    }
    
    getEffectiveDisplayMode(displayMode) {
        if (displayMode === 'responsive') {
            return window.innerWidth > 900 ? 'column' : 'inline';
        }
        return displayMode;
    }
}
