/**
 * SimpleGauge - Modern animated gauge based on d3-simple-gauge
 * Standalone implementation with embedded Needle class for better maintainability
 * 
 * Features:
 * - Animated segments with color transitions
 * - Smooth needle movements with easing
 * - Configurable sections and colors
 * - Responsive sizing and positioning
 */
export class SimpleGauge {
    constructor(container, config = {}) {
        this.container = container;
        this.config = config;
    }

    render(value, maxScore, categoryLabel) {
        // Clear container
        this.container.innerHTML = '';

        // Validate inputs
        if (!this._validateInputs(value, maxScore)) {
            return;
        }

        return this._renderSimpleGauge(value, maxScore, categoryLabel);
    }

    /**
     * Validates input parameters
     * @private
     */
    _validateInputs(value, maxScore) {
        if (isNaN(value) || isNaN(maxScore) || maxScore <= 0) {
            console.error('SimpleGauge: Invalid value or maxScore parameters');
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
     * Renders the simple gauge style based on antoinebeland/d3-simple-gauge
     * @private
     */
    _renderSimpleGauge(value, maxScore, categoryLabel) {
        const { width: containerWidth, height: containerHeight } = this._getContainerDimensions();
        const svg = this._createBaseSVG();
        
        // Calculate gauge size for better container fitting
        const gaugeWidth = Math.min(containerWidth - 60, Math.max(300, containerWidth * 0.8));
        const gaugeHeight = Math.min(containerHeight - 80, Math.max(150, containerHeight * 0.4));
        
        // Create main group - centered in container
        const g = svg.append("g")
            .attr("class", "simple-gauge")
            .attr("transform", `translate(${containerWidth/2}, ${containerHeight * 0.65})`);

        // SimpleGauge configuration
        const percent = Math.min(value / maxScore, 1);
        
        // Use config values for ranges and colors, with fallbacks
        const configRanges = this.config.ranges || [0, 33, 66, 100];
        const configColors = this.config.range_colors || ['#ef4444', '#f97316', '#22c55e'];
        
        // Calculate sections count from ranges (ranges has one more element than sections)
        const sectionsCount = Math.max(1, configRanges.length - 1);
        const sectionsColors = configColors.slice(0, sectionsCount);

        // Get thickness from config (default: 30% of radius)
        const thickness = this.config.thickness || 30;

        // Create SimpleGaugeRenderer instance
        const simpleGaugeRenderer = new SimpleGaugeRenderer({
            el: g,
            height: gaugeHeight,
            width: gaugeWidth,
            sectionsCount: sectionsCount,
            sectionsColors: sectionsColors,
            ranges: configRanges,
            needleColor: '#1f2937',
            animationDuration: 1500,
            animationDelay: 100,
            percent: percent,
            interval: [0, maxScore],
            barWidth: thickness,
            chartInset: 15,
            needleRadius: 10
        });

        // Add value display below gauge
        this._addSimpleGaugeLabels(svg, containerWidth, containerHeight, value, maxScore, categoryLabel, gaugeWidth, gaugeHeight);
    }

    /**
     * Adds labels for simple gauge
     * @private
     */
    _addSimpleGaugeLabels(svg, containerWidth, containerHeight, value, maxScore, categoryLabel, gaugeWidth, gaugeHeight) {
        // Get score text from config or use default format
        const scoreText = this._formatScoreText(value, maxScore);
        
        // Calculate gauge center position
        const gaugeCenterX = containerWidth / 2;
        const gaugeCenterY = containerHeight * 0.65;
        const radius = Math.min(gaugeWidth, gaugeHeight * 2) / 2;
        
        // SimpleGauge starts at 270° (bottom) and goes through a semicircle
        // Left end is at ~225° (45° from bottom-left), right end is at ~315° (45° from bottom-right)
        const startAngleDeg = 225; // Left end
        const endAngleDeg = 315;   // Right end
        
        // Convert to radians
        const startAngleRad = (startAngleDeg * Math.PI) / 180;
        const endAngleRad = (endAngleDeg * Math.PI) / 180;
        
        // Render min/max labels only if enabled in config
        if (this.config.show_minmax_labels === true) {
            // Position labels at the height of the semicircle center (where the needle-center is)
            const labelY = gaugeCenterY; // Same Y as the gauge center
            
            // Calculate outer radius and label positions
            const outerRadius = this._calculateOuterRadius(radius);
            const labelDistance = this._calculateLabelDistance(outerRadius);
            
            // Render min/max labels
            this._renderMinMaxLabel(svg, gaugeCenterX + Math.cos(startAngleRad) * labelDistance, labelY, "0");
            this._renderMinMaxLabel(svg, gaugeCenterX + Math.cos(endAngleRad) * labelDistance, labelY, maxScore);
        }
        
        // Value display
        svg.append("text")
            .attr("x", containerWidth / 2)
            .attr("y", containerHeight * 0.85)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "600")
            .style("font-family", "Inter, sans-serif")
            .style("fill", "#1f2937")
            .text(scoreText);

        // Category label above gauge
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

    /**
     * Calculates the outer radius of the arc considering thickness and chartInset
     * @private
     */
    _calculateOuterRadius(radius) {
        // The radius used in SimpleGaugeRenderer._initialize() is: Math.min(width, height * 2) / 2
        // The outer radius in _createArcs() is: radius - chartInset (where chartInset = 15)
        const chartInset = 15; // Same as in SimpleGaugeRenderer
        return radius - chartInset;
    }

    /**
     * Calculates the distance from center for label positioning
     * @private
     */
    _calculateLabelDistance(outerRadius) {
        // Position labels outside the arc to avoid overlap
        // The offset needs to be large enough to account for the arc thickness and text rendering
        return outerRadius + 80;
    }

    /**
     * Renders a single min/max label with consistent styling
     * @private
     */
    _renderMinMaxLabel(container, x, y, text) {
        // Use config font size if set, otherwise default to 14px
        const fontSize = this.config.minmax_labels_fontsize || "14px";
        
        container.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle")
            .style("font-size", fontSize)
            .style("font-weight", "600")
            .style("font-family", "Inter, sans-serif")
            .style("fill", "#6b7280")
            .text(text);
    }

    /**
     * Formats the score text using config.score_text template or default format
     * @private
     */
    _formatScoreText(value, maxScore) {
        if (this.config.score_text && typeof this.config.score_text === 'string') {
            // Replace placeholders {score} and {maxscore}
            let text = this.config.score_text
                .replace(/\{score\}/g, value)
                .replace(/\{maxscore\}/g, maxScore);
            
            // Process range-based expressions like [niedrig|moderat|hoch]
            text = this._processRangeExpressions(text, value, maxScore);
            
            // Remove HTML tags for SVG text (SVG doesn't support HTML)
            text = text.replace(/<br\s*\/?>/gi, ' '); // Replace <br> with space
            text = text.replace(/<[^>]+>/g, ''); // Remove all other HTML tags
            text = text.trim();
            
            return text;
        }
        // Default format
        return `${value} / ${maxScore}`;
    }

    /**
     * Processes range-based expressions in score_text like [wert1|wert2|wert3]
     * Maps the score to the appropriate range and replaces the expression with the corresponding value
     * @private
     */
    _processRangeExpressions(text, value, maxScore) {
        // Check if ranges are configured
        if (!this.config.ranges || !Array.isArray(this.config.ranges) || this.config.ranges.length < 3) {
            return text;
        }

        // Calculate percentage
        const percentage = (value / maxScore) * 100;

        // Determine range index based on percentage
        // Ranges format: [0, 20, 40, 100] means:
        // - Range 0: 0 to < 20 (index 0) → "niedrig"
        // - Range 1: 20 to < 40 (index 1) → "moderat"
        // - Range 2: 40 to 100 (index 2) → "hoch"
        let rangeIndex = 0;
        for (let i = 0; i < this.config.ranges.length - 1; i++) {
            const lowerBound = this.config.ranges[i];
            const upperBound = this.config.ranges[i + 1];
            
            // Check if percentage falls within this range
            if (i === this.config.ranges.length - 2) {
                // Last range: include upper bound
                if (percentage >= lowerBound && percentage <= upperBound) {
                    rangeIndex = i;
                    break;
                }
            } else {
                // Other ranges: exclude upper bound
                if (percentage >= lowerBound && percentage < upperBound) {
                    rangeIndex = i;
                    break;
                }
            }
        }

        // Replace all occurrences of [wert1|wert2|wert3] with the appropriate value
        return text.replace(/\[([^\]]+)\]/g, (match, content) => {
            const values = content.split('|').map(v => v.trim());
            if (values.length > 0 && rangeIndex < values.length) {
                return values[rangeIndex];
            }
            return match; // Return original if no match found
        });
    }
}

/**
 * SimpleGaugeRenderer Implementation (based on antoinebeland/d3-simple-gauge)
 * Internal class for rendering the actual gauge components
 */
class SimpleGaugeRenderer {
    constructor(config) {
        this._validateConfig(config);
        this._initializeConfig(config);
        this._setupScale(config);
        this._initialize();
    }

