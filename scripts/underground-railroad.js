const lineH = +getComputedStyle(document.querySelector('body')).lineHeight.slice(0, -2)
const margin = 8

window.addEventListener('load', () => {
    const img = d3.select('#photo')
    const imgW = img.style('width')
    const imgH = img.style('height')
    d3.select('#photo .overlay').style('width', imgW).style('height', imgH)
})

drawSimulation()
async function drawSimulation() {
    const data = await d3.csv('../data/underground-railroad/stills_freedom_seekers.csv', d3.autoType)
    const dataset = [
        ...data.filter(d=>d.year).sort((a,b)=>d3.ascending(a.year,b.year)),
        ...data.filter(d=>!d.year)
    ] // push data with missing year to last

    // DIMENSIONS & POSITIONING
    let dim = {
        width: d3.min([window.innerWidth - margin * 2, 600]),
        height: d3.max([window.innerHeight * .9, 600]),
        margin: {
            top: 10,
            right: 15,
        }
    }
    const genderLabelY = 25 // y coordinate of bar chart labels
    dim.margin.bottom = lineH * 5.5 + genderLabelY
    dim.margin.left = d3.min([dim.width * .22, 90])
    dim.boundedW = dim.width - dim.margin.left - dim.margin.right
    dim.boundedH = dim.height - dim.margin.top - dim.margin.bottom
    dim.enslaverScatterH = dim.boundedH * .5
    dim.genderChartH = dim.boundedH * .6

    // start & end positions of circles
    const startX = dim.boundedW*.65
    const startY = 0
    const endY = dim.boundedH

    const wrapper = d3.select('#simulation')
        .append('svg')
        .attr('height', dim.height)
        .attr('width', dim.width)
    const bounds = wrapper.append('g')
        .style('transform', `translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`)

    // const defs = wrapper.append('defs')

    // const blurID = 'bigObjectBlur' // blur effect for circles
    // const blurFilter = defs.append('filter').attr('id', blurID)
    // blurFilter.append('feGaussianBlur')
    //     .attr('stdDeviation', 2).attr('in', 'SourceGraphic')

    // const smallBlurID = 'smallObjectBlur' // blur effect for legend icons
    // const smallBlurFilter = defs.append('filter').attr('id', smallBlurID)
    // smallBlurFilter.append('feGaussianBlur')
    //     .attr('stdDeviation', .8).attr('in', 'SourceGraphic')

    // const glowID = 'smallGlow' // glow effect for enslaver triangles
    // const glowFilter = defs.append('filter').attr('id', glowID)
    // glowFilter.append('feGaussianBlur')
    //     .attr('stdDeviation', 2).attr('result', 'coloredBlur')
    // const glowFeMerge = glowFilter.append('feMerge')
    // glowFeMerge.append('feMergeNode').attr('in', 'coloredBlur')
    // glowFeMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // ANIMATION TIME
    let travelDuration = 6000 // time for circle to move from top to bottom of svg
    let addSeekersDelay = Math.round(travelDuration / 10) // add new circle after delay
    let transitionTime = Math.round(travelDuration / 110) // for circle size & opacity animation
    let speedChange

    // SCALES
    const genders = ['Unknown', 'F', 'M']
    const genderXScale = d3.scaleBand()
        .domain(genders)
        .range([0, dim.boundedW])
        .paddingInner(.15)
    const genderBand = genderXScale.bandwidth()

    const progressXScale = d3.scaleLinear()
        .domain([.3, .6])
        .range([0, 1])
        .clamp(true)

    const maxCount = d3.max(
        d3.rollups(dataset, v => v.length, d => d.gender),
        d => d[1]
    )
    const genderYScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([dim.genderChartH, 0])

    const labels = ['isAdult', 'isChild', 'isLiterate', 'isArmed']
    const labelYScale = d3.scaleBand()
        .domain(labels)
        .range([genderLabelY, genderLabelY + lineH * labels.length])
    const labelBand = labelYScale.bandwidth()

    const adultR = d3.min([genderBand * .5, 50])
    const childR = adultR * .3

    // ANIMATED STATS
    const enslavers = [...new Set(dataset.filter(d => d.enslaver).map(d => d.enslaver))]
    const enslaversGroup = bounds.append('g')
        // .style('filter', `url(#${glowID})`)
    
    const seekersGroup = bounds.append('g')
    
    const genderBars = bounds.append('g')
        .style('transform', `translateY(${dim.boundedH - dim.genderChartH}px)`)
        .selectAll('.gender-data').data(genders)
        .join('rect').attr('class', `bar`)
        .attr('x', d => genderXScale(d))
        .attr('width', genderBand)
        // .style('filter', `url(#${blurID})`)

    const counts = bounds.append('g')
        .style('transform', `translateY(${dim.boundedH}px)`)
    counts.append('rect').classed('counts-bg',true) // hide circles after they reach bottom graph
        .attr('x',-dim.margin.left).attr('width',dim.width).attr('height',dim.margin.bottom)

    const getGenderString = (d, a, b, c) => d == 'M' ? a : d == 'F' ? b : c
    const genderData = counts.append('g')
        .selectAll('.gender-label').data(genders)
        .join('g').attr('class', 'gender-data')
    const genderCounts = genderData.append('text')
        .attr('class', `count`)
        .attr('x', d => genderXScale(d) + genderBand - 1)
        .attr('y', genderLabelY - 5)
        .style('dominant-baseline','auto')
    
    const otherData = counts.append('g')
        .selectAll('g').data(labels).join('g')
    genders.forEach(gender => {
        otherData.append('text').attr('class', d => `count ${getGenderString(gender, 'male', 'female', 'unknown-gender')} ${d}`)
            .attr('x', genderXScale(gender) + genderBand).attr('y', d => labelYScale(d) + labelBand)
    })
    const labelsX = -12
    const enslaversData = counts.append('g')
        .style('transform', `translateY(${dim.margin.bottom - lineH}px)`)
    const enslaversCount = enslaversData.append('text').attr('class', 'count')
        .attr('x', dim.boundedW).attr('y', lineH / 2 + 1)
    const enslaversName = enslaversData.append('text').attr('class', 'enslaver-name')
        .attr('x', dim.boundedW / 2).attr('y', lineH / 2 + 1)
    
    // LABELS
    const labelsGroup = bounds.append('g')
        .style('transform', `translateY(${dim.boundedH}px)`)
    const genderLabels = labelsGroup.selectAll('.gender-label').data(genders)
        .join('g').attr('class', `gender-label`)
    genderLabels.append('text')
        .attr('x', d => genderXScale(d) + 1)
        .attr('y', genderLabelY - 5)
        .html(d => getGenderString(d, 'Men', 'Women', 'Unknown'))
    genderLabels.append('line')
        .attr('class', `data-line`)
        .attr('x2', genderBand)
        .style('transform', d => `translate(
            ${genderXScale(d)}px,
            ${genderLabelY}px
        )`)
    const otherDataLabels = labelsGroup.append('g')
        .selectAll('g').data(labels).join('g')
    otherDataLabels.append('text').classed('label', true)
        .attr('x', labelsX - 8)
        .attr('y', d => labelYScale(d) + labelBand)
        .html(d => d == 'isChild' ? 'Children' : d == 'isAdult' ? 'Adults' : d.slice(2))
    otherDataLabels.append('circle').attr('class', d => d == 'isAdult' ? 'seeker stroked'
        : d == 'isChild' ? 'seeker'
            : d == 'isLiterate' ? 'empty literate'
                : d == 'isArmed' ? 'empty armed'
                    : ''
    )
        .attr('cx', labelsX).attr('cy', d => labelYScale(d) + labelBand)
        .attr('r', d => d == 'isAdult' ? 5
            : d == 'isChild' ? 2.5
                : 4.5
        )
        // .style('filter', d => d != 'isChild' ? `url(#${smallBlurID})` : '')
    const enslaversLabels = labelsGroup.append('g')
        .style('transform', `translateY(${dim.margin.bottom - lineH}px)`)
    enslaversLabels.append('text').classed('label', true)
        .attr('x', labelsX - 8).attr('y', lineH / 2 + 1)
        .html('Enslavers')
    enslaversLabels.append('text').classed('enslaver-icon', true)
        .attr('x', labelsX).attr('y', lineH / 2 + 1)
        .html('▲')
        // .style('filter', `url(#${glowID})`)
    enslaversLabels.append('rect').attr('class', 'enslavers-bg')
        .attr('width', dim.boundedW + 5).attr('height', lineH)
        // .style('filter', `url(#${glowID})`)
    
    // FULL STATS
    const fullGenderData = d3.rollup(dataset, v => v.length, d => d.gender)
    const fullDataGroup = bounds.append('g').style('opacity',0)
    const fullGenderBars = fullDataGroup.append('g')
        .style('transform', `translateY(${dim.boundedH - dim.genderChartH}px)`)
        .selectAll('.gender-data').data(genders)
        .join('rect').attr('class', `bar`)
        .attr('x', d => genderXScale(d))
        .attr('width', genderBand)
        // .style('filter', `url(#${blurID})`)
    const fullCounts = fullDataGroup.append('g')
        .style('transform', `translateY(${dim.boundedH}px)`)
    fullCounts.selectAll('.gender-label').data(genders)
        .join('text').attr('class', `count`)
        .attr('x', d => genderXScale(d) + genderBand - 1)
        .attr('y', genderLabelY - 5)
        .html(d=>fullGenderData.get(d))
        .style('dominant-baseline','auto')
    const fullOtherData = fullCounts.append('g')
        .selectAll('g').data(labels).join('g')
    labels.forEach(label => {
        const fullData = d3.rollup(
            dataset.filter(d => label == 'isAdult' ? !d.isChild : d[label]),
            v => v.length,
            d => d.gender
        )
        genders.forEach(gender => {
            fullOtherData.filter(d=>d==label).append('text')
                .attr('class', 'count')
                .attr('x', genderXScale(gender) + genderBand)
                .attr('y', d => labelYScale(d) + labelBand)
                .html(fullData.get(gender))
        })
    })
    fullCounts.append('text')
        .style('transform', `translateY(${dim.margin.bottom - lineH}px)`)
        .attr('class', 'count')
        .attr('x', dim.boundedW).attr('y', lineH / 2 + 1)
        .html(enslavers.length)

    // YEARS
    const yearData = [...new Set(dataset.filter(d=>d.year).map(d=>d.year))]
    let currentYear = d3.min(yearData)
    const yearsGroup = d3.select('#years')
        .style('top',dim.margin.top+'px')
    const years = yearsGroup.selectAll('.year').data(yearData)
        .join('div').html(d=>d).classed('year',true)
    years.filter(d=>d==currentYear).classed('active-year',true)

    // ANIMATION
    let seekers = []
    let arrivedBarsH = { M: 0, F: 0, Unknown: 0 }
    let enslaversNum = 0

    // d3.interval(addSeekers, addSeekersDelay)
    // d3.timer(moveSeekers)
    d3.interval(elapsed=>{
        if (d3.now()%addSeekersDelay<=11) addSeekers(elapsed)
        moveSeekers(elapsed)
    },10)
    function addSeekers(elapsed) {
        if (seekers.length < dataset.length) {
            const nextSeekerIndex = seekers.length
            const nextSeeker = dataset[nextSeekerIndex]
            nextSeeker.startTime = elapsed
            nextSeeker.yProgress = 0
            seekers = [
                ...seekers,
                nextSeeker
            ]
            const newSeeker = seekersGroup.append('g')
                .datum(nextSeeker).classed('seeker',true)
                .style('opacity',0)
            newSeeker.append('circle')
                // .attr('r',d=>d.isChild?childR:adultR)
                // .classed('stroked', d => !d.isChild)
                .classed('stroked',true)
                .classed('literate', d => d.isLiterate)
                .classed('armed', d => d.isArmed)
                // .style('filter', d => !d.isChild ? `url(#${blurID})` : '')
                .style('stroke-width','2px')
            newSeeker.append('text').attr('class', 'name')
                // .attr('x',d=>d.isChild?-childR-5:-adultR-5)
                .html(d => d.firstMiddleName && d.lastName!='Unidentified' ? `${d.firstMiddleName.replace(' (sic)', '')} ${d.lastName}`
                    : d.firstMiddleName && d.lastName == 'Unidentified' && d.alias ? `${d.firstMiddleName.replace(' (sic)', '')} aka. ${d.alias}`
                        : d.lastName == 'Unidentified' && d.alias ? `(alias) ${d.alias}`
                            : d.lastName == 'Unidentified' ? '(unknown)'
                                : d.lastName)
            newSeeker.append('text').attr('class', 'desc')
                // .attr('x',d=>d.isChild?childR+5:adultR+5)
                .html(d => `${d.age ? d.age : ''}${d.age && d.isChild ? ', child' : d.isChild ? 'child' : ''}${(d.age || d.isChild) && d.isLiterate ? ', literate' : d.isLiterate ? 'literate' : ''}${(d.age || d.isChild || d.isLiterate) && d.isArmed ? ', armed' : d.isArmed ? 'armed' : ''}`)                
            
            const year = nextSeeker.year
            if (year&&year!=currentYear){
                currentYear=year
                years.classed('active-year',d=>d==currentYear)
            }

            if (seekers.length==dataset.length) seeStatsButton.classed('disabled',true)
        }
    }
    function moveSeekers(elapsed) {
        const yProgressA = d => (elapsed -  d.startTime) / travelDuration
        const yPositionA = d => startY + yProgressA(d) * endY
        const barHeightsA = d => dim.boundedH - arrivedBarsH[d.gender]

        const seekersInView = seekersGroup.selectAll('.seeker')
        
        // RECALCULATE START TIME BASED ON CURRENT PROGRESS & ANIMATION SPEED
        if (speedChange)
            seekersInView.each((d,i,array)=>{
                d.startTime = elapsed - d.yProgress * travelDuration
                if (i==array.length-1) speedChange=false
            })
        seekersInView
            .style('transform', d => {
                d.yProgress = yProgressA(d)
                const xChange = genderXScale(d.gender) + genderBand / 2 - startX
                const xProgress = progressXScale(d.yProgress)
                const x = startX + xChange * xProgress
                const y = yPositionA(d)
                return `translate(${x}px,${y}px)`
            })
            .transition().duration(transitionTime)
            .style('opacity', d => {
                const y = yPositionA(d)
                const margin = d.isChild ? childR : adultR
                return (y > 10 && y < barHeightsA(d) - margin) ? 1 : 0
            })

        seekersInView.select('circle')
            .transition().duration(transitionTime)
                .attr('r', d => {
                    const y = yPositionA(d)
                    const margin = d.isChild ? childR : adultR
                    if (y > 10 && y < barHeightsA(d) - margin) return d.isChild ? childR : adultR
                    else return 5
                })
        seekersInView.select('.name')
            .transition().duration(transitionTime)
            .attr('x', d => {
                const y = yPositionA(d)
                const margin = d.isChild ? childR : adultR
                if (y > 10 && y < barHeightsA(d) - margin) return d.isChild ? -childR - 5 : -adultR - 5
                else return -2.5
            })
        seekersInView.select('.desc')
            .transition().duration(transitionTime)
            .attr('x', d => {
                const y = yPositionA(d)
                const margin = d.isChild ? childR : adultR
                if (y > 10 && y < barHeightsA(d) - margin) return d.isChild ? childR + 5 : adultR + 5
                else return 2.5
            })

        const arrivedRaw = seekers.filter(d => d.yProgress >= 1)

        const arrivedGender = d3.rollup(arrivedRaw, v => v.length, d => d.gender)
        genderBars.attr('y', d => genderYScale(arrivedGender.get(d)))
            .attr('height', d => {
                const height = dim.genderChartH - genderYScale(arrivedGender.get(d))
                arrivedBarsH[d] = height ? height : 0
                return height
            })
        genderCounts.html(d => arrivedGender.get(d) ? arrivedGender.get(d) : '-')

        labels.forEach(label => {
            const arrivedData = d3.rollup(
                arrivedRaw.filter(d => label == 'isAdult' ? !d.isChild : d[label]),
                v => v.length,
                d => d.gender
            )
            genders.forEach(gender => {
                otherData.select(`.${getGenderString(gender, 'male', 'female', 'unknown-gender')}.${label}`)
                    .html(arrivedData.get(gender) ? arrivedData.get(gender) : '-')
            })
        })

        seekersGroup.selectAll('.seeker').filter(d=>d.yProgress>=1.05).remove()

        const enslaversInView = [...new Set(arrivedRaw.filter(d => d.enslaver).map(d => d.enslaver))]
        const enslaversInViewNum = enslaversInView.length
        if (enslaversInViewNum > enslaversNum) {
            enslaversGroup.append('text').attr('class', 'enslaver')
                .attr('x', d3.randomUniform(dim.width-dim.margin.left)())
                .attr('y', d3.randomExponential(.03, dim.enslaverScatterH)())
                .html('▲')
            enslaversNum++
        }
        const newest = enslaversInView.slice(-1)[0]
        enslaversCount.html(enslaversInViewNum ? enslaversInViewNum : '')
        enslaversName.html(newest ? '▲' + newest : '')
    }

    const yearsH = d3.select('#years').node().getBoundingClientRect().height
    const speedsGroup = d3.select('#speeds')
        .style('top',dim.margin.top + yearsH + lineH*2 + 'px')
    speedsGroup.selectAll('.speed').on('click', updateSpeed)
    function updateSpeed(event){
        const clicked = event.target
        d3.selectAll('.speed').classed('active',false)
        d3.select(clicked).classed('active',true)
        const divider = +clicked.innerHTML.split(' ')[1]
        travelDuration = Math.round(6000 / divider)
        addSeekersDelay = Math.round(travelDuration / 10)
        transitionTime = Math.round(travelDuration / 110)
        speedChange = true
    }

    const seeStatsButton = d3.select('#see-stats')
    seeStatsButton.on('click',()=>{
            if (!seeStatsButton.classed('active')) {
                seeStatsButton.classed('active',true).html('See People')
                seekersGroup.transition().duration(200).style('opacity',.2)
                enslaversGroup.transition().duration(200).style('opacity',.2)
                counts.transition().duration(200).style('opacity',0)
                genderBars.transition().duration(200).style('opacity',0)
                yearsGroup.transition().duration(200).style('opacity',0.2)
                speedsGroup.transition().duration(200).style('opacity',0.2)
                fullGenderBars.attr('y', dim.genderChartH).attr('height',0)
                    .transition().duration(200)
                    .attr('y', d => genderYScale(fullGenderData.get(d)))
                    .attr('height', d => dim.genderChartH - genderYScale(fullGenderData.get(d)))
                fullDataGroup.transition().duration(200).style('opacity',1)
            } else {
                seeStatsButton.classed('active',false).html('See Stats')
                seekersGroup.transition().duration(200).style('opacity',1)
                enslaversGroup.transition().duration(200).style('opacity',1)
                counts.transition().duration(200).style('opacity',1)
                genderBars.transition().duration(200).style('opacity',1)
                yearsGroup.transition().duration(200).style('opacity',1)
                speedsGroup.transition().duration(200).style('opacity',1)
                fullDataGroup.transition().duration(200).style('opacity',0)
            }
        })
}