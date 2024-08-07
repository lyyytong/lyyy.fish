let lastupdate = 'Saturday June 22nd 2024'
let puppytintc = [0, 0, 255, 180],
    picc1 = [200, 0, 0, 100],
    picc2 = [0, 180, 0, 100],
    picc3 = [20, 40, 255, 120]
let minpicw = 240,
    maxpicw = 450,
    margin = 12
let sortby = 'age',
    order = 'ascending'
let picn = 3,
    picrepn = 6,
    picspeed = 2,
    layoutswitchw = 1024.5,
    widescreencanvasratio = .68,
    easing = .1
let puppymaxage = 1,
    seniorminage = 8
const dtexts = {
    size: {
        XS: 'Very small (<5kg)',
        S: 'Small (5-10kg)',
        M: 'Medium (10-18kg)',
        L: 'Large (18-25kg)',
        XL: 'Very large (>25kg)'
    },
    exercise: {
        1: '15-20 minutes of exercie, x2/day',
        2: '20-40 minutes of exercise, x2-3/day',
        3: '40-60 minutes of exercise, x2-3/day'
    },
    patience: {
        1: '💝 Very friendly, forms new bonds quickly',
        2: '💙 Approachable, takes some time to warm up',
        3: '👽 A character! Needs patience to build trust'
    },
    'specialneeds': {
        "grooming": 'needs regular grooming',
        "weightpb": 'needs weight control',
        "skinpb": 'recovering from skin issues',
        "limp": 'walks with slight limp',
        "missinglegs": 'missing leg(s)',
        "missingteeth": 'missing teeth',
        "hearingloss": 'hearing-impaired',
        "visionloss": 'sight-impaired',
        "diapers": 'needs diapers',
        "wheelchair": 'needs wheelchair',
        "dementia": 'has dementia',
        "sepanxiety": 'has seperation anxiety',
        "fearaggression": 'has fear-based aggression'
    }
}
const catkeys = ['name', 'adopted', 'size', 'gender', 'breed', 'story'],
    nodisplaykeys = ['adopted', 'img'],
    specialneedskeys = ['grooming', 'weightpb', 'skinpb', 'limp', 'missinglegs', 'missingteeth', 'hearingloss', 'visionloss', 'diapers', 'wheelchair', 'dementia','sepanxiety','fearaggression']
let colnum,
    headw,
    picw,
    smallscreen,
    oldwidth,
    totalpn = picn * picrepn,
    dgap = 360 / totalpn
let dogs = [],
    cv,
    dogselected,
    dogpicinrange,
    dogunderlay,
    dogoverlay,
    dogprofile,
    filteroptions,
    backbutton,
    paramsbutton,
    params,
    ppwrapper,
    navlinks,
    legendwrapper,
    legend,
    legendicon,
    loading,
    filters = []
let data = [], rawdata
let mode = 'list', // 'list' or 'profile'
    firstdraw = 1,
    transitioning = 0,
    touchdevice = 0,
    rotatea = 0,
    trotatea = 0,
    cvtopy,
    mx, my, // touch devices: ref points for turning heads
    cx, cy, tcy, cr,
    lastscrolly,
    loadingp = 0

