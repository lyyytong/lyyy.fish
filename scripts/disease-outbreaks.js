const styles = getComputedStyle(document.querySelector('body'))
const fontSize = +styles.fontSize.slice(0, -2)
const countryFontSize = fontSize * 2
const fontFamily = styles.fontFamily.split(',')[0]
const margin = +styles.margin.slice(0, -2)
const bgColor = 'black'
const mainColor = 'white'
const faintColor = 'dimgray'
const faintColor2 = '#525252'

drawDiseases()
async function drawDiseases() {
    // DATA
    const dataset = await d3.csv('../data/disease-outbreaks.csv', d3.autoType)

    const canvasWrapper = document.querySelector('#canvas-wrapper')
    const width = d3.min([window.innerWidth - 2 * margin, 800])
    const height = window.innerHeight > window.innerWidth
        ? window.innerHeight * .75
        : d3.max([window.innerHeight * .87, 500])

    const sortBys = [
        'Most Recorded Diseases',
        'Most Outbreaks per Disease',
        'Alphabetical'
    ]
    let initSortBy = sortBys[0]
    let countries = sortCountries(initSortBy)
    const randIndex = d3.randomInt(50)()
    let initCountry = countries[randIndex]
    let dataMap
    let data
    let diseases
    let diseaseXScale
    let diseaseBandW
    let iconW
    let linkLength
    let imgScale
    let topMargin
    loadData(initCountry)

    // SET UP LOCATION SELECTOR
    const selector = d3.select('#selector')
    const sorts = selector.select('#sort .options')
        .selectAll('.option').data(sortBys).join('text')
        .attr('class', 'option').classed('active', d => d == initSortBy)
        .html(d => d)
        .on('click', loadOptions)
    const location = selector.select('#location .options')
    let locations = location.selectAll('.option')
        .data(countries).join('text').html(d => d)
        .attr('class', 'option').classed('active', d => d == initCountry)
        .on('click', updateCanvas)

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
        Body = Matter.Body

    // create engine
    const engine = Engine.create()
    engine.gravity.scale = .003
    let world = engine.world
    let currentBodies = []

    // create renderer
    // const ratio = window.devicePixelRatio
    const ratio = 2
    const render = Render.create({
        element: canvasWrapper,
        engine: engine,
        options: {
            width: width * ratio,
            height: height * ratio,
            pixelRatio: ratio,
            wireframes: false,
            background: bgColor
        }
    })
    Render.run(render)

    // set high PPI canvas
    const canvas = canvasWrapper.querySelector('canvas')
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    canvas.getContext('2d').scale(ratio, ratio)

    // create runner
    const runner = Runner.create()
    Runner.run(runner, engine)

    // add static walls
    const options = { 
        isStatic: true, 
        render: { 
            fillStyle: 'transparent' 
        } 
    }
    Composite.add(world, [
        Bodies.rectangle(-iconW / 2, height / 2, iconW, height, options),
        Bodies.rectangle(width + iconW / 2, height / 2, iconW, height, options),
        Bodies.rectangle(width / 2, -iconW / 2, width, iconW, options),
        Bodies.rectangle(width / 2, height + iconW / 2, width, iconW, options)
    ])

    // add mouse control
    const mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                angularStiffness: .5,
                render: {
                    visible: false
                }
            }
        })
    mouseConstraint.mouse.element.removeEventListener('mousewheel',mouseConstraint.mouse.mousewheel)
    mouseConstraint.mouse.element.removeEventListener('DOMMouseScroll',mouseConstraint.mouse.mousewheel)
    Composite.add(world, mouseConstraint)

    // keep mouse in sync with rendering
    render.mouse = mouse

    // fit render viewport to scene
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: width, y: height }
    })

    // PRELOAD TEXTURE IMAGES
    let imgURLs = []
    diseases.forEach(d => imgURLs.push(`../images/disease-outbreaks/${d.replace("'",'')}.png`))
    Promise.all(imgURLs.map(url => new Promise(
        (resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = url
        })))
        .then(drawRopes)

    // FUNCTIONS
    function loadData(initCountry) {
        dataMap = d3.rollup(
            dataset,
            v => d3.sum(v, d => d.outbreaks),
            d => d.country,
            d => d.disease
        )
            .get(initCountry)
        data = [...dataMap.entries()]
            .sort((a, b) => d3.ascending(a[1], b[1]))

        diseases = data.map(d => d[0])
        diseaseXScale = d3.scaleBand()
            .domain(diseases).range([0, width])
            .paddingOuter(.5)
        diseaseBandW = diseaseXScale.bandwidth()
        iconW = d3.min([diseaseBandW * .8, 40])
        linkLength = d3.max([iconW / 8, 3])
        imgScale = iconW / 50
        topMargin = d3.min([iconW / 2, 10])
    }

    function loadOptions() {
        const clicked = d3.select(this)
        initSortBy = this.innerHTML
        sorts.classed('active', false)
        clicked.classed('active', true)

        countries = sortCountries(initSortBy)
        locations = location.selectAll('.option')
            .data(countries).join('text')
            .attr('class', 'option').html(d => d)
            .on('click', updateCanvas)
        locations.style('transform', `translateY(30px)`)
            .transition().duration(750).ease(d3.easeElasticOut)
            .style('transform', `none`)

        const cta = d3.select('#location .cta').node()
        const ctaTop = cta.getBoundingClientRect().y
        if (ctaTop > window.innerHeight - 10) cta.scrollIntoView()
    }

    function sortCountries(initSortBy) {
        let raw
        let countries
        const descending = (a, b) => d3.descending(a[1], b[1])
        if (initSortBy == 'Most Recorded Diseases') {
            raw = d3.rollup(
                dataset,
                v => new Set(v.map(d => d.disease)).size,
                d => d.country
            )
            countries = [...raw.entries()]
                .sort((a, b) => descending(a, b))
                .map(d => d[0])
        } else if (initSortBy == 'Most Outbreaks per Disease') {
            raw = d3.rollup(
                dataset,
                v => d3.max(v, d => d.outbreaks),
                d => d.country
            )
            countries = [...raw.entries()]
                .sort((a, b) => descending(a, b))
                .map(d => d[0])
        } else {
            countries = [...new Set(dataset.map(d => d.country))].sort()
        }
        return countries
    }

    function updateCanvas() {
        const clicked = d3.select(this)
        locations.classed('active', false)
        clicked.classed('active', true)
        initCountry = this.innerHTML
        loadData(initCountry)

        Composite.remove(world, currentBodies)
        currentBodies = []
        drawRopes()
        window.scrollTo(0, 0)
    }

    function drawRopes() {
        const labelScale = 1 / ratio
        const defaultCat = 0x0001, ropeCat = 0x0002
        diseases.forEach(disease => {
            const x = diseaseXScale(disease) + diseaseBandW / 2 - iconW / 2
            const outbreaks = data.filter(d => d[0] == disease)[0][1]
            const y = topMargin

            const group = Body.nextGroup(true)

            const imgLink = `../images/disease-outbreaks/${disease.replace("'",'')}.png`
            const rope = Composites.stack(x, y,
                1, outbreaks, // columns & rows
                0, 0, // column & row gaps
                (x, y) => {
                    const icon = Bodies.rectangle(
                        x, d3.min([y, height * .8]), iconW, iconW, {
                        collisionFilter: { 
                            group: group ,
                            category: ropeCat,
                        },
                        render: {
                            sprite: {
                                texture: imgLink,
                                xScale: imgScale,
                                yScale: imgScale,
                            }
                        }
                    }
                    )
                    return icon
                })

            Composites.chain(rope, .5, 0, -.5, 0, {
                stiffness: .5,
                length: linkLength,
                render: {
                    type: 'line',
                    lineWidth: .5,
                    strokeStyle: faintColor,
                    anchors: false,
                }
            }
            )

            const ropeConstraint = Constraint.create({
                bodyB: rope.bodies[0],
                pointB: { x: 0, y: 0 },
                pointA: {
                    x: rope.bodies[0].position.x,
                    y: rope.bodies[0].position.y
                },
                stiffness: 1,
                render: {
                    visible: false,
                }
            })
            Composite.add(rope, ropeConstraint)

            const lastBody = rope.bodies.slice(-1)[0]
            const content = `${disease} (${outbreaks})`
            const labelH = content.length * fontSize * .62
            const labelW = iconW * .9
            const labelX = x + diseaseBandW / 2
            const labelY = d3.min([lastBody.position.y + labelH / 2, height])
            const text = Bodies.rectangle(labelX, labelY, labelW, labelH, {
                collisionFilter: {
                    category: ropeCat
                },
                render: {
                    sprite: {
                        texture: getLabel(content, labelW, labelH, faintColor, fontSize, 'rotate90'),
                        xScale: labelScale,
                        yScale: labelScale,
                    }
                }
            })
            const textConstraint = Constraint.create({
                bodyA: lastBody,
                pointA: { x: iconW / 2, y: 0 },
                bodyB: text,
                pointB: { x: 0, y: -labelH / 2 },
                stiffness: .5,
                length: linkLength * 3,
                render: {
                    anchors: false,
                    type: 'line',
                    lineWidth: .5,
                    strokeStyle: faintColor
                }
            })
            Composite.add(rope, [text, textConstraint])
            currentBodies.push(rope)
            Composite.add(world, rope)
        })

        const countryA = initCountry.replaceAll(",",'').split(' ')
        let countryAW = 0
        countryA.forEach(word => { countryAW += word.length * countryFontSize * .7 })
        const leftX = (width - countryAW) / 2
        const indent = countryAW / countryA.length
        const bottomY = height - 50
        countryA.forEach((word,i) => {
            const labelW = word.length * countryFontSize * .6
            const labelH = 25
            const wordLabel = Bodies.rectangle(
                leftX + indent * i + labelW/2, 
                bottomY - 80 * i, 
                labelW, labelH,
                {
                    restitution: 0.5,
                    angle: Math.PI * .03,
                    collisionFilter: {
                        mask: defaultCat
                    },
                    render: {
                        sprite: {
                            texture: getLabel(word, labelW, labelH, faintColor2, countryFontSize, 'normal'),
                            xScale: labelScale,
                            yScale: labelScale
                        }
                    }
                }
            )
            currentBodies.push(wordLabel)
            Composite.add(world, wordLabel)
        })
    }
}


function getLabel(string, width, height, textColor, fontSize, orientation) {
    const canvas = createHiPPICanvas(width, height)
    const ctx = canvas.getContext("2d")
    if (orientation == 'rotate90') {
        ctx.rotate(Math.PI / 2)
        ctx.fillStyle = textColor
        ctx.font = `normal 100 ${fontSize}px ${fontFamily}`
        ctx.textAlign = "start"
        ctx.textBaseline = 'middle'
        ctx.fillText(string, 3, -width / 2 + 1)
    } else if (orientation == 'normal') {
        ctx.fillStyle = textColor
        ctx.font = `normal 100 ${fontSize}px ${fontFamily}`
        ctx.textAlign = "start"
        ctx.textBaseline = 'middle'
        ctx.fillText(string, 0, height / 2 + 2)
    }
    return canvas.toDataURL("image/png");
}

function createHiPPICanvas(width, height) {
    // const ratio = window.devicePixelRatio;
    const ratio = 2
    const canvas = document.createElement("canvas");

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.getContext("2d").scale(ratio, ratio);

    return canvas;
}
