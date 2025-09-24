/**
 * RadarMathUtils - Mathematical calculations and utilities for radar charts
 */
export class RadarMathUtils {
    /**
     * Calculate angle slice for radar chart
     * @param {number} total - Total number of axes
     * @returns {number} Angle slice in radians
     */
    static calculateAngleSlice(total) {
        return Math.PI * 2 / total;
    }

    /**
     * Calculate coordinates for a point on the radar chart
     * @param {number} radius - Distance from center
     * @param {number} angleSlice - Angle slice in radians
     * @param {number} index - Index of the axis
     * @returns {Object} Object with x and y coordinates
     */
    static calculateCoordinates(radius, angleSlice, index) {
        const angle = angleSlice * index - Math.PI/2;
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        };
    }

    /**
     * Create D3 line generator for radar chart paths
     * @param {Function} rScale - D3 scale function for radius
     * @param {number} angleSlice - Angle slice in radians
     * @returns {Function} D3 line generator
     */
    static createLineRadial(rScale, angleSlice) {
        return d3.lineRadial()
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);
    }

    /**
     * Create D3 area generator for radar chart areas
     * @param {Function} rScale - D3 scale function for radius
     * @param {number} angleSlice - Angle slice in radians
     * @returns {Function} D3 area generator
     */
    static createAreaRadial(rScale, angleSlice) {
        return d3.areaRadial()
            .innerRadius(0)
            .outerRadius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);
    }

    /**
     * Calculate text anchor for axis labels
     * @param {number} angleSlice - Angle slice in radians
     * @param {number} index - Index of the axis
     * @returns {string} Text anchor value ('start', 'middle', or 'end')
     */
    static calculateTextAnchor(angleSlice, index) {
        const angle = angleSlice * index - Math.PI/2;
        const x = Math.cos(angle);
        
        if (Math.abs(x) < 0.1) return 'middle';
        return x > 0 ? 'start' : 'end';
    }

    /**
     * Calculate if a coordinate is on the left side of the chart
     * @param {number} angleSlice - Angle slice in radians
     * @param {number} index - Index of the axis
     * @returns {boolean} True if on left side
     */
    static isOnLeftSide(angleSlice, index) {
        const angle = angleSlice * index - Math.PI/2;
        return Math.cos(angle) < 0;
    }

    /**
     * Calculate arrow direction based on axis position
     * @param {number} angleSlice - Angle slice in radians
     * @param {number} index - Index of the axis
     * @param {boolean} isInverse - Whether this is an inverse arrow
     * @returns {number} Rotation angle in degrees
     */
    static calculateArrowRotation(angleSlice, index, isInverse = false) {
        const angle = (angleSlice * index - Math.PI/2) * (180 / Math.PI);
        return isInverse ? angle + 180 : angle;
    }

    /**
     * Create D3 scale for radius
     * @param {number} radius - Maximum radius
     * @param {number} maxValue - Maximum data value
     * @returns {Function} D3 scale function
     */
    static createRadiusScale(radius, maxValue) {
        return d3.scaleLinear()
            .range([0, radius])
            .domain([0, maxValue]);
    }

    /**
     * Calculate optimal label positioning to avoid overlaps
     * @param {Array} axes - Array of axis objects
     * @param {number} radius - Chart radius
     * @param {number} angleSlice - Angle slice in radians
     * @param {number} labelFactor - Label distance factor
     * @returns {Array} Array of label positions
     */
    static calculateLabelPositions(axes, radius, angleSlice, labelFactor) {
        return axes.map((axis, index) => {
            const coords = this.calculateCoordinates(radius * labelFactor, angleSlice, index);
            const textAnchor = this.calculateTextAnchor(angleSlice, index);
            const onLeftSide = this.isOnLeftSide(angleSlice, index);
            
            return {
                x: coords.x,
                y: coords.y,
                textAnchor,
                onLeftSide,
                axis
            };
        });
    }

    /**
     * Wrap text to fit within specified width
     * @param {Object} text - D3 text selection
     * @param {number} width - Maximum width
     */
    static wrapText(text, width) {
        text.each(function() {
            const text = d3.select(this);
            const words = text.text().split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            const lineHeight = 1.4; // ems
            const y = text.attr("y");
            const x = text.attr("x");
            const dy = 0; //parseFloat(text.attr("dy"));
            let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
            
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

    /**
     * Calculate traffic light color for a data point based on config and score
     * @param {Object} dataPoint - Data point with axis and value
     * @param {Array} trafficLightRules - Array of traffic light rules from resulttable.trafficlights
     * @param {number} maxValue - Maximum possible value (typically 100 for percentages)
     * @returns {string} Color code (#ff0000 for red, #ffa500 for orange, #008000 for green) or null if no rule applies
     */
    static getTrafficLightColor(dataPoint, trafficLightRules, maxValue = 100) {
        if (!trafficLightRules || !Array.isArray(trafficLightRules) || !dataPoint?.axis?.key) {
            return null;
        }

        const categoryKey = dataPoint.axis.key;
        const value = dataPoint.value;

        // Find matching traffic light rule for this category
        const matchingRule = trafficLightRules.find(rule => {
            const categories = rule.categories.split(',').map(cat => cat.trim());
            return categories.includes(categoryKey);
        });

        if (!matchingRule) {
            return null;
        }

        // Calculate thresholds as percentages of maxValue
        const redThreshold = (matchingRule.red || 0);
        const orangeThreshold = (matchingRule.orange || 0);
        const greenThreshold = (matchingRule.green || 0);

        // Handle different rule types based on available thresholds
        if (matchingRule.red !== undefined && matchingRule.orange !== undefined) {
            // Standard rule: red below red threshold, orange between red and orange, green above orange
            if (value <= redThreshold) {
                return '#ff4444'; // Red
            } else if (value <= orangeThreshold) {
                return '#ffa500'; // Orange
            } else {
                return '#00aa00'; // Green
            }
        } else if (matchingRule.green !== undefined && matchingRule.orange !== undefined) {
            // Inverse rule: green below green threshold, orange between green and orange, red above orange
            if (value <= greenThreshold) {
                return '#00aa00'; // Green
            } else if (value <= orangeThreshold) {
                return '#ffa500'; // Orange
            } else {
                return '#ff4444'; // Red
            }
        }

        return null; // No matching rule format
    }
}
