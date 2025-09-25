import { ResultTileRenderer } from './result-tile-renderer.js';
import { ResultTableRenderer } from './result-table-renderer.js';
import { ResultDataProcessor } from '../services/result-data-processor.js';

export class ResultRenderer {
    static render(scores, questions, config, container) {
        if (!container) {
            console.error("ResultRenderer.render: container is missing.");
            return;
        }
        
        container.innerHTML = ''; // Clear previous content
        
        // Process data once for all renderers
        const processedData = ResultDataProcessor.process(scores, questions, config);
        
        // Render tiles if enabled
        if (config.resulttiles?.enabled) {
            ResultTileRenderer.render(processedData, config, container);
        }
        
        // Always render table
        ResultTableRenderer.render(processedData, config, container);
    }
}
