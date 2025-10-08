import { ColorManager } from '../utils/color-manager.js';

/**
 * TableModeRenderer - Handles rendering of questionnaires in table/column mode
 */
export class TableModeRenderer {
    /**
     * Render questions in table mode
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element to render into
     */
    static render(questions, config, container) {
        const numAnswers = config.answers?.length || 4;
        const fewAnswers = numAnswers === 2;
        
        // Calculate equal widths for answer columns
        let answerThClass;
        if (fewAnswers) {
            answerThClass = 'w-1/8'; // For 2 answers, keep existing behavior
        } else {
            // For 3+ answers, ensure equal column widths using flexbox approach
            answerThClass = 'flex-1 min-w-0'; // Equal flex columns with minimum width
        }
        
        const frageThClass = fewAnswers ? 'w-3/4' : 'w-1/2';
        const headerRepeatRows = config.input?.header_repeating_rows || 0;

        // Header-Template erstellen
        const headerTemplate = `
            <tr class="bg-gray-50">
                <th class="${frageThClass} px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frage</th>
                ${config.answers?.map(answer => {
                    const label = answer.label || Object.keys(answer)[0];
                    return `<th class="${answerThClass} px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">${label}</th>`;
                }).join('')}
            </tr>
        `;

        let html = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    ${headerTemplate}
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        questions.forEach((question, index) => {
            // Header wiederholen, wenn headerRepeatRows konfiguriert ist
            if (headerRepeatRows > 0 && index > 0 && index % headerRepeatRows === 0) {
                html += `</tbody><thead class="bg-gray-50">${headerTemplate}</thead><tbody class="bg-white divide-y divide-gray-200">`;
            }

            html += `<tr class="hover:bg-gray-50"><td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">${index + 1}. ${question.text}</td>`;
            
            if (fewAnswers) {
                // For 2 answers, use separate cells
                config.answers?.forEach((answer, answerIndex) => {
                    html += `
                        <td class="answer-cell px-2 py-2 sm:px-4 sm:py-4 text-center cursor-pointer hover:bg-blue-50 transition-colors duration-150" 
                            onclick="selectRadio('${question.id}', '${answerIndex}')"
                            data-answer-color="${answer.color || ''}"
                            data-answer-index="${answerIndex}">
                            <input type="radio" name="question-${question.id}" value="${answerIndex}" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mx-auto">
                        </td>
                    `;
                });
            } else {
                // For 3+ answers, use flexbox within single cell for equal spacing
                config.answers?.forEach((answer, answerIndex) => {
                    html += `
                        <td class="answer-cell px-2 py-2 sm:px-4 sm:py-4 text-center cursor-pointer hover:bg-blue-50 transition-colors duration-150" 
                            onclick="selectRadio('${question.id}', '${answerIndex}')"
                            data-answer-color="${answer.color || ''}"
                            data-answer-index="${answerIndex}">
                            <input type="radio" name="question-${question.id}" value="${answerIndex}" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mx-auto">
                        </td>
                    `;
                });
            }
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
        
        // Add hover event listeners after rendering
        TableModeRenderer.setupHoverEffects();
    }
    
    /**
     * Setup hover effects for answer cells
     */
    static setupHoverEffects() {
        const answerCells = document.querySelectorAll('.answer-cell');
        answerCells.forEach(cell => {
            cell.addEventListener('mouseenter', () => ColorManager.showTableColorPreview(cell));
            cell.addEventListener('mouseleave', () => ColorManager.hideTableColorPreview(cell));
        });
    }
    
    /**
     * Apply colors to all selected answers in table mode
     * @param {Object} config - Configuration object
     */
    static applyAnswerColors(config) {
        ColorManager.applyTableAnswerColors(config);
    }
}
