import { ResultTileRenderer } from './result-tile-renderer.js';
import { ResultTableRenderer } from './result-table-renderer.js';
import { ResultDataProcessor } from '../services/result-data-processor.js';

export class ResultRenderer {
    static async render(scores, questions, config, container, folder = '') {
        if (!container) {
            console.error("ResultRenderer.render: container is missing.");
            return;
        }
        
        container.innerHTML = ''; // Clear previous content
        
        // Process data once for all renderers
        const processedData = ResultDataProcessor.process(scores, questions, config, folder);
        
        // Render tiles if enabled (async)
        if (config.resulttiles?.enabled) {
            await ResultTileRenderer.render(processedData, config, container);
        }
        
        // Render table if enabled
        if (config.resulttable?.enabled) {
            ResultTableRenderer.render(processedData, config, container);
        }
    }
}
