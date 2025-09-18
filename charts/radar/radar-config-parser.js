/**
 * RadarConfigParser - Configuration parsing and setup for radar charts
 */
export class RadarConfigParser {
    /**
     * Parse and setup radar chart configuration
     * @param {Object} options - User-provided options
     * @param {number} windowWidth - Current window width for responsive adjustments
     * @returns {Object} Parsed configuration object
     */
    static parseConfig(options = {}, windowWidth = window.innerWidth) {
        const cfg = {
            w: 600,
            h: 600,
            margin: { top: 30, right: 50, bottom: 30, left: 50 },
            levels: 3,
            maxValue: 0,
            labelFactor: 1.001,
            wrapWidth: 60,
            opacityArea: 0.35,
            opacityCircles: 0.1,
            strokeWidth: 2,
            roundStrokes: true,
            dotRadius: 4,
            color: d3.scaleOrdinal(d3.schemeCategory10)
        };

        // Adjust dimensions for critical screen widths to prevent label clipping
        if (windowWidth >= 650 && windowWidth <= 766) {
            cfg.w = 700; // Increase width for better label visibility
            cfg.h = 700; // Keep proportional
            cfg.margin.left = 70;
            cfg.margin.right = 70;
        }

        // Merge user-provided options
        if (options && typeof options === 'object') {
            for (const key in options) {
                if (options[key] !== undefined) {
                    cfg[key] = options[key];
                }
            }
        }

        return cfg;
    }

    /**
     * Parse chart-specific configuration (arrows, tickmarks, etc.)
     * @param {Object} config - Chart configuration object
     * @returns {Object} Parsed chart configuration
     */
    static parseChartConfig(config) {
        if (!config?.chart) {
            return { 
                radiusvector: [], 
                inverseradiusvector: [], 
                tickmarks: ['B', 'E'], 
                horizontalline: false 
            };
        }

        const chart = config.chart;
        
        return {
            radiusvector: this.parseConfigArray(chart.radiusvector),
            inverseradiusvector: this.parseConfigArray(chart.inverseradiusvector),
            tickmarks: this.parseConfigArray(chart.tickmarks) || ['B', 'E'],
            horizontalline: chart.horizontalline === 'yes' || chart.horizontalline === true,
            topaxis: chart.topaxis
        };
    }

    /**
     * Parse configuration array from string or array
     * @param {string|Array} value - Configuration value to parse
     * @returns {Array} Parsed array
     */
    static parseConfigArray(value) {
        if (Array.isArray(value)) {
            return value;
        }
        if (typeof value === 'string') {
            return value.split(',').map(s => s.trim());
        }
        return [];
    }

    /**
     * Calculate derived configuration values
     * @param {Object} cfg - Base configuration
     * @param {number} maxValue - Maximum value in data
     * @returns {Object} Configuration with derived values
     */
    static addDerivedConfig(cfg, maxValue) {
        return {
            ...cfg,
            radius: Math.min(cfg.w/2, cfg.h/2),
            maxValue: Math.max(cfg.maxValue, maxValue)
        };
    }
}
