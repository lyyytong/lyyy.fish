const print = (...params) => console.log(...params)
const thouFormat = d => d3.format(',')(d)

const navIcon = d3.select('nav .icon').on('click',toggleMenu)
const menu = d3.select('nav .menu')
const menuButtons = menu.selectAll('.button')

init()
async function init(){
    const timelineData = await d3.csv('../data/european-witch-trials/timeline.csv', d3.autoType)
    const countryData = await d3.csv('../data/european-witch-trials/data.csv',d3.autoType)
    drawTimeline(timelineData)
    drawCountryChart(countryData,timelineData)
}

async function drawTimeline(data) {
    const annot = [
        {decade: 1400, desc: "Negligible witch hunting activity before 1400. Between 900 and 1400, Christian authorities considered the existence of witchcraft, but were unwilling to admit that witches existed. A canon by Pope Alexander IV, in effect since 1258, aimed to prevent witchcraft prosecutions. Between 1400 and 1500, witch trials were focused in the Lyon-Lucerne-Freiburg triangle, an area inhabited by remnants of the Cathar and Waldensian movements, the Catholic Church's medieval challengers."},
        {decade: 1520, desc: "Between 1517 and 1520, Martin Luther's Ninety-five Theses criticised the Catholic church of corruption and abuses. It spread throughout Europe and catalyzed the Protestant Reformation. The Catholic church declared Luther's views heretical. The first eruption of confessional warfare."},
        {decade: 1550, desc: "Lutheranism was legalized in most of Europe, allowing princes to choose for their territories either Catholicism or Protestantism. This set Protestantism as legitimate competitor to Catholicism for religious monopoly. Christian authorities had reversed their position regarding witch hunting by this point. Both confessional battles and witch hunting intensified the following decades."},
        {decade: 1580, desc: "Temporary decline of confessional battles between c. 1585 and c. 1615, marking the period of 'cold war' between Catholics and Protestants, with each side forming military alliances in anticipation of further confessional violence. Witch hunting continued to rise, possibly as alternative method of 'campaigning' for influence."},
        {decade: 1620, desc: "Following cold war tension, confessional violence skyrocketed c. 1620 in the form of the Thirty Years' War. Resources being diverted for battles could explain the slowing of witch hunting activity in the following decades."},
        {decade: 1650, desc: "Both confessional violence and witch trials began to decline c. 1650 following the Peace of Westphalia, which created permanent confessional monopolies for Catholics and Protestants, fixing the geography of Europe's religious marketplace."}
    ]
    const annotDecades = annot.map(d=>d.decade)

    const timelineG = d3.select('#timeline')
    const triedG = timelineG.select('.tried-bars')
    const battlesG = timelineG.select('.battles-bars')
    const decadesG = timelineG.select('.decades')
    const axes = timelineG.select('.axes')
    const annotations = timelineG.select('.annotations')
    timelineG.select('.legends')

    const triedScale = d3.scaleLinear()
        .domain(d3.extent(data,d=>d.tried))
        .range([0,95])
        .nice()
    const battlesScale = d3.scaleLinear()
        .domain(d3.extent(data,d=>d.battles))
        .range([0,95])
        .nice()

    const triedBars = triedG.selectAll('div').data(data)
        .join('div').attr('class','tried-bar')
        .style('width',0)
    triedBars.transition().duration(250).ease(d3.easeBackOut)
        .style('width',d=>triedScale(d.tried)+'%')

    const battlesBars = battlesG.selectAll('div').data(data)
        .join('div').attr('class','battles-bar')
        .style('width',0)
    battlesBars.transition().duration(250).ease(d3.easeBackOut)
        .style('width',d=>battlesScale(d.battles)+'%')
    
    timelineG.select('.bg-bars').selectAll('.bg-bar').data(data)
        .join('div').attr('class','bg-bar')
        .style('width',d=>{
            const w =  d3.max([
                battlesScale(d.battles),
                triedScale(d.tried)
            ])
            return w + '%'
        })
    
    const decadeBars = decadesG.selectAll('p').data(data)
        .join('p').attr('class','decade')
        .html(d=>d.decade%50==0 ? d.decade : '-')

    const triedTicks = triedScale.ticks(3)
    triedTicks.shift()
    const battlesTicks = battlesScale.ticks(3)
    battlesTicks.shift()
    
    const axisBG = axes.selectAll('.bg')
        .data(d3.range(3))
        .join('div').attr('class','bg')
    
    axisBG.append('p').attr('class','tried-tick')
        .html(d=>thouFormat(triedTicks[d]))
    axisBG.append('p').attr('class','battles-tick')
        .html(d=>thouFormat(battlesTicks[d]))

    const annotBG = annotations.selectAll('.annotation-bg')
        .data(data).join('div').attr('class','annotation-bg')
    const annotG = annotBG.filter(d=>annotDecades.includes(d.decade))
        .append('div').attr('class','annotation-group')
    const annotButtons = annotG.append('p')
        .attr('class', (d,i)=>i==0?'button flash':'button')
        .html((d,i)=>i+1)
        .on('click',showAnnotation)
    annotG.append('p')
        .attr('class','desc')
        .html(d=>{
            return annot.filter(o=>o.decade==d.decade)[0].desc
        })

    function showAnnotation(e,datum){
        const clicked = d3.select(this)
        if (!clicked.classed('selected')) {
            annotButtons.classed('selected',false)
            clicked.classed('selected',true)
            annotButtons.classed('flash',false)
            const decade = datum.decade
            const isDecade = d => d.decade==decade

            const toHide = annotG.filter(d=>!isDecade(d))
            toHide.select('.desc').classed('displayed',false)
            toHide.select('.button').classed('pop',false)
            annotBG.filter(d=>!isDecade(d)).classed('selected',false)

            const toShow = annotG.filter(d=>isDecade(d))
            toShow.select('.desc').classed('displayed',true)
            toShow.select('.button').classed('pop',true)
            annotBG.filter(d=>isDecade(d)).classed('selected',true)
            
            decadeBars.filter(d=>d.decade%50!=0).html('-')
            if (decade%50!=0)
                decadeBars.filter(d=>isDecade(d)).html(decade)
                    .style('opacity',0)
                    .transition().style('opacity',1)

        } else {
            annotButtons.classed('selected',false)
            annotG.select('.line').classed('displayed',false)
            annotG.select('.desc').classed('displayed',false)
            annotG.select('.button').classed('pop',false)
            decadeBars.filter(d=>d.decade%50!=0).html('-')
            annotBG.classed('selected',false)
        }
    }
}

