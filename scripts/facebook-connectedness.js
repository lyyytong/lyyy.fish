let layoutswitchw = 1024,
    widescreen =  window.innerWidth>=layoutswitchw
let bgc = 'darkgray'
    nodec = 'silver', nodecbr = 'lightgray', nodecbr2 = 'gainsboro',
    linkc = 'blue',
    gridlinec = 190, gridlinesw = .5,
    pbarc = 183, pbarclight = widescreen?195:210, countrybarc = 160, inscorec = 220, outscorec = 'blue',
    weakcbgc = 'gray', strongcbgc = 'blue', minlerpv = .25
    circler = widescreen?.6:1.3,
    canvashr = widescreen?1:.7
    margin=8, margin2=12
let g1r = .6,
    gapr = .2
let gmode = 1, // 1 for bar, 2 for network
    sortmode = 'inscore', // pop,inscore,outscore
    scaletype = 'log'
let simtick = 5,
    tickskip = 20,
    skipped = 0,
    animdone = 0,
    animspeed = .15
let t = 50, tsum = 5
    nodet = 200,
    st = 100, stsum = 5
let scorethreshold = 4586 // top 25%
// let scorethreshold = 1192 // top 50%
let minsw = .3
let showtextdiam = widescreen?35:15
let searchlenmin = 3
let toshow = widescreen
    ? ['Vietnam','India','Cayman Islands','Barbados','Seychelles','Uruguay','Denmark','Norway','Argentina','Canada']
    : ['India','Guam','Cayman Islands','Uruguay','Norway','Spain']
let fontsize
let ch,cw,gh,g1boty,gap,csy,g2topy
let raw, data, pops, gprogress = {}
let xscale,yscale,ysdomain,ysrange,pscale,psdomain,psrange,bw
let axes,xaxis,yaxislog,paxislog,yaxislin,paxislin,ticksx
let lsscale,lineoscale,swscale,rscale,rrange
let topm,leftm,rightm
let sim,cgroup
let infosorted, infonetwork
let sortedlabels, networklabels
let cnodes = []
let simdone = 0
let gnums = {'bar':1,'network': 2,}
let snums = {
    'sort-inscore':1,
    'sort-outscore':2,
    'sort-pop':3
}
let selectors, params,toggleScale,sortparams,search

