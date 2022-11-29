const sunFiller = '//////////'.repeat(100)
const countFiller = '~~~~~~~~~~'.repeat(10)
const descFiller = "Swiss Dwellings: A large dataset of apartment models including aggregated geolocation-based simulation results covering viewshed, natural light, traffic noise, centrality and geometric analysis. Authors: Matthias Standfest; Michael Franzen; Yvonne Schröder; Luis Gonzalez Medina; Yarilo Villanueva Hernandez; Jan Hendrik Buck; Yen-Ling Tan; Milena Niedzwiecka; Rachele Colmegna. This dataset contains detailed data on over 42,500 apartments (250,000 rooms) in ~3,100 buildings including their geometries, room typology as well as their visual, acoustical, topological and daylight characteristics. The data is sourced from commercial clients of Archilyse AG specializing on the digitization and analysis of buildings. The existing building plans of clients are converted into a geo-referenced, semantically annotated representation and undergo a manual Q/A process to ensure accuracy of the data and to ensure a maximum 5%-deviation in the apartments' areas (validated with a median deviation of 1.2 %). The dataset contains a file geometries.csv which contains the geometries of all areas, walls, railings, columns, windows, doors and features(sinks, bathtubs, etc.) of an apartment. In total the datasets contains the 2D geometry of ~1.5 million separators(walls, railings), ~670, 000 openings(windows, doors), ca. 400, 000 areas(rooms, bathrooms, kitchens, etc.) and ~290, 000 features(sinks, toilets, bathtubs, etc.).Beside the geometrical model, we also provide simulation data on the visual, acoustic, solar, layout and connectivity - related characteristics of the apartments. The file simulations.csv contains the simulation data aggregated on a per - area basis.Each row contains the identifier columns area_id, unit_id, apartment_id, floor_id, building_id, site_id as defined above as well as 367 simulation columns.The layout features represent simple features based on the geometry and composition of a room, the dataset provides the following information in an unaggregated form. The views from an object help to understand the impact of the surroundings on the object. The view simulation calculates the visible amount of buildings, greenery, water etc.on each individual hexagon from the analyzed object. The values are expressed in steradians(sr) and represent the amount a certain object category occupies in the spherical field of view. Each of the following dimension is provided using the room - wise aggregations min, max, mean, std, median, p20 and p80.For instance, the column view_greenery_p20 describes the amount of greenery that can be seen from at least 20 % of the positions in the area.Sun simulations help to understand the impact of the solar radiation on the object. The outcome of the sun simulations helps to identify surfaces that have great solar potential. Sun simulations are defined by the amount of sun radiation on each individual hexagon from the analyzed object.The sun simulation not only includes direct sun but also considers scattered light. The sun simulation values are given in Kilolux(klx). Simulations are performed for the days of summer solstice, winter solstice and vernal equinox. Noise level and the distribution of elements from an area helps to understand how an object is exposed to the acoustics of this area.The acoustic simulation calculates the noise intensity on each individual hexagon from the analyzed object considering traffic and train noise datasets.Adjacent buildings are considered as noise blocking elements.The values are expressed in dBA(decibels).Centrality simulations help to analyze a floor plan, whether it's a shopping mall and you want to identify prominent areas in order to select the most prominent spot or it's an interior design circulation path and you want to determine open floor plan areas.Centrality simulations are done using topological measures that score grid cells by their importance as a part of a gridcell network.Matthias Standfest, Michael Franzen, Yvonne Schröder, Luis Gonzalez Medina, Yarilo Villanueva Hernandez, Jan Hendrik Buck, Yen - Ling Tan, Milena Niedzwiecka, & Rachele Colmegna. (2022).Swiss Dwellings: A large dataset of apartment models including aggregated geolocation - based simulation results covering viewshed, natural light, traffic noise, centrality and geometric analysis(2.0.0)[Data set].Zenodo.https://doi.org/10.5281/zenodo.7215005".repeat(10)

const html = document.getElementsByTagName('html')[0]
const lineHeight = parseFloat(getComputedStyle(html).lineHeight.split('px')[0])

const sunBarHeight = 20

