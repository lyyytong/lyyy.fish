let n = 250, r, rratio = .025
let easing = .1
let bgc = 'gray',
    bglc, bglt = 50,
    sw = .4
let cs = [
    {c:'red', show:1},
    {c:'blue', show:1},
    {c:'green', show:0}
]
let bodies = []
let path, pathr, pathrratio = .2
    // maxa = 10800,
    timegap = 5800,
    minra = 120, maxra = 360
let midx, midy
let mode = 2

function setup(){
    const canvas = select('main canvas').elt
    createCanvas(windowWidth,windowHeight,canvas)
    angleMode(DEGREES)
    strokeWeight(sw)
    background(bgc)

    bglc = color(bgc).levels
    bglc[3] = bglt
    midx = width/2
    midy = height/2
    const dim = min(width,height)
    r = dim*rratio
    pathr = dim*pathrratio

    setBodies()
    function setBodies(){
        bodies = []
        const cshow = cs.filter(c=>c.show)
        cshow.forEach((c,i)=>{
            const e = easing * pow(.5,i)
            bodies.push(new MoireBody(n,r,midx,midy,e,c.c))
        })
    }

    const mode1b = select('.mode1'),
        mode2b = select('.mode2'),
        ob = select('.intensity'),
        bodycb = selectAll('.body.button input.show-body'),
        bodycs = selectAll('.body.button input.color-body'),
        swatches = selectAll('.body.swatch'),
        bgcs = select('#color-bg')

    swatches.forEach((s,i)=>s.style('background',cs[i].c))
    select('.bg.swatch').style('background',bgc)
    if (isTouchEnable()) mode1b.html('Track Finger')
    mode1b.mousePressed(()=>{
        mode1b.removeClass('faint')
        mode2b.addClass('faint')
        mode = 1
        modereset(mode)
    })
    mode2b.mousePressed(()=>{
        mode2b.removeClass('faint')
        mode1b.addClass('faint')
        mode = 2
        modereset(mode)
    })
    ob.mousePressed(()=>{
        if (ob.hasClass('faint')) {
            ob.removeClass('faint')
            bglc[3] = 0
        } else {
            ob.addClass('faint')
            bglc[3] = bglt
        }
    })
    bodycb.forEach(b=>b.mousePressed(toggleBody))
    function toggleBody(){
        const id = +this.id().slice(-1),
            p = select(`.body${id}.button`),
            sign = select(`.body${id}.checkbox`),
            cselect = select(`#color-body${id}`)
        if (p.hasClass('faint')) {
            p.removeClass('faint')
            sign.removeClass('hidden')
            cselect.removeClass('disabled')
            cs[id-1].show = 1
            setBodies()
        } else {
            if (bodies.length==1) return
            else {
                p.addClass('faint')
                sign.addClass('hidden')
                cselect.addClass('disabled')
                cs[id-1].show = 0
                setBodies()
            }
        }
    }
    bodycs.forEach(b=>b.changed(setColor))
    function setColor(){
        const c = this.value(),
            id = +this.id().slice(-1),
            swatch = select(`.body${id}.swatch`)
        swatch.style('background',c)
        cs[id-1].c = c
        setBodies()
    }
    bgcs.changed(()=>{
        bgc = bgcs.value()
        bglc = color(bgc).levels
        bglc[3] = bglt
        select('.bg.swatch').style('background',bgc)
    })
    
}
function draw(){
    background(bglc)
    bodies.forEach(f=>{f.target(); f.swim()})
    bodies.forEach(f=>f.drawbody())

    const moving = bodies.filter(f=>f.moving)
    if (moving.length) return
    print('stop sim')
    noLoop()
}
function mouseMoved(){
    if (mode==2) return
    loop()
}
function touchMoved(){
    if (mode==2) return
    loop()
}
function windowResized(){
    resizeCanvas(windowWidth,windowHeight)
    midx = width/2
    midy = height/2
    const dim = min(width,height)
    r = dim*rratio
    pathr = dim*pathrratio
}

