const body = d3.select('body')
const margin = +getComputedStyle(body.node()).padding.replace('px', '')
const lineH = +getComputedStyle(body.node()).lineHeight.replace('px', '')
const bgC = 'black'
const mainC = '#e9e9e9'
const wonC = '#318426'
const lostC = '#9f2222'
const massacreC = '#ff6363'
const seaC = '#a8a8ff'
const switchLayoutWidth = 700

const centuries = d3.range(-6, 21).filter(d => d != 0)
const centuryTexts = {}
centuries.forEach(c => {
    if (c == -6) centuryTexts[c] = '15th to 6th Century BC'
    else if (c < 0) centuryTexts[c] = c.toString().replace('-', '') + `${c == -1 ? 'st' : c == -2 ? 'nd' : c == -3 ? 'rd' : 'th'} Century BC`
    else centuryTexts[c] = c.toString() + `${c == 1 ? 'st' : c == 2 ? 'nd' : c == 3 ? 'rd' : 'th'} Century`
})

const battleTexts = {
    1: 'up to 5,000',
    2: 'up to 20,000',
    3: 'up to 100,000',
    4: 'up to 500,000',
    5: 'up to 1 million',
    6: 'over 1 million'
}
const battleSizes = {
    1: 5000,
    2: 20000,
    3: 100000,
    4: 500000,
    5: 1000000,
    6: 1500000,
}
let minR = d3.min([window.innerWidth * .4, 300])
let maxR = d3.min([window.innerWidth *.7, 600])
let circleRScale = d3.scalePow().exponent(3).domain([1,6]).range([minR,maxR])
const legendCircRScale = d3.scaleSqrt()
    .domain(Object.values(battleSizes))
    .range([5,7.5])
const menNumScale = d3.scaleLinear().domain([1, 6]).range([70, 90])
const fastAnim = 100
const fastDelay = 200
const slowAnim = 600
const slowDelay = 1500
let animTime = slowAnim
let animTimeEnd = animTime * 3
let delayTime = slowDelay
const baseSurvivalProba = getRandNum(.4, .6)
const wonSurvivalProba = getRandNum(.65, .85)
const lostSurvivalProba = getRandNum(.2, .4)
const lostMassacredSurvivalProba = getRandNum(.05, .15)

const bursts = d3.select('#bursts')
const defs = bursts.append('svg').append('defs')
getRadialGradient(defs, 'landGradient', bgC, mainC)
getRadialGradient(defs, 'landSeaGradient', bgC, seaC)
getRadialGradient(defs, 'wonGradient', mainC, wonC)
getRadialGradient(defs, 'lostGradient', bgC, lostC)
getRadialGradient(defs, 'tieGradient', bgC, mainC)
getLinearGradient(defs, 'mGradient',massacreC,mainC)
const intro = d3.select('#intro')
const randomOutcome = d3.select('#random-outcome')
const ctaWrapper = d3.select('#cta')
const cta = d3.select('#cta p')
const summary = d3.select('#summary')
const record = summary.select('#record')
const recordH = +getComputedStyle(record.node()).height.split('px')[0]
const livedBar = record.append('div').attr('class','bar')
const livedAnnotation = livedBar.append('text').attr('class','annotation')
const scaleLegend = d3.select('#scales')
const getR = d => legendCircRScale(battleSizes[d]) + 'px'
const scaleCircles = scaleLegend.selectAll('div').data(Object.keys(battleSizes))
    .join('div').attr('class',d => `scale scale${d}`)
    .style('width',d=>getR(d)).style('height',d => getR(d))
    .style('transform',(d,i) => `translateX(${-i*1.2}px)`)
const defCircOpacity = +scaleCircles.style('opacity')
const scalePcts = scaleCircles.append('text').attr('class','scale-pct')
    
