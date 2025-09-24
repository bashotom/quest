import { QuestionRenderer } from './question-renderer.js';

export class ResultRenderer {
    static render(scores, questions, config, container) {
        if (!container) {
            console.error("ResultRenderer.render: container is missing.");
            return;
        }
        container.innerHTML = ''; // Clear previous content

        const categories = Array.isArray(config.categories)
            ? config.categories.reduce((acc, cat) => ({ ...acc, ...cat }), {})
            : config.categories;

        const categoryMaxScores = {};
        Object.keys(categories).forEach(categoryKey => {
            const categoryQuestions = questions.filter(q => q.category === categoryKey);
            const maxAnswerValue = config.answers.reduce((max, ans) => Math.max(max, ans.value), 0);
            categoryMaxScores[categoryKey] = categoryQuestions.length * maxAnswerValue;
        });

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
        
        const tbody = table.querySelector('tbody');

        Object.entries(scores).forEach(([categoryKey, score]) => {
            const categoryName = categories[categoryKey] || categoryKey;
            const displayName = `${categoryKey}: ${categoryName}`;
            const maxScore = categoryMaxScores[categoryKey] || 0;
            const percentage = maxScore > 0 ? parseFloat(((score / maxScore) * 100).toFixed(2)) : 0;
            
            const trafficLightConfig = config.resulttable?.trafficlights?.find(t => t.categories.split(',').includes(categoryKey));
            const trafficLightColor = ResultRenderer.getTrafficLightColor(percentage, trafficLightConfig);

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
            tbody.appendChild(row);
        });
        
        container.appendChild(table);

        tbody.addEventListener('click', (event) => {
            const row = event.target.closest('tr[data-category-key]');
            if (!row) return;

            const categoryKey = row.dataset.categoryKey;
            const existingDetailsRow = tbody.querySelector(`tr.category-details[data-details-for="${categoryKey}"]`);

            if (existingDetailsRow) {
                existingDetailsRow.remove();
            } else {
                const currentAnswers = QuestionRenderer.collectCurrentAnswers(questions);
                const detailsRow = ResultRenderer.createCategoryQuestionsRow(categoryKey, questions, config, currentAnswers);
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
        detailsCell.colSpan = 3;
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

    static getTrafficLightColor(percentage, config) {
        if (!config) return 'transparent';

        if (config.green !== undefined) {
            if (percentage <= config.green) return 'green';
            if (percentage <= config.orange) return 'orange';
            return 'red';
        } else if (config.red !== undefined) {
            if (percentage <= config.red) return 'red';
            if (percentage <= config.orange) return 'orange';
            return 'green';
        }
        return 'transparent';
    }
}