const numGradientStops = 5
const stops = d3.range(numGradientStops).map(i => i / (numGradientStops - 1))

const colorHot = '#d10000'
const colorWarm = '#f08080'
const colorLight = '#ffdab9'

drawCircles();
function drawCircles() {
    const width = d3.min([d3.select("#wrapper1").node().clientWidth, 600]);
    let dim = {
        width: width,
        height: width*.95,
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        },
    };
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right;
    dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom;

    const wrapper = d3
        .select("#wrapper1").append("svg")
        .attr("width", dim.width)
        .attr("height", dim.height);
    const bounds = wrapper.append("g").style(
        "transform",
        `translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`
    );

    const above500R = dim.boundedWidth*1.1 / (2 + 2 * Math.sqrt(18 / 82))
    const under500R = dim.boundedWidth*1.1 / 2 - above500R

    const smallCircleGroup = bounds.append('g')
        .style('transform', `translate(
            ${dim.boundedWidth*.5 + under500R * .6}px,
            ${dim.boundedHeight*.5 + under500R *.6}px
        )`)
    smallCircleGroup.append('foreignObject')
        .attr('width', under500R * 2)
        .attr('height', under500R * 2)
        .attr('class', 'circle-bg')
        .append('xhtml:div')
            .style('width', `${under500R * 2}px`)
            .style('height', `${under500R * 2}px`)
            .html(descFiller)

    const bigCircleGroup = bounds.append('g')
        .style('transform', `translate(
            ${dim.boundedWidth*.5 - above500R * 1.22}px,
            ${dim.boundedHeight*.45 - above500R}px
        )`)
    bigCircleGroup.append('foreignObject')
        .attr('width', above500R * 2).attr('height', above500R * 2)
        .attr('class', 'circle-bg')
        .append('xhtml:div')
            .attr('class','big-circle')
            .style('width', `${above500R * 2}px`)
            .style('height', `${above500R * 2}px`)
            .html(descFiller)
    bigCircleGroup.append('text').html(82)
        .style('transform', `translate(
            ${above500R + 8}px,
            ${above500R + 6}px
        )`)
        .attr('class','big-circle-percent')
        .append('tspan')
            .html('%').attr('class','big-circle-percent-sign')

    let circlePoints = d3.range(90)
    circlePoints = circlePoints.map(d => d * (Math.PI * 2) / circlePoints.slice(-1)[0])
    const radialLineGen = d3.lineRadial().angle(d => d)

    const bigCircleText = bigCircleGroup.append('g')
        .style('transform', `translate(${above500R}px,${above500R}px)`)
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
        .style('transform', 'rotate(-85deg)')
        .append('textPath')
            .attr('xlink:href', `#big-circle-path`)
            .html('Swiss apartments with at least 500 lux of sun (averaged across rooms)')

    const smallCircleText = smallCircleGroup.append('g')
        .style('transform', `translate(${under500R}px,${under500R}px)`)
    smallCircleText.append('path').attr('d', () => {
            radialLineGen.radius(under500R + 4)
            return radialLineGen(circlePoints)
        })
        .attr('id', 'small-circle-path')
    smallCircleText.append('text')
        // .style('transform', 'rotate(0deg)')
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
        height: width * .4+35,
        margin: {
            top: 0,
            right: 5,
            bottom: 30,
            left: 5,
        },
    };
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right;
    dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom;

    const wrapper = d3
        .select("#wrapper2")
        .append("svg")
        .attr("width", dim.width)
        .attr("height", dim.height);
    
    const bounds = wrapper.append("g").style(
        "transform",
        `translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`
    )
    bounds.append('rect')
        .attr('width', dim.boundedWidth)
        .attr('height', dim.boundedHeight)
        .attr('class','bg-color')

    const sunBarY = dim.boundedHeight * .75
    bounds.append('text')
        .attr('class','sun-note')
        .attr('x',1).attr('y', sunBarY * .01)
        .html('Illuminance (lux):')
        .append('tspan').html('the amount of light hitting a surface.')
        .attr('x',1).attr('y', sunBarY * .01 + lineHeight)
        .append('tspan').html('1 lux is equivalent to the amount of')
        .attr('x',1).attr('y', sunBarY * .01 + lineHeight * 2)
        .append('tspan').html('light hitting 1m² of surface from a')
        .attr('x',1).attr('y', sunBarY * .01 + lineHeight * 3)
        .append('tspan').html('candle placed 1 meter away.')
        .attr('x',1).attr('y', sunBarY * .01 + lineHeight * 4)
    bounds.append('foreignObject')
        .attr('x',1)
        .attr('y', sunBarY - sunBarHeight/2)
        .attr('height', sunBarHeight).attr('width', dim.boundedWidth-2)
        .append('xhtml:div')
            .attr('class','sun-bar')
            .html(sunFiller)
            .style('height', `${sunBarHeight}px`)
    
    const defs = wrapper.append('defs')
    const strongSunGradientId = 'strong-sun-gradient'
    defs.append('linearGradient')
        .attr('id', strongSunGradientId)
        .selectAll('stop').data(stops)
        .join('stop')
        .attr('stop-color', d => d3.interpolateRgb(colorHot, colorLight)(d))
        .attr('offset', d => `${d * 100}%`)
    bounds.append('rect')
        .attr('class','bg-gradient')
        .attr('x',1).attr('y',1)
        .attr('height', dim.boundedHeight-2)
        .attr('width', dim.boundedWidth-2)
        .style('fill', `url(#${strongSunGradientId})`)

    const xSunScale = d3.scalePow()
        .exponent(.4)
        .domain([0, 100])
        .range([dim.boundedWidth-2, 1])
    const colorSunScale = d3.scalePow()
        .exponent(.4)
        .domain([0, 100])
        .range([colorLight, colorHot])

    const luxLevels = [.5, 1, 10, 100]
    const luxLevelsGroup = bounds.selectAll('.lux-level').data(luxLevels)
    luxLevelsGroup.join('text').attr('class', 'lux-level')
        .html(d => d == .5 ? '500 lux'
            : d == 1 ? '1 kilolux'
                : d == 10 ? '10 kilolux'
                    : '100 kilolux')
        .attr('x', d => d == .5 ? xSunScale(d) - 5 : xSunScale(d) + 5)
        .attr('y', d => d == .5 ? sunBarY * .01 : sunBarY + 30)
        .style('text-anchor', d => d == .5 ? 'end' : 'start')
        .style('dominant-baseline', d => d == .5 ? 'hanging' : 'middle')
        .append('tspan')
            .attr('x', d => d == .5 ? xSunScale(d) - 5 : xSunScale(d) + 5)
            .attr('y', d => d == .5 ? sunBarY * .01 + lineHeight : sunBarY + 30 + lineHeight)
            .html(d => d == .5 ? 'library, study'
                : d == 1 ? 'cloudy day'
                : d == 10 ? 'sunny day'
                : 'strong, direct sunlight')
    luxLevelsGroup.join('line').attr('class','lux-level-line')
        .attr('y1', d => d == .5 ? sunBarY - 10 : sunBarY + 10)
        .attr('y2', d => d == .5 ? sunBarY * .01 : sunBarY + 30 + lineHeight * 1.3)
        .style('transform', d => `translateX(${xSunScale(d)}px)`)
        .style('stroke', d => colorSunScale(d))

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

    const yFloorAccessor = d => d.floor_number
    const xCountAccessor = d => d.apartment_count
    const xSunAccessor = d => d.sun_spring_10am_klx

    const width = d3.min([d3.select('#wrapper3').node().clientWidth, 600])
    let dim = {
        width: width,
        height: width,
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 5
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

    bounds.append('rect')
        .attr('width', dim.boundedWidth).attr('height', dim.boundedHeight)
        .attr('class','bg-color')

    const defs = wrapper.append('defs')
    const sunGradientId = 'sun-gradient'
    defs.append('linearGradient')
        .attr('id', sunGradientId)
        .selectAll('stop').data(stops)
        .join('stop')
        .attr('stop-color', d => d3.interpolateRgb(colorWarm, colorLight)(d))
        .attr('offset', d => `${d * 100}%`)

    const yScale = d3.scaleBand()
        .domain(data.map(d => yFloorAccessor(d)))
        .range([dim.boundedHeight, 0])
        // .paddingOuter(.3)
    const xCountScale = d3.scaleLinear()
        .domain(d3.extent(data, xCountAccessor))
        .range([dim.boundedWidth-1, 1])
        .nice()
    const xSunScale = d3.scaleLinear()
        .domain(d3.extent(data, xSunAccessor))
        .range([dim.boundedWidth-1, 1])
        .nice()

    const sunBars = bounds.append('g')
        .selectAll('.sun-bar')
        .data(data).join('foreignObject')
        .attr('y', d => yScale(yFloorAccessor(d)))
        .attr('x', d => xSunScale(xSunAccessor(d)))
        .attr('width', d => dim.boundedWidth-2 - xSunScale(xSunAccessor(d)))
        .attr('height', yScale.bandwidth())
    sunBars.append('xhtml:div')
        .attr('class', 'sun-bar faint')
        .html(d=>yFloorAccessor(d)==6 ? sunFiller+' Units /////////////////////'
            : yFloorAccessor(d)==7 ? sunFiller+' rising /////////////'
            : yFloorAccessor(d)==8 ? sunFiller+' from this //////'
            : yFloorAccessor(d)==9 ? sunFiller+' low-floored //////'
            : yFloorAccessor(d)==10 ? sunFiller+' density ////'
            : yFloorAccessor(d)==11 ? sunFiller+' tend to ///'
            : yFloorAccessor(d)==12 ? sunFiller+' get ///////'
            : yFloorAccessor(d)==13 ? sunFiller+' more //'
            : yFloorAccessor(d)==14 ? sunFiller+' sun. /////'
            : sunFiller
        )
        .style('height', yScale.bandwidth() + 'px')
        .style('justify-content','end')

    bounds.append('rect')
        .attr('class','bg-gradient')
        .attr('x',1).attr('y',1)
        .attr('width', dim.boundedWidth-2).attr('height', dim.boundedHeight-2)
        .style('fill', `url(#${sunGradientId})`)

    const countBars = bounds.append('g')
        .selectAll('.count-bar')
        .data(data).join('foreignObject')
        .attr('x', d => xCountScale(xCountAccessor(d)))
        .attr('y', d => yScale(yFloorAccessor(d)))
        .attr('width', d => dim.boundedWidth - xCountScale(xCountAccessor(d)))
        .attr('height', yScale.bandwidth())

    const lowFloorCount = d3.filter(
        data, d => yFloorAccessor(d) >= 0 && yFloorAccessor(d) <= 4
    ).map(xCountAccessor)
    const countSum = d3.sum(data, xCountAccessor)
    const lowFloorPercent = d3.sum(lowFloorCount) / countSum
    const lowFloorPctString = d3.format('.0%')(lowFloorPercent)
    countBars.append('xhtml:div')
        .attr('class', 'count-bar')
        .html(d => yFloorAccessor(d) == 1
            ? `~~~ ${lowFloorPctString} of Swiss apartments are located `+countFiller
            : yFloorAccessor(d) == 0 ? '~~ on the 5 lowest floors, from ground level '+countFiller
            : yFloorAccessor(d) == 4 ? '~~~~~~~~~~ up to the 4th '+countFiller
            : countFiller
        )
        .style('height', yScale.bandwidth() + 'px')

    bounds.append('g')
        .selectAll('.floor-number')
        .data(yScale.domain())
        .join('text').attr('class', 'floor-number')
        .attr('x', dim.boundedWidth + dim.margin.right)
        .attr('y', d => yScale(d) + yScale.bandwidth() / 2)
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
        .attr('y',-11-lineHeight)
        .style('text-anchor','end')
        // .style('dominant-baseline','hanging')
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
    xCountAxis.append('text').html('Units per Floor')
        .attr('class','axis-label')
        .attr('y', 6).attr('x',dim.boundedWidth)
        .style('dominant-baseline','hanging')
        .style('text-anchor','end')
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
        height: 0,
        margin: {
            top: 0,
            right: 5,
            bottom: 130,
            left: 5
        }
    }
    dim.height = d3.min([width*.95,500])
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right
    dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom

    const yRoomAccessor = d => d.room
    const x25Accessor = d => d['25']
    const x75Accessor = d => d['75']
    const xMedianAccessor = d => d.median

    const yScale = d3.scaleBand()
        .domain(rooms)
        .range([0, dim.boundedHeight])
        .paddingOuter(.2)
    const sunMin = d3.min(data, d => d.min)
    const sunMax = d3.max(data, d => d['75'])
    const xSunScale = d3.scalePow()
        .exponent(.8)
        .domain([sunMin,sunMax])
        .range([dim.boundedWidth-1,1])
        .clamp(true)
        // .nice()
    const colorScale = d3.scaleLinear()
        .domain(d3.extent(data, xMedianAccessor))
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
        .data(data).join('g')
    bars.append('foreignObject')
        .attr('x', d => xSunScale(x75Accessor(d)))
        .attr('y', d => yScale(yRoomAccessor(d)))
        .attr('height', yScale.bandwidth())
        .attr('width', d => xSunScale(x25Accessor(d)) - xSunScale(x75Accessor(d)))
        .append('xhtml:div')
            .attr('class', 'sun-bar')
            .style('height', yScale.bandwidth() + 'px')
            .style('color', d => colorScale(xMedianAccessor(d)))
            .html(sunFiller)
    bars.append('text')
        .attr('class', 'room-text')
        .attr('x', d => yRoomAccessor(d) == 'Balcony' ? xSunScale(x75Accessor(d)) : xSunScale(x75Accessor(d)) - 4)
        .attr('y', d => yRoomAccessor(d) == 'Balcony' ? yScale(yRoomAccessor(d))+yScale.bandwidth()/2-lineHeight*.6 : yScale(yRoomAccessor(d)) + yScale.bandwidth() / 2)
        .style('text-anchor', d => yRoomAccessor(d) == 'Balcony' ? 'start' : 'end')
        .style('dominant-baseline', d => yRoomAccessor(d) == 'Balcony' ? 'auto' : 'middle')
        .html(d => yRoomAccessor(d))

    bounds.append('foreignObject')
        .attr('width', dim.boundedWidth)
        .attr('height', dim.margin.bottom)
        .attr('y', dim.boundedHeight)
        .append('xhtml:div')
        .html('The strongest correlation with illuminance is sky view. The average balcony with a wide view receives 10,000 times more light per square meter than the average bathroom. The amount of windows and skylights, though impressive on paper, only matter insofar as they allow maximum sky view.')
        .style('height', `${dim.margin.bottom}px`)

    const sunTicks = d3.range(0,xSunScale.domain()[1],1)
    const xAxis = bounds.append('g').attr('class','sun-axis axis')
        .style('transform',`translateY(${dim.boundedHeight+dim.margin.bottom*.75}px)`)
    const xAxisTicks = xAxis.selectAll('.tick')
        .data(sunTicks).join('g').attr('class','tick')
    xAxisTicks.append('text').html(d=>d)
        .attr('x',d=>xSunScale(d))
        .attr('y',-8)
    xAxisTicks.append('line')
        .attr('y1',0).attr('y2',-5)
        .style('transform',d=>`translateX(${xSunScale(d)}px)`)
    xAxis.append('line').attr('x1',1).attr('x2',dim.boundedWidth-1)
    xAxis.append('text').html('Sunlight Interquartile Range (Kilolux)')
        .attr('class','axis-label')
        .attr('y',6)
        .style('dominant-baseline','hanging')
}

const seeMoreButton = d3.select('#see-more')
    .on('click', clicked)
function clicked(event,d) {
    const button = d3.select(this)
    const axes = d3.selectAll('.axis')
    if (axes.style('opacity')==0) {
        axes.transition().duration(90).style('opacity',1)
        button.html('hide axes')
    } 
    else {
        axes.transition().duration(90).style('opacity',0)
        button.html('show axes')
    } 
}