const speedOptions = d3.selectAll('#speed .option').on('click', updateSpeed)
function updateSpeed(){
    speedOptions.classed('selected',false)
    d3.select(this).classed('selected',true)
    if (this.textContent=='Slow') {
        animTime = slowAnim
        animTimeEnd = animTime*3
        delayTime = slowDelay
    } else {
        animTime = fastAnim
        animTimeEnd = animTime*3
        delayTime = fastDelay
    }
}
let timeline
let century
let simulations = 0
let lived = 0
let scaleStats = {}
d3.range(1,7).forEach(d=> {
    scaleStats[d] = {}
    scaleStats[d].count = 0
})
setup()
async function setup() {
    const probaData = await d3.csv('../data/battles-and-sieges/proba.csv', d3.autoType)
    const summaryData = await d3.csv('../data/battles-and-sieges/summary.csv', d3.autoType)

    probaData.forEach((war, i) => {
        const sidesArray = war.sides.slice(1,-1)
        if (!sidesArray) probaData.splice(i, 1)
    })
    
    // bar chart
    const barsG = summary.select('#data-summary')
    const graphH = +getComputedStyle(barsG.node()).height.split('px')[0]
    const maxBattles = d3.max(summaryData, d => d.battles)
    const battleScale = d3.scaleLinear().domain([0, maxBattles]).range([0, graphH])
    const bars = barsG.selectAll('div').data(summaryData)
        .join('div').attr('class', 'bar')
        .style('height', d => d3.max([battleScale(d.battles),1]) + 'px')
    const barW = bars.nodes()[0].getBoundingClientRect().width
    const ticksShown = [-6,1,5,10,15,20]
    const ticks = bars.append('span').attr('class', 'tick')
        .html(d => d.century)
        .style('opacity', d=> ticksShown.includes(d.century) ? 1: 0)
    const annotation = bars.filter(d=>d.battles==maxBattles)
        .append('text').attr('class','annotation')
        .html(d=>`${d3.format(',')(d.battles)} battles and sieges<br> recorded in the ${centuryTexts[d.century]}`)
        .style('padding-right',barW+'px')

    // interactivity
    const selectCenturyBtn = d3.select('#select-century .button')
        .on('click', toggleselectCentury)
    const selectCenturyMenu = d3.select('#select-century .list')
    const selectCenturyOptions = selectCenturyMenu.selectAll('text').data(centuries)
        .join('text').attr('class', 'century-option')
        .html(d => centuryTexts[d])
        .on('click', updateCentury)
    bars.on('click', updateCentury)
    const menuButton = d3.select('#menu .button')
        .on('click', toggleMenu)
    const menu = d3.select('#menu .list')
    d3.select('nav .notes').on('click',openNotes)
    const notes = d3.select('#notes')
    notes.select('.button').on('click',closeNotes)
    function toggleselectCentury() {
        if (selectCenturyMenu.classed('hidden')) {
            if (simulations == 0) intro.classed('hidden', true)
            if (simulations > 0) randomOutcome.classed('hidden', true)
            ctaWrapper.classed('hidden',true)
            selectCenturyMenu.classed('hidden', false)
            selectCenturyOptions
                .style('top', -margin * 2 + 'px')
                .transition(getT())
                .ease(d3.easeCircleOut)
                .style('top', 0 + 'px')
            closeMenu()
            closeNotes()
            annotation.classed('hidden',true)
            if (selectCenturyBtn.classed('flash')) selectCenturyBtn.classed('flash',false)
        } else closeSelectCentury()
    }
    function closeSelectCentury() {
        if (simulations == 0 && !century) intro.classed('hidden', false)
        if (simulations > 0) randomOutcome.classed('hidden', false)
        if (century) ctaWrapper.classed('hidden',false)
        if (!century) annotation.classed('hidden',false)
        selectCenturyMenu.classed('hidden', true)
    }
    function updateCentury() {
        century = d3.select(this).datum()
        if (typeof (century) == 'object') century = century.century
        ctaWrapper.classed('hidden', false)
        if (ctaWrapper.classed('small'))
            ctaWrapper.style('top', 'none')
                .classed('big', true).classed('small', false)
        cta.html('click | spacebar')
        selectCenturyBtn.html(centuryTexts[century])
        closeSelectCentury()
        closeMenu()
        closeNotes()
        if (simulations == 0) intro.classed('hidden', true)
        if (simulations > 0) randomOutcome.classed('hidden', true)
        if (timeline) timeline.stop()
        bursts.classed('hidden', true)
        summary.classed('hidden', false)
        barsG.transition(getT()).style('opacity',1)
        bars.transition(getT())
            .style('opacity', d => d.century == century ? 1 : .1)
        ticks.transition(getT())
            .style('opacity',d => d.century == century ? 1 : 0)
        annotation.style('opacity',0)
    }
    function toggleMenu() {
        if (menu.classed('hidden')) {
            menu.classed('hidden', false)
            menuButton.select('span').transition(getT())
                .style('transform', 'rotate(-135deg)')
            menu.selectChildren()
                .style('top', -margin * 2 + 'px')
                .transition(getT())
                .ease(d3.easeCircleOut)
                .style('top', 0 + 'px')
            closeSelectCentury()
        }
        else closeMenu()
    }
    function closeMenu() {
        menuButton.select('span').transition(getT())
                .style('transform', 'none')
        menu.classed('hidden', true)
    }
    function openNotes(){
        closeMenu()
        notes.classed('hidden',false)
        notes.style('transform',`translateX(-${margin*2}px)`)
            .transition(getT()).ease(d3.easeCircleOut)
            .style('transform',`none`)
    }
    function closeNotes() {
        notes.transition(getT()).ease(d3.easeCircleOut)
            .style('transform',`translateX(-${margin*2}px)`)
        d3.timeout(()=>{notes.classed('hidden',true)},60)
    }

    cta.on('click', runSim)
    body.on('keypress',(event) => {
        if (event.code=='Space' && century && !ctaWrapper.classed('hidden')) runSim()
    })
    function runSim() {
        simulations++
        const survivedBg = d3.select('#sBG')
        const diedBg = d3.select('#sNBG')
        survivedBg.transition(getT(animTime)).style('opacity', 0)
        diedBg.transition(getT(animTime)).style('opacity', 0)
        ctaWrapper.classed('hidden', true)
        barsG.transition(getT(800)).style('opacity',.5)
        bars.style('pointer-events', 'none')
        selectCenturyBtn.style('pointer-events', 'none')
        randomOutcome.classed('hidden', false)
        bursts.selectAll('div').remove()
        bursts.classed('hidden', false)
        if (!notes.classed('hidden')) closeNotes()
        let data = probaData.filter(d => d.century == century)

        // get random item from weighted proba array
        function getRandItem(dataArray, accessor) {
            let stackedProba = 0
            let proba = []
            dataArray.forEach(d => {
                stackedProba += +accessor(d)
                proba.push(stackedProba)
            })
            proba = proba.map(d => d / proba.slice(-1)[0])
            let randProba = d3.randomUniform()()
            let randIndex = d3.bisect(proba, randProba)
            return dataArray[randIndex]
        }

        // get random binomial result
        function getRandBinom(refProba) {
            return d3.randomUniform()() <= +refProba ? 1 : 0
        }

        // get simulation results
        const war = getRandItem(data, d => d.proba)
        const warName = war.war
        const location = war.country
        const warProba = war.proba

        const landProba = war.land
        const seaProba = war.sea
        const airProba = war.air
        const isLand = getRandBinom(landProba)
        const isSea = getRandBinom(seaProba)
        const isAir = getRandBinom(airProba)

        // indices
        const fought = 0
        const won = 1
        const lost = 2
        const draw = 3
        const massacre = 4
        const massacred = 5

        const sidesArray = war.sides.slice(1,-1).replaceAll('],','];').split(';')
        let sideData = {}
        sidesArray.forEach(side => {
            const temp = side.replace(': [',';[').split(';')
            const sideName = temp[0], stats = temp[1]
            sideData[sideName] = strToObj(stats)
        })

        const sides = Object.keys(sideData)
        const side = getRandItem(sides, d => sideData[d][fought])
        const allSidesProba = d3.sum(Object.values(sideData).map(d => d[fought]))
        const sideProba = sideData[side][fought] / allSidesProba

        const outcomeData = sideData[side]
        const outcomes = [won, lost, draw]
        const outcome = getRandItem(outcomes, d => outcomeData[d])
        const outcomeProba = +outcomeData[outcome]

        const scales = Object.keys(battleTexts)
        const scale = getRandItem(scales, d => war[`scale${d}`])
        scaleStats[scale].count++
        const scaleDesc = battleTexts[scale]
        const scaleProba = war[`scale${scale}`]

        const isWon = outcome == won
        const isLost = outcome == lost
        const massacreProba = isWon ? +outcomeData[massacre] : isLost ? +outcomeData[massacred] : 0
        const isMassacre = getRandBinom(massacreProba)

        const survivedProba = isWon ? wonSurvivalProba
            : (isLost && isMassacre) ? lostMassacredSurvivalProba
                : isLost ? lostSurvivalProba
                    : baseSurvivalProba
        const survived = getRandBinom(survivedProba)

        // update texts
        const pctFormat = (num) => { return num == 0 | num > .01 ? d3.format('.0%')(num) : d3.format('.2%')(num) }
        const fnote = (num, proba) => { return `<sup class="fn">${num}</sup><span class="fn-pct"><sup>${num}</sup>${pctFormat(proba)}</span>` }
        const airSupport = century == 20 ? ' with air support' : ''
        d3.select('.war').html(`${warName} in today's ${location}${fnote(1, warProba)}`)
        d3.select('.feature').html(isLand & isAir & isSea ? `land${fnote('2a', landProba)}, sea${fnote('2b', seaProba)} and air${fnote('2c', airProba)}`
            : isLand & isSea ? `land${fnote('2a', landProba)} and sea${fnote('2b', seaProba)}${airSupport}`
                : isLand & isAir ? `land${fnote('2a', landProba)} and air${fnote('2b', airProba)}`
                    : isSea & isAir ? `sea${fnote('2a', seaProba)} and air${fnote('2b', airProba)}`
                        : isSea ? `sea${fnote('2', seaProba)}`
                            : isAir ? `air${fnote('2', airProba)}`
                                : `land${fnote(2, landProba)}${airSupport}`)
        const features = [isLand, isSea, isAir]
        if (features.filter(d => d == 1).length > 1)
            rearrangePcts(d3.select('.feature'),450)
        function rearrangePcts(element,width){
            const pctTexts = element.selectAll('.fn-pct').nodes()
            const topY = element.node().getBoundingClientRect().y
            pctTexts.reverse()
            let distanceRight = 0
            pctTexts.forEach((d, i, array) => {
                if (window.innerWidth <= width) d3.select(d).style('top', `${topY + (array.length - 1 - i) * lineH}px`)
                else d3.select(d).style('transform', `translateX(-${distanceRight}px)`).style('top',`${topY}px`)
                distanceRight+=d.getBoundingClientRect().width+margin/2
            })
        }
        d3.select('.scale').html(`${scaleDesc}${fnote(3, scaleProba)}`)
        const sideText = side.replace('Hideyoshis',"Hideyoshi's")
        d3.select('.side').html(`${sideText}${fnote(4, sideProba)}`)

        let massacreText
        if (isWon) massacreText = 'massacred the other side'
        else if (isLost) massacreText = 'was massacred'
        const outcomeText = isWon ? 'won' : isLost ? 'lost' : 'had inconclusive result'
        d3.select('.outcome').html(isMassacre 
                ? `${outcomeText}${fnote('5a', outcomeProba)} and ${massacreText}${fnote('5b',massacreProba)}`
                : `${outcomeText}${fnote(5, outcomeProba)}`)
        if (isMassacre) rearrangePcts(d3.select('.outcome'),450)
        
        let survivedText
        if (survived) {
            survivedText = (isLost && isMassacre) ? 'miraculously survived.' : isLost ? 'survived against the odds' : 'made it out alive'
        } else {
            survivedText = isWon ? 'did not survive despite the odds' : 'did not make it back'
        }
        d3.select('.survived').html(`${survivedText}${fnote(6, survivedProba)}`)

        // animate texts
        const paragraphs = randomOutcome.selectAll('p')
        const spans = paragraphs.selectChild().nodes()
        paragraphs.style('opacity', 0)
        let animDelays = {}
        paragraphs.nodes().forEach((d, i, array) => {
            const isLast = i == array.length - 1
            const time = isLast ? animTimeEnd : animTime
            const totalDelay = i * delayTime
            const featureName = d3.select(spans[i]).attr('class')
            animDelays[featureName] = totalDelay
            d3.timeout(() => { d3.select(d).transition(getT(time)).style('opacity', 1) }, totalDelay)
        })

        // animate backgrounds
        const fadeDelay = (paragraphs.nodes().length - 1) * delayTime
        d3.timeout(() => {
            if (survived) {
                survivedBg.transition(getT(animTimeEnd)).style('opacity', 1)
                diedBg.transition(getT(animTimeEnd)).style('opacity', 0)
            } else {
                survivedBg.transition(getT(animTimeEnd)).style('opacity', 0)
                diedBg.transition(getT(animTimeEnd)).style('opacity', 1)
            }
        }, fadeDelay)
        const showCtaDelay = fadeDelay + animTimeEnd * 1.5
        const ctaSmallY = randomOutcome.node().getBoundingClientRect().bottom
        d3.timeout(() => {
            ctaWrapper
                .style('top', ctaSmallY + margin + 'px')
                .classed('big', false).classed('small', true)
                .classed('hidden', false)
            cta.html('Again<span class="icon">↺</span>')
            bars.style('pointer-events', 'all')
            selectCenturyBtn.style('pointer-events', 'all')
        }, showCtaDelay)

        // update records
        if (survived) lived++
        if (record.classed('hidden')) record.classed('hidden',false)
            .style('opacity',0).transition(getT()).style('opacity',1)
        const livedPct = lived/simulations,
            livedBarH = livedPct*recordH
        d3.timeout(() => {
            livedBar.transition(getT(animTime)).style('height',livedBarH+'px')
            const livedAnnotText = d3.format('.0%')(livedPct)
            if (livedAnnotation.html()!=livedAnnotText)
                livedAnnotation.html(livedAnnotText).style('opacity',0)
                    .transition(getT(animTime)).style('opacity',1)
            const annotH = livedAnnotation.node().getBoundingClientRect().height
            let transform
            if (window.innerWidth < switchLayoutWidth) {
                const tY = livedBarH == 0 ? 100 : livedBarH < annotH ? 50 : 0
                transform = `translate(calc(100% + 6px),-${tY}%)`
            }
            else {
                const tX = livedBarH == 0 ? 100 : livedBarH < annotH ? 50 : 0
                transform = `rotate(-90deg) translate(${tX}%,-100%)`
            } 
            livedAnnotation.style('transform',transform)
        }, fadeDelay)
        d3.range(1,7).forEach(d=>scaleStats[d].pct = scaleStats[d].count/simulations)
        if (scaleLegend.classed('hidden')) scaleLegend.classed('hidden',false)
        if (window.innerWidth>=switchLayoutWidth) {
            d3.timeout(() => {
                d3.timeout(updatePcts,100)
                scaleCircles.transition(getT()).style('opacity',d=>d==scale ? 1 : defCircOpacity)
                    .style('left',d=>d==scale? margin+'px' : '1px')
            }, animDelays['scale'])
        }
        function updatePcts() {
            scalePcts.html(d => {
                const pct = scaleStats[d].pct
                const format = pct*10%10==0 ? '.0%' : '.1%'
                const text = pct != 0 ? d3.format(format)(pct) : ''
                return text
            })
        }

        // animate bursts
        const menNum = Math.round(menNumScale(scale))
        const repeat = 11
        let airRepeat = Math.round(repeat * 1.6)
        if (airRepeat % 2 == 0) airRepeat++
        const airAnimTime = animTime * 3
        const massacreAnimTime = animTime * 6
        const rotate = 1

        const baseCircleR = circleRScale.range()[0]*.9
        const landR = circleRScale(scale)
        const landFillGradient = isSea ? 'landSeaGradient' : 'landGradient'
        const outcomeGradient = isWon ? 'wonGradient' : isLost ? 'lostGradient' : 'tieGradient'
        const multiplierScale = d3.scaleLinear().domain([1,6]).range([.5,.3])
        const outcomeR = landR * multiplierScale(scale)
        // const massacreGradient = isWon ? 'wonMGradient' : isLost ? 'lostMGradient' : 'tieMGradient'
        const massacreGradient = 'mGradient'

        bursts.selectAll('div').remove()
        const outcomeShape = new mojs.Shape({
            parent: '#bursts',
            shape: 'circle',
            fill: `url(#${outcomeGradient})`,
            opacity: { 0: 1 },
            radius: { [outcomeR * .9]: outcomeR },
            duration: animTime,
            delay: animDelays['outcome'],
            y: { [-landR - outcomeR * .1]: -landR - outcomeR * .3 },
        })

        const massacreBurst = new mojs.Burst({
            parent: '#bursts',
            count: menNum,
            radius: outcomeR * 1.25,
            y: { [-landR - outcomeR * .1]: -landR - outcomeR * .3 },
            rotate: -180,
            children: {
                shape: 'equal',
                fill: 'none',
                stroke: `url(#${massacreGradient})`,
                strokeWidth: 'rand(.4,.8)',
                radius: `rand(${outcomeR * .3},${outcomeR * .45})`,
                opacity: { 0: 'rand(.8,1)' },
                duration: animTime,
                delay: `rand(${animDelays['outcome'] - 50},${animDelays['outcome'] + 50})`,
                scale: { 0: 1 }
            }
        }).then({
            rotate: rotate,
            children: {
                isYoyo: true,
                repeat: repeat,
                scale: 'rand(.4,1.1)',
                duration: massacreAnimTime,
                easing: 'sin.in'
            }
        })

        const landShape = new mojs.Shape({
            parent: '#bursts',
            shape: 'circle',
            fill: `url(#${landFillGradient})`,
            radius: { [baseCircleR * .9]: baseCircleR },
            opacity: { 0: .5 },
            duration: animTime,
            delay: animDelays['feature']
        }).then({
            radius: landR,
            opacity: 1,
            duration: animTime,
            delay: delayTime - animTime,
        })

        const airBurst = new mojs.Burst({
            parent: '#bursts',
            count: menNum,
            radius: { [baseCircleR * 1.5]: baseCircleR * 1.05 },
            rotate: -90,
            degree: { 0: 180 },
            children: {
                shape: 'circle',
                fill: mainC,
                radius: 'rand(1,2)',
                duration: animTime,
                delay: `rand(${animDelays['feature'] - 50},${animDelays['feature'] + 50})`,
                scale: 1
            }
        }).then({
            radius: landR * 1.1,
            children: {
                duration: animTime,
                delay: delayTime - animTime,
            }
        })
            .then({
                radius: landR * 1.05,
                children: {
                    isYoyo: true,
                    repeat: airRepeat,
                    duration: airAnimTime,
                    easing: 'sin.out',
                    scale: 'rand(.8,1)',
                }
            })

        timeline = new mojs.Timeline({
            repeat: 0,
            isYoyo: true,
        }).add(landShape, outcomeShape)
        if (isAir || century == 20) timeline.add(airBurst)
        if (isMassacre) timeline.add(massacreBurst)
        timeline.play()
    }
}

