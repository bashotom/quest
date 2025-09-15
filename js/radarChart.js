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
        dotRadius: 4,
        opacityCircles: 0.1,
        strokeWidth: 2,
        roundStrokes: true,
        color: d3.scaleOrdinal(d3.schemeCategory10)
    };

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
    const processedData = data.map(dataset => 
        dataset.map(d => {
            console.log('Original data point:', d);
            const axisValue = d.axis;
            
            // Wenn axis bereits ein Objekt ist
            if (typeof axisValue === 'object' && axisValue.key && axisValue.value) {
                console.log('Using existing object format:', axisValue);
                return d;
            }
            
            // Wenn axis ein String ist, versuche ihn zu parsen
            if (typeof axisValue === 'string') {
                const key = Object.entries(config.categories).find(([k, v]) => v === axisValue)?.[0];
                if (key) {
                    console.log('Found category mapping:', { key, value: axisValue });
                    return {
                        ...d,
                        axis: { key, value: axisValue }
                    };
                }
            }
            
            console.log('Using fallback format:', axisValue);
            return {
                ...d,
                axis: { key: '?', value: String(axisValue) }
            };
        })
    );
    
    const allAxis = processedData[0].map(i => i.axis),
          total = allAxis.length,
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

    // Werte für die Skala
    levels.append("text")
        .attr("class", "axisLabel")
        .attr("x", 5)
        .attr("y", d => -radius * d/cfg.levels)
        .style("font-size", "10px")
        .style("fill", "#000000")
        .text(d => Math.round(maxValue * d/cfg.levels));

    //Create the straight lines radiating outward from the center
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    // Function to update labels based on screen width
    const updateLabels = () => {
        console.log('updateLabels called, screen width:', window.innerWidth);
        const legends = axis.selectAll(".legend");
        console.log('Found legend elements:', legends.size());
        
        legends.text(d => {
            console.log('Processing label:', d);
            // Erwarte das Format { key: 'A', value: 'gesunde Abgrenzung' }
            if (d && typeof d === 'object' && d.key && d.value) {
                if (window.innerWidth < 650) {
                    console.log('Screen width < 650, using key:', d.key);
                    return d.key;
                }
                console.log('Screen width >= 650, using value:', d.value);
                return d.value;
            }
            // Fallback für altes Format
            return d;
        })
        .call(wrap, cfg.wrapWidth);
    };

    // Add resize listener
    window.addEventListener('resize', updateLabels);

    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("y2", (d, i) => rScale(maxValue) * Math.sin(angleSlice * i - Math.PI/2))
        .attr("class", "line")
        .style("stroke", "#94a3b8") // Graue Farbe für die Achsen
        .style("stroke-width", "1px");

        //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "16px")
        .style("fill", "#475569")
        .attr("text-anchor", (d,i) => {
            const angle = angleSlice * i - Math.PI/2;
            if (Math.abs(Math.cos(angle)) < 0.1) return "middle";
            return Math.cos(angle) > 0 ? "start" : "end";
        })
        .attr("dy", (d,i) => {
            // Position relativ zur Gesamtzahl der Achsen bestimmen
            const normalizedPosition = (i / total) * 2 * Math.PI;
            const isNarrowScreen = window.innerWidth < 650;
            
            // 0 = oben, PI = unten, PI/2 = rechts, 3PI/2 = links
            if (Math.abs(normalizedPosition - Math.PI) < 0.1) {
                return "0em";     // unten
            }
            if (Math.abs(normalizedPosition) < 0.1) {
                return isNarrowScreen ? "2.5em" : "0.3em";  // oben: Key weiter unten, volles Label noch höher
            }
            return "1.4em";     // seiten
        })
        .attr("x", (d,i) => {
            const angle = angleSlice * i - Math.PI/2;
            // Reduziere die tatsächliche Position für seitliche Labels
            let position = rScale(maxValue * cfg.labelFactor) * Math.cos(angle);
            // Für seitliche Labels (cos nahe 0) reduzieren wir die Position zusätzlich
            if (Math.abs(Math.cos(angle)) > 0.3) {
                position = position * 0.92; // Reduziere die Position für seitliche Labels um 8%
            }
            // Debug-Ausgaben für die Label-Positionierung
            console.log(`Label ${d}:`, {
                angle: (angle * 180 / Math.PI).toFixed(2) + '°',
                basePosition: position.toFixed(2),
                scaledValue: rScale(maxValue).toFixed(2),
                labelFactor: cfg.labelFactor
            });
            // Minimaler horizontaler Abstand
            const offset = 2;
            return position + (Math.cos(angle) > 0 ? offset : Math.cos(angle) < 0 ? -offset : 0);
        })
        .attr("y", (d,i) => {
            const angle = angleSlice * i - Math.PI/2;
            const basePosition = rScale(maxValue * cfg.labelFactor) * Math.sin(angle) - 10; // 10px höher
            // Position relativ zur Gesamtzahl der Achsen bestimmen
            const normalizedPosition = (i / total) * 2 * Math.PI;
            // Vertikale Position basierend auf der normalisierten Position
            // Debug-Ausgaben für die vertikale Positionierung
            console.log(`Label ${d} (vertikal):`, {
                normalizedPosition: (normalizedPosition * 180 / Math.PI).toFixed(2) + '°',
                basePosition: basePosition.toFixed(2),
                isBottom: Math.abs(normalizedPosition - Math.PI) < 0.1,
                isTop: Math.abs(normalizedPosition) < 0.1
            });
            if (Math.abs(normalizedPosition - Math.PI) < 0.1) return basePosition + 2;     // unten
            if (Math.abs(normalizedPosition) < 0.1) return basePosition - 5;               // oben
            // Für seitliche Labels: Position basierend auf dem Winkel anpassen
            const verticalOffset = Math.abs(Math.sin(normalizedPosition)) * -8;
            return basePosition + verticalOffset;                                                       // seiten
        })
        .attr("class", "legend")
        .text(d => {
            console.log('Processing label for display:', d);
            // Stelle sicher, dass wir das korrekte Format haben
            if (!d) {
                console.error('No label data received');
                return 'ERR';
            }

            const useShortLabels = window.innerWidth < 650;
            console.log('Window width:', window.innerWidth, 'Using short labels:', useShortLabels);
            
            if (useShortLabels) {
                const shortLabel = d.key || d.split?.(':')?.[0]?.trim() || 'ERR';
                console.log('Using short label:', shortLabel);
                return shortLabel;
            } else {
                const fullLabel = d.value || d || 'ERR';
                console.log('Using full label:', fullLabel);
                return fullLabel;
            }
        })
        .call(wrap, cfg.wrapWidth);
    
    // Initial update of labels
    console.log('Calling initial updateLabels...');
    updateLabels();
    
    // Log when resize event occurs
    window.addEventListener('resize', () => {
        console.log('Window resize detected, width:', window.innerWidth);
        updateLabels();
    });    //The radial line function
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
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
        .style("fill-opacity", cfg.opacityArea)
        .on("mouseover", function(event, d) {
            //Dim all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1); 
            //Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on("mouseout", () => {
            //Bring back all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });

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
        .attr("cx", (d,i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("cy", (d,i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI/2))
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
        .attr("cx", (d,i) => rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2))
        .attr("cy", (d,i) => rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2))
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
            const newX = parseFloat(d3.select(this).attr('cx')) - 10;
            const newY = parseFloat(d3.select(this).attr('cy')) - 10;
            tooltip
                .attr('x', newX)
                .attr('y', newY)
                .text(d.value)
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

    // Create legend for narrow screens in config.categories order
    if (window.innerWidth < 650 && typeof config === 'object' && Array.isArray(config.categoriesArray)) {
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
        config.categoriesArray.forEach(({key, value}) => {
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
