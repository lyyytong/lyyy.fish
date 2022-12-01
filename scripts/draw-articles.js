drawList()
async function drawList() {
    const data = await d3.csv('data/articles.csv')
    data.sort((a,b)=>d3.descending(a.date,b.date))
    
    let styles
    let lineHeight
    let listHeight
    let marginTopBot
    let height
    let dim
    let coords

    const wrapper = d3.select('#articles').append('svg')
    const bounds = wrapper.append('g')
    const articleAxis = bounds.append('line').attr('class', 'article-axis')
    const textBounds = bounds.append('g')

    updateDimensions()

    const getRandomX = d3.randomUniform(dim.boundedWidth)
    const getRandomXLeft = d3.randomUniform(dim.boundedWidth * .3)
    const getRandomXRight = d3.randomUniform(dim.boundedWidth * .7, dim.boundedWidth)
    let randomX1 = getRandomX()
    let randomX2 = randomX1 >= dim.boundedWidth / 2 ? getRandomXLeft() : getRandomXRight()
    let randomWidth = Math.abs(randomX1 - randomX2)
    let alpha = Math.atan(randomWidth / dim.height)

    articleAxis.attr('x1', randomX1)
        .attr('x2', randomX2)
        .attr('y2', dim.height)
    
    const articles = textBounds.selectAll('.article')
        .data(data).join('a')
        .attr('class', 'article')
        .attr('href', d => d.name != '(coming soon)' ? 'pages/' + d.name.replaceAll(' ', '-') + '.html' : '')
        .append('text')
            .html(d => d.name)

    updateListCoords()

    window.addEventListener('resize',updateList)
    screen.orientation.addEventListener('change',updateList)
    function updateList(){
        const oldBoundedWidth = dim.boundedWidth
        updateDimensions()

        randomX1 = randomX1 / oldBoundedWidth * dim.boundedWidth
        randomX2 = randomX2 / oldBoundedWidth * dim.boundedWidth
        randomWidth = Math.abs(randomX1 - randomX2)
        alpha = Math.atan(randomWidth / dim.height)
        
        articleAxis.attr('x1', randomX1)
            .attr('x2', randomX2).attr('y2', dim.height)
        
        updateListCoords()
    }
    function updateDimensions(){
        styles = getComputedStyle(document.querySelector('body'))
        lineHeight = parseFloat(styles.lineHeight.split('px')[0])

        listHeight = data.length * lineHeight
        marginTopBot = window.innerHeight * .1
        height = listHeight + marginTopBot * 2

        dim = {
            margin: {}
        }
        dim.width = window.innerWidth
        dim.height = d3.max([height, window.innerHeight])
        dim.margin.top = marginTopBot
        dim.margin.bottom = marginTopBot
        dim.margin.left = window.innerWidth *.1
        dim.margin.right = window.innerWidth *.1
        dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right
        dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom

        wrapper.attr('width', dim.width).attr('height', dim.height)
        bounds.style('transform', `translateX(
            ${dim.margin.left}px
        )`)
        textBounds.style('transform', `translateY(
            ${height < window.innerHeight 
                ? dim.boundedHeight / 2 - listHeight / 2 + dim.margin.top
                : dim.margin.top
        }px)`)
    }
    function updateListCoords(){
        articles.attr('y', (d, i) => lineHeight * i + lineHeight / 2)
        coords = []
        articles.nodes().forEach((d, i) => {
            const triangleHeight = d.getBoundingClientRect().y+d.getBoundingClientRect().height/2
            const triangleBase = Math.tan(alpha) * triangleHeight
            const x = randomX1 > randomX2 ? randomX1 - triangleBase : randomX1 + triangleBase
            const textWidth = d.getBoundingClientRect().width
            const rightX = x + textWidth
            const textAnchor = rightX > dim.boundedWidth ? 'end' : 'start'
            const x0 = textAnchor == 'start' ? x - 10 : x + 10
            const delay = 1000 + 30 * i
            coords.push({ x: x, x0: x0, textAnchor: textAnchor, delay: delay })
        })
        articles.attr('x', (d, i) => coords[i].x0)
            .style('text-anchor', (d, i) => coords[i].textAnchor)
        articles.nodes().forEach((d, i) => {
            d3.select(d).transition()
                .duration(coords[i].delay)
                .ease(d3.easeElasticOut)
                .attr('x', coords[i].x)
        })
    }
}

const about = d3.select('#about')
const aboutBg = d3.select('#about-bg')
const aboutContainer = d3.select('#about-container')
const aboutBack = d3.select('#about-back')
about.on('click', () => {
    aboutBg.transition().duration(200)
        .style('opacity', 1)
    about.transition().duration(200)
        .style('opacity', 0).style('display', 'none')
    aboutContainer.transition().duration(200)
        .style('opacity', 1).style('display', 'flex')
})
aboutBack.on('click', () => {
    aboutBg.transition().duration(200)
        .style('opacity', 0)
    about.transition().duration(200)
        .style('opacity', 1).style('display', 'inline')
    aboutContainer.transition().duration(200)
        .style('opacity', '0').style('display', 'none')
})