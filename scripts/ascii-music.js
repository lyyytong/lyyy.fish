const print = (...params) => console.log(...params)
const getHeight = el => el.getBoundingClientRect().height
const getWidth = el => el.getBoundingClientRect().width
const getY = el => el.getBoundingClientRect().y
const timeFormat = (seconds)=>{
    const minute = '0'+Math.floor(seconds/60)
    const second = seconds%60 < 10
        ? '0'+Math.floor(seconds%60)
        : Math.floor(seconds%60)
    return minute+':'+second
}
const graph = d3.select('#mel-spectrogram')
const paragraph = graph.select('.paragraph p')
const progressLine = graph.select('.line')
const axes = graph.select('.axes')
const yAxis = axes.select('.y-axis')
const xAxis = axes.select('.x-axis')
const playButton = d3.select('#audio .play-button')
const selectButton = d3.select('#audio .track-select')
const trackOptionG = d3.select('#audio .options')
const trackOptions = trackOptionG.selectAll('p')
const selectedTrack = d3.select('#audio .selected')
const loading = d3.select('#audio .loading')

let track = 'rhapsody'
window.onbeforeunload = ()=>{window.scrollTo(0,1)}
// window.scrollTo(0,0)

init()
function init() {
    // $@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`'.
    const aR = '../sounds/ascii-music/',
        dR = '../data/ascii-music/'
    const trackData = {
        fantasia: {audioL: aR+'fantasia.mp3',data: dR+'fantasia.csv', chars: ['\u00A0','.',',','c','e','¢','N','$','W']},
        rhapsody: {audioL: aR+'rhapsody.m4a', data: dR+'rhapsody.csv', chars: ['\u00A0','.','-','+','c','g','$','W']},
        streetrag: {audioL: aR+'streetrags.mp3', data: dR+'streetrags.csv', chars: ['\u00A0','.',',','-','o','m','@','W']},
        cellosuite: {audioL: aR+'cellosuite.mp3', data: dR+'cellosuite.csv', chars: ['\u00A0','\u00A0','.','.',',','c','¢','g','N','W']}
    }

    drawTrack()
    async function drawTrack(){
        const dataLink = trackData[track].data,
            audioLink = trackData[track].audioL,
            chars = trackData[track].chars
        
        // LOAD TEXT DATA
        const data = await d3.csv(dataLink,d3.autoType)
        
        // DEF SCALES
        const max = d3.max(data.map(d=>d3.max(Object.values(d))))
        const charScale = d3.scaleQuantize()
            .domain([1,max]).range(chars)
        const heightScale = d3.scaleLinear().clamp(true)
    
        // DRAW TEXTS
        let texts = []
        data.forEach(d=>{
            const vals = Object.values(d)
            const lineChars = vals.map(v =>charScale(v))
            const line = lineChars.join('')
            texts.push(line)
        })
        let text = texts.join('<br>')
        await paragraph.html(text)
    
        // DEF DIMENSIONS & UPDATE SCALES
        const paragraphN = paragraph.node()
        let height = getHeight(paragraphN)
        let width = getWidth(paragraphN)
        let paragraphY = getY(paragraphN)
        let halfInnerH = window.innerHeight/2
        heightScale.range([0,height])
        axes.style('height',height+'px').style('width',width+'px')
            .classed('hidden',false)
        
        // LOAD AUDIO
        let ticks
        const audio = await new Howl({
            src:audioLink,
            preload: true,
            onload: ()=>{
                loading.classed('hidden',true)
                playButton.classed('hidden',false)
                    .classed('faint',false).html('play')
                selectButton.classed('disabled',false)
                progressLine.classed('fixed',false).style('top',0)
                progressLine.select('.time').html('')
                const duration = audio.duration()
                progressLine.select('.duration').html(timeFormat(duration))
                heightScale.domain([0,duration])
                ticks = d3.range(Math.round(duration))
                yAxis.selectAll('.tick').data(ticks)
                    .join('div').attr('class','tick')
                    .style('height',height/ticks.length+'px')
                    .append('p')
                    .html(d=>d==0?'':d==1?'(second) 1':d)
            },
            onpause:()=>{
                const currentTime = audio.seek()
                const fromTop = heightScale(currentTime)
                progressLine.classed('fixed',false).style('top',fromTop+'px')
            },
            onend: ()=>{
                playButton.classed('faint',false).html('play')
                progressLine.classed('fixed',false).style('top',height+'px')
            },
        })

        // INTERACTIVITY
        playButton.on('click',toggleAudio)
        function toggleAudio(){
            if (audio.playing()) {
                audio.pause()
                playButton.classed('faint',false).html('play')
            } else {
                audio.play()
                trackOptionG.classed('hidden',true)
                playButton.classed('faint',true).html('pause')
                progressLine.classed('hidden',false)
                selectButton.html('select')
            }
        }
    
        selectButton.on('click',toggleOptionView)
        function toggleOptionView(){
            const isHidden = trackOptionG.classed('hidden')
            trackOptionG.classed('hidden',!isHidden)
            selectButton.html(isHidden?'close':'select')
    
            const isFaint = playButton.classed('faint')
            if (!audio.playing()) playButton.classed('faint',!isFaint)
        }
    
        trackOptions.on('click',updateTrack)
        function updateTrack(){
            const sTrack = this.dataset.trackName
            if (sTrack==track) return

            const trackName = d3.select(this).html()
            selectedTrack.html(trackName)

            toggleOptionView()
            audio.stop()
            timer.stop()
            
            window.scrollTo(0,0)
            progressLine.classed('hidden',true)
            loading.classed('hidden',false)
            playButton.classed('hidden',true)
            selectButton.classed('disabled',true)
            
            track = sTrack
            drawTrack()
        }
        
    
        // AUDIO PLAY TIMERs
        let currentW = window.innerWidth
        window.onresize = ()=>{
            if (window.innerWidth==currentW) return
            currentW = window.innerWidth
            height = getHeight(paragraphN)
            width = getWidth(paragraphN)
            paragraphY = getY(paragraphN)
            halfInnerH = window.innerHeight/2
            heightScale.range([0,height])
            axes.style('height',height+'px').style('width',width+'px')
            yAxis.selectAll('.tick').style('height',height/ticks.length+'px')
            const currentTime = audio.seek()
            const fromTop = heightScale(currentTime)
            progressLine.style('top',fromTop+'px')
        }        
        const timer = d3.timer(()=>{
            if (audio.playing()) {
                const currentTime = audio.seek()
                const fromTop = heightScale(currentTime)

                if (paragraphY+fromTop<halfInnerH) progressLine.classed('fixed',false).style('top',fromTop+'px')
                else progressLine.classed('fixed',true).style('top',halfInnerH+'px')
                window.scrollTo(0,paragraphY+fromTop-halfInnerH)

                progressLine.select('.time').html(timeFormat(currentTime))
            }
        })
    }
}