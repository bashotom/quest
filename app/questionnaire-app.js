import { QuestionnaireLoader } from '../services/questionnaire-loader.js';
import { URLHashManager } from '../utils/url-hash-manager.js';
import { ChartRenderer } from '../charts/chart-renderer.js';
import { QuestionRenderer } from '../components/question-renderer.js';
import { ResultRenderer } from '../components/result-renderer.js';
import { FormHandler } from '../components/form-handler.js';
import { RadarLegend } from '../charts/radar/radar-legend.js';
import { PersistenceManagerFactory } from '../services/persistence-manager-factory.js';

/**
 * QuestionnaireApp - Main application class
 * Manages the entire questionnaire application lifecycle
 */
export class QuestionnaireApp {
    constructor() {
        this.questions = [];
        this.config = {};
        this.currentFolder = '';
        this.formHandler = null;
        this.labelState = null; // Default label state is unset
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('error-message'),
            appContent: document.getElementById('app-content'),
            questionnaireForm: document.getElementById('questionnaire-form'),
            evaluationPage: document.getElementById('evaluation-page'),
            shareLinkInput: document.getElementById('share-link'),
            copyButton: document.getElementById('copy-button'),
            backButton: document.getElementById('back-button'),
            backButtonTop: document.getElementById('back-button-top'),
            questionnaireTitle: document.getElementById('questionnaire-title'),
            questionnaireDescription: document.getElementById('questionnaire-description'),
            questionnaireMenu: document.getElementById('questionnaire-menu'),
            labelToggleButtons: document.getElementById('label-toggle-buttons'),
            shortLabelsBtn: document.getElementById('short-labels-btn'),
            longLabelsBtn: document.getElementById('long-labels-btn')
        };
    }
    
    setupEventListeners() {
        // Hash change listener
        URLHashManager.onHashChange(() => this.handleHashChange());
        
        // Global error handlers
        window.addEventListener('error', (event) => {
            console.error('Global Error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
        });

        // Label toggle buttons
        this.elements.shortLabelsBtn?.addEventListener('click', () => this.setLabelState('short'));
        this.elements.longLabelsBtn?.addEventListener('click', () => this.setLabelState('long'));
    }
    
    // Utility Methods
    showError(message) {
        this.elements.loading.style.display = 'none';
        this.elements.appContent.style.display = 'none';
        this.elements.error.style.display = 'block';
        this.elements.errorMessage.textContent = message;
    }
    
    showTemporaryMessage(message, type = 'info') {
        // Create or get temporary message element
        let messageEl = document.getElementById('temp-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'temp-message';
            messageEl.className = 'fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white font-medium transform translate-x-full transition-transform duration-300';
            document.body.appendChild(messageEl);
        }
        
        // Set colors based on type
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600',
            warning: 'bg-yellow-600'
        };
        
        messageEl.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white font-medium transition-transform duration-300 ${colors[type] || colors.info}`;
        messageEl.textContent = message;
        
        // Show message
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 50);
        
        // Hide message after 3 seconds
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    showContent() {
        this.elements.loading.style.display = 'none';
        this.elements.error.style.display = 'none';
        this.elements.appContent.style.display = 'block';
    }
    
    async showForm() {
        this.elements.questionnaireForm.classList.remove('hidden');
        this.elements.evaluationPage.classList.add('hidden');
        
        if (this.elements.labelToggleButtons) {
            this.elements.labelToggleButtons.classList.add('hidden');
        }

        // Buttons wieder anzeigen
        ['min-answers-btn', 'random-answers-btn', 'max-answers-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = '';
        });
        
        // Show/hide clear saved button based on persistence settings and saved data
        await this.updateClearButtonVisibility();
        
        // Navigation Menu wieder anzeigen
        if (this.elements.questionnaireMenu && this.elements.questionnaireMenu.parentElement) {
            this.elements.questionnaireMenu.parentElement.style.display = '';
        }
    }

    showEvaluation() {
        // Remove any existing legend before showing new evaluation
        RadarLegend.remove();

        this.elements.questionnaireForm.classList.add('hidden');
        this.elements.evaluationPage.classList.remove('hidden');
        
        if (this.elements.labelToggleButtons) {
            if (this.config.chart?.type === 'radar') {
                this.elements.labelToggleButtons.classList.remove('hidden');
            } else {
                this.elements.labelToggleButtons.classList.add('hidden');
            }
        }

        // Buttons ausblenden
        ['min-answers-btn', 'random-answers-btn', 'max-answers-btn', 'clear-saved-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
        
        // Navigation Menu ausblenden
        if (this.elements.questionnaireMenu && this.elements.questionnaireMenu.parentElement) {
            this.elements.questionnaireMenu.parentElement.style.display = 'none';
        }
        
        // Render result table if not already present
        const tableContainer = document.getElementById('result-table-container');
        if (tableContainer && !tableContainer.hasChildNodes()) {
            const scores = URLHashManager.parseScoresFromHash(this.questions, this.config);
            if (scores) {
                ResultRenderer.render(scores, this.questions, this.config, tableContainer);
            }
        }

        // DOM-Update abwarten
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('resize'));
            });
        });
    }
    
    // UI Rendering
    async renderMenu() {
        this.elements.questionnaireMenu.innerHTML = '';
        
        try {
            const folders = await QuestionnaireLoader.getQuestionnaireFolders();
            
            folders.forEach(folder => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = `?q=${folder.folder}`;
                link.textContent = folder.name;
                
                // Optional: Tooltip mit Beschreibung
                if (folder.description) {
                    link.title = folder.description;
                }
                
                link.className = `px-4 py-2 rounded-lg ${folder.folder === this.currentFolder ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`;
                link.addEventListener('click', (e) => this.handleMenuNavigation(e, folder.folder));
                li.appendChild(link);
                this.elements.questionnaireMenu.appendChild(li);
            });
        } catch (error) {
            console.error('Fehler beim Rendern des Menüs:', error);
        }
    }
    
    async renderForm() {
        this.elements.questionnaireForm.innerHTML = `
            <div class="mb-4 flex justify-center gap-2 flex-wrap">
                <button type="button" id="btn-column" class="border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm">Tabellen-Modus</button>
                <button type="button" id="btn-inline" class="border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm">Karten-Modus</button>
                <button type="button" id="btn-responsive" class="border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm">Responsive-Modus</button>
            </div>
            <p id="error-message" class="text-red-600 text-sm mb-4 hidden"></p>
            <form id="quiz-form">
                <div class="mb-6 sm:mb-8 flex justify-center">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-200 text-sm sm:text-base">
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

        await this.renderQuestions();
        this.setupFormEvents();
    }
    
    async renderQuestions() {
        const container = document.getElementById('questions-container');
        QuestionRenderer.render(this.questions, this.config, container);
        
        // Try to load saved answers using appropriate persistence manager
        const PersistenceManager = PersistenceManagerFactory.create(this.config);
        const savedAnswers = await PersistenceManager.loadAnswers(this.currentFolder, this.config);
        if (savedAnswers && Object.keys(savedAnswers).length > 0) {
            // Set saved answers in the form
            QuestionRenderer.setAnswers(savedAnswers);
            
            // Apply colors based on display mode
            const displayMode = localStorage.getItem('displayMode') || 'column';
            const effectiveMode = this.getEffectiveDisplayMode(displayMode);
            if (effectiveMode === 'column') {
                QuestionRenderer.applyAnswerColors(this.config);
            } else {
                QuestionRenderer.applyInlineAnswerColors(this.config);
            }
            
            // Show user feedback about loaded answers
            this.showTemporaryMessage('Gespeicherte Antworten wurden wiederhergestellt.', 'success');
        } else {
            // Fallback to URL hash if no saved answers
            URLHashManager.setAnswersFromHash(this.questions, this.config);
        }
    }
    
    renderEvaluation(scores) {
        const chartType = this.config.chart?.type || 'radar';
        
        // Share link aktualisieren
        if (this.elements.shareLinkInput) {
            const currentUrl = window.location.href;
            this.elements.shareLinkInput.value = currentUrl;
        }
        
        // Ensure evaluation page is visible before rendering chart
        const evaluationPage = this.elements.evaluationPage;
        if (evaluationPage.classList.contains('hidden')) {
            setTimeout(() => this.renderEvaluation(scores), 100);
            return;
        }
        
        // Clear only chart and legend containers
        const radarContainer = document.getElementById('radar-chart-container');
        const legendContainer = document.getElementById('radar-legend-container');
        if (radarContainer) radarContainer.innerHTML = '<div id="radarChart" class="w-full h-full radar-chart flex justify-center items-center"></div>';
        if (legendContainer) legendContainer.innerHTML = '';

        ChartRenderer.render(chartType, scores, this.questions, this.config, { labelState: this.labelState });
    }
    
    // Event Handlers
    setupFormEvents() {
        // Display mode buttons
        document.getElementById('btn-column')?.addEventListener('click', () => {
            localStorage.setItem('displayMode', 'column');
            this.renderQuestions();
        });

        document.getElementById('btn-inline')?.addEventListener('click', () => {
            localStorage.setItem('displayMode', 'inline');
            this.renderQuestions();
        });

        document.getElementById('btn-responsive')?.addEventListener('click', () => {
            localStorage.setItem('displayMode', 'responsive');
            this.renderQuestions();
        });

        // Form handler
        this.formHandler = new FormHandler(this.questions, this.config, this.currentFolder);
        this.formHandler.setupRadioChangeListeners();
        
        // Form submission
        document.getElementById('quiz-form')?.addEventListener('submit', async (event) => {
            await this.formHandler.handleSubmit(event, (scores) => {
                this.showEvaluation();
                
                // Wait for UI transition to complete
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.renderEvaluation(scores);
                    });
                });
            });
        });

        // Answer buttons
        document.getElementById('min-answers-btn')?.addEventListener('click', async () => {
            QuestionRenderer.setAllAnswers(this.questions, 'min');
            // Apply colors after setting answers
            const displayMode = localStorage.getItem('displayMode') || 'column';
            const effectiveMode = this.getEffectiveDisplayMode(displayMode);
            if (effectiveMode === 'column') {
                QuestionRenderer.applyAnswerColors(this.config);
            } else {
                QuestionRenderer.applyInlineAnswerColors(this.config);
            }
            
            // Auto-save to localStorage if persistence is enabled (not Server)
            if (this.currentFolder && PersistenceManagerFactory.isEnabled(this.config)) {
                const persistenceType = PersistenceManagerFactory.getType(this.config);
                if (persistenceType === 'localstorage') {
                    const answers = {};
                    this.questions.forEach(question => {
                        answers[question.id] = 0; // min value
                    });
                    const PersistenceManager = PersistenceManagerFactory.create(this.config);
                    await PersistenceManager.saveAnswers(this.currentFolder, answers, this.config);
                }
            }
        });
        document.getElementById('random-answers-btn')?.addEventListener('click', async () => {
            QuestionRenderer.setAllAnswers(this.questions, 'random');
            // Apply colors after setting answers
            const displayMode = localStorage.getItem('displayMode') || 'column';
            const effectiveMode = this.getEffectiveDisplayMode(displayMode);
            if (effectiveMode === 'column') {
                QuestionRenderer.applyAnswerColors(this.config);
            } else {
                QuestionRenderer.applyInlineAnswerColors(this.config);
            }
            
            // Auto-save to localStorage if persistence is enabled (not Server)
            if (this.currentFolder && PersistenceManagerFactory.isEnabled(this.config)) {
                const persistenceType = PersistenceManagerFactory.getType(this.config);
                if (persistenceType === 'localstorage') {
                    const form = document.getElementById('quiz-form');
                    if (form) {
                        const formData = new FormData(form);
                        const answers = {};
                        this.questions.forEach(question => {
                            const value = formData.get(`question-${question.id}`);
                            if (value !== null) {
                                answers[question.id] = parseInt(value, 10);
                            }
                        });
                        const PersistenceManager = PersistenceManagerFactory.create(this.config);
                        await PersistenceManager.saveAnswers(this.currentFolder, answers, this.config);
                    }
                }
            }
        });
        document.getElementById('max-answers-btn')?.addEventListener('click', async () => {
            QuestionRenderer.setAllAnswers(this.questions, 'max');
            // Apply colors after setting answers
            const displayMode = localStorage.getItem('displayMode') || 'column';
            const effectiveMode = this.getEffectiveDisplayMode(displayMode);
            if (effectiveMode === 'column') {
                QuestionRenderer.applyAnswerColors(this.config);
            } else {
                QuestionRenderer.applyInlineAnswerColors(this.config);
            }
            
            // Auto-save to localStorage if persistence is enabled (not Server)
            if (this.currentFolder && PersistenceManagerFactory.isEnabled(this.config)) {
                const persistenceType = PersistenceManagerFactory.getType(this.config);
                if (persistenceType === 'localstorage') {
                    const maxValue = this.config.answers ? this.config.answers.length - 1 : 4;
                    const answers = {};
                    this.questions.forEach(question => {
                        answers[question.id] = maxValue; // max value
                    });
                    const PersistenceManager = PersistenceManagerFactory.create(this.config);
                    await PersistenceManager.saveAnswers(this.currentFolder, answers, this.config);
                }
            }
        });

        // Clear saved answers button
        document.getElementById('clear-saved-btn')?.addEventListener('click', async () => {
            const PersistenceManager = PersistenceManagerFactory.create(this.config);
            await PersistenceManager.clearAnswers(this.currentFolder);
            
            // Clear current form answers
            const radioInputs = document.querySelectorAll('input[type="radio"]');
            radioInputs.forEach(input => {
                input.checked = false;
            });
            
            // Reset all colors (both table and inline mode)
            QuestionRenderer.resetAllColors();
            
            // Update button visibility (should hide now since no saved answers exist)
            await this.updateClearButtonVisibility();
            
            // Show success message
            this.showTemporaryMessage('Gespeicherte Antworten wurden gelöscht.', 'success');
        });

        // Back and copy buttons
        this.elements.backButton?.addEventListener('click', async () => {
            await this.showForm();
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
        });

        this.elements.backButtonTop?.addEventListener('click', async () => {
            await this.showForm();
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
        });

        this.elements.copyButton?.addEventListener('click', () => {
            this.elements.shareLinkInput.select();
            navigator.clipboard.writeText(this.elements.shareLinkInput.value).then(() => {
                this.elements.copyButton.textContent = 'Kopiert!';
                setTimeout(() => this.elements.copyButton.textContent = 'Kopieren', 2000);
            }).catch(err => console.error('Fehler beim Kopieren:', err));
        });
    }

    setLabelState(state) {
        this.labelState = state;
        const scores = URLHashManager.parseScoresFromHash(this.questions, this.config);
        if (scores) {
            // Only re-render the chart, not the whole evaluation page
            const chartType = this.config.chart?.type || 'radar';
            ChartRenderer.render(chartType, scores, this.questions, this.config, { labelState: this.labelState });
        }
    }
    
    handleMenuNavigation(event, folder) {
        event.preventDefault();
        
        const url = new URL(window.location);
        url.searchParams.set('q', folder);
        url.hash = '';
        window.history.pushState(null, null, url);
        
        this.currentFolder = folder;
        
        // Set flag to force showing form after questionnaire load
        this._forceShowForm = true;
        
        this.loadQuestionnaire();
    }

    async handleHashChange() {
        if (!this.questions || this.questions.length === 0 || !this.config) {
            return;
        }
        
        const scores = URLHashManager.parseScoresFromHash(this.questions, this.config);
        if (scores) {
            this.renderEvaluation(scores);
            this.showEvaluation();
        } else {
            await this.showForm();
            URLHashManager.setAnswersFromHash(this.questions, this.config);
        }
    }
    
        // Main Application Methods
    async loadQuestionnaire() {
        try {
            this.currentFolder = await QuestionnaireLoader.getActiveQuestionnaire();
            const data = await QuestionnaireLoader.loadQuestionnaire(this.currentFolder);
            
            this.questions = data.questions;
            this.config = data.config;
            
            this.elements.questionnaireTitle.textContent = this.config.title || 'Fragebogen';
            this.elements.questionnaireDescription.textContent = this.config.description || '';
            
            await this.renderMenu();
            await this.renderForm();
            this.showContent();
            
            // Check if we should force showing the form (e.g., after menu navigation)
            if (this._forceShowForm) {
                this._forceShowForm = false; // Clear the flag
                await this.showForm();
            } else {
                // Handle initial hash if present
                await this.handleHashChange();
            }
        } catch (error) {
            console.error('Error loading questionnaire:', error);
            this.showError(error.message);
        }
    }
    
    // Initialize application
    async init() {
        // Set global reference for backward compatibility
        window.questionnaireApp = this;
        await this.loadQuestionnaire();
    }
    
    getEffectiveDisplayMode(displayMode) {
        if (displayMode === 'responsive') {
            return window.innerWidth > 900 ? 'column' : 'inline';
        }
        return displayMode;
    }
    
    async updateClearButtonVisibility() {
        const clearSavedBtn = document.getElementById('clear-saved-btn');
        if (clearSavedBtn) {
            if (PersistenceManagerFactory.isEnabled(this.config)) {
                const PersistenceManager = PersistenceManagerFactory.create(this.config);
                const savedAnswers = await PersistenceManager.loadAnswers(this.currentFolder, this.config);
                if (savedAnswers && Object.keys(savedAnswers).length > 0) {
                    clearSavedBtn.style.display = '';
                } else {
                    clearSavedBtn.style.display = 'none';
                }
            } else {
                clearSavedBtn.style.display = 'none';
            }
        }
    }
}

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
    }
};
