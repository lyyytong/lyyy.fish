// TURN DEVICE TO ROTATE GRAVITY?
// CREATURES INSIDE A WASHING MACHINE?

const parts=['back','leg','arm','torso','head'], // in drawing order
    minParts=[0,0,0,1,1], // min number of each body part allowed
    maxParts=[1,6,6,1,5], // max number of each body part allowed
    limbs=['arm','leg'],
    mutationRateAppearance=.05,
    mutationRateOther=.01,
    themeColor1='#d2d2c8',
    themeColor2='#8f8f97',
    themeColor3='#80808d',
    themeColor4='#2b2b36',
    bgColor=[210,210,200],
    hyphaColorShadow=[250,25],
    hyphaColorExploring=[210,250,0,50],
    hyphaColorTargeting=[100,100,180,30],
    mushroomStemColor=[100,100,180,20],
    mushroomCapColor=[110,110,180,100], // cap fill
    mushroomCapStroke=[230,250,190,80], // cap stroke
    mushroomLostCapColor=[197,99,99],
    mushroomEatenSymbol='⨯',
    // mushroomBurstSymbols=['𝕬','𝕭','𝕮','𝕯','𝕰','𝕱','𝕲','𝕳','𝕴','𝕵','𝕶','𝕷','𝕸','𝕹','𝕺','𝕻','𝕼','𝕽','𝕾','𝕿','𝖀','𝖁','𝖂','𝖃','𝖄','𝖅'],
    mushroomBurstSymbols=['𝕬','𝕭','𝕮','𝕯','𝕰','𝕱','𝕲'],
    pitches=['A','B','C','D','E','F','G'],
    mushroomCapLayers=6,
    mushroomSpores=3, // when burst, new hyphae to create
    droppingColor=[255,150],
    // dreadColor=[190,50,50,180],
    eatingColor=[220,150,90,70],
    chainColor=[165,165,175,200],
    mythLifespan=1000,
    mythWeaknessThreshold=mythLifespan*.1,
    mythLifeLossSpeed=.25,
    mythLifeLossFromBreedingRatio=.75,
    mushroomLifespan=20,
    mushroomLifeLossSpeed=.02,
    hyphaLifespan=10,
    hyphaLifeLossSpeed=.1,
    droppingLifespan=10,
    droppingLifeLossSpeed=.001,
    timeBetweenMating=2000,
    gravity=.00000001,
    quadtreeCellsize=30,
    mythViewRadius=150,
    hyphaViewRadius=50,
    notAppearanceGeneIndex=parts.length*2,
    theme=document.querySelector('meta[name="theme-color"]')
const {Engine,Composite,Bodies,Body,Constraint,Vertices}=Matter
const V=p5.Vector
let smallScreen,
    mythMass,
    initMythCount,maxMyths,maxHyphae,
    maxMushrooms,mushroomMinCap,mushroomMaxCap,mushroomMinHeight,mushroomMaxHeight,mushroomAvgHeight,
    mushroomCapFill=[],
    maxDroppings,droppingMaxRadius,
    eatingRadius,
    chainLinkCount,chainLinkWidth,chainLinkHeight,chainLinkHalfH,chainLinkHalfW,
    minFruitingDensity, // amount of hyphae required to cluster for mushroom to sprout
    centerScreen,profileMargin,
    data, progenitors,
    brain,bodySizeRatio=1,
    profileEngine,
    bounds=[],
    uniqueID=0,
    sineTable,
    polySynth,polySynth2,
    myceliumCanvas,mushroomCanvas,limboCanvas,profileCanvas,
    selector,mythProfile,toAdd=0,
    profileBodyRatio,profileHeadRatio,
    selectorAngle=0,
    selectorIndex=0,
    runningSimulation,
    sound=1,
    oldWidth,
    darkTheme=0
