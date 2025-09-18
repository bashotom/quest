import { RadarMathUtils } from './utils/radar-math-utils.js';

/**
 * RadarGrid - Grid rendering and axis management for radar charts
 */
export class RadarGrid {
    /**
     * Initialize SVG container for radar chart
     * @param {string} containerId - DOM selector for container
     * @param {Object} config - Chart configuration
     * @returns {Object} SVG and g elements
     */
    static initializeSVG(containerId, config) {
        // Remove any existing chart
        d3.select(containerId).select("svg").remove();

        // Create SVG
        const svg = d3.select(containerId).append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${config.w + config.margin.left + config.margin.right} ${config.h + config.margin.top + config.margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("class", "radar")
            .attr("data-chart-type", "radar");

        // Create main group with transform
        const g = svg.append("g")
            .attr("transform", `translate(${(config.w/2 + config.margin.left)},${(config.h/2 + config.margin.top)})`);

        // Add filter for glow effect
        this.addGlowFilter(g);

        return { svg, g };
    }

    /**
     * Add glow filter to SVG defs
     * @param {Object} g - D3 group selection
     */
    static addGlowFilter(g) {
        const filter = g.append('defs').append('filter').attr('id','glow');
        filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in','coloredBlur');
        feMerge.append('feMergeNode').attr('in','SourceGraphic');
    }

    /**
     * Render background circles for the grid
     * @param {Object} g - D3 group selection
     * @param {Object} config - Chart configuration
     * @returns {Object} Grid group selection
     */
    static renderBackgroundCircles(g, config) {
        const axisGrid = g.append("g").attr("class", "axisWrapper");

        const levels = axisGrid.selectAll(".levels")
            .data(d3.range(1, config.levels + 1).reverse())
            .enter()
            .append("g")
            .attr("class", "levels");

        // Create background circles
        levels.append("circle")
            .attr("class", "gridCircle")
            .attr("r", d => config.radius * d / config.levels)
            .style("fill", "#fff")
            .style("stroke", "#e2e8f0")
            .style("fill-opacity", config.opacityCircles);

        return axisGrid;
    }

    /**
     * Render axis lines
     * @param {Object} axisGrid - D3 axis grid selection
     * @param {Array} axes - Array of axis objects
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     * @returns {Object} Axis group selection
     */
    static renderAxisLines(axisGrid, axes, rScale, maxValue, angleSlice) {
        const axis = axisGrid.selectAll(".axis")
            .data(axes)
            .enter()
            .append("g")
            .attr("class", "axis");

        // Create axis lines
        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => rScale(maxValue) * Math.cos(angleSlice * i - Math.PI/2))
            .attr("y2", (d, i) => rScale(maxValue) * Math.sin(angleSlice * i - Math.PI/2))
            .attr("class", "line")
            .style("stroke", "#94a3b8")
            .style("stroke-width", "1px");

        return axis;
    }

    /**
     * Render tickmarks for specified axes
     * @param {Object} axisGrid - D3 axis grid selection
     * @param {Array} axes - Array of axis objects
     * @param {Object} chartConfig - Chart configuration
     * @param {Object} config - General configuration
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     */
    static renderTickmarks(axisGrid, axes, chartConfig, config, maxValue, angleSlice) {
        // Find axes that need tickmarks
        const tickmarkAxes = axes.map((axis, index) => ({ axis, index }))
            .filter(item => chartConfig.tickmarks.includes(item.axis.key));

        tickmarkAxes.forEach(({ axis, index }) => {
            const angle = angleSlice * index - Math.PI/2;
            const isInverseAxis = chartConfig.inverseradiusvector.includes(axis.key);
            
            // For each level value
            d3.range(1, config.levels + 1).forEach(levelIndex => {
                let levelValue, radiusAtLevel;
                
                if (isInverseAxis) {
                    // For inverse axes: outside 0, inside 100
                    levelValue = Math.round(maxValue * (config.levels - levelIndex) / config.levels);
                    radiusAtLevel = config.radius * levelIndex / config.levels;
                } else {
                    // For normal axes: inside 0, outside 100
                    levelValue = Math.round(maxValue * levelIndex / config.levels);
                    radiusAtLevel = config.radius * levelIndex / config.levels;
                }
                
                // Position for tickmark text
                const tickX = radiusAtLevel * Math.cos(angle);
                const tickY = radiusAtLevel * Math.sin(angle);
                
                // Check if it's the bottom vertical axis
                const isBottomVerticalAxis = Math.abs(angle - Math.PI/2) < 0.1;
                
                // Add tickmark text
                axisGrid.append("text")
                    .attr("class", "tickmark")
                    .attr("x", tickX + (Math.cos(angle) > 0 ? 5 : Math.cos(angle) < 0 ? -5 : 0))
                    .attr("y", tickY + (Math.sin(angle) > 0 ? 5 : Math.sin(angle) < 0 ? -5 : 0) - (isBottomVerticalAxis ? 9 : 0))
                    .style("font-size", "10px")
                    .style("fill", "#000000")
                    .style("text-anchor", Math.cos(angle) > 0 ? "start" : Math.cos(angle) < 0 ? "end" : "middle")
                    .text(levelValue);
            });
        });
    }

