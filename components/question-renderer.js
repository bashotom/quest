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
        const fewAnswers = config.answers?.length === 2;
        const frageThClass = fewAnswers ? 'w-3/4' : 'w-1/2';
        const answerThClass = fewAnswers ? 'w-1/8' : 'w-1/' + (config.answers?.length || 4);
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

            html += `<tr class="hover:bg-gray-50"><td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm text-gray-900">${question.text}</td>`;
            
            config.answers?.forEach((answer, answerIndex) => {
                html += `
                    <td class="px-2 py-2 sm:px-4 sm:py-4 text-center cursor-pointer" onclick="selectRadio('${question.id}', '${answerIndex}')">
                        <input type="radio" name="question-${question.id}" value="${answerIndex}" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mx-auto">
                    </td>
                `;
            });
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
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
}