    /**
     * Validates configuration parameters
     * @private
     */
    _validateConfig(config) {
        if (!config.el) {
            throw new Error('The element must be valid.');
        }
        if (isNaN(config.height) || config.height <= 0) {
            throw new RangeError('The height must be a positive number.');
        }
        if (isNaN(config.width) || config.width <= 0) {
            throw new RangeError('The width must be a positive number.');
        }
        if (isNaN(config.sectionsCount) || config.sectionsCount <= 0) {
            throw new RangeError('The sections count must be a positive number.');
        }
    }

    /**
     * Initializes configuration with defaults
     * @private
     */
    _initializeConfig(config) {
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
        this._ranges = config.ranges || [0, 33, 66, 100];
    }

    /**
     * Sets up the scale for value mapping
     * @private
     */
    _setupScale(config) {
        const interval = config.interval || [0, 1];
        this._scale = d3.scaleLinear().domain(interval).range([0, 1]).clamp(true);
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
        if (isNaN(value)) {
            throw new Error('The specified value must be a number.');
        }
        this.percent = this._scale(value);
    }

    /**
     * Initializes the gauge rendering
     * @private
     */
    _initialize() {
        const radius = Math.min(this._width, this._height * 2) / 2;
        
        this._chart = this._el.append('g')
            .attr('class', 'simple-gauge-inner')
            .attr('transform', `translate(0, 0)`);

        this._createArcs(radius);
        this._createNeedle();
        this._update();
    }

