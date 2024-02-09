let ccdark = 'red',
    ccmed = 'silver',
    cclight = 'aqua',
    ccdark2 = 'brown',
    ccmed2 = 'salmon'
    cclight2 = 'lime'
let cdelay = 50
let year = 2021,
    region = 'All',
    country = 'All'
const print = (...params)=>console.log(...params)
let widelayoutw = 600,
    widelayoutw2 = 1100,
    margin = 8,
    marginsmall = 5
let mode = 1, // 1 country comparison view, 2 timelapse view
    countrieshidden = mode==1?0:1,
    scrollctashown = 0,
    clickctashown = 0
let isbigscreen, isbiggerscreen
let oldscreenw = window.innerWidth
let istouchscreen = touchenabled()
function touchenabled(){
    return ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0)
}

drawCards()
async function drawCards(){
    const trdata = await d3.csv('../data/transgender-rights/trans-rights-data.csv',d3.autoType)
    const cdata = await d3.csv('../data/transgender-rights/countries.csv')
    
    let data,datawscore,datanoscore,scount,scountrange,
        xscale = d3.scaleLinear(),
        zscale = d3.scaleBand().range([1,cdata.length+1]),
        cwscore,hasscore,oldyear,oldregion,oldcountry,
        countryoptions
    const regions = [
        "Western Europe and North America",
        "Latin America",
        "The Carribean",
        "Estern Europe and Central Asia",
        "South Asia",
        "East Asia",
        "South-East Asia",
        "Oceania",
        "Middle East and North Africa",
        "Sub-Saharan Africa",
    ]
    const getregI = d=>regions.indexOf(d)
    
    const crimmetrics = ['no_dircrim','no_indcrim'],
        recmetrics = ['gmc', 'nophys', 'nopsych', 'nodiv', 'nb3g'],
        prometrics = ['adp_general', 'adp_const', 'adp_employment', 'adp_edu', 'adp_health', 'adp_housing']
    const metrics = [
        ...crimmetrics,
        ...recmetrics,
        ...prometrics,
        'trip_score', 'scorecount'
    ]
    data = [...cdata]
    data.map(d=>{
        metrics.forEach(m=>{d[m] = null})
    })
    updatedata()
    
    let dim = {
        w: window.innerWidth-margin*2,
        h: window.innerHeight-margin*2,
        m: {}
    }
    dim.cardw = d3.median([90,200,dim.w*.2])
    dim.cardh = dim.cardw*.7

    isbigscreen = dim.w>=widelayoutw
    isbiggerscreen = dim.w>=widelayoutw2

    dim.m.t = isbigscreen ? 80 : 65
    dim.m.l = isbigscreen ? dim.w*.1 : 0
    dim.m.r = isbigscreen ? dim.m.l : 0
    dim.m.b = isbigscreen ? dim.cardh : dim.cardh*2
    dim.bh = dim.h - dim.m.t - dim.m.b
    dim.graphp = isbigscreen ? 40 : 10
    
    const wrapper = d3.select('#graph')
        .style('width',dim.w+'px')
        .style('height',dim.h+'px')
    const countriesG = wrapper.select('.countries'),
        timelapseG = wrapper.select('.timelapse'),
        xaxis = wrapper.select('.x-axis')

    const yscale = d3.scaleLinear()
        .domain([0,13]).range([dim.m.t,dim.h-dim.m.b-dim.cardw])
    const colorScale = d3.scaleLinear()
        .domain([0,7,13]).range([ccdark,ccmed,cclight])
    const colorScale2= d3.scalePow()
        .domain([0,8,13]).range([ccdark2,ccmed2,cclight2])
        .exponent(.6)

    dim.graphboty = yscale(15)

    const scoreticks = xaxis.selectAll('.tick')
        .data(yscale.ticks())
        .join('p').attr('class','tick')
        .style('top',d=>yscale(d)+'px')
        .style('left',dim.m.l+'px')
        .style('color',d=>colorScale(d))
        .html(d=>`${d3.format('0=2')(d)}/13`)
        .classed('faint',d=>!scount[d])
    const countticks = xaxis.selectAll('.tick-count')
        .data(yscale.ticks())
        .join('p').attr('class','tick-count')
        .style('top',d=>yscale(d)+'px')
        .style('right',dim.m.r+'px')
        .style('color',d=>colorScale(d))
        .html(d=>d3.format('0=2')(scount[d]?scount[d]:0))
        .classed('faint',d=>!scount[d])
    const scorelabel = xaxis.select('.score-label')
        .style('left',dim.m.l+'px')
        .style('top',dim.m.t+'px')
    const countlabel = xaxis.select('.count-label')
        .style('right',dim.m.r+'px')
        .style('top',dim.m.t+'px')
    const labelundefined = xaxis.select('.undefined-label')
        .style('left',dim.m.l+'px')
        .style('top',dim.graphboty+'px')
        .classed('hidden',!datanoscore.length)

    const getX = d=>xscale(d.scorecount)+'px',
        getY = d=>yscale(d.trip_score)+'px',
        getC = d=>`linear-gradient(to bottom right,${colorScale(d.trip_score)},${colorScale2(d.trip_score)}`,
        getZ = d=>Math.round(zscale(d.country))

    const stickrightx = scoreticks.nodes()[0].getBoundingClientRect().right,
        ctickleftx = countticks.nodes()[0].getBoundingClientRect().left
    dim.m.gl = stickrightx - margin + marginsmall
    dim.m.gr = window.innerWidth - ctickleftx
    dim.bw = dim.w - dim.m.gl - dim.m.gr
    dim.paramsw = d3.median([230,dim.bw*.45,280])
    
    xscale.range([dim.m.gl+dim.graphp,dim.w-dim.m.gr-dim.cardw-dim.graphp])
    
    const gridlines = xaxis.selectAll('.grid-line')
        .data(yscale.ticks())
        .join('div').attr('class','grid-line')
        .style('top',d=>yscale(d)+'px')
        .style('left',dim.m.gl+'px')
        .style('width',dim.bw+'px')
        .style('border-top',d=>`1px solid ${colorScale(d)}`)
        .classed('faint',d=>!scount[d])

    updategraph()

    // Interactivity
    const params = d3.select('#params')
        .style('max-height',dim.cardw*2+'px')
        .style('width',dim.paramsw+'px')
        .style('right',dim.m.r+'px')

    const yearbutton = params.select('.year-select'),
        yearlist = params.select('.year-list'),
        yearlabel = params.select('.year .label'),
        regionbutton = params.select('.region-select'),
        regionlist = params.select('.region-list'),
        regionlabel = params.select('.region .label'),
        regionclearbutton = params.select('.region .clear'),
        countrybutton = params.select('.country-select'),
        countrylist = params.select('.country-list'),
        countryclearbutton = params.select('.country-param .clear'),
        timelapsebutton = params.select('.timelapse'),
        backbutton = params.select('.back')
    
    const lists = [yearlist,regionlist,countrylist]
    function togglelist(type){
        const listel = type=='year' ? yearlist 
                : type=='region' ? regionlist 
                : countrylist
        listel.classed('hidden',false)
        infocard.classed('hidden',true)
        params.selectAll(`.close`).classed('hidden',true)
        params.select(`.${type} .close`).classed('hidden',false)
        if (mode==1) {
            if (!isbigscreen) wrapper.classed('hidden',true)
            lists.filter(d=>d!=listel).forEach(e=>e.classed('hidden',true))
            if (type=='region') {
                yearlabel.classed('hidden',true)
                yearbutton.classed('hidden',true)
            }
        }
        if (type=='country-param') {
            wrapper.classed('hidden',true)
            intro.classed('hidden',true)
            if (!isbiggerscreen) nav.classed('hidden',true)
            if (mode==1) {
                yearbutton.classed('hidden',true)
                yearlabel.classed('hidden',true)
                regionbutton.classed('hidden',true)
                regionlabel.classed('hidden',true)
                if (region!='All') regionclearbutton.classed('hidden',true)
            }
            if (!scrollctashown) {
                const ylistbot = listel.node().getBoundingClientRect().bottom,
                    lastchildy = listel.select('.option:last-child').node().getBoundingClientRect().y
                if (lastchildy >= ylistbot) params.select('.cta')
                    .style('left',()=>{
                        const leftx = params.node().getBoundingClientRect().x
                            - countrylist.node().getBoundingClientRect().x
                        return -leftx+'px'
                    })
                    .classed('hidden',false)
                    .style('animation','movescrollcta 5s ease 1 forwards')
                scrollctashown=1
            }
        } 
    }
    const listw = d3.min([dim.w-dim.m.l-dim.m.r,600])

    yearbutton.html(year)
        .on('click',d=>togglelist('year'))
    const years = d3.range(2000,2022)
    const yearoptions = yearlist.style('width',listw+'px')
        .selectAll('.option').data(years)
        .join('p').attr('class','option button')
        .classed('selected',d=>d==year)
        .html(d=>d)
    const yoptionmaxw = d3.max(
        yearoptions.nodes(),
        d=>d.getBoundingClientRect().width
    )
    yearoptions.style('width',yoptionmaxw+'px')
        .on('click',(e,d)=>{
            oldyear=year
            year=d
            if (oldyear==year) return
            yearoptions.classed('selected',d=>d==year)
            yearbutton.html(year)
            clearparamsview()
            updatedata()
            updategraph()
        })
    
    const rlist = [...regions,'All']
    regionbutton.html(region)
        .on('click',d=>togglelist('region'))
    const regionoptions = regionlist.style('width',listw+'px')
        .selectAll('.option').data(rlist)
        .join('p').attr('class','option button')
        .classed('selected',d=>d==region)
        .html(d=>d)
    regionoptions.on('click',(e,d)=>{
        oldregion=region
        region=d
        if (oldregion==region) return
        regionoptions.classed('selected',d=>d==region)
        regionbutton.html(region)
        regionclearbutton.classed('hidden',region=='All')
        const rcountries = data.filter(d=>d.region==region).map(d=>d.country)
        countryoptions.classed('region-pop',d=>rcountries.includes(d))
        clearparamsview()
        updategraph()
    })
    regionclearbutton.on('click',()=>{
        region='All'
        regionoptions.classed('selected',d=>d=='All')
        regionbutton.html('All')
        regionclearbutton.classed('hidden','true')
        countryoptions.classed('region-pop',false)
        updategraph()
    })

    let clist = d3.sort(
        cdata.map(d=>d.country),
        (a,b)=>d3.ascending(a,b)
    )
    clist = [...clist,'All']
    countrybutton.html(country)
        .on('click',d=>togglelist('country-param'))
    const topy = countrybutton.node().getBoundingClientRect().top,
        clistmaxw = dim.w - dim.m.r - dim.m.l,
        clistmaxh = topy - margin*2
    countryoptions = countrylist.style('width',clistmaxw+'px')
        .selectAll('.option').data(clist)
        .join('p').attr('class','option button')
        .classed('selected',d=>d==country)
        .html(d=>d)
    let clistah = countrylist.node().getBoundingClientRect().height
    if (clistah>clistmaxh) {
        if (dim.m.l) countrylist.style('width',dim.w+'px')
            .style('right',-dim.m.r+'px')
        else countrylist.style('height',clistmaxh+'px')
    }
    clistah = countrylist.node().getBoundingClientRect().height
    if (clistah>clistmaxh) countrylist.style('height',clistmaxh+'px')

    countryoptions.on('click',(e,d)=>{
        oldcountry=country
        country=d
        if (oldcountry==country) return
        countryoptions.classed('selected',d=>d==country)
        timelapsebutton.classed('disabled',country=='All')
        mobileinfobutton.classed('disabled',country=='All')
        countrybutton.html(country)
        countryclearbutton.classed('hidden',country=='All')
        clearparamsview()
        if (mode==1) updategraph()
        else drawtimelapse()
    })
    countryclearbutton.on('click',()=>{
        country='All'
        countryoptions.classed('selected',d=>d=='All')
        timelapsebutton.classed('disabled',true)
        mobileinfobutton.classed('disabled',true)
        countrybutton.html('All')
        countryclearbutton.classed('hidden',true)
        if (mode==1) updategraph()
        else cleartimelapseview()
    })

    params.selectAll('.close').on('click',clearparamsview)
    timelapsebutton.on('click',drawtimelapse)
    backbutton.on('click',cleartimelapseview)

    // SHOW COUNTRY INFO
    const infocard = d3.select('#country-info'),
        infoclosebutton = infocard.select('.close'),
        mousecta = d3.select('.mousecta'),
        infoheader = infocard.select('.country-score'),
        mobileinfobutton = d3.select('#params .see-details')
            .on('click',mobileshowinfo),
        mobileinfo = infocard.select('.mobile-info')
    const infocardw = dim.m.l
            ? d3.min([dim.w-dim.m.l-dim.m.r,350])
            : dim.w-dim.m.l-dim.m.r,
        infocardh = dim.m.l
            ? d3.min([dim.bh,450])
            : window.innerHeight - margin*2 - infoclosebutton.node().getBoundingClientRect().height*2,
        leftx = dim.m.l
            ? params.node().getBoundingClientRect().x - infocardw 
            : margin
    infocard.style('left',leftx+'px')
        .style('width',infocardw+'px')
        .style('height',infocardh+'px')
    const infocardx = infocard.node().getBoundingClientRect().x
    if (infocardx<dim.m.l) infocard.style('left',dim.m.l+'px')
    infoclosebutton.on('click',()=>{infocard.classed('hidden',true)})

    const infobuttons = infocard.selectAll('.info-button'),
        infotexts = infocard.selectAll('.info')
    if (isbigscreen) infotexts.nodes().forEach(n=>{
        const hh = n.getBoundingClientRect().height/2,
            boty = n.getBoundingClientRect().bottom-8
            let bot
        if (boty+hh>window.innerHeight) bot = -(window.innerHeight-margin-boty) + 'px'
        else bot = 'auto'
        d3.select(n).style('bottom',bot)
    })
    infobuttons.on('click',(e,d)=>{
        const m = d3.select(e.target).attr('class').replace('info-button ',''),
            mtext = d3.select(`.info.${m}`).html()
        mobileinfo.classed('hidden',false)
            .style('bottom',`-30px`)
            .transition().duration(100).ease(d3.easeCubicOut)
            .style('bottom',`-8px`)
        mobileinfo.select('p').html(mtext)
    })
    mobileinfo.select('.close').on('click',()=>{ mobileinfo.classed('hidden',true) })

    const mindragx = margin+dim.m.l,
        maxdragx = params.node().getBoundingClientRect().x - infocardw
    let mousedx
    if (isbigscreen) infocard.call(d3.drag()
        .on('start',e=>{
            mousedx = e.x-infocard.node().getBoundingClientRect().x
        })
        .on('drag',(e,d)=>{
            const leftx = d3.median([
                mindragx,
                e.x - mousedx,
                maxdragx
            ])
            infocard.style('left',leftx+'px')
        })
    )

    // OTHER ELEMENTS
    if (!istouchscreen) wrapper.on('mousemove',movecta)
    const intro = d3.select('#intro'),
        nav = d3.select('nav'),
        mobileintrobutton = nav.select('.about')
    const iboty = isbiggerscreen ? window.innerHeight-countrybutton.node().getBoundingClientRect().bottom
        : isbigscreen ? window.innerHeight - mobileintrobutton.node().getBoundingClientRect().bottom - intro.node().getBoundingClientRect().height
        : 0
    const ileftx = isbigscreen ? dim.m.l+margin : 0
    intro.style('left',ileftx+'px')
        .style('bottom',iboty+'px')
        .classed('hidden',!isbiggerscreen)
    if (isbigscreen) nav.style('left',dim.m.l+margin+'px')

    mobileintrobutton.on('click',()=>{
        if (intro.classed('hidden')) {
            intro.classed('hidden',false)
            mobileintrobutton.classed('close-button',isbigscreen)
                .html(isbigscreen?'✕':'OK')
        } else {
            intro.style('transition','var(--transition)').classed('hidden',true)
            mobileintrobutton.classed('close-button',false).html('?')
        }
    })

    if (!isbiggerscreen && document.cookie=='') d3.timeout(()=>{
        intro.classed('hidden',false)
        intro.style('opacity',0)
            .style('transform',isbigscreen?'translateY(-5px)':'translateY(5px)')
            .transition().duration(500)
            .style('opacity',1)
            .style('transform','none')
        d3.timeout(()=>{
            mobileintrobutton.classed('close-button',isbigscreen)
                .html(isbigscreen?'✕':'OK')
        },300)
    },1000)
    if (document.cookie=='') document.cookie='visited'

    // FUNCTIONS
    function updatedata() {
        let yeardata = trdata.filter(d=>d.year==year)
        yeardata.map(d=>{
            const o = cdata.filter(c=>c.iso==d.iso)[0]
            d.country = o.country
            d.region = o.region
        })
        datawscore = d3.sort(
            yeardata.filter(d=>d.trip_score!=null),
            (a,b)=>d3.ascending(a.trip_score,b.trip_score) 
            || d3.ascending(getregI(a.region),getregI(b.region))
            || d3.ascending(a.country,b.country)
        )
        datanoscore = yeardata.filter(d=>d.trip_score==null)
        scount = {}
        datawscore.map(d=>{
            const score = d.trip_score
            if (!scount[score]) scount[score] = 1
            else scount[score]++
            d.scorecount = scount[score]
        })
        cwscore = datawscore.map(d=>d.country)
        hasscore = d=>cwscore.includes(d.country)
        data.forEach((d,i)=>{
            let o
            if (hasscore(d)) o = datawscore.filter(c=>c.country==d.country)[0]
            else o = datanoscore.filter(c=>c.country==d.country)[0]
            if (o) metrics.forEach(m=>{ d[m] = o[m] })
            else metrics.forEach(m=>{ d[m] = null })
        })

        zscale.domain(cwscore)
        scountrange = d3.extent(data,d=>d.scorecount)
        xscale.domain(scountrange)
    }
    function updategraph(){
        let noscorecount = 0
        let countries = countriesG.selectAll('.country')
        if (countries.empty()) countries = countries.data(data).join('div')
            .style('width',dim.cardw+'px').style('height',dim.cardw*.7+'px')
            .style('background',d=>getC(d))
            .style('z-index',d=>hasscore(d) ? getZ(d) : 1)
            .style('left',d=>hasscore(d)?xscale.range()[0]+'px':dim.m.l+'px')
            .style('top',d=>hasscore(d) ? getY(d) : dim.graphboty+'px')
            .html(d=>d.country)
            .on('click',showinfo)
        if (!istouchscreen) countries.on('mouseover',showcta)
            .on('mouseout',hidecta)
        countries.attr('class',d=>hasscore(d)?'country has-score':'country no-score')
            .classed('region-faint',d=>d.region!=region&&region!='All'&&d.country!=country)
            .classed('country-pop',d=>d.country==country)
            .classed('showcta',d=>d.country=='Uruguay'&&!clickctashown)
            .transition().duration(500)
            .style('z-index',d=>hasscore(d) ? getZ(d) : zscale.range()[0])
                .style('background',d=>hasscore(d)?getC(d):'var(--countrynoscorecolor)')
                .style('left',(d,i)=> {
                    let x
                    if (hasscore(d)) x = getX(d)
                    else {
                        x = dim.m.l+noscorecount*dim.cardw/6+'px'
                        noscorecount++
                    }
                    return x
                })
                .style('top',d=>hasscore(d) ? getY(d) : dim.graphboty+'px')
                .style('transform','none')

            const scountry = countriesG.selectAll('.country')
                .filter(d=>d.country==country)
            let cscore
            if (scountry.nodes().length) cscore = scountry.data()[0].trip_score
            scoreticks.classed('tick-pop',d=>d==cscore).classed('faint',d=>!scount[d])
            countticks.html(d=>d3.format('0=2')(scount[d]?scount[d]:0))
                .classed('tick-pop',d=>d==cscore).classed('faint',d=>!scount[d])
            gridlines.classed('grid-pop',d=>d==cscore).classed('faint',d=>!scount[d])
            labelundefined.classed('hidden',!data.filter(d=>d.trip_score==null).length)
    }
    function drawtimelapse() {
        if (mode==1) {
            clearparamsview()
            countlabel.html('Number of Years with Score')
            mode=2
        }
        clearparamsview()
        mobileinfobutton.classed('disabled',true)
        countryoptions.filter(d=>d=='All').classed('disabled',true)
        const iso = cdata.filter(d=>d.country==country)[0].iso,
            countrydata = trdata.filter(d=>d.iso==iso&&d.year>1999)
        xscale.domain([2000,2021])
        let noscorecount = 0
        scount = {}
        d3.range(14).forEach(score=>{
            scount[score] = countrydata.filter(d=>d.trip_score==score).length
        })
        timelapseG.selectAll('.country').remove()
        const tlyears = timelapseG.selectAll('.country')
            .data(countrydata).join('div').attr('class','country')
            .classed('no-score',d=>d.trip_score==null)
            .style('background',d=>getC(d))
            .style('width',dim.cardw+'px').style('height',dim.cardw*.7+'px')
            .style('top',(d,i,a)=>{
                let y
                if (d.trip_score==null) y = dim.graphboty+'px'
                else if (!i) y = getY(d)
                else {
                    const pscore = d3.select(a[i-1]).datum().trip_score
                    y = yscale(pscore)+'px'
                }
                return y
            })
            .style('left',(d,i,a)=> {
                let x
                if (d.trip_score==null) x = dim.m.l+'px'
                else if (!i || i==1) x = xscale.range()[0]+'px'
                else {
                    const pyear = d3.select(a[i-1]).datum().year
                    x = xscale(pyear)+'px'
                }
                return x
            })
            .html(d=>{
                let text
                if (d.year<2021) text = d.year
                else if (dim.cardw<100)
                    text = country=='Central African Republic' ? `CAR, ${d.year}`
                        : country=='Papua New Guinea' ? `PNG, ${d.year}`
                        : country=='Trinidad & Tobago' ? `T&T, ${d.year}`
                        : country=='Bosnia & Herzegovina' ? `B&H, ${d.year}`
                        : country=='Sao Tome & Principe' ? `ST&P, ${d.year}`
                        : country=='United Arab Emirates' ? `UAE, ${d.year}`
                        : country+',<br>'+d.year
                else text = country+', '+d.year
                return text
            })
            .style('opacity',0)
            .on('click',showinfo)
        if (!istouchscreen) tlyears.on('mouseover',showcta)
            .on('mouseout',hidecta)
        tlyears.transition().duration(100)
                .delay((d,i)=>i*100)
                .style('opacity',1)
                .style('top',d=>d.trip_score!=null ? getY(d) : dim.graphboty+'px')
                .style('left',d=>{
                    let x
                    if (d.trip_score!=null) x = xscale(d.year)+'px'
                    else {
                        x = dim.m.l+noscorecount*dim.cardw/10+'px'
                        noscorecount++
                    }
                    return x
                })  
        scoreticks.classed('faint',d=>!scount[d])
        countticks.html(d=>d3.format('0=2')(scount[d]?scount[d]:0))
            .classed('faint',d=>!scount[d])
        gridlines.classed('faint',d=>!scount[d])
        labelundefined.classed('hidden',!countrydata.filter(d=>d.trip_score==null).length)
    } 
    function clearparamsview(){
        wrapper.classed('hidden',false)
        infocard.classed('hidden',true)
        nav.classed('hidden',false)
        if (isbiggerscreen) intro.classed('hidden',false)
        if (isbigscreen) mobileintrobutton.classed('close-button',false).html('?')
        if (scrollctashown) params.select('.cta').style('display','none')
        if (mode==1) {
            params.selectAll('.button').filter((d,i,a)=>!d3.select(a[i]).classed('back')).classed('hidden',false)
            lists.forEach(l=>l.classed('hidden',true))
            params.selectAll('.close').classed('hidden',true)
            params.selectAll('.label').classed('hidden',false)
            if (region!='All') regionclearbutton.classed('hidden',false)
            if (country!='All') countryclearbutton.classed('hidden',false)
        } else {
            if (!countrieshidden) {
                countriesG.selectAll('.country').classed('hidden',true)
                const gels = [scoreticks,countticks,gridlines],
                    pels = [yearbutton,yearlabel,regionbutton,regionlabel,regionclearbutton,labelundefined]
                gels.forEach(e=>e.classed(e==gridlines?'grid-pop':'tick-pop',false))
                pels.forEach(e=>e.classed('hidden',true))
                countrieshidden=1
            }
            countrylist.classed('hidden',true)
            params.select('.country-param .close').classed('hidden',true)
            timelapsebutton.classed('hidden',true)
            backbutton.classed('hidden',false)
        }
    }
    function cleartimelapseview(){
        mode=1
        clearparamsview()
        updatedata()
        updategraph()
        countlabel.html('Number of Countries with Score')
        timelapseG.selectAll('.country').classed('hidden',true)
        countriesG.selectAll('.country').classed('hidden',false)
        timelapsebutton.classed('hidden',false)
        if (country!='All') mobileinfobutton.classed('disabled',false)
        backbutton.classed('hidden',true)
        countryoptions.classed('disabled',false)
        countrieshidden=0
    }
    function movecta(e){
        if (mousecta.classed('hidden')) return
        mousecta.style('left',e.x+'px').style('top',e.y+'px')
    }
    function showcta(){
        mousecta.classed('hidden',false)
    }
    function hidecta(){
        mousecta.classed('hidden',true)
    }
    function showinfo(e,d) {
        if (!infocard.classed('hidden')&&d3.select(this).classed('country-pop')) {
            infocard.classed('hidden',true)
            d3.select(this).classed('country-pop',false)
                .classed('region-faint',d=>d.region!=region&&region!='All')
            if (mode==1) {
                country=='All'
                timelapsebutton.classed('disabled',true)
                countrybutton.html('All')
                countryclearbutton.classed('hidden',true)
                scoreticks.classed('tick-pop',false)
                countticks.classed('tick-pop',false)
                gridlines.classed('grid-pop',false)
            }
            return
        }
        if (mode==1) {
            if (!clickctashown) {
                countriesG.select('.showcta').classed('showcta',false)
                clickctashown=1
            }
            country=d.country
            timelapsebutton.classed('disabled',false)
            countrybutton.html(country)
            countryclearbutton.classed('hidden',false)
            countriesG.selectAll('.country').classed('country-pop',cd=>cd.country==country)
                .classed('region-faint',cd=>cd.country!=country&&cd.region!=region&&region!='All')
            scoreticks.classed('tick-pop',td=>td==d.trip_score)
            countticks.classed('tick-pop',td=>td==d.trip_score)
            gridlines.classed('grid-pop',td=>td==d.trip_score)
            infocard.select('.country-year').html(d.country+', '+year)
        } else {
            infocard.select('.country-year').html(country+', '+d.year)
            timelapseG.selectAll('.country').classed('country-pop',(cd,i,a)=>a[i]==this)
        }

        infocard.classed('hidden',false)
            .style('transform','scaleY(.96)')
            .transition().duration(100).ease(d3.easeCubicOut)
            .style('transform','none')
        infocard.select('.trip-score').html(d.trip_score)
        infoheader.style('background',getC(d))

        let crimsum = 0, recsum = 0, prosum = 0
        crimmetrics.forEach(m=>{crimsum+=d[m]})
        recmetrics.forEach(m=>{recsum+=d[m]})
        prometrics.forEach(m=>{prosum+=d[m]})
        
        infocard.select('.crim .score').html(crimsum)
        infocard.select('.rec .score').html(recsum)
        infocard.select('.pro .score').html(prosum)
        crimmetrics.forEach(m=>displaymetric(m,d))
        recmetrics.forEach(m=>displaymetric(m,d))
        prometrics.forEach(m=>displaymetric(m,d))
    }
    function mobileshowinfo() {
        if (mode==1) clearparamsview()
        const d = countriesG.selectAll('.country').filter((d,i,a)=>d3.select(a[i]).classed('country-pop')).datum()
        infocard.classed('hidden',false)
            .style('bottom',0)
            .transition().duration(100).ease(d3.easeCubicOut)
            .style('bottom',margin+'px')
        infocard.select('.country-year').html(d.country+', '+year)
        infocard.select('.trip-score').html(d.trip_score)
        infoheader.style('background',getC(d))

        let crimsum = 0, recsum = 0, prosum = 0
        crimmetrics.forEach(m=>{crimsum+=d[m]})
        recmetrics.forEach(m=>{recsum+=d[m]})
        prometrics.forEach(m=>{prosum+=d[m]})
        
        infocard.select('.crim .score').html(crimsum)
        infocard.select('.rec .score').html(recsum)
        infocard.select('.pro .score').html(prosum)
        crimmetrics.forEach(m=>displaymetric(m,d))
        recmetrics.forEach(m=>displaymetric(m,d))
        prometrics.forEach(m=>displaymetric(m,d))
    }
    function displaymetric(m,d){
        const mel = infocard.select(`.${m}`)
        mel.select('.name').style('opacity',d[m]?1: .15)
        mel.select('.info-button').style('opacity',d[m]?1: .2)
        mel.select(`.score`).html(d[m]?'+':'')
    }

    window.onresize = ()=>{
        if (!isbigscreen&&oldscreenw==window.innerWidth) return
        
        oldscreenh = window.innerHeight
        wrapper.classed('hidden',true)

        dim.w = window.innerWidth-margin*2
        dim.h = window.innerHeight-margin*2
        dim.cardw = d3.median([90,200,dim.w*.2])
        dim.cardh = dim.cardw*.7
    
        isbigscreen = dim.w>=widelayoutw
        isbiggerscreen = dim.w>=widelayoutw2
    
        dim.m.t = isbigscreen ? 80 : 65
        dim.m.l = isbigscreen ? dim.w*.1 : 0
        dim.m.r = isbigscreen ? dim.m.l : 0
        dim.m.b = isbigscreen ? dim.cardh : dim.cardh*2
        dim.bh = dim.h - dim.m.t - dim.m.b
        dim.graphp = isbigscreen ? 40 : 10

        wrapper.style('width',dim.w+'px')
            .style('height',dim.h+'px')

        yscale.range([dim.m.t,dim.h-dim.m.b-dim.cardw])
        
        dim.graphboty = yscale(15)
        
        scoreticks.style('top',d=>yscale(d)+'px')
            .style('left',dim.m.l+'px')
        countticks.style('top',d=>yscale(d)+'px')
            .style('right',dim.m.r+'px')
        scorelabel.style('left',dim.m.l+'px')
            .style('top',dim.m.t+'px')
        countlabel.style('right',dim.m.r+'px')
            .style('top',dim.m.t+'px')
        labelundefined.style('left',dim.m.l+'px')
            .style('top',dim.graphboty+'px')
        
        intro.classed('hidden',true)
        mobileintrobutton.classed('close-button',false).html('?')
        nav.style('left',isbigscreen?dim.m.l+margin+'px':margin+'px')

        const delay = 100
        d3.timeout(()=>{
            const stickrightx = scoreticks.nodes()[0].getBoundingClientRect().right,
                ctickleftx = countticks.nodes()[0].getBoundingClientRect().left
            dim.m.gl = stickrightx - margin + marginsmall
            dim.m.gr = window.innerWidth - ctickleftx - margin + marginsmall
            dim.bw = dim.w - dim.m.gl - dim.m.gr
            dim.paramsw = d3.median([230,dim.bw*.45,280])

            xscale.range([dim.m.gl+dim.graphp,dim.w-dim.m.gr-dim.cardw-dim.graphp])

            gridlines.style('top',d=>yscale(d)+'px')
                .style('left',dim.m.gl+'px')
                .style('width',dim.bw+'px')

            let noscorecount = 0
            if (mode==1){
                countriesG.selectAll('.country')
                    .style('width',dim.cardw+'px').style('height',dim.cardw*.7+'px')
                    .style('left',(d,i)=> {
                        let x
                        if (hasscore(d)) x = getX(d)
                        else {
                            x = dim.m.l+noscorecount*dim.cardw/6+'px'
                            noscorecount++
                        }
                        return x
                    })
                    .style('top',d=>hasscore(d) ? getY(d) : dim.graphboty+'px')
            }
            else {
                timelapseG.selectAll('.country')
                .style('width',dim.cardw+'px').style('height',dim.cardw*.7+'px')
                .style('top',d=>d.trip_score!=null ? getY(d) : dim.graphboty+'px')
                .style('left',d=>{
                    let x
                    if (d.trip_score!=null) x = xscale(d.year)+'px'
                    else {
                        x = dim.m.l+noscorecount*dim.cardw/10+'px'
                        noscorecount++
                    }
                    return x
                })  
            }

            params.style('max-height',dim.cardw*2+'px')
                .style('width',dim.paramsw+'px')
                .style('right',dim.m.r+'px')

            const listw = d3.min([dim.w-dim.m.l-dim.m.r,600])
            yearlist.style('width',listw+'px')
            yearoptions.style('width','auto')
            const yoptionmaxw = d3.max(
                yearoptions.nodes(),
                d=>d.getBoundingClientRect().width
            )
            yearoptions.style('width',yoptionmaxw+'px')
            regionlist.style('width',listw+'px')
            const topy = countrybutton.node().getBoundingClientRect().top,
                clistmaxw = dim.w - dim.m.r - dim.m.l,
                clistmaxh = topy - margin*2
            countrylist.style('width',clistmaxw+'px')
                .style('height','auto')
            let clistah = countrylist.node().getBoundingClientRect().height
            if (clistah>clistmaxh) {
                if (dim.m.l) countrylist.style('width',dim.w+'px')
                    .style('right',-dim.m.r+'px')
                else countrylist.style('height',clistmaxh+'px')
            }
            clistah = countrylist.node().getBoundingClientRect().height
            if (clistah>clistmaxh) countrylist.style('height',clistmaxh+'px')

            const infocardw = dim.m.l?d3.min([dim.w-dim.m.l-dim.m.r,350]):dim.w-dim.m.l-dim.m.r,
                infocardh = dim.m.l
                    ? d3.min([dim.bh,450])
                    : window.innerHeight - margin*2 - infoclosebutton.node().getBoundingClientRect().height*2,
                leftx = dim.m.l? params.node().getBoundingClientRect().x - infocardw : margin
            infocard.style('left',leftx+'px')
                .style('width',infocardw+'px')
                .style('height',infocardh+'px')
            const infocardx = infocard.node().getBoundingClientRect().x
            if (infocardx<dim.m.l) infocard.style('left',dim.m.l+'px')

            if (isbigscreen) infotexts.nodes().forEach(n=>{
                const hh = n.getBoundingClientRect().height/2,
                    boty = n.getBoundingClientRect().bottom-8
                    let bot
                if (boty+hh>window.innerHeight) bot = -(window.innerHeight-margin-boty) + 'px'
                else bot = 'auto'
                d3.select(n).style('bottom',bot)
            })

            const mindragx = margin+dim.m.l,
                maxdragx = params.node().getBoundingClientRect().x - infocardw
            let mousedx
            if (isbigscreen) infocard.call(d3.drag()
                .on('start',e=>{
                    mousedx = e.x-infocard.node().getBoundingClientRect().x
                })
                .on('drag',(e,d)=>{
                    const leftx = d3.median([
                        mindragx,
                        e.x - mousedx,
                        maxdragx
                    ])
                    infocard.style('left',leftx+'px')
                })
            )

            const iboty = isbiggerscreen ? window.innerHeight-countrybutton.node().getBoundingClientRect().bottom
                : isbigscreen ? window.innerHeight - mobileintrobutton.node().getBoundingClientRect().bottom - intro.node().getBoundingClientRect().height
                : 0
            const ileftx = isbigscreen ? dim.m.l+margin : 0
            intro.style('left',ileftx+'px')
                .style('bottom',iboty+'px')
                .classed('hidden',!isbiggerscreen)
            
            wrapper.classed('hidden',false)
        },delay)

    }
}