import { RadarMathUtils } from './utils/radar-math-utils.js';

/**
 * RadarDataRenderer - Rendering of data paths, areas and points
 */
export class RadarDataRenderer {
    /**
     * Render data visualization (areas, strokes, and circles)
     * @param {Object} g - D3 group selection
     * @param {Array} data - Chart data
     * @param {Array} axes - Array of axis objects
     * @param {Object} chartConfig - Chart configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     * @param {Object} config - Chart configuration
     * @returns {Object} Blob wrapper and circles for interactions
     */
    static render(g, data, axes, chartConfig, rScale, maxValue, angleSlice, config) {
        // Create line generator with support for inverse radius vectors
        const radarLine = this.createRadarLine(axes, chartConfig, rScale, maxValue, angleSlice, config);
        
        // Create wrapper for data blobs
        const blobWrapper = g.selectAll(".radarWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarWrapper");

        // Render areas
        this.renderAreas(blobWrapper, radarLine, config);
        
        // Render strokes
        this.renderStrokes(blobWrapper, radarLine, config);
        
        // Render data points
        const circles = this.renderDataPoints(blobWrapper, axes, chartConfig, rScale, maxValue, angleSlice, config);
        
        return { blobWrapper, circles };
    }

    /**
     * Create radar line generator with inverse radius support
     * @param {Array} axes - Array of axis objects
     * @param {Object} chartConfig - Chart configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     * @param {Object} config - Chart configuration
     * @returns {Function} D3 line generator
     */
    static createRadarLine(axes, chartConfig, rScale, maxValue, angleSlice, config) {
        const radarLine = d3.lineRadial()
            .curve(d3.curveLinearClosed)
            .radius((d, i) => {
                const axisKey = d.axis ? d.axis.key : axes[i]?.key;
                const isInverseAxis = chartConfig.inverseradiusvector.includes(axisKey);
                
                if (isInverseAxis) {
                    // For inverse axes: invert the value (maxValue - value)
                    const invertedValue = maxValue - d.value;
                    return rScale(invertedValue);
                } else {
                    // For normal axes: use the value as is
                    return rScale(d.value);
                }
            })
            .angle((d, i) => i * angleSlice);

        // Apply curve style if configured
        if (config.roundStrokes) {
            radarLine.curve(d3.curveCardinalClosed);
        }

        return radarLine;
    }

    /**
     * Render area fills for data
     * @param {Object} blobWrapper - D3 blob wrapper selection
     * @param {Function} radarLine - D3 line generator
     * @param {Object} config - Chart configuration
     */
    static renderAreas(blobWrapper, radarLine, config) {
        blobWrapper
            .append("path")
            .attr("class", "radarArea")
            .attr("d", d => radarLine(d))
            .style("fill", (d, i) => config.color(i))
            .style("fill-opacity", config.opacityArea);
    }

    /**
     * Render stroke outlines for data
     * @param {Object} blobWrapper - D3 blob wrapper selection
     * @param {Function} radarLine - D3 line generator
     * @param {Object} config - Chart configuration
     */
    static renderStrokes(blobWrapper, radarLine, config) {
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", d => radarLine(d))
            .style("stroke-width", config.strokeWidth + "px")
            .style("stroke", (d, i) => config.color(i))
            .style("fill", "none")
            .style("filter", "url(#glow)");
    }

    /**
     * Render data points as circles
     * @param {Object} blobWrapper - D3 blob wrapper selection
     * @param {Array} axes - Array of axis objects
     * @param {Object} chartConfig - Chart configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     * @param {Object} config - Chart configuration
     * @returns {Object} Circle selections
     */
    static renderDataPoints(blobWrapper, axes, chartConfig, rScale, maxValue, angleSlice, config) {
        return blobWrapper.selectAll(".radarCircle")
            .data(d => d)
            .enter()
            .append("circle")
            .attr("class", "radarCircle")
            .attr("r", config.dotRadius)
            .attr("cx", (d, i) => {
                const position = this.calculateDataPointPosition(d, i, axes, chartConfig, rScale, maxValue, angleSlice);
                return position.x;
            })
            .attr("cy", (d, i) => {
                const position = this.calculateDataPointPosition(d, i, axes, chartConfig, rScale, maxValue, angleSlice);
                return position.y;
            })
            .style("fill", (d, i, nodes) => {
                // Get the parent dataset index
                const parentData = d3.select(nodes[i].parentNode).datum();
                const datasetIndex = blobWrapper.data().indexOf(parentData);
                return config.color(datasetIndex);
            })
            .style("fill-opacity", 0.8);
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
    static calculateDataPointPosition(d, i, axes, chartConfig, rScale, maxValue, angleSlice) {
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
     * Update data visualization with new data
     * @param {Object} blobWrapper - Existing blob wrapper selection
     * @param {Array} newData - New chart data
     * @param {Function} radarLine - D3 line generator
     * @param {Object} config - Chart configuration
     */
    static updateData(blobWrapper, newData, radarLine, config) {
        // Update areas
        blobWrapper.selectAll(".radarArea")
            .data(newData)
            .transition()
            .duration(500)
            .attr("d", d => radarLine(d));

        // Update strokes
        blobWrapper.selectAll(".radarStroke")
            .data(newData)
            .transition()
            .duration(500)
            .attr("d", d => radarLine(d));

        // Update circles would require recalculating positions
        // This is more complex and would need the full parameter set
    }

    /**
     * Add animations to data elements
     * @param {Object} blobWrapper - D3 blob wrapper selection
     * @param {Object} circles - D3 circle selections
     * @param {number} duration - Animation duration in ms
     */
    static addAnimations(blobWrapper, circles, duration = 1000) {
        // Animate areas
        blobWrapper.selectAll(".radarArea")
            .style("fill-opacity", 0)
            .transition()
            .duration(duration)
            .style("fill-opacity", config => config.opacityArea);

        // Animate strokes
        blobWrapper.selectAll(".radarStroke")
            .style("stroke-opacity", 0)
            .transition()
            .duration(duration)
            .style("stroke-opacity", 1);

        // Animate circles
        circles
            .attr("r", 0)
            .transition()
            .duration(duration)
            .delay((d, i) => i * 50)
            .attr("r", config => config.dotRadius);
    }
}
