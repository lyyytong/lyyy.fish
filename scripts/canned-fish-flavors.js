const print = (...params) => console.log(...params)
const getHiPPICanvas = (width, height) => {
    const ratio = 2
    const canvas = document.createElement("canvas")
    canvas.width = width * ratio
    canvas.height = height * ratio
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    canvas.getContext("2d").scale(ratio, ratio)
    return canvas;
}
const getTextWidth = (text,fontSize=tinyFontSize) => {
    let canvas = document.createElement('canvas')
    let ctx = canvas.getContext('2d')
    ctx.font = `normal ${fontWeight} ${fontSize}px ${fontFamily}`
    return ctx.measureText(text).width
}
const renderText = (text, width, height) => {
    const canvas = getHiPPICanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.font = `normal ${fontWeight} ${tinyFontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.rotate(Math.PI / 2)
    ctx.textAlign = "start"
    ctx.fillText(text, 3, -width / 2 + 1)
    return canvas.toDataURL('image/png')
}
const isTouchScreen = () => {
    return ('ontouchstart' in window)
        || (navigator.maxTouchPoints > 0)
        || (navigator.msMaxTouchPoints > 0)
}

// SETUP
history.scrollRestoration = 'manual'
const body = d3.select('body').node()
const wrapper = d3.select('#graph').node()
const canvas = d3.select('#graph canvas').node()
const fontFamily = getComputedStyle(body).fontFamily
const fontSize = +getComputedStyle(body).fontSize.split('px')[0]
const tinyFontSize = fontSize * .75
const lineHeight = +getComputedStyle(body).lineHeight.split('px')[0]
const fontWeight = +getComputedStyle(body).fontWeight
const margin = +getComputedStyle(body).padding.split('px')[0]
const maxGraphW = +getComputedStyle(d3.select('#graph').node()).maxWidth.split('px')[0]
const brandH = +getComputedStyle(body).minHeight.split('px')[0]
const layoutChangeW = 750
const isWideLayout = window.innerWidth >= layoutChangeW
const color = '#0effdf'
const faintColor = '#6861c5'

const soundOptions = {
    preload: true,
    autoplay: false,
    loop: false,
}
const ding1 = new Howl({
    src: ['../sounds/canned-fish-flavors/hitting-a-metal-lid-36047.mp3'],
    ...soundOptions
})
const ding2 = new Howl({
    src: ['../sounds/canned-fish-flavors/cheese_grater_02-92236.mp3'],
    ...soundOptions
})
const ding3 = new Howl({
    src: ['../sounds/canned-fish-flavors/high-clank-86142.mp3'],
    ...soundOptions
})
const dings = [ding1, ding2, ding3]
let interacted = 0

const brands = d3.select('#graph .brands')
const stats = d3.select('#graph .stats')
const flavorStats = stats.select('.flavors')
const fishStats = stats.select('.fish')
const priceStats = stats.select('.price')
const colNames = d3.select('#graph').selectAll('.col-name')
const intro = d3.select('#intro')
const noFlavorList = d3.select('#no-flavors')
const legends = d3.select('#legends')
const moreInfo = d3.select('#graph .more-info')
const fishInfo = moreInfo.select('.fish .details')
const priceInfo = moreInfo.select('.price .details')
const minDiv = priceInfo.select('.min-median')
const medMaxDiv = priceInfo.select('.median-max')
const minText = priceInfo.select('.details-list .min')
const medText = priceInfo.select('.details-list .median')
const maxText = priceInfo.select('.details-list .max')
const notes = d3.select('#notes')
const instructions = d3.select('#instructions')
const scrollAL = instructions.select('.scroll-area-left')
const scrollAR = instructions.select('.scroll-area-right')
const dragA = instructions.select('.drag-area')
const navButtons = d3.select('nav #buttons')
const menuButton = navButtons.select('#menu').on('click', showDropdown)
const seeFlavorsButton = navButtons.select('#see-flavors')
let toggled = 0
let flavorView = 0
d3.timeout(wave, 60000)
function wave() {
    if (!flavorView && !toggled)
        seeFlavorsButton.classed('button-flash', true)
}
const dropdown = d3.select('nav #dropdown')
const notesButton = dropdown.select('.notes').on('click',hideDropdown)
const dropdownExit = dropdown.select('.exit').on('click', hideDropdown)

function showDropdown() {
    dropdown.classed('hidden', false)
    navButtons.classed('hidden', true)
    dropdownExit.classed('rotate135', true)
}
function hideDropdown() {
    dropdown.classed('hidden', true)
    navButtons.classed('hidden', false)
    dropdownExit.classed('rotate135', false)
}

const defaultCat = 0x0001,
    flavorCat = 0x0002,
    labelCat = 0x0003

init()
async function init() {
    const dataset = await d3.csv('../data/canned-fish-flavors/brand-flavors.csv', d3.autoType)
    const hasFlavors = dataset.filter(d => d.flavor_count != 0)
    const noFlavors = dataset.filter(d => d.flavor_count == 0)
    hasFlavors.sort((a, b) => d3.descending(a.flavor_count, b.flavor_count))
    const notFlavorCols = ['brand','flavor_count','minPrice','medianPrice','maxPrice','fish']
    const flavors = Object.keys(hasFlavors[0]).filter(val => !notFlavorCols.includes(val))
    
    const width = d3.min([window.innerWidth*.65, maxGraphW])
    const topMargin = intro.node().getBoundingClientRect().bottom + brandH*5
    const height = brandH * (hasFlavors.length+1) + topMargin
    let dim = {
        w: width,
        h: height,
        leftM: margin*2,
        rightM: margin*2,
        graphStartY: topMargin,
        knotW: 1,
        ropeL: margin*1.5,
    }
    const maxCount = d3.max(hasFlavors, d => d.flavor_count)
    
    dim.boundedW = dim.w - dim.leftM - dim.rightM
    const minKnotM = dim.boundedW / (maxCount - 1)
    const minR = minKnotM * .8

    const colNameW = moreInfo.select('.col-name').node()
        .getBoundingClientRect().width
    dim.moreInfoPriceW = dim.w - dim.rightM - colNameW - margin*3

    // SCALES
    const brandYScale = d3.scaleLinear()
        .domain([0, hasFlavors.length])
        .range([dim.graphStartY, dim.h])
        .clamp(true)
    const flavorRScale = d3.scaleSqrt()
        .domain([0, 1]).range([0, d3.max([minR, 8])])
    const distanceVolScale = d3.scaleLinear()
        .domain([0, dim.h]).range([.09, 0])
        .clamp(true)
    const collisionVolScale = d3.scaleLinear()
        .domain([0, 10]).range([0, 1])
    const maxPriceAll = d3.max(dataset,d=>d.maxPrice)
    const priceScale = d3.scaleLinear()
        .domain([0,maxPriceAll])
        .range([0,dim.moreInfoPriceW])

    // MATTER JS
    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Composite = Matter.Composite,
        Composites = Matter.Composites,
        Constraint = Matter.Constraint,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Events = Matter.Events,
        Vector = Matter.Vector

    const engine = Engine.create()
    engine.gravity.y = -1
    engine.gravity.scale = .00009
    const world = engine.world

    const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: dim.w,
            height: dim.h,
            pixelRatio: devicePixelRatio,
            wireframes: false,
            background: 'transparent'
        }
    })
    Render.run(render)

    const runner = Runner.create()
    Runner.run(runner, engine)

    // MOUSE CONTROL
    const mouse = Mouse.create(canvas)
    mouse.pixelRatio = devicePixelRatio
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: .2,
            render: {
                visible: false
            }
        },
        collisionFilter: {
            mask: flavorCat
        }
    })
    mouseConstraint.mouse.element.removeEventListener('mousewheel', mouseConstraint.mouse.mousewheel)
    mouseConstraint.mouse.element.removeEventListener('DOMMouseScroll', mouseConstraint.mouse.mousewheel)
    // mouseConstraint.mouse.element.removeEventListener('touchmove', mouseConstraint.mouse.mousemove);
    // mouseConstraint.mouse.element.removeEventListener('touchstart', mouseConstraint.mouse.mousedown);
    // mouseConstraint.mouse.element.removeEventListener('touchend', mouseConstraint.mouse.mouseup);
    Composite.add(world, mouseConstraint)

    // DRAW BRANDS
    const canvasPos = canvas.getBoundingClientRect()
    hasFlavors.forEach((d, i) => {
        const brand = d.brand
        const y = brandYScale(i)
        const flavorCount = d.flavor_count

        const textY = y - topMargin
        
        const brandText = brands.append('text').datum(brand)
            .attr('class', 'brand').html(brand)
            .style('top', textY + 'px')
        const brandTextPos = brandText.node().getBoundingClientRect()
        const actualTextW = brandTextPos.right - margin
        brandText.style('width', actualTextW+'px')

        flavorStats.append('text').datum(brand)
            .attr('class', 'flavor-count').html(flavorCount)
            .style('top', textY + 'px')

        const fishNum = d.fish
        fishStats.append('text').datum(brand)
            .attr('class','fish-count').html(fishNum.split(',').length)
            .style('top', textY + 'px')
        
        const avgPrice = d.medianPrice
        priceStats.append('text').datum(brand)
            .attr('class','avg-price').html(avgPrice)
            .style('top', textY + 'px')
        
        const group = Body.nextGroup(true)

        const knotMargin = flavorCount == maxCount ? minKnotM : minKnotM + 4
        const allKnotsW = knotMargin * flavorCount
        let knotX = (dim.boundedW - allKnotsW + knotMargin) / 2 + dim.leftM

        const hangerRope = Composites.stack(knotX, y, flavorCount, 1, 0, 0, () => {
            const knot = Bodies.circle(knotX,
                y,
                dim.knotW,
                {
                    collisionFilter: {
                        group: group,
                        mask: defaultCat
                    },
                    frictionAir: .05,
                    isSensor: true,
                    render: {
                        visible: false,
                    },
                })
            knotX += knotMargin
            return knot
        })

        const hookOptions = {
            label: brand,
            stiffness: 1,
            render: {
                type: 'line',
                lineWidth: .5,
                anchors: false,
                strokeStyle: faintColor,
            }
        }

        Composites.chain(hangerRope, 0, 0, 0, 0, {
            ...hookOptions
        })
        const leftHook = Constraint.create({
            pointA: { x: dim.leftM, y: y },
            bodyB: hangerRope.bodies[0],
            ...hookOptions
        })
        const rightHook = Constraint.create({
            pointA: { x: dim.w - dim.rightM, y: y },
            // pointA: { x: dim.w - dim.rightM, y: yR },
            bodyB: hangerRope.bodies.slice(-1)[0],
            ...hookOptions
        })
        Composite.add(world, [hangerRope, leftHook, rightHook])

        const flavorsToShow = Object.entries(d)
            .filter(d => flavors.includes(d[0]) && d[1] > 0)
            .map(d => d[0])

        flavorsToShow.forEach((f, fi) => {
            const fR = flavorRScale(d[f])
            const fY = y - fR - dim.ropeL
            const fX = hangerRope.bodies[fi].position.x

            const fBody = Bodies.circle(
                fX, fY, fR, {
                restitution: .3,
                frictionAir: .05,
                label: `flavor-${f}-${brand}`,
                render: {
                    fillStyle: color,
                },
                collisionFilter: {
                    category: flavorCat,
                }
            }
            )
            const fConstraint = Constraint.create({
                bodyA: fBody,
                pointA: { x: 0, y: fR },
                bodyB: hangerRope.bodies[fi],
                length: dim.ropeL,
                stiffness: 1,
                label: brand,
                render: hookOptions.render
            })
            Composite.add(world, [fBody, fConstraint])
        })
    })

    // BRANDS & STATS
    brands.style('top',topMargin+'px')
    stats.style('top',topMargin+'px').style('left',dim.w+'px')

    // LEGENDS
    const pcts = d3.range(0, 1.2, .25)
    pcts[0] = .05
    const circW = d => flavorRScale(d) * 2
    legends
        .selectAll('span').data(pcts)
        .join('span').attr('class','size')
        .style('width', d => circW(d) + 'px')
        .style('height', d => circW(d) + 'px')
        .append('text').attr('class','pct')
            .html(d=>d!=1 ? d3.format('.0f')(d*100) : '100%')
            .style('left',d=>circW(d)/2 + 'px')

    // MORE INFO
    priceInfo.style('width', dim.moreInfoPriceW +'px')

    // INSTRUCTIONS
    if (isTouchScreen()) instructions.classed('hidden',false)
    instructions.style('top',topMargin+margin-brandH*2.4 +'px')
    const canvasLX = canvas.getBoundingClientRect().x
    const canvasRX = canvas.getBoundingClientRect().right
    scrollAL.style('width',canvasLX+dim.leftM+'px')
    scrollAR.style('width',window.innerWidth-canvasRX+dim.rightM+'px')
    dragA.style('width',dim.boundedW+'px')

    // NO FLAVORS
    noFlavorList.selectAll('li')
        .data(noFlavors.map(d=>d.brand))
        .join('li').html(d=>d)

    // WAVE SIMULATIONS
    const forces = [-3e-5, -2e-5, -1e-5, 0, 1e-5, 2e-5, 3e-5]
    const getBigForce = () => forces[d3.randomInt(0, 7)()]
    const getSmallForce = () => forces[d3.randomInt(2, 5)()]

    d3.interval(horizontalWave, 5000)
    function horizontalWave() {
        if (flavorView) return
        const force = Vector.create(getBigForce(), getSmallForce())
        const metric = force.x
        const delay = 5000
        world.bodies.filter(b => b.label != 'label').forEach(b => {
            const xPct = b.position.x / dim.w
            const from = Vector.create(b.position.x, b.position.y)
            function applyForce() { Body.applyForce(b, from, force) }
            if (metric > 0) {
                d3.timeout(applyForce, xPct * delay)
            } else {
                d3.timeout(applyForce, (1 - xPct) * delay)
            }
        })
    }

    d3.interval(verticalWave, 10000)
    function verticalWave() {
        if (flavorView) return
        const force = Vector.create(getSmallForce(), getBigForce())
        const metric = force.y
        const delay = 10000
        world.bodies.filter(b => b.label != 'label').forEach(b => {
            const yPct = b.position.y / dim.h
            const from = Vector.create(b.position.x, b.position.y)
            function applyForce() { Body.applyForce(b, from, force) }
            if (metric > 0) {
                d3.timeout(applyForce, yPct * delay)
            } else {
                d3.timeout(applyForce, (1 - yPct) * delay)
            }
        })
    }

    // COLLISION SOUNDS
    const events = [
        'mousedown',
        'keydown',
        'touchstart'
    ]
    events.forEach(event => {
        document.addEventListener(event, e => {
            if (!interacted) interacted = 1
        })
    })

    const vpY = () => { return window.scrollY }
    const vpBY = () => { return window.scrollY + window.innerHeight }
    Events.on(engine, 'collisionStart', (e) => {
        if (!interacted) return
        const pairs = e.pairs
        pairs.forEach(p => {
            const bothFlavors = p.bodyA.label.includes('flavor') && p.bodyB.label.includes('flavor')
            const bothActive = p.bodyA.isSensor == false && p.bodyB.isSensor == false
            if (bothFlavors && bothActive) {
                const bodyAY = p.bodyA.position.y
                const distanceFromView = bodyAY < vpY() ? vpY() - bodyAY
                    : bodyAY > vpBY() ? bodyAY - vpBY()
                        : 0
                const collisionD = p.collision.depth
                const volume = distanceVolScale(distanceFromView) * collisionVolScale(collisionD)
                const ding = dings[d3.randomInt(3)()]
                const soundID = ding.play()
                ding.volume(volume, soundID)
            }
        })
    })

    // INTERACTIVITY
    let lBodies = []
    let toAdd = []
    let toKeep = []
    let topY = 0

    seeFlavorsButton.on('click', toggleFlavorView)
    function toggleFlavorView() {
        if (flavorView) { // turn off
            flavorView = 0
            seeFlavorsButton.classed('button-active', false)
            intro.classed('hidden',false)
            legends.classed('hidden', false)
            moreInfo.classed('hidden',true)
            notes.classed('large-margin-top',false)
            clearFlavors()
        } else { // turn on
            flavorView = 1
            if (!toggled) toggled++
            if (!instructions.classed('hidden')) instructions.classed('hidden',true)
            seeFlavorsButton.classed('button-flash', false)
            seeFlavorsButton.classed('button-active', true)
            intro.classed('hidden',true)
            legends.classed('hidden', true)
            moreInfo.classed('hidden',false)
            notes.classed('large-margin-top',true)
            showFlavors()
        }
    }
    window.addEventListener('scroll', (e) => {
        let force
        const fullForce = 9e-5
        const scrollForce = Math.abs(vpY() - topY) / window.innerHeight * fullForce
        if (vpY() > topY) { // scrolling down / pulling screen up, apply force top to bottom for drag effect
            force = Vector.create(0, scrollForce)
        } else {
            force = Vector.create(0, -scrollForce)
        }
        world.bodies.forEach(b => {
            const from = Vector.create(b.position.x, b.position.y)
            Body.applyForce(b, from, force)
        })
        topY = vpY()
        
        if (isTouchScreen() && dragA.classed('has-border') && vpY() > 50 ) {
            instructions.selectAll('div').classed('has-border',false)
            instructions.selectAll('text').classed('hidden',true)
        }

        if (flavorView) showFlavors()
    })
    function showFlavors() {
        const highlightY = vpY() + topMargin
        const index = Math.round(brandYScale.invert(highlightY))
        const brandObj = hasFlavors[index]
        if (!brandObj) return
        const brand = brandObj.brand
        const fish = brandObj.fish.replaceAll(',',', ')
        const minPrice = brandObj.minPrice
        const medianPrice = brandObj.medianPrice
        const maxPrice = brandObj.maxPrice
        
        const brandTexts = brands.selectAll('text')
        brandTexts.filter(d => d != brand).style('opacity', .1)
        brandTexts.filter(d => d == brand).style('opacity', 1)
        stats.selectAll('text').filter(d=>d!=brand).style('opacity',.1)
        stats.selectAll('text').filter(d=>d==brand).style('opacity',1)
        
        moreInfo.style('top', brandYScale(index) + margin*3 + 'px')
        fishInfo.html(fish)
        minDiv.transition().duration(200)
            .style('width', priceScale(medianPrice)-priceScale(minPrice)+'px')
            .style('left', priceScale(minPrice)+'px')
        medMaxDiv.transition().duration(200)
            .style('width', priceScale(maxPrice)-priceScale(medianPrice)+'px')
            .style('left', priceScale(medianPrice)+'px')
        medMaxDiv.select('text').html(medianPrice+'$')
        minText.html(minPrice)
        medText.html(medianPrice)
        maxText.html(maxPrice)

        const ofBrand = b => b.label.includes(brand)
        const notOfBrand = b => !ofBrand(b)
        world.constraints.filter(c => notOfBrand(c)).forEach(c => {
            c.render.visible = false
        })
        world.constraints.filter(c => ofBrand(c)).forEach(c => {
            c.render.visible = true
        })
        const innerRopes = world.composites.filter(c => c.constraints[0])
        const ropeOfBrand = c => c.constraints[0].label.includes(brand)
        const ropeNotBrand = c => !ropeOfBrand(c)
        innerRopes.filter(c => ropeNotBrand(c)).forEach(c => {
            c.constraints.forEach(cs => {
                cs.render.visible = false
            })
        })
        innerRopes.filter(c => ropeOfBrand(c)).forEach(c => {
            c.constraints.forEach(cs => {
                cs.render.visible = true
            })
        })
        world.bodies.filter(b => notOfBrand(b)).forEach(b => {
            b.render.opacity = .02
            b.isStatic = true
            b.isSensor = true
        })
        world.bodies.filter(b => ofBrand(b)).forEach(b => {
            b.render.opacity = 1
            b.render.fillStyle = faintColor
            b.isStatic = false
            b.isSensor = false
            const r = b.circleRadius
            const label = b.label.split('-')[1].replaceAll('_', ' ')
                .split('').join(String.fromCharCode(8202))
            const labelH = getTextWidth(label) + 6
            const labelW = lineHeight
            const x = b.position.x
            const y = b.position.y - labelH / 2 - r - 1
            const lBody = Bodies.rectangle(
                x, y, labelW, labelH, {
                mass: .000000001,
                restitution: .3,
                frictionAir: .05,
                label: 'label',
                isSensor: true,
                render: {
                    sprite: {
                        texture: renderText(label, labelW, labelH, color),
                        xScale: .5,
                        yScale: .5,
                    },
                },
                collisionFilter: {
                    category: labelCat
                }
            }
            )
            const lConstraint = Constraint.create({
                bodyA: b,
                pointA: { x: 0, y: -r },
                bodyB: lBody,
                pointB: { x: 0, y: labelH / 2 },
                stiffness: 1,
                render: {
                    visible: false
                }
            })
            if (!lBodies.includes(lBody)) {
                toAdd.push(lBody, lConstraint)
            } else {
                toKeep.push(lBody, lConstraint)
            }
        })
        const toRemove = lBodies.filter(b => !toKeep.includes(b))
        Composite.remove(world, toRemove)
        Composite.add(world, toAdd)
        lBodies = [...toAdd, ...toKeep]
        toAdd = []
        toKeep = []
    }
    function clearFlavors() {
        Composite.remove(world, lBodies)
        world.constraints.forEach(c => {
            c.render.visible = true
        })
        const innerRopes = world.composites.filter(c => c.constraints[0])
        innerRopes.forEach(c => {
            c.constraints.forEach(cs => {
                cs.render.visible = true
            })
        })
        world.bodies.forEach(b => {
            b.render.opacity = 1
            b.render.fillStyle = color
            b.isStatic = false
            b.isSensor = false
        })
        mouseConstraint.constraint.render.visible = false
        brands.selectAll('text').style('opacity', 1)
        stats.selectAll('text').style('opacity',1)
    }
}

// window.onresize = function(){ location.reload() }
