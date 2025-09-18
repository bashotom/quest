/**
 * QuestionRenderer - Handles rendering of questionnaire forms
 * Supports both table mode and inline (card) mode
 */
export class QuestionRenderer {
    static render(questions, config, container) {
        const displayMode = localStorage.getItem('displayMode') || 'column';
        const currentAnswers = QuestionRenderer.collectCurrentAnswers(questions);

        if (displayMode === 'column') {
            QuestionRenderer.renderTableMode(questions, config, container);
        } else {
            QuestionRenderer.renderInlineMode(questions, config, container);
        }

        QuestionRenderer.updateButtonStyles();
        
        if (Object.keys(currentAnswers).length > 0) {
            QuestionRenderer.setAnswers(currentAnswers);
        }
        
        // Apply colors to already selected answers in table mode
        if (displayMode === 'column') {
            QuestionRenderer.applyAnswerColors(config);
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

            html += `<tr class="hover:bg-gray-50"><td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">${question.text}</td>`;
            
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

        questions.forEach(question => {
            html += `
                <div class="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white">
                    <div class="font-medium mb-3 sm:mb-4 text-sm sm:text-base text-gray-900">${question.text}</div>
                    <div class="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
            `;

            config.answers?.forEach((answer, index) => {
                const label = answer.label || Object.keys(answer)[0];
                html += `
                    <label class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="radio" name="question-${question.id}" value="${index}" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500">
                        <span class="text-sm sm:text-base">${label}</span>
                    </label>
                `;
            });

            html += '</div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }
    
    static updateButtonStyles() {
        const mode = localStorage.getItem('displayMode') || 'column';
        const btnColumn = document.getElementById('btn-column');
        const btnInline = document.getElementById('btn-inline');

        if (btnColumn && btnInline) {
            if (mode === 'column') {
                btnColumn.className = 'border border-blue-300 bg-blue-600 text-white font-medium py-1 px-3 rounded transition duration-150 text-sm';
                btnInline.className = 'border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm';
            } else {
                btnColumn.className = 'border border-blue-300 bg-white hover:bg-blue-100 text-blue-700 font-medium py-1 px-3 rounded transition duration-150 text-sm';
                btnInline.className = 'border border-blue-300 bg-blue-600 text-white font-medium py-1 px-3 rounded transition duration-150 text-sm';
            }
        }
    }
    
    static setAllAnswers(questions, mode) {
        // First reset all cell colors
        const allRadios = document.querySelectorAll('input[type="radio"]');
        allRadios.forEach(radio => {
            const cell = radio.closest('td');
            if (cell) {
                cell.style.backgroundColor = '';
                cell.style.color = '';
                cell.classList.remove('font-medium');
            }
        });
        
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
        // Add event listeners to all answer cells
        const answerCells = document.querySelectorAll('.answer-cell');
        answerCells.forEach(cell => {
            cell.addEventListener('mouseenter', () => QuestionRenderer.showColorPreview(cell));
            cell.addEventListener('mouseleave', () => QuestionRenderer.hideColorPreview(cell));
        });
    }
}
