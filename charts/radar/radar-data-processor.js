/**
 * RadarDataProcessor - Data processing and axis management for radar charts
 */
export class RadarDataProcessor {
    /**
     * Process raw data and normalize axis objects
     * @param {Array} data - Raw chart data
     * @param {Object} config - Chart configuration
     * @returns {Array} Processed data with normalized axis objects
     */
    static processData(data, config) {
        return data.map(dataset => 
            dataset.map(d => {
                const axisValue = d.axis;
                
                // If axis is already an object with key and value
                if (typeof axisValue === 'object' && axisValue.key && axisValue.value) {
                    return d;
                }
                
                // If axis is a string, try to parse it
                if (typeof axisValue === 'string') {
                    const key = config?.categories ? 
                        Object.entries(config.categories).find(([k, v]) => v === axisValue)?.[0] : null;
                    if (key) {
                        return {
                            ...d,
                            axis: { key, value: axisValue }
                        };
                    }
                }
                
                // Fallback for unknown axis format
                return {
                    ...d,
                    axis: { key: '?', value: String(axisValue) }
                };
            })
        );
    }

    /**
     * Extract axes from processed data
     * @param {Array} processedData - Processed chart data
     * @returns {Array} Array of axis objects
     */
    static extractAxes(processedData) {
        if (!processedData || !processedData[0]) {
            return [];
        }
        return processedData[0].map(item => item.axis);
    }

    /**
     * Reorder axes based on topaxis configuration
     * @param {Array} axes - Original axes array
     * @param {string} topAxisKey - Key of axis to place at top (12 o'clock)
     * @returns {Array} Reordered axes array
     */
    static reorderAxes(axes, topAxisKey) {
        if (!topAxisKey || !axes.length) {
            return axes;
        }

        const topAxisIndex = axes.findIndex(axis => axis.key === topAxisKey);
        
        if (topAxisIndex === -1) {
            return axes;
        }

        // Reorder so that topaxis comes first (12 o'clock position)
        return [
            ...axes.slice(topAxisIndex),
            ...axes.slice(0, topAxisIndex)
        ];
    }

    /**
     * Reorder data to match reordered axes
     * @param {Array} data - Original data array
     * @param {Array} originalAxes - Original axes order
     * @param {Array} reorderedAxes - New axes order
     * @returns {Array} Reordered data array
     */
    static reorderData(data, originalAxes, reorderedAxes) {
        if (originalAxes === reorderedAxes || !reorderedAxes.length) {
            return data;
        }

        const topAxisKey = reorderedAxes[0].key;
        const topAxisIndex = originalAxes.findIndex(axis => axis.key === topAxisKey);
        
        if (topAxisIndex === -1) {
            return data;
        }

        return data.map(dataset => [
            ...dataset.slice(topAxisIndex),
            ...dataset.slice(0, topAxisIndex)
        ]);
    }

    /**
     * Calculate maximum value in dataset
     * @param {Array} data - Chart data
     * @returns {number} Maximum value found in data
     */
    static calculateMaxValue(data) {
        if (!data || !data.length) {
            return 0;
        }
        return d3.max(data, dataset => d3.max(dataset.map(item => item.value)));
    }

    /**
     * Complete data processing pipeline
     * @param {Array} data - Raw chart data
     * @param {Object} config - Chart configuration
     * @returns {Object} Processed data and axes
     */
    static process(data, config) {
        // Step 1: Process raw data
        const processedData = this.processData(data, config);
        
        // Step 2: Extract initial axes
        const originalAxes = this.extractAxes(processedData);
        
        // Step 3: Reorder axes if topaxis is specified
        const topAxisKey = config?.chart?.topaxis;
        const reorderedAxes = this.reorderAxes(originalAxes, topAxisKey);
        
        // Step 4: Reorder data to match axes
        const reorderedData = this.reorderData(processedData, originalAxes, reorderedAxes);
        
        // Step 5: Calculate maximum value
        const maxValue = this.calculateMaxValue(reorderedData);

        return {
            data: reorderedData,
            axes: reorderedAxes,
            maxValue
        };
    }
}
