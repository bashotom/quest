/**
 * GaugeChart - D3.js Gauge Chart Implementation
 * Renders a tachometer-style gauge chart for single category scores
 */
export class GaugeChart {
    constructor(container, config) {
        this.container = container;
        this.config = config;
    }

    render(value, maxScore, categoryLabel, trafficLightConfig = null) {
    // Container leeren
    this.container.innerHTML = '';
        
        // Container-Dimensionen
        const containerWidth = this.container.offsetWidth;
        const containerHeight = this.container.offsetHeight;
        
        // Angepasste Gauge-Größe für bessere Container-Einpassung
        const gaugeSize = Math.max(180, Math.min(containerWidth, containerHeight) * 1.2);
        const radius = (gaugeSize / 2) - 50;
        
        // SVG erstellen mit Container-beschränkter Größe
        const svg = d3.select(this.container)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("overflow", "hidden");
        
        const g = svg.append("g")
            .attr("transform", `translate(${containerWidth/2},${containerHeight * 0.65})`);  // Tiefer positioniert
        
        // CRITICAL: Use Same Coordinate System Throughout (per instructions)
        // Use config.scale_angles if present, else fallback to 200-340 degrees
        let startAngleDeg = 200;
        let endAngleDeg = 340;
        if (this.config && Array.isArray(this.config.scale_angles) && this.config.scale_angles.length === 3) {
            startAngleDeg = this.config.scale_angles[0];
            endAngleDeg = this.config.scale_angles[2];
        }
        const totalAngleDeg = endAngleDeg - startAngleDeg;
        // Convert degrees to radians ONCE
        const startAngle = (startAngleDeg * Math.PI) / 180;
        const endAngle = (endAngleDeg * Math.PI) / 180;
        // Calculate value position using SAME system
        const valueRatio = Math.min(value / maxScore, 1);
        const valueAngleDeg = startAngleDeg + valueRatio * totalAngleDeg;
        const valueAngle = (valueAngleDeg * Math.PI) / 180;
        
        // D3 Arcs - Use Identical Radian Values
        const backgroundArc = d3.arc()
            .innerRadius(radius * 0.7)
            .outerRadius(radius * 0.9)
            .startAngle(startAngle)  // SAME as below
            .endAngle(endAngle);

        g.append("path")
            .attr("d", backgroundArc)
            .attr("transform", "rotate(90)")
            .style("fill", "#e5e7eb");
        
        // Traffic Light Segments (rot, orange, grün) als Hintergrund
        if (trafficLightConfig) {
            const percentage = Math.round((value / maxScore) * 100);
            let segments = [];
            
            if (trafficLightConfig.green !== undefined) {
                // Normale Logik: niedrige Werte = rot, hohe Werte = grün
                segments = [
                    { start: 0, end: trafficLightConfig.red || 0, color: "#ef4444", opacity: 0.3 },
                    { start: trafficLightConfig.red || 0, end: trafficLightConfig.orange || 0, color: "#f97316", opacity: 0.3 },
                    { start: trafficLightConfig.orange || 0, end: 100, color: "#22c55e", opacity: 0.3 }
                ];
            } else if (trafficLightConfig.red !== undefined) {
                // Inverse Logik: niedrige Werte = grün, hohe Werte = rot
                segments = [
                    { start: 0, end: trafficLightConfig.green || 0, color: "#22c55e", opacity: 0.3 },
                    { start: trafficLightConfig.green || 0, end: trafficLightConfig.orange || 0, color: "#f97316", opacity: 0.3 },
                    { start: trafficLightConfig.orange || 0, end: 100, color: "#ef4444", opacity: 0.3 }
                ];
            }
            
            // Zeichne Ampel-Segmente
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
        
        // Value arc - SAME coordinate origin
        if (valueRatio > 0) {
            const valueArc = d3.arc()
                .innerRadius(radius * 0.7)
                .outerRadius(radius * 0.9)
                .startAngle(startAngle)  // SAME as above
                .endAngle(valueAngle);   // Uses SAME calculation
            
            g.append("path")
                .attr("d", valueArc)
                .attr("transform", "rotate(90)")
                .style("fill", "#3b82f6");
        }
        
        // Tick Marks - CONSISTENT System
        const scaleAngles = (this.config && this.config.scale_angles) ? this.config.scale_angles : [200, 270, 340]; // degrees from config or fallback
        const scaleValues = [0, Math.round(maxScore/2), maxScore];
        scaleAngles.forEach((angleDeg, i) => {
            const angle = (angleDeg * Math.PI) / 180; // SAME conversion
            // Tick-Linie
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
        
        // Pointer/Needle - IDENTICAL Angle Calculation
        const needleX = Math.cos(valueAngle) * (radius * 0.8);
        const needleY = Math.sin(valueAngle) * (radius * 0.8);
        
        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", needleX)
            .attr("y2", needleY)
            .style("stroke", "#1f2937")
            .style("stroke-width", "3px")
            .style("stroke-linecap", "round");
        
        // Mittelpunkt
        g.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 8)
            .style("fill", "#1f2937");
    }
}
