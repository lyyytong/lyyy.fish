const html = document.getElementsByTagName('html')[0]
const lineH = parseFloat(getComputedStyle(html).lineHeight.split('px')[0])

const barH = 20
const thinBarH = lineH*.7

const numGradientStops = 5
const stops = d3.range(numGradientStops).map(i => i / (numGradientStops - 1))

const colorHot = '#E15A97'
const colorWarm = '#feb0c0'
const colorLight = '#fcebd7'

const lineTexture = textures.lines().size(5.5).strokeWidth(3).stroke('var(--bg-color)')
const dotTexture = textures.circles().size(3).radius(.5).fill('var(--main-color')

drawCircles();
function drawCircles() {
    const width = d3.min([d3.select("#wrapper1").node().clientWidth, 600]);
    let dim = {
        width: width,
        height: width*.9,
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        },
    };
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right;
    dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom;

    const wrapper = d3.select("#wrapper1").append("svg")
        .attr("width", dim.width)
        .attr("height", dim.height);
    const bounds = wrapper.append("g").style(
        "transform",`translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`
    );

    const above500R = dim.boundedWidth*1.1 / (2 + 2 * Math.sqrt(18 / 82))
    const under500R = dim.boundedWidth*1.1 / 2 - above500R

    wrapper.call(dotTexture)

    const defs = wrapper.select('defs')
    const sunGradientId = 'sun-gradient'
    defs.append('linearGradient')
        .attr('id', sunGradientId)
        .selectAll('stop').data(stops)
        .join('stop')
        .attr('stop-color', d => d3.interpolateRgb(colorHot, colorLight)(d))
        .attr('offset', d => `${d * 100}%`)
    
    const smallCircleGroup = bounds.append('g')
        .style('transform', `translate(
            ${dim.boundedWidth*.5 + under500R*1.7}px,
            ${dim.boundedHeight*.5 + under500R*1.7}px
        )`)
    smallCircleGroup.append('circle')
            .attr('r',under500R)
            .style('fill',dotTexture.url())

    const bigCircleGroup = bounds.append('g')
        .style('transform', `translate(
            ${dim.boundedWidth*.42}px,
            ${dim.boundedHeight*.5}px
        )`)
    bigCircleGroup.append('circle')
        .attr('r',above500R)
        .style('fill',`url(#${sunGradientId})`)
        .style('opacity',.2)
        .style('transform','rotate(20deg)')
    bigCircleGroup.append('circle')
        .attr('r',above500R)
        .style('fill',dotTexture.url())
    bigCircleGroup.append('text').html(82)
        .style('transform', `translate(10px, 5px)`)
        .attr('class','big-circle-percent')
        .append('tspan')
            .attr('class','big-circle-percent-sign')
            .html('%')
    
    const circlePoints = d3.range(0,Math.PI*2,.07).concat(Math.PI*2)
    const radialLineGen = d3.lineRadial().angle(d => d)
    
    const bigCircleText = bigCircleGroup.append('g')
    bigCircleText.append('path').attr('d', () => {
            radialLineGen.radius(above500R + 3)
            return radialLineGen(circlePoints)
        })
        .attr('id', 'big-circle-path')
    bigCircleText.append('path').attr('d', () => {
            radialLineGen.radius(above500R)
            return radialLineGen(circlePoints)
        })
        .attr('class', 'big-circle-border')
    bigCircleText.append('text')
        .style('transform', 'rotate(-75deg)')
        .append('textPath')
            .attr('xlink:href', `#big-circle-path`)
            .html('Swiss apartments with at least 500 lux of sun (averaged across rooms)')

    const smallCircleText = smallCircleGroup.append('g')
    smallCircleText.append('path').attr('d', () => {
            radialLineGen.radius(under500R+2)
            return radialLineGen(circlePoints)
        })
        .attr('id', 'small-circle-path')
    smallCircleText.append('text')
        .append('textPath')
            .attr('xlink:href', `#small-circle-path`)
            .html('vs. units less illuminated')
}
//----------------------------------------------------------
//----------------------------------------------------------
//----------------------------------------------------------
drawSunBar()
function drawSunBar() {
    const width = d3.min([d3.select("#wrapper2").node().clientWidth, 600]);
    let dim = {
        width: width,
        height: d3.min([width*.4,170]),
        margin: {
            top: 0,
            right: 0,
            bottom: 10,
            left: 0,
        },
    };
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right;
    dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom;

    const wrapper = d3
        .select("#wrapper2").append("svg")
        .attr("width", dim.width)
        .attr("height", dim.height);
    
    const bounds = wrapper.append("g").style(
        "transform",
        `translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`
    )

    const sunBarY = dim.boundedHeight * .7
    bounds.append('text')
        .attr('class','sun-note')
        .attr('x',0).attr('y', sunBarY * .01)
        .html('Illuminance (lux):')
        .append('tspan').html('the amount of light hitting a surface.')
        .attr('x',0).attr('y', sunBarY * .01 + lineH)
        .append('tspan').html('1 lux is equivalent to the amount of')
        .attr('x',0).attr('y', sunBarY * .01 + lineH * 2)
        .append('tspan').html('light hitting 1m² of surface from a')
        .attr('x',0).attr('y', sunBarY * .01 + lineH * 3)
        .append('tspan').html('candle placed 1 meter away.')
        .attr('x',0).attr('y', sunBarY * .01 + lineH * 4)
    
    wrapper.call(lineTexture)
    const defs = wrapper.select('defs')
    const strongSunGradientId = 'strong-sun-gradient'
    defs.append('linearGradient')
        .attr('id', strongSunGradientId)
        .selectAll('stop').data(stops)
        .join('stop')
        .attr('stop-color', d => d3.interpolateRgb(colorHot, colorLight)(d))
        .attr('offset', d => `${d * 100}%`)
    bounds.append('rect')
        .attr('y', sunBarY - barH/2)
        .attr('height', barH).attr('width', dim.boundedWidth)
        .style('fill',`url(#${strongSunGradientId})`)
    bounds.append('rect')
        .attr('y', sunBarY - barH/2-1)
        .attr('height', barH+2).attr('width', dim.boundedWidth)
        .style('fill',lineTexture.url())

    const xSunScale = d3.scalePow()
        .exponent(.6)
        .domain([0, 100])
        .range([dim.boundedWidth, 0])

    const luxLevels = [.5, 1, 10, 100]
    const luxLevelsGroup = bounds.selectAll('.lux-level').data(luxLevels)
    luxLevelsGroup.join('text').attr('class', 'lux-level')
        .html(d => d == .5 ? '500 lux'
            : d == 1 ? '1 kilolux'
                : d == 10 ? '10 kilolux'
                    : '100 kilolux')
        .attr('x', d => d == 100 ? xSunScale(d) + 5 : xSunScale(d) - 5)
        .attr('y', d => d == .5 ? sunBarY * .01 : sunBarY + 30)
        .style('text-anchor', d => d == 100 ? 'start' : 'end')
        .style('dominant-baseline', d => d == .5 ? 'hanging' : 'middle')
        .append('tspan')
            .attr('x', d => d == 100 ? xSunScale(d) + 5 : xSunScale(d) - 5)
            .attr('y', d => d == .5 ? sunBarY * .01 + lineH : sunBarY + 30 + lineH)
            .html(d => d == .5 ? 'library, study'
                : d == 1 ? 'cloudy day'
                : d == 10 ? 'sunny day'
                : 'strong, direct sunlight')
            .style('dominant-baseline', d => d == .5 ? 'hanging' : 'middle')
    luxLevelsGroup.join('line').attr('class','annotation-line')
        .attr('y1', d => d == .5 ? sunBarY - 10 : sunBarY + 10)
        .attr('y2', d => d == .5 ? sunBarY * .01 : sunBarY + 30 + lineH * 1.35)
        .style('transform', d =>d==100 ? `translateX(${xSunScale(d)+1}px)` : `translateX(${xSunScale(d)}px)`)

    const sunTicks = d3.range(0,100,10)
    const xAxis = bounds.append('g').attr('class','sun-axis axis')
        .style('transform',`translateY(${sunBarY}px)`)
    const xAxisTicks = xAxis.selectAll('.tick').data(sunTicks)
        .join('g').attr('class','tick')
    xAxisTicks.append('text').html(d=>d)
        .attr('x',d=>xSunScale(d))
        .attr('y',-16)
    xAxisTicks.append('line')
        .attr('y1',-8).attr('y2',-13)
        .style('transform',d=>`translateX(${xSunScale(d)}px)`)
}
//----------------------------------------------------------
//----------------------------------------------------------
//----------------------------------------------------------
drawFloors();
async function drawFloors() {
    const data = await d3.csv('../data/sun-and-swiss-dwellings/floors.csv', d3.autoType)

    const yFloorA = d => d.floor_number
    const xCountA = d => d.apartment_count
    const xSunA = d => d.sun_spring_10am_klx

    const width = d3.min([d3.select('#wrapper3').node().clientWidth, 600])
    let dim = {
        width: width,
        height: d3.min([width,450]),
        margin: {
            top: 10,
            right: 0,
            bottom: 0,
            left: 0
        }
    }
    dim.margin.right = d3.median([20,width*.04,25])
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right
    dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom

    const wrapper = d3.select('#wrapper3')
        .append('svg').attr('width', dim.width).attr('height', dim.height)
    const bounds = wrapper.append('g')
        .style('transform', `translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`)
    
    wrapper.call(lineTexture)
    const defs = wrapper.select('defs')
    const lightSunGradientId = 'light-sun-gradient'
    defs.append('linearGradient')
        .attr('id', lightSunGradientId)
        .selectAll('stop').data(stops)
        .join('stop')
        .attr('stop-color', d => d3.interpolateRgb(colorWarm, colorLight)(d))
        .attr('offset', d => `${d * 100}%`)

    const yScale = d3.scaleBand()
        .domain(data.map(d => yFloorA(d)))
        .range([dim.boundedHeight, 0])
        .paddingOuter(.2)
    const bandH = yScale.bandwidth()
    const halfBandH = bandH/2
    const xCountScale = d3.scaleLinear()
        .domain(d3.extent(data, xCountA))
        .range([dim.boundedWidth, 0])
        .nice()
    const xSunScale = d3.scaleLinear()
        .domain([0,d3.max(data, xSunA)])
        .range([dim.boundedWidth, 0])

    const sunBars = bounds.append('g')
        .selectAll('.sun-bar')
        .data(data).join('g').attr('class','sun-bar')
        .style('transform',d=>`translateY(${
            yScale(yFloorA(d))+halfBandH-thinBarH/2}px
        )`)
    sunBars.append('rect')
        .attr('x', d => xSunScale(xSunA(d)))
        .attr('width', d => dim.boundedWidth - xSunScale(xSunA(d)))
        .attr('height',thinBarH)
        .style('fill',`url(#${lightSunGradientId})`)
    sunBars.append('rect')
        .attr('x', d => xSunScale(xSunA(d)))
        .attr('width', d => xCountScale(xCountA(d)) - xSunScale(xSunA(d)) >=0
            ? xCountScale(xCountA(d)) - xSunScale(xSunA(d))
            : 0)
        .attr('height',thinBarH)
        .style('fill',lineTexture.url())
    sunBars.append('rect')
        .attr('class','count-bar-bg')
        .attr('x', d => xCountScale(xCountA(d)))
        .attr('width',d=>dim.boundedWidth-xCountScale(xCountA(d)))
        .attr('height',thinBarH)
    
    const notes = bounds.append('g')
        .attr('class','note')
    const countBars = bounds.append('g')
        .selectAll('.count-bar')
        .data(data).join('g').attr('class','count-bar')
        .style('transform',d=>`translateY(${
            yScale(yFloorA(d))+halfBandH}px
        )`)

    countBars.append('rect')
        .attr('x',d=>xCountScale(xCountA(d)))
        .attr('y',-thinBarH/2)
        .attr('width',d=>dim.boundedWidth-xCountScale(xCountA(d)))
        .attr('height',thinBarH)
        .style('fill',dotTexture.url())
    countBars.append('text').html('\\')
        .attr('x',d=>xCountScale(xCountA(d))-3)
        .attr('y',1)

    const lowFloorCount = d3.filter(
        data, d => yFloorA(d) >= 0 && yFloorA(d) <= 4
    ).map(xCountA)
    const countSum = d3.sum(data, xCountA)
    const lowFloorPct = d3.format('.0%')(d3.sum(lowFloorCount) / countSum)

    notes.append('text')
        .html(`${lowFloorPct} of Swiss apartments are on the 5 lowest floors.`)
        .attr('x',8)
        .attr('y',yScale(-4)+halfBandH-lineH)
    notes.append('text')
        .html(`Units rising from this density tend to get more sun.`)
        .attr('x',8)
        .attr('y',yScale(-4)+halfBandH)

    const rectX = yScale(4)+halfBandH-thinBarH/2-2
    const rectHeight = yScale(0)+bandH-rectX+2
    const rectWidth = dim.boundedWidth*.3
    notes.append('foreignObject')
        .attr('y',rectX)
        .attr('height',rectHeight)
        .attr('width',rectWidth)
        .append('xhtml:div')
            .style('width',rectWidth+'px')
            .style('height',rectHeight+'px')
        .attr('class','low-floor-highlight')
    notes.append('line')
        .attr('y1',yScale(-1)+2)
        .attr('y2',dim.boundedHeight-5)
        .style('transform',`translateX(1px)`)
        .attr('class','annotation-line')

    bounds.append('g')
        .selectAll('.floor-number')
        .data(yScale.domain())
        .join('text').attr('class', 'floor-number')
        .attr('x', dim.boundedWidth + dim.margin.right)
        .attr('y', d => yScale(d) + halfBandH)
        .html(d => d == 0 ? '0F'
            : d < 0 ? String(d).replace('-', 'B')
                : String(d).length == 1 ? String(d) + 'F'
                    : d
        )

    const sunTicks = d3.range(0, xSunScale.domain()[1],0.2)
        .map(d=>d==0? parseInt(d) :d3.format('.1f')(d))
    const xSunAxis = bounds.append('g').attr('class','sun-axis axis')
    const xSunAxisTicks = xSunAxis.selectAll('.tick')
        .data(sunTicks)
        .join('g').attr('class','tick')
    xSunAxisTicks.append('text').html(d=>d)
        .attr('x',d=>xSunScale(d))
        .attr('y',-11)
    xSunAxisTicks.append('line')
        .attr('y1',-3).attr('y2',-8)
        .style('transform',d=>`translateX(${xSunScale(d)}px)`)
    xSunAxis.append('text').html('Median Sunlight (Kilolux)')
        .attr('class','axis-label')
        .attr('x',dim.boundedWidth+5)
        .attr('y',-11-lineH)
        .style('text-anchor','end')
    xSunAxis.append('line')
        .attr('x1',1).attr('x2',dim.boundedWidth)
        .style('transform',`translateY(-3px)`)

    const countTicks = d3.range(1000,xCountScale.domain()[1],1000)
    const xCountAxis = bounds.append('g').attr('class','count-axis axis')
        .style('transform',`translateY(${dim.boundedHeight}px)`)
    const xCountAxisTicks = xCountAxis.selectAll('.tick')
        .data(countTicks).join('g').attr('class','tick')
    xCountAxisTicks.append('text').html(d=>d)
        .attr('x',d=>xCountScale(d))
        .attr('y',-8)
    xCountAxisTicks.append('line')
        .attr('y1',0).attr('y2',-5)
        .style('transform',d=>`translateX(${xCountScale(d)}px)`)
    xCountAxis.append('text').html('Apartments per Floor')
        .attr('class','axis-label')
        .attr('y', 6).attr('x',dim.boundedWidth)
    xCountAxis.append('line')
        .attr('x1',1).attr('x2',dim.boundedWidth)
}
//----------------------------------------------------------
//----------------------------------------------------------
//----------------------------------------------------------
drawRooms()
async function drawRooms() {
    const data = await d3.csv('../data/sun-and-swiss-dwellings/rooms.csv', d3.autoType)
    data.sort((a, b) => d3.descending(a.median, b.median))
    const rooms = d3.map(data, d => d.room)

    const width = d3.min([
        d3.select('#wrapper4').node().clientWidth,
        600
    ])
    let dim = {
        width: width,
        height: d3.min([width*.9,350]),
        margin: {
            top: 0,
            right: 0,
            bottom: 95,
            left: 0
        }
    }
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right
    dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom

    const yRoomA = d => d.room
    const x25A = d => d['25']
    const x75A = d => d['75']
    const xMedianA = d => d.median

    const yScale = d3.scaleBand()
        .domain(rooms)
        .range([0, dim.boundedHeight])
        .paddingOuter(.2)
    const sunMin = d3.min(data, d => d.min)
    const sunMax = d3.max(data, d => d['75'])
    const xSunScale = d3.scalePow()
        .exponent(.8)
        .domain([sunMin,sunMax])
        .range([dim.boundedWidth,0])
        .clamp(true)
    const colorScale = d3.scaleLinear()
        .domain(d3.extent(data, xMedianA))
        .range([colorLight, colorHot])

    const wrapper = d3.select('#wrapper4').append('svg')
        .attr('width', dim.width).attr('height', dim.height)
    const bounds = wrapper.append('g')
        .style('transform', `translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`)

    const bars = bounds.append('g')
        .selectAll('.room-bar')
        .data(data).join('g').attr('class','room-bar')
        .style('transform',d=>`translateY(
            ${yScale(yRoomA(d))+yScale.bandwidth()/2}px
        )`)
    bars.append('rect')
        .attr('x', d => xSunScale(x75A(d)))
        .attr('y', d => -thinBarH/2)
        .attr('height', thinBarH)
        .attr('width', d => xSunScale(x25A(d)) - xSunScale(x75A(d)))
        .style('fill',d=>colorScale(xMedianA(d)))
    wrapper.call(lineTexture)
    bars.append('rect')
        .attr('x', d => xSunScale(x75A(d)))
        .attr('y', d => -thinBarH/2-1)
        .attr('height', thinBarH+2)
        .attr('width', d => xSunScale(x25A(d)) - xSunScale(x75A(d)))
        .style('fill',lineTexture.url())
    bars.append('text')
        .attr('class', 'room-text')
        .attr('x', d => yRoomA(d) == 'Balcony' ? xSunScale(x75A(d)) : xSunScale(x75A(d)) - 4)
        .attr('y', d => yRoomA(d) == 'Balcony' ? -lineH*.6 : 0)
        .style('text-anchor', d => yRoomA(d) == 'Balcony' ? 'start' : 'end')
        .style('dominant-baseline', d => yRoomA(d) == 'Balcony' ? 'auto' : 'middle')
        .html(d => yRoomA(d))

    const notes = bounds.append('foreignObject')
        .attr('width', dim.boundedWidth)
        .attr('height', dim.margin.bottom)
        .attr('y', dim.boundedHeight)
        .append('xhtml:div')
        .html('The strongest correlation with illuminance is sky view. The average balcony with a wide view receives 10,000 times more light per square meter than the average bathroom. The amount of windows and skylights, though impressive on paper, only matter insofar as they allow maximum sky view.')
    
    const axisY = notes.node().getBoundingClientRect().height
        + dim.boundedHeight + 22

    const sunTicks = d3.range(0,xSunScale.domain()[1],1)
    const xAxis = bounds.append('g').attr('class','sun-axis axis')
        .style('transform',`translateY(${axisY}px)`)
    const xAxisTicks = xAxis.selectAll('.tick')
        .data(sunTicks).join('g').attr('class','tick')
    xAxisTicks.append('text').html(d=>d)
        .attr('x',d=>xSunScale(d))
        .attr('y',-8)
    xAxisTicks.append('line')
        .attr('y2',-5)
        .style('transform',d=>`translateX(${xSunScale(d)}px)`)
    xAxis.append('line').attr('x2',dim.boundedWidth)
    xAxis.append('text').html('Sunlight Interquartile Range (Kilolux)')
        .attr('class','axis-label')
        .attr('y',6)
        .style('dominant-baseline','hanging')
}

const seeMoreButton = d3.select('#see-more')
    .on('click', clicked)
function clicked() {
    const button = d3.select(this)
    const axes = d3.selectAll('.axis')
    const notes = d3.selectAll('.note')
    if (axes.style('opacity')==0) {
        axes.transition().duration(100).style('opacity',1)
        button.html('hide axes')
        notes.transition().duration(100).style('opacity',0)
    } 
    else {
        axes.transition().duration(100).style('opacity',0)
        button.html('show axes')
        notes.transition().duration(100).style('opacity',1)
    } 
}
