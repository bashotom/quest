import { QuestionRenderer } from './question-renderer.js';

export class ResultRenderer {
    static render(scores, questions, config, container) {
        // DEBUG: Log config.resulttiles and scores
        if (!container) {
            console.error("ResultRenderer.render: container is missing.");
            return;
        }
        container.innerHTML = ''; // Clear previous content at the very start
        // Render result tiles below the chart if enabled
        if (config.resulttiles && config.resulttiles.enabled) {
            const categories = Array.isArray(config.categories)
                ? config.categories.reduce((acc, cat) => ({ ...acc, ...cat }), {})
                : config.categories;

            const categoryMaxScores = {};
            Object.keys(categories).forEach(categoryKey => {
                const categoryQuestions = questions.filter(q => q.category === categoryKey);
                const maxAnswerValue = config.answers.reduce((max, ans) => Math.max(max, ans.value), 0);
                categoryMaxScores[categoryKey] = categoryQuestions.length * maxAnswerValue;
            });


            const tilesWrapper = document.createElement('div');
            tilesWrapper.id = 'resulttiles';
            tilesWrapper.className = 'flex flex-wrap gap-4 mt-8';

            Object.entries(scores).forEach(([categoryKey, score]) => {
                const categoryName = categories[categoryKey] || categoryKey;
                const maxScore = categoryMaxScores[categoryKey] || 0;
                const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

                // Replace placeholders in header/content
                let header = config.resulttiles.header || '';
                let content = config.resulttiles.content || '';
                header = header.replace(/\{category\}/g, categoryName).replace(/\{percent\}/g, percent);
                content = content.replace(/\{category\}/g, categoryName).replace(/\{percent\}/g, percent);

                // Apply range-based text if configured
                if (config.resulttiles.ranges && config.resulttiles.range_texts) {
                    const rangeText = ResultRenderer.getRangeText(percent, config.resulttiles.ranges, config.resulttiles.range_texts);
                    if (rangeText) {
                        content = rangeText;
                    }
                }

                // Ampelfarbe berechnen
                const trafficLightConfig = Array.isArray(config.trafficlights)
                    ? config.trafficlights.find(t => t.categories.split(',').map(s => s.trim()).includes(categoryKey))
                    : undefined;
                const trafficLightColor = ResultRenderer.getTrafficLightColor(percent, trafficLightConfig);

                const tile = document.createElement('div');
                tile.className = 'bg-white rounded-lg shadow p-4 flex-1 min-w-[220px] max-w-xs';
                tile.innerHTML = `
                    <div class="font-bold text-lg mb-2 flex items-center gap-2">
                        <span class="inline-block w-4 h-4 rounded-full border border-gray-300" style="background-color: ${trafficLightColor};"></span>
                        <span>${header}</span>
                    </div>
                    <div class="text-gray-700 text-sm">${content}</div>
                `;
                tilesWrapper.appendChild(tile);
            });
            container.appendChild(tilesWrapper);
        }

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
            
            // Trafficlight-Regel aus neuer Struktur (config.trafficlights)
            const trafficLightConfig = Array.isArray(config.trafficlights)
                ? config.trafficlights.find(t => t.categories.split(',').map(s => s.trim()).includes(categoryKey))
                : undefined;
            // Ampelfarbe berechnen
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

    static getRangeText(percentage, ranges, rangeTexts) {
        if (!ranges || !rangeTexts || ranges.length === 0 || rangeTexts.length === 0) {
            return null;
        }

        // Determine which range the percentage falls into
        for (let i = 0; i < ranges.length; i++) {
            if (percentage < ranges[i]) {
                return rangeTexts[i] || null;
            }
        }

        // If percentage is >= the highest range, return the last text
        return rangeTexts[ranges.length] || rangeTexts[rangeTexts.length - 1] || null;
    }
}
