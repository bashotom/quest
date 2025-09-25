import { GaugeChart } from './gauge-chart.js';
import { RadarChart } from './radar-chart.js';
import { ResultRenderer } from '../components/result-renderer.js';

/**
 * ChartRenderer - Manages all chart rendering with container isolation
 * Implements the "Solve interference through isolation" pattern
 */
export class ChartRenderer {
    static currentRenderingId = 0;
    static activeTimeouts = new Set();
    
    /**
     * Main chart rendering method with interference prevention
     */
    static render(chartType, scores, questions, config, options = {}) {
        const renderingId = ++ChartRenderer.currentRenderingId;
        
        // Cancel all previous timeouts to prevent race conditions
        ChartRenderer.activeTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        ChartRenderer.activeTimeouts.clear();
        
        // Hide all containers to prevent interference
        ChartRenderer.hideAllContainers();
        
        // Render result table if configured
        ChartRenderer.renderResultTable(scores, questions, config);
        
        switch (chartType) {
            case 'radar':
                return ChartRenderer.renderRadarChart(scores, renderingId, questions, config, options);
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
     * Render Radar Chart in dedicated container with complete DOM recreation
     */
    static renderRadarChart(scores, renderingId, questions, config, renderOptions) {
        const radarContainer = document.getElementById('radar-chart-container');
        if (!radarContainer) return;
        
        radarContainer.classList.remove('hidden');
        
        // COMPLETE DOM RECREATION: Remove and recreate the entire chart element
        const oldChartElement = document.getElementById('radarChart');
        if (oldChartElement) {
            oldChartElement.remove();
        }
        
        // Create completely new chart element
        const newChartElement = document.createElement('div');
        newChartElement.id = 'radarChart';
        newChartElement.className = 'w-full h-full';
        radarContainer.appendChild(newChartElement);
        
        // Use managed timeout to prevent race conditions
        const timeoutId = setTimeout(() => {
            // Remove from active timeouts
            ChartRenderer.activeTimeouts.delete(timeoutId);
            
            if (renderingId !== ChartRenderer.currentRenderingId) {
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
            const containerWidth = newChartElement.offsetWidth || 600;
            const containerHeight = newChartElement.offsetHeight || 400;

            const options = {
                ...renderOptions,
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
                const radarChart = new RadarChart(newChartElement, config);
                radarChart.render('#radarChart', chartData, options);
            } catch (error) {
                console.error('Error creating radar chart:', error);
                ChartRenderer.renderFallbackChart(scores, renderingId, config);
            }
        }, 50);
        
        // Track the timeout so it can be cancelled
        ChartRenderer.activeTimeouts.add(timeoutId);
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
        
        // Pass the chart configuration to the GaugeChart
        const chartConfig = config.chart || {};
        const chart = new GaugeChart(chartElement, chartConfig);
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

    /**
     * Render result table and/or result tiles if configured
     */
    static renderResultTable(scores, questions, config) {
        const tableContainer = document.getElementById('result-table-container');
        if (!tableContainer) return;

        // Render if either result table OR result tiles are enabled
        if (config.resulttable?.enabled === true || config.resulttiles?.enabled === true) {
            ResultRenderer.render(scores, questions, config, tableContainer);
            tableContainer.classList.remove('hidden');
        } else {
            tableContainer.innerHTML = '';
            tableContainer.classList.add('hidden');
        }
    }
}
