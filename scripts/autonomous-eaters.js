let w = window.innerWidth, h,
    mediumSW = 1000, bigScreenW = 1300,
    mediumScreen = w >= mediumSW,
    bigScreen = w >= bigScreenW,
    canvasW, canvasH, topCY, botCY, leftCY, rightCY,
    graphW, subGW, barsW, barW, strW = 1,
    graphH, halfGH, labelW, graphY,
    barNum, barGap = 1,
    g1X, g2X,
    padding = 8, paddingBig,
    sim, restartButton,
    minCW = 300, minCH = 300,
    bgC = 'silver', textS,
    eaterC = '#252525',
    scentC = 'mediumspringgreen', scentT = 8,
    eatenC = 'red', eatenT = 50, eatenRR = 8,
    bornC = 'white', bornT = 100, bornRR = 8,
    textC = '#252525', lineC = '#555555',
    popBarC = '#252525', popBarT = 120,
    bornBarC = 'white', bornBarT = 130,
    eatenBarC = '#252525', eatenBarT = 120

let eaterArray = [],
    maxR, maxRtoDR = .3,
    runSpeedRatio = 2.5,
    easing = .08,
    restartTime = 0, time,
    id = 1, showLink = 0,
    eaten = 0, born = 0, currentPop = 0,
    maxPop, maxEaten, maxBorn

let stats = [],
    paramIDs = ['eNum', 'eaterR', 'stepR', 'scents', 'scentR', 'hungerRR', 'reproRR', 'reproP', 'reproQty'],
    paramVs = {
        eNum: mediumScreen ? 40 : 20,
        eaterR: mediumScreen ? 5 : 4.5,
        stepR: mediumScreen ? 12 : 9,
        scents: mediumScreen ? 40 : 50,
        scentR: mediumScreen ? 3 : 2.5,
        hungerRR: mediumScreen ? 3 : 5,
        reproRR: mediumScreen ? 2 : 3,
        reproP: mediumScreen ? 5 : 6,
        reproQty: mediumScreen ? 2 : 3,
    }

