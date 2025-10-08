/**
 * ColorManager - Handles all color-related operations for question rendering
 * Supports both table mode and inline mode color applications
 */
export class ColorManager {
    /**
     * Apply color to a table cell (table mode)
     * @param {HTMLElement} cell - The table cell element
     * @param {Object} config - Configuration object with answers array
     * @param {number} answerIndex - Index of the selected answer
     */
    static applyToTableCell(cell, config, answerIndex) {
        const answer = config.answers[answerIndex];
        if (answer && answer.color) {
            cell.style.backgroundColor = answer.color;
            cell.style.color = '#374151'; // Dark gray text for pastel colors
            cell.classList.add('font-medium');
        }
    }

    /**
     * Apply color to an inline label (inline/card mode)
     * @param {HTMLElement} label - The label element
     * @param {Object} config - Configuration object with answers array
     * @param {number} answerIndex - Index of the selected answer
     */
    static applyToInlineLabel(label, config, answerIndex) {
        const answer = config.answers[answerIndex];
        if (answer && answer.color) {
            label.style.backgroundColor = answer.color;
            label.style.color = '#374151'; // Dark gray text for pastel colors
            label.classList.add('font-medium');
        }
    }

    /**
     * Apply colors to all checked radio buttons in table mode
     * @param {Object} config - Configuration object with answers array
     */
    static applyTableAnswerColors(config) {
        const checkedRadios = document.querySelectorAll('input[type="radio"]:checked');
        checkedRadios.forEach(radio => {
            const answerIndex = parseInt(radio.value);
            const cell = radio.closest('td');
            if (cell) {
                ColorManager.applyToTableCell(cell, config, answerIndex);
            }
        });
    }

    /**
     * Apply colors to all checked radio buttons in inline mode
     * @param {Object} config - Configuration object with answers array
     */
    static applyInlineAnswerColors(config) {
        const checkedRadios = document.querySelectorAll('input[type="radio"]:checked');
        checkedRadios.forEach(radio => {
            const answerIndex = parseInt(radio.value);
            const label = radio.closest('.answer-label, .stepper-answer-label');
            if (label) {
                ColorManager.applyToInlineLabel(label, config, answerIndex);
            }
        });
    }

    /**
     * Apply color to a single radio button in inline mode
     * @param {HTMLElement} radio - The radio input element
     * @param {Object} config - Configuration object with answers array
     */
    static applyInlineAnswerColor(radio, config) {
        // Reset all labels in this question group first
        const questionName = radio.name;
        const allRadiosInQuestion = document.querySelectorAll(`input[name="${questionName}"]`);
        allRadiosInQuestion.forEach(r => {
            const label = r.closest('.answer-label, .stepper-answer-label');
            if (label) {
                ColorManager.resetElement(label);
            }
        });
        
        // Apply color to selected label
        const answerIndex = parseInt(radio.value);
        const label = radio.closest('.answer-label, .stepper-answer-label');
        if (label) {
            ColorManager.applyToInlineLabel(label, config, answerIndex);
        }
    }

    /**
     * Show color preview on hover (table mode)
     * @param {HTMLElement} cell - The table cell element
     */
    static showTableColorPreview(cell) {
        // Don't show preview if already selected
        const radio = cell.querySelector('input[type="radio"]');
        if (radio && radio.checked) return;
        
        const answerColor = cell.dataset.answerColor;
        if (answerColor) {
            // Create a lighter version of the color for preview
            const lighterColor = ColorManager.lightenColor(answerColor, 0.7);
            cell.style.backgroundColor = lighterColor;
        }
    }

    /**
     * Hide color preview on hover end (table mode)
     * @param {HTMLElement} cell - The table cell element
     */
    static hideTableColorPreview(cell) {
        // Don't hide if already selected
        const radio = cell.querySelector('input[type="radio"]');
        if (radio && radio.checked) return;
        
        // Reset to default hover color
        cell.style.backgroundColor = '';
    }

    /**
     * Show color preview on hover (inline mode)
     * @param {HTMLElement} label - The label element
     */
    static showInlineColorPreview(label) {
        // Don't show preview if already selected
        const radio = label.querySelector('input[type="radio"]');
        if (radio && radio.checked) return;
        
        const answerColor = label.dataset.answerColor;
        if (answerColor) {
            // Create a lighter version of the color for preview
            const lighterColor = ColorManager.lightenColor(answerColor, 0.8);
            label.style.backgroundColor = lighterColor;
        }
    }

    /**
     * Hide color preview on hover end (inline mode)
     * @param {HTMLElement} label - The label element
     */
    static hideInlineColorPreview(label) {
        // Don't hide if already selected
        const radio = label.querySelector('input[type="radio"]');
        if (radio && radio.checked) return;
        
        // Reset to default hover color
        label.style.backgroundColor = '';
    }

    /**
     * Lighten a hex color by blending with white
     * @param {string} hex - Hex color code (e.g., '#FF5733')
     * @param {number} opacity - Opacity level (0-1)
     * @returns {string} RGB color string
     */
    static lightenColor(hex, opacity) {
        // Convert hex to RGB, then apply opacity by blending with white
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // Blend with white background
        const newR = Math.round(r + (255 - r) * (1 - opacity));
        const newG = Math.round(g + (255 - g) * (1 - opacity));
        const newB = Math.round(b + (255 - b) * (1 - opacity));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    /**
     * Reset color styles for a single element
     * @param {HTMLElement} element - Element to reset
     */
    static resetElement(element) {
        element.style.backgroundColor = '';
        element.style.color = '';
        element.classList.remove('font-medium');
    }

    /**
     * Reset all color styles (both table and inline mode)
     */
    static resetAllColors() {
        const allRadios = document.querySelectorAll('input[type="radio"]');
        allRadios.forEach(radio => {
            // Reset table cells
            const cell = radio.closest('td');
            if (cell) {
                ColorManager.resetElement(cell);
            }
            
            // Reset inline labels
            const label = radio.closest('.answer-label, .stepper-answer-label');
            if (label) {
                ColorManager.resetElement(label);
            }
        });
    }
}
