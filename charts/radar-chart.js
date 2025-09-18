import { RadarConfigParser } from './radar/radar-config-parser.js';
import { RadarDataProcessor } from './radar/radar-data-processor.js';
import { RadarMathUtils } from './radar/utils/radar-math-utils.js';
import { RadarGrid } from './radar/radar-grid.js';
import { RadarArrows } from './radar/radar-arrows.js';
import { RadarDataRenderer } from './radar/radar-data-renderer.js';
import { RadarInteractions } from './radar/radar-interactions.js';
import { RadarLegend } from './radar/radar-legend.js';
import { RadarResponsive } from './radar/radar-responsive.js';

/**
 * RadarChart - Modular D3.js Radar Chart Implementation
 * Renders radar charts for multi-category score visualization
 */
export class RadarChart {
    constructor(container, config) {
        this.container = container;
        this.config = config;
    }

    render(id, data, options) {
        // Parse and setup configuration
        const cfg = RadarConfigParser.parseConfig(options);
        
        // Process data and axes
        const processed = RadarDataProcessor.process(data, cfg.config);
        const { data: processedData, axes: allAxis, maxValue } = processed;
        
        // Calculate derived configuration
        const finalConfig = RadarConfigParser.addDerivedConfig(cfg, maxValue);
        
        // Parse chart-specific configuration
        const chartConfig = RadarConfigParser.parseChartConfig(cfg.config);
        
        // Calculate mathematical constants
        // Calculate mathematical constants
        const total = allAxis.length;
        const radius = finalConfig.radius;
        const angleSlice = RadarMathUtils.calculateAngleSlice(total);
        
        // Create D3 radius scale
        const rScale = RadarMathUtils.createRadiusScale(radius, finalConfig.maxValue);
        
        // Setup container context
        RadarResponsive.setupContainerContext(id);
        
        // Initialize SVG
        const { svg, g } = RadarGrid.initializeSVG(id, finalConfig);
        
        // Create a shared render context object to simplify parameter passing
        const renderContext = {
            g,
            allAxis,
            processedData,
            finalConfig,
            chartConfig,
            rScale,
            angleSlice,
            maxValue: finalConfig.maxValue
        };
        
        // Render grid (background circles, axes, tickmarks, labels)
        const gridResult = RadarGrid.render(renderContext);
        
        // Add grid result to context for subsequent modules
        renderContext.gridResult = gridResult;
        
        // Render arrows on axes
        RadarArrows.render(renderContext);
        
        // Render data visualization (areas, strokes, points)
        const dataResult = RadarDataRenderer.render(renderContext);
        
        // Setup interactions (tooltips, hover effects)
        RadarInteractions.setup(renderContext);
        
        // Render legend for mobile
        RadarLegend.render(id, finalConfig);
        
        // DISABLED: Responsive handling to prevent race conditions
        // Since we recreate charts completely on each update, resize handling is not needed
        // RadarResponsive.setup(id, data, options, (containerId, chartData, chartOptions) => {
        //     new RadarChart(this.container, this.config).render(containerId, chartData, chartOptions);
        // });
        
        // Store reference to grid update function for responsive updates
        this.gridUpdate = gridResult;
        
        return this;
    }
}
