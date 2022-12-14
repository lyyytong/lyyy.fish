drawRidgelineChart()
async function drawRidgelineChart() {
    const dataset = await d3.csv('../data/spider-discoveries/top_genera.csv', d3.autoType)
    const genusNames = await d3.csv('../data/spider-discoveries/genus-names.csv')

    const topGenera = {
        world: ['Theridion', 'Araneus', 'Pardosa', 'Clubiona', 'Zelotes', 'Tetragnatha', 'Pholcus', 'Xysticus', 'Oxyopes', 'Dysdera'],
        africa: ['Zelotes', 'Heliophanus', 'Hogna', 'Theridion', 'Araneus', 'Oxyopes', 'Dysdera', 'Olios', 'Tetragnatha', 'Pardosa'],
        asia: ['Clubiona', 'Pardosa', 'Draconarius', 'Araneus', 'Pholcus', 'Theridion', 'Mallinella', 'Coelotes', 'Zelotes', 'Oxyopes'],
        oceania: ['Opopaea', 'Maratus', 'Araneus', 'Theridion', 'Arbanitis', 'Lampona', 'Habronestes', 'Tetragnatha', 'Tamopsis', 'Storena'],
        europe: ['Dysdera', 'Pardosa', 'Troglohyphantes', 'Zelotes', 'Zodarion', 'Harpactea', 'Clubiona', 'Xysticus', 'Gnaphosa', 'Alopecosa'],
        nAmerica: ['Theridion', 'Cicurina', 'Pardosa', 'Araneus', 'Habronattus', 'Costarina', 'Tetragnatha', 'Walckenaeria', 'Modisimus', 'Xysticus'],
        sAmerica: ['Alpaida', 'Mangora', 'Chrysometa', 'Dubiaranea', 'Theridion', 'Micrathena', 'Mesabolivar', 'Scytodes', 'Tmarus', 'Orchestina'],
    }
    const minYear = d3.min(dataset,d=>d.year)-1
    const maxYear = d3.max(dataset,d=>d.year)+1
    const years = d3.range(minYear,maxYear+1)

    // CONTINENT OPTIONS
    const continents = Object.keys(topGenera)
    const continentOptions = d3.select('#continents')
        .selectAll('.continent').data(continents)
        .join('div').attr('id', d => d).attr('class', 'continent')
        .html(d => d == 'nAmerica' ? 'North America'
            : d == 'sAmerica' ? 'South America'
                : d.charAt(0).toUpperCase() + d.slice(1,))
    let contInit = 'world'
    continentOptions.classed('highlight-bg', d => d == contInit)

    // GENUS OPTIONS & DATA
    let genera = topGenera[contInit]
    let results = getGeneraData(contInit, genera)
    genera = results[0]
    let data = results[1]
    const genusOptions = d3.select('#continent-genera')
        .selectAll('.genus-option').data(genera)
        .join('div').attr('class','genus-option')
    let genusNumbers = genusOptions.append('text')
        .attr('class','genus-number').html((d,i)=>i+1)
    let genusImages = genusOptions.append('div')
        .attr('class', 'genus-image')
        .style('background-image',d=>`url('../images/spider-discoveries/${d}.jpeg')`)
        .style('opacity',0)
        .transition(getTransition(400))
        .style('opacity',1)
    let genusOptionNames = genusOptions.append('p')
        .attr('class','genus-name')
        .html(d => d=='Troglohyphantes' ? 'Troglohy-<br>phantes'
            : d=='Walckenaeria' ? 'Walcken-<br>aeria'
            : d)
    let genusData

    // DIMENSIONS AND SVG
    let dim = {
        width: d3.min([window.innerWidth,450]),
        height: d3.max([window.innerHeight*.6,400]),
        margin: {
            top: 0,
            right: 20,
            bottom: 0,
            left: 20
        }
    }
    dim.boundedW = dim.width - dim.margin.left - dim.margin.right
    dim.boundedH = dim.height - dim.margin.top - dim.margin.bottom
    dim.leftBoundW = dim.boundedW * .41
    dim.rightBoundW = dim.boundedW * .41
    dim.middleBoundW = dim.boundedW * .18
    dim.genusGraphW = dim.leftBoundW
    dim.otherGeneraW = dim.leftBoundW - dim.genusGraphW
    dim.bottomBoundH = d3.min([dim.height*.6,250])

    const wrapper = d3.select('#discoveries')
        .append('svg').attr('width', dim.width)
        .attr('height', dim.height)
    const bounds = wrapper.append('g')
        .style('transform',`translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`)
    const leftBound = wrapper.append('g')
        .style('transform', `translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`)
    const rightBound = wrapper.append('g')
        .style('transform', `translate(
            ${dim.margin.left + dim.leftBoundW + dim.middleBoundW}px,
            ${dim.margin.top}px
        )`)
    const middleBound = wrapper.append('g')
        .style('transform',`translate(
            ${dim.margin.left+dim.leftBoundW}px,
            ${dim.margin.top}px
        )`)
    const bottomBound = bounds.append('g')
        .style('transform',`translateY(${dim.boundedH}px)`)
    
    const generaAxes = bounds.append('g').attr('class','invisible')
    const generaAxisLeft = generaAxes.append('g')
    const generaAxisRight = generaAxes.append('g')
        .style('transform',`translateX(
            ${dim.leftBoundW+dim.middleBoundW}px
        )`)

    const bottomGeneraAxis = bottomBound.append('g')
    const yearAxis = middleBound.append('g').attr('class','year-axis invisible')
    
    const genusArea = wrapper.append('g')
        .style('transform', `translate(
            ${dim.margin.left+dim.otherGeneraW}px,
            ${dim.margin.top}px
        )`)
        .append('path')
    const genusCumsum = wrapper.append('g')
        .style('transform', `translate(
            ${dim.margin.left + dim.leftBoundW + dim.middleBoundW}px,
            ${dim.margin.top}px
        )`)
        .append('path')

    // GRAPH GRADIENTS
    const defs = wrapper.append('defs')
    const areaGradientId = 'area-gradient'
    const cumsumGradientId = 'cumsum-gradient'
    getLinearGradient(defs, areaGradientId, '#bad1af', '#6f7863')
    getLinearGradient(defs, cumsumGradientId, '#6f7863', '#a9aaa0')

    // SCALES
    const yearScale = d3.scaleLinear()
        .domain([minYear,maxYear])
        .range([0, dim.boundedH])
    let genusScaleLeft = d3.scaleBand()
    let genusScaleRight = d3.scaleBand()
    let genusBandWL
    let genusBandWR

    let maxCount
    let areaScale = d3.scaleLinear()
    let genusAreaScale = d3.scaleLinear()

    let maxCumsum
    let cumsumAreaScale = d3.scaleLinear()
    let genusCumsumScale = d3.scaleLinear()

    let bottomCumsumScale = d3.scaleLinear()

    let areaGen = d3.area().y(d => yearScale(d.year)).curve(d3.curveBasis)
    let cumsumAreaGen = d3.area().y(d => yearScale(d.year)).curve(d3.curveBasis)

    // GRAPHS
    let areaGroup
    let areaGrid
    let areaPaths
    let cumsumGroup
    let cumsumGrid
    let cumsumPaths
    let bottomGeneraTicks
    let bottomCumsumLines
    let bottomGrid
    let bottomHorizontalGrid
    drawGraphs(genera, data)
    
    // AXES
    generaAxisLeft.selectAll('.genus-tick').data(genera)
        .join('text').attr('class','genus-tick')
        .attr('x',d=>genusScaleLeft(d)+genusBandWL)
        .attr('y', -5)
        .html((d,i)=>i+1)
    generaAxisRight.selectAll('.genus-tick').data(genera)
        .join('text').attr('class','genus-tick')
        .attr('x',d=>genusScaleRight(d))
        .attr('y', -5)
        .html((d,i)=>i+1)
    
    const yearTicks = d3.range(1760,2020,10)
    yearTicks.push(2019)
    yearAxis.selectAll('.year-tick').data(yearTicks)
        .join('text').attr('class','year-tick')
        .attr('x', dim.middleBoundW/2)
        .attr('y',d=>yearScale(d))
        .html(d=>d)
    bottomBound.append('text').attr('class','bottom-genera-axis')
        .attr('x',genusBandWL)
        .attr('y',dim.bottomBoundH-1)
        .html('Species per genus in 2019')

    // INTERACTIONS
    const filterStickyTopMargin = 8
    const filter = d3.select('#filter')
    const filterH = filter.node().getBoundingClientRect().height
    document.querySelector('#filter-bg').style.height = filterH+'px'
    const filterTopY = document.querySelector('#filter-bg').getBoundingClientRect().top - filterStickyTopMargin
    document.querySelector('#discoveries').style.marginBottom = dim.bottomBoundH + 'px'
    const midLineY = d3.min([
        wrapper.node().getBoundingClientRect().y + dim.margin.top,
        window.innerHeight/2
    ])
    const midLine = d3.select('#midline').style('top', midLineY + 'px')

    const legend = midLine.select('.legend')
    const yearDisplay = midLine.select('.year')
    const countDisplay = midLine.select('.count')
    const cumsumDisplay = midLine.select('.cumsum')
    const scrollCta = midLine.select('.cta')
    const genusProfile = d3.select('#genus-profile')
    const genusCta = filter.select('.cta')
    const backCta = filter.select('.back')
    const nav = d3.select('nav')
    let genusView = false
    
    window.addEventListener('scroll', () => {
        const wrapperTopY = wrapper.node().getBoundingClientRect().y
        const wrapperBotY = wrapper.node().getBoundingClientRect().bottom
        const graphBotY = wrapperBotY+dim.bottomBoundH

        // UPDATE STICKY ELEMENTS
        filter.classed('filter-sticky', window.scrollY >= filterTopY) 
        filter.select('.desc').classed('invisible',wrapperTopY <= window.scrollY - filterH + 90)
        midLine.classed('midline-sticky', (wrapperTopY <= midLineY) && (wrapperBotY > midLineY))
        midLine.classed('midline-static', wrapperBotY <= midLineY)
        
        // UPDATE OPACITY & HEIGHT
        legend.classed('faint', midLineY-wrapperTopY>2)
        scrollCta.classed('invisible', midLineY-wrapperTopY>2)
        yearDisplay.classed('highlight-bg',midLineY-wrapperTopY>2)
        generaAxes.classed('invisible',midLineY-wrapperTopY<30 || genusView==true)
        yearAxis.classed('invisible',midLineY-wrapperTopY<30)
        if (graphBotY<=midLineY) {
            genusProfile.classed('no-height', true)
            nav.classed('faint',false)
        } 
        if (genusView==true&&graphBotY>midLineY) {
            genusProfile.classed('no-height', false)
            nav.classed('faint',true)
        } 

        // UPDATE COUNT & CUMSUM DISPLAY
        if (wrapperTopY <= midLineY && wrapperBotY >= midLineY) {
            let year = Math.round(
                yearScale.invert(midLineY - wrapperTopY - dim.margin.top)
            )
            year = d3.median([1757, year, 2019])
            yearDisplay.html(year)
            
            let count
            let cumsum
            if (genusView) {
                count = genusData.filter(d=>d.year==year)[0].count
                cumsum = d3.max(genusData.filter(d=>d.year<=year),d=>d.cumsum)
            } else {
                count = d3.sum(
                    Object.values(data)
                        .map(d => d.filter(d => d.year == year).map(d => d.count))
                )
                cumsum = d3.sum(
                    Object.values(data)
                        .map(d => d3.sum(
                            d.filter(d => d.year <= year).map(d => d.cumsum)
                        ))
                )
            }
            countDisplay.html(count)
            cumsumDisplay.html(d3.format(',')(cumsum))
        }
    })
    continentOptions.on('click', updateContinent)
    function updateContinent() {
        const clicked = d3.select(this)
        if (!clicked.classed('highlight-bg')) {
            contInit = clicked.datum()
            continentOptions.classed('highlight-bg', d => d == contInit)

            genera = topGenera[contInit]
            results = getGeneraData(contInit, genera)
            genera = results[0]
            data = results[1]

            genusOptions.data(genera).join('div')
            genusOptionNames = genusOptions.select('.genus-name')
                .html(d => d=='Troglohyphantes' ? 'Troglohy-<br>phantes'
                    : d=='Walckenaeria' ? 'Walcken-<br>aeria'
                    : d)
            genusImages = genusOptions.select('.genus-image')
                .style('background-image',
                        d =>`url('../images/spider-discoveries/${d}.jpeg')`)
                .style('opacity',0)
                .transition(getTransition(400))
                .style('opacity',1)
            filter.select('.continent')
                .html(contInit == 'nAmerica' ? 'North America'
                    : contInit == 'sAmerica' ? 'South America'
                        : contInit == 'world' ? 'the world'
                        : contInit.charAt(0).toUpperCase() + contInit.slice(1,))
            drawContinentView()
        }
    }

    genusOptions.on('click', showGenus)
    function showGenus() {
        const clicked = d3.select(this)
        const genus = clicked.datum()
        genusData = data[genus]

        if (!clicked.classed('highlight-bg')) {
            genusView = true
            const yearDiscovery = genusData.filter(d => d.cumsum > 0)[0].year
            const commonName = genusNames.filter(d => d.genus == genus)[0].commonName
            const totalSpecies = d3.max(genusData.map(d => d.cumsum))

            genusCta.classed('invisible',true)
            backCta.classed('invisible',false)
            genusOptions.classed('highlight-bg', d => d == genus)
            genusOptions.classed('x-mark',d=>d==genus)
            genusNumbers = genusOptions.select('.genus-number')
                .classed('invisible',d=>d==genus)
            generaAxes.classed('invisible',true)
            genusProfile.select('img')
                .attr('src',`../images/spider-discoveries/${genus}.jpeg`)
            genusProfile.classed('no-height',false)
            genusProfile.select('.name').html(genus)
            genusProfile.select('.discovery-year').html(yearDiscovery)
            genusProfile.select('.common-name').html(commonName)
            genusProfile.select('.num-species').html(totalSpecies)
            midLine.selectAll('.continent').html(genus)
            yearDisplay.html('Year')
            countDisplay.html('')
            cumsumDisplay.html('')
            bottomGeneraTicks.classed('bottom-tick-bold',d=>d==genus)
            bottomGeneraTicks.classed('faint-small-text',d=>d!=genus)
            bottomCumsumLines.classed('bottom-cumsum-faint',d=>d!=genus)
            bottomGrid.classed('invisible',true)
            bottomHorizontalGrid.classed('invisible',false)
            nav.classed('faint',true)
            updateGenusGraph('draw', genusData)
        } else {
            drawContinentView()
        }
    }
    function drawContinentView() {
        genusView = false
        genusCta.classed('invisible',false)
        backCta.classed('invisible',true)
        genusOptions.classed('highlight-bg', false)
        genusOptions.classed('x-mark',false)
        genusNumbers.classed('invisible',false)
        genusProfile.classed('no-height',true)
        midLine.selectAll('.continent')
            .html(contInit == 'nAmerica' ? 'North America'
                : contInit == 'sAmerica' ? 'South America'
                    : contInit.charAt(0).toUpperCase() + contInit.slice(1,))
        yearDisplay.html('Year').classed('highlight-bg',false)
        countDisplay.html('')
        cumsumDisplay.html('')
        nav.classed('faint',false)
        updateGenusGraph('clear')
        drawGraphs(genera, data)
    }

    // DATA & GRAPHING FUNCTIONS
    function getGeneraData(contInit, genera) {
        let rawData
        if (contInit == 'world') rawData = dataset.filter(d => genera.includes(d.genus))
        else rawData = dataset.filter(d => d[contInit] > 0 && genera.includes(d.genus))

        rawData = d3.rollups(rawData, v => v.length, d => d.genus, d => d.year)
        const sorted = rawData.map(d => [d[0], d3.sum(d[1], d => d[1])])
            .sort((a, b) => d3.descending(a[1], b[1]))
            .map(d => d[0])
        let newData = {}
        rawData.forEach(genusArray => {
            const genus = genusArray[0]
            const yearArray = genusArray[1]
            const yearsInArray = yearArray.map(d => d[0])

            yearArray.sort((a, b) => d3.ascending(a[0], b[0]))
            newData[genus] = []
            years.forEach(year => {
                const cumsum = d3.sum(
                    yearArray.filter(d => d[0] <= year),
                    d => d[1]
                )
                if (yearsInArray.includes(year)) {
                    const count = yearArray.filter(d => d[0] == year)[0][1]
                    newData[genus].push({ year: year, count, cumsum })
                } else {
                    newData[genus].push({ year: year, count: 0, cumsum })
                }
            })
        })
        return [sorted, newData]
    }
    function drawGraphs(genera, data) {
        // SCALES
        genusScaleLeft.domain(genera).range([0, dim.leftBoundW])
        genusBandWL = genusScaleLeft.bandwidth()

        genusScaleRight.domain(genera).range([dim.rightBoundW, 0])
        genusBandWR = genusScaleRight.bandwidth()

        maxCount = d3.max(
            Object.values(data).map(d => d3.max(d, d => d.count))
        )
        areaScale.domain([0, maxCount]).range([genusBandWL, -genusBandWL * 4])

        maxCumsum = d3.max(
            Object.values(data).map(d => d3.max(d, d => d.cumsum))
        )
        cumsumAreaScale.domain([0, maxCumsum]).range([0, genusBandWR * 5])

        areaGen.x0(genusBandWL)
        cumsumAreaGen.x0(0).curve(d3.curveBasis)

        // GRAPHS
        if (areaGroup) areaGroup.remove()
        areaGroup = leftBound
            .selectAll('.genus-group').data(genera)
            .join('g')
            .attr('class', `genus-group`)
            .style('transform', genus => `translateX(
                ${genusScaleLeft(genus)}px
            )`)
        areaGrid = areaGroup.append('line').attr('class','grid-line')
            .attr('y1',0).attr('y2',dim.boundedH)
            .style('transform',`translateX(${genusBandWL}px)`)
        areaPaths = areaGroup.append('path').attr('class', 'genus-path')
        areaPaths.attr('d', genus => {
            areaGen.x1(genusBandWL)
            return areaGen(data[genus])
        })
            .transition(getTransition())
            .attr('d', genus => {
                areaGen.x1(d => areaScale(d.count))
                return areaGen(data[genus])
            })
            .style('fill', `url(#${areaGradientId})`)

        if (cumsumGroup) cumsumGroup.remove()
        cumsumGroup = rightBound
            .selectAll('.genus-group').data(genera)
            .join('g').attr('class', `genus-group`)
            .style('transform', genus => `translateX(
                ${genusScaleRight(genus)}px
            )`)
        cumsumGrid = cumsumGroup.append('line').attr('class','grid-line')
            .attr('y1',0).attr('y2',dim.boundedH)
        cumsumPaths = cumsumGroup.append('path').attr('class', 'genus-path')
        cumsumPaths.attr('d', genus => {
            cumsumAreaGen.x1(0)
            return cumsumAreaGen(data[genus])
        })
            .transition(getTransition())
            .attr('d', genus => {
                cumsumAreaGen.x1(d => cumsumAreaScale(d.cumsum))
                return cumsumAreaGen(data[genus])
            })
            .style('fill', `url(#${cumsumGradientId})`)

        // AXES
        bottomCumsumScale
            .domain([0,maxCumsum])
            .range([dim.bottomBoundH,50])
        bottomGeneraTicks = bottomGeneraAxis
            .selectAll('.bottom-genus-tick').data(genera)
            .join('text').attr('class','bottom-genus-tick')
            .attr('x',d=>genusScaleLeft(d)+genusBandWL-1)
            .attr('y',(d,i)=>bottomCumsumScale(data[d].slice(-1)[0].cumsum))
            .html((d,i)=>i+1)
        const curve = d3.line()
        bottomGrid = bottomGeneraAxis
            .selectAll('.grid-line').data(genera)
            .join('path').attr('class','grid-line')
            .attr('d',(d,i)=>{
                const leftX = genusScaleLeft(d)+genusBandWL
                const midY = bottomCumsumScale(data[d].slice(-1)[0].cumsum)
                const rightX = dim.leftBoundW + dim.middleBoundW + genusScaleRight(d)
                const path = [
                    [leftX,0],
                    [leftX,midY],
                    [rightX,midY],
                    [rightX,0]
                ]
                return curve(path)
            })
        bottomHorizontalGrid = bottomGeneraAxis
            .selectAll('.horizontal-grid-line')
            .data(genera).join('line').attr('class','horizontal-grid-line invisible')
            .attr('x1',d=>genusScaleLeft(d)+genusBandWL)
            .attr('x2',d=>dim.leftBoundW + dim.middleBoundW + genusScaleRight(d))
            .style('transform',d=>`translateY(
                ${bottomCumsumScale(data[d].slice(-1)[0].cumsum)}px
            )`)
        bottomCumsumLines = bottomBound
            .selectAll('.bottom-cumsum-line').data(genera)
            .join('line').attr('class','bottom-cumsum-line')
            .attr('y1',dim.bottomBoundH)
            .attr('y2',d=>bottomCumsumScale(data[d].slice(-1)[0].cumsum))
            .style('transform',d=>`translateX(${
                dim.leftBoundW+dim.middleBoundW+genusScaleRight(d)
            }px)`)

    }
    function updateGenusGraph(type, genusData = null) {
        if (type == 'draw') {
            const continentMaxCount = d3.max([maxCount,40])
            genusAreaScale.domain([0, continentMaxCount])
                .range([dim.genusGraphW, -dim.genusGraphW*.3])
            areaGen.x0(dim.genusGraphW)

            const continentMaxCumsum = d3.max([maxCumsum,150])
            genusCumsumScale.domain([0, continentMaxCumsum])
                .range([0, dim.genusGraphW*1.1])
            cumsumAreaGen.x0(0)

            genusArea.classed('invisible', false)
                .attr('d', () => {
                    areaGen.x1(dim.genusGraphW)
                    return areaGen(genusData)
                })
                .transition(getTransition())
                .attr('d', () => {
                    areaGen.x1(d => genusAreaScale(d.count))
                    return areaGen(genusData)
                })
                .style('fill', `url(#${areaGradientId})`)
            areaPaths.transition().duration(100)
                .style('opacity',(d,i)=>i*.02)
            areaGrid.filter((d,i)=>i<9).classed('invisible',true)

            genusCumsum.classed('invisible', false)
                .attr('d', () => {
                    cumsumAreaGen.x1(0)
                    return cumsumAreaGen(genusData)
                })
                .transition(getTransition())
                .attr('d', () => {
                    cumsumAreaGen.x1(d => genusCumsumScale(d.cumsum))
                    return cumsumAreaGen(genusData)
                })
                .style('fill', `url(#${cumsumGradientId})`)
            cumsumPaths.transition().duration(100)
                .style('opacity',(d,i)=>i*.02)
            cumsumGrid.filter((d,i)=>i<9).classed('invisible', true)
        } else if (type == 'clear') {
            areaGen.x0(dim.genusGraphW)
            genusArea.transition(getTransition())
                .attr('d', () => {
                    areaGen.x1(dim.genusGraphW)
                    return areaGen(data[Object.keys(data)[0]])
                })
            areaGrid.classed('invisible',false)
            cumsumAreaGen.x0(0)
            genusCumsum.transition(getTransition())
                .attr('d', () => {
                    cumsumAreaGen.x1(0)
                    return cumsumAreaGen(data[Object.keys(data)[0]])
                })
            cumsumGrid.classed('invisible',false)
        } else { }
    }
}

// UTIL FUNCTIONS
function getLinearGradient(defs, id, colorLeft, colorRight) {
    const numGradientStops = 5
    const stops = d3.range(numGradientStops)
        .map(d => d / (numGradientStops - 1))
    defs.append('linearGradient')
        .attr('id', id)
        .selectAll('stop').data(stops)
        .join('stop')
        .attr('stop-color', d => d3.interpolateRgb(colorLeft, colorRight)(d))
        .attr('offset', d => `${d * 100}%`)
}
function getTransition(time=300) {
    return d3.transition().duration(time).ease(d3.easeCubicOut)
}