import { GaugeChart } from './gauge-chart.js';

/**
 * ChartRenderer - Manages all chart rendering with container isolation
 * Implements the "Solve interference through isolation" pattern
 */
export class ChartRenderer {
    static currentRenderingId = 0;
    
    /**
     * Main chart rendering method with interference prevention
     */
    static render(chartType, scores, questions, config) {
        const renderingId = ++ChartRenderer.currentRenderingId;
        console.log(`🎨 Chart rendering started - Type: ${chartType}, ID: ${renderingId}`);
        
        // Hide all containers to prevent interference
        ChartRenderer.hideAllContainers();
        
        switch (chartType) {
            case 'radar':
                return ChartRenderer.renderRadarChart(scores, renderingId, questions, config);
            case 'gauge':
                return ChartRenderer.renderGaugeChart(scores, renderingId, questions, config);
            case 'bar':
                return ChartRenderer.renderBarChart(scores, renderingId, questions, config);
            default:
                return ChartRenderer.renderFallbackChart(scores, renderingId, config);
        }
    }
    
    /**
     * Hide all chart containers (prevention via architecture)
     */
    static hideAllContainers() {
        document.querySelectorAll('.chart-type-container').forEach(c => c.classList.add('hidden'));
    }
    
    /**
     * Render Radar Chart in dedicated container
     */
    static renderRadarChart(scores, renderingId, questions, config) {
        const radarContainer = document.getElementById('radar-chart-container');
        if (!radarContainer) return;
        
        radarContainer.classList.remove('hidden');
        const chartElement = document.getElementById('radarChart');
        if (!chartElement) return;
        
        // Wait for DOM update
        setTimeout(() => {
            if (renderingId !== ChartRenderer.currentRenderingId) {
                console.log('Radar chart rendering cancelled - newer request exists');
                return;
            }
            
            // Calculate max scores per category
            const categoryMaxScores = {};
            Object.keys(config.categories).forEach(category => {
                const categoryQuestions = questions.filter(q => q.category === category);
                const maxAnswer = Math.max(...config.answers.map(a => a.value));
                categoryMaxScores[category] = categoryQuestions.length * maxAnswer;
            });

            // Normalized data
            const data = Object.keys(config.categories).map(key => {
                const value = scores[key] || 0;
                const maxForCategory = categoryMaxScores[key];
                return (value / maxForCategory) * 100;
            });

            const chartData = [
                Object.keys(config.categories).map((key, index) => ({
                    axis: { key: key, value: config.categories[key] },
                    value: data[index]
                }))
            ];

            const screenWidth = window.innerWidth;
            const containerWidth = chartElement.offsetWidth || 600;
            const containerHeight = chartElement.offsetHeight || 400;

            const options = {
                margin: screenWidth < 640 ? 
                    { top: 40, right: 40, bottom: 40, left: 40 } : 
                    { top: 50, right: 50, bottom: 50, left: 50 },
                w: containerWidth - (screenWidth < 640 ? 80 : 100),
                h: containerHeight - (screenWidth < 640 ? 80 : 100),
                maxValue: 100,
                levels: 5,
                roundStrokes: true,
                color: d3.scaleOrdinal().range(["#3b82f6"]),
                format: '.0f',
                unit: '%',
                config: config
            };

            try {
                if (typeof window.RadarChart === 'function') {
                    chartElement.innerHTML = ''; // Clear container
                    window.RadarChart('#radarChart', chartData, options);
                } else {
                    console.warn('RadarChart function not available, using fallback');
                    ChartRenderer.renderFallbackChart(scores, renderingId, config);
                }
            } catch (error) {
                console.error('Error creating radar chart:', error);
                ChartRenderer.renderFallbackChart(scores, renderingId, config);
            }
        }, 100);
    }
    
    /**
     * Render Gauge Chart in dedicated container
     */
    static renderGaugeChart(scores, renderingId, questions, config) {
        const gaugeContainer = document.getElementById('gauge-chart-container');
        if (!gaugeContainer) return;
        
        gaugeContainer.classList.remove('hidden');
        const chartElement = document.getElementById('gaugeChart');
        if (!chartElement) return;
        
        // Check if rendering is still current
        if (renderingId !== ChartRenderer.currentRenderingId) {
            console.log('Gauge chart rendering cancelled - newer request exists');
            return;
        }
        
        // Use first category for Gauge
        const firstCategoryKey = Object.keys(config.categories)[0];
        const value = scores[firstCategoryKey] || 0;
        const categoryLabel = config.categories[firstCategoryKey];
        
        // Calculate max score for this category
        const categoryQuestions = questions.filter(q => q.category === firstCategoryKey);
        const maxAnswer = Math.max(...config.answers.map(a => a.value));
        const maxScore = categoryQuestions.length * maxAnswer;
        
        const chart = new GaugeChart(chartElement, config);
        chart.render(value, maxScore, categoryLabel);
    }
    
    /**
     * Render Bar Chart in dedicated container
     */
    static renderBarChart(scores, renderingId, questions, config) {
        const barContainer = document.getElementById('bar-chart-container');
        if (!barContainer) return;
        
        barContainer.classList.remove('hidden');
        const chartElement = document.getElementById('barChart');
        if (!chartElement) return;
        
        // For now, use fallback - can be extended later
        ChartRenderer.renderFallbackChart(scores, renderingId, config, chartElement);
    }
    
    /**
     * Render fallback chart when other types fail
     */
    static renderFallbackChart(scores, renderingId, config, container = null) {
        if (renderingId !== ChartRenderer.currentRenderingId) {
            console.log('Fallback chart rendering cancelled - newer request exists');
            return;
        }
        
        if (!container) {
            const radarContainer = document.getElementById('radar-chart-container');
            if (radarContainer) {
                radarContainer.classList.remove('hidden');
                container = document.getElementById('radarChart');
            }
        }
        
        if (!container) return;
        
        let html = '<div class="bg-white border rounded-lg p-6"><h3 class="text-lg font-bold mb-4">Ergebnisse:</h3><ul class="space-y-2">';
        Object.entries(scores).forEach(([category, score]) => {
            const categoryName = config.categories[category] || category;
            html += `<li class="flex justify-between"><span><strong>${categoryName}:</strong></span><span class="font-mono">${score}</span></li>`;
        });
        html += '</ul></div>';
        container.innerHTML = html;
    }
}