window.addEventListener('resize',() => {
    minR = d3.min([window.innerWidth * .4, 300])
    maxR = d3.min([window.innerWidth *.7, 600])
    circleRScale.range([minR,maxR])
})

function strToObj(string){
    return new Function("return" + string)()
}

function getT(duration = 200) {
    return d3.transition().duration(duration)
}

function getRandNum(x, y) {
    return d3.randomUniform(x, y)()
}

function getRadialGradient(defs, gradientID, inColor, outColor) {
    const numGradientStops = 3
    const stops = d3.range(numGradientStops).map(i => i / (numGradientStops - 1))
    defs.append('radialGradient')
        .attr('id', gradientID)
        .selectAll("stop").data(stops)
        .join('stop')
        .attr('stop-color', d => d3.interpolateRgb(inColor, outColor)(d))
        .attr('offset', d => `${d * 100}%`)
}

function getLinearGradient(defs, gradientID, colorLeft, colorRight) {
    const numGradientStops = 3
    const stops = d3.range(numGradientStops).map(i => i / (numGradientStops - 1))
    defs.append('linearGradient')
        .attr('id', gradientID)
        .selectAll("stop").data(stops)
        .join('stop')
        .attr('stop-color', d => d3.interpolateRgb(colorLeft, colorRight)(d))
        .attr('offset', d => `${d * 100}%`)
}