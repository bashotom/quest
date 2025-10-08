import { ColorManager } from './utils/color-manager.js';
import { TableModeRenderer } from './renderers/table-mode-renderer.js';
import { InlineModeRenderer } from './renderers/inline-mode-renderer.js';
import { StepperModeRenderer } from './renderers/stepper-mode-renderer.js';
import { ResponsiveModeHandler } from './renderers/responsive-mode-handler.js';

/**
 * QuestionRenderer - Main orchestrator for questionnaire rendering
 * Delegates to specific renderers based on display mode
 * Supports table mode, inline (card) mode, stepper mode, and responsive mode
 */
export class QuestionRenderer {
    static render(questions, config, container) {
        // Check if stepper mode is enabled
        if (config.questionUi?.stepper === true) {
            StepperModeRenderer.render(questions, config, container);
            return;
        }
        
        const displayMode = localStorage.getItem('displayMode') || 'responsive';
        const currentAnswers = QuestionRenderer.collectCurrentAnswers(questions);

        // Clean up previous responsive listener if not in responsive mode
        if (displayMode !== 'responsive') {
            ResponsiveModeHandler.cleanup();
        }

        if (displayMode === 'responsive') {
            ResponsiveModeHandler.render(questions, config, container);
        } else if (displayMode === 'column') {
            TableModeRenderer.render(questions, config, container);
        } else {
            InlineModeRenderer.render(questions, config, container);
        }

        QuestionRenderer.updateButtonStyles();
        
        if (Object.keys(currentAnswers).length > 0) {
            QuestionRenderer.setAnswers(currentAnswers);
        }
        
        // Apply colors to already selected answers based on effective mode
        const effectiveMode = QuestionRenderer.getEffectiveDisplayMode(displayMode);
        if (effectiveMode === 'column') {
            TableModeRenderer.applyAnswerColors(config);
        } else {
            // Apply colors in inline mode for existing selections
            // Use a longer timeout to ensure DOM is fully rendered
            setTimeout(() => {
                InlineModeRenderer.applyAnswerColors(config);
            }, 50);
        }
    }
    
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
    
    static getEffectiveDisplayMode(displayMode) {
        if (displayMode === 'responsive') {
            return ResponsiveModeHandler.getCurrentMode();
        }
        return displayMode;
    }


    
    static updateButtonStyles() {
        const mode = localStorage.getItem('displayMode') || 'column';
        const btnColumn = document.getElementById('btn-column');
        const btnInline = document.getElementById('btn-inline');
        const btnResponsive = document.getElementById('btn-responsive');

        if (btnColumn && btnInline && btnResponsive) {
            // Reset all buttons to inactive state
            const inactiveClass = 'border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm';
            const activeClass = 'border border-blue-300 bg-blue-600 text-white font-medium py-1 px-3 rounded transition duration-150 text-sm';
            
            btnColumn.className = inactiveClass;
            btnInline.className = inactiveClass;
            btnResponsive.className = inactiveClass;
            
            // Set active button based on mode
            if (mode === 'column') {
                btnColumn.className = activeClass;
            } else if (mode === 'inline') {
                btnInline.className = activeClass;
            } else if (mode === 'responsive') {
                btnResponsive.className = activeClass;
            }
        }
    }
    
    static resetAllColors() {
        ColorManager.resetAllColors();
    }
    
    static setAllAnswers(questions, mode, config = null) {
        // Check if stepper mode is active
        if (StepperModeRenderer.stepperState && config) {
            // In stepper mode, update the state directly for all questions
            const answersLength = config.answers?.length || 5;
            
            questions.forEach((question) => {
                let answerIndex;
                
                switch (mode) {
                    case 'min': 
                        answerIndex = 0; 
                        break;
                    case 'max': 
                        answerIndex = answersLength - 1; 
                        break;
                    case 'random': 
                        answerIndex = Math.floor(Math.random() * answersLength); 
                        break;
                }
                
                StepperModeRenderer.stepperState.answers[question.id] = answerIndex;
            });
            
            // Update progress indicator
            const totalQuestions = questions.length;
            const answeredCount = Object.keys(StepperModeRenderer.stepperState.answers).length;
            const progressPercent = ((StepperModeRenderer.stepperState.currentIndex + 1) / totalQuestions) * 100;
            
            // Update progress bar and text
            const progressText = document.querySelector('.mb-6 .flex.justify-between span:last-child');
            if (progressText) {
                progressText.textContent = `${answeredCount} / ${totalQuestions} beantwortet (${Math.round((answeredCount/totalQuestions)*100)}%)`;
            }
            
            // Re-render current question to show the selected answer
            const currentQuestion = questions[StepperModeRenderer.stepperState.currentIndex];
            const answerIndex = StepperModeRenderer.stepperState.answers[currentQuestion.id];
            const radioToCheck = document.querySelector(`input[name="question-${currentQuestion.id}"][value="${answerIndex}"]`);
            if (radioToCheck) {
                radioToCheck.checked = true;
                // Trigger the label styling
                const label = radioToCheck.closest('.stepper-answer-label');
                if (label) {
                    const answerColor = label.dataset.answerColor;
                    document.querySelectorAll('.stepper-answer-label').forEach(l => {
                        l.classList.remove('selected');
                        l.style.backgroundColor = '';
                    });
                    label.classList.add('selected');
                    label.style.backgroundColor = answerColor;
                }
            }
            
            // Enable next button
            const nextBtn = document.getElementById('stepper-next-btn');
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            
            // Update submit button visibility - check if we should show submit button
            const allAnswered = answeredCount === totalQuestions;
            const isLastQuestion = StepperModeRenderer.stepperState.currentIndex === totalQuestions - 1;
            
            if (allAnswered && isLastQuestion) {
                // Replace next button with submit button on last question when all answered
                const container = document.querySelector('.stepper-container')?.parentElement;
                if (container) {
                    StepperModeRenderer.render(questions, config, container);
                }
            }
            
            StepperModeRenderer.updateSubmitButtonsVisibility(allAnswered);
            
            return; // Exit early for stepper mode
        }
        
        // Regular mode: set answers via DOM manipulation
        // First reset all colors (both table and inline mode)
        ColorManager.resetAllColors();
        
        // Then set the new answers
        questions.forEach(question => {
            const radios = document.querySelectorAll(`input[name="question-${question.id}"]`);
            if (radios.length === 0) return;

            let targetRadio;
            switch (mode) {
                case 'min': targetRadio = radios[0]; break;
                case 'max': targetRadio = radios[radios.length - 1]; break;
                case 'random': targetRadio = radios[Math.floor(Math.random() * radios.length)]; break;
            }

            if (targetRadio) targetRadio.checked = true;
        });
    }
    
    // Legacy compatibility methods - delegate to StepperModeRenderer
    static setupStepperListeners(questions, config, container) {
        StepperModeRenderer.setupListeners(questions, config, container);
    }
    
    static goToNextQuestion(questions, config, container) {
        StepperModeRenderer.goToNext(questions, config, container);
    }
    
    static goToPrevQuestion(questions, config, container) {
        StepperModeRenderer.goToPrev(questions, config, container);
    }
    
    static resetStepperState() {
        StepperModeRenderer.resetState();
    }
    
    static updateSubmitButtonsVisibility(allAnswered) {
        StepperModeRenderer.updateSubmitButtonsVisibility(allAnswered);
    }
}