let loadinginterval = setInterval(updateprogress,2500), 
    progress = document.querySelector('.loading .progress'),
    randomfact = document.querySelector('.loading .progress .text'),
    facts = [
        "A dog nose print is unique,<br>like our fingerprints...",
        "Puppies and senior dogs dream<br>more often than adult dogs...",
        "The sound of human yawning<br>can trigger one in dogs...",
        "Dogs are not color-blind,<br> they can see blue and yellow...",
        "All puppies are born deaf...",
        "All dalmatians are born white<br>and develop spots later...",
        "The german shepherd, Rin Tin Tin,<br>was nominated for an Oscar...",
        "Basenji dogs don't bark,<br>they yodel...",
        "The Beatles song 'A Day in the Life'<br>has a frequency only dogs can hear...",
        "Three dogs survived the Titanic sinking,<br>all from first class cabin...",
        "The Ewoks in Star Wars<br>were based on a dog...",
        "30% of dalmatians are deaf in one ear...",
        "Dogs have three eyelids,<br>one is normaly hidden...",
        "Dogs can recognize up to 250 words...",
        "Two dogs in 1960, Belka and Strelka,<br>survived 27 hours in space...",
        "Dogs have circadian rhythm<br>that helps them tell time...",
        "Dogs can use earth's magnetic field<br>like an internal GPS...",
        "Xylitol, a sweetener in candies,<br>is deadly to dogs...",
        "Most artificial sweeteners<br>taste bitter to dogs...",
        "Slightly more dogs are right-pawed<br>than left-pawed...",
        "Dogs sweat through their paws,<br>their armpits don't work like ours...",
        "Dogs have 18 muscles<br>controlling their ears...",
        "*bork bork*",
        "Dogs sniff bums to gather info,<br>like we check each other's ID...",
        'Some of my best leading<br>men have been dogs.<br>—Elizabeth Taylor',
        'The better I get to know men,<br>the more I find myself loving dogs.<br>—Charles de Gaulle',
        "What counts is the size<br>of the fight in the dog.<br>—Dwight D. Eisenhower",
        'To his dog, every man is Napoleon.<br>—Aldous Huxley',
        "The dog is a gentleman.<br>I hope to go to his heaven,<br>not man's. —Mark Twain",
        'Whoever saw a sad dog in a happy family?<br>—Arthur Conan Doyle',
        "I'm suspicious of people<br>who don't like dogs.<br>—Bill Murray",
        "There's one other reason for<br>dressing well, namely that dogs<br>respect it. —Emerson",
        'Songwriting is a bitch.<br>And then it has puppies.<br>—Steven Tyler',
        'A lot of shelter dogs are mutts<br>like me. —Barack Obama',
        'If you want a friend<br>in Washinton, get a dog.<br>—Harry S. Truman',
        'Who let the dogs out?<br>—Baha Men',
        'Martha, my dear, you have<br>always been my inspiration.<br>—Beatles, to their sheep dog',
        'I love my dog, na, na, na, na.<br>—Cat Stevens',
        'His legs were way too long,<br>and he was awkward as could be.<br>—Dolly Parton, Cracker Jack',
        '(languid howl by backing vocal dog)<br>—Pink Floyd, Seamus',
        "Ah caught you smiling at me,<br>that's the way it should be.<br>—Led Zeppelin, about a dog",
        'I wanna be your dog.<br>—The Stooges',
        "You'se a flea and I'm the big dogg.<br>—Snoop Dogg",
        "I really missed my dog, it's odd<br>'cause I don't have a dog. —Bono",
        "Are you gonna eat that?<br>—Dog in year 2065",
    ],
    factnum = facts.length,
    shown = []
function updateprogress(){
    loadingp += Math.random()*4
    progress.style.width = `${loadingp}%`
    let ri = Math.random()
    ri = Math.floor(ri*facts.length)
    randomfact.innerHTML = facts[ri]
    shown.push(facts[ri])
    facts.splice(ri,1)
    if (shown.length==factnum) facts = [...shown]
}

function preload() {
    rawdata = loadTable('../data/dogs-for-adoption/list.csv', 'csv', 'header', updatedata)
    function updatedata(){
        const numkeys = rawdata.columns.filter(k => !catkeys.includes(k))
        rawdata.rows.forEach(d => {
            let o = d.obj,
                dn = o.name,
                picsize = displayWidth <= 430 ? 'Small': 'Big',
                headfile = displayWidth <= 430 ? 'HeadSmall' : 'HeadBig'
            numkeys.forEach(k => o[k] = +o[k])
            o.headfile = headfile
            o.head = loadImage(`../images/dogs-for-adoptions/${dn}/${headfile}.png`)
            o.pics = []
            for (let i = 1; i <= picn; i++) {
                const p = loadImage(`../images/dogs-for-adoptions/${dn}/${i+picsize}.png`)
                o.pics.push(p)
            }
            data.push(o)
        })
    }
}
function setup() {
    clearInterval(loadinginterval)
    const dwrapper = select('#available-dogs')
    cv = select('.dog-heads', dwrapper)
    dogunderlay = select('.dog-underlay', dwrapper)
    dogoverlay = select('.dog-overlay', dwrapper)
    ppwrapper = select('#pp')
    dogprofile = select('#dog-profile')
    params = select('#params')
    paramsbutton = select('nav .params-button')
    backbutton = select('nav .back.button')
    navlinks = select('nav .left-col')
    legendwrapper = select('nav .puppy-legend')
    legend = select('p', legendwrapper)
    legendicon = select('.blur-bg', legendwrapper)
    loading = select('.loading')
    setdimensions(newcanvas = 1)

    imageMode(CENTER)
    angleMode(DEGREES)

    progress.style.width = `100%`
    if (!smallscreen) ppwrapper.addClass('hidden')
    setTimeout(()=>{
        select('#dogs').removeClass('hidden')
        loading.addClass('hidden')
        if (!smallscreen) ppwrapper.removeClass('hidden')
    },200)
    paramsbutton.removeClass('disabled')
    if (!getItem('firstvisit')) paramsbutton.addClass('flash')

    setinteractivity()

    data.forEach((d, i) => dogs.push(new Dog(d, i)))
    dogs.sort((a, b) => a[sortby] - b[sortby])
    filteroptions.forEach(o => {
        if (o.checked()) filters.push(o.id())
    })
    const dnum = dogs.length
    select('.result-count').html(`(${dnum}/${dnum})`)
}

