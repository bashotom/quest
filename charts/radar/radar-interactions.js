import { RadarMathUtils } from './utils/radar-math-utils.js';

/**
 * RadarInteractions - Tooltip and hover interactions for radar charts
 */
export class RadarInteractions {
    /**
     * Setup tooltip and mouse interactions for radar chart
     * @param {Object} g - D3 group selection
     * @param {Array} data - Chart data
     * @param {Array} axes - Array of axis objects
     * @param {Object} chartConfig - Chart configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     * @param {Object} config - Chart configuration
     */
    static setup(context) {
        const { g, processedData, allAxis, chartConfig, rScale, maxValue, angleSlice, finalConfig } = context;

        // Create tooltip
        const tooltip = this.createTooltip(g);
        
        // Create invisible circles for mouse interactions
        this.createInteractionCircles(g, processedData, allAxis, chartConfig, rScale, maxValue, angleSlice, finalConfig, tooltip);
    }

    /**
     * Create tooltip element
     * @param {Object} g - D3 group selection
     * @returns {Object} Tooltip selection
     */
    static createTooltip(g) {
        const tooltipGroup = g.append("g")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("pointer-events", "none");

        // Add circular background
        const circle = tooltipGroup.append("circle")
            .attr("class", "tooltip-circle")
            .attr("r", 18)
            .style("fill", "white")
            .style("stroke", "black")
            .style("stroke-width", "1px");

        // Add text
        const text = tooltipGroup.append("text")
            .attr("class", "tooltip-text")
            .style("font-size", "12px")
            .style("fill", "black")
            .style("text-anchor", "middle")
            .style("dominant-baseline", "middle");

        return tooltipGroup;
    }

