function RadarChart(id, data, options) {
    const cfg = {
        w: 600,
        h: 600,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        levels: 3,
        maxValue: 0,
        labelFactor: 1.25,
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

    const allAxis = data[0].map(i => i.axis),
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
        .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
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
    axisGrid.selectAll(".levels")
        .data(d3.range(1, cfg.levels+1).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius * d/cfg.levels)
        .style("fill", "#fff")
        .style("stroke", "#ddd")
        .style("fill-opacity", cfg.opacityCircles);

    //Create the straight lines radiating outward from the center
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI/2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d,i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI/2))
        .attr("y", (d,i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI/2))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    //The radial line function
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d,i) => i * angleSlice);

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
