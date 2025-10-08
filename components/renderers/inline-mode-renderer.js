import { ColorManager } from '../utils/color-manager.js';

/**
 * InlineModeRenderer - Handles rendering of questionnaires in inline/card mode
 */
export class InlineModeRenderer {
    /**
     * Render questions in inline (card) mode
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element to render into
     */
    static render(questions, config, container) {
        let html = '<div class="space-y-4">';
        
        questions.forEach((question) => {
            html += `
                <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <h3 class="text-lg font-medium text-gray-900 mb-3">${question.text || question.question}</h3>
                    <div class="space-y-2">
                        ${config.answers?.map((answer, index) => {
                            const label = answer.label || Object.keys(answer)[0];
                            const answerColor = answer.color || '#e5e7eb';
                            const answerSize = config.input?.size || 5;
                            return `
                                <label class="answer-label block p-${answerSize} border-2 border-gray-200 rounded-lg cursor-pointer transition-colors hover:bg-gray-50" data-answer-color="${answerColor}">
                                    <input type="radio" name="question-${question.id}" value="${index}" class="mr-2">
                                    ${label}
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        
        // Setup event listeners for hover and change effects
        InlineModeRenderer.setupHoverEffects();
        InlineModeRenderer.setupChangeListeners(config);
    }
    
    /**
     * Setup hover effects for answer labels
     */
    static setupHoverEffects() {
        const answerLabels = document.querySelectorAll('.answer-label');
        answerLabels.forEach(label => {
            label.addEventListener('mouseenter', () => ColorManager.showInlineColorPreview(label));
            label.addEventListener('mouseleave', () => ColorManager.hideInlineColorPreview(label));
        });
    }
    
    /**
     * Setup change listeners for radio buttons
     * @param {Object} config - Configuration object
     */
    static setupChangeListeners(config) {
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    ColorManager.applyInlineAnswerColor(radio, config);
                }
            });
        });
        
        // Apply colors to already selected answers
        InlineModeRenderer.applyAnswerColors(config);
    }
    
    /**
     * Apply colors to all selected answers in inline mode
     * @param {Object} config - Configuration object
     */
    static applyAnswerColors(config) {
        ColorManager.applyInlineAnswerColors(config);
    }
}