function setdimensions(newcanvas = 0, canvas = cv) {
    oldwidth = windowWidth
    smallscreen = windowWidth < layoutswitchw
    colnum = smallscreen 
        ? map(windowWidth, 300, layoutswitchw, 3, 4, true)
        : map(windowWidth, layoutswitchw, 3000, 4, 7, true)
    colnum = round(colnum)
    const cw = smallscreen ? windowWidth : windowWidth * widescreencanvasratio
    headw = cw / colnum
    const rownum = Math.ceil(data.length / colnum)
    let ch = rownum * headw
    if (ch < windowHeight * .8) ch = windowHeight * .8
    if (newcanvas) createCanvas(cw, ch, canvas.elt)
    else resizeCanvas(cw, ch)

    touchdevice = 0
    picw = map(width, 380, 1000, minpicw, maxpicw, true)
    cvtopy = cv.elt.getBoundingClientRect().y
    my = displayHeight * .45 - cvtopy
    cr = picw / 3
    cx = width / 2
    cy = smallscreen
        ? (windowHeight - ppwrapper.height) * .5 + picw/2
        : windowHeight * .6 - cvtopy
    cy = constrain(cy, cr * 3, height - cr * 2)

    const introtext = select('#intro').html()
    select('#intro2').html(introtext)

    const infos = selectAll('.info')
    if (smallscreen) {
        ppwrapper.addClass('hidden').style('top', 'auto')
        backbutton.style('bottom', params.height - 1 + 'px')
        infos.forEach(el => el.position(0, 0, 'absolute')
            .style('transform', 'translate(-10%,-100%)'))
    }
    else {
        ppwrapper.removeClass('hidden')
            .style('top', cv.elt.getBoundingClientRect().y + 'px')
        infos.forEach(el => el.position('50%', 0, 'absolute')
            .style('transform', 'translate(-50%,-100%)'))
    }
    infos.forEach(el => {
        const dim = el.elt.getBoundingClientRect(),
            maxx = windowWidth - margin
        if (dim.right > maxx) {
            const xshift = dim.right - maxx
            el.style('transform', `translate(calc(${smallscreen ? -10 : -50}% - ${xshift}px),-100%)`)
        }
    })

    const container = smallscreen ? '#dogs' : '#params'
    select(container + ' .last-update .day').html(lastupdate)
}

function draw() {
    // pictures loaded, draw dogs
    if (firstdraw) {
        dogs.forEach(dog => dog.updatepos())
        firstdraw = 0
    }
    clear()
    if (mode == 'list') dogs.forEach(dog => dog.turnshead())
    else if (mode == 'profile') {
        const dog = dogs.filter(d => d.name == dogselected)[0]
        dog.showspics()
    }
    if (!transitioning && !(touchdevice && mode == 'profile')) noLoop()
    rotatea++
}

// update positions on mouse-controled devices
function mouseMoved() { loop() }
function mouseWheel(e) {
    if (touchdevice || smallscreen) return
    tcy = e.pageY - e.clientY - cvtopy + windowHeight * .6
    if (mode == 'profile') {
        transitioning = 1
        loop()
    } else cy = tcy
}

