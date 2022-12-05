drawHeatmap()
async function drawHeatmap() {
    const data = await d3.csv('../data/digits-of-primes.csv', d3.autoType)

    let dim = {
        width: d3.min([450, window.innerWidth]),
        height: window.innerHeight * .99,
        margin: {
            right: 25,
            bottom: window.innerWidth < 600 ? window.innerHeight * .25 : window.innerHeight * .2,
            left: 65
        }
    }
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right
    dim.boundedHeight = dim.boundedWidth * .9
    dim.margin.top = dim.height - dim.boundedHeight - dim.margin.bottom

    const wrapper = d3.select('#digit-count')
        .append('svg')
        .attr('height', dim.height)
        .attr('width', dim.width)
    const bounds = wrapper.append('g')
        .style('transform', `translate(
            ${dim.margin.left}px,
            ${dim.margin.top}px
        )`)
    const highlightBg = bounds.append('g')

    const digits = data.map(d => d.digit)
    const placeValues = data.columns.filter(d => d != 'digit')
        .map(d => +d).sort((a, b) => d3.descending(a, b))

    const xScale = d3.scaleBand()
        .domain(placeValues)
        .range([0, dim.boundedWidth])
        .paddingInner(.05)
    const xBandW = xScale.bandwidth()

    const yScale = d3.scaleBand()
        .domain(digits)
        .range([0, dim.boundedHeight])
        .paddingInner(.05)
    const yBandH = yScale.bandwidth()

    const maxVal = d3.max(data.map(d => d3.max(Object.values(d))))
    const opacityScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, 1])

    const radiusScale = d3.scaleSqrt()
        .domain([0, maxVal])
        .range([0, yBandH * 3])

    const countGroup = bounds.append('g')
    countGroup.selectAll('.row')
        .data(digits)
        .join('g').attr('class', d => `row row-${d}`)
        .style('transform', d => `translateY(
            ${yScale(d)}px
        )`)
    data.forEach(datum => {
        const row = countGroup.select(`.row-${datum.digit}`)
            .selectAll('.count').data(placeValues).join('g')
            .style('transform', val => `translateX(${xScale(val)}px)`)
        row.append('text')
            .attr('class', val => `count digit-${datum.digit} place-${val}`)
            .attr('x', xBandW).attr('y', yBandH)
            .html(val => d3.format(',.2f')(datum[val] / 1000000))
            .style('opacity', val => datum[val] < 10 ? .1 : opacityScale(datum[val]))
    })

    const yAxis = bounds.append('g').attr('class', 'y-axis')
    const yAxisLeftX = -xBandW * 1.9
    yAxis.selectAll('.tick').data(digits)
        .join('text').attr('class', d => `tick digit-${d}`)
        .attr('x', -20)
        .attr('y', d => yScale(d) + yBandH)
        .html(d => d)
    yAxis.append('text').html('Digit')
        .attr('class', 'axis-label')
        .attr('x', yAxisLeftX).attr('y', yBandH)

    const placeValueNames = {
        1: "ones",
        2: "tens",
        3: "hundreds",
        4: "thousands",
        5: "10 thousands",
        6: "100 thousands",
        7: "millions",
        8: "10 millions",
        9: "100 millions",
    }

    const xAxisY = dim.margin.top * .38
    const xAxisH = dim.margin.top - xAxisY
    const demoW = dim.boundedWidth * .72
    const demoX = (dim.boundedWidth - demoW) * .6
    const xAxis = wrapper.append('g')
        .attr('class', 'x-axis')
        .style('transform', `translate(
            ${dim.margin.left}px,
            ${xAxisY}px
        )`)
    xAxis.append('text').html('Position')
        .attr('class', 'axis-label')
        .attr('x', yAxisLeftX).attr('y', xAxisH)

    const demo = xAxis.append('g')
        .style('transform', `translateX(${demoX}px)`)

    const xDemoScale = d3.scaleBand()
        .domain(placeValues).range([0, demoW])
    const xDemoBandW = xDemoScale.bandwidth()

    const demoDigits = demo.selectAll('.demo-digit')
        .data(placeValues).join('g')
        .style('transform', d => `translateX(${xDemoScale(d) + xDemoBandW}px)`)
    demoDigits.append('text').html(0)
        .attr('class', d => `demo-digit zero place-${d}`)
        .attr('x', (d, i) => [1, 4, 7].includes(d) ? -5
            : [3, 6, 9].includes(d) ? 5
                : 0)
    for (const i in d3.range(4))
        demo.append('text')
            .html(i == 0 ? 1 : ',')
            .attr('class', 'demo-digit')
            .attr('x', i == 0 ? 5 : xDemoScale(i * 3) + xDemoBandW / 2)
            .style('text-anchor', i == 0 ? 'end' : 'middle')

    const xAxisTicks = xAxis.selectAll('.tick')
        .data(placeValues).join('text')
        .attr('class', d => `tick place-${d}`)
        .attr('x', -xAxisH)
        .attr('y', d => xScale(d) + xBandW)
        .html(d => placeValueNames[d])

    const getRandNum = d3.randomUniform(dim.boundedWidth)
    const curve = d3.line().curve(d3.curveBundle.beta(1.1))
    xAxis.selectAll('.demo-line').data(placeValues)
        .join('path').attr('class', d => `demo-line place-${d}`)
        .attr('d', (d, i) => {
            const topX = [1, 4, 7].includes(d) ? demoX + xDemoScale(d) + xDemoBandW - 5
                : [3, 6, 9].includes(d) ? demoX + xDemoScale(d) + xDemoBandW + 5
                    : demoX + xDemoScale(d) + xDemoBandW
            const topY = 0
            const bottomX = xScale(d) + xBandW
            const bottomY = xAxisH - xAxisTicks.nodes()[i].getBoundingClientRect().height
            const middleXTop = getRandNum()
            const middleYTop = (xAxisH - yBandH) * .2
            const middleXBot = getRandNum()
            const middleYBot = (xAxisH - yBandH) * .5
            const path = [
                [topX, topY],
                [topX, middleYTop],
                [middleXTop, middleYTop],
                [middleXBot, middleYBot],
                [bottomX, middleYBot],
                [bottomX, bottomY]
            ]
            return curve(path)
        })

    d3.select('#footnote').style('transform', `translate(
            ${dim.margin.left - 20}px,
            ${dim.height - dim.margin.bottom + yBandH * .7}px
        )`)
        .style('width', dim.boundedWidth + 20 + 'px')
        .html('The occurence of digits (in million) in prime numbers smaller than one billion. Primes are numbers greater than 1 that cannot be divided by any number other than 1 and themselves. (2, 3, 5, 7, 9, 11, and 13 are primes.) More than 50 million primes were generated for this visualization, using codes based on the Sieve of Eratosthenes.')

    const zeroH = demoDigits.node().getBBox().height
    const countDisplayY = dim.margin.top * .08
    const countDisplayH = dim.margin.top - xAxisH - zeroH - countDisplayY
    const countDisplayX = demoX * .73
    const countDisplayW = demoW * 1.12
    const countDisplay = d3.select('#count-display')
        .style('transform', `translate(
            ${dim.margin.left + countDisplayX}px,
            ${countDisplayY}px
        )`)

    const cta = d3.select('#cta')
        .style('transform', `translate(
            ${dim.margin.left + dim.boundedWidth + 7}px,
            calc(-100% + ${dim.margin.top + yScale(9) + yBandH + 3}px)
        )`)
        .html('click for details ↓')

    const countDisplayText = countDisplay
        .style('width', countDisplayW + 'px')
        .style('height', countDisplayH + 'px')
        .append('span')

    d3.selectAll('.count').on('click', highlight)
    function highlight() {
        const clicked = d3.select(this)
        const classString = clicked.attr('class').split(' ')
        const digitClass = classString[1]
        const digit = +digitClass.split('-')[1]
        const placeClass = classString[2]
        const place = +placeClass.split('-')[1]
        const count = data.filter(d => d.digit == digit)[0][place]

        countDisplayText.html((digit == 2 || digit == 5) && place == 1 ? `The digit <span>${digit}</span> appears once in the ones position.`
            : digit == 0 && place == 9 ? `0 is never in the 100 millions position here. The bigget prime included is 999,999,937.`
                : digit % 2 == 0 && digit != 2 && place == 1 ? `The digit <span>${digit}</span> is never found in the <span>${placeValueNames[place]}</span> position. Primes other than 2 cannot be even.`
                    : `The digit <span>${digit}</span> appears <span>${d3.format(',')(count) + ' times'}</span><br> in the <span>${placeValueNames[place]}</span> position.`)

        clearHighlights()
        clicked.classed('highlight', true).classed('highlight-bigger', true)
        d3.select('#count-display').style('display', 'flex')
        d3.select(`.tick.${digitClass}`).classed('highlight', true)
        d3.select(`.tick.${placeClass}`).classed('highlight', true)
        d3.select(`.demo-digit.${placeClass}`).classed('highlight', true)
        d3.select(`.demo-line.${placeClass}`).classed('highlight-path', true)

        highlightBg.append('circle')
            .attr('class', 'highlight-circle')
            .attr('cx', xScale(place) + xBandW * .65)
            .attr('cy', yScale(digit) + yBandH * .8)
            .transition().duration(100)
            .attr('r', radiusScale(count))
    }

    d3.selectAll('.axis-label').on('click', highlightAxis)
    function highlightAxis() {
        const clicked = d3.select(this)
        const clickedParent = d3.select(clicked.node().parentElement)
        const classString = clickedParent.attr('class').split(' ')[0]

        clearHighlights()
        d3.select(this).classed('highlight', true)
        d3.selectAll(`.${classString.includes('x-axis') ? 'x-axis' : 'y-axis'} .tick`)
            .classed('highlight', true)
    }

    d3.selectAll('.tick').on('click', highlightDigit)
    function highlightDigit() {
        const clicked = d3.select(this)
        const classString = clicked.attr('class').split(' ')
        const axis = d3.select(clicked.node().parentElement).attr('class')
        const classTarget = classString[1]

        clearHighlights()
        clicked.classed('highlight', true)
        d3.selectAll(`.count.${classTarget}`).classed('highlight', true).classed('highlight-bigger', true)
        if (axis == 'x-axis') {
            d3.select(`.demo-digit.${classTarget}`).classed('highlight', true)
            d3.select(`.demo-line.${classTarget}`).classed('highlight-path', true)
        }
    }

    d3.selectAll('.zero').on('click', highlightPlace)
    function highlightPlace() {
        const clicked = d3.select(this)
        const classString = clicked.attr('class').split(' ')
        const placeClass = classString[2]

        clearHighlights()
        clicked.classed('highlight', true)
        d3.selectAll(`.count.${placeClass}`).classed('highlight', true)
        d3.select(`.tick.${placeClass}`).classed('highlight', true)
        d3.select(`.demo-line.${placeClass}`).classed('highlight-path', true)

    }

    d3.select('body').on('click', (d) => {
        const clickedClass = d3.select(d.target).attr('class')
        if (clickedClass == null
            || (!clickedClass.includes('digit')
                && !clickedClass.includes('place')
                && !clickedClass.includes('axis')
                && !clickedClass.includes('tick'))
        )
            clearHighlights()
        else cta.transition().duration(100).style('opacity', 0)
    })

}

function clearHighlights() {
    d3.select('#cta').transition().duration(100).style('opacity', .5)
    d3.select('#count-display').style('display', 'none')
    d3.selectAll('.tick').classed('highlight', false)
    d3.selectAll('.axis-label').classed('highlight', false)
    d3.selectAll('.count').classed('highlight', false).classed('highlight-bigger', false)
    d3.selectAll('.count tspan').transition().duration(50).remove()
    d3.selectAll('.highlight-circle').transition().duration(200).attr('r', 0).remove()
    d3.selectAll('.demo-digit').classed('highlight', false)
    d3.selectAll('.demo-line').classed('highlight-path', false)
}