    /**
     * Create invisible circles for mouse interactions
     * @param {Object} g - D3 group selection
     * @param {Array} data - Chart data
     * @param {Array} axes - Array of axis objects
     * @param {Object} chartConfig - Chart configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     * @param {Object} config - Chart configuration
     * @param {Object} tooltip - Tooltip selection
     */
    static createInteractionCircles(g, data, axes, chartConfig, rScale, maxValue, angleSlice, config, tooltip) {
        // Wrapper for invisible circles
        const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarCircleWrapper");

        // Create invisible circles for mouse interactions
        blobCircleWrapper.selectAll(".radarInvisibleCircle")
            .data(d => d)
            .enter().append("circle")
            .attr("class", "radarInvisibleCircle")
            .attr("r", config.dotRadius * 1.5)
            .attr("cx", (d, i) => {
                const position = this.calculatePosition(d, i, axes, chartConfig, rScale, maxValue, angleSlice);
                return position.x;
            })
            .attr("cy", (d, i) => {
                const position = this.calculatePosition(d, i, axes, chartConfig, rScale, maxValue, angleSlice);
                return position.y;
            })
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function(event, d) {
                RadarInteractions.showTooltip(d3.select(this), tooltip, d, chartConfig, config, maxValue);
            })
            .on("mouseout", function() {
                RadarInteractions.hideTooltip(tooltip);
            });
    }

    /**
     * Calculate position for data point considering inverse axes
     * @param {Object} d - Data point
     * @param {number} i - Index
     * @param {Array} axes - Array of axis objects
     * @param {Object} chartConfig - Chart configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     * @returns {Object} Position with x and y coordinates
     */
    static calculatePosition(d, i, axes, chartConfig, rScale, maxValue, angleSlice) {
        const axisKey = d.axis ? d.axis.key : axes[i]?.key;
        const isInverseAxis = chartConfig.inverseradiusvector.includes(axisKey);
        
        let radius;
        if (isInverseAxis) {
            const invertedValue = maxValue - d.value;
            radius = rScale(invertedValue);
        } else {
            radius = rScale(d.value);
        }
        
        return {
            x: radius * Math.cos(angleSlice * i - Math.PI/2),
            y: radius * Math.sin(angleSlice * i - Math.PI/2)
        };
    }

    /**
     * Show tooltip on mouseover
     * @param {Object} circle - D3 circle selection
     * @param {Object} tooltip - Tooltip selection
     * @param {Object} data - Data point
     * @param {Object} chartConfig - Chart configuration
     * @param {Object} config - Chart configuration
     * @param {number} maxValue - Maximum value
     */
    static showTooltip(circle, tooltip, data, chartConfig, config, maxValue) {
        const newX = parseFloat(circle.attr('cx'));
        const newY = parseFloat(circle.attr('cy')) - 30; // Position above the data point
        
        // Determine background color
        let backgroundColor = "white";
        let textColor = "black";
        let trafficLightColor = null;
        if (chartConfig.trafficlights && Array.isArray(config.config?.trafficlights)) {
            trafficLightColor = RadarMathUtils.getTrafficLightColor(data, config.config.trafficlights, maxValue);
            if (trafficLightColor) {
                backgroundColor = trafficLightColor;
                textColor = "white";
            }
        }
        
        tooltip
            .attr('transform', `translate(${newX}, ${newY})`)
            .select('.tooltip-circle')
            .style('fill', backgroundColor);
            
        tooltip
            .select('.tooltip-text')
            .text(Math.round(data.value))
            .style('fill', textColor);
            
        tooltip
            .transition().duration(200)
            .style('opacity', 1);
    }

    /**
     * Hide tooltip on mouseout
     * @param {Object} tooltip - Tooltip selection
     */
    static hideTooltip(tooltip) {
        tooltip.transition().duration(200)
            .style("opacity", 0);
    }

    /**
     * Create enhanced tooltip with axis information
     * @param {Object} circle - D3 circle selection
     * @param {Object} tooltip - Tooltip selection
     * @param {Object} data - Data point
     * @param {Object} axis - Axis information
     * @param {Object} chartConfig - Chart configuration (optional)
     * @param {Object} config - Chart configuration (optional)
     * @param {number} maxValue - Maximum value (optional)
     */
    static showEnhancedTooltip(circle, tooltip, data, axis, chartConfig, config, maxValue) {
        const newX = parseFloat(circle.attr('cx'));
        const newY = parseFloat(circle.attr('cy')) - 30; // Position above the data point
        
        const axisLabel = axis.value || axis.key || 'Unknown';
        const tooltipText = `${axisLabel}: ${Math.round(data.value)}`;
        
        // Check if text is too long, adjust circle radius if needed
        const textLength = tooltipText.length;
        const circleRadius = Math.max(18, textLength * 3.5); // Dynamic radius based on text length
        
        // Determine background color
        let backgroundColor = "white";
        let textColor = "black";
        
        // Check if traffic lights are enabled and get the color
        if (chartConfig && chartConfig.trafficlights && config && config.config && config.config.resulttable && config.config.resulttable.trafficlights && maxValue) {
            const trafficLightColor = RadarMathUtils.getTrafficLightColor(data, config.config.resulttable.trafficlights, maxValue);
            if (trafficLightColor) {
                backgroundColor = trafficLightColor;
                // Use white text on colored backgrounds for better readability
                textColor = "white";
            }
        }
        
        tooltip
            .attr('transform', `translate(${newX}, ${newY})`)
            .select('.tooltip-circle')
            .attr('r', circleRadius)
            .style('fill', backgroundColor);
            
        tooltip
            .select('.tooltip-text')
            .text(tooltipText)
            .style('fill', textColor);
            
        tooltip
            .transition().duration(200)
            .style('opacity', 1);
    }

    /**
     * Add hover effects to data points
     * @param {Object} circles - D3 circle selection
     * @param {Object} config - Chart configuration
     */
    static addHoverEffects(circles, config) {
        circles
            .on("mouseover", function() {
                d3.select(this)
                    .transition().duration(100)
                    .attr("r", config.dotRadius * 1.3)
                    .style("fill-opacity", 1);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition().duration(100)
                    .attr("r", config.dotRadius)
                    .style("fill-opacity", 0.8);
            });
    }

    /**
     * Setup click interactions for data points
     * @param {Object} circles - D3 circle selection
     * @param {Function} onClick - Click handler function
     */
    static setupClickInteractions(circles, onClick) {
        if (typeof onClick === 'function') {
            circles.on("click", function(event, d) {
                onClick(event, d, this);
            });
        }
    }
}
