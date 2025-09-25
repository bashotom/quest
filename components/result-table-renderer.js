import { QuestionRenderer } from './question-renderer.js';

export class ResultTableRenderer {
    static render(processedData, config, container) {
        const table = this.createTable();
        const tbody = table.querySelector('tbody');
        
        processedData.categoryData.forEach(categoryData => {
            const row = this.createTableRow(categoryData);
            tbody.appendChild(row);
        });
        
        container.appendChild(table);
        
        // Add click event for expandable details
        this.setupCategoryDetailsHandler(tbody, processedData.questions, config);
    }
    
    static createTable() {
        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200 mt-8';
        table.innerHTML = `
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategorie</th>
                    <th class="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punktzahl</th>
                    <th class="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prozent</th>
                    <th class="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ampel</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            </tbody>
        `;
        return table;
    }
    
    static createTableRow(categoryData) {
        const { categoryKey, categoryName, score, percentage, trafficLightColor } = categoryData;
        const displayName = `${categoryKey}: ${categoryName}`;
        
        const row = document.createElement('tr');
        row.className = 'cursor-pointer hover:bg-gray-50';
        row.dataset.categoryKey = categoryKey;
        row.innerHTML = `
            <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">${displayName}</td>
            <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">${score}</td>
            <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">${percentage.toFixed(0)}%</td>
            <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-normal text-sm sm:text-base text-gray-900">
                <div class="traffic-light-container">
                    <div class="traffic-light" style="background-color: ${trafficLightColor};"></div>
                </div>
            </td>
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

        const detailsCell = document.createElement('td');
        detailsCell.colSpan = 4; // Updated to match table columns
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