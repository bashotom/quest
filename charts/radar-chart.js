function RadarChart(id, data, options) {
    const cfg = {
        w: 600,
        h: 600,
        margin: { top: 30, right: 50, bottom: 30, left: 50 },
        levels: 3,
        maxValue: 0,
        labelFactor: 1.001,
        wrapWidth: 60,
        opacityArea: 0.35,
        opacityCircles: 0.1,
        strokeWidth: 2,
        roundStrokes: true,
        dotRadius: 4,
        color: d3.scaleOrdinal(d3.schemeCategory10)
    };

    // Adjust dimensions for critical screen widths to prevent label clipping
    if (window.innerWidth >= 650 && window.innerWidth <= 766) {
        cfg.w = 700; // Increase width for better label visibility
        cfg.h = 700; // Keep proportional
        cfg.margin.left = 70;
        cfg.margin.right = 70;
    }

    //Put all of the options into a variable called cfg
    if ('undefined' !== typeof options) {
        for (var i in options) {
            if ('undefined' !== typeof options[i]) {
                cfg[i] = options[i];
            }
        }
    }

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    const maxValue = Math.max(cfg.maxValue, d3.max(data, i => d3.max(i.map(o => o.value))));

    // Parse die Kategorien-Daten korrekt
    let processedData = data.map(dataset => 
        dataset.map(d => {
            const axisValue = d.axis;
            
            // Wenn axis bereits ein Objekt ist
            if (typeof axisValue === 'object' && axisValue.key && axisValue.value) {
                return d;
            }
            
            // Wenn axis ein String ist, versuche ihn zu parsen
            if (typeof axisValue === 'string') {
                const key = cfg.config && cfg.config.categories ? Object.entries(cfg.config.categories).find(([k, v]) => v === axisValue)?.[0] : null;
                if (key) {
                    return {
                        ...d,
                        axis: { key, value: axisValue }
                    };
                }
            }
            
            return {
                ...d,
                axis: { key: '?', value: String(axisValue) }
            };
        })
    );
    
    // Get the initial axis order
    let allAxis = processedData[0].map(i => i.axis);
    
    // Reorder axes if topaxis is specified
    if (cfg.config && cfg.config.chart && cfg.config.chart.topaxis) {
        const topAxisKey = cfg.config.chart.topaxis;
        const topAxisIndex = allAxis.findIndex(axis => axis.key === topAxisKey);
        
        if (topAxisIndex !== -1) {
            // Reorder the axes so that topaxis comes first (12 o'clock position)
            const reorderedAxis = [
                ...allAxis.slice(topAxisIndex),
                ...allAxis.slice(0, topAxisIndex)
            ];
            allAxis = reorderedAxis;
            
            // Also reorder the data accordingly
            processedData = processedData.map(dataset => [
                ...dataset.slice(topAxisIndex),
                ...dataset.slice(0, topAxisIndex)
            ]);
        }
    }
    
    const total = allAxis.length,
          radius = Math.min(cfg.w/2, cfg.h/2),
          angleSlice = Math.PI * 2 / total;

    //Scale for the radius
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    //Remove whatever chart with the same id/class was present before
    d3.select(id).select("svg").remove();

    //Initiate the radar chart SVG
    const svg = d3.select(id).append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${cfg.w + cfg.margin.left + cfg.margin.right} ${cfg.h + cfg.margin.top + cfg.margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "radar");

    //Append a g element
    const g = svg.append("g")
        .attr("transform", `translate(${(cfg.w/2 + cfg.margin.left)},${(cfg.h/2 + cfg.margin.top)})`);

    //Filter for the outside glow
    const filter = g.append('defs').append('filter').attr('id','glow'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

    //Draw the circular grid
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    const levels = axisGrid.selectAll(".levels")
        .data(d3.range(1, cfg.levels+1).reverse())
        .enter()
        .append("g")
        .attr("class", "levels");

    // Kreise für die Werteskala
    levels.append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius * d/cfg.levels)
        .style("fill", "#fff")
        .style("stroke", "#e2e8f0")
        .style("fill-opacity", cfg.opacityCircles);

    // Werte für die Skala - nur für konfigurierte Achsen anzeigen
    // (wird später in der Tickmarks-Logik behandelt)

    //Create the straight lines radiating outward from the center
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    // Parse chart configuration for arrow directions and tickmarks
    const getChartConfig = () => {
        if (typeof cfg.config === 'object' && cfg.config && cfg.config.chart) {
            let radiusvector = [];
            let inverseradiusvector = [];
            let tickmarks = [];
            let horizontalline = false;
            
            // Try different ways to access the config
            if (cfg.config.chart.radiusvector) {
                radiusvector = cfg.config.chart.radiusvector.split(',').map(s => s.trim());
            } else if (typeof cfg.config.chart.radiusvector === 'string') {
                radiusvector = cfg.config.chart.radiusvector.split(',').map(s => s.trim());
            }
            
            if (cfg.config.chart.inverseradiusvector) {
                inverseradiusvector = cfg.config.chart.inverseradiusvector.split(',').map(s => s.trim());
            } else if (typeof cfg.config.chart.inverseradiusvector === 'string') {
                inverseradiusvector = cfg.config.chart.inverseradiusvector.split(',').map(s => s.trim());
            }
            
            if (cfg.config.chart.tickmarks) {
                tickmarks = cfg.config.chart.tickmarks.split(',').map(s => s.trim());
            }
            
            // Check for horizontalline setting
            if (cfg.config.chart.horizontalline) {
                horizontalline = cfg.config.chart.horizontalline === 'yes' || cfg.config.chart.horizontalline === true;
            }
            
            // Wenn tickmarks leer ist, verwende einen Fallback-Wert
            if (tickmarks.length === 0) {
                tickmarks = ['B', 'E']; // Standard-Tickmarks
            }
            
            return { radiusvector, inverseradiusvector, tickmarks, horizontalline };
        }
        return { radiusvector: [], inverseradiusvector: [], tickmarks: ['B', 'E'], horizontalline: false };
    };

    const chartConfig = getChartConfig();

    // Add tickmarks for specified axes (B and E)
    const tickmarkAxes = allAxis.map((axis, index) => ({ axis, index }))
        .filter(item => chartConfig.tickmarks.includes(item.axis.key));
    
    // Zeichne Tickmarks für die konfigurierten Achsen
    tickmarkAxes.forEach(({ axis, index }) => {
        const angle = angleSlice * index - Math.PI/2;
        const isInverseAxis = chartConfig.inverseradiusvector.includes(axis.key);
        
        // Für jeden Level-Wert
        d3.range(1, cfg.levels + 1).forEach(levelIndex => {
            let levelValue, radiusAtLevel;
            
            if (isInverseAxis) {
                // Für inverseradiusvector: außen 0, innen 100
                levelValue = Math.round(maxValue * (cfg.levels - levelIndex)/cfg.levels);
                radiusAtLevel = radius * levelIndex/cfg.levels;
            } else {
                // Für normale Achsen: innen 0, außen 100
                levelValue = Math.round(maxValue * levelIndex/cfg.levels);
                radiusAtLevel = radius * levelIndex/cfg.levels;
            }
            
            // Position für den Tickmark-Text
            const tickX = radiusAtLevel * Math.cos(angle);
            const tickY = radiusAtLevel * Math.sin(angle);
            
            // Bestimme ob es die untere vertikale Achse ist (angle ≈ Math.PI/2)
            const isBottomVerticalAxis = Math.abs(angle - Math.PI/2) < 0.1;
            
            // Füge den Tickmark-Text hinzu
            axisGrid.append("text")
                .attr("class", "tickmark")
                .attr("x", tickX + (Math.cos(angle) > 0 ? 5 : Math.cos(angle) < 0 ? -5 : 0))
                .attr("y", tickY + (Math.sin(angle) > 0 ? 5 : Math.sin(angle) < 0 ? -5 : 0) - (isBottomVerticalAxis ? 9 : 0))
                .attr("y", tickY + (Math.sin(angle) > 0 ? 5 : Math.sin(angle) < 0 ? -5 : 0) - (isBottomVerticalAxis ? 9 : 0))
                .style("font-size", "10px")
                .style("fill", "#000000")
                .style("text-anchor", Math.cos(angle) > 0 ? "start" : Math.cos(angle) < 0 ? "end" : "middle")
                .text(levelValue);
        });
    });

    // Function to update labels based on screen width
    const updateLabels = () => {
        const legends = axis.selectAll(".legend");
        
        legends.text(d => {
            // Erwarte das Format { key: 'A', value: 'gesunde Abgrenzung' }
            if (d && typeof d === 'object' && d.key && d.value) {
                if (window.innerWidth < 650) {
                    return d.key;
                }
                return d.value;
            }
            // Fallback für altes Format
            return d;
        })
        .call(wrap, cfg.wrapWidth);
    };

    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("y2", (d, i) => rScale(maxValue) * Math.sin(angleSlice * i - Math.PI/2))
        .attr("class", "line")
        .style("stroke", "#94a3b8") // Graue Farbe für die Achsen
        .style("stroke-width", "1px");

    // Füge gestrichelte horizontale Mittellinie hinzu (nur wenn konfiguriert)
    // Horizontale Linie nur anzeigen wenn in der Konfiguration aktiviert
    if (chartConfig.horizontalline) {
        axisGrid.append("line")
            .attr("x1", -radius * 1.2)
            .attr("y1", 0)
            .attr("x2", radius * 1.2)
            .attr("y2", 0)
            .attr("class", "center-line-horizontal")
            .style("stroke", "#9ca3af")
            .style("stroke-width", "1px")
            .style("stroke-dasharray", "3,3");
    }

    // Add arrow markers to SVG defs - entfernt, da nicht mehr benötigt
    
    // Add arrows to specific axes based on configuration
    axis.each(function(d, i) {
        // Prüfe sowohl d.key als auch d.value für Kompatibilität
        const axisKey = d.key || d;
        const axisValue = d.value || d;
        const angle = angleSlice * i - Math.PI/2;
        const endX = rScale(maxValue) * Math.cos(angle);
        const endY = rScale(maxValue) * Math.sin(angle);
        
        // Check if this axis should have an arrow - prüfe sowohl key als auch value
        const isInRadiusVector = chartConfig.radiusvector.includes(axisKey) || chartConfig.radiusvector.includes(axisValue);
        const isInInverseVector = chartConfig.inverseradiusvector.includes(axisKey) || chartConfig.inverseradiusvector.includes(axisValue);
        
        if (isInRadiusVector) {
            // Pfeil nach außen - dezentes Design
            const arrowSize = 8;
            const extendX = endX; // Pfeilspitze bündig mit dem letzten Kreis
            const extendY = endY; // Pfeilspitze bündig mit dem letzten Kreis
            
            // Berechne die Punkte für das Dreieck - Basis etwas nach innen
            const perpAngle = angle + Math.PI/2;
            const baseDistance = 0.92; // Basis leicht nach innen versetzt
            const px1 = endX * baseDistance + Math.cos(perpAngle) * arrowSize/2;
            const py1 = endY * baseDistance + Math.sin(perpAngle) * arrowSize/2;
            const px2 = endX * baseDistance - Math.cos(perpAngle) * arrowSize/2;
            const py2 = endY * baseDistance - Math.sin(perpAngle) * arrowSize/2;
            
            d3.select(this).append("polygon")
                .attr("points", `${extendX},${extendY} ${px1},${py1} ${px2},${py2}`)
                .attr("class", "arrow-triangle outward-arrow")
                .style("fill", "#64748b")
                .style("stroke", "#64748b")
                .style("stroke-width", "1px")
                .style("opacity", "0.8");
            
        } else if (isInInverseVector) {
            // Pfeil nach innen - Pfeilspitze zeigt zum Zentrum
            const arrowSize = 8; // Gleiche Größe wie outward arrows
            
            // Basis des Dreiecks am äußeren Rand (bündig mit dem letzten Kreis)
            const baseX = endX;
            const baseY = endY;
            
            // Berechne die beiden Basispunkte des Dreiecks am äußeren Rand
            const perpAngle = angle + Math.PI/2;
            const px1 = baseX + Math.cos(perpAngle) * arrowSize/2;
            const py1 = baseY + Math.sin(perpAngle) * arrowSize/2;
            const px2 = baseX - Math.cos(perpAngle) * arrowSize/2;
            const py2 = baseY - Math.sin(perpAngle) * arrowSize/2;
            
            // Pfeilspitze nach innen versetzt (zeigt zum Zentrum)
            const tipDistance = 0.92; // Spitze nach innen versetzt
            const tipX = endX * tipDistance;
            const tipY = endY * tipDistance;
            
            d3.select(this).append("polygon")
                .attr("points", `${tipX},${tipY} ${px1},${py1} ${px2},${py2}`)
                .attr("class", "arrow-triangle inward-arrow")
                .style("fill", "#64748b") // Gleiche Farbe wie outward arrows
                .style("stroke", "#64748b") // Gleiche Farbe wie outward arrows
                .style("stroke-width", "1px")
                .style("opacity", "0.8");
        }
    });

        //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#475569")
        .attr("text-anchor", (d,i) => {
            const angle = angleSlice * i - Math.PI/2;
            if (Math.abs(Math.cos(angle)) < 0.1) return "middle";
            return Math.cos(angle) > 0 ? "start" : "end";
        })
        .attr("dy", "0.3em")
        .attr("x", (d,i) => {
            const angle = angleSlice * i - Math.PI/2;
            // Erhöhe die Position für alle Labels, um sie außerhalb der Kreisfläche zu positionieren
            let position = rScale(maxValue * cfg.labelFactor * 1.10) * Math.cos(angle);
            // Zusätzlicher Abstand für bessere Lesbarkeit
            const offset = 10;
            // Prüfe ob es eine vertikale Achse ist (B oder E) - zentriert positionieren
            const isVerticalAxis = Math.abs(Math.cos(angle)) < 0.1;
            const horizontalOffset = isVerticalAxis ? 0 : (Math.cos(angle) > 0 ? offset : Math.cos(angle) < 0 ? -offset : 0);
            return position + horizontalOffset;
        })
        .attr("y", (d,i) => {
            const angle = angleSlice * i - Math.PI/2;
            // Erhöhe die Position für alle Labels, um sie außerhalb der Kreisfläche zu positionieren
            const basePosition = rScale(maxValue * cfg.labelFactor * 1.10) * Math.sin(angle) - 20 + 20; // +20px nach unten verschoben
            // Position relativ zur Gesamtzahl der Achsen bestimmen
            const normalizedPosition = (i / total) * 2 * Math.PI;
            
            // Prüfe ob es eine vertikale Achse ist (B oder E) und ob es sich um Namen-Labels handelt
            const isVerticalAxis = Math.abs(Math.cos(angle)) < 0.1;
            const useShortLabels = window.innerWidth < 650;
            const verticalAdjustment = (isVerticalAxis && !useShortLabels) ? -25 : 0; // Nur Namen-Labels (nicht Buchstaben) 25px nach oben
            
            // Vertikale Position basierend auf der normalisierten Position
            if (Math.abs(normalizedPosition - Math.PI) < 0.1) return basePosition + 10 + verticalAdjustment;     // unten - mehr Abstand
            if (Math.abs(normalizedPosition) < 0.1) return basePosition - 10 + verticalAdjustment;               // oben - mehr Abstand
            // Für seitliche Labels: Position basierend auf dem Winkel anpassen
            const verticalOffset = Math.abs(Math.sin(normalizedPosition)) * -5;
            return basePosition + verticalOffset + verticalAdjustment;
        })
        .attr("class", "legend")
        .text(d => {
            // Stelle sicher, dass wir das korrekte Format haben
            if (!d) {
                return 'ERR';
            }

            const useShortLabels = window.innerWidth < 650;
            
            if (useShortLabels) {
                const shortLabel = d.key || d.split?.(':')?.[0]?.trim() || 'ERR';
                return shortLabel;
            } else {
                const fullLabel = d.value || d || 'ERR';
                return fullLabel;
            }
        })
        .call(wrap, cfg.wrapWidth);
    
    // Initial update of labels
    updateLabels();
    
    // Debounced resize handler for chart rebuild
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Check if container still exists
            const container = d3.select(id);
            if (container.empty()) {
                window.removeEventListener('resize', handleResize);
                return;
            }
            
            // CRITICAL: Check if this container is still meant for RadarChart
            const containerElement = container.node();
            const isRadarContainer = containerElement && (
                containerElement.getAttribute('data-chart-context') === 'radar' ||
                containerElement.classList.contains('radar-chart-container') ||
                containerElement.querySelector('svg[data-chart-type="radar"]')
            );
            
            // Check if we're in a gauge context
            const isGaugeContext = containerElement && (
                containerElement.getAttribute('data-chart-context') === 'gauge' ||
                containerElement.classList.contains('gauge-chart-container') ||
                containerElement.querySelector('svg[data-chart-type="gauge"]')
            );
            
            if (isGaugeContext || !isRadarContainer) {
                window.removeEventListener('resize', handleResize);
                return;
            }
            
            // Clear the current chart
            d3.select(id).select("svg").remove();
            d3.selectAll(".radar-legend").remove();
            
            // Rebuild the chart with the same parameters
            RadarChart(id, data, options);
        }, 250); // 250ms delay to avoid too frequent rebuilds
    };
    
    // Remove any existing resize listeners for this chart
    window.removeEventListener('resize', updateLabels);
    
    // Add new resize listener
    window.addEventListener('resize', handleResize);    //The radial line function with support for inverse radius vectors
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius((d, i) => {
            const axisKey = d.axis ? d.axis.key : allAxis[i]?.key;
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
        .angle((d,i) => i * angleSlice);
        
    // Verwende die verarbeiteten Daten für das Chart
    data = processedData;

    if(cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed);
    }

    //Create a wrapper for the blobs
    const blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    //Append the backgrounds
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d))
        .style("fill", (d,i) => cfg.color(i))
        .style("fill-opacity", cfg.opacityArea);

    //Create the outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", (d,i) => cfg.color(i))
        .style("fill", "none")
        .style("filter" , "url(#glow)");

    //Append the circles
    blobWrapper.selectAll(".radarCircle")
        .data(d => d)
        .enter()
        .append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d,i) => {
            const axisKey = d.axis ? d.axis.key : allAxis[i]?.key;
            const isInverseAxis = chartConfig.inverseradiusvector.includes(axisKey);
            
            if (isInverseAxis) {
                const invertedValue = maxValue - d.value;
                return rScale(invertedValue) * Math.cos(angleSlice * i - Math.PI/2);
            } else {
                return rScale(d.value) * Math.cos(angleSlice * i - Math.PI/2);
            }
        })
        .attr("cy", (d,i) => {
            const axisKey = d.axis ? d.axis.key : allAxis[i]?.key;
            const isInverseAxis = chartConfig.inverseradiusvector.includes(axisKey);
            
            if (isInverseAxis) {
                const invertedValue = maxValue - d.value;
                return rScale(invertedValue) * Math.sin(angleSlice * i - Math.PI/2);
            } else {
                return rScale(d.value) * Math.sin(angleSlice * i - Math.PI/2);
            }
        })
        .style("fill", (d,i,j) => cfg.color(j))
        .style("fill-opacity", 0.8);

    //Wrapper for the invisible circles on top
    const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

    //Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d)
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius * 1.5)
        .attr("cx", (d,i) => {
            const axisKey = d.axis ? d.axis.key : allAxis[i]?.key;
            const isInverseAxis = chartConfig.inverseradiusvector.includes(axisKey);
            
            if (isInverseAxis) {
                const invertedValue = maxValue - d.value;
                return rScale(invertedValue) * Math.cos(angleSlice * i - Math.PI/2);
            } else {
                return rScale(d.value) * Math.cos(angleSlice * i - Math.PI/2);
            }
        })
        .attr("cy", (d,i) => {
            const axisKey = d.axis ? d.axis.key : allAxis[i]?.key;
            const isInverseAxis = chartConfig.inverseradiusvector.includes(axisKey);
            
            if (isInverseAxis) {
                const invertedValue = maxValue - d.value;
                return rScale(invertedValue) * Math.sin(angleSlice * i - Math.PI/2);
            } else {
                return rScale(d.value) * Math.sin(angleSlice * i - Math.PI/2);
            }
        })
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
            const newX = parseFloat(d3.select(this).attr('cx')) - 10;
            const newY = parseFloat(d3.select(this).attr('cy')) - 10;
            tooltip
                .attr('x', newX)
                .attr('y', newY)
                .text(d.value.toFixed(1))
                .transition().duration(200)
                .style('opacity', 1);
        })
        .on("mouseout", function(){
            tooltip.transition().duration(200)
                .style("opacity", 0);
        });

    //Set up the small tooltip for when you hover over a circle
    const tooltip = g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Create legend for narrow screens in cfg.config.categories order
    if (window.innerWidth < 650 && typeof cfg.config === 'object' && Array.isArray(cfg.config.categoriesArray)) {
        d3.selectAll(".radar-legend").remove();
        const chartContainer = document.querySelector(id);
        const parentContainer = chartContainer.parentNode;
        parentContainer.style.display = 'block';
        const legendContainer = document.createElement('div');
        legendContainer.className = 'radar-legend';
        Object.assign(legendContainer.style, {
            marginTop: '2rem',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.95rem',
            color: '#4a5568',
            textAlign: 'left',
            padding: '0 1rem',
            width: '100%',
            clear: 'both',
            display: 'block',
            position: 'relative'
        });
        // Überschrift hinzufügen
        const legendTitle = document.createElement('div');
        legendTitle.textContent = 'Legende:';
        legendTitle.style.fontWeight = '600';
        legendTitle.style.marginBottom = '0.5em';
        legendTitle.style.fontSize = '1.05em';
        legendContainer.appendChild(legendTitle);
        const wrapperDiv = document.createElement('div');
        Object.assign(wrapperDiv.style, {
            display: 'block',
            width: '100%',
            clear: 'both'
        });
        wrapperDiv.appendChild(legendContainer);
        if (chartContainer.nextSibling) {
            parentContainer.insertBefore(wrapperDiv, chartContainer.nextSibling);
        } else {
            parentContainer.appendChild(wrapperDiv);
        }
        // Verwende die Reihenfolge aus categoriesArray
        const ul = document.createElement('ul');
        ul.style.listStyle = 'disc inside';
        ul.style.margin = '0';
        ul.style.padding = '0';
        cfg.config.categoriesArray.forEach(({key, value}) => {
            const li = document.createElement('li');
            li.style.marginBottom = '0.4em';
            li.textContent = `${key}: ${value}`;
            ul.appendChild(li);
        });
        legendContainer.appendChild(ul);
    } else {
        d3.selectAll(".radar-legend").remove();
    }

    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

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
}