async function drawCountryChart(data,timelineData) {
    const countryFaiths = [
        {country: "Czech Republic", catSH: 0},
        {country: "Northern Ireland", catSH: 1},
        {country: "Poland", catSH: 0},
        {country: "Ireland", catSH: 1},
        {country: "Austria", catSH: 1},
        {country: "Denmark", catSH: 0},
        {country: "Estonia", catSH: 0},
        {country: "Luxembourg", catSH: 1},
        {country: "Sweden", catSH: 0},
        {country: "Netherlands", catSH: 0},
        {country: "Italy", catSH: 1},
        {country: "Finland", catSH: 0},
        {country: "Norway", catSH: 0},
        {country: "Belgium", catSH: 1},
        {country: "England", catSH: 0},
        {country: "Hungary", catSH: 0},
        {country: "Spain", catSH: 1},
        {country: "Scotland", catSH: 0},
        {country: "France", catSH: 0},
        {country: "Switzerland", catSH: 0},
        {country: "Germany", catSH: 0}
    ]
    countryFaiths.sort((a,b)=>d3.descending(a.catSH,b.catSH))

    const countries = countryFaiths.map(d=>d.country)
    const countryNum = countries.length
    const decades = timelineData.map(d=>d.decade)


    const metricA = d => d.tried

    const maxTried = d3.max(timelineData,d=>metricA(d))
    const widthScale = d3.scaleLinear()
        .domain([0,maxTried])
        .range([0,100])
        .nice()
        
    const countryCatSH = countryFaiths.filter(d=>d.catSH).map(d=>d.country)
    const lastCatSHCountry = countryCatSH.slice(-1)
    
    const countryChartG = d3.select('#countries')
    const stream = countryChartG.select('.stream-graph')
    const decadesG = countryChartG.select('.decades')
    const countriesG = countryChartG.select('.countries')
    const countrySelect = countriesG.select('.button')
    const countryList = countriesG.select('.country-list')
    const countryDesc = countriesG.select('.desc')
    countryChartG.select('.legends')    
    
    decadesG.selectAll('.decade').data(decades)
        .join('p').attr('class','decade')
        .html(d=>d%50==0?d:'-')
    const rvCountries = [...countries,'All Countries']
    const countryOptions = countryList.selectAll('.country')
        .data(rvCountries.reverse())
        .join('p').attr('class','country')
        .html(d=>d)

    decades.forEach((dec,i)=>{
        const decadeG = stream.append('div').attr('class','decade-group')
        const decadeData = data.filter(d=>d.decade==dec)
        decadeData.sort((a,b)=>countries.indexOf(a.country) - countries.indexOf(b.country))
    
        const decadeCountries = decadeG.selectAll('.country').data(decadeData)
            .join('div')
            .attr('class',o => {
                const isCatSH = countryFaiths.filter(d=>d.country==o.country)[0].catSH
                const countryBarW = widthScale(metricA(o))
                const countryClass = o.country.replace(' ','-')
                if (countryBarW<=2) {
                    if (isCatSH) return `country ${countryClass} fill-purple`
                    else return `country ${countryClass} fill-red`
                } else {
                    if (isCatSH) return `country ${countryClass} gradient-purple`
                    else return `country ${countryClass} gradient-red`
                }
            })
            .classed('white-right-border',d=>d.country==lastCatSHCountry?true:false)
            .style('width',0)
        decadeCountries.transition().duration(400).ease(d3.easeBackOut)
            .style('width',d=>widthScale(metricA(d))+'%')
        decadeCountries.append('p').attr('class','trial-num')
    })

    // INTERACTIVITY
    let sCountry
    countrySelect.on('click',toggleCountryList)
    function toggleCountryList(){
        const delay = 15
        const maxDelay = delay*countryNum
        countrySelect.style('pointer-events','none')
        d3.timeout(()=>{
            countrySelect.style('pointer-events','all')
        },maxDelay)

        if (countrySelect.classed('selected')) {
            countrySelect.classed('selected',false)
            if (!sCountry) countrySelect.classed('flash',true)
            else countrySelect.classed('pop',true)
            countryOptions.transition().duration(delay)
                .ease(d3.easePolyOut)
                .style('top','20px')
            d3.timeout(() => {
                countryList.style('display','none')
            },delay)
        } else {
            countrySelect.classed('selected',true)
                .classed('flash',false)
                .classed('pop',false)
            countryList.style('display','flex')
            countryOptions.style('top','100px').transition()
                .duration((d,i)=> maxDelay - i*delay)
                .ease(d3.easePolyOut)
                .style('top',0+'px')
        }
    }
    countryOptions.on('click', showCountry)
    function showCountry(e,d){
        const name = e.target.innerHTML
        sCountry = d
        countrySelect.html(sCountry)
        toggleCountryList()

        if (name!='All Countries') {
            const countryClass = sCountry.replace(' ','-')
    
            const otherCountryBars = stream.selectAll(`.country:not(.${countryClass})`)
            otherCountryBars.classed('faint',true)
            otherCountryBars.select('p').html('')
            
            const sCountryBars = stream.selectAll(`.${countryClass}`)
            if (!countryCatSH.includes(sCountry)) {
                sCountryBars.classed('red-left-border',d=>metricA(d)?true:false)
            } else {
                sCountryBars.classed('white-right-border',false)
                    .classed('purple-right-border',d=>metricA(d)?true:false)
            }
            sCountryBars.classed('faint',false)
            sCountryBars.select('p')
                .html(d=>thouFormat(metricA(d)))
                .style('right','10px')
                .style('transform','translateX(100%)')
                .transition().duration(400).ease(d3.easeBackOut)
                .style('right','-1.5px')
            
            countryDesc.selectAll(`p:not(.${countryClass})`).style('display','none')
            countryDesc.select(`.${countryClass}`).style('display','block')
        } else {
            const allBars = stream.selectAll('.country')
                .classed('red-left-border',false)
                .classed('purple-right-border',false)
                .classed('white-right-border',d=>d.country==lastCatSHCountry?true:false)
                .classed('faint',false)
            allBars.transition().duration(150)
                .ease(d3.easePolyOut)
                .style('opacity',1)
            allBars.select('p').html('')

            countryDesc.selectAll('p').style('display','none')
        }
    }
    
}

function toggleMenu(){
    const delay = 150
    if (menu.classed('open')) {
        navIcon.transition()
            .style('transform','none')
        menu.classed('open',false)
        menuButtons.transition().duration(100)
            .style('top','-20px')
        d3.timeout(()=>{
            menu.style('display','none')
        },50)
    } else {
        navIcon.transition()
            .style('transform','rotate(-135deg)')
        menu.classed('open',true)
        menu.style('display','flex')
        menuButtons.style('top','-50px')
            .transition().duration((d,i)=>delay+i*60)
            .ease(d3.easePolyOut)
            .style('top','0px')
    }
}