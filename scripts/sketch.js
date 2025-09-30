let drawtime=2400, // at 60f/s makes 40s
    symbols=['⋅','⋅','­­­‑','∿','≻','∕','∫'],
    colors=[
        [190,0,30,17],
        [140,140,140,15],
        [0,0,255,20],
    ],
    pencolor=[150], penopacity=255,
    mintextsize=15,
    maxtextsize=40
let cellsize, vehiclecount, grid,
    vehicles=[],
    progress, progresspct, redraw,
    startframe=0, elapsed,
    smallscreen,
    pencanvas, pensize
const V=p5.Vector
function setup(){
    smallscreen=windowWidth<=500
    progress=select('#progress')
    progresspct=select('#progress .pct')
    redraw=select('#progress .redraw')
    // interactivity
    selectAll('#intro h1.button').forEach(button=>{
        button.mouseClicked(()=>{
            const p=button.parent()
            p.classList.toggle('open')
        })
    })
    redraw.mouseClicked(()=>{
        grid.init()
        addVehicles()
        startframe=frameCount
        penopacity=255
        redraw.addClass('hidden')
        progresspct.removeClass('hidden')
        clear()
        loop()
    })
    if (smallscreen&&displayWidth==windowWidth) createCanvas(displayWidth,displayHeight,select('#sketch').elt)
    else createCanvas(windowWidth,windowHeight,select('#sketch').elt)
    noStroke()
    textAlign(CENTER,CENTER)
    pencanvas=createGraphics(width,height,select('#sketch2').elt)
    pencanvas.noStroke()
    pensize=map(max(width,height),500,1000,20,30,true)
    pencanvas.textSize(pensize)
    pencanvas.textAlign(RIGHT,BASELINE)
    pencanvas.show()
    vehiclecount=round(map(width,300,2000,6,20,true))
    grid=new Grid()
    addVehicles()
}
function draw(){
    elapsed=frameCount-startframe
    pencanvas.clear()
    if (mouseIsPressed&&penopacity<255) penopacity+=30
    else if (penopacity>0) {
        if (elapsed<300) penopacity-=1
        else penopacity-=15
    }
    if (elapsed>drawtime) pensize--
    for (let vehicle of vehicles){
        vehicle.applyflowfield()
        vehicle.update()
        vehicle.show()
        if (penopacity>0) vehicle.showpen()
    }
    if (elapsed%50<5) {
        const p=round(elapsed/drawtime*100)
        if (p>=100) {
            progresspct.addClass('hidden')
            redraw.removeClass('hidden')
        }
        else progresspct.html(`Scribbling... ${p<10?'0'+p:p}%`)
    }
    vehicles=vehicles.filter(vehicle=>vehicle.size>0)
    if (vehicles.length==0) {
        pencanvas.clear()
        noLoop()
    }
}
function windowResized(){
    if (windowWidth==width) return
    smallscreen=windowWidth<=500
    if (elapsed<=drawtime) {
        resizeCanvas(windowWidth,windowHeight)
        pencanvas.resizeCanvas(windowWidth,windowHeight)
        grid.init()
        vehicles.forEach(v=>v.generateflowfield())
    }
}
function addVehicles(){
    let x,y,vx,vy
    if (smallscreen){
        const p=random(1)
        if (p>.5) { x=width*.2; y=0; vx=0; vy=10}
        else { x=0; y=height*.2; vx=10; vy=0}
    } else { x=width*.65; y=height; vx=0; vy=-10 }
    for (let i=0; i<vehiclecount; i++)
        vehicles.push(new Vehicle(x,y,vx,vy))
}
class Vehicle {
    constructor(x,y,vx,vy){
        this.p=createVector(x,y)
        this.v=createVector(vx,vy)
        this.a=createVector()
        this.maxspeed=random(2,4)
        this.maxforce=map(this.maxspeed,2,4,.12,.4)
        this.size=map(this.maxspeed,2,4,mintextsize,maxtextsize)
        this.mass=this.maxspeed*.5
        this.margin=this.size*4
        this.symbol=random(symbols)
        this.color=random(colors)
        this.pencolor=this.color.slice(0,3)
        this.generateflowfield()
    }
    generateflowfield(){
        this.flowfield=[]
        for (let i=0; i<grid.cellcount; i++){
            this.flowfield.push(V.fromAngle(random(TWO_PI)))
        }
    }
    applyforce(force){
        let f=V.div(force,this.mass)
        f.limit(this.maxforce)
        this.a.add(f)
    }
    applyflowfield(){
        let row=constrain(floor(this.p.y/grid.cellsize),0,grid.rows-1),
            col=constrain(floor(this.p.x/grid.cellsize),0,grid.cols-1)
        const i=row*grid.cols+col
        this.applyforce(this.flowfield[i])
    }
    update(){
        this.v.add(this.a)
        this.v.limit(this.maxspeed)
        this.p.add(this.v)
        this.a.mult(0)

        if (this.p.x>width+this.margin) this.p.x=0
        else if (this.p.x<-this.margin) this.p.x=width
        if (this.p.y>height+this.margin) this.p.y=0
        else if (this.p.y<-this.margin) this.p.y=height
        
        if (elapsed>drawtime) this.size--
    }
    show(){
        push()
        translate(this.p.x,this.p.y)
        rotate(this.v.heading())
        fill(this.color)
        textSize(this.size)
        text(this.symbol,0,0)
        pop() 
    }
    showpen(){
        pencanvas.push()
        pencanvas.translate(this.p.x,this.p.y)
        pencanvas.scale(-1,1)
        pencanvas.fill(...this.pencolor,penopacity)
        pencanvas.text('✎',0,0)
        pencanvas.pop()
    }
}
class Grid {
    constructor(){
        this.init()
    }
    init(){
        this.cellsize=map(width,300,1000,60,120,true)
        this.cols=ceil(width/this.cellsize)
        this.rows=ceil(height/this.cellsize)
        this.cellcount=this.cols*this.rows
    }
}