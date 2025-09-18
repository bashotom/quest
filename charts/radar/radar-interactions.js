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
        return g.append("text")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("font-size", "12px")
            .style("fill", "#000")
            .style("text-anchor", "middle")
            .style("pointer-events", "none");
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
                RadarInteractions.showTooltip(d3.select(this), tooltip, d);
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
     */
    static showTooltip(circle, tooltip, data) {
        const newX = parseFloat(circle.attr('cx')) - 10;
        const newY = parseFloat(circle.attr('cy')) - 10;
        
        tooltip
            .attr('x', newX)
            .attr('y', newY)
            .text(data.value.toFixed(1))
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
     */
    static showEnhancedTooltip(circle, tooltip, data, axis) {
        const newX = parseFloat(circle.attr('cx')) - 10;
        const newY = parseFloat(circle.attr('cy')) - 10;
        
        const axisLabel = axis.value || axis.key || 'Unknown';
        const tooltipText = `${axisLabel}: ${data.value.toFixed(1)}`;
        
        tooltip
            .attr('x', newX)
            .attr('y', newY)
            .text(tooltipText)
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