class MoireBody {
    constructor(n,r,x,y,e,c) {
        this.n = n
        this.r = r
        this.l = dist(width,height,0,0)
        this.x = x
        this.y = y
        this.lastx = x
        this.lasty = y
        this.tx = NaN
        this.ty = NaN
        this.a = 0
        this.lasta = 0
        this.astart = random(-90,90)
        this.ta = random(minra,maxra)
        this.e1 = e
        this.e2 = .04 + random(-.008,.008)
        this.c = c
        this.moving = 1
        this.ps = []
        const p0x = this.r, p0y = 0,
            angle = 360/this.n
        for (let i=0; i<=this.n; i++) {
            let x, y, x2, y2
            const pa = angle * i
            if (!i) { x = p0x; y = p0y}
            else if (pa <= 90) {
                x = this.r*cos(pa); y = this.r*sin(pa)
                x2 = this.l*cos(pa); y2 = this.l*sin(pa)
            } else if (pa <= 180) {
                const ta = 180 - pa
                x = -this.r*cos(ta); y = p0y + this.r*sin(ta)
                x2 = -this.l*cos(ta); y2 = p0y + this.l*sin(ta)
            } else if (pa <= 270) {
                const ta = pa - 180
                x = - this.r*cos(ta); y = p0y - this.r*sin(ta)
                x2 = - this.l*cos(ta); y2 = p0y - this.l*sin(ta)
            } else {
                const ta = 360 - pa
                x = this.r*cos(ta); y = -this.r*sin(ta)
                x2 = this.l*cos(ta); y2 = -this.l*sin(ta)
            }
            this.ps.push({x,y,x2,y2}) 
        }
    }
    target(){
        switch (mode) {
            case 1:
                this.tx = constrain(mouseX,this.r,width-this.r)
                this.ty = constrain(mouseY,this.r,height-this.r)
                break
            case 2:
                // if (millis()%timegap>30 || this.a>=maxa) return
                if (millis()%timegap>30) return
                this.rd = random(minra,maxra)
                this.ta = this.a + this.rd
                break
        }
    }
    swim(){
        switch (mode) {
            case 1:
                push()
                translate(this.x,this.y)
                stroke(this.c)
                this.ps.forEach(p=>line(p.x,p.y,p.x2,p.y2))
                pop()

                if (!this.tx&&!this.ty) this.moving = 0
                else this.moving = 1

                if (!this.moving) return
                this.lastx = this.x
                this.lasty = this.y
                this.x+=(this.tx-this.x)*this.e1
                this.y+=(this.ty-this.y)*this.e1
                const d = dist(this.x,this.y,this.tx,this.ty)
                if (d<.5) this.moving = 0
                break;
        
            case 2:
                push()
                translate(midx,midy)
                rotate(this.astart)
                rotate(this.a)
                translate(pathr,0)
                stroke(this.c)
                this.ps.forEach(p=>line(p.x,p.y,p.x2,p.y2))
                pop()

                if (!this.moving) return
                this.lasta = this.a
                const dgap = this.ta - this.a,
                    p = 1 - dgap/this.rd,
                    exp1 = map(p,.0000000001,.015,3,1.5),
                    exp2 = map(p,.015,.5,1.5,1) 
                if (p==0) this.a += .0000000001
                else if (p<.015) this.a += dgap * pow(this.e2,exp1)
                else if (p<.5) this.a += dgap * pow(this.e2,exp2)
                else this.a += dgap * this.e2
                // if (dgap<=.1 && this.a>=maxa) this.moving = 0
                break
        }
    }
    drawbody(){
        if (!this.r) return
        fill(bgc)
        noStroke()
        const d = this.r*2
        switch (mode) {
            case 1:
                ellipse(this.lastx,this.lasty,d)
                break
            case 2:
                push()
                translate(midx,midy)
                rotate(this.astart)
                rotate(this.lasta)
                translate(pathr,0)
                ellipse(0,0,d)
                pop()
                break
        }
    }
}
function modereset(mode){
    switch (mode) {
        case 1:
            bodies.forEach(f=>f.moving = 1)
            break;
        case 2:
            bodies.forEach(f=>{
                // f.moving = 1
                this.rd = random(minra,maxra)
                this.ta = this.a + this.rd
            })
            break;
    }
}
function isTouchEnable(){
    return ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0)
}