function setup() {
    scentC = color(scentC).levels
    eatenC = color(eatenC).levels
    eatenC[3] = eatenT
    bornC = color(bornC).levels
    bornC[3] = bornT

    initDimensions()
    initNav()
    initParams()

    sim = select('#sim')
    topCY = sim.position().y + sim.height + padding

    const canvas = select('#sim-canvas').elt
    createCanvas(canvasW, canvasH, canvas)
    ellipseMode(RADIUS)
    textFont('sans-serif')
    textSize(textS)
    initSimSettings()

    const loading = select('#loading'),
        dNone = () => { loading.style('display', 'none') }
    loading.addClass('hidden')
    setTimeout(dNone, 200)
    select('nav').removeClass('hidden')
    select('#params').removeClass('hidden')
    select('#stats').removeClass('hidden')
    select('#restart-button').removeClass('hidden')
}
function draw() {
    time = millis()

    background(bgC)
    eaterArray.forEach(e => {
        e.leaveScent()
    })
    eaterArray.forEach(e => {
        e.checkHunger()
        e.move()
        e.pursue()
        if (eaterArray.length > 1) e.reproduce()
    })
    drawStats()

    const stopSim = () => {
        const last = eaterArray[0], faceTS = last.r * .4
        push()
        fill(bgC)
        textSize(faceTS)
        textAlign(CENTER, CENTER)
        translate(last.x, last.y)
        text('👁️_👁️', 0, 0)
        rotate(-QUARTER_PI / 6)
        textAlign(CENTER, BOTTOM)
        text('🎩', -faceTS / 3, -last.r * .85)
        pop()
        restartButton.addClass('flash')
        noLoop()
    }
    if (eaterArray.length == 1) setTimeout(stopSim, 500)
}
function windowResized() {
    initDimensions()

    const buttonID = bigScreen ? '#restart-button2' : '#restart-button'
    restartButton = select(buttonID)
    restartButton.mousePressed(initSimSettings)

    const paramsGroup = select('#params')
    if (!bigScreen) {
        const restartButonH = restartButton.height,
            navH = select('nav').height,
            paramsH = canvasH - navH - restartButonH - padding
        paramsGroup.style('display', 'none').style('height', paramsH + 'px')
    } else {
        paramsGroup.style('display', 'flex').style('height', 'auto')
    }

    sim = select('#sim').removeClass('opaque-bg')
    topCY = sim.position().y + sim.height + padding

    resizeCanvas(canvasW, canvasH)
}
class Eater {
    constructor(x, y, r) {
        this.id = id++
        this.x = x
        this.y = y
        this.r = r
        this.step = this.r * paramVs.stepR
        this.easing = easing
        this.tX = this.x + random(-this.step, this.step)
        this.tY = this.y + random(-this.step, this.step)
        this.scents = []
        this.parentID = 0
        this.parent = null
        this.scentsDetected = []
        this.eatersDetected = []
        this.lastAte = 0
    }
    checkHunger() {
        const rR = paramVs.hungerRR / 1000
        this.r -= rR
        if (this.r < paramVs.eaterR) this.r = paramVs.eaterR
    }
    inRange(d) {
        const leftX = this.x - this.r,
            rightX = this.x + this.r,
            topY = this.y - this.r,
            botY = this.y + this.r,
            inXRange = d.x + d.r > leftX && d.x - d.r < rightX,
            inYRange = d.y + d.r > topY && d.y - d.r < botY
        return inXRange && inYRange
    }
    move() {
        const interval = round(random(1, 2), 2) * 1000
        if (time % interval <= 60) { // roughly every 1-2s, set a new course
            this.tX = this.x + random(-this.step, this.step)
            this.tY = this.y + random(-this.step, this.step)
        }
        this.easing = this.scentsDetected.length ? .2 : easing
        this.x += (this.tX - this.x) * easing
        this.x = constrain(this.x, leftCX + this.r, rightCX - this.r)
        this.y += (this.tY - this.y) * easing
        this.y = constrain(this.y, topCY + this.r, botCY - this.r)

        fill(eaterC)
        if (showLink && this.parent && eaterArray.includes(this.parent)) {
            const p = this.parent
            stroke(eaterC)
            strokeWeight(.3)
            line(this.x, this.y, p.x, p.y)
        }
        noStroke()
        ellipse(this.x, this.y, this.r)
    }
    leaveScent() {
        this.scents.push({ x: this.x, y: this.y, r: this.r * paramVs.scentR, created: time })
        if (this.scents.length > paramVs.scents) this.scents.shift()

        this.scents.forEach((s, i) => {
            const t = scentT / this.scents.length * i
            let r
            // keep old size of scent if scent was created before eating/eater's increase in size
            if (s.created < this.lastAte) r = s.r
            // update size of scent if scent was created after eater's increase in size
            else {
                const maxScentR = this.r * paramVs.scentR
                r = maxScentR / this.scents.length * i
                s.r = r
            }
            scentC[3] = t
            fill(scentC)
            noStroke()
            ellipse(s.x, s.y, r)
        })
    }
    reproduce() {
        const period = paramVs.reproP * 1000,
            rR = paramVs.reproRR * paramVs.eaterR
        if (this.r >= rR && time % period <= 10) {
            for (let i = 0; i < paramVs.reproQty; i++) {
                const x = this.x + this.r * random([-1, 1]),
                    y = this.y + this.r * random([-1, 1])
                let child = new Eater(x, y, paramVs.eaterR)
                child.parentID = this.id
                child.parent = this
                eaterArray.push(child)
                fill(bornC)
                noStroke()
                ellipse(x, y, paramVs.eaterR * bornRR)
                born++
                currentPop++
            }
        }
    }
    pursue() {
        // avoid parent
        if (this.parent) {
            const p = this.parent
            if (this.inRange(p)) {
                const posXDis = p.x >= this.x,
                    posYDis = p.y >= this.y
                const s = p.r * 1.35
                this.tX = posXDis ? p.x - s : p.x + s
                this.tY = posYDis ? p.y - s : p.y + s
            }
        }

        // pursue & eat OR flee from others
        const notFamily = d => this.id != d.parentID && this.parentID != d.id
        this.scentsDetected = []
        this.eatersDetected = []
        const others = eaterArray.filter(e => e != this && notFamily(e))
        others.forEach(o => {
            const scentsInV = o.scents.filter(s => this.inRange(s))
            if (scentsInV.length) this.scentsDetected.push(...scentsInV)

            if (this.inRange(o)) {
                o.d = dist(o.x, o.y, this.x, this.y)
                this.eatersDetected.push(o)
            }
        })

        if (this.scentsDetected.length) {
            this.scentsDetected.sort((a, b) => b.r - a.r) // sort scents from biggest to smallest radius
            const strongest = this.scentsDetected[0]
            const posXDis = strongest.x >= this.x,
                posYDis = strongest.y >= this.y
            if (this.r * paramVs.scentR >= strongest.r) { // if scent is same size or smaller
                // move towards scent
                this.tX = strongest.x
                this.tY = strongest.y
            } else {
                // flee in opposite direction of scent
                const runSpeed = this.step * runSpeedRatio
                this.tX = posXDis ? strongest.x - runSpeed : strongest.x + runSpeed
                this.tY = posYDis ? strongest.y - runSpeed : strongest.y + runSpeed
            }
        }

        if (this.eatersDetected.length) {
            this.eatersDetected.sort((a, b) => a.d - b.d) // sort eaters from closest to furthest
            const closest = this.eatersDetected[0]
            if (closest.d <= closest.r + this.r) { // eaters actually overlapped
                let bigger, smaller
                if (this.r > closest.r) { bigger = this; smaller = closest }
                else if (this.r < closest.r) { bigger = closest; smaller = this }
                else {
                    let ar = [this, closest]
                    shuffle(ar, true)
                    bigger = ar.pop(0)
                    smaller = ar[0]
                }

                if (bigger.r < maxR) bigger.r += smaller.r
                fill(eatenC)
                noStroke()
                ellipse(bigger.x, bigger.y, bigger.r * eatenRR)
                bigger.lastAte = millis()
                const i = eaterArray.indexOf(smaller)
                eaterArray.splice(i, 1)
                eaten++
                currentPop--
            }
        }
    }
}
function drawStats() {
    if (time % 1000 <= 30) {
        stats.push({ currentPop, eaten, born })
        if (stats.length > barNum) stats.shift()

        maxPop = max(stats.map(s => s.currentPop))
        if (maxPop < paramVs.eNum) maxPop = paramVs.eNum

        const last = stats[stats.length - 1]
        maxEaten = last.eaten
        maxBorn = last.born

        if (maxPop > paramVs.eNum) {
            const initPH = paramVs.eNum / maxPop * graphH,
                initPY = graphY + (graphH - initPH) / 2
            select('.currentPop .initPop').position(g1X + labelW, initPY)
                .style('height', initPH + 'px')
        }
    }

    stats.forEach((s, i) => {
        const tToY = graphY + halfGH

        let tToX = g1X + labelW
        drawBars('currentPop', tToX, popBarC)

        tToX = g2X + labelW
        drawBars('born', tToX, bornBarC)
        drawBars('eaten', tToX, eatenBarC)

        function drawBars(metric, tToX, bColor) {
            const isPop = metric == 'currentPop',
                isB = metric == 'born',
                isE = metric == 'eaten'
            push()
            translate(tToX, tToY)
            let x = barW * i,
                maxVal = isPop ? maxPop : max(maxEaten, maxBorn)
            upperB = isPop ? graphH : halfGH,
                h = map(s[metric], 0, maxVal, 0, upperB)
            h = h ? h : 0
            let y = -h / 2
            if (isB) y = -h
            else if (isE) y = 0
            let barC = color(bColor).levels
            const t = isPop ? popBarT : isB ? bornBarT : eatenBarT
            barC[3] = t
            stroke(barC)
            strokeWeight(strW)
            line(x, y, x, y + h)

            if (i == stats.length - 1) {
                const vA = isE ? TOP : BOTTOM,
                    hA = stats.length == barNum && !isPop ? RIGHT : LEFT
                textAlign(hA, vA)
                const tX = x + 1,
                    tY = isE ? h - 1 : y
                fill(bColor)
                noStroke()
                text(s[metric], tX, tY)
            }
            pop()
        }
    })
}
function initDimensions() {
    w = windowWidth
    h = windowHeight

    mediumScreen = w >= mediumSW,
        bigScreen = w >= bigScreenW,

        canvasW = w < minCW ? minCW : w
    canvasH = h < minCH ? minCH : h

    graphH = canvasH * .1
    graphH = constrain(graphH, 50, 100)
    halfGH = graphH / 2
    paddingBig = bigScreen ? 16 : 10
    const botMR = bigScreen ? 1.5 : 2.3
    graphY = canvasH - graphH - paddingBig * botMR
    graphW = canvasW - paddingBig * 2
    textS = constrain(w * .02, 15, 17) * .8
    labelW = textS + 5
    const gGap = paddingBig * 2
    subGW = (graphW - gGap) * .5
    barsW = subGW - labelW
    g1X = paddingBig
    g2X = canvasW - paddingBig - subGW
    barW = strW + barGap
    barNum = floor(barsW / barW)

    botCY = graphY - padding
    leftCX = padding
    rightCX = canvasW - padding

    sim = select('#sim').removeClass('opaque-bg')
    topCY = sim.position().y + sim.height + padding

    const minD = min(canvasW, canvasH)
    maxR = minD * maxRtoDR

    const stats = ['.currentPop', '.born', '.eaten']
    stats.forEach(s => {
        const isPop = s == '.currentPop'
        const labelX = isPop ? g1X : g2X,
            labelY = graphY + halfGH
        select(s + ' .label').position(labelX, labelY)
    })
    select('.currentPop .initPop').position(g1X + labelW, graphY)
        .style('width', barsW + 'px').style('height', graphH + 'px')
    select('.born .bg').position(g2X + labelW, graphY)
        .style('width', barsW + 'px').style('height', halfGH + 'px')
}
function initParams() {
    selectAll('input[type=range]').forEach(s => {
        const id = s.id()
        s.changed(() => {
            select('.value.' + id).html(s.value())
            restartButton.addClass('flash')
        })
    })
}
function initNav() {
    const buttonID = bigScreen ? '#restart-button2' : '#restart-button'
    restartButton = select(buttonID)
    restartButton.mousePressed(initSimSettings)

    const paramsButton = select('#see-params'),
        paramsGroup = select('#params')
    paramsButton.mousePressed(toggleParams)
    if (!bigScreen) {
        const restartButonH = restartButton.height,
            navH = select('nav').height,
            paramsH = canvasH - navH - restartButonH - padding
        paramsGroup.style('display', 'none')
            .style('height', paramsH + 'px')
    } else {
        paramsGroup.style('display', 'flex').style('height', 'auto')
    }
    function toggleParams() {
        const hidden = paramsGroup.style('display') == 'none'
        print(paramsGroup.style('display'))
        if (hidden) {
            paramsGroup.style('display', 'flex')
            paramsButton.addClass('pop')
            sim.addClass('opaque-bg')
        } else {
            paramsGroup.style('display', 'none')
            paramsButton.removeClass('pop')
            sim.removeClass('opaque-bg')
        }
    }

    const showLinkButton = select('#see-links')
    showLinkButton.mousePressed(() => {
        if (!showLink) {
            showLink = 1
            showLinkButton.addClass('pop')
                .html('Hide parental links')
        } else {
            showLink = 0
            showLinkButton.removeClass('pop')
                .html('View parental links')
        }
    })

    const notes = select('#info .notes'),
        seeNoteButton = select('#info .button')
    seeNoteButton.mousePressed(() => {
        const hidden = notes.style('display') == 'none'
        if (hidden) {
            notes.style('display', 'flex')
            seeNoteButton.addClass('pop')
        } else {
            notes.style('display', 'none')
            seeNoteButton.removeClass('pop')
        }
    })
    select('#info .close-button').mousePressed(() => {
        notes.style('display', 'none')
        seeNoteButton.removeClass('pop')
    })

}
function initSimSettings() {
    const firstSim = !restartTime
    const getVal = (id) => {
        paramVs[id] = select('input#' + id).value()
    }
    const setValD = (id) => {
        const v = paramVs[id]
        select('input#' + id).value(v)
        select('.value.' + id).html(v)
    }
    if (firstSim) paramIDs.forEach(id => setValD(id))
    else paramIDs.forEach(id => getVal(id))

    eaterArray = []
    restartTime = millis()
    eaten = 0
    born = 0
    currentPop = paramVs.eNum
    stats = []
    stats.push({ currentPop, eaten, born })
    restartButton.removeClass('flash')
    if (!bigScreen) {
        select('#params').style('display', 'none')
        select('#see-params').removeClass('pop')
        sim.removeClass('opaque-bg')
    }
    for (let i = 0; i < paramVs.eNum; i++) {
        const x = random(leftCX, rightCX)
        const y = random(topCY, botCY)
        eaterArray.push(new Eater(x, y, paramVs.eaterR))
    }
    loop()
}