    /**
     * Creates gauge arc segments
     * @private
     */
    _createArcs(radius) {
        const padRad = 0.05;
        let totalPercent = 0.75; // Start at 270deg (bottom left)
        
        // Calculate total range for proportional calculation
        const totalRange = this._ranges[this._ranges.length - 1] - this._ranges[0];
        
        // Calculate proportional sections based on actual ranges
        const sectionProportions = [];
        for (let i = 0; i < this._sectionsCount; i++) {
            const sectionRange = this._ranges[i + 1] - this._ranges[i];
            const sectionProportion = (sectionRange / totalRange) * 0.5; // 0.5 is for semicircle
            sectionProportions.push(sectionProportion);
        }

        this._arcs = this._chart.selectAll('.arc')
            .data(d3.range(1, this._sectionsCount + 1))
            .enter()
            .append('path')
            .attr('class', (sectionIndex) => `arc chart-color${sectionIndex}`)
            .attr('d', (sectionIndex) => {
                const sectionProportion = sectionProportions[sectionIndex - 1];
                const arcStartRad = this._percToRad(totalPercent);
                const arcEndRad = arcStartRad + this._percToRad(sectionProportion);
                totalPercent += sectionProportion;

                const startPadRad = sectionIndex === 1 ? 0 : padRad / 2;
                const endPadRad = sectionIndex === this._sectionsCount ? 0 : padRad / 2;

                const arc = d3.arc()
                    .outerRadius(radius - this._chartInset)
                    .innerRadius(radius - this._chartInset - this._barWidth)
                    .startAngle(arcStartRad + startPadRad)
                    .endAngle(arcEndRad - endPadRad);

                return arc();
            });

        // Apply colors if provided
        if (this._sectionsColors) {
            this._arcs.style('fill', (sectionIndex) => this._sectionsColors[sectionIndex - 1]);
        }
    }

    /**
     * Creates the needle component
     * @private
     */
    _createNeedle() {
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
    }

    /**
     * Updates gauge appearance based on current percent
     * @private
     */
    _update() {
        if (!this._arcs) return;

        this._arcs.classed('active', (d, i) => {
            return i === Math.floor(this._percent * this._sectionsCount) || 
                   (i === this._arcs.size() - 1 && this._percent === 1);
        });

        this._el.classed('min', this._percent === 0);
        this._el.classed('max', this._percent === 1);
    }

    // Mathematical utility methods
    _percToDeg(perc) { return perc * 360; }
    _degToRad(deg) { return deg * Math.PI / 180; }
    _percToRad(perc) { return this._degToRad(this._percToDeg(perc)); }
}

/**
 * Needle class for SimpleGauge
 * Handles needle rendering and animations
 */
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

    /**
     * Updates needle position with animation
     */
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

    /**
     * Initializes needle components
     * @private
     */
    _initialize() {
        // Needle center circle
        this._el.append('circle')
            .attr('class', 'needle-center')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', this._radius);

        // Needle path
        this._el.append('path')
            .attr('class', 'needle')
            .attr('d', this._getPath(this._percent));

        // Apply color styling
        this._applyStyles();
    }

    /**
     * Applies color styling to needle components
     * @private
     */
    _applyStyles() {
        if (this._color) {
            this._el.select('.needle-center').style('fill', this._color);
            this._el.select('.needle').style('fill', this._color);
        }
    }

    /**
     * Calculates needle path for given percentage
     * @private
     */
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

    // Mathematical utility methods
    _percToDeg(perc) { return perc * 360; }
    _degToRad(deg) { return deg * Math.PI / 180; }
    _percToRad(perc) { return this._degToRad(this._percToDeg(perc)); }
}