function preload(){
    data=loadJSON('../data/myths-i-feed.json',data=>{
        progenitors=data.progenitors
        for (let p of progenitors){
            for (let part of parts){
                if (p[part].count==0) p[part].img=null
                else p[part].img=loadImage(`../images/myths-i-feed/${p.name}/${part}.png`)
            }
        }
    })
    soundFormats('mp3')
}
function setup(){
    setDimensions()
    runningSimulation=smallScreen?1:0
    for (let i=0; i<mushroomCapLayers; i++){
        let r=mushroomCapColor[0]-i*12,
            g=mushroomCapColor[1]-i*12,
            b=mushroomCapColor[2]+i*12,
            a=mushroomCapColor[3]+i*10
        mushroomCapFill.push([r,g,b,a])
    }
    createCanvas(windowWidth,windowHeight,select('canvas#myths-canvas').elt)
    imageMode(CENTER)
    ellipseMode(RADIUS)
    noStroke()
    textSize(14)
    textAlign(CENTER,CENTER)
    polySynth=new p5.PolySynth()
    polySynth2=new p5.PolySynth()

    myceliumCanvas=createGraphics(width,height,select('canvas#mycelium-canvas').elt)
    myceliumCanvas.background(bgColor)
    myceliumCanvas.ellipseMode(RADIUS)
    myceliumCanvas.rectMode(RADIUS)
    myceliumCanvas.textAlign(CENTER,CENTER)
    myceliumCanvas.textSize(20)
    myceliumCanvas.strokeWeight(.5)

    mushroomCanvas=createGraphics(width,height,select('canvas#mushroom-canvas').elt)
    mushroomCanvas.ellipseMode(RADIUS)
    mushroomCanvas.stroke(mushroomCapStroke)

    limboCanvas=createGraphics(width,height,select('canvas#limbo-canvas').elt)
    limboCanvas.imageMode(CENTER)
    limboCanvas.ellipseMode(RADIUS)
    limboCanvas.noStroke()

    const profile=select('#profile'),
        profileWidth=+profile.style('width').split('px')[0]
    profileCanvas=createGraphics(profileWidth,height,select('canvas#profile-canvas').elt)
    profileCanvas.imageMode(CENTER)
    profileCanvas.stroke(chainColor)
    if (smallScreen) profileCanvas.strokeWeight(1.5)
    else profileCanvas.strokeWeight(2)
    profileCanvas.noFill()

    selector=select('#selector')
    sineTable=new SineTable()
    profileEngine=Engine.create()
    profileEngine.gravity.scale=.003

    brain=new Brain()
    const marginX=width/(initMythCount+1)
    let toShow=[]
    for (let i=0; i<initMythCount; i++){
        const toPick=progenitors.filter(p=>!toShow.includes(p)),
            p=random(toPick)
        toShow.push(p)
        const myth=new Myth(
            marginX+marginX*i,
            height*random(.35,.65),
            p.name
        )
        myth.phenotype()
        myth.addToWorld(brain.engine)
        brain.myths.push(myth)
    }
    if (!runningSimulation&&!selector.hasClass('hidden')){
        mythProfile=new Myth(
            profileCanvas.width/2,
            profileCanvas.height/2,
            progenitors[0].name
        )
        mythProfile.generateSample()
        mythProfile.addToWorld(profileEngine)
    }
    setupElements()
}
function setDimensions(){
    smallScreen=windowWidth<505
    oldWidth=windowWidth
    initMythCount=round(map(windowWidth,300,1920,3,5,true))
    maxMyths=round(map(windowWidth,300,1920,15,25))
    mythMass=round(map(windowWidth,300,800,1.8,1,true),1)
    maxHyphae=round(map(windowWidth,300,1920,100,300,true))
    maxMushrooms=round(map(windowWidth,300,1920,60,120,true))
    maxDroppings=round(map(windowWidth,300,1920,50,150,true))
    droppingMaxRadius=map(windowWidth,300,1920,2,4,true)
    chainLinkCount=round(map(windowHeight,660,1080,14,22))
    chainLinkWidth=map(windowHeight,660,1080,6,10,true)
    chainLinkHeight=round(chainLinkWidth*1.3)
    chainLinkHalfH=chainLinkHeight/2
    chainLinkHalfW=chainLinkWidth/2
    mushroomMinCap=smallScreen?4:6
    mushroomMaxCap=smallScreen?12:15
    minFruitingDensity=smallScreen?10:15
    mushroomMinHeight=smallScreen?20:40
    mushroomMaxHeight=smallScreen?90:110
    mushroomAvgHeight=(mushroomMaxHeight-mushroomMinHeight)*.6+mushroomMinHeight
    eatingRadius=smallScreen?20:40
    profileMargin=smallScreen?10:80
    profileHeadRatio=map(windowWidth,505,1920,.7,1.3,true)
    profileBodyRatio=map(windowWidth,505,1920,1.15,1.5,true)
    bodySizeRatio=map(windowWidth,300,1920,.6,1,true)
    centerScreen=createVector(windowWidth/2,windowHeight/2)
}
function setupElements(){
    const delta=360/progenitors.length,
        selectorWheel=select('#selector .wheel'),
        profileDescWrapper=select('#profile .desc-wrapper'),
        topButton=select('#selector .button.top'),
        bottomButton=select('#selector .button.bottom'),
        pinButton=select('#selector .button.pin'),
        body=select('body'),
        intro=select('#intro'),
        nav=select('nav'),
        navAbout=select('nav .about'),
        navModes=selectAll('nav .mode'),
        navSounds=selectAll('nav .sound'),
        navAddMyths=select('nav .myths'),
        navAddNew=select('nav .add-new'),
        navNowCount=select('nav .now .count'),
        navAddCount=select('nav .adding .count'),
        navAddMax=select('nav .adding .max'),
        notesAddMax=select('#selector .notes .add-max'),
        navAddNow=select('nav .add-now'),
        navClearAll=select('nav .clear-all'),
        controls=select('#controls'),
        modeSoundDesktop=select('nav .mode-sound.desktop'),
        scrambleButton=select('#controls .scramble'),
        eraseButton=select('#controls .erase'),
        addRandomButton=select('#controls .random')
    if (smallScreen){
        select('nav .add-tally').addClass('big-texts')
    }
    select('#selector .notes .max').html(maxMyths)
    navAddMax.html(maxMyths-initMythCount)
    progenitors.forEach((p,i)=>{
        const mythWrapper=createDiv(),
            mythName=createP(p.title),
            mythDesc=createP(p.desc)
        mythWrapper.parent(selectorWheel)
            .addClass('myth-wrapper')
            .addClass(p.name)
            .style('transform',`translateY(-50%) rotate(${delta*(i)}deg)`)
        if (i==selectorIndex) mythWrapper.addClass('selected')
        mythName.parent(mythWrapper)
            .addClass('myth-name')
        mythDesc.parent(profileDescWrapper)
            .addClass('myth-desc')
        if (i!=selectorIndex) mythDesc.addClass('hidden')
    })
    topButton.mouseClicked(()=>{
        selectorAngle+=delta
        selectorIndex--
        if (selectorIndex<0) selectorIndex=progenitors.length-1
        updateWheel()
    })
    bottomButton.mouseClicked(()=>{
        selectorAngle-=delta
        selectorIndex++
        if (selectorIndex>progenitors.length-1) selectorIndex=0
        updateWheel()
    })
    function updateWheel(){
        selectorWheel.style('transform',`rotate(${selectorAngle}deg)`)
        selectAll('.myth-wrapper').forEach((m,i)=>{
            if (i==selectorIndex) m.addClass('selected')
            else m.removeClass('selected')
        })
        selectAll('.myth-desc').forEach((d,i)=>{
            if (i==selectorIndex) d.removeClass('hidden')
            else d.addClass('hidden')
        })

        const showing=progenitors[selectorIndex]
        mythProfile.removeFromWorld(profileEngine)
        mythProfile=new Myth(
            profileCanvas.width/2,
            profileCanvas.height/2,
            showing.name
        )
        mythProfile.generateSample()
        mythProfile.addToWorld(profileEngine)
    }
    navAbout.mouseClicked(()=>{
        navAbout.toggleClass('selected')
        if (navAbout.hasClass('selected')) {
            if (body.hasClass('dark')) nav.removeClass('light-texts')
            intro.removeClass('hidden')
            selector.addClass('hidden')
            modeSoundDesktop.addClass('hidden')
            controls.addClass('hidden')
            navAddMyths.removeClass('selected')
                .html('+Myths')
            navAddNew.addClass('hidden')
            navAddNow.addClass('hidden')
            navClearAll.addClass('hidden')
            runningSimulation=0
            setThemeColor()
        } else {
            if (body.hasClass('dark')) nav.addClass('light-texts')
            intro.addClass('hidden')
            modeSoundDesktop.removeClass('hidden')
            controls.removeClass('hidden')
            userStartAudio()
            runningSimulation=1
            setThemeColor()
        }
    })
    select('#intro .close.button').mouseClicked(()=>{
        intro.addClass('hidden')
        modeSoundDesktop.removeClass('hidden')
        controls.removeClass('hidden')
        navAbout.removeClass('selected')
        if (body.hasClass('dark')) nav.addClass('light-texts')
        runningSimulation=1
        userStartAudio()
        setThemeColor()
        if (!getItem('visited')){
            storeItem('visited',true)
            const delay=smallScreen?0:10000
            setTimeout(()=>{
                navAddMyths.addClass('pop')
            },delay)
        }
    })
    navAddMyths.mouseClicked(()=>{
        navAddMyths.toggleClass('selected')
        if (navAddMyths.hasClass('selected')){
            if (mythProfile) mythProfile.removeFromWorld(profileEngine)
            mythProfile=new Myth(
                profileCanvas.width/2,
                profileCanvas.height/2,
                progenitors[selectorIndex].name
            )
            mythProfile.generateSample()
            mythProfile.addToWorld(profileEngine)
            navAddNew.removeClass('hidden')
            navAddNow.removeClass('hidden')
            navNowCount.html(brain.myths.length)
            navAddCount.html(toAdd)
            navAddMax.html(maxMyths-brain.myths.length)
            notesAddMax.html(maxMyths-brain.myths.length)
            navClearAll.removeClass('hidden')
            selector.removeClass('hidden')
            if (body.hasClass('dark')) nav.removeClass('light-texts')
            intro.addClass('hidden')
            controls.addClass('hidden')
            navAbout.removeClass('selected')
            navAddMyths.html('←Back').removeClass('pop')
            modeSoundDesktop.removeClass('hidden')
            if (!runningSimulation) {
                runningSimulation=1
                redraw()
            }
            runningSimulation=0
            setThemeColor()
        } else {
            selector.addClass('hidden')
            controls.removeClass('hidden')
            if (body.hasClass('dark')) nav.addClass('light-texts')
            navAddMyths.html('+Myths')
            navAddNew.addClass('hidden')
            navAddNow.addClass('hidden')
            navClearAll.addClass('hidden')
            modeSoundDesktop.removeClass('hidden')
            userStartAudio()
            runningSimulation=1
            setThemeColor()
        }
    })
    const leftX=width*.1,
        rightX=width*.5,
        topY=height*.2,
        bottomY=height*.8,
        updateCountDisplay=()=>{
            navAddCount.html(toAdd)
            if (toAdd==0){
                navAddNew.removeClass('selected')
                navAddNow.removeClass('selected')
                navClearAll.removeClass('selected')
            } else if (toAdd>0) {
                navAddNew.addClass('selected')
                navAddNow.addClass('selected')
                navClearAll.addClass('selected')       
            }
        }
    const leftHeadX=+select('.home.button').style('padding').split(' ')[1].split('px')[0],
        topHeadY=125
    let headX=leftHeadX, headY=topHeadY
    pinButton.mouseClicked(()=>{
        if (toAdd==maxMyths-brain.myths.length) return
        const p=progenitors[selectorIndex],
            head=createDiv(),
            xButton=createDiv('×'),
            pHeadW=p.head.img.width*profileHeadRatio,
            pHeadH=p.head.img.height*profileHeadRatio,
            px=smallScreen?headX:random(leftX,rightX),
            py=smallScreen?headY-pHeadH/2:random(topY,bottomY)
        if (smallScreen){
            headX+=pHeadW
            if (headX>windowWidth-pHeadW) {
                headX=leftHeadX
                headY+=pHeadH
            }
        }
        head.parent(selector)
            .addClass('myth-head')
            .attribute('name',`${p.name}`)
            .position(px,py)
            .size(pHeadW,pHeadH)
            .style('background-image',`url("../images/myths-i-feed/${p.name}/head.png")`)
            .draggable()
        setTimeout(()=>{
            xButton.parent(head)
                .addClass('delete button')
                .mouseClicked(()=>{
                    head.remove()
                    toAdd--
                    if (smallScreen){
                        const lastHead=selectAll('.myth-head').slice(-1)[0]
                        if (lastHead){
                            headX=lastHead.position().x+lastHead.size().width
                            headY=lastHead.position().y+lastHead.size().height/2
                            if (headX>windowWidth-lastHead.size().width) {
                                headX=leftHeadX
                                headY+=lastHead.size().height
                            }
                        } else {
                            headX=leftHeadX
                            headY=topHeadY
                        }
                    }
                    updateCountDisplay()
            })
        },80)
        toAdd++
        updateCountDisplay()
    })
    navClearAll.mouseClicked(()=>{
        selectAll('.myth-head').forEach(h=>h.remove())
        toAdd=0
        headX=leftHeadX
        headY=topHeadY
        updateCountDisplay()
    })
    navAddNow.mouseClicked(()=>{
        selectAll('.myth-head').forEach((h,i)=>{
            const x=smallScreen
                    ?width*random(.1,.9)
                    :h.position().x+h.size().width/2,
                y=smallScreen
                    ?height*random(.1,.9)
                    :h.position().y+h.size().height/2,
                name=h.attribute('name')
            const myth=new Myth(x,y,name)
            myth.phenotype()
            myth.addToWorld(brain.engine)
            brain.myths.push(myth)
            h.remove()
        })
        selector.addClass('hidden')
        navAddMyths.removeClass('selected').html('+Myths')
        navAddNew.addClass('hidden')
        navAddNow.addClass('hidden').removeClass('selected')
        navClearAll.addClass('hidden').removeClass('selected')
        controls.removeClass('hidden')
        if (body.hasClass('dark')) nav.addClass('light-texts')
        userStartAudio()
        runningSimulation=1
        toAdd=0
        headX=leftHeadX
        headY=topHeadY
        setThemeColor()
    })
    select('#selector .notes .close').mouseClicked(()=>{
        select('#selector .notes').hide()
    })
    scrambleButton.mouseClicked(()=>{
        let newMyths=[]
        for (let i=0; i<brain.myths.length; i++){
            const parent1=brain.myths[i],
                others=brain.myths.filter(m=>m!=parent1),
                parent2=random(others),
                child=parent1.mateWith(parent2)
            newMyths.push(child)
        }
        for (let i=0; i<newMyths.length; i++){
            brain.myths[i].removeFromWorld(brain.engine)
            brain.myths[i]=newMyths[i]
            brain.myths[i].phenotype()
            brain.myths[i].addToWorld(brain.engine)
        }
    })
    eraseButton.mouseClicked(()=>{
        brain.myths.forEach(m=>m.removeFromWorld(brain.engine))
        brain.myths=[]
    })
    addRandomButton.mouseClicked(()=>{
        if (brain.myths.length>=maxMyths) return
        const p=random(progenitors),
            myth=new Myth(
                width*random(.1,.9),
                height*random(.2,.8),
                p.name
            )
        myth.phenotype()
        myth.addToWorld(brain.engine)
        brain.myths.push(myth)
    })
    navModes.forEach(e=>{
        e.mouseClicked(()=>{
            body.toggleClass('dark')
            darkTheme=body.hasClass('dark')
            e.html(darkTheme?'Night':'Day')
            if (!controls.hasClass('hidden')) // controls shown = intro & myths selector closed
                nav.toggleClass('light-texts')
            setThemeColor()
        })
    })
    navSounds.forEach(e=>{
        e.mouseClicked(()=>{
            if (sound) {sound=0; e.addClass('off')}
            else {sound=1; e.removeClass('off')}
        })
    })
    function setThemeColor(){
        if (darkTheme&&(!intro.hasClass('hidden')||!selector.hasClass('hidden'))) theme.setAttribute('content',themeColor3)
        else if (darkTheme) theme.setAttribute('content',themeColor4)
        else if (!darkTheme&&!selector.hasClass('hidden')) theme.setAttribute('content',themeColor2)
        else theme.setAttribute('content',themeColor1)
    }
}
function draw(){
    if (runningSimulation) {
        // if (keyIsDown(68)){
        //     brain.dreads[0].growFeathers()
        // } else if (keyIsDown(65)){
        //     brain.dreads[0].dropFeathers()
        // } else if (keyIsDown(87)){
        //     brain.dreads[0].growWings()
        // } else if (keyIsDown(83)){
        //     brain.dreads[0].dropWings()
        // }
        for (let i=0; i<1; i++){
            Engine.update(brain.engine)
            clear()
            limboCanvas.clear()
            if (frameCount%60<20) myceliumCanvas.background(...bgColor,5)
            brain.updateQuadTrees()
            brain.updateMyths()
            if (!brain.fullOf('myths')) brain.breedMyths()
            brain.updateMycelium()
            if (!brain.fullOf('hyphae')) brain.growNetwork()
            brain.updateMushrooms()
            if (!brain.fullOf('mushrooms')&&frameCount>300) brain.sproutMushrooms()
            brain.updateDroppings()
            // brain.updateDreads()
        }
    } else if (!selector.hasClass('hidden')){
        Engine.update(profileEngine)
        profileCanvas.clear()
        mythProfile.showSample()
    } 
}
function windowResized(){
    if (oldWidth==windowWidth) return
    setDimensions()
    resizeCanvas(windowWidth,windowHeight)
    myceliumCanvas.resizeCanvas(width,height)
    mushroomCanvas.resizeCanvas(width,height)
    limboCanvas.resizeCanvas(width,height)
    const profileWidth=+select('#profile').style('width').split('px')[0]
    profileCanvas.resizeCanvas(profileWidth,height)
    if (smallScreen) profileCanvas.strokeWeight(1.5)
    else profileCanvas.strokeWeight(2)
    if (!runningSimulation&&!selector.hasClass('hidden')){
        mythProfile=new Myth(
            profileCanvas.width/2,
            profileCanvas.height/2,
            progenitors[0].name
        )
        mythProfile.generateSample()
        mythProfile.addToWorld(profileEngine)
    }
}
class Brain {
    constructor(){
        this.myths=[]
        this.mushrooms=[] // eaten by myths, produced by mycelium
        this.mycelium=new Mycelium()
        this.droppings=[] // eaten my mycelium, produced by myths
        for (let i=0; i<50; i++){
            this.droppings.push(new Dropping(
                random(0,width),
                random(0,height)
            ))
        }
        this.dim={
            w:200, h:500,
            topY:75, botY:height-125,
            leftX:0, rightX:width,
            gapX:50
        }
        // this.dreads=[]
        // this.dreads.push(new Dread('banana',centerScreen))

        // setup physics canvas
        this.engine=Engine.create()
        this.engine.gravity.scale=gravity
        // add ceiling, floor, side walls of physics canvas
        const boundOptions={
            isStatic:true,
            restitution:1
        }
        bounds.push(Bodies.rectangle(width/2,-15,width,30,boundOptions))
        bounds.push(Bodies.rectangle(width/2,height+15,width,30,boundOptions))
        bounds.push(Bodies.rectangle(-15,height/2,30,height,boundOptions))
        bounds.push(Bodies.rectangle(width+15,height/2,30,height,boundOptions))
        for (let bound of bounds) Composite.add(this.engine.world,bound)
    }
    empty(){
        return !this.myths.length
            && !this.mushrooms.length
            && !this.mycelium.hyphae.length
    }
    updateQuadTrees(){
        if (!this.worldQuadTree) {
            this.worldQuadTree=new QuadTree()
            this.myceliumQuadTree=new QuadTree()
        }
        else {
            this.worldQuadTree.clear()
            this.myceliumQuadTree.clear()
        }
        for (let myth of this.myths)
            this.worldQuadTree.insert(myth)
        for (let mushroom of this.mushrooms)
            this.worldQuadTree.insert(mushroom)
        // for (let dread of this.dreads)
        //     this.worldQuadTree.insert(dread)
        for (let hypha of this.mycelium.hyphae)
            this.myceliumQuadTree.insert(hypha)
        for (let dropping of this.droppings)
            this.myceliumQuadTree.insert(dropping)
    }
    updateMyths(){
        for (let myth of this.myths){
            if (myth.isFit){
                const mushrooms=myth.seekFood()
                if (mushrooms) myth.eat(mushrooms)
                myth.wiggle()
                myth.avoidCrowd()
                myth.avoidEdges()
                // myth.fleeDreads()
                if (random()<.005){
                    const droppings=myth.excrete()
                    this.droppings.push(...droppings)
                }
            } else if (myth.lastDitch){
                const mushrooms=myth.seekFood()
                if (mushrooms) myth.eat(mushrooms)
            }
            myth.update()
            if (myth.life<=0) {
                const droppings=myth.decompose()
                this.droppings.push(...droppings)
                myth.removeFromWorld(brain.engine)
            }
        }
        this.myths=this.myths.filter(m=>m.life>0)
        for (let myth of this.myths) myth.showBackAccessory()
        for (let myth of this.myths) myth.show()
    }
    breedMyths(){
        let newMyths=[]
        shuffle(this.myths)
        for (let myth of this.myths){
            if (this.myths.length+newMyths.length>=maxMyths) break
            const partner=myth.seekMate()
            if (!partner) continue
            const child=myth.mateWith(partner)
            child.phenotype()
            child.addToWorld(brain.engine)
            newMyths.push(child)
        }
        this.myths.push(...newMyths)
    }
    updateMycelium(){
        for (let hypha of this.mycelium.hyphae){          
            // const neighbors=this.myceliumQuadTree.getNeighbors(hypha)
            const neighbors=this.myceliumQuadTree.getNeighborsInRange(hypha.fieldOfView)
            if (neighbors){
                const hyphae=neighbors.filter(n=>n.type=='hypha'),
                    droppings=neighbors.filter(n=>n.type=='dropping')
                if (hyphae.length) {
                    hypha.swarm(hyphae)
                    hypha.neighborsDensity=hyphae.length
                }
                if (droppings.length) hypha.seekFood(droppings)
            }
            hypha.update()
            hypha.show()
        }
        this.mycelium.hyphae=this.mycelium.hyphae.filter(hypha=>hypha.life>0)
    }
    growNetwork(){
        for (let hypha of this.mycelium.hyphae){
            if (this.fullOf('hyphae')||!hypha.targeting) break
            if (random(1)<.005)
                this.mycelium.branchAt(hypha.position.x,hypha.position.y)
        }
    }
    updateMushrooms(){
        for (let mushroom of this.mushrooms) {
            mushroom.update()
            if (this.fullOf('hyphae')||mushroom.life>0||mushroom.eaten) continue
            const newHyphae=mushroom.burst()
            for (let hypha of newHyphae) {
                this.mycelium.hyphae.push(hypha)
                if (this.fullOf('hyphae')) break
            }
        }
        this.mushrooms=this.mushrooms.filter(mushroom=>mushroom.life>0)
    }
    sproutMushrooms(){
        for (let hypha of this.mycelium.hyphae){
            if (this.fullOf('mushrooms')) break
            if (hypha.position.y<150||hypha.life<=0) continue
            let fruitingProba=constrain(hypha.neighborsDensity/50,0,1)
            fruitingProba**=5
            if (random(1)>=fruitingProba) continue
            this.fruitingAt(hypha.position)
            hypha.life=0
        }
    }
    fruitingAt(position){
        this.mushrooms.push(new Mushroom(position))
    }
    updateDroppings(){
        for (let dropping of this.droppings) dropping.update()
        this.droppings=this.droppings.filter(d=>d.life>0)
        if (this.fullOf('droppings'))
            this.droppings.splice(0,this.droppings.length-maxDroppings)
    }
    // updateDreads(){
    //     textSize(14)
    //     textAlign(CENTER,CENTER)
    //     fill(dreadColor)
    //     for (let dread of this.dreads) {
    //         dread.wander()
    //         dread.avoidEdges()
    //         dread.update()
    //         dread.show()
    //     }
    // }
    fullOf(type){
        switch (type) {
            case 'myths':
                return this.myths.length>=maxMyths
            case 'hyphae':
                return this.mycelium.hyphae.length>=maxHyphae
            case 'mushrooms':
                return this.mushrooms.length>=maxMushrooms
            case 'droppings':
                return this.droppings.length>=maxDroppings
            default:
                print('type must be myths, hyphae, mushrooms, or droppings.')
                break
        }
    }
}

