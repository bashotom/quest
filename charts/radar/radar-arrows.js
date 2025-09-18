import { RadarMathUtils } from './utils/radar-math-utils.js';

/**
 * RadarArrows - Arrow rendering for radar chart axes
 */
export class RadarArrows {
    /**
     * Render arrows on specific axes based on configuration
     * @param {Object} axis - D3 axis selection
     * @param {Array} axes - Array of axis objects
     * @param {Object} chartConfig - Chart configuration
     * @param {Function} rScale - D3 radius scale
     * @param {number} maxValue - Maximum value
     * @param {number} angleSlice - Angle slice in radians
     */
    static render(axis, axes, chartConfig, rScale, maxValue, angleSlice) {
        axis.each(function(d, i) {
            // Check axis key for compatibility with different data formats
            const axisKey = d.key || d;
            const axisValue = d.value || d;
            const angle = angleSlice * i - Math.PI/2;
            const endX = rScale(maxValue) * Math.cos(angle);
            const endY = rScale(maxValue) * Math.sin(angle);
            
            // Check if this axis should have an arrow
            const isInRadiusVector = chartConfig.radiusvector.includes(axisKey) || 
                                   chartConfig.radiusvector.includes(axisValue);
            const isInInverseVector = chartConfig.inverseradiusvector.includes(axisKey) || 
                                    chartConfig.inverseradiusvector.includes(axisValue);
            
            if (isInRadiusVector) {
                RadarArrows.renderOutwardArrow(d3.select(this), endX, endY, angle);
            } else if (isInInverseVector) {
                RadarArrows.renderInwardArrow(d3.select(this), endX, endY, angle);
            }
        });
    }

    /**
     * Render outward-pointing arrow (radiusvector)
     * @param {Object} axisSelection - D3 selection for current axis
     * @param {number} endX - X coordinate of axis end
     * @param {number} endY - Y coordinate of axis end
     * @param {number} angle - Angle of the axis in radians
     */
    static renderOutwardArrow(axisSelection, endX, endY, angle) {
        const arrowSize = 8;
        const extendX = endX; // Arrow tip flush with last circle
        const extendY = endY; // Arrow tip flush with last circle
        
        // Calculate triangle points - base slightly inward
        const perpAngle = angle + Math.PI/2;
        const baseDistance = 0.92; // Base slightly inward
        const px1 = endX * baseDistance + Math.cos(perpAngle) * arrowSize/2;
        const py1 = endY * baseDistance + Math.sin(perpAngle) * arrowSize/2;
        const px2 = endX * baseDistance - Math.cos(perpAngle) * arrowSize/2;
        const py2 = endY * baseDistance - Math.sin(perpAngle) * arrowSize/2;
        
        axisSelection.append("polygon")
            .attr("points", `${extendX},${extendY} ${px1},${py1} ${px2},${py2}`)
            .attr("class", "arrow-triangle outward-arrow")
            .style("fill", "#64748b")
            .style("stroke", "#64748b")
            .style("stroke-width", "1px")
            .style("opacity", "0.8");
    }

    /**
     * Render inward-pointing arrow (inverseradiusvector)
     * @param {Object} axisSelection - D3 selection for current axis
     * @param {number} endX - X coordinate of axis end
     * @param {number} endY - Y coordinate of axis end
     * @param {number} angle - Angle of the axis in radians
     */
    static renderInwardArrow(axisSelection, endX, endY, angle) {
        const arrowSize = 8; // Same size as outward arrows
        
        // Base of triangle at outer edge (flush with last circle)
        const baseX = endX;
        const baseY = endY;
        
        // Calculate the two base points of triangle at outer edge
        const perpAngle = angle + Math.PI/2;
        const px1 = baseX + Math.cos(perpAngle) * arrowSize/2;
        const py1 = baseY + Math.sin(perpAngle) * arrowSize/2;
        const px2 = baseX - Math.cos(perpAngle) * arrowSize/2;
        const py2 = baseY - Math.sin(perpAngle) * arrowSize/2;
        
        // Arrow tip inward (pointing to center)
        const tipDistance = 0.92; // Tip inward
        const tipX = endX * tipDistance;
        const tipY = endY * tipDistance;
        
        axisSelection.append("polygon")
            .attr("points", `${tipX},${tipY} ${px1},${py1} ${px2},${py2}`)
            .attr("class", "arrow-triangle inward-arrow")
            .style("fill", "#64748b") // Same color as outward arrows
            .style("stroke", "#64748b") // Same color as outward arrows
            .style("stroke-width", "1px")
            .style("opacity", "0.8");
    }

    /**
     * Get arrow configuration for an axis
     * @param {Object} axis - Axis object
     * @param {Object} chartConfig - Chart configuration
     * @returns {string|null} Arrow type ('outward', 'inward', or null)
     */
    static getArrowType(axis, chartConfig) {
        const axisKey = axis.key || axis;
        const axisValue = axis.value || axis;
        
        if (chartConfig.radiusvector.includes(axisKey) || 
            chartConfig.radiusvector.includes(axisValue)) {
            return 'outward';
        }
        
        if (chartConfig.inverseradiusvector.includes(axisKey) || 
            chartConfig.inverseradiusvector.includes(axisValue)) {
            return 'inward';
        }
        
        return null;
    }

    /**
     * Calculate arrow properties for rendering
     * @param {number} endX - X coordinate of axis end
     * @param {number} endY - Y coordinate of axis end
     * @param {number} angle - Angle of the axis in radians
     * @param {string} type - Arrow type ('outward' or 'inward')
     * @param {number} arrowSize - Size of the arrow
     * @returns {Object} Arrow properties
     */
    static calculateArrowProperties(endX, endY, angle, type, arrowSize = 8) {
        const perpAngle = angle + Math.PI/2;
        
        if (type === 'outward') {
            const baseDistance = 0.92;
            return {
                tipX: endX,
                tipY: endY,
                base1X: endX * baseDistance + Math.cos(perpAngle) * arrowSize/2,
                base1Y: endY * baseDistance + Math.sin(perpAngle) * arrowSize/2,
                base2X: endX * baseDistance - Math.cos(perpAngle) * arrowSize/2,
                base2Y: endY * baseDistance - Math.sin(perpAngle) * arrowSize/2
            };
        } else { // inward
            const tipDistance = 0.92;
            return {
                tipX: endX * tipDistance,
                tipY: endY * tipDistance,
                base1X: endX + Math.cos(perpAngle) * arrowSize/2,
                base1Y: endY + Math.sin(perpAngle) * arrowSize/2,
                base2X: endX - Math.cos(perpAngle) * arrowSize/2,
                base2Y: endY - Math.sin(perpAngle) * arrowSize/2
            };
        }
    }
}
