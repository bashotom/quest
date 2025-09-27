/**
 * QuestionRenderer - Handles rendering of questionnaire forms
 * Supports table mode, inline (card) mode, and responsive mode
 */
export class QuestionRenderer {
    static render(questions, config, container) {
        const displayMode = localStorage.getItem('displayMode') || 'responsive';
        const currentAnswers = QuestionRenderer.collectCurrentAnswers(questions);

        // Clean up previous responsive listener if not in responsive mode
        if (displayMode !== 'responsive') {
            QuestionRenderer.cleanupResponsiveListener();
        }

        if (displayMode === 'responsive') {
            QuestionRenderer.renderResponsiveMode(questions, config, container);
        } else if (displayMode === 'column') {
            QuestionRenderer.renderTableMode(questions, config, container);
        } else {
            QuestionRenderer.renderInlineMode(questions, config, container);
        }

        QuestionRenderer.updateButtonStyles();
        
        if (Object.keys(currentAnswers).length > 0) {
            QuestionRenderer.setAnswers(currentAnswers);
        }
        
        // Apply colors to already selected answers based on effective mode
        const effectiveMode = QuestionRenderer.getEffectiveDisplayMode(displayMode);
        if (effectiveMode === 'column') {
            QuestionRenderer.applyAnswerColors(config);
        } else {
            // Apply colors in inline mode for existing selections
            // Use a longer timeout to ensure DOM is fully rendered
            setTimeout(() => {
                QuestionRenderer.applyInlineAnswerColors(config);
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
    
    static renderTableMode(questions, config, container) {
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
        QuestionRenderer.setupHoverEffects();
    }
    
    static renderInlineMode(questions, config, container) {
        let html = '<div class="space-y-4 sm:space-y-6">';

        questions.forEach((question, index) => {
            html += `
                <div class="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white">
                    <div class="font-medium mb-3 sm:mb-4 text-sm sm:text-base text-gray-900">${index + 1}. ${question.text}</div>
                    <div class="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
            `;

            config.answers?.forEach((answer, index) => {
                const label = answer.label || Object.keys(answer)[0];
                html += `
                    <label class="answer-label flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors duration-150" 
                           data-answer-color="${answer.color || ''}"
                           data-answer-index="${index}">
                        <input type="radio" name="question-${question.id}" value="${index}" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500">
                        <span class="text-sm sm:text-base">${label}</span>
                    </label>
                `;
            });

            html += '</div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
        
        // Add hover event listeners and change listeners for inline mode
        QuestionRenderer.setupInlineHoverEffects();
        QuestionRenderer.setupInlineChangeListeners(config);
    }
    
    static renderResponsiveMode(questions, config, container) {
        // Initially render based on current screen size
        const isLargeScreen = window.innerWidth > 900;
        
        if (isLargeScreen) {
            QuestionRenderer.renderTableMode(questions, config, container);
        } else {
            QuestionRenderer.renderInlineMode(questions, config, container);
        }
        
        // Set up resize listener for responsive behavior
        QuestionRenderer.setupResponsiveListener(questions, config, container);
    }
    
    static setupResponsiveListener(questions, config, container) {
        // Remove existing listener if any
        if (QuestionRenderer.resizeListener) {
            window.removeEventListener('resize', QuestionRenderer.resizeListener);
        }
        
        // Throttle mechanism to prevent excessive re-rendering
        let resizeTimeout;
        
        QuestionRenderer.resizeListener = () => {
            const displayMode = localStorage.getItem('displayMode');
            if (displayMode !== 'responsive') return; // Only act in responsive mode
            
            // Clear previous timeout
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            
            // Throttle resize events
            resizeTimeout = setTimeout(() => {
                const newMode = window.innerWidth > 900 ? 'column' : 'inline';
                
                // Check if we need to re-render by checking the current DOM structure
                const hasTable = container.querySelector('table') !== null;
                const hasCards = container.querySelector('.space-y-4') !== null;
                
                const currentMode = hasTable ? 'column' : (hasCards ? 'inline' : null);
                
                if (currentMode && currentMode !== newMode) {
                    console.log(`Responsive switch: ${currentMode} -> ${newMode} (width: ${window.innerWidth}px)`);
                    
                    // Collect current answers before re-rendering
                    const currentAnswers = QuestionRenderer.collectCurrentAnswers(questions);
                    
                    // Re-render with new mode
                    if (newMode === 'column') {
                        QuestionRenderer.renderTableMode(questions, config, container);
                    } else {
                        QuestionRenderer.renderInlineMode(questions, config, container);
                    }
                    
                    // Restore answers
                    if (Object.keys(currentAnswers).length > 0) {
                        QuestionRenderer.setAnswers(currentAnswers);
                    }
                    
                    // Apply colors and setup events appropriately
                    if (newMode === 'column') {
                        QuestionRenderer.applyAnswerColors(config);
                    } else {
                        // For inline mode, ensure colors are applied with proper timing
                        setTimeout(() => {
                            QuestionRenderer.applyInlineAnswerColors(config);
                        }, 50);
                    }
                }
            }, 150); // 150ms throttle
        };
        
        window.addEventListener('resize', QuestionRenderer.resizeListener);
    }
    
    static getCurrentResponsiveMode() {
        return window.innerWidth > 900 ? 'column' : 'inline';
    }
    
    static getEffectiveDisplayMode(displayMode) {
        if (displayMode === 'responsive') {
            return QuestionRenderer.getCurrentResponsiveMode();
        }
        return displayMode;
    }
    
    static cleanupResponsiveListener() {
        if (QuestionRenderer.resizeListener) {
            window.removeEventListener('resize', QuestionRenderer.resizeListener);
            QuestionRenderer.resizeListener = null;
        }
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
        // Reset all colors (both table and inline mode)
        const allRadios = document.querySelectorAll('input[type="radio"]');
        allRadios.forEach(radio => {
            // Reset table cells
            const cell = radio.closest('td');
            if (cell) {
                cell.style.backgroundColor = '';
                cell.style.color = '';
                cell.classList.remove('font-medium');
            }
            
            // Reset inline labels
            const label = radio.closest('.answer-label');
            if (label) {
                label.style.backgroundColor = '';
                label.style.color = '';
                label.classList.remove('font-medium');
            }
        });
    }
    
    static setAllAnswers(questions, mode) {
        // First reset all colors (both table and inline mode)
        QuestionRenderer.resetAllColors();
        
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
    
    static applyAnswerColors(config) {
        // Apply colors to all checked radio buttons in table mode
        const checkedRadios = document.querySelectorAll('input[type="radio"]:checked');
        checkedRadios.forEach(radio => {
            const answerIndex = parseInt(radio.value);
            const answer = config.answers[answerIndex];
            if (answer && answer.color) {
                const cell = radio.closest('td');
                if (cell) {
                    cell.style.backgroundColor = answer.color;
                    cell.style.color = '#374151'; // Dark gray text for pastel colors
                    cell.classList.add('font-medium');
                }
            }
        });
    }
    
    static showColorPreview(cell) {
        // Don't show preview if already selected
        const radio = cell.querySelector('input[type="radio"]');
        if (radio && radio.checked) return;
        
        const answerColor = cell.dataset.answerColor;
        if (answerColor) {
            // Create a lighter version of the color for preview
            const lighterColor = QuestionRenderer.lightenColor(answerColor, 0.7);
            cell.style.backgroundColor = lighterColor;
        }
    }
    
    static hideColorPreview(cell) {
        // Don't hide if already selected
        const radio = cell.querySelector('input[type="radio"]');
        if (radio && radio.checked) return;
        
        // Reset to default hover color
        cell.style.backgroundColor = '';
    }
    
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
    
    static setupHoverEffects() {
        // Add event listeners to all answer cells (table mode)
        const answerCells = document.querySelectorAll('.answer-cell');
        answerCells.forEach(cell => {
            cell.addEventListener('mouseenter', () => QuestionRenderer.showColorPreview(cell));
            cell.addEventListener('mouseleave', () => QuestionRenderer.hideColorPreview(cell));
        });
    }
    
    static setupInlineHoverEffects() {
        // Add event listeners to all answer labels (inline mode)
        const answerLabels = document.querySelectorAll('.answer-label');
        answerLabels.forEach(label => {
            label.addEventListener('mouseenter', () => QuestionRenderer.showInlineColorPreview(label));
            label.addEventListener('mouseleave', () => QuestionRenderer.hideInlineColorPreview(label));
        });
    }
    
    static setupInlineChangeListeners(config) {
        // Add change listeners to radio buttons in inline mode
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    QuestionRenderer.applyInlineAnswerColor(radio, config);
                }
            });
        });
        
        // Apply colors to already selected answers
        QuestionRenderer.applyInlineAnswerColors(config);
    }
    
    static showInlineColorPreview(label) {
        // Don't show preview if already selected
        const radio = label.querySelector('input[type="radio"]');
        if (radio && radio.checked) return;
        
        const answerColor = label.dataset.answerColor;
        if (answerColor) {
            // Create a lighter version of the color for preview
            const lighterColor = QuestionRenderer.lightenColor(answerColor, 0.8);
            label.style.backgroundColor = lighterColor;
        }
    }
    
    static hideInlineColorPreview(label) {
        // Don't hide if already selected
        const radio = label.querySelector('input[type="radio"]');
        if (radio && radio.checked) return;
        
        // Reset to default hover color
        label.style.backgroundColor = '';
    }
    
    static applyInlineAnswerColor(radio, config) {
        // Reset all labels in this question group first
        const questionName = radio.name;
        const allRadiosInQuestion = document.querySelectorAll(`input[name="${questionName}"]`);
        allRadiosInQuestion.forEach(r => {
            const label = r.closest('.answer-label');
            if (label) {
                label.style.backgroundColor = '';
                label.style.color = '';
                label.classList.remove('font-medium');
            }
        });
        
        // Apply color to selected label
        const answerIndex = parseInt(radio.value);
        const answer = config.answers[answerIndex];
        if (answer && answer.color) {
            const label = radio.closest('.answer-label');
            if (label) {
                label.style.backgroundColor = answer.color;
                label.style.color = '#374151'; // Dark gray text for pastel colors
                label.classList.add('font-medium');
            }
        }
    }
    
    static applyInlineAnswerColors(config) {
        // Apply colors to all checked radio buttons in inline mode
        const checkedRadios = document.querySelectorAll('input[type="radio"]:checked');
        checkedRadios.forEach(radio => {
            QuestionRenderer.applyInlineAnswerColor(radio, config);
        });
    }
}