function preload(){
    raw = loadTable('../data/facebook-connectedness/links.csv','csv','header')
    pops = loadTable('../data/facebook-connectedness/pop_score.csv','csv','header')
}
function setup(){
    if (widescreen) initWideDim()
    else initMobileDim()

    linkc = color(linkc).levels
    weakcbgc = color(weakcbgc)
    strongcbgc = color(strongcbgc)
    bgc = color(bgc)

    const cv = select('#graph canvas')
    createCanvas(cw,ch,cv.elt)
    background(bgc)
    strokeWeight(minsw)

    fontsize = +select('body').style('font-size').split('px')[0]
    axes = select('#graph .axes')
    xaxis = select('#graph .x-axis')
    yaxislog = select('#graph .y-axis-log')
    paxislog = select('#graph .pop-axis-log')
    yaxislin = select('#graph .y-axis-lin')
    paxislin = select('#graph .pop-axis-lin')
    cgroup = select('#graph .countries')
    params = select('#params')
    sortedlabels = widescreen?select('#labels-sorted'):select('#labels-mobile-sorted')
    networklabels = widescreen?select('#labels-network'):select('#labels-mobile-network')
    infosorted = select('#selectors .graph-info .sorted')
    infonetwork = select('#selectors .graph-info .network')

    raw = raw.rows.map(d=>d.obj)
    pops = pops.rows.map(d=>d.obj)
    pops.forEach(d=>{d.pop=+d.pop;d.inscore=+d.inscore;d.outscore=+d.outscore})

    // init network data
    const maxpop = d3.max(pops,d=>d.pop)
    rrange = [1.5,maxpop]
    const maxcircr = min(width,height)/9
    rscale = widescreen ? d3.scaleSqrt(rrange,[0,maxcircr])
        : d3.scaleSqrt(rrange,[0,40])
    
    let countries = [...new Set(raw.map(d=>d.loc1))].map((c,i)=>{
        const id = i,
            pi = pops.filter(d=>d.iso3==c)[0],
            p = pi.pop,
            name = pi.name,
            inscore = pi.inscore,
            outscore = pi.outscore,
            iso2 = pi.iso2,
            r = rscale(p),
            color = r<=1.5 ? nodecbr2 : r<=2.5 ? nodecbr : nodec
        return {id, code:c, iso2, pop:p, inscore, outscore, name, r, c:color}
    })
    let links = raw.filter(d=>d.loc1!=d.loc2)
    
    const scoreExt = d3.extent(links,d=>+d.score)
    lsscale = d3.scaleLinear(scoreExt, [0,1])
    lineoscale = d3.scaleLinear(scoreExt,[40,255])
    swscale = widescreen?d3.scaleLinear(scoreExt,[.2,1])
        :d3.scaleLinear(scoreExt,[.05,1])
    
    links = links.map((l,i)=>{
        const source = countries.filter(c=>c.code==l.loc1)[0].id,
            target = countries.filter(c=>c.code==l.loc2)[0].id,
            score = +l.score,
            c = [...linkc.slice(0,3),lineoscale(score)],
            sw = swscale(score)
        return {source, target, score, c, sw}
    })
    links = links.filter(d=>d.score>=scorethreshold)
    countries.sort((a,b)=>b[sortmode]-a[sortmode])
    data = {nodes: countries, links}

    // init bar chart data
    xscale =  d3.scaleBand(countries.map(d=>d.name),[leftm,width-rightm])
    bw = xscale.bandwidth()

    ysdomain = [1000,d3.max(countries,d=>d.inscore)]
    ysrange = [g1boty,topm]
    psdomain = [1,d3.max(countries,d=>d.pop)]
    psrange = [height-margin2,g2topy]
    initScaleTicks('log')
    initScaleTicks('lin')
    yscale = d3.scaleLog(ysdomain,ysrange)
    pscale = d3.scaleLog(psdomain,psrange)

    initHoverElements()
    initInteractivity()
    drawLabels()
}
function draw(){
    drawGraph()   
    if (search.value()) searchCountries()
}
function windowResized(){
    if (isTouchEnable()&&!widescreen) return
    widescreen = window.innerWidth>=layoutswitchw
    if (widescreen) initWideDim()
    else initMobileDim()
    
    // reset scales
    const maxcircr = min(width,height)/9
    rscale = widescreen ? d3.scaleSqrt(rrange,[0,maxcircr])
        : d3.scaleSqrt(rrange,[0,40])
    xscale =  d3.scaleBand(data.nodes.map(d=>d.name),[leftm,cw-rightm])
    bw = xscale.bandwidth()
    ysrange = [g1boty,topm]
    psrange = [ch-margin2,g2topy]
    if (scaletype=='log') {
        yscale = d3.scaleLog(ysdomain,ysrange)
        pscale = d3.scaleLog(psdomain,psrange)
    } else {
        yscale = d3.scaleLinear(ysdomain,ysrange).nice()
        pscale = d3.scaleLinear(psdomain,psrange).nice()
    }

    // restart sim
    data.nodes.forEach(c=>{
        c.r = rscale(c.pop)
        c.c = c.r<=1.5 ? nodecbr2 : c.r<=2.5 ? nodecbr : nodec
    })
    if (sim) sim.stop()
    simdone=0
    sim=NaN

    // reposition hover elements
    // sorted
    selectAll('.tick-wrapper').forEach(n=>{
        n.position(xscale(n.attribute('value')),topm)
            .style('width',bw+'px')
            .style('height',gh+'px')
    })
    selectAll('.x-axis .tick').forEach(n=>n.position(bw/2,csy))
    selectAll(".country-inscore").forEach(n=>{
        const v = n.attribute('value')
        let y = yscale(v)-topm
        if (scaletype=='lin'&&y>=g1boty-topm-30) {
            const h2 = n.height*1.55
            y = g1boty-topm-h2
        }
        n.position(bw/2,y)
    })
    selectAll(".country-outscore").forEach(n=>{
        const v = n.attribute('value')
        n.position(bw/2,yscale(v)-topm)
    })
    selectAll(".country-pop").forEach(n=>{
        const v = n.attribute('value')
        let y = pscale(v)-topm
        if (scaletype=='lin'&&y>=height-margin2-topm-5) {
            const hh = n.height/2
            y = height-margin2-topm-hh
        }
        n.position(bw/2,y)
    })
    const tickclass = widescreen?'tick vertical':'tick horizontal',
        _yscalelog = d3.scaleLog(ysdomain,ysrange),
        _pscalelog = d3.scaleLog(psdomain,psrange),
        _yscalelin = d3.scaleLinear(ysdomain,ysrange).nice(),
        _pscalelin = d3.scaleLinear(psdomain,psrange).nice()
    selectAll('.y-axis-log .tick').forEach(t=>{
        const v = t.attribute('value')
        t.class(tickclass).position(ticksx,_yscalelog(v))
    })
    selectAll('.pop-axis-log .tick').forEach(t=>{
        const v = t.attribute('value')
        t.class(tickclass).position(ticksx,_pscalelog(v))
    })
    selectAll('.y-axis-lin .tick').forEach(t=>{
        const v = t.attribute('value')
        t.class(tickclass).position(ticksx,_yscalelin(v))
    })
    selectAll('.pop-axis-lin .tick').forEach(t=>{
        const v = t.attribute('value')
        t.class(tickclass).position(ticksx,_pscalelin(v))
    })
     
    // network
    selectAll(".country-name").forEach(n=>{
        const d = data.nodes.filter(d=>d.code==n.attribute('code'))[0],
            diam = d.r*2,
            name = widescreen?d.name:d.iso2,
            cstring = widescreen?'country-name':`${d.iso2} country-name`
        n.html(name).class(cstring)
            .style('width',diam+'px').style('height',diam+'px')
    })

    setTimeout(()=>{
        resizeCanvas(cw,ch)
        loop()
    },100)
}
function drawGraph(){
    if (gmode==1) {
        axes.removeClass('hidden')
        cgroup.addClass('hidden')
        networklabels.addClass('hidden')
        sortedlabels.removeClass('hidden')
        params.removeClass('hidden')
        infosorted.removeClass('hidden')
        infonetwork.addClass('hidden')
        xaxis.removeClass('hidden')

        if (!animdone) {
            const ca = bgc.levels.slice(0,3)
            background(...ca,st)
            if (t<255) st+=stsum
        } else background(bgc)

        selectAll('.tick-wrapper').forEach(t=>{
            const c = t.attribute('value')
            t.position(xscale(c),topm)
        })
        const leftx = widescreen?ticksx:ticksx+4,
            rightx = widescreen?width-rightm:width
        yscale.ticks(4).forEach(t=>{
            stroke(gridlinec)
            strokeWeight(gridlinesw)
            const y = yscale(t)
            line(leftx,y,rightx,y)
        })
        let pticks = pscale.ticks(3)
        if (scaletype=='lin') pticks.unshift(0)
        pticks.forEach((t,i)=>{
            stroke(gridlinec)
            strokeWeight(gridlinesw)
            const y = pscale(t)
            line(leftx,y,rightx,y)
        })
        data.nodes.forEach((d,i)=>{
            const x = xscale(d.name)+bw/2,
                yIS = yscale(d.inscore),
                yOS = yscale(d.outscore),
                yP = pscale(d.pop),
                h = height-margin2-yP,
                circw = min(bw*circler,3.5)
            const pc = scaletype=='log'?pbarc:pbarclight
            if (!animdone) {
                if (!gprogress[i]) {
                    gprogress[i] = {
                        sty: yOS,
                        sy: yIS,
                        pth: -h,
                        ph: 0,
                        ct: 0
                    }
                }
                p = gprogress[i]
                if (i==data.nodes.length-1 && round(p.sy,2)==round(p.sty,2)) {
                    animdone=1
                } 
                else {
                    p.sy += (p.sty-p.sy)*animspeed
                    p.ph += (p.pth-p.ph)*animspeed
                    p.ct += 20
                }
                const barct = min(p.ct,255)
                const pbc = color(pc).levels.slice(0,3)
                fill(...pbc,barct)
                stroke(...pbc,barct)
                rect(x-bw/2,height-margin2,bw,p.ph)
                const cbc = color(countrybarc).levels.slice(0,3)
                fill(...cbc,barct)
                stroke(...cbc,barct)
                rect(x-bw/2,yIS,bw,p.sy-yIS)
                noStroke()
                fill(inscorec)
                ellipse(x,yIS,circw)
                fill(outscorec)
                ellipse(x,p.sy,circw)
            } else {
                fill(pc)
                stroke(pc)
                rect(x-bw/2,yP,bw,h)
                fill(countrybarc)
                stroke(countrybarc)
                rect(x-bw/2,yIS,bw,yOS-yIS)
                noStroke()
                fill(inscorec)
                ellipse(x,yIS,circw)
                fill(outscorec)
                ellipse(x,yOS,circw)
            }
        })
        if (animdone) {
            selectors.forEach(n=>n.removeClass('disabled'))
            toggleScale.removeClass('disabled')
            sortparams.forEach(n=>n.removeClass('disabled'))
            noLoop()
        }
    } else {
        axes.addClass('hidden')
        cgroup.addClass('hidden')
        sortedlabels.addClass('hidden')
        networklabels.removeClass('hidden')
        params.addClass('hidden')
        infosorted.addClass('hidden')
        infonetwork.removeClass('hidden')
        if (!sim) {
            selectors.forEach(s=>s.addClass('disabled'))
            sim = getForceSim()
        } 
        if (!simdone) {
            if (!skipped) { // skip first 20 ticks of simulation
                skipped = 1
                sim.tick(tickskip)
                background(bgc)
            }
            else {
                sim.tick(simtick)
            }
        } 
        else {
            selectors.forEach(s=>s.removeClass('disabled'))
            if (!widescreen) cgroup.style('display','inline')
            setTimeout(()=>{ 
                cgroup.removeClass('hidden')
                noLoop()
            },100) 
        }

        const ca = bgc.levels.slice(0,3)
        background(...ca,t)
        if (t<255) t+=tsum
        data.links.forEach((l,i)=>{
            strokeWeight(l.sw)
            stroke(l.c)
            const x1 = constrain(l.source.x,margin,width-margin),
                y1 = constrain(l.source.y,margin,height-margin),
                x2 = constrain(l.target.x,margin,width-margin),
                y2 = constrain(l.target.y,margin,height-margin)
            line(x1,y1,x2,y2)
        })
        data.nodes.forEach(n=>{
            const ca = color(n.c).levels.slice(0,3),
                nt = max(nodet,t)
            fill(...ca,nt)
            // fill(n.c)
            noStroke()
            const x = constrain(
                    n.x,
                    widescreen?n.r+margin:n.r,
                    widescreen?width-n.r-margin:width-n.r
                ),
                y = constrain(
                    n.y,
                    widescreen?n.r+margin:n.r,
                    widescreen?height-n.r-margin:height-n.r
                )
            ellipse(x,y,n.r*2)
            if (simdone) cnodes.filter(d=>d.attribute('value')==n.name)[0]
                .position(x,y)
        })
    }
}
function getForceSim(){
    const circd = max(width,height)/63,
        bfstrength = max(width,height)*.95,
        screenr = height/width
    let s =  d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink().id(d=>d.id).links(data.links)
                .distance(0)
                .strength(d=>lsscale(d.score))
                .iterations(100)
        ).force('collide',d3.forceCollide(d=>d.r+circd).iterations(2))
        .on('end',()=>{simdone=1})
    if (widescreen) s.force('charge', d3.forceManyBody().strength(-bfstrength))
        .force('x',d3.forceX(width/2-15).strength(screenr))
        .force('y',d3.forceY(height/2+20).strength(1.25))
    else s.force('charge', d3.forceManyBody().strength(-bfstrength/2))
        .force('x',d3.forceX(width/2-10).strength(screenr))
        .force('y',d3.forceY(height/2+15).strength(1.1))
    return s
}
function initScaleTicks(scale){
    const cleanTick = v =>
        v>=1e9?round(v/1e9,1)+'b'
        : v>=1e8?round(v/1e8,1)+'00m'
        : v>=1e7?round(v/1e7,1)+'0m'
        : v>=1e6?round(v/1e6,1)+'m'
        : v>=1e5?round(v/1e5,1)+'00k'
        : v>=1e4?round(v/1e4,1)+'0k'
        : v>=1e3?round(v/1e3,1)+'k'
        : nfc(v)
    const tickclass = widescreen?'tick vertical':'tick horizontal'
    let yparent,pparent,pticks
    switch (scale) {
        case 'log':
            yscale = d3.scaleLog(ysdomain,ysrange)
            pscale = d3.scaleLog(psdomain,psrange)
            pticks = pscale.ticks(3)
            yparent = yaxislog.elt
            pparent = paxislog.elt
            break;
        case 'lin':
            yscale = d3.scaleLinear(ysdomain,ysrange).nice()
            pscale = d3.scaleLinear(psdomain,psrange).nice()
            pticks = pscale.ticks(3)
            pticks.unshift(0)
            yparent = yaxislin.elt
            pparent = paxislin.elt
            break;
    }
    
    yscale.ticks(4).forEach(t=>{
        if (t==1||t==0) return
        const v = scale=='log'?t*10:t,
            dstring = widescreen&&scale=='log'?nfc(v):cleanTick(v)
        createP(dstring)
            .parent(yparent).class(tickclass)
            .attribute('value',t)
            .position(ticksx,yscale(t))
    })
    pticks.forEach(t=>{
        const v = t*1000,
            dstring = cleanTick(v)
        createP(dstring)
            .parent(pparent).class(tickclass)
            .attribute('value',t)
            .position(ticksx,pscale(t))
    })
}
function initHoverElements(){
    // sorted view
    xscale.domain().forEach(t=>{
        const c = data.nodes.filter(d=>d.name==t)[0],
            w = createDiv().parent(xaxis.elt).class(`tick-wrapper`)
            .position(xscale(t),topm)
            .attribute('value',t)
            .style('width',bw+'px')
            .style('height',gh+'px')
        if (toshow.includes(t)) w.addClass('shown')
        createP(t).parent(w.elt).class('tick')
            .position(bw/2,csy)
        createP(nfc(c.inscore)).parent(w.elt).class('country-inscore')
            .attribute('value',c.inscore)
            .position(bw/2,yscale(c.inscore)-topm)
        createP(nfc(round(c.outscore))).parent(w.elt).class('country-outscore')
            .attribute('value',c.outscore)
            .position(bw/2,yscale(c.outscore)-topm)
        createP(nfc(round(c.pop*1000))).parent(w.elt).class('country-pop')
            .attribute('value',c.pop)
            .position(bw/2,pscale(c.pop)-topm)
    })
    // network view
    const nodesG = select('div.countries').elt
    data.nodes.forEach((n,i)=>{
        const diam = n.r*2,
            name = widescreen?n.name:n.iso2,
            cstring = widescreen?'country-name':`${n.iso2} country-name`,
            el = createDiv(name).parent(nodesG)
                .attribute('value',n.name)
                .attribute('code',n.code)
                .class(cstring)
                .style('width',diam+'px')
                .style('height',diam+'px')
                .mouseOver(showInfo)
                .mouseOut(hideInfo)
        if (diam<showtextdiam) el.style('color','transparent')
        cnodes.push(el)
    })
    function showInfo(){
        if (!widescreen) this.addClass('pop')
            .html(this.attribute('value'))
        const c = this.attribute('code')
        const ls = data.links.filter(d=>d.source.code==c||d.target.code==c)
        let others = [], scores = [], top3 = []
        ls.sort((a,b)=>b.score-a.score)
        ls.forEach((l,i)=>{
            let code
            if (l.target.code!=c) code = l.target.code
            if (l.source.code!=c) code = l.source.code
            others.push(code)
            if (i<3) top3.push(code)
            scores.push(l.score)
        })
        const tohighlight = selectAll('.country-name').filter(d=>{
                const code = d.attribute('code')
                return others.includes(code)
            }),
            mins = min(scores),
            maxs = max(scores)
        tohighlight.forEach(n=>{
            const code = n.attribute('code'),
                i = others.indexOf(code),
                score = scores[i],
                lerpv = map(score,mins,maxs,minlerpv,1),
                c = lerpColor(weakcbgc, strongcbgc, lerpv),
                z = round(map(score,mins,maxs,100,990)),
                bshadow = widescreen?'5px 8px':'3px 6px'
            n.addClass('connected')
                .style('background',c)
                .style('text-shadow',`0 0 5px ${c}`)
                .style('box-shadow',`0 0 ${bshadow} ${c}`)
                .style('z-index',z)
            if (top3.includes(code)) n.html(n.attribute('value'))
        })
    }
    function hideInfo(){
        if (!widescreen) {
            const iso2 = this.class().split(' ')[0]
            this.removeClass('pop').html(iso2)
        }
        selectAll('.country-name')
            .forEach(n=> {
                
                n.removeClass('connected')
                    .style('background','transparent')
                    .style('text-shadow','none')
                    .style('box-shadow','none')
                if (widescreen) return
                const iso2 = n.class().split(' ')[0]
                n.html(iso2)
            })
    }
}

