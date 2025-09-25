/**
 * GaugeChart - Legacy compatibility wrapper
 * 
 * This file provides backward compatibility for existing code that imports GaugeChart.
 * It automatically delegates to the appropriate gauge type based on configuration.
 * 
 * @deprecated Use TachometerGauge or SimpleGauge directly for new code
 */
import { TachometerGauge } from './gauge/tachometer-gauge.js';
import { SimpleGauge } from './gauge/simple-gauge.js';

/**
 * Legacy GaugeChart class for backward compatibility
 * Automatically delegates to appropriate gauge implementation
 */
export class GaugeChart {
    constructor(container, config = {}) {
        this.container = container;
        this.config = config;
        this._gaugeInstance = null;
    }

    render(value, maxScore, categoryLabel, trafficLightConfig = null) {
        // Determine which gauge type to use
        const style = this.config.style || this.config.gauge_style || 'tachometer';
        
        // Create appropriate gauge instance
        if (style === 'simple') {
            this._gaugeInstance = new SimpleGauge(this.container, this.config);
            return this._gaugeInstance.render(value, maxScore, categoryLabel);
        } else {
            // Default to tachometer style
            this._gaugeInstance = new TachometerGauge(this.container, this.config);
            return this._gaugeInstance.render(value, maxScore, categoryLabel, trafficLightConfig);
        }
    }

    /**
     * Get the actual gauge instance for advanced usage
     */
    getGaugeInstance() {
        return this._gaugeInstance;
    }
}

// Re-export the individual gauge classes for direct usage
export { TachometerGauge } from './gauge/tachometer-gauge.js';
export { SimpleGauge } from './gauge/simple-gauge.js';