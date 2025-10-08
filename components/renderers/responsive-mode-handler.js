import { TableModeRenderer } from './table-mode-renderer.js';
import { InlineModeRenderer } from './inline-mode-renderer.js';

/**
 * ResponsiveModeHandler - Handles responsive rendering with automatic mode switching
 * Switches between table mode (>900px) and inline mode (≤900px)
 */
export class ResponsiveModeHandler {
    static resizeListener = null;
    static resizeTimeout = null;
    
    /**
     * Render questions in responsive mode
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element to render into
     */
    static render(questions, config, container) {
        // Initially render based on current screen size
        const isLargeScreen = window.innerWidth > 900;
        
        if (isLargeScreen) {
            TableModeRenderer.render(questions, config, container);
        } else {
            InlineModeRenderer.render(questions, config, container);
        }
        
        // Set up resize listener for responsive behavior
        ResponsiveModeHandler.setupListener(questions, config, container);
    }
    
    /**
     * Setup resize listener for responsive behavior
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element
     */
    static setupListener(questions, config, container) {
        // Remove existing listener if any
        ResponsiveModeHandler.cleanup();
        
        ResponsiveModeHandler.resizeListener = () => {
            const displayMode = localStorage.getItem('displayMode');
            if (displayMode !== 'responsive') return; // Only act in responsive mode
            
            // Clear previous timeout
            if (ResponsiveModeHandler.resizeTimeout) {
                clearTimeout(ResponsiveModeHandler.resizeTimeout);
            }
            
            // Throttle resize events
            ResponsiveModeHandler.resizeTimeout = setTimeout(() => {
                ResponsiveModeHandler.handleResize(questions, config, container);
            }, 150); // 150ms throttle
        };
        
        window.addEventListener('resize', ResponsiveModeHandler.resizeListener);
    }
    
    /**
     * Handle resize event and switch modes if needed
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element
     */
    static handleResize(questions, config, container) {
        const newMode = window.innerWidth > 900 ? 'column' : 'inline';
        
        // Check if we need to re-render by checking the current DOM structure
        const hasTable = container.querySelector('table') !== null;
        const hasCards = container.querySelector('.space-y-4') !== null;
        
        const currentMode = hasTable ? 'column' : (hasCards ? 'inline' : null);
        
        if (currentMode && currentMode !== newMode) {
            console.log(`Responsive switch: ${currentMode} -> ${newMode} (width: ${window.innerWidth}px)`);
            
            // Collect current answers before re-rendering
            const currentAnswers = ResponsiveModeHandler.collectCurrentAnswers(questions);
            
            // Re-render with new mode
            if (newMode === 'column') {
                TableModeRenderer.render(questions, config, container);
            } else {
                InlineModeRenderer.render(questions, config, container);
            }
            
            // Restore answers
            if (Object.keys(currentAnswers).length > 0) {
                ResponsiveModeHandler.setAnswers(currentAnswers);
            }
            
            // Apply colors appropriately
            if (newMode === 'column') {
                TableModeRenderer.applyAnswerColors(config);
            } else {
                // For inline mode, ensure colors are applied with proper timing
                setTimeout(() => {
                    InlineModeRenderer.applyAnswerColors(config);
                }, 50);
            }
        }
    }
    
    /**
     * Collect currently selected answers from DOM
     * @param {Array} questions - Array of question objects
     * @returns {Object} Object mapping question IDs to answer indices
     */
    static collectCurrentAnswers(questions) {
        const answers = {};
        questions.forEach(question => {
            const radioInputs = document.querySelectorAll(`input[name="question-${question.id}"]:checked`);
            if (radioInputs.length > 0) {
                answers[question.id] = parseInt(radioInputs[0].value);
            }
        });
        return answers;
    }
    
    /**
     * Set answers in the DOM
     * @param {Object} answers - Object mapping question IDs to answer indices
     */
    static setAnswers(answers) {
        Object.entries(answers).forEach(([questionId, answerIndex]) => {
            const radio = document.querySelector(`input[name="question-${questionId}"][value="${answerIndex}"]`);
            if (radio) {
                radio.checked = true;
                // Trigger change event for inline mode color application
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }
    
    /**
     * Get current responsive mode based on window width
     * @returns {string} 'column' or 'inline'
     */
    static getCurrentMode() {
        return window.innerWidth > 900 ? 'column' : 'inline';
    }
    
    /**
     * Cleanup resize listener
     */
    static cleanup() {
        if (ResponsiveModeHandler.resizeListener) {
            window.removeEventListener('resize', ResponsiveModeHandler.resizeListener);
            ResponsiveModeHandler.resizeListener = null;
        }
        if (ResponsiveModeHandler.resizeTimeout) {
            clearTimeout(ResponsiveModeHandler.resizeTimeout);
            ResponsiveModeHandler.resizeTimeout = null;
        }
    }
}
