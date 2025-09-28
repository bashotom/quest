import { QuestionnaireLoader } from '../services/questionnaire-loader.js';
import { URLHashManager } from '../utils/url-hash-manager.js';
import { ChartRenderer } from '../charts/chart-renderer.js';
import { ResultRenderer } from '../components/result-renderer.js';
import { ResultTileRenderer } from '../components/result-tile-renderer.js';
import { ResultTableRenderer } from '../components/result-table-renderer.js';
import { ResultDataProcessor } from '../services/result-data-processor.js';
import { RadarLegend } from '../charts/radar/radar-legend.js';
import { DebugManager } from '../utils/debug-manager.js';

/**
 * ResultApp - Application class for the separate result page
 * Manages the questionnaire result evaluation and visualization
 */
export class ResultApp {
    constructor() {
        this.questions = [];
        this.config = {};
        this.currentFolder = '';
        this.labelState = 'short'; // Default label state
        
        // Initialize debug mode based on URL
        DebugManager.initializeFromUrl();

        this.initializeElements();
        this.setupEventListeners();

        // Show debug elements after DOM is ready
        DebugManager.showDebugElements();
    }
    
    initializeElements() {
        this.elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('error-message'),
            appContent: document.getElementById('app-content'),
            evaluationPage: document.getElementById('evaluation-page'),
            evaluationContent: document.getElementById('evaluation-content'),
            chartSection: document.getElementById('chart-section'),
            tableSectionTemplate: document.getElementById('table-section-template'),
            tilesSectionTemplate: document.getElementById('tiles-section-template'),
            shareLinkInput: document.getElementById('share-link'),
            copyButton: document.getElementById('copy-button'),
            backButton: document.getElementById('back-button'),
            backButtonTop: document.getElementById('back-button-top'),
            questionnaireTitle: document.getElementById('questionnaire-title'),
            questionnaireDescription: document.getElementById('questionnaire-description'),
            labelToggleButtons: document.getElementById('label-toggle-buttons'),
            shortLabelsBtn: document.getElementById('short-labels-btn'),
            longLabelsBtn: document.getElementById('long-labels-btn'),
            resultTableContainer: document.getElementById('result-table-container'),
            resultTilesContainer: document.getElementById('result-tiles-container')
        };
    }
    
    setupEventListeners() {
        // Hash change listener for dynamic updates
        URLHashManager.onHashChange(() => this.handleHashChange());
        
        // Global error handlers
        window.addEventListener('error', (event) => {
            console.error('Global Error:', event.error);
            this.showError('Ein unerwarteter Fehler ist aufgetreten.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            this.showError('Ein unerwarteter Fehler ist aufgetreten.');
        });

        // Label toggle buttons
        this.elements.shortLabelsBtn?.addEventListener('click', () => this.setLabelState('short'));
        this.elements.longLabelsBtn?.addEventListener('click', () => this.setLabelState('long'));
        
        // Navigation buttons
        this.elements.backButton?.addEventListener('click', () => this.goBackToQuestionnaire());
        this.elements.backButtonTop?.addEventListener('click', () => this.goBackToQuestionnaire());
        
        // Copy button
        this.elements.copyButton?.addEventListener('click', () => this.copyShareLink());
    }
    
    // Utility Methods
    showError(message) {
        this.elements.loading.style.display = 'none';
        this.elements.appContent.style.display = 'none';
        this.elements.error.style.display = 'block';
        this.elements.errorMessage.textContent = message;
    }
    
    showContent() {
        this.elements.loading.style.display = 'none';
        this.elements.error.style.display = 'none';
        this.elements.appContent.style.display = 'block';
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
    
    // Main Methods
    async loadQuestionnaire() {
        try {
            // Get questionnaire folder from URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            this.currentFolder = urlParams.get('q');
            
            if (!this.currentFolder) {
                throw new Error('Kein Fragebogen spezifiziert. Bitte wählen Sie einen Fragebogen aus.');
            }
            
            // Load questionnaire data
            const data = await QuestionnaireLoader.loadQuestionnaire(this.currentFolder);
            this.questions = data.questions;
            this.config = data.config;
            
            // Update page title and description
            this.elements.questionnaireTitle.textContent = this.config.title || 'Fragebogen Auswertung';
            this.elements.questionnaireDescription.textContent = this.config.description || '';
            
            // Update page title
            document.title = `Auswertung - ${this.config.title || 'Fragebogen'}`;
            
        } catch (error) {
            console.error('Error loading questionnaire:', error);
            throw new Error(`Fehler beim Laden des Fragebogens: ${error.message}`);
        }
    }
    
    parseScoresFromHash() {
        try {
            // Versuche zuerst Category-Scores zu parsen (neue Methode)
            let scores = URLHashManager.parseCategoryScoresFromHash(this.questions, this.config);
            
            // Fallback zur alten Methode (für Rückwärtskompatibilität)
            if (!scores) {
                scores = URLHashManager.parseScoresFromHash(this.questions, this.config);
            }
            
            if (!scores) {
                throw new Error('Keine gültigen Auswertungsdaten gefunden.');
            }
            return scores;
        } catch (error) {
            console.error('Error parsing scores from hash:', error);
            throw new Error('Die Auswertungsdaten konnten nicht gelesen werden.');
        }
    }
    
    renderEvaluation(scores) {
        const chartType = this.config.chart?.type || 'radar';
        const sequence = this.config.evaluationUi?.sequence || ['chart', 'table', 'tiles'];
        
        // Show/hide label toggle buttons based on chart type
        if (this.elements.labelToggleButtons) {
            if (chartType === 'radar') {
                this.elements.labelToggleButtons.classList.remove('hidden');
                this.updateLabelToggleButtons();
            } else {
                this.elements.labelToggleButtons.classList.add('hidden');
            }
        }
        
        // Update share link
        if (this.elements.shareLinkInput) {
            this.elements.shareLinkInput.value = window.location.href;
        }
        
        // Remove any existing radar legends
        RadarLegend.remove();
        
        // Clear dynamic content area
        if (this.elements.evaluationContent) {
            this.elements.evaluationContent.innerHTML = '';
        }
        
        // Process data once for all renderers
        const processedData = ResultDataProcessor.process(scores, this.questions, this.config);
        
        // Render elements in the specified sequence
        sequence.forEach(element => {
            this.renderSequenceElement(element, scores, processedData, chartType);
        });
    }
    
    renderSequenceElement(element, scores, processedData, chartType) {
        if (!this.elements.evaluationContent) return;
        
        switch (element) {
            case 'chart':
                this.renderChartInSequence(scores, chartType);
                break;
            case 'table':
                this.renderTableInSequence(processedData);
                break;
            case 'tiles':
                this.renderTilesInSequence(processedData);
                break;
            default:
                console.warn(`Unknown evaluation_ui sequence element: ${element}`);
        }
    }
    
    renderChartInSequence(scores, chartType) {
        // Move chart section into dynamic content area
        const chartSection = this.elements.chartSection;
        if (chartSection) {
            // Remove from original position and add to dynamic content
            chartSection.remove();
            chartSection.classList.remove('hidden'); // Make it visible
            this.elements.evaluationContent.appendChild(chartSection);
            
            // Clear chart containers
            const radarContainer = document.getElementById('radar-chart-container');
            const legendContainer = document.getElementById('radar-legend-container');
            if (radarContainer) {
                radarContainer.innerHTML = '<div id="radarChart" class="w-full h-full radar-chart flex justify-center items-center"></div>';
            }
            if (legendContainer) {
                legendContainer.innerHTML = '';
            }
            
            // Render chart
            ChartRenderer.render(chartType, scores, this.questions, this.config, { 
                labelState: this.labelState, 
                skipResultTable: true  // Skip result table/tiles rendering in sequence mode
            });
        }
    }
    
    renderTableInSequence(processedData) {
        // Only render if table is enabled
        if (!this.config.resulttable?.enabled) return;
        
        // Clone template and add to dynamic content
        const template = this.elements.tableSectionTemplate;
        if (template) {
            const tableSection = template.cloneNode(true);
            tableSection.id = 'table-section';
            tableSection.classList.remove('hidden');
            this.elements.evaluationContent.appendChild(tableSection);
            
            // Get the container within the cloned section
            const tableContainer = tableSection.querySelector('#result-table-container');
            if (tableContainer) {
                // Give it a unique ID to avoid conflicts
                tableContainer.id = 'result-table-container-active';
                ResultTableRenderer.render(processedData, this.config, tableContainer);
            }
        }
    }
    
    renderTilesInSequence(processedData) {
        // Only render if tiles are enabled  
        if (!this.config.resulttiles?.enabled) return;
        
        // Clone template and add to dynamic content
        const template = this.elements.tilesSectionTemplate;
        if (template) {
            const tilesSection = template.cloneNode(true);
            tilesSection.id = 'tiles-section';
            tilesSection.classList.remove('hidden');
            this.elements.evaluationContent.appendChild(tilesSection);
            
            // Get the container within the cloned section
            const tilesContainer = tilesSection.querySelector('#result-tiles-container');
            if (tilesContainer) {
                // Give it a unique ID to avoid conflicts
                tilesContainer.id = 'result-tiles-container-active';
                ResultTileRenderer.render(processedData, this.config, tilesContainer);
            }
        }
    }
    
    setLabelState(state) {
        this.labelState = state;
        this.updateLabelToggleButtons();
        
        // Re-render chart with new label state
        const scores = this.parseScoresFromHash();
        if (scores) {
            const chartType = this.config.chart?.type || 'radar';
            ChartRenderer.render(chartType, scores, this.questions, this.config, { 
                labelState: this.labelState,
                skipResultTable: true  // Skip result table/tiles rendering in sequence mode
            });
        }
    }
    
    updateLabelToggleButtons() {
        if (!this.elements.shortLabelsBtn || !this.elements.longLabelsBtn) return;
        
        // Reset button states
        [this.elements.shortLabelsBtn, this.elements.longLabelsBtn].forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('text-gray-700', 'hover:text-gray-900');
        });
        
        // Set active state
        const activeBtn = this.labelState === 'short' ? this.elements.shortLabelsBtn : this.elements.longLabelsBtn;
        activeBtn.classList.remove('text-gray-700', 'hover:text-gray-900');
        activeBtn.classList.add('bg-blue-600', 'text-white');
    }
    
    goBackToQuestionnaire() {
        // Navigate back to the questionnaire form with the current folder
        const baseUrl = window.location.origin + window.location.pathname.replace('/result.html', '/');
        let questionnaireUrl = `${baseUrl}?q=${this.currentFolder}`;
        
        // Preserve debug mode if active
        if (DebugManager.isDebugMode()) {
            questionnaireUrl += '&debug=true';
        }
        
        window.location.href = questionnaireUrl;
    }
    
    copyShareLink() {
        this.elements.shareLinkInput.select();
        navigator.clipboard.writeText(this.elements.shareLinkInput.value).then(() => {
            const originalText = this.elements.copyButton.textContent;
            this.elements.copyButton.textContent = 'Kopiert!';
            this.elements.copyButton.classList.add('bg-green-600');
            this.elements.copyButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            
            setTimeout(() => {
                this.elements.copyButton.textContent = originalText;
                this.elements.copyButton.classList.remove('bg-green-600');
                this.elements.copyButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
            }, 2000);
        }).catch(err => {
            console.error('Fehler beim Kopieren:', err);
            this.showTemporaryMessage('Fehler beim Kopieren der URL.', 'error');
        });
    }
    
    async handleHashChange() {
        try {
            const scores = this.parseScoresFromHash();
            this.renderEvaluation(scores);
        } catch (error) {
            console.error('Error handling hash change:', error);
            this.showError(error.message);
        }
    }
    
    // Initialize application
    async init() {
        try {
            // Load questionnaire data
            await this.loadQuestionnaire();
            
            // Parse scores
            const scores = this.parseScoresFromHash();
            
            // Show content first
            this.showContent();
            
            // Wait for DOM to be fully rendered before rendering charts
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.renderEvaluation(scores);
                });
            });
            
        } catch (error) {
            console.error('Error initializing result app:', error);
            this.showError(error.message);
        }
    }
}