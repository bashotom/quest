/**
 * GaugeChart - D3.js Gauge Chart Implementation
 * Renders a gauge chart for single category scores
 * 
 * Supported styles:
 * - 'tachometer' (default): Traditional tachometer-style with arcs and needle
 * - 'simple': Modern gauge based on d3-simple-gauge with animated segments
 */
export class GaugeChart {
    constructor(container, config) {
        this.container = container;
        this.config = config;
    }

    render(value, maxScore, categoryLabel, trafficLightConfig = null) {
        // Container leeren
        this.container.innerHTML = '';

        // Check which style is requested
        if (this.config && this.config.style === 'simple') {
            return this.renderSimpleGauge(value, maxScore, categoryLabel);
        }

        // Default tachometer style (also used when style === 'tachometer')
        return this.renderTachometerGauge(value, maxScore, categoryLabel, trafficLightConfig);
    }

    /**
     * Renders the default tachometer-style gauge
     */
    renderTachometerGauge(value, maxScore, categoryLabel, trafficLightConfig = null) {
        
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

    /**
     * Renders the simple gauge style based on antoinebeland/d3-simple-gauge
     * Used when config.style === 'simple'
     */
    renderSimpleGauge(value, maxScore, categoryLabel) {
        // Container-Dimensionen
        const containerWidth = this.container.offsetWidth;
        const containerHeight = this.container.offsetHeight;
        
        // Gauge-Größe für bessere Container-Einpassung
        const gaugeWidth = Math.min(containerWidth - 60, Math.max(300, containerWidth * 0.8));
        const gaugeHeight = Math.min(containerHeight - 80, Math.max(150, containerHeight * 0.4));
        
        // SVG erstellen
        const svg = d3.select(this.container)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("overflow", "hidden");
        
        // Hauptgruppe erstellen - zentriert im Container
        const g = svg.append("g")
            .attr("class", "simple-gauge")
            .attr("transform", `translate(${containerWidth/2}, ${containerHeight * 0.65})`);

        // SimpleGauge Konfiguration
        const percent = Math.min(value / maxScore, 1);
        const sectionsCount = 3;
        const sectionsColors = ['#ef4444', '#f97316', '#22c55e']; // rot, orange, grün

        // SimpleGauge erstellen
        const simpleGauge = new SimpleGauge({
            el: g,
            height: gaugeHeight,
            width: gaugeWidth,
            sectionsCount: sectionsCount,
            sectionsColors: sectionsColors,
            needleColor: '#1f2937',
            animationDuration: 1500,
            animationDelay: 100,
            percent: percent,
            interval: [0, maxScore],
            barWidth: 30,
            chartInset: 15,
            needleRadius: 10
        });

        // Wert anzeigen - unter der Gauge
        svg.append("text")
            .attr("x", containerWidth / 2)
            .attr("y", containerHeight * 0.85)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "600")
            .style("font-family", "Inter, sans-serif")
            .style("fill", "#1f2937")
            .text(`${value} / ${maxScore}`);

        // Kategorie-Label anzeigen - oben über der Gauge
        if (categoryLabel) {
            svg.append("text")
                .attr("x", containerWidth / 2)
                .attr("y", containerHeight * 0.15)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "500")
                .style("font-family", "Inter, sans-serif")
                .style("fill", "#374151")
                .text(categoryLabel);
        }
    }
}

// SimpleGauge Implementation (based on antoinebeland/d3-simple-gauge)
class SimpleGauge {
    constructor(config) {
        // Validation
        if (!config.el) throw new Error('The element must be valid.');
        if (isNaN(config.height) || config.height <= 0) throw new RangeError('The height must be a positive number.');
        if (isNaN(config.width) || config.width <= 0) throw new RangeError('The width must be a positive number.');
        if (isNaN(config.sectionsCount) || config.sectionsCount <= 0) throw new RangeError('The sections count must be a positive number.');

        // Configuration
        this._animationDelay = config.animationDelay || 0;
        this._animationDuration = config.animationDuration || 3000;
        this._chartInset = config.chartInset || 10;
        this._barWidth = config.barWidth || 40;
        this._easeType = config.easeType || d3.easeElastic;
        this._el = config.el;
        this._height = config.height;
        this._width = config.width;
        this._needleRadius = config.needleRadius || 15;
        this._sectionsCount = config.sectionsCount;
        this._sectionsColors = config.sectionsColors;
        this._needleColor = config.needleColor;
        this._percent = config.percent || 0;

        // Scale setup
        const interval = config.interval || [0, 1];
        this._scale = d3.scaleLinear().domain(interval).range([0, 1]).clamp(true);

        this._initialize();
    }

    set percent(percent) {
        if (isNaN(percent) || percent < 0 || percent > 1) {
            throw new RangeError('The percentage must be between 0 and 1.');
        }
        if (this._needle) {
            this._needle.update(percent);
        }
        this._percent = percent;
        this._update();
    }