class Myth {
    constructor(x,y,progenitor=null){
        this.type='myth'
        this.id=uniqueID++
        this.position=createVector(x,y) // position of torso
        this.velocity=createVector() // velocity of anchor attached to head
        this.acceleration=createVector() // acceleration force applied on anchor
        this.maxSpeed=5 // max speed of anchor
        this.progenitor=progenitor // if null, is offspring
        this.dna=[]
        this.anatomy={}
        this.bodies=[] // physics bodies
        this.constraints=[]
        this.viewRadiusSq=mythViewRadius**2
        this.fieldOfView={
            lx:this.position.x-mythViewRadius,
            rx:this.position.x+mythViewRadius,
            ty:this.position.y-mythViewRadius,
            by:this.position.y+mythViewRadius
        }
        this.isFit=1
        this.lastDitch=0
    }
    getBodies(part){
        return this.bodies.filter(b=>b.label.split('_')[1]==part)
    }
    physicsBodies(){
        let properties={
            mass:mythMass,
            restitution:1,
            frictionAir:.02,
            slop:3, // margin (px) around body allowed to sink into another
        }
        parts.forEach((part,i)=>{
            const count=this.anatomy[part].count
            if (part!='back'&&count>0){
                properties.label=this.id+'_'+part
                properties.collisionFilter={ group:-(this.id+1)*(i+1)} // same parts (e.g. legs) don't collide with each other
                for (let j=0; j<count; j++){
                    const body=Bodies.rectangle(
                        this.position.x,this.position.y,
                        this.anatomy[part].width*.9,
                        this.anatomy[part].height*.9,
                        properties
                    )
                    this.bodies.push(body)
                }
            }
        })
        // make constraints
        const stiffness=.5,
            damping=.1,
            length=0
        // join heads to torso
        this.torso=this.getBodies('torso')[0]
        this.heads=this.getBodies('head')
        this.headCount=this.anatomy.head.count
        const headMargin=this.anatomy.head.width*.35,
            headsRange=(this.headCount-1)*headMargin,
            headStartX=-headsRange/2
        for (let i=0; i<this.headCount; i++){
            const constraint=Constraint.create({
                bodyA:this.heads[i],
                bodyB:this.torso,
                pointA:{x:0,y:this.anatomy.head.height/2},
                pointB:{x:headStartX+i*headMargin,y:-this.anatomy.torso.width/2},
                label:'joint',
                stiffness,
                damping,
                length
            })
            this.constraints.push(constraint)
        }
        // join arms to torso
        this.arms=this.getBodies('arm')
        const armMargin=this.anatomy.arm.height*.2
        for (let i=0; i<this.anatomy.arm.count; i++){
            let pAx=this.anatomy.arm.width/2,
                pBx=-this.anatomy.torso.width/2,
                pBy=-this.anatomy.torso.height/2+this.anatomy.arm.height/2
                    +floor(i/2)*armMargin
            if (i%2) {pAx*=-1; pBx*=-1}
            const constraint=Constraint.create({
                bodyA:this.arms[i],
                bodyB:this.torso,
                pointA:{x:pAx,y:0},
                pointB:{x:pBx,y:pBy},
                label:'joint',
                stiffness,
                damping,
                length
            })
            this.constraints.push(constraint)
        }
        // join legs to torso
        this.legs=this.getBodies('leg')
        const legMargin=this.anatomy.leg.width*.2
        for (let i=0; i<this.anatomy.leg.count; i++){
            let pAy=-this.anatomy.leg.height/2,
                pBx=i%2
                    ?this.anatomy.leg.width*.3+floor(i/2)*legMargin
                    :-this.anatomy.leg.width/2-floor(i/2)*legMargin,
                pBy=this.anatomy.torso.height/2
            if (this.anatomy.leg.count==1) pBx=0
            const constraint=Constraint.create({
                bodyA:this.legs[i],
                bodyB:this.torso,
                pointA:{x:0,y:pAy},
                pointB:{x:pBx,y:pBy},
                label:'joint',
                stiffness,
                damping,
                length
            })
            this.constraints.push(constraint)
        }

        this.headRadius=max([this.anatomy.head.width,this.anatomy.head.height])/2
        this.headRadiusSq=this.headRadius**2
    }
    phenotype(){
        // anatomy materials
        if (this.progenitor){
            // if is progenitor: 
            // 1-APPEARANCE: work backward from set body parts to genes
            //   each body part is determined by 2 numbers:
            //   a- looks of part: the progenitor's index in progenitors array (e.g. head looks like which progenitor's head)
            //   b- number of parts (e.g. having 0 or 1 or 2 heads)
            const p=progenitors.filter(p=>p.name==this.progenitor)[0]
            for (let part of parts){
                const {count,img}=p[part],
                    pi=progenitors.indexOf(p)
                this.anatomy[part]={
                    count,img,
                    pi:img?pi:null,
                    width:img?img.width*bodySizeRatio:null,
                    height:img?img.height*bodySizeRatio:null
                }
                
                this.dna.push(count)
                this.dna.push(count?pi:null)
            }
            // 2-initialize dna
            // randomize genes for lifespan, movements, mating time
            for (let i=0; i<6; i++) 
                this.dna.push(random(1))
        } else {
            // if not progenitor but offspring:
            // 1-APPEARANCE: map inherited genes to body parts
            parts.forEach((part,i)=>{
                const i0=i*2,
                    count=this.dna[i0],
                    pi=this.dna[i0+1], // index in progenitors array of progenitor from which body part comes
                    img=pi!=null?progenitors[pi][part].img:null
                this.anatomy[part]={
                    count,img,
                    pi:img?pi:null,
                    width:img?img.width*bodySizeRatio:null,
                    height:img?img.height*bodySizeRatio:null
                }
            })
        }
        // from randomized genes, devise
        // 2-LONGEVITY: natural lifepsan
        // 3-MOVEMENTS (for variability, not really for competitive advantages)
        //   a- max speed of head anchor when seeking food
        //   b- max force applied to head anchor steering away from big crowds
        //   c- speed of swinging limbs
        //   d- multiplier for force of swinging limbs
        this.life=mythLifespan*map(this.dna[notAppearanceGeneIndex],0,1,.8,1.2,true)
        this.lifeAtBirth=this.life
        this.seekFoodMaxSpeed=map(this.dna[notAppearanceGeneIndex+1],0,1,5,10,true)
        this.avoidCrowdMaxForce=map(this.dna[notAppearanceGeneIndex+2],0,1,.04,.1,true)
        this.swingSpeed=map(this.dna[notAppearanceGeneIndex+3],0,1,.015,.045,true)
        this.swingMultiplier=map(this.dna[notAppearanceGeneIndex+4],0,1,.005,.01,true)
        this.timeBetweenMating=timeBetweenMating*map(this.dna[+5],0,1,.2,1)
        
        this.physicsBodies()

        // attach anchor to head (pull anchor when directing head toward food)
        const middleHead=this.heads[floor(this.headCount/2)]
        this.anchor=Bodies.circle(
            middleHead.position.x,
            middleHead.position.y-this.anatomy.head.height/2,
            1,
            {label:'anchor',mass:1}
        )
        this.bodies.push(this.anchor)
        const anchorConstraint=Constraint.create({
            bodyA:this.anchor,
            bodyB:middleHead,
            pointB:{x:0,y:-this.anatomy.head.height/2},
            label:'anchor-constraint',
            stiffness:.1,
            length:1,
        })
        this.constraints.push(anchorConstraint)
    }
    generateSample(){
        const p=progenitors.filter(p=>p.name==this.progenitor)[0]
        for (let part of parts){
            const {count,img}=p[part]
            this.anatomy[part]={
                count,img,
                width:img?img.width*profileBodyRatio:null,
                height:img?img.height*profileBodyRatio:null
            }
        }
        this.physicsBodies()

        const boundedWidth=profileCanvas.width-profileMargin*2,
            xOuterLeft=profileMargin, xOuterRight=profileCanvas.width-profileMargin,
            xMarginArm=this.arms.length==1?0:boundedWidth/(this.arms.length-1),
            xMarginLeg=this.legs.length==1?boundedWidth:boundedWidth/(this.legs.length-1),
            properties={
                label:'link',
                density:.01,
                collisionFilter:{
                    mask:0
                }
            }
        this.arms.forEach((arm,i)=>{
            let pAx=i%2?xOuterRight-xMarginArm*floor(i/2)
                    :xOuterLeft+xMarginArm*floor(i/2),
                pBx=-this.anatomy.arm.width/2
            if (i%2) pBx*=-1
            let chain=[],
                multiplier=i%2?-1:1
            for (let j=0;j<chainLinkCount-1;j++){
                const link= Bodies.rectangle(
                    pAx+j*chainLinkWidth*multiplier,
                    j*chainLinkHeight,
                    chainLinkWidth,chainLinkHeight,
                    properties
                )
                chain.push(link)
                this.bodies.push(link)
            }
            for (let j=0; j<=chain.length; j++){
                const armChain=Constraint.create({
                    bodyA:j>0?chain[j-1]:null,
                    pointA:j>0?{x:0,y:chainLinkHalfH}:{x:pAx,y:0},
                    bodyB:j<chain.length?chain[j]:arm,
                    pointB:j<chain.length?{x:0,y:-chainLinkHalfH}:{x:pBx,y:0},
                    label:'chain',
                    length:0,
                    stiffness:.8
                })
                this.constraints.push(armChain)
            }
        })
        this.legs.forEach((leg,i)=>{
            let loop=this.legs.length==1?2:1
            for (let n=0; n<loop; n++){
                let chain=[],
                    pAx=i%2?xOuterRight-xMarginLeg*(floor(i/2)+n)
                            :xOuterLeft+xMarginLeg*(floor(i/2)+n),
                    pBx=this.legs.length>1?0
                        :n==0?-this.anatomy.leg.width/2
                        :this.anatomy.leg.width/2,
                    multiplier=i%2?-1:1
                for (let j=0;j<chainLinkCount;j++){
                    const link= Bodies.rectangle(
                        pAx+j*chainLinkWidth*multiplier,
                        height-j*chainLinkHeight,
                        chainLinkWidth,chainLinkHeight,
                        properties
                    )
                    chain.push(link)
                    this.bodies.push(link)
                }
                for (let j=0; j<=chain.length; j++){
                    const legChain=Constraint.create({
                        bodyA:j>0?chain[j-1]:null,
                        pointA:j>0?{x:0,y:-chainLinkHalfH}:{x:pAx,y:height},
                        bodyB:j<chain.length?chain[j]:leg,
                        pointB:j<chain.length?{x:0,y:chainLinkHalfH}:{x:pBx,y:this.anatomy.leg.height/2},
                        label:'chain',
                        length:0,
                        stiffness:.8
                    })
                    this.constraints.push(legChain)
                }
            }
        })
    }
    addToWorld(engine){
        for (let body of this.bodies)
            Composite.add(engine.world,body)
        for (let constraint of this.constraints)
            Composite.add(engine.world,constraint)
    }
    removeFromWorld(engine){
        for (let body of this.bodies)
            Composite.remove(engine.world,body)
        for (let constraint of this.constraints)
            Composite.remove(engine.world,constraint)
    }
    update(){
        if (this.life>0) this.life-=mythLifeLossSpeed
        this.timeBetweenMating--
        // calculte if fit for full movements & breeding
        this.isFit=this.life>=mythWeaknessThreshold
        if (!this.isFit) {
            const movementProba=this.life/mythWeaknessThreshold
            this.lastDitch=random()<movementProba
        }
        if (this.newAnchorVelocity){
            this.newAnchorVelocity.limit(this.seekFoodMaxSpeed)
            Body.setVelocity(this.anchor,this.newAnchorVelocity)
        }
        if (this.isFit||(!this.isFit&&this.lastDitch)){
            Body.applyForce(this.anchor,this.anchor.position,this.acceleration)
            this.acceleration.mult(0)
        }
        this.position.x=this.torso.position.x
        this.position.y=this.torso.position.y
        this.velocity.x=this.anchor.velocity.x
        this.velocity.y=this.anchor.velocity.y
        // this.neighbors=brain.worldQuadTree.getNeighbors(this)
        this.neighbors=brain.worldQuadTree.getNeighborsInRange(this.fieldOfView)
    }
    wiggle(){
        const p=random(1),
            speed=frameCount*this.swingSpeed
        if (p>.5) return
        const arms=this.getBodies('arm'),
            armForce={
                x:0,
                y:sineTable.lookup(speed)*this.swingMultiplier
            }
        for (let arm of arms)
            Body.applyForce(arm,this.position,armForce)
        if (p>.1) return
        const legs=this.getBodies('leg'),
            legForce=sineTable.lookup(speed*3)*this.swingMultiplier*10
        for (let i=0; i<legs.length; i++){
            const force={
                x:i%2?legForce:-legForce,
                y:0
            }
            Body.applyForce(legs[i],this.position,force)
        }
    }
    headingToSideEdges(){
        return this.anchor.position.x<100&&this.velocity.x<0
            ||this.anchor.position.x>width-100&&this.velocity.x>0
    }
    headingToTopBotEdges(){
        return this.anchor.position.y<100&&this.velocity.y<0
            ||this.anchor.position.y>height-100&&this.velocity.y>0
    }
    avoidEdges(){
        if (!this.headingToSideEdges()&&!this.headingToTopBotEdges()) return
        let force=this.velocity.copy()
        if (this.headingToSideEdges()) force.x*=-1
        if (this.headingToTopBotEdges()) force.y*=-1
        force.limit(this.maxSpeed)
            .sub(this.velocity)
            .limit(.03)
        this.acceleration.add(force)
    }
    avoidCrowd(){
        if (!this.neighbors) return
        let otherMyths=this.neighbors.filter(n=>n.type=='myth'&&n!=this)
        if (!otherMyths.length) return
        let force=createVector(),
            count=0
        for (let other of otherMyths){
            const v=V.sub(this.position,other.position),
                distanceSq=v.magSq()
            if (distanceSq>50000) continue
            force.add(v)
            count++
        }
        if (count<3) return
        force.div(count)
            .limit(this.maxSpeed)
            .sub(this.velocity)
            .limit(this.avoidCrowdMaxForce)
        this.acceleration.add(force)
    }
    seekFood(){
        if (!this.neighbors) return
        let mushrooms=this.neighbors.filter(n=>n.type=='mushroom'&&n.grown)
        if (!mushrooms.length) return
        let shortestSq=Infinity
        // anchor's main job is to pull creature toward food,
        // hence calculating and setting the anchor's velocity
        // directly at each frame
        this.newAnchorVelocity=null
        if (mushrooms.length>=30){
            // target closest cluster of food
            const mushroomPositions=mushrooms.map(m=>m.position),
                [centroids,clusters]=KMeans(mushroomPositions,3)
            let clusterIndex
            for (let i=0; i<centroids.length; i++){ // head to closest food
                let centroid=centroids[i],
                    v=V.sub(centroid,this.position),
                    distanceSq=v.magSq()
                if (distanceSq>this.viewRadiusSq||distanceSq>=shortestSq) continue
                shortestSq=distanceSq
                this.newAnchorVelocity=v
                clusterIndex=i
            }
            if (shortestSq<1000){
                // if close to cluster, target random food in cluster
                const mushroomPosition=random(clusters[clusterIndex])
                this.newAnchorVelocity=V.sub(mushroomPosition,this.position)
            }
        } else {
            // target closest food
            for (let mushroom of mushrooms){ // head to closest food
                let v=V.sub(mushroom.position,this.position),
                    distanceSq=v.magSq()
                if (distanceSq>this.viewRadiusSq||distanceSq>=shortestSq) continue
                shortestSq=distanceSq
                this.newAnchorVelocity=v
            }
        }
        if (!this.newAnchorVelocity) return mushrooms
        return mushrooms
    }
    eat(mushrooms){
        // if any head is overlapped with food, eat that food
        let headPosition=createVector()
        for (let head of this.heads){
            for (let mushroom of mushrooms){
                headPosition.x=head.position.x
                headPosition.y=head.position.y
                const v=V.sub(mushroom.position,headPosition),
                    distanceSq=v.magSq()
                if (distanceSq>mushroom.radiusSq+this.headRadiusSq) continue
                this.life+=mushroom.life
                mushroom.life=0
                mushroom.eaten=1
                fill(eatingColor)
                ellipse(mushroom.position.x,mushroom.position.y,eatingRadius)
                if (random()>=.3||!sound) continue
                const note=mushroom.pitch+'4', // octave 3 = low frequency sounds
                    volume=map(this.radius,mushroomMinCap,mushroomMaxCap,.8,1),
                    duration=.05
                polySynth2.play(note,volume,0,duration)
            }
        }
    }
    excrete(){
        let droppings=[]
        for (let i=0; i<5; i++){
            this.life-=mythLifeLossSpeed
            const x=this.position.x+random(-50,50),
                y=this.position.y+random(-50,50)
            droppings.push(new Dropping(x,y))
        }
        return droppings
    }
    decompose(){
        let droppings=[]
        const count=round(this.lifeAtBirth/droppingLifespan)
        for (let i=0; i<count; i++){
            const x=this.position.x+random(-50,50),
                y=this.position.y+random(-50,50)
            droppings.push(new Dropping(x,y))
        }
        return droppings
    }
    // fleeDreads(){
    //     if (!this.neighbors) return
    //     const dreads=this.neighbors.filter(n=>n.type=='dread')
    //     if (!dreads.length) return
    //     let force=createVector(),
    //         count=0
    //     for (let dread of dreads){
    //         const v=V.sub(this.position,dread.position),
    //             distanceSq=v.magSq()
    //         if (distanceSq>dread.radiusSq+32000) continue
    //         force.add(v)
    //         count++
    //     }
    //     if (!count) return
    //     force.div(count)
    //         .limit(this.maxSpeed)
    //         .sub(this.velocity)
    //         .limit(.1)
    //     this.acceleration.add(force)
    // }
    seekMate(){
        if (this.timeBetweenMating>0||!this.neighbors) return
        const matingProba=map(this.life,0,mythLifespan,0,.95,true)**2
        if (random(1)>matingProba) return
        let potentialMates=this.neighbors.filter(n=>n.type=='myth'&&n!=this&&n.isFit)
        potentialMates.sort((a,b)=>{
            let aV=V.sub(a.position,this.position),
                aDSq=aV.magSq(),
                bV=V.sub(b.position,this.position),
                bDSq=bV.magSq()
            return aDSq-bDSq
        })
        const mate=potentialMates[0]
        return mate
    }
    mateWith(partner){
        let newDNA=[],
            a=constrain(this.life,0,mythLifespan),
            b=constrain(partner.life,0,mythLifespan),
            proba=a/(a+b) // favor genes of the stronger mate
        for (let i=0; i<this.dna.length; i++){
            let gene
            const p=random(1)
            if (p<proba) gene=this.dna[i]
            else gene=partner.dna[i]
            const p2=random(1)
            if (i<notAppearanceGeneIndex&&p2<=mutationRateAppearance) { // is appearance gene
                if (i%2==0){ // allow mutation for number of body parts only
                    const partIndex=i/2,
                        min=minParts[partIndex],
                        max=maxParts[partIndex]
                    gene=round(random(min,max))
                }
            } else if (i>=notAppearanceGeneIndex&&p2<=mutationRateOther){
                gene=random(1)
            }
            newDNA.push(gene)
        }
        let childPosition=V.sub(centerScreen,this.position)
        childPosition.mult(.3).add(this.position)
        let child=new Myth(childPosition.x,childPosition.y)
        child.dna=newDNA
        this.timeBetweenMating=timeBetweenMating
        this.life*=(1-mythLifeLossFromBreedingRatio)
        return child
    }
    geneExpressed(part){
        return this.anatomy[part].count>0
            && this.anatomy[part].img!=null
    }
    showBackAccessory(){
        if (!this.geneExpressed('back')) return
        const p=this.torso.position,
            a=this.torso.angle
        if (this.life<mythWeaknessThreshold){
            limboCanvas.push()
            limboCanvas.translate(p.x,p.y)
            limboCanvas.rotate(a)
            limboCanvas.image(this.anatomy.back.img,0,0,this.anatomy.back.width,this.anatomy.back.height)
            limboCanvas.pop()
        } else {
            push()
            translate(p.x,p.y)
            rotate(a)
            image(this.anatomy.back.img,0,0,this.anatomy.back.width,this.anatomy.back.height)
            pop()
        }
    }
    show(){
        for (let part of parts){
            if (part=='back'||!this.geneExpressed(part)) continue
            const bodies=this.getBodies(part)
            for (let i=0; i<this.anatomy[part].count; i++){
                const p=bodies[i].position,
                    a=bodies[i].angle,
                    sx=part=='arm'&&i%2?-1:1
                if (this.life<mythWeaknessThreshold){
                    limboCanvas.push()
                    limboCanvas.translate(p.x,p.y)
                    limboCanvas.rotate(a)
                    limboCanvas.scale(sx,1)
                    limboCanvas.image(this.anatomy[part].img,0,0,this.anatomy[part].width,this.anatomy[part].height)
                    limboCanvas.pop()
                } else {
                    push()
                    translate(p.x,p.y)
                    rotate(a)
                    scale(sx,1)
                    image(this.anatomy[part].img,0,0,this.anatomy[part].width,this.anatomy[part].height)
                    pop()
                }
            }
        }
    }
    showSample(){
        for (let constraint of this.constraints){
            if (constraint.label!='chain') continue
            const a=Constraint.pointAWorld(constraint),
                b=Constraint.pointBWorld(constraint)
            profileCanvas.line(a.x,a.y,b.x,b.y)
        }
        for (let body of this.bodies){
            if (body.label!='link') continue
            profileCanvas.push()
            profileCanvas.translate(body.position.x,body.position.y)
            profileCanvas.rotate(body.angle)
            profileCanvas.line(chainLinkHalfW,-chainLinkHalfH,-chainLinkHalfW,chainLinkHalfH)
            profileCanvas.pop()
        }
        for (let part of parts){
            if (part=='back'&&this.geneExpressed('back')){
                const p=this.torso.position,
                    a=this.torso.angle
                profileCanvas.push()
                profileCanvas.translate(p.x,p.y)
                profileCanvas.rotate(a)
                profileCanvas.image(this.anatomy.back.img,0,0,this.anatomy.back.width,this.anatomy.back.height)
                profileCanvas.pop()
                continue
            } else if (!this.geneExpressed(part)) continue
            const bodies=this.getBodies(part)
            for (let i=0; i<this.anatomy[part].count; i++){
                const p=bodies[i].position,
                    a=bodies[i].angle,
                    sx=part=='arm'&&i%2?-1:1
                profileCanvas.push()
                profileCanvas.translate(p.x,p.y)
                profileCanvas.rotate(a)
                profileCanvas.scale(sx,1)
                profileCanvas.image(this.anatomy[part].img,0,0,this.anatomy[part].width,this.anatomy[part].height)
                profileCanvas.pop()
            }
        }
    }
}
class Dropping {
    constructor(x,y){
        this.type='dropping'
        this.position=createVector(x,y)
        this.radius=random(2,droppingMaxRadius)
        this.life=droppingLifespan
        myceliumCanvas.noStroke()
        myceliumCanvas.fill(droppingColor)
        myceliumCanvas.square(this.position.x,this.position.y,this.radius)
    }
    update(){
        this.life-=droppingLifeLossSpeed
    }
}

