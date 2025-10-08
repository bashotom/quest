import { ColorManager } from '../utils/color-manager.js';

/**
 * StepperModeRenderer - Handles rendering of questionnaires in stepper/wizard mode
 * Shows one question at a time with navigation controls
 */
export class StepperModeRenderer {
    // Stepper state management
    static stepperState = null;
    
    /**
     * Render questions in stepper mode
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element to render into
     */
    static render(questions, config, container) {
        // Initialize stepper state if not exists
        if (!StepperModeRenderer.stepperState) {
            StepperModeRenderer.stepperState = {
                currentIndex: 0,
                answers: {},
                isTransitioning: false
            };
            
            // Try to restore saved answers
            const savedAnswers = StepperModeRenderer.collectCurrentAnswers(questions);
            if (Object.keys(savedAnswers).length > 0) {
                StepperModeRenderer.stepperState.answers = savedAnswers;
                // Find first unanswered question
                for (let i = 0; i < questions.length; i++) {
                    if (!savedAnswers[questions[i].id]) {
                        StepperModeRenderer.stepperState.currentIndex = i;
                        break;
                    }
                }
                // If all answered, show last question
                if (StepperModeRenderer.stepperState.currentIndex === 0 && Object.keys(savedAnswers).length === questions.length) {
                    StepperModeRenderer.stepperState.currentIndex = questions.length - 1;
                }
            }
        }
        
        const currentIndex = StepperModeRenderer.stepperState.currentIndex;
        const question = questions[currentIndex];
        const totalQuestions = questions.length;
        const answeredCount = Object.keys(StepperModeRenderer.stepperState.answers).length;
        const isLastQuestion = currentIndex === totalQuestions - 1;
        const allAnswered = answeredCount === totalQuestions;
        
        // Progress indicator
        const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
        
        let html = `
            <div class="stepper-container">
                <!-- Progress Bar -->
                <div class="mb-6">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Frage ${currentIndex + 1} von ${totalQuestions}</span>
                        <span>${answeredCount} / ${totalQuestions} beantwortet (${Math.round((answeredCount/totalQuestions)*100)}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                
                <!-- Question Card -->
                <div id="stepper-question-card" class="stepper-question-card">
                    <div class="border-2 border-blue-200 rounded-lg p-6 bg-white shadow-lg">
                        <h3 class="text-xl font-semibold text-gray-900 mb-6">${question.text || question.question}</h3>
                        <div class="space-y-3">
                            ${config.answers?.map((answer, index) => {
                                const label = answer.label || Object.keys(answer)[0];
                                const answerColor = answer.color || '#e5e7eb';
                                const answerSize = config.input?.size || 5;
                                const isChecked = StepperModeRenderer.stepperState.answers[question.id] === index;
                                const selectedStyle = isChecked ? `style="background-color: ${answerColor};"` : '';
                                return `
                                    <label class="stepper-answer-label block p-${answerSize} border-2 border-gray-300 rounded-lg cursor-pointer transition-all hover:border-blue-400 hover:shadow-md ${isChecked ? 'selected' : ''}" 
                                           data-answer-color="${answerColor}"
                                           data-question-id="${question.id}"
                                           data-answer-index="${index}"
                                           ${selectedStyle}>
                                        <input type="radio" 
                                               name="question-${question.id}" 
                                               value="${index}" 
                                               class="mr-3"
                                               ${isChecked ? 'checked' : ''}>
                                        <span class="text-lg">${label}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                        
                        <!-- Navigation Buttons -->
                        <div class="flex justify-between items-center mt-8">
                            <button type="button" 
                                    id="stepper-prev-btn" 
                                    class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${currentIndex === 0 ? 'invisible' : ''}"
                                    ${currentIndex === 0 ? 'disabled' : ''}>
                                ← Zurück
                            </button>
                            
                            ${isLastQuestion && allAnswered ? `
                                <button type="submit" 
                                        id="stepper-submit-btn"
                                        class="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg">
                                    ✓ Fragebogen auswerten
                                </button>
                            ` : `
                                <button type="button" 
                                        id="stepper-next-btn" 
                                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${StepperModeRenderer.stepperState.answers[question.id] === undefined ? 'opacity-50 cursor-not-allowed' : ''}"
                                        ${StepperModeRenderer.stepperState.answers[question.id] === undefined ? 'disabled' : ''}>
                                    Weiter →
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Setup event listeners
        StepperModeRenderer.setupListeners(questions, config, container);
        
        // Update submit buttons visibility in form
        StepperModeRenderer.updateSubmitButtonsVisibility(allAnswered);
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
     * Setup event listeners for stepper mode
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element
     */
    static setupListeners(questions, config, container) {
        // Answer selection listeners
        const answerLabels = container.querySelectorAll('.stepper-answer-label');
        answerLabels.forEach(label => {
            label.addEventListener('click', (e) => {
                if (StepperModeRenderer.stepperState.isTransitioning) {
                    e.preventDefault();
                    return;
                }
                
                const questionId = label.dataset.questionId;
                const answerIndex = parseInt(label.dataset.answerIndex);
                const answerColor = label.dataset.answerColor;
                
                // Save answer
                StepperModeRenderer.stepperState.answers[questionId] = answerIndex;
                
                // Apply color to selected label
                answerLabels.forEach(l => {
                    l.classList.remove('selected');
                    l.style.backgroundColor = '';
                });
                label.classList.add('selected');
                label.style.backgroundColor = answerColor;
                
                // Enable next button
                const nextBtn = document.getElementById('stepper-next-btn');
                if (nextBtn) {
                    nextBtn.disabled = false;
                    nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                
                // Auto-advance using configured fade duration
                const fadeDuration = config.questionUi?.stepper_fade_duration || 250;
                const isLastQuestion = StepperModeRenderer.stepperState.currentIndex === questions.length - 1;
                const allAnswered = Object.keys(StepperModeRenderer.stepperState.answers).length === questions.length;
                const autoSendEnabled = config.questionUi?.stepper_autosend === true;
                
                if (!isLastQuestion) {
                    setTimeout(() => {
                        if (!StepperModeRenderer.stepperState.isTransitioning) {
                            StepperModeRenderer.goToNext(questions, config, container);
                        }
                    }, fadeDuration);
                } else if (isLastQuestion && allAnswered) {
                    // On last question with all answered
                    if (autoSendEnabled) {
                        // Auto-submit the form after fade duration
                        setTimeout(() => {
                            const form = document.getElementById('quiz-form');
                            if (form) {
                                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                            }
                        }, fadeDuration);
                    } else {
                        // Show submit button after brief delay
                        setTimeout(() => {
                            StepperModeRenderer.render(questions, config, container);
                        }, Math.min(fadeDuration, 300));
                    }
                }
            });
        });
        
        // Previous button
        const prevBtn = document.getElementById('stepper-prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                StepperModeRenderer.goToPrev(questions, config, container);
            });
        }
        
        // Next button
        const nextBtn = document.getElementById('stepper-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                StepperModeRenderer.goToNext(questions, config, container);
            });
        }
        
        // Submit button - no custom listener needed
        // The form's default submit handler (FormHandler) will check StepperModeRenderer.stepperState.answers
    }
    
    /**
     * Navigate to next question
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element
     */
    static goToNext(questions, config, container) {
        if (StepperModeRenderer.stepperState.isTransitioning) return;
        if (StepperModeRenderer.stepperState.currentIndex >= questions.length - 1) return;
        
        const fadeDuration = config.questionUi?.stepper_fade_duration || 250;
        
        StepperModeRenderer.stepperState.isTransitioning = true;
        const card = document.getElementById('stepper-question-card');
        
        // Fade out
        card.classList.add('stepper-fade-out');
        
        setTimeout(() => {
            StepperModeRenderer.stepperState.currentIndex++;
            StepperModeRenderer.render(questions, config, container);
            
            // Fade in
            const newCard = document.getElementById('stepper-question-card');
            newCard.classList.add('stepper-fade-in');
            
            setTimeout(() => {
                newCard.classList.remove('stepper-fade-in');
                StepperModeRenderer.stepperState.isTransitioning = false;
            }, fadeDuration);
        }, fadeDuration);
    }
    
    /**
     * Navigate to previous question
     * @param {Array} questions - Array of question objects
     * @param {Object} config - Configuration object
     * @param {HTMLElement} container - Container element
     */
    static goToPrev(questions, config, container) {
        if (StepperModeRenderer.stepperState.isTransitioning) return;
        if (StepperModeRenderer.stepperState.currentIndex <= 0) return;
        
        const fadeDuration = config.questionUi?.stepper_fade_duration || 250;
        
        StepperModeRenderer.stepperState.isTransitioning = true;
        const card = document.getElementById('stepper-question-card');
        
        // Fade out
        card.classList.add('stepper-fade-out');
        
        setTimeout(() => {
            StepperModeRenderer.stepperState.currentIndex--;
            StepperModeRenderer.render(questions, config, container);
            
            // Fade in
            const newCard = document.getElementById('stepper-question-card');
            newCard.classList.add('stepper-fade-in');
            
            setTimeout(() => {
                newCard.classList.remove('stepper-fade-in');
                StepperModeRenderer.stepperState.isTransitioning = false;
            }, fadeDuration);
        }, fadeDuration);
    }
    
    /**
     * Reset stepper state (for new questionnaire or restart)
     */
    static resetState() {
        StepperModeRenderer.stepperState = null;
    }
    
    /**
     * Update submit button visibility (hide default buttons in stepper mode)
     * @param {boolean} allAnswered - Whether all questions are answered
     */
    static updateSubmitButtonsVisibility(allAnswered) {
        // Hide the default submit buttons when in stepper mode
        const form = document.getElementById('quiz-form');
        if (form) {
            const submitButtons = form.querySelectorAll('button[type="submit"]:not(#stepper-submit-btn)');
            submitButtons.forEach(btn => {
                btn.style.display = 'none';
            });
        }
    }
}