// update positions on touch devices
function touchStarted() {
    if (!touches.length) return
    if (!touchdevice) touchdevice = 1
    mx = mouseX <= width / 2 ? width * .4 : width * .6
}
let start, scrolld = 0
window.addEventListener('scroll', (e) => {
    if (!touchdevice) return
    const sy = window.scrollY
    if (!start) start = sy
    scrolld = sy - start
    start = sy
    my += scrolld
    loop()
})
window.addEventListener('scrollend', () => { scrolld = 0 })

function windowResized() {
    if (oldwidth == windowWidth) return
    switchtolistview()
    setdimensions()
    dogs.forEach(dog => dog.updatepos())
    transitioning = 1
    loop()
}

class Dog {
    constructor(d, i) {
        Object.keys(d).forEach(k => {
            if (k == 'adopted') this[k] = d[k] == '' ? 0 : 1
            else this[k] = d[k]
        })
        this.age = year() - d.birthyear
        this.puppy = this.age <= puppymaxage
        this.senior = this.age >= seniorminage
        this.aptfriendly = this.size == 'XS' || this.size == 'S'
        this.story = d.story
        this.rank = i
        this.head = d.head
        this.pics = d.pics
        this.underlaydiv = createDiv()
            .parent(dogunderlay)
            .class('underlay')
            .value(this.name)
            .style('background-image', `url("../images/dogs-for-adoptions/${this.name}/${this.headfile}.png")`)
        this.overlaydiv = createDiv()
            .parent(dogoverlay)
            .class('overlay')
            .value(this.name)
            .html(`${this.name}`)
            .mouseClicked(showprofile)
    }
    updatepos() {
        this.headw = this.size == 'XL' ? headw
            : this.size == 'L' ? headw * .9
                : this.size == 'M' ? headw * .8
                    : this.size == 'S' ? headw * .7
                        : headw * .6
        this.rank = dogs.indexOf(this)
        this.rankx = this.rank % colnum * headw
        this.ranky = Math.floor(this.rank / colnum) * headw
        this.tx = this.rankx + headw / 2
        this.ty = this.ranky + headw / 2
        if (firstdraw) {
            this.x = this.tx
            this.y = this.ty
        }
        this.underlaydiv.position(this.rankx + headw * .4, this.ranky + headw * .4)
            .style('width', headw * .2 + 'px')
            .style('height', headw * .2 + 'px')
        this.overlaydiv.position(this.rankx + margin, this.ranky)
            .style('width', headw - margin * 2 + 'px')
            .style('height', headw + 'px')
        if (!firstdraw) this.overlaydiv.addClass('disabled')
        else this.checkscriteria()
    }
    checkscriteria() {
        this.fitcriteria = filters.every(f => {
            if (f == 'special-needs') {
                const hasspecialneeds = specialneedskeys.some(k => this[k] == 1)
                return hasspecialneeds == 1
            }
            else return this[f] == 1
        })
    }
    turnshead() {
        if (transitioning) {
            let dx = this.tx - this.x,
                dy = this.ty - this.y
            this.x += dx * easing
            this.y += dy * easing
            if (this.rank == dogs.length - 1) {
                dx = Math.abs(dx)
                dy = Math.abs(dy)
                if (dx <= 1 && dy <= 1) {
                    selectAll('.overlay').forEach(o => o.removeClass('disabled'))
                    transitioning = 0
                }
            }
        }
        if (!this.fitcriteria) {
            this.underlaydiv.removeClass('hidden')
            this.overlaydiv.addClass('hidden')
            return
        }
        this.underlaydiv.addClass('hidden')
        this.overlaydiv.removeClass('hidden')

        let dx, dy, ma = 0
        if (touchdevice) {
            dx = mx - this.x
            dy = my - this.y
        } else {
            dx = mouseX - this.x
            dy = mouseY - this.y
        }
        if (mouseX || mouseY) ma = atan2(dy, dx)

        const displayw = this.puppy ? headw * .6 : this.headw
        push()
        translate(this.x, this.y)
        if (this.puppy) {
            tint(...puppytintc)
            const hw = this.headw
            image(this.head, 0, 0, hw, hw)
        }
        noTint()

        let a, s
        if (ma >= -90 && ma <= 90) {
            a = ma
            s = [1]
        }
        else {
            a = -ma + 180
            s = [-1, 1]
        }
        scale(...s)
        rotate(a)
        image(this.head, 0, 0, displayw, displayw)
        pop()
    }
    showspics() {
        if (transitioning && !touchdevice) {
            let d = tcy - cy
            cy += d * easing
            d = Math.abs(d)
            if (d < 1) transitioning = 0
        }
        let dx, dy, ma
        if (touchdevice) {
            ma = rotatea
        } else {
            dx = mouseX - cx
            dy = mouseY - cy
            ma = atan2(dy, dx)
        }
        let pi = 0, pinrange
        push()
        translate(cx, cy)
        for (let n = 1; n <= totalpn; n++) {
            const angle = -180 + ma + n * dgap,
                a = angle <= 90 ? angle
                    : angle <= 180 ? 180 - angle
                        : angle <= 270 ? angle - 180
                            : 360 - angle,
                xm = angle <= 180 ? 1 : -1,
                ym = angle > 90 && angle <= 270 ? 1 : -1,
                widthmultiplier = map(windowWidth, 1500, 2500, 2, 3, true),
                x = cr * sin(a) * xm * widthmultiplier,
                y = cr * cos(a) * ym,
                s = picw * .3,
                // s = map(y, cr, -cr, picw * .3, picw * .45, true),
                p = this.pics[pi],
                c = pi == 0 ? picc1
                    : pi == 1 ? picc2
                        : picc3
            if (y <= -cr + 10 && pinrange != p) pinrange = p
            tint(c)
            push()
            const a2 = atan2(y, x) + 90
            translate(x, y)
            rotate(a2)
            image(p, 0, 0, s, s)
            pop()
            if (n % picrepn == 0) pi++
        }
        noTint()
        image(pinrange, 0, -cr, picw, picw)
        pop()
    }
}
function showprofile() {
    mode = 'profile'
    clear()
    backbutton.removeClass('hidden')
    dogunderlay.addClass('hidden')
    dogoverlay.addClass('hidden')
    dogprofile.elt.scrollTo(0, 0)
    if (smallscreen) {
        lastscrolly = window.scrollY
        scrollTo(0, 0)
        select('#dogs').addClass('no-scroll')
        select('#intro').addClass('disabled')
        navlinks.addClass('hidden')
        ppwrapper.removeClass('hidden')
        backbutton.addClass('aligntop')
    } else {
        legendwrapper.addClass('pop')
        legend.html('🔄 Move mouse to turn carrousel.')
        legendicon.style('display', 'none')
        select('body').style('overflow-y','hidden')
    }
    params.addClass('hidden')
    dogprofile.removeClass('hidden')
    dogselected = this.value()
    const dog = dogs.filter(dog => dog.name == dogselected)[0],
        sstring = '#dog-profile '
    select(sstring + '.name').html(dog.name)
    select(sstring + '.age').html(dog.age > 1 ? 'about ' + dog.age + ' years old' : dog.age == 1 ? 'about 1 year old' : 'under 1 year old')
    select(sstring + '.breed').html(
        dog.breed.includes('Local') || dog.breed.includes('Mixed')
            ? dog.breed.toLowerCase() + ' breed'
            : dog.breed
    )
    select(sstring + '.gender').html(dog.gender == 'Male' ? 'Boy' : 'Girl')
    select(sstring + '.story').html(dog.story)

    const i2metrics = ['size', 'exercise', 'patience']
    i2metrics.forEach(m => {
        const extranote = m == 'size' && dog['age'] < 1 ? ' when fully grown' : ''
        select(sstring + '.' + m).html(dtexts[m][dog[m]] + extranote)
    })

    const cmetrics = ['toilettrained', 'leashtrained', 'aptfriendly', 'cuddledog', 'kidsfriendly', 'dogfriendly', 'catfriendly', 'vaxxed', 'neutered']
    cmetrics.forEach(m => {
        const el = select(sstring + `.${m}`)
        if (dog[m]) el.removeClass('not')
        else el.addClass('not')
    })

    const hwrapper = select(sstring + '.health'),
        hmetrics = Object.keys(dtexts.specialneeds)
    let hstring
    hmetrics.forEach(m => {
        if (dog[m] && !hstring) {
            const s = dtexts.specialneeds[m]
            hstring = s[0].toUpperCase() + s.slice(1)
        } else if (dog[m]) {
            hstring += `, ${dtexts.specialneeds[m]}`
        }
    })
    if (hstring) {
        hwrapper.removeClass('hidden')
        select(sstring + '.special-needs').html(hstring)
    }
    else hwrapper.addClass('hidden')

    loop()
}
function setinteractivity() {
    backbutton.mouseClicked(() => {
        switchtolistview()
        loop()
    })
    paramsbutton.mouseClicked(() => {
        ppwrapper.removeClass('hidden')
        params.removeClass('hidden')
        params.elt.scrollTo(0, 0)
        navlinks.addClass('hidden')
        backbutton.removeClass('hidden')
        dogprofile.addClass('hidden')
        if (!getItem('firstvisit')) {
            paramsbutton.removeClass('flash')
            storeItem('firstvisit', 1)
        }
    })

    const sortoptions = selectAll('.sort .list input[type="radio"]')
    sortoptions.forEach(o => o.mouseClicked(e => {
        if (e.target.id == sortby) return
        sortby = e.target.id
        sortdogs()
    }))
    const orderoptions = selectAll('.sort .order input[type="radio"]')
    orderoptions.forEach(o => o.mouseClicked(e => {
        if (e.target.id == order) return
        order = e.target.id
        sortdogs()
    }))
    function sortdogs() {
        if (sortby == 'size') {
            const sizes = ['XS', 'S', 'M', 'L', 'XL']
            if (order == 'ascending') dogs.sort((a, b) => sizes.indexOf(a.size) - sizes.indexOf(b.size))
            else dogs.sort((a, b) => sizes.indexOf(b.size) - sizes.indexOf(a.size))
        } else if (sortby == 'exercise') {
            if (order == 'ascending') dogs.sort((a, b) => a[sortby] - b[sortby] || b.age - a.age)
            else dogs.sort((a, b) => b[sortby] - a[sortby] || a.age - b.age)
        } else {
            if (order == 'ascending') dogs.sort((a, b) => a[sortby] - b[sortby])
            else dogs.sort((a, b) => b[sortby] - a[sortby])
        }
        dogs.forEach(dog => dog.updatepos())
        transitioning = 1
        loop()
    }

    filteroptions = selectAll('.filter input[type="checkbox"]')
    filteroptions.forEach(o => o.mouseClicked(e => {
        const f = e.target.id
        if (e.target.checked) {
            filters.push(f)
            if (f == 'puppy' && filters.includes('senior')) {
                filters.splice(filters.indexOf('senior'), 1)
                select('input#senior').checked(false)
            }
            if (f == 'senior' && filters.includes('puppy')) {
                filters.splice(filters.indexOf('puppy'), 1)
                select('input#puppy').checked(false)
            }
        }
        else filters.splice(filters.indexOf(f), 1)
        let resultcount = 0
        dogs.forEach(dog => {
            dog.checkscriteria()
            if (dog.fitcriteria == true) resultcount++
        })
        select('.result-count').html(`(${resultcount}/${dogs.length})`)
        loop()
    }))
}
function switchtolistview() {
    dogprofile.addClass('hidden')
    dogunderlay.removeClass('hidden')
    dogoverlay.removeClass('hidden')
    params.removeClass('hidden')
    if (smallscreen) {
        select('#dogs').removeClass('no-scroll')
        select('#intro').removeClass('disabled')
        navlinks.removeClass('hidden')
        ppwrapper.addClass('hidden')
        backbutton.removeClass('aligntop')
        if (mode == 'profile') {
            scrollTo(0, lastscrolly)
            my = displayHeight * .45 - cvtopy + lastscrolly
        }
    } else {
        legendwrapper.removeClass('pop')
        legend.html('are puppies, adult size in blue.')
        legendicon.style('display', 'flex')
    }
    backbutton.addClass('hidden')
    select('body').style('overflow-y','auto')
    mode = 'list'
}