class Mycelium {
    constructor(n=50){
        this.hyphae=[]
        for (let i=0; i<n; i++)
            this.hyphae.push(new Hypha())
    }
    branchAt(x,y){
        this.hyphae.push(new Hypha(x,y))
    }
}
class Hypha {
    constructor(x,y){
        this.type='hypha'
        this.position=x&&y?createVector(x,y)
            :createVector(width*random(.05,.95),height*random(.3,1))
            // :random(1)<.6?createVector(random([0,width]),random(0,height))
            //     :createVector(random(0,width),height)
        this.velocity=createVector(random(-1,1),random(-1,1))
        this.acceleration=createVector()
        this.maxSpeed=3
        this.maxForce=1
        this.mass=random(5,10)
        this.marginSq=900 // min distance squared between self and neighbor
        this.targeting=false // true when food source near, else in exploration mode
        this.color=hyphaColorExploring
        this.separationMultiplier=5
        this.cohesionMultiplier=.1
        this.alignmentMultipler=.3
        this.life=hyphaLifespan
        this.neighborsDensity=0
        this.fieldOfView={
            lx:this.position.x-hyphaViewRadius,
            rx:this.position.x+hyphaViewRadius,
            ty:this.position.y-hyphaViewRadius,
            by:this.position.y+hyphaViewRadius
        }
    }
    applyForce(force){
        const f=V.div(force,this.mass)
        this.acceleration.add(f)
    }
    separation(neighbors){
        let force=createVector(), // aggregated desired velocity
            count=0
        for (let other of neighbors){
            let desired=V.sub(this.position,other.position)
            if  (desired.magSq()>this.marginSq) continue
            force.add(desired)
            count++
        }
        if (!count) return createVector()
        force.div(count)
        force.limit(this.maxSpeed)
        force.sub(this.velocity) // steer force
        force.limit(this.maxForce)
        return force
    }
    cohesion(neighbors){
        let position=createVector(), // aggregated position of nearby neighbors
            count=0
        for ( let other of neighbors){
            position.add(other.position)
            count++
        }
        if (!count) return createVector()
        position.div(count)
        let force=V.sub(position,this.position) // desired velocity
        force.limit(this.maxSpeed)
        force.sub(this.velocity) // steer force
        force.limit(this.maxForce)
        return force
    }
    alignment(neighbors){
        let force=createVector(), // aggregated desired velocity
            count=0
        for (let other of neighbors){
            force.add(other.velocity)
            count++
        }
        if (!count) return createVector()
        force.div(count)
        force.limit(this.maxSpeed)
        force.sub(this.velocity) // steer force
        force.limit(this.maxForce)
        return force
    }
    swarm(others){
        let neighbors=others.filter(o=>o!=this),
            separation=this.separation(neighbors),
            cohesion=this.cohesion(neighbors),
            alignment=this.alignment(neighbors)
        separation.mult(this.separationMultiplier)
        cohesion.mult(this.cohesionMultiplier)
        alignment.mult(this.alignmentMultipler)
        this.applyForce(separation)
        this.applyForce(cohesion)
        this.applyForce(alignment)
            
    }
    seekFood(targets){
        let shortestSq=Infinity,
            force
        for (let target of targets){
            if (target.life<=0) continue
            let v=V.sub(target.position,this.position),
                distanceSq=v.magSq()
            if (distanceSq<=10) { // if close enough, eat target
                this.life+=target.life
                target.life=0
                if (this.targeting) this.explorationMode()
                return
            }
            // if not, proceed with code to steer towards target
            if (distanceSq>=shortestSq) continue
            shortestSq=distanceSq
            force=v
        }
        if (force) {
            if (!this.targeting) this.targetingMode()
            force.limit(this.maxSpeed)
            force.sub(this.velocity)
            force.limit(this.maxForce)
            this.applyForce(force)
        } else if (this.targeting) this.explorationMode()
    }
    update(){
        if (!this.acceleration.x&&!this.acceleration.y) {
            this.acceleration.x=random(-10,10)
            this.acceleration.y=random(-10,10)
        }
        this.velocity.add(this.acceleration)
        this.velocity.limit(this.maxSpeed)
        this.position.add(this.velocity)
        this.acceleration.mult(0)
        if (!this.targeting) this.life-=hyphaLifeLossSpeed
        if (this.position.x>width) this.position.x=0
        else if (this.position.x<0) this.position.x=width
        if (this.position.y>height) this.position.y=0
        else if (this.position.y<0) this.position.y=height
    }
    explorationMode(){
        this.targeting=false
        this.marginSq=900
        this.separationMultiplier=3
        this.cohesionMultiplier=.1
        this.alignmentMultipler=.2
        this.color=hyphaColorExploring
    }
    targetingMode(){
        this.targeting=true
        this.marginSq=100
        this.separationMultiplier=2
        this.cohesionMultiplier=1
        this.alignmentMultipler=.3
        this.color=hyphaColorTargeting
    }
    show(){
        myceliumCanvas.push()
        myceliumCanvas.translate(this.position.x,this.position.y)
        myceliumCanvas.rotate(this.velocity.heading())
        myceliumCanvas.stroke(hyphaColorShadow)
        myceliumCanvas.line(-2,0,2,0)
        myceliumCanvas.stroke(this.color)
        myceliumCanvas.line(-2,1,2,1)
        myceliumCanvas.pop()
    }
}
class Mushroom {
    constructor(position){
        this.type='mushroom'
        this.position=position?position.copy()
            :createVector(
                random(20,width-20),
                random(20,height-20)
            )
        // this.stemHeight=random(mushroomMinHeight,mushroomMaxHeight)
        this.stemHeight=constrain(
            randomGaussian(mushroomAvgHeight,30),
            mushroomMinHeight,
            mushroomMaxHeight
        )
        this.stemHeightSq=this.stemHeight**2
        this.cap=createVector(
            this.position.x+random(-20,20),
            this.position.y-this.stemHeight
        )
        if (this.cap.y<=20) this.cap.y=20
        this.growVelocity=V.sub(this.cap,this.position)
        this.growVelocity.limit(1)
        this.growForce=createVector(0,random(-.01,-.02))
        this.radius=map(this.stemHeight,mushroomMinHeight,mushroomMaxHeight,mushroomMinCap,mushroomMaxCap,true)
        this.radiusSq=this.radius**2
        this.stemRadius=1
        this.maxStemRadius=this.radius*.25
        this.life=mushroomLifespan*map(this.stemHeight,mushroomMinHeight,mushroomMaxHeight,.5,1,true)
        this.grown=false
        this.xStemJiggerSpeed=random(.01,.05)
        this.symbol=random(mushroomBurstSymbols)
        this.pitch=pitches[mushroomBurstSymbols.indexOf(this.symbol)]
    }
    growStem(distanceToGoSq){
        this.growForce.x=random(-.25,.25)*sineTable.lookup(frameCount*this.xStemJiggerSpeed)
        this.growVelocity.add(this.growForce)
        this.growVelocity.limit(1)
        this.position.add(this.growVelocity)
        if (this.stemRadius<this.radius)
            this.stemRadius=map(distanceToGoSq,this.stemHeightSq,50,1,this.maxStemRadius,true)
        myceliumCanvas.noStroke()
        myceliumCanvas.fill(mushroomStemColor)
        myceliumCanvas.ellipse(this.position.x,this.position.y,this.stemRadius)
    }
    growCap(){
        if (!this.capLayers) {
            this.capLayers=[]
            for (let i=0; i<mushroomCapLayers; i++){
                let x=this.position.x,
                    y=this.position.y-i*(this.radius*.13),
                    w=this.radius*.7**(i+1),
                    h=w*.7,
                    layer={x,y,w,h}
                this.capLayers.push(layer)
            }
        }
        for (let i=0; i<mushroomCapLayers; i++){
            const layer=this.capLayers[i]
            mushroomCanvas.fill(mushroomCapFill[i])
            mushroomCanvas.ellipse(layer.x,layer.y,layer.w,layer.h)
        }
    }
    loseCap(){
        mushroomCanvas.erase()
        mushroomCanvas.fill(0)
        for (let layer of this.capLayers){
            mushroomCanvas.ellipse(layer.x,layer.y,layer.w,layer.h)
        }
        myceliumCanvas.noStroke()
        myceliumCanvas.fill(mushroomLostCapColor)
        let t=this.eaten?mushroomEatenSymbol:this.symbol
        myceliumCanvas.text(t,this.position.x,this.position.y)
        mushroomCanvas.noErase()
    }
    burst(){
        if (random()<.9&&sound){
            const note=this.pitch+random(['5','6']), // octaves 4,5,6 = higher frequency sounds
                volume=map(this.radius,mushroomMinCap,mushroomMaxCap,.15,.25),
                duration=.05
            polySynth.play(note,volume,0,duration)
        }
        let newHyphae=[]
        for (let i=0; i<mushroomSpores; i++){
            newHyphae.push(new Hypha(
                random(0,width),
                random(150,height)
            ))
        }
        return newHyphae
    }
    update(){
        if (this.grown) {
            this.life-=mushroomLifeLossSpeed
            if (this.life<=0) this.loseCap()
        } else {
            const v=V.sub(this.cap,this.position),
                distanceToGoSq=v.magSq()
            if (distanceToGoSq>50&&this.position.y>this.cap.y)
                this.growStem(distanceToGoSq) 
            else {
                this.grown=true
                this.growCap()
            }
        }
    }
}

