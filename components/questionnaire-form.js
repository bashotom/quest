import { URLHashManager } from '../utils/url-hash-manager.js';

/**
 * WebComponent für das Fragebogen-Formular
 * Behandelt die Darstellung und Interaktion mit den Fragen
 */
class QuestionnaireForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // State
        this.questions = [];
        this.config = {};
        this.displayMode = 'column'; // 'column' oder 'inline'
        
        // Bind methods
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleRadioChange = this.handleRadioChange.bind(this);
        this.handleDisplayModeChange = this.handleDisplayModeChange.bind(this);
    }

    static get observedAttributes() {
        return ['display-mode'];
    }

    connectedCallback() {
        this.displayMode = localStorage.getItem('displayMode') || 'column';
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'display-mode' && oldValue !== newValue) {
            this.displayMode = newValue;
            this.render();
        }
    }

    /**
     * Setzt die Daten für das Formular
     * @param {Array} questions - Die Fragen
     * @param {Object} config - Die Konfiguration
     */
    setData(questions, config) {
        this.questions = questions;
        this.config = config;
        this.render();
        
        // Antworten aus Hash setzen, falls vorhanden
        URLHashManager.setAnswersFromHash(this.questions, this.config);
        this.updateHighlighting();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .form-container {
                    max-width: 100%;
                    margin: 0 auto;
                }

                .display-mode-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .mode-button {
                    padding: 0.5rem 1rem;
                    border: 1px solid #3b82f6;
                    background: white;
                    color: #3b82f6;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.15s;
                    font-size: 0.875rem;
                }

                .mode-button.active {
                    background: #3b82f6;
                    color: white;
                }

                .mode-button:hover:not(.active) {
                    background: #dbeafe;
                }

                .submit-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin: 2rem 0;
                }

                .submit-button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.15s;
                }

                .submit-button:hover {
                    background: #2563eb;
                }

                .error-message {
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    color: #dc2626;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                    display: none;
                }

                /* Table Mode Styles */
                .table-container {
                    overflow-x: auto;
                    border-radius: 0.5rem;
                    border: 1px solid #e5e7eb;
                    margin: 1rem 0;
                }

                .questions-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .questions-table th {
                    background: #f9fafb;
                    padding: 0.75rem;
                    text-align: left;
                    font-weight: 500;
                    border-bottom: 1px solid #e5e7eb;
                }

                .questions-table td {
                    padding: 0.75rem;
                    border-bottom: 1px solid #f3f4f6;
                    cursor: pointer;
                    transition: background 0.15s;
                }

                .questions-table td:hover {
                    background: #f9fafb;
                }

                .questions-table tr.answered {
                    background: #f0f9ff;
                }

                .questions-table tr.answered:hover {
                    background: #e0f2fe;
                }

                /* Inline Mode Styles */
                .questions-inline {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .question-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .question-card.answered {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 1px #3b82f6;
                }

                .question-text {
                    font-weight: 500;
                    margin-bottom: 1rem;
                    color: #1f2937;
                }

                .answer-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .answer-option {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 0.375rem;
                    transition: background 0.15s;
                }

                .answer-option:hover {
                    background: #f3f4f6;
                }

                .answer-option input[type="radio"] {
                    margin: 0;
                }

                @media (max-width: 640px) {
                    .display-mode-buttons {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .submit-buttons {
                        flex-direction: column;
                    }

                    .answer-options {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .questions-table th,
                    .questions-table td {
                        padding: 0.5rem;
                        font-size: 0.875rem;
                    }
                }
            </style>

            <div class="form-container">
                <div class="display-mode-buttons">
                    <button type="button" class="mode-button ${this.displayMode === 'column' ? 'active' : ''}" data-mode="column">
                        Tabellen-Modus
                    </button>
                    <button type="button" class="mode-button ${this.displayMode === 'inline' ? 'active' : ''}" data-mode="inline">
                        Karten-Modus
                    </button>
                </div>

                <div class="error-message" id="error-message"></div>

                <form id="questionnaire-form">
                    <div class="submit-buttons">
                        <button type="submit" class="submit-button">
                            Fragebogen auswerten
                        </button>
                    </div>

                    <div id="questions-container">
                        <!-- Questions will be rendered here -->
                    </div>

                    <div class="submit-buttons">
                        <button type="submit" class="submit-button">
                            Fragebogen auswerten
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.renderQuestions();
    }

    renderQuestions() {
        const container = this.shadowRoot.getElementById('questions-container');
        if (!container || this.questions.length === 0) return;

        if (this.displayMode === 'column') {
            this.renderTableMode(container);
        } else {
            this.renderInlineMode(container);
        }
    }

    renderTableMode(container) {
        const fewAnswers = this.config.answers?.length === 2;
        const questionWidth = fewAnswers ? 'w-3/4' : 'w-1/2';

        let html = `
            <div class="table-container">
                <table class="questions-table">
                    <thead>
                        <tr>
                            <th style="width: ${fewAnswers ? '75%' : '50%'}">Frage</th>
        `;

        this.config.answers?.forEach(answer => {
            html += `<th style="text-align: center; width: ${fewAnswers ? '12.5%' : (50 / this.config.answers.length) + '%'}">${answer.label}</th>`;
        });

        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.questions.forEach(question => {
            html += `
                <tr data-question="${question.id}">
                    <td class="question-text">${question.text}</td>
            `;

            this.config.answers?.forEach((answer, index) => {
                html += `
                    <td style="text-align: center;" onclick="this.querySelector('input').checked = true; this.dispatchEvent(new Event('change', {bubbles: true}))">
                        <input type="radio" name="question-${question.id}" value="${index}" style="margin: 0;">
                    </td>
                `;
            });

            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    renderInlineMode(container) {
        let html = '<div class="questions-inline">';

        this.questions.forEach(question => {
            html += `
                <div class="question-card" data-question="${question.id}">
                    <div class="question-text">${question.text}</div>
                    <div class="answer-options">
            `;

            this.config.answers?.forEach((answer, index) => {
                html += `
                    <label class="answer-option">
                        <input type="radio" name="question-${question.id}" value="${index}">
                        <span>${answer.label}</span>
                    </label>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    setupEventListeners() {
        // Display mode buttons
        this.shadowRoot.querySelectorAll('.mode-button').forEach(button => {
            button.addEventListener('click', this.handleDisplayModeChange);
        });

        // Form submission
        const form = this.shadowRoot.getElementById('questionnaire-form');
        form?.addEventListener('submit', this.handleSubmit);

        // Radio change events
        this.shadowRoot.addEventListener('change', this.handleRadioChange);
    }

    handleDisplayModeChange(event) {
        const newMode = event.target.dataset.mode;
        if (!newMode || newMode === this.displayMode) return;

        // Speichere aktuelle Antworten
        const currentAnswers = this.getCurrentAnswers();

        // Wechsle Modus
        this.displayMode = newMode;
        localStorage.setItem('displayMode', newMode);

        // Neu rendern
        this.render();

        // Antworten wiederherstellen
        this.restoreAnswers(currentAnswers);
        this.updateHighlighting();

        // Custom event dispatchen
        this.dispatchEvent(new CustomEvent('displayModeChanged', {
            detail: { mode: newMode },
            bubbles: true
        }));
    }

    handleSubmit(event) {
        event.preventDefault();

        const answers = this.getCurrentAnswers();
        const incomplete = this.getIncompleteQuestions(answers);

        if (incomplete.length > 0) {
            this.showError(`Bitte beantworten Sie alle Fragen. Fehlende Antworten: ${incomplete.join(', ')}`);
            return;
        }

        this.hideError();

        // Custom event dispatchen
        this.dispatchEvent(new CustomEvent('formSubmit', {
            detail: { answers },
            bubbles: true
        }));
    }

    handleRadioChange(event) {
        if (event.target.type === 'radio') {
            this.updateHighlighting();
            this.hideError();

            // Update URL hash
            const answers = this.getCurrentAnswers();
            URLHashManager.updateHash(answers, this.questions, this.config);

            // Custom event dispatchen
            this.dispatchEvent(new CustomEvent('answerChanged', {
                detail: { 
                    questionId: event.target.name.replace('question-', ''),
                    answerIndex: event.target.value,
                    answers 
                },
                bubbles: true
            }));
        }
    }

    getCurrentAnswers() {
        const answers = {};
        this.questions.forEach(question => {
            const radio = this.shadowRoot.querySelector(`input[name="question-${question.id}"]:checked`);
            if (radio) {
                answers[question.id] = radio.value;
            }
        });
        return answers;
    }

    getIncompleteQuestions(answers) {
        return this.questions
            .filter(question => !(question.id in answers))
            .map(question => question.id);
    }

    restoreAnswers(answers) {
        Object.entries(answers).forEach(([questionId, answerIndex]) => {
            const radio = this.shadowRoot.querySelector(`input[name="question-${questionId}"][value="${answerIndex}"]`);
            if (radio) {
                radio.checked = true;
            }
        });
    }

    updateHighlighting() {
        const answers = this.getCurrentAnswers();

        this.questions.forEach(question => {
            const isAnswered = question.id in answers;
            const questionElement = this.shadowRoot.querySelector(`[data-question="${question.id}"]`);
            
            if (questionElement) {
                if (isAnswered) {
                    questionElement.classList.add('answered');
                } else {
                    questionElement.classList.remove('answered');
                }
            }
        });
    }

    showError(message) {
        const errorElement = this.shadowRoot.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    hideError() {
        const errorElement = this.shadowRoot.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Setzt alle Antworten auf einen bestimmten Wert
     * @param {string} mode - 'min', 'max', oder 'random'
     */
    setAllAnswers(mode) {
        this.questions.forEach(question => {
            const radios = this.shadowRoot.querySelectorAll(`input[name="question-${question.id}"]`);
            if (radios.length === 0) return;

            let targetRadio;
            switch (mode) {
                case 'min':
                    targetRadio = radios[0];
                    break;
                case 'max':
                    targetRadio = radios[radios.length - 1];
                    break;
                case 'random':
                    targetRadio = radios[Math.floor(Math.random() * radios.length)];
                    break;
            }

            if (targetRadio) {
                targetRadio.checked = true;
            }
        });

        this.updateHighlighting();
        
        // Update hash
        const answers = this.getCurrentAnswers();
        URLHashManager.updateHash(answers, this.questions, this.config);
    }

    /**
     * Setzt Antworten aus dem URL-Hash
     */
    setAnswersFromHash() {
        URLHashManager.setAnswersFromHash(this.questions, this.config);
        this.updateHighlighting();
    }
}

// Register the custom element
customElements.define('questionnaire-form', QuestionnaireForm);