function initInteractivity(){
    const dcm = select('.dcm')
    const fv = getItem('firstvisit')
    if (fv!=1) {
        dcm.style('height',windowHeight*.8+'px').removeClass('hidden')
        select('.dcm .button').mouseClicked(()=>dcm.addClass('hidden'))
        storeItem('firstvisit',1)
    }

    selectors = selectAll(`#selectors input[type='radio']`)
    selectors.filter(s=>s.value()==gmode)[0].elt.checked = true
    selectors.forEach(s=>s.mouseClicked(()=>{
            const num = gnums[s.id()]
            if (num==gmode) return
            gmode=num
            loop()
        })
    )

    toggleScale = select(`#selectors input[name='scale']`)
            .mouseClicked(changeScale),
        toggleLabel = select(`#selectors label[for='toggle-scale']`)
    function changeScale(){
        const checked = toggleScale.elt.checked
        if (checked) {
            scaletype = 'lin'
            yscale = d3.scaleLinear(ysdomain,ysrange).nice()
            pscale = d3.scaleLinear(psdomain,psrange).nice()
            toggleLabel.html('Linear scale ON')
            yaxislog.addClass('hidden')
            yaxislin.removeClass('hidden')
            paxislog.addClass('hidden')
            paxislin.removeClass('hidden')
        } else {
            scaletype = 'log'
            yscale = d3.scaleLog(ysdomain,ysrange)
            pscale = d3.scaleLog(psdomain,psrange)
            toggleLabel.html('Linear scale OFF')
            yaxislog.removeClass('hidden')
            yaxislin.addClass('hidden')
            paxislog.removeClass('hidden')
            paxislin.addClass('hidden')
        }
        selectAll(".country-inscore").forEach(n=>{
            const v = n.attribute('value')
            let y = yscale(v)-topm
            if (scaletype=='lin'&&y>=g1boty-topm-30) {
                const h2 = n.height*1.55
                y = g1boty-topm-h2
            }
            n.position(bw/2,y)
        })
        selectAll(".country-outscore").forEach(n=>{
            const v = n.attribute('value')
            n.position(bw/2,yscale(v)-topm)
        })
        selectAll(".country-pop").forEach(n=>{
            const v = n.attribute('value')
            let y = pscale(v)-topm
            if (scaletype=='lin'&&y>=height-margin2-topm-5) {
                const hh = n.height/2
                y = height-margin2-topm-hh
            }
            n.position(bw/2,y)
        })
        loop()
    }

    sortparams = selectAll(`#params input[type='radio']`)
    sortparams.filter(p=>p.id().replace('sort-','')==sortmode)[0].elt.checked = true
    sortparams.forEach(p=>p.mouseClicked(()=>{
        const sort = p.id().replace('sort-','')
        if (sort==sortmode||gmode!=1) return
        sortmode=sort
        data.nodes.sort((a,b)=>b[sortmode]-a[sortmode])
        xscale = d3.scaleBand(data.nodes.map(d=>d.name),[leftm,width-rightm])
        loop()
    }))

    const sstring = widescreen ? '#search input[type="search"]' : '#search-mobile input[type="search"]'
    search = select(sstring)
    search.elt.addEventListener('keyup',searchCountries)
}
function searchCountries(){
    let s = search.value(), 
        sstring = gmode==1?'.tick-wrapper':'.country-name',
        g = selectAll(sstring)
    if (s.length<searchlenmin) {
        g.forEach(d=>{
            const c = d.attribute('value')
            if (toshow.includes(c)) d.removeClass('pop').addClass('shown')
            else d.removeClass('shown').removeClass('pop')
        })
        return
    } 
    const els = g.filter(d=>{
        const c = d.attribute('value').toLowerCase()
        s = s.toLowerCase()
        return s ? c.includes(s) : false
    })
    g.forEach(t=>t.removeClass('shown').removeClass('pop'))
    if (!els.length) return
    els.forEach(e=>e.addClass('pop'))
}
function drawLabels(){
    // sorted labels
    const maxh = fontsize*2,
        popticks2 = [.2, .5, 1, .7, .4, .1]
    d3.select('#labels-sorted .population .sizes').selectAll('.size')
        .data(popticks2).join('div').attr('class','size')
        .style('width',bw+'px')
        .style('height',d=>maxh*d+'px')

    // network labels
    const maxr = widescreen?fontsize*1.5:fontsize,
        sstring = widescreen?'#labels-network':'#labels-mobile-network',
        popticks = [.2, .4, .6, .8, 1]
    d3.select(`${sstring} .population .sizes`).selectAll('.size')
        .data(popticks).join('div').attr('class','size')
        .style('width',d=>maxr*d+'px')
        .style('height',d=>maxr*d+'px')
    const scoreticks = widescreen?[.2, 1, 1.8, 2.5, 3]
        :[.2, .8, 1.2, 1.6, 2.2]
    d3.select(`${sstring} .connectedness .weights`).selectAll('.weight')
        .data(scoreticks).join('div').attr('class','weight')
        .style('border-left',d=>`${d}px solid var(--linkcolor)`)
}
function initWideDim(){
    ch = windowHeight*canvashr
    cw = windowWidth-select('#info').width-2*margin-windowWidth/15
    topm = select('nav').height+margin2*2
    leftm = margin2*3
    rightm = margin2*2
    gh = ch-margin2-topm
    g1boty = topm + gh * g1r
    gap = gh * gapr
    csy = gh * g1r + gap/2
    g2topy = g1boty + gap
    ticksx = 0
}
function initMobileDim(){
    ch = windowHeight*canvashr
    cw = windowWidth-margin*2
    topm = 0
    leftm = margin2*4
    rightm = margin2*2
    gh = ch-margin2-topm
    g1boty = topm + gh * g1r
    gap = gh * gapr
    csy = gh * g1r + gap/2
    g2topy = g1boty + gap
    ticksx = margin2
}
function isTouchEnable(){
    return ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0)
}