    /**
     * Add horizontal center line if configured
     * @param {Object} axisGrid - D3 axis grid selection
     * @param {Object} chartConfig - Chart configuration
     * @param {number} radius - Chart radius
     */
    static addHorizontalLine(axisGrid, chartConfig, radius) {
        if (chartConfig.horizontalline) {
            axisGrid.append("line")
                .attr("x1", -radius * 1.2)
                .attr("y1", 0)
                .attr("x2", radius * 1.2)
                .attr("y2", 0)
                .attr("class", "center-line-horizontal")
                .style("stroke", "#9ca3af")
                .style("stroke-width", "1px")
                .style("stroke-dasharray", "3,3");
        }
    }

    /**
     * Render axis labels
     * @param {Object} axis - D3 axis selection
     * @param {Array} axes - Array of axis objects
     * @param {Object} config - Chart configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     */
    static renderAxisLabels(axis, axes, config, rScale, maxValue, angleSlice) {
        const total = axes.length;

        axis.append("text")
            .attr("class", "legend")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#475569")
            .attr("text-anchor", (d, i) => {
                const angle = angleSlice * i - Math.PI/2;
                if (Math.abs(Math.cos(angle)) < 0.1) return "middle";
                return Math.cos(angle) > 0 ? "start" : "end";
            })
            .attr("dy", "0.3em")
            .attr("x", (d, i) => {
                const angle = angleSlice * i - Math.PI/2;
                let position = rScale(maxValue * config.labelFactor * 1.10) * Math.cos(angle);
                const offset = 10;
                const isVerticalAxis = Math.abs(Math.cos(angle)) < 0.1;
                const horizontalOffset = isVerticalAxis ? 0 : (Math.cos(angle) > 0 ? offset : Math.cos(angle) < 0 ? -offset : 0);
                return position + horizontalOffset;
            })
            .attr("y", (d, i) => {
                const angle = angleSlice * i - Math.PI/2;
                const basePosition = rScale(maxValue * config.labelFactor * 1.10) * Math.sin(angle);
                const normalizedPosition = (i / total) * 2 * Math.PI;
                
                const isVerticalAxis = Math.abs(Math.cos(angle)) < 0.1;
                const useShortLabels = window.innerWidth < 650;
                const verticalAdjustment = (isVerticalAxis && !useShortLabels) ? -25 : 0;
                
                if (Math.abs(normalizedPosition - Math.PI) < 0.1) return basePosition + 10 + verticalAdjustment;
                if (Math.abs(normalizedPosition) < 0.1) return basePosition - 10 + verticalAdjustment;
                
                const verticalOffset = Math.abs(Math.sin(normalizedPosition)) * -5;
                return basePosition + verticalOffset + verticalAdjustment;
            })
            .text(d => {
                if (!d) return 'ERR';
                
                const useShortLabels = window.innerWidth < 650;
                
                if (useShortLabels) {
                    return d.key || d.split?.(':')[0]?.trim() || 'ERR';
                } else {
                    return d.value || d || 'ERR';
                }
            })
            .call(RadarMathUtils.wrapText, config.wrapWidth);
    }

    /**
     * Update labels based on screen width
     * @param {Object} axis - D3 axis selection
     * @param {Object} config - Chart configuration
     */
    static updateLabels(axis, config) {
        const legends = axis.selectAll(".legend");
        
        legends.text(d => {
            if (d && typeof d === 'object' && d.key && d.value) {
                if (window.innerWidth < 650) {
                    return d.key;
                }
                return d.value;
            }
            return d;
        })
        .call(RadarMathUtils.wrapText, config.wrapWidth);
    }

    /**
     * Complete grid rendering
     * @param {Object} g - D3 group selection
     * @param {Array} axes - Array of axis objects
     * @param {Object} config - Chart configuration
     * @param {Object} chartConfig - Chart-specific configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     * @returns {Object} Axis selection and update function
     */
    static render(g, axes, config, chartConfig, rScale, maxValue, angleSlice) {
        // Render background circles
        const axisGrid = this.renderBackgroundCircles(g, config);
        
        // Render axis lines
        const axis = this.renderAxisLines(axisGrid, axes, rScale, maxValue, angleSlice);
        
        // Render tickmarks
        this.renderTickmarks(axisGrid, axes, chartConfig, config, maxValue, angleSlice);
        
        // Add horizontal line if configured
        this.addHorizontalLine(axisGrid, chartConfig, config.radius);
        
        // Render axis labels
        this.renderAxisLabels(axis, axes, config, rScale, maxValue, angleSlice);
        
        return {
            axis,
            updateLabels: () => this.updateLabels(axis, config)
        };
    }
}
