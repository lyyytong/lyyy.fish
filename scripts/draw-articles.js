const styles = getComputedStyle(document.querySelector('body'))
const lineHeight = parseFloat(styles.lineHeight.split('px')[0])
const largeLineHeight = lineHeight * 1.2
const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

drawList()
async function drawList() {
    const data = await d3.csv('data/articles.csv')
    // data.sort((a,b)=>d3.descending(a.date,b.date))
    const listHeight = data.length * largeLineHeight
    const margin = screenHeight * .12
    const height = listHeight + margin * 2
    let dim = {
        width: screenWidth,
        height: d3.max([height, screenHeight]),
        margin: {
            top: margin,
            right: 0,
            bottom: margin,
            left: 0
        }
    }
    dim.margin.left = dim.width * .1
    dim.margin.right = dim.width * .1
    dim.boundedWidth = dim.width - dim.margin.left - dim.margin.right
    dim.boundedHeight = dim.height - dim.margin.top - dim.margin.bottom
    const textMargin = 10

    const wrapper = d3.select('#articles').append('svg')
        .attr('width', dim.width).attr('height', dim.height)
    const bounds = wrapper.append('g')
        .style('transform', `translateX(
            ${dim.margin.left}px
        )`)

    const getRandomX = d3.randomUniform(dim.boundedWidth)
    const getRandomXLeft = d3.randomUniform(dim.boundedWidth * .3)
    const getRandomXRight = d3.randomUniform(dim.boundedWidth * .7, dim.boundedWidth)
    const randomX1 = getRandomX()
    let randomX2
    if (randomX1 >= dim.boundedWidth / 2) randomX2 = getRandomXLeft()
    else randomX2 = getRandomXRight()
    const randomWidth = Math.abs(randomX1 - randomX2)
    const alpha = Math.atan(randomWidth / dim.height)

    const articleAxis = bounds.append('line').attr('class', 'article-axis')
        .attr('x1', randomX1).attr('x2', randomX2)
        .attr('y2', dim.height)

    const textBounds = bounds.append('g')

    const articles = textBounds.selectAll('.article')
        .data(data)
        .join('a').attr('class', 'article')
        .attr('href', d => d.name != '(coming soon)' ? 'pages/' + d.name.replaceAll(' ', '-') + '.html' : '')
        .append('text')
        .html(d => d.name)
        .attr('y', (d, i) => largeLineHeight * i + largeLineHeight / 2)

    if (height < screenHeight) {
        textBounds.style('transform', `translateY(
            ${dim.boundedHeight / 2 - listHeight / 2 + dim.margin.top}px
        )`)
    }
    else {
        textBounds.style('transform', `translateY(
            ${dim.margin.top}px
        )`)
    }

    let xCoords = []
    articles.nodes().forEach((d, i) => {
        const triangleHeight = d.getBoundingClientRect().y
        const triangleBase = Math.tan(alpha) * triangleHeight
        const x = randomX1 > randomX2 ? randomX1 - triangleBase : randomX1 + triangleBase
        const textWidth = d.getBoundingClientRect().width
        const rightX = x + textWidth + textMargin
        const textAnchor = rightX > dim.boundedWidth ? 'end' : 'start'
        const x0 = textAnchor == 'start' ? x - textMargin : x + textMargin
        const delay = 1200 + 30 * i
        xCoords.push({ x: x, x0: x0, textAnchor: textAnchor, delay: delay })
    })

    articles
        .attr('x', (d, i) => xCoords[i].x0)
        .style('text-anchor', (d, i) => xCoords[i].textAnchor)
    articles.nodes().forEach((d, i) => {
        d3.select(d).transition()
            .duration(xCoords[i].delay)
            .ease(d3.easeElasticOut)
            .attr('x', xCoords[i].x)
    })
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
