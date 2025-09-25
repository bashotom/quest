import { GaugeChart } from '../charts/gauge-chart.js';

export class ResultTileRenderer {
    static render(processedData, config, container) {
        const tilesWrapper = document.createElement('div');
        tilesWrapper.id = 'resulttiles';
        tilesWrapper.className = 'flex flex-wrap gap-4 mt-8';

        processedData.categoryData.forEach(categoryData => {
            const tile = this.createTile(categoryData, config);
            tilesWrapper.appendChild(tile);
            
            // Render gauge if enabled
            if (config.resulttiles.evaluation_gauge === true) {
                this.renderGaugeChart(categoryData, config);
            }
        });
        
        container.appendChild(tilesWrapper);
    }
    
    static createTile(categoryData, config) {
        const { categoryKey, categoryName, percentage, trafficLightColor } = categoryData;
        
        // Replace placeholders in header/content
        let header = this.replacePlaceholders(config.resulttiles.header || '', categoryName, percentage);
        let content = this.replacePlaceholders(config.resulttiles.content || '', categoryName, percentage);
        
        // Apply category-specific evaluation text if configured
        content = this.applyEvaluationText(content, categoryKey, percentage, config);
        
        const shouldShowGauge = config.resulttiles.evaluation_gauge === true;
        
        const tile = document.createElement('div');
        tile.className = 'bg-white rounded-lg shadow p-4 flex-1 min-w-[220px] max-w-xs';
        tile.innerHTML = `
            <div class="font-bold text-lg mb-2 flex items-center justify-between">
                <span>${categoryKey}: ${categoryName} ${Math.round(percentage)}%</span>
                <span class="inline-block w-6 h-6 rounded-full border border-gray-300" style="background-color: ${trafficLightColor};"></span>
            </div>
            <div class="text-gray-700 text-sm mb-4">${content}</div>
            ${shouldShowGauge ? `<div class="gauge-container w-full" style="height: 110px;" id="gauge-${categoryKey}"></div>` : ''}
        `;
        
        return tile;
    }
    
    static replacePlaceholders(text, categoryName, percentage) {
        return text.replace(/\{category\}/g, categoryName).replace(/\{percent\}/g, percentage);
    }
    
    static applyEvaluationText(content, categoryKey, percentage, config) {
        if (config.resulttiles.evaluation && config.resulttiles.evaluation[categoryKey]) {
            const categoryEvaluation = config.resulttiles.evaluation[categoryKey];
            const rangeText = this.getRangeText(percentage, categoryEvaluation.ranges, categoryEvaluation.texts);
            if (rangeText) {
                return rangeText;
            }
        }
        return content;
    }
    
    static renderGaugeChart(categoryData, config) {
        const { categoryKey, categoryName, score, maxScore, trafficLightConfig } = categoryData;
        
        requestAnimationFrame(() => {
            const gaugeContainer = document.getElementById(`gauge-${categoryKey}`);
            if (gaugeContainer && gaugeContainer.offsetWidth > 0) {
                try {
                    if (typeof d3 === 'undefined') {
                        console.error('D3.js library not loaded');
                        gaugeContainer.innerHTML = '<div class="text-center text-gray-500 p-4">D3.js nicht verfügbar</div>';
                        return;
                    }
                    
                    const gauge = new GaugeChart(gaugeContainer, {});
                    gauge.render(score, maxScore, categoryName, trafficLightConfig);
                } catch (error) {
                    console.error(`Error rendering gauge for category ${categoryKey}:`, error);
                    gaugeContainer.innerHTML = '<div class="text-center text-gray-500 p-4 text-xs">Gauge Chart Fehler:<br>' + error.message + '</div>';
                }
            } else {
                console.warn(`Gauge container not found or not visible for category ${categoryKey}`);
            }
        });
    }
    
    static getRangeText(percentage, ranges, rangeTexts) {
        if (!ranges || !rangeTexts || ranges.length === 0 || rangeTexts.length === 0) {
            return null;
        }

        // Support both 4-value ranges [0,30,60,100] and 3-value ranges [100,60,30]
        if ((ranges.length === 4 || ranges.length === 3) && rangeTexts.length === 3) {
            const isDescending = ranges[0] > ranges[ranges.length - 1];
            
            if (ranges.length === 4) {
                if (isDescending) {
                    for (let i = 0; i < ranges.length - 1; i++) {
                        const upperBound = ranges[i];
                        const lowerBound = ranges[i + 1];
                        if (percentage <= upperBound && percentage > lowerBound) {
                            return rangeTexts[i] || null;
                        }
                    }
                    if (percentage <= ranges[ranges.length - 1]) {
                        return rangeTexts[rangeTexts.length - 1];
                    }
                } else {
                    for (let i = 0; i < ranges.length - 1; i++) {
                        const lowerBound = ranges[i];
                        const upperBound = ranges[i + 1];
                        if (percentage >= lowerBound && percentage < upperBound) {
                            return rangeTexts[i] || null;
                        }
                    }
                    if (percentage >= ranges[ranges.length - 1]) {
                        return rangeTexts[rangeTexts.length - 1];
                    }
                }
            } else if (ranges.length === 3) {
                if (isDescending) {
                    if (percentage > ranges[1]) {
                        return rangeTexts[0];
                    } else if (percentage > ranges[2]) {
                        return rangeTexts[1];
                    } else {
                        return rangeTexts[2];
                    }
                } else {
                    if (percentage < ranges[1]) {
                        return rangeTexts[0];
                    } else if (percentage < ranges[2]) {
                        return rangeTexts[1];
                    } else {
                        return rangeTexts[2];
                    }
                }
            }
        }
        
        return null;
    }
}