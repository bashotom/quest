/**
 * TachometerGauge - Traditional tachometer-style gauge with arcs and needle
 * Follows D3.js coordinate system consistency pattern from instructions
 * 
 * Uses the critical D3.js pattern for gauge charts:
 * - Same coordinate system throughout (degrees to radians conversion ONCE)
 * - Identical radian values for arcs, pointer, and tick marks
 * - Prevents coordinate system conflicts between SVG and mathematical calculations
 */
export class TachometerGauge {
    constructor(container, config = {}) {
        this.container = container;
        this.config = config;
    }

    render(value, maxScore, categoryLabel, trafficLightConfig = null) {
        // Clear container
        this.container.innerHTML = '';

        // Validate inputs
        if (!this._validateInputs(value, maxScore)) {
            return;
        }

        return this._renderTachometer(value, maxScore, categoryLabel, trafficLightConfig);
    }

    /**
     * Validates input parameters
     * @private
     */
    _validateInputs(value, maxScore) {
        if (isNaN(value) || isNaN(maxScore) || maxScore <= 0) {
            console.error('TachometerGauge: Invalid value or maxScore parameters');
            return false;
        }
        return true;
    }

    /**
     * Gets container dimensions for responsive rendering
     * @private
     */
    _getContainerDimensions() {
        const width = this.container.offsetWidth || 400; // Fallback width
        const height = this.container.offsetHeight || 350; // Fallback height
        
        return {
            width: Math.max(width, 300),  // Minimum width
            height: Math.max(height, 200) // Minimum height
        };
    }

