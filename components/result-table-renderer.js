import { QuestionRenderer } from './question-renderer.js';

export class ResultTableRenderer {
    static render(processedData, config, container) {
        // Add header if configured
        if (config.resulttable?.show_header === true && config.resulttable?.header) {
            const header = document.createElement('h2');
            header.className = 'text-xl font-semibold text-gray-900 mb-4 mt-8';
            header.textContent = config.resulttable.header;
            container.appendChild(header);
        }

        const table = this.createTable(config);
        const tbody = table.querySelector('tbody');
        
        processedData.categoryData.forEach(categoryData => {
            const row = this.createTableRow(categoryData, config);
            tbody.appendChild(row);
        });
        
        container.appendChild(table);
        
        // Add click event for expandable details
        this.setupCategoryDetailsHandler(tbody, processedData.questions, config);
    }
    
    static createTable(config) {
        const showScore = config?.resulttable?.show_score !== false;
        const showTrafficLight = config?.resulttable?.show_trafficlight === true;
        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200 mt-8';
        
        const scoreHeader = showScore 
            ? '<th class="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punktzahl</th>'
            : '';
        
        const trafficLightHeader = showTrafficLight
            ? '<th class="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ampel</th>'
            : '';
        
        table.innerHTML = `
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategorie</th>
                    ${scoreHeader}
                    <th class="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prozent</th>
                    ${trafficLightHeader}
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            </tbody>
        `;
        return table;
    }
    
    static createTableRow(categoryData, config) {
        const { categoryKey, categoryName, score, percentage, trafficLightColor } = categoryData;
        const displayName = `${categoryKey}: ${categoryName}`;
        const showScore = config?.resulttable?.show_score !== false;
        const showTrafficLight = config?.resulttable?.show_trafficlight === true;
        
        const scoreCell = showScore 
            ? `<td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">${score}</td>`
            : '';
        
        const trafficLightCell = showTrafficLight
            ? `<td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">
                <div class="traffic-light-container">
                    <div class="traffic-light" style="background-color: ${trafficLightColor};"></div>
                </div>
            </td>`
            : '';
        
        const row = document.createElement('tr');
        row.className = 'cursor-pointer hover:bg-gray-50';
        row.dataset.categoryKey = categoryKey;
        row.innerHTML = `
            <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">${displayName}</td>
            ${scoreCell}
            <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">${percentage.toFixed(0)}%</td>
            ${trafficLightCell}
        `;
        return row;
    }
    
    static setupCategoryDetailsHandler(tbody, questions, config) {
        tbody.addEventListener('click', (event) => {
            const row = event.target.closest('tr[data-category-key]');
            if (!row) return;

            const categoryKey = row.dataset.categoryKey;
            const existingDetailsRow = tbody.querySelector(`tr.category-details[data-details-for="${categoryKey}"]`);

            if (existingDetailsRow) {
                existingDetailsRow.remove();
            } else {
                const currentAnswers = QuestionRenderer.collectCurrentAnswers(questions);
                const detailsRow = this.createCategoryQuestionsRow(categoryKey, questions, config, currentAnswers);
                row.insertAdjacentElement('afterend', detailsRow);
            }
        });
    }
    
    static createCategoryQuestionsRow(categoryKey, questions, config, currentAnswers) {
        const categoryQuestions = questions.filter(q => q.category === categoryKey);

        const detailsRow = document.createElement('tr');
        detailsRow.className = 'category-details bg-gray-50';
        detailsRow.dataset.detailsFor = categoryKey;

        const showScore = config?.resulttable?.show_score !== false;
        const showTrafficLight = config?.resulttable?.show_trafficlight === true;
        let colSpan = 2; // Base columns: Kategorie, Prozent
        if (showScore) colSpan++;
        if (showTrafficLight) colSpan++;
        
        const detailsCell = document.createElement('td');
        detailsCell.colSpan = colSpan;
        detailsCell.className = 'px-4 py-4 sm:px-6';

        let content = '<ul class="space-y-3 list-disc list-inside text-sm text-gray-700">';
        categoryQuestions.forEach(q => {
            const answerIndex = currentAnswers[q.id];
            let answerText = 'Nicht beantwortet';
            let answerValue = '';
            if (answerIndex !== undefined) {
                const answer = config.answers[answerIndex];
                if (answer) {
                    answerText = answer.label || Object.keys(answer)[0];
                    answerValue = `(${answer.value} Pkt.)`;
                }
            }
            content += `<li><strong>${q.text}</strong>: ${answerText} <span class="text-gray-500">${answerValue}</span></li>`;
        });
        content += '</ul>';

        detailsCell.innerHTML = content;
        detailsRow.appendChild(detailsCell);

        return detailsRow;
    }
}