// class Dread {
//     constructor(progenitor,position,featherLength=textSize()-2){
//         this.type='dread'
//         this.minWings=3
//         this.maxWings=5
//         this.wingsCount=round(random(this.minWings,this.maxWings))
//         this.betweenWingsAngle=TWO_PI/this.wingsCount
//         this.featherLength=featherLength
//         this.feathers=[
//             createVector(0,0),
//             createVector(featherLength,0),
//         ]
//         this.midFeather=0
//         this.minFeathers=2**6 // per wing, initial size at 6 iterations
//         this.maxFeathers=2**8 // per wing, full size at 8 iterations
//         this.feathersToGrow=[]
//         this.wingLength=0
//         this.radius=0
//         this.position=position.copy()
//         this.velocity=createVector()
//         this.acceleration=createVector()
//         this.minFeathersTotal=this.minWings*this.minFeathers
//         this.maxFeathersTotal=this.maxWings*this.maxFeathers
//         this.mass=1
//         this.maxSpeed=random(2,3)
//         this.maxForce=random(.8,1.2)
//         this.pulseDistance=featherLength*random(8,12)
//         this.pulseVal=0
//         this.pulseSpeed=random(.03,.05)
//         this.pulseX=0
//         this.angle=0
//         this.angleSpeed=random(.04,.06)*random([-1,1])
//         this.source=progenitor
//         this.symbol=random(mushroomBurstSymbols)
//         this.fullPlumage()
//     }
//     updateWingLength(){
//         // wing length is the distance between
//         // (0,0) and the furthest feather
//         let maxSq=0
//         for (let feather of this.feathers){
//             let distanceSq=feather.x**2+feather.y**2
//             if (distanceSq>maxSq) maxSq=distanceSq
//         }
//         this.wingLength=sqrt(maxSq)
//     }
//     updateMass(){
//         const totalFeathers=this.feathers.length*this.wingsCount
//         this.mass=map(totalFeathers,this.minFeathersTotal,this.maxFeathersTotal,2,20,true)
//     }
//     fullPlumage(){
//         // one dragon curve fractal repeated for each wing.
//         // generate fractal (only once for performance):
//         // at each iteration, copy all points other than last,
//         // rotate them by 90deg around last point (rotation anchor)
//         // (approx. duplicating in size at each iteration)
//         while (this.feathers.length<this.maxFeathers){
//             let newFeathers=[],
//                 rotationAnchor=this.feathers.slice(-1)[0]
//             for (let i=this.feathers.length-2; i>=0; i--) {
//                 let newPoint=this.feathers[i].copy()
//                 newPoint.sub(rotationAnchor)
//                     .rotate(HALF_PI)
//                     .add(rotationAnchor)
//                 newFeathers.push(newPoint)
//             }
//             this.feathers.push(...newFeathers)
//         }
//         // show only feathers from a few first iterations,
//         // the rest move to feathersToGrow for later use
//         const removeCount=this.feathers.length-this.minFeathers
//         this.feathersToGrow.push(...this.feathers.splice(this.minFeathers,removeCount))
//         this.midFeather=this.feathers.length/2
//         this.updateWingLength()
//         this.updateMass()
//     }
//     growFeathers(count=2){ 
//         if (!this.feathersToGrow.length) return
//         this.feathers.push(...this.feathersToGrow.splice(0,count))
//         this.midFeather=this.feathers.length/2
//         this.updateWingLength()
//         this.updateMass()
//     }
//     dropFeathers(count=2){
//         if (this.feathers.length<=this.minFeathers) return
//         let i=this.feathers.length-count
//         this.feathersToGrow.unshift(...this.feathers.splice(i,count))
//         this.midFeather=this.feathers.length/2
//         this.updateWingLength()
//         this.updateMass()
//     }
//     growWings(count=1){
//         if (this.wingsCount>=this.maxWings) return
//         this.wingsCount+=count
//         this.betweenWingsAngle=TWO_PI/this.wingsCount
//         this.updateMass()
//     }
//     dropWings(count=1){
//         if (this.wingsCount<=this.minWings) return
//         this.wingsCount-=count
//         this.betweenWingsAngle=TWO_PI/this.wingsCount
//         this.updateMass()
//     }
//     applyForce(force){
//         const f=V.div(force,this.mass)
//         this.acceleration.add(f)
//     }
//     wander(){
//         // random steering. set a point at fixed distance D
//         // in front of it (same direction as current velocity),
//         // draw a circle of radius R around this point, and 
//         // pick a random point along the circle's circumference.
//         // set this point as the new target to head for.
//         // this constraints the random movement along object's
//         // current velocity, making it less jittery.
//         if (!this.target||random(1)<.05){ // 5% chance of setting new target at each frame
//             let point=this.velocity.copy(),
//                 angle=this.velocity.heading()+random(-HALF_PI,HALF_PI)
//             point.setMag(100).add(this.position)
//             this.target=V.fromAngle(angle) 
//             this.target.setMag(25).add(point)
//         }
//         let force=V.sub(this.target,this.position) // desired velocity
//         force.limit(this.maxSpeed)
//             .sub(this.velocity) // steer force
//             .limit(this.maxForce)
//         this.applyForce(force)
//     }
//     nearSideEdges(){
//         return this.position.x>width||this.position.x<0
//     }
//     nearTopBotEdges(){
//         return this.position.y>height||this.position.y<0
//     }
//     avoidEdges(){
//         if (!this.nearSideEdges()&&!this.nearTopBotEdges()) return
//         let force=V.sub(centerScreen,this.position)
//         force.sub(this.velocity).limit(this.maxForce)
//         this.applyForce(force)
//     }
//     update(){
//         this.velocity.add(this.acceleration)
//         this.velocity.limit(this.maxSpeed)
//         this.position.add(this.velocity)
//         this.acceleration.mult(0)
//         this.angle+=this.angleSpeed
//         this.pulseVal+=this.pulseSpeed
//         this.pulseX=map(sineTable.lookup(this.pulseVal),-1,1,0,this.pulseDistance)
//         this.radius=this.wingLength+this.pulseX
//         this.radiusSq=this.radius**2
//     }
//     outOfScreen(){
//         return this.position.x>width+this.radius
//             || this.position.x<-this.radius
//             || this.position.y>height+this.radius
//             || this.position.y<-this.radius
//     }
//     show(){
//         if (this.outOfScreen()) return
//         push()
//         translate(this.position.x,this.position.y)
//         rotate(this.angle)
//         for (let i=0; i<this.wingsCount; i++){
//             rotate(this.betweenWingsAngle)
//             push()
//             translate(this.pulseX,0)
//             for (let feather of this.feathers)
//                 text(this.symbol,feather.x,feather.y)
//             pop()
//         }
//         pop()
//     }
// }