    /**
     * Creates base SVG element
     * @private
     */
    _createBaseSVG() {
        const { width, height } = this._getContainerDimensions();
        
        return d3.select(this.container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("overflow", "hidden");
    }

    /**
     * Renders the tachometer gauge
     * @private
     */
    _renderTachometer(value, maxScore, categoryLabel, trafficLightConfig = null) {
        const { width: containerWidth, height: containerHeight } = this._getContainerDimensions();
        const svg = this._createBaseSVG();
        
        // Calculate gauge size for better container fitting
        const gaugeSize = Math.max(180, Math.min(containerWidth, containerHeight) * 1.2);
        const radius = (gaugeSize / 2) - 50;
        
        // Create main group positioned lower in container
        const g = svg.append("g")
            .attr("transform", `translate(${containerWidth/2}, ${containerHeight * 0.65})`);
        
        // Get angle configuration
        const { startAngle, endAngle, valueAngle } = this._calculateAngles(value, maxScore);
        
        // Render gauge components
        this._renderGaugeBackground(g, radius, startAngle, endAngle);
        this._renderTrafficLightSegments(g, radius, startAngle, endAngle, value, maxScore, trafficLightConfig);
        this._renderValueArc(g, radius, startAngle, valueAngle, value, maxScore);
        this._renderTickMarks(g, radius, maxScore);
        this._renderNeedle(g, radius, valueAngle);
    }

    /**
     * Calculate angles for tachometer gauge using consistent coordinate system
     * CRITICAL: This maintains the proven D3.js pattern from instructions
     * @private
     */
    _calculateAngles(value, maxScore) {
        // Use config.scale_angles if present, else fallback to 200-340 degrees
        let startAngleDeg = 200;
        let endAngleDeg = 340;
        
        if (Array.isArray(this.config.scale_angles) && this.config.scale_angles.length === 3) {
            startAngleDeg = this.config.scale_angles[0];
            endAngleDeg = this.config.scale_angles[2];
        }
        
        const totalAngleDeg = endAngleDeg - startAngleDeg;
        
        // Convert degrees to radians ONCE (critical for consistency)
        const startAngle = (startAngleDeg * Math.PI) / 180;
        const endAngle = (endAngleDeg * Math.PI) / 180;
        
        // Calculate value position using SAME system
        const valueRatio = Math.min(value / maxScore, 1);
        const valueAngleDeg = startAngleDeg + valueRatio * totalAngleDeg;
        const valueAngle = (valueAngleDeg * Math.PI) / 180;
        
        return { startAngle, endAngle, valueAngle, startAngleDeg, endAngleDeg };
    }

    /**
     * Renders the background arc for tachometer gauge
     * @private
     */
    _renderGaugeBackground(g, radius, startAngle, endAngle) {
        const backgroundArc = d3.arc()
            .innerRadius(radius * 0.7)
            .outerRadius(radius * 0.9)
            .startAngle(startAngle)
            .endAngle(endAngle);

        g.append("path")
            .attr("d", backgroundArc)
            .attr("transform", "rotate(90)")
            .style("fill", "#e5e7eb");
    }

    /**
     * Renders traffic light segments if configured
     * @private
     */
    _renderTrafficLightSegments(g, radius, startAngle, endAngle, value, maxScore, trafficLightConfig) {
        if (!trafficLightConfig) return;

        const percentage = Math.round((value / maxScore) * 100);
        const segments = this._getTrafficLightSegments(trafficLightConfig);
        
        segments.forEach(segment => {
            if (segment.end > segment.start) {
                const startAngleRad = startAngle + ((segment.start / 100) * (endAngle - startAngle));
                const endAngleRad = startAngle + ((segment.end / 100) * (endAngle - startAngle));
                
                const segmentArc = d3.arc()
                    .innerRadius(radius * 0.7)
                    .outerRadius(radius * 0.9)
                    .startAngle(startAngleRad)
                    .endAngle(endAngleRad);
                
                g.append("path")
                    .attr("d", segmentArc)
                    .attr("transform", "rotate(90)")
                    .style("fill", segment.color)
                    .style("opacity", segment.opacity);
            }
        });
    }

    /**
     * Gets traffic light segments configuration
     * @private
     */
    _getTrafficLightSegments(trafficLightConfig) {
        if (trafficLightConfig.green !== undefined) {
            // Normal logic: low values = red, high values = green
            return [
                { start: 0, end: trafficLightConfig.red || 0, color: "#ef4444", opacity: 0.3 },
                { start: trafficLightConfig.red || 0, end: trafficLightConfig.orange || 0, color: "#f97316", opacity: 0.3 },
                { start: trafficLightConfig.orange || 0, end: 100, color: "#22c55e", opacity: 0.3 }
            ];
        } else if (trafficLightConfig.red !== undefined) {
            // Inverse logic: low values = green, high values = red
            return [
                { start: 0, end: trafficLightConfig.green || 0, color: "#22c55e", opacity: 0.3 },
                { start: trafficLightConfig.green || 0, end: trafficLightConfig.orange || 0, color: "#f97316", opacity: 0.3 },
                { start: trafficLightConfig.orange || 0, end: 100, color: "#ef4444", opacity: 0.3 }
            ];
        }
        return [];
    }

    /**
     * Renders the value arc showing current score
     * @private
     */
    _renderValueArc(g, radius, startAngle, valueAngle, value, maxScore) {
        const valueRatio = Math.min(value / maxScore, 1);
        
        if (valueRatio > 0) {
            const valueArc = d3.arc()
                .innerRadius(radius * 0.7)
                .outerRadius(radius * 0.9)
                .startAngle(startAngle)
                .endAngle(valueAngle);
            
            g.append("path")
                .attr("d", valueArc)
                .attr("transform", "rotate(90)")
                .style("fill", "#3b82f6");
        }
    }

    /**
     * Renders tick marks and labels
     * @private
     */
    _renderTickMarks(g, radius, maxScore) {
        const scaleAngles = this.config.scale_angles || [200, 270, 340];
        const scaleValues = [0, Math.round(maxScore / 2), maxScore];
        
        scaleAngles.forEach((angleDeg, i) => {
            const angle = (angleDeg * Math.PI) / 180;
            
            // Tick line
            g.append("line")
                .attr("x1", Math.cos(angle) * (radius * 0.68))
                .attr("y1", Math.sin(angle) * (radius * 0.68))
                .attr("x2", Math.cos(angle) * (radius * 0.92))
                .attr("y2", Math.sin(angle) * (radius * 0.92))
                .style("stroke", "#374151")
                .style("stroke-width", "2px");
            
            // Label
            const x = Math.cos(angle) * (radius * 0.6);
            const y = Math.sin(angle) * (radius * 0.6);
            
            g.append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .style("font-size", "14px")
                .style("font-weight", "600")
                .style("font-family", "Inter, sans-serif")
                .style("fill", "#1f2937")
                .text(scaleValues[i]);
        });
    }

    /**
     * Renders the needle pointer
     * @private
     */
    _renderNeedle(g, radius, valueAngle) {
        const needleX = Math.cos(valueAngle) * (radius * 0.8);
        const needleY = Math.sin(valueAngle) * (radius * 0.8);
        
        // Needle line
        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", needleX)
            .attr("y2", needleY)
            .style("stroke", "#1f2937")
            .style("stroke-width", "3px")
            .style("stroke-linecap", "round");
        
        // Center point
        g.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 8)
            .style("fill", "#1f2937");
    }
}