    get percent() {
        return this._percent;
    }

    set value(value) {
        if (isNaN(value)) throw new Error('The specified value must be a number.');
        this.percent = this._scale(value);
    }

    _initialize() {
        const sectionPercentage = 1 / this._sectionsCount / 2;
        const padRad = 0.05;
        let totalPercent = 0.75; // Start at 270deg

        const radius = Math.min(this._width, this._height * 2) / 2;
        
        this._chart = this._el.append('g')
            .attr('class', 'simple-gauge-inner')
            .attr('transform', `translate(0, 0)`);

        // Create arcs
        this._arcs = this._chart.selectAll('.arc')
            .data(d3.range(1, this._sectionsCount + 1))
            .enter()
            .append('path')
            .attr('class', (sectionIndex) => `arc chart-color${sectionIndex}`)
            .attr('d', (sectionIndex) => {
                const arcStartRad = this._percToRad(totalPercent);
                const arcEndRad = arcStartRad + this._percToRad(sectionPercentage);
                totalPercent += sectionPercentage;

                const startPadRad = sectionIndex === 1 ? 0 : padRad / 2;
                const endPadRad = sectionIndex === this._sectionsCount ? 0 : padRad / 2;

                const arc = d3.arc()
                    .outerRadius(radius - this._chartInset)
                    .innerRadius(radius - this._chartInset - this._barWidth)
                    .startAngle(arcStartRad + startPadRad)
                    .endAngle(arcEndRad - endPadRad);

                return arc();
            });

        // Apply colors
        if (this._sectionsColors) {
            this._arcs.style('fill', (sectionIndex) => this._sectionsColors[sectionIndex - 1]);
        }

        // Create needle
        this._needle = new Needle({
            animationDelay: this._animationDelay,
            animationDuration: this._animationDuration,
            color: this._needleColor,
            easeType: this._easeType,
            el: this._chart,
            length: this._height * 0.5,
            percent: this._percent,
            radius: this._needleRadius
        });

        this._update();
    }

    _update() {
        if (!this._arcs) return;

        this._arcs.classed('active', (d, i) => {
            return i === Math.floor(this._percent * this._sectionsCount) || 
                   (i === this._arcs.size() - 1 && this._percent === 1);
        });

        this._el.classed('min', this._percent === 0);
        this._el.classed('max', this._percent === 1);
    }

    _percToDeg(perc) {
        return perc * 360;
    }

    _degToRad(deg) {
        return deg * Math.PI / 180;
    }

    _percToRad(perc) {
        return this._degToRad(this._percToDeg(perc));
    }
}

// Needle class for SimpleGauge
class Needle {
    constructor(config) {
        this._animationDelay = config.animationDelay;
        this._animationDuration = config.animationDuration;
        this._color = config.color;
        this._easeType = config.easeType;
        this._el = config.el;
        this._length = config.length;
        this._percent = config.percent;
        this._radius = config.radius;

        this._initialize();
    }

    update(percent) {
        const self = this;
        this._el.transition()
            .delay(this._animationDelay)
            .ease(this._easeType)
            .duration(this._animationDuration)
            .selectAll('.needle')
            .tween('progress', function() {
                const thisElement = this;
                const delta = percent - self._percent;
                const initialPercent = self._percent;
                return function(progressPercent) {
                    self._percent = initialPercent + progressPercent * delta;
                    return d3.select(thisElement).attr('d', self._getPath(self._percent));
                };
            });
    }

    _initialize() {
        // Needle center
        this._el.append('circle')
            .attr('class', 'needle-center')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', this._radius);

        // Needle path
        this._el.append('path')
            .attr('class', 'needle')
            .attr('d', this._getPath(this._percent));

        // Apply color
        if (this._color) {
            this._el.select('.needle-center').style('fill', this._color);
            this._el.select('.needle').style('fill', this._color);
        }
    }

    _getPath(percent) {
        const halfPI = Math.PI / 2;
        const thetaRad = this._percToRad(percent / 2); // half circle

        const centerX = 0;
        const centerY = 0;
        const topX = centerX - this._length * Math.cos(thetaRad);
        const topY = centerY - this._length * Math.sin(thetaRad);
        const leftX = centerX - this._radius * Math.cos(thetaRad - halfPI);
        const leftY = centerY - this._radius * Math.sin(thetaRad - halfPI);
        const rightX = centerX - this._radius * Math.cos(thetaRad + halfPI);
        const rightY = centerY - this._radius * Math.sin(thetaRad + halfPI);

        return `M ${leftX} ${leftY} L ${topX} ${topY} L ${rightX} ${rightY}`;
    }

    _percToDeg(perc) {
        return perc * 360;
    }

    _degToRad(deg) {
        return deg * Math.PI / 180;
    }

    _percToRad(perc) {
        return this._degToRad(this._percToDeg(perc));
    }
}