class SineTable{
    constructor(){
        this.results=[]
        for (let i=0; i<TWO_PI; i+=.01){
            this.results.push(sin(i))
        }
    }
    lookup(value){
        const i=floor(value%TWO_PI/.01)
        return this.results[i]
    }
}
class QuadTree {
    constructor(boundary={lx:0,rx:width,ty:0,by:height,w:width,h:height}){
        this.boundary=boundary
        this.objects=[]
        this.subdivided=false
        this.quadrants=['topLeft','topRight','bottomLeft','bottomRight']
    }
    contains(object){
        return object.position.x>=this.boundary.lx
            &&object.position.x<this.boundary.rx
            &&object.position.y>=this.boundary.ty
            &&object.position.y<this.boundary.by
    }
    subdivide(){
        let tlBoundary={lx:this.boundary.lx,rx:this.boundary.lx+this.boundary.w/2,ty:this.boundary.ty,by:this.boundary.ty+this.boundary.h/2,w:this.boundary.w/2,h:this.boundary.h/2},
            trBoundary={lx:this.boundary.lx+this.boundary.w/2,rx:this.boundary.rx,ty:this.boundary.ty,by:this.boundary.ty+this.boundary.h/2,w:this.boundary.w/2,h:this.boundary.h/2},
            blBoundary={lx:this.boundary.lx,rx:this.boundary.lx+this.boundary.w/2,ty:this.boundary.ty+this.boundary.h/2,by:this.boundary.by,w:this.boundary.w/2,h:this.boundary.h/2},
            brBoundary={lx:this.boundary.lx+this.boundary.w/2,rx:this.boundary.rx,ty:this.boundary.ty+this.boundary.h/2,by:this.boundary.by,w:this.boundary.w/2,h:this.boundary.h/2}
        this.topLeft=new QuadTree(tlBoundary)
        this.topRight=new QuadTree(trBoundary)
        this.bottomLeft=new QuadTree(blBoundary)
        this.bottomRight=new QuadTree(brBoundary)
        this.subdivided=true
        // move objects to sub-quadrants to improve performance
        for  (let object of this.objects){
            for (let quadrant of this.quadrants){
                this[quadrant].insert(object)
            }
        }
        this.objects=[]
    }
    insert(object){
        if (!this.contains(object)) return
        if (this.objects.length<quadtreeCellsize) this.objects.push(object)
        else {
            if (!this.subdivided) this.subdivide()
            for (let quadrant of this.quadrants) this[quadrant].insert(object)
        }
    }
    intersects(range){
        return !(range.lx>this.boundary.rx)
            && !(range.rx<this.boundary.lx)
            && !(range.ty>this.boundary.by)
            && !(range.by<this.boundary.ty)
    }
    getNeighbors(object){
        if (!this.contains(object)&&!this.subdivided) return
        if (!this.subdivided) return this.objects
        for (let quadrant of this.quadrants){
            let found=this[quadrant].getNeighbors(object)
            if (found) return found
        }
    }
    getNeighborsInRange(range){
        if (!this.intersects(range)) return
        if (!this.subdivided) return this.objects
        let found=[]
        for (let quadrant of this.quadrants){
            let qFound=this[quadrant].getNeighborsInRange(range)
            if (qFound) found.push(...qFound)
        }
        return found
    }
    clear(){
        this.objects=[]
        this.subdivided=false
        for (let quadrant of this.quadrants)
            delete this[quadrant]
    }
    // show(){
    //     rect(this.boundary.lx,this.boundary.ty,this.boundary.w,this.boundary.h)
    //     if (!this.subdivided) return
    //     this.topLeft.show()
    //     this.topRight.show()
    //     this.bottomLeft.show()
    //     this.bottomRight.show()
    // }
}
function KMeans(points,k,iterations=3){
    let centroids=[],
        clusters=[]
    // create randomized centroids
    for (let i=0; i<k; i++){
        let centroid=random(points)
        while(centroids.includes(centroid)){
            centroid=random(points)
        }
        centroids.push(centroid)
    }
    let count=0
    while (count<iterations){
        // assign points to clusters around random centroids
        for (let i=0; i<k; i++) {
            clusters[i]=[]
        }
        points.forEach(point=>{
            let smallestSq=Infinity,
                clusterIndex
            centroids.forEach((centroid,i)=>{
                const v=V.sub(point,centroid),
                    distanceSq=v.magSq()
                if (distanceSq>=smallestSq) return
                smallestSq=distanceSq
                clusterIndex=i
            })
            clusters[clusterIndex].push(point)
        })
    
        // calculate new centroids of clusters
        clusters.forEach((cluster,i)=>{
            let centroid=createVector()
            if (cluster.length){
                for (let point of cluster) centroid.add(point)
                centroid.div(cluster.length)
            }
            centroids[i]=centroid
        })
        count++
    }
    return [centroids,clusters]
}