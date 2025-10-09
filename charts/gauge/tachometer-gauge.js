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
     * Renders the tachometer gauge with optimized positioning to minimize white space
     * @private
     */
    _renderTachometer(value, maxScore, categoryLabel, trafficLightConfig = null) {
        const { width: containerWidth, height: containerHeight } = this._getContainerDimensions();
        const svg = this._createBaseSVG();
        
        // Calculate gauge size for better container fitting (keep original logic)
        const gaugeSize = Math.max(180, Math.min(containerWidth, containerHeight) * 1.2);
        const radius = (gaugeSize / 2) - 50;
        
        // Optimized positioning: Calculate the actual space needed for the tachometer
        // and center it vertically within that space to minimize white areas
        const labelSpaceTop = radius * 0.2; // Space needed for top tick labels
        const arcHeight = radius; // Height of the semicircle
        const valueSpaceBottom = radius * 0.3; // Space needed for percentage text
        const totalTachometerHeight = labelSpaceTop + arcHeight + valueSpaceBottom;
        
        // Position the tachometer to use available space efficiently
        // Center vertically but account for the semicircle nature (more space needed below center)
        const availableSpace = containerHeight - totalTachometerHeight;
        const topMargin = Math.max(20, availableSpace * 0.3); // Minimal top margin
        const centerY = topMargin + labelSpaceTop + (radius * 0.7); // Optimized center position
        
        const g = svg.append("g")
            .attr("transform", `translate(${containerWidth/2}, ${centerY})`);
        
        // Get angle configuration
        const { startAngle, endAngle, valueAngle } = this._calculateAngles(value, maxScore);
        
        // Render gauge components
        this._renderGaugeBackground(g, radius, startAngle, endAngle);
        this._renderTrafficLightSegments(g, radius, startAngle, endAngle, value, maxScore, trafficLightConfig);
        this._renderValueArc(g, radius, startAngle, valueAngle, value, maxScore);
        this._renderTickMarks(g, radius, maxScore);
        this._renderNeedle(g, radius, valueAngle);
        this._renderCurrentValue(g, radius, value, maxScore);
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
     * Calculates innerRadius and outerRadius based on config.thickness
     * @private
     */
    _calculateArcRadii(radius) {
        // Get thickness from config (default: 30% of radius)
        const thicknessPercent = this.config.thickness || 30;
        const thickness = (thicknessPercent / 100);
        
        // Calculate inner and outer radius
        // Center the arc around radius * 0.8 (the old average of 0.7 and 0.9)
        const center = 0.8;
        const innerRadius = radius * (center - thickness / 2);
        const outerRadius = radius * (center + thickness / 2);
        
        return { innerRadius, outerRadius };
    }

    /**
     * Renders the background arc for tachometer gauge
     * @private
     */
    _renderGaugeBackground(g, radius, startAngle, endAngle) {
        // Use first color from chart.range_colors if available, otherwise fallback to gray
        let backgroundColor = "#e5e7eb"; // Default gray
        if (this.config.range_colors && Array.isArray(this.config.range_colors) && this.config.range_colors.length > 0) {
            backgroundColor = this.config.range_colors[0];
        }
        
        // Calculate arc radii based on thickness config
        const { innerRadius, outerRadius } = this._calculateArcRadii(radius);
        
        const backgroundArc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
            .startAngle(startAngle)
            .endAngle(endAngle);

        g.append("path")
            .attr("d", backgroundArc)
            .attr("transform", "rotate(90)")
            .style("fill", backgroundColor);
    }

    /**
     * Renders traffic light segments if configured
     * @private
     */
    _renderTrafficLightSegments(g, radius, startAngle, endAngle, value, maxScore, trafficLightConfig) {
        if (!trafficLightConfig) return;

        const percentage = Math.round((value / maxScore) * 100);
        const segments = this._getTrafficLightSegments(trafficLightConfig);
        
        // Calculate arc radii based on thickness config
        const { innerRadius, outerRadius } = this._calculateArcRadii(radius);
        
        segments.forEach(segment => {
            if (segment.end > segment.start) {
                const startAngleRad = startAngle + ((segment.start / 100) * (endAngle - startAngle));
                const endAngleRad = startAngle + ((segment.end / 100) * (endAngle - startAngle));
                
                const segmentArc = d3.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius)
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
            // Use second color from chart.range_colors if available, otherwise fallback to blue
            let valueColor = "#3b82f6"; // Default blue
            if (this.config.range_colors && Array.isArray(this.config.range_colors) && this.config.range_colors.length > 1) {
                valueColor = this.config.range_colors[1];
            }
            
            // Calculate arc radii based on thickness config
            const { innerRadius, outerRadius } = this._calculateArcRadii(radius);
            
            const valueArc = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
                .startAngle(startAngle)
                .endAngle(valueAngle);
            
            g.append("path")
                .attr("d", valueArc)
                .attr("transform", "rotate(90)")
                .style("fill", valueColor);
        }
    }

    /**
     * Renders tick marks and labels using chart.ranges from config
     * @private
     */
    _renderTickMarks(g, radius, maxScore) {
        // Use chart.ranges from config if available, otherwise fallback to simple 0-100
        let ranges = [0, 100]; // Default fallback
        
        if (this.config.ranges && Array.isArray(this.config.ranges)) {
            ranges = this.config.ranges;
        }
        
        // Calculate angles for each range value
        const { startAngleDeg, endAngleDeg } = this._calculateAngles(0, maxScore);
        const totalAngleDeg = endAngleDeg - startAngleDeg;
        
        ranges.forEach((rangeValue, i) => {
            // Calculate angle position for this range value (as percentage)
            const percentage = rangeValue; // ranges are already in percentage
            const angleDeg = startAngleDeg + (percentage / 100) * totalAngleDeg;
            const angle = (angleDeg * Math.PI) / 180;
            
            // Tick line
            g.append("line")
                .attr("x1", Math.cos(angle) * (radius * 0.68))
                .attr("y1", Math.sin(angle) * (radius * 0.68))
                .attr("x2", Math.cos(angle) * (radius * 0.92))
                .attr("y2", Math.sin(angle) * (radius * 0.92))
                .style("stroke", "#374151")
                .style("stroke-width", "2px");
            
            // Label - positioned above the tick marks
            const x = Math.cos(angle) * (radius * 1.05); // Further out for above positioning
            const y = Math.sin(angle) * (radius * 1.05);
            
            g.append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .style("font-size", "14px")
                .style("font-weight", "600")
                .style("font-family", "Inter, sans-serif")
                .style("fill", "#1f2937")
                .text(rangeValue + "%");
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

    /**
     * Renders the current percentage value below the needle center
     * @private
     */
    _renderCurrentValue(g, radius, value, maxScore) {
        // Get score text from config or use default percentage format
        const scoreText = this._formatScoreText(value, maxScore);
        
        g.append("text")
            .attr("x", 0)
            .attr("y", radius * 0.3) // Position below center
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .style("font-family", "Inter, sans-serif")
            .style("fill", "#1f2937")
            .text(scoreText);
    }

    /**
     * Formats the score text using config.score_text template or default percentage format
     * @private
     */
    _formatScoreText(value, maxScore) {
        if (this.config.score_text && typeof this.config.score_text === 'string') {
            // Replace placeholders {score} and {maxscore}
            let text = this.config.score_text
                .replace(/\{score\}/g, value)
                .replace(/\{maxscore\}/g, maxScore);
            
            // Remove HTML tags for SVG text (SVG doesn't support HTML)
            text = text.replace(/<br\s*\/?>/gi, ' '); // Replace <br> with space
            text = text.replace(/<[^>]+>/g, ''); // Remove all other HTML tags
            text = text.trim();
            
            return text;
        }
        // Default format: percentage
        const percentage = Math.round((value / maxScore) * 100);
        return percentage + "%";
    }
}