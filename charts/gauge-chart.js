/**
 * GaugeChart - D3.js Gauge Chart Implementation
 * Renders a tachometer-style gauge chart for single category scores
 */
export class GaugeChart {
    constructor(container, config) {
        this.container = container;
        this.config = config;
    }

    render(value, maxScore, categoryLabel) {
    // Container leeren
    this.container.innerHTML = '';
        
        // Container-Dimensionen
        const containerWidth = this.container.offsetWidth;
        const containerHeight = this.container.offsetHeight;
        const size = Math.min(containerWidth, containerHeight);
        const radius = (size / 2) - 60;
        
        // SVG erstellen
        const svg = d3.select(this.container)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight);
        
        const g = svg.append("g")
            .attr("transform", `translate(${containerWidth/2},${containerHeight/2 + 20})`);
        
        // CRITICAL: Use Same Coordinate System Throughout (per instructions)
        // Use config.scale_angles if present, else fallback
        let startAngleDeg = 225;
        let endAngleDeg = 315;
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
        const scaleAngles = (this.config && this.config.scale_angles) ? this.config.scale_angles : [225, 270, 315]; // degrees from config or fallback
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
        
        // Wert-Anzeige
        g.append("text")
            .attr("x", 0)
            .attr("y", radius * 0.4)
            .attr("text-anchor", "middle")
            .style("font-size", "2.5rem")
            .style("font-weight", "bold")
            .style("font-family", "Inter, sans-serif")
            .style("fill", "#3b82f6")
            .text(value);
        
        g.append("text")
            .attr("x", 0)
            .attr("y", radius * 0.4 + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "1rem")
            .style("font-family", "Inter, sans-serif")
            .style("fill", "#6b7280")
            .text(`von ${maxScore}`);
        
        // Kategorie-Label
        g.append("text")
            .attr("x", 0)
            .attr("y", radius * 0.4 + 55)
            .attr("text-anchor", "middle")
            .style("font-size", "1.1rem")
            .style("font-family", "Inter, sans-serif")
            .style("fill", "#374151")
            .text(categoryLabel);
        
        // Prozentsatz
        const percentage = Math.round((value / maxScore) * 100);
        g.append("text")
            .attr("x", 0)
            .attr("y", radius * 0.4 + 80)
            .attr("text-anchor", "middle")
            .style("font-size", "1rem")
            .style("font-family", "Inter, sans-serif")
            .style("fill", "#6b7280")
            .text(`${percentage}%`);
    }
}
