let Metric = 'production',
	Year = 2020,
	pestR = 2,
	pestViewR = 10,
	slinkyPerStepN = 3,
	slinkyW = 4.5,
	slinkyViewR = 100,
	slinkyTongueL = slinkyViewR * .5,
	slinkyGunViewR = Math.min(window.innerWidth, window.innerHeight) * .25,
	slinkyGunTongueL = slinkyGunViewR * .5,
	dropW = 3,
	wormMaxBloodPressure = 50,
	bgC = '#dbd9d4',
	seasonColors = { spring: '#74ad86', autumn: '#958c5a', winter: '#7f87a6' },
	borderColors = { spring: '#537c60', autumn: '#68623f', winter: '#54596f' },
	pestColor = '#f87678',
	slinkyC = '#cddb5f',
	slinkyBorderC = "#a17c64",
	slinkyTongueC = '#ff5353',
	forceFieldC = '#FF206B40',
	sunRayC = [
		'#ffeab180',
		'#ff74524d',
		'#7b9aff59',
		'#7949ff59'
	],
	blushC = '#ff00274d',
	smoochC = '#f48df2',
	dropC = '#ec2427',
	eyeC = "#151515",
	ghostC = '#1d1d1d20',
	seasonsShown = { spring: true, autumn: true, winter: true },
	quadtreeCellCount = 30,
	barHeightScale = (value) => {
		let maxHPct //vh
		if (screenSize == 'phone') maxHPct = 50
		else maxHPct = 80
		if (Metric == 'yield') maxHPct *= .2
		return value * maxHPct / maxVal
	},
	colorTransitionN = 50,
	addPestAuto = true,
	pestControlAuto = true,
	pestControlHandheld = false,
	pestControlSolar = false
const regions = [ // order important: north to south
	'Northern Midlands and Mountain areas',
	'Red River Delta',
	'Northern Central and Central Coastal areas',
	'Central Highlands',
	'South East',
	'Mekong River Delta'
], regionAbbrev = { // order important: north to south
	'Northern Midlands and Mountain areas': 'N. Midlands & Mountains',
	'Red River Delta': 'Red River Delta',
	'Northern Central and Central Coastal areas': 'N. Central & Central Coastal',
	'Central Highlands': 'Central Highlands',
	'South East': 'South East',
	'Mekong River Delta': 'Mekong River Delta'
}
const metrics = ['area', 'production', 'yield'],
	seasons = ['spring', 'autumn', 'winter'],
	minYear = 1995, maxYear = 2023,
	maxLocCount = 14,
	titles = {
		'production': 'rice production',
		'area': 'planted rice area',
		'yield': 'rice yield'
	},
	units = {
		'production': 'Thousand tons (1 metric ton = 1,000kg)',
		'area': 'Thousand hectares (1ha = 10,000m2)',
		'yield': 'Quintal/hectare (1q/ha = 100kg/10,000m2)'
	}
const accessor = {
	area: (d, season, year) => d[`${season[0]}_a_${year}`],
	production: (d, season, year) => d[`${season[0]}_p_${year}`],
	yield: (d, season, year) => d[`${season[0]}_y_${year}`],
}
const notes = {
	'Northern Midlands and Mountain areas': {
		text: `Before 2004 data for Dien Bien was part of Lai Chau. Dien Bien became its own province in January 2004.`,
		locations: ['Lai Chau', 'Dien Bien'],
		appliedTo: year => year < 2004
	},
	'Red River Delta': {
		text: `From 2008 data for Ha Tay is included in Ha Noi. Ha Tay became part of Ha Noi in August 2008.`,
		locations: ['Ha Tay', 'Ha Noi'],
		appliedTo: year => year >= 2008
	},
	'Central Highlands': {
		text: `Before 2004 data for Dak Nong was part of Dak Lak. Dak Nong became its own province in January 2004 (and later merged with Lam Dong in 2025.)`,
		locations: ['Dak Lak', 'Dak Nong'],
		appliedTo: year => year < 2004
	},
	'Mekong River Delta': {
		text: `Before 2004 data for Hau Giang was part of Can Tho. Hau Giang became its own province in January 2004 (and merged again with Can Tho in 2025.)`,
		locations: ['Can Tho', 'Hau Giang'],
		appliedTo: year => year < 2004
	}
}
const V = p5.Vector,
	{ Engine, Composite, Body, Bodies, Constraint, Events } = Matter
let data = {}, maxVal, maxLocVal, maxYearlyVal,
	c2, field, quadtree, wormW, wormR, wormRSq,
	pestMaxN, pestW = pestR * 2, pestRSq = pestR ** 2, pestMinDistanceRSq = (pestR * 3) ** 2,
	slinkyViewRSq = slinkyViewR ** 2, slinkyTongueLSq = slinkyTongueL ** 2,
	slinkyGunTongueW, slinkyGunViewRSq = slinkyGunViewR ** 2,
	slinkyGunTongueLSq = slinkyGunTongueL ** 2,
	forceFieldR, forceFieldRSq,
	eyeW, eyeClosedW, eyeLX, eyeRX,
	slinkyMaxN, slinkyEyeW, slinkyEyeLX, slinkyEyeRX,
	pestCount = 0, slinkyCount = 0, pestCountT, slinkyCountT,
	controlHandheldButton, controlSolarButton,
	engine, engine2, sineTable, forceField,
	seasonCT = {}, slinkyCT = [],
	screenSize, mouseControl, oldWidth, oldHeight, resizeTimerID,
	oldScrollY = 0, addPestAutoN, pestControlAutoN,
	yearSelect, sidebarButton, sidebar, summary, getSummaryHeight, backLayer,
	scrollObserver
function preload() {
	const raw = loadTable('../data/viet-paddy.csv', 'csv', 'header', () => {
		for (let i = 0; i < raw.rows.length; i++) {
			const d = raw.rows[i].obj
			for (let s of seasons) {
				if (d[`${s}Months`] == '') delete d[`${s}Months`]
				else {
					d[`${s}Months`] = d[`${s}Months`].split(',').map(n => +n)
					d[`${s}Months`].sort((a, b) => a - b)
				}
				for (let m of metrics) {
					for (let y = minYear; y <= maxYear; y++) {
						const n = d[`${s[0]}_${m[0]}_${y}`]
						if (!d[`${s}Months`] || n == "" || n == "0.0") delete d[`${s[0]}_${m[0]}_${y}`]
						else d[`${s[0]}_${m[0]}_${y}`] = +n
					}
				}
			}
			d.isRegion = d.name == d.region
			if (d.isRegion) {
				data[d.region] = {}
				data[d.region].summary = d
			} else {
				if (!data[d.region].locations) data[d.region].locations = []
				data[d.region].locations.push(d)
			}
		}
	})
}
function setup() {
	sortData()
	initDOM()

	engine = Engine.create({
		enableSleeping: true
	})
	engine.gravity.scale *= -1
	engine2 = Engine.create({
		enableSleeping: true
	})
	engine2.gravity.scale = .002
	// engine2.positionIterations = 10
	// engine2.velocityIterations = 10
	// engine2.constraintIterations = 4
	sineTable = new SineTable()

	const canvasH = mouseControl ? windowHeight : displayHeight
	createCanvas(windowWidth, canvasH, select('#canvas .back').elt)
	pixelDensity(displayDensity())
	strokeJoin(ROUND)
	rectMode(CENTER)
	ellipseMode(CENTER)
	textAlign(CENTER, CENTER)
	textFont('Helvetica')
	noFill()
	noStroke()
	textSize(windowWidth < 600 ? 8 : 10)

	pestColor = color(pestColor)
	bgC = color(bgC)
	slinkyC = color(slinkyC)
	for (let s of seasons) {
		seasonColors[s] = color(seasonColors[s])
		seasonCT[s] = []
		for (let i = 0; i < colorTransitionN; i++) {
			const c = lerpColor(pestColor, seasonColors[s], i / (colorTransitionN - 1))
			seasonCT[s].push(c)
		}
	}
	for (let i = 0; i < colorTransitionN; i++) {
		const c = lerpColor(bgC, slinkyC, i / (colorTransitionN - 1))
		slinkyCT.push(c)
	}

	c2 = createGraphics(windowWidth, canvasH, select('#canvas .front').elt)
	c2.pixelDensity(displayDensity())
	c2.noFill()
	c2.strokeWeight(pestW)
	c2.stroke(pestColor)

	quadtree = new QuadTree()

	field = new Field()
	field.getSizing()
	field.grow()

	initInteractive()

	// print(field)
}
function draw() {
	Engine.update(engine)
	Engine.update(engine2)
	clear()
	c2.clear()
	if (field.correcting) field.correctWormsHeight()
	else if (field.resizeNeeded) {
		field.reassignBars()
		field.resize()
	}
	if (addPestAuto && random() <= .002) field.addPests(10)
	quadtree.clear()
	field.updateQuadtree()
	field.runField()
	field.runPests()
	field.runDrops()
	if (pestControlHandheld) field.runSlinkyGun()
	else if (pestControlSolar) field.runSlinkySun()
	else if (forceField) {
		quadtree.insert(forceField)
		forceField.update()
		forceField.towardTarget()
		forceField.exertForces()
	}
	field.show()
	// noLoop()
}
function windowResized() {
	const newH = mouseControl ? windowHeight : displayHeight

	if (windowWidth >= 1240 && newH >= 660) {
		resizeSummary()
	}
	if (newH > oldHeight || windowWidth != oldWidth) {
		resizeCanvas(windowWidth, newH)
		c2.resizeCanvas(windowWidth, newH)
		oldHeight = newH
		if (windowWidth != oldWidth) {
			clearTimeout(resizeTimerID)
			resizeTimerID = setTimeout(() => { handleResize() }, 100)
		}
	}

	function handleResize() {
		const newScreenSize = window.innerWidth <= 599.9 ? 'phone'
			: window.innerWidth <= 1239.9 ? 'tablet'
				: 'laptop'

		if (newScreenSize != screenSize) {
			screenSize = window.innerWidth <= 599.9 ? 'phone'
				: window.innerWidth <= 1239.9 ? 'tablet'
					: 'laptop'
			resizeRegionalGraph()
			field.reassignBars()
		}
		oldWidth = windowWidth
		if (field.correcting) field.resizeNeeded = true
		else field.resize()
	}
}
function mouseMoved() {
	if (!mouseControl || pestControlSolar) return
	if (pestControlHandheld) field.slinkyGun.setTarget(mouseX, mouseY)
	else if (!forceField) forceField = new ForceField(mouseX, mouseY)
	else forceField.setTarget(mouseX, mouseY)
}
function mouseDragged() {
	if (!mouseControl || pestControlSolar) return
	if (pestControlHandheld) field.slinkyGun.setTarget(mouseX, mouseY)
	else if (!forceField) forceField = new ForceField(mouseX, mouseY)
	else forceField.setTarget(mouseX, mouseY)
}
function sortData() {
	for (let region of regions) {
		data[region].locations.sort((a, b) => {
			let aSum = 0, bSum = 0
			for (let s of seasons) {
				const aV = accessor[Metric](a, s, Year),
					bV = accessor[Metric](b, s, Year)
				if (aV) { aSum += aV }
				if (bV) { bSum += bV }
			}
			return bSum - aSum
		})
	}
	maxVal = 0
	maxLocVal = 0
	for (let region of regions) {
		for (let d of data[region].locations) {
			for (let s of seasons) {
				const v = accessor[Metric](d, s, Year)
				if (v && v > maxVal) maxVal = v
			}
			for (let y = minYear; y <= maxYear; y++) {
				for (let s of seasons) {
					const v = accessor[Metric](d, s, y)
					if (v && v > maxLocVal) maxLocVal = v
				}
			}
		}
	}
	maxYearlyVal = 0
	for (let year = minYear; year <= maxYear; year++) {
		let total = 0
		for (let region of regions) {
			for (let season of seasons) {
				const val = accessor[Metric](data[region].summary, season, year)
				if (val) total += val
			}
		}
		if (total > maxYearlyVal) maxYearlyVal = total
	}
}
function initDOM() {
	screenSize = window.innerWidth <= 599.9 ? 'phone'
		: window.innerWidth <= 1239.9 ? 'tablet'
			: 'laptop'
	mouseControl = window.matchMedia('(pointer:fine)').matches // primary is mouse
		|| window.matchMedia('(any-pointer:fine)').matches // any mouse/trackpad connected
	oldWidth = windowWidth
	oldHeight = mouseControl ? windowHeight : displayHeight
	// if (screenSize == 'phone') pestControlSolar = true

	if (!yearSelect) {
		yearSelect = select('select#year')
		for (let y = minYear; y <= maxYear; y++) yearSelect.option(y)
		yearSelect.selected(Year)
	}
	pestCountT = select('#simulation .pest-count .count')
	slinkyCountT = select('#simulation .pest-control-count .count')
	addPestAutoN = select('#simulation .pest-note')
	pestControlAutoN = select('#simulation .pest-control-note')
	controlHandheldButton = select('button[mode="pest-control-handheld"]')
	controlSolarButton = select('button[mode="pest-control-solar"]')

	// Summary
	summary = select('header #sidebar #summary')
	getSummaryHeight = () => {
		let sHeight, sBarMaxH
		if (screenSize == 'laptop') {
			sHeight = summary.elt.getBoundingClientRect().height
			sBarMaxH = round(sHeight - 32 * regions.length, 2)
		} else {
			sHeight = summary.elt.getBoundingClientRect().height
			sBarMaxH = round(sHeight - 24 * regions.length, 2)
		}
		return [sHeight, sBarMaxH]
	}
	const regionNames = createDiv().parent(summary).addClass('region-names small'),
		yearsWrapper = createDiv().parent(summary).addClass('years-wrapper'),
		[sHeight, sBarMaxH] = getSummaryHeight()
	summary.elt.style.setProperty('--full-height', `${sHeight}px`)
	for (let year = minYear; year <= maxYear; year++) {
		const yearDiv = createDiv().parent(yearsWrapper).addClass('year-div').attribute('year', year)
		if (year == Year) yearDiv.addClass('selected')
		for (let i = 0; i < regions.length; i++) {
			const region = regions[i],
				rDiv = createDiv().parent(yearDiv).addClass('region-div').attribute('region', region)
			for (let season of seasons) {
				let sVal = accessor[Metric](data[region].summary, season, year)
				if (!sVal) sVal = 0
				const barH = round(map(sVal, 0, maxYearlyVal, 0, sBarMaxH, true), 2)
				createDiv().parent(rDiv).addClass('season-div').attribute('season', season)
					.attribute('value', sVal).attribute('region', region).attribute('year', year)
					.style('height', `${barH}px`)
			}
			if (year > minYear) continue
			const rBarH = rDiv.elt.getBoundingClientRect().height,
				nameWrapper = createDiv().parent(regionNames).addClass('region-name-wrapper')
					.style('height', `${rBarH}px`).attribute('region', region)
			createButton('').parent(nameWrapper).addClass('region-number').attribute('region', region)
			createDiv().parent(nameWrapper).addClass('line')
		}
		createP(year).parent(yearDiv).addClass('year-num tiny').attribute('year', year)
	}

	// Regional
	const graph = select('#graph')
	for (let i = 0; i < regions.length; i++) {
		const region = regions[i],
			rWrapper = createDiv().parent(graph).addClass('region-wrapper').attribute('region', region),
			rNameWrapper = createDiv().parent(rWrapper).addClass('region-name-wrapper'),
			lList = createDiv().parent(rWrapper).addClass('location-list'),
			lData = data[region].locations,
			note = notes[region]
		lList.style('grid-template-rows', `repeat(${lData.length},1fr)`)
		createP(region).parent(rNameWrapper).addClass('region-name')
		rWrapper.elt.style.setProperty('--locations-count', lData.length)
		for (let i = 0; i < lData.length; i++) {
			const d = lData[i],
				lWrapper = createDiv().parent(lList).addClass('location-wrapper').attribute('location', d.name)
					.addClass(`row-${i + 1}`),
				lNameWrapper = createDiv().parent(lWrapper).addClass('location-name-wrapper'),
				tWrapper = createDiv().parent(lWrapper).addClass('ticks-wrapper')
			createP(d.name).parent(lNameWrapper).addClass('location-name')
			if (note && note.appliedTo(Year) && note.locations.includes(d.name))
				lWrapper.addClass('has-note')
			let ticks = []
			for (let i = 0; i < 12; i++) {
				const tick = createDiv().parent(tWrapper).addClass('tick tiny')
				createP(i + 1).parent(tick).addClass('number')
				ticks.push(tick)
			}
			if (screenSize == 'laptop') {
				let total = 0
				for (let s of seasons) {
					if (!d[`${s}Months`] || !accessor[Metric](d, s, Year)) continue
					const months = d[`${s}Months`],
						value = accessor[Metric](d, s, Year)
					for (let m of months) ticks[m - 1].addClass(s)
					let monthWBar
					if (d.region == 'Mekong River Delta') {
						if (s == 'spring') monthWBar = 4
						else if (s == 'autumn') monthWBar = 11
						else if (s == 'winter') monthWBar = 1
					} else monthWBar = months[[months.length - 1]]
					const tick = ticks[monthWBar - 1],
						heightPct = barHeightScale(value)
					createP(value).parent(tick).addClass('value')
					createDiv().parent(tick).addClass('bar')
						.style('height', `${heightPct}vh`)
					total += value
				}
				total = round(total, 2)
				const tDiv = createDiv().parent(lWrapper).addClass('total'),
					tNum = createP(total).parent(tDiv).addClass('value tiny')
			} else {
				let total = 0
				for (let i = 0; i < seasons.length; i++) {
					const s = seasons[i]
					if (!d[`${s}Months`] || !accessor[Metric](d, s, Year)) continue
					ticks[i].addClass(s)
					const value = accessor[Metric](d, s, Year),
						heightPct = barHeightScale(value)
					createP(value).parent(ticks[i]).addClass('value')
					createDiv().parent(ticks[i]).addClass('bar')
						.style('height', `${heightPct}vh`)
					total += value
				}
				total = round(total, 2)
				const tDiv = createDiv().parent(lWrapper).addClass('total'),
					tNum = createP(total).parent(tDiv).addClass('value tiny')
			}
		}
		if (note && note.appliedTo(Year)) {
			createP(note.text).parent(rWrapper).addClass('note small')
		}
	}
}
function resizeSummary() {
	const sHeight = summary.elt.getBoundingClientRect().height,
		sBarMaxH = round(sHeight - 32 * regions.length, 2)
	summary.elt.style.setProperty('--full-height', `${sHeight}px`)
	selectAll('.season-div', summary).forEach(sDiv => {
		const val = +sDiv.attribute('value'),
			newH = round(map(val, 0, maxYearlyVal, 0, sBarMaxH, true), 2)
		sDiv.style('height', `${newH}px`)
	})
	selectAll('.region-names .region-name-wrapper').forEach(rName => {
		const region = rName.attribute('region'),
			newH = select(`.year-div[year="${minYear}"] .region-div[region="${region}"]`).elt.getBoundingClientRect().height
		rName.style('height', `${newH}px`)
	})
}
function resizeRegionalGraph() {
	for (let region of regions) {
		for (let d of data[region].locations) {
			const loc = d.name,
				ticks = selectAll(`.location-wrapper[location="${loc}"] .tick`),
				bars = selectAll(`.location-wrapper[location="${loc}"] .tick .bar`),
				texts = selectAll(`.location-wrapper[location="${loc}"] .tick .value`)
			ticks.forEach((t, i) => {
				t.removeClass('spring').removeClass('autumn').removeClass('winter')
			})
			for (let bar of bars) bar.remove()
			for (let text of texts) text.remove()
			if (screenSize == 'laptop') {
				for (let s of seasons) {
					if (!d[`${s}Months`] || !accessor[Metric](d, s, Year)) continue
					const months = d[`${s}Months`],
						value = accessor[Metric](d, s, Year)
					for (let m of months) ticks[m - 1].addClass(s)
					let monthWBar
					if (d.region == 'Mekong River Delta') {
						if (s == 'spring') monthWBar = 4
						else if (s == 'autumn') monthWBar = 11
						else if (s == 'winter') monthWBar = 1
					} else monthWBar = months[[months.length - 1]]
					const tick = ticks[monthWBar - 1],
						heightPct = barHeightScale(value)
					createP(value).parent(tick).addClass('value')
					createDiv().parent(tick).addClass('bar')
						.style('height', `${heightPct}vh`)
				}
			} else {
				for (let i = 0; i < seasons.length; i++) {
					const s = seasons[i]
					if (!d[`${s}Months`] || !accessor[Metric](d, s, Year)) continue
					ticks[i].addClass(s)
					const value = accessor[Metric](d, s, Year),
						heightPct = barHeightScale(value)
					createP(value).parent(ticks[i]).addClass('value')
					createDiv().parent(ticks[i]).addClass('bar')
						.style('height', `${heightPct}vh`)
				}
			}
		}
	}
}
function updateDOM() {
	pestCountT.html(pestCount)
	slinkyCountT.html(slinkyCount)

	// update summary
	const sHeight = summary.elt.getBoundingClientRect().height,
		sBarMaxH = round(sHeight - 32 * regions.length, 2)
	selectAll('.year-div', summary).forEach(yDiv => {
		if (+yDiv.attribute('year') == Year) yDiv.addClass('selected')
		else yDiv.removeClass('selected')
	})
	let newRNH = {}
	selectAll('.season-div', summary).forEach(sDiv => {
		const year = +sDiv.attribute('year'),
			region = sDiv.attribute('region'),
			season = sDiv.attribute('season')
		let newVal = accessor[Metric](data[region].summary, season, year)
		if (!newVal) newVal = 0
		const barH = round(map(newVal, 0, maxYearlyVal, 0, sBarMaxH, true), 2)
		sDiv.style('height', `${barH}px`).attribute('value', newVal)
		if (year > minYear) return
		if (!newRNH[region]) newRNH[region] = barH
		else newRNH[region] += barH
	})
	selectAll('.region-name-wrapper', summary).forEach(rN => {
		const region = rN.attribute('region')
		rN.style('height', `${newRNH[region] + 1}px`) // +1px for black top border
	})

	// update regional graphs
	for (let region of regions) {
		const note = notes[region]
		for (let i = 0; i < data[region].locations.length; i++) {
			const d = data[region].locations[i],
				lWrapper = select(`.location-wrapper[location="${d.name}"]`),
				ticks = selectAll('.tick', lWrapper),
				classes = lWrapper.class().split(' ')
			for (let c of classes) {
				if (c.includes('row')) lWrapper.removeClass(c)
			}
			lWrapper.addClass(`row-${i + 1}`)
			if (note && note.appliedTo(Year) && note.locations.includes(d.name)) {
				lWrapper.addClass('has-note')
			} else lWrapper.removeClass('has-note')
			let total = 0
			for (let s of seasons) {
				const tick = select(`.tick.${s}:has(.bar)`, lWrapper),
					value = accessor[Metric](d, s, Year)
				if (tick && !value) {
					tick.removeClass(s)
					select('.bar', tick).remove()
					select('.value', tick).remove()
				} else if (tick && value) {
					const heightPct = barHeightScale(value),
						bar = select('.bar', tick),
						valueT = select('.value', tick)
					if (bar) bar.style('height', `${heightPct}vh`)
					else createDiv().parent(tick).addClass('bar').style('height', `${heightPct}vh`)
					if (valueT) valueT.html(value)
					else createP(value).parent(tick).addClass('value')
					total += value
				} else if (value && !tick) {
					if (screenSize == 'laptop') {
						const months = d[`${s}Months`]
						for (let m of months) ticks[m - 1].addClass(s)
						let monthWBar
						if (d.region == 'Mekong River Delta') {
							if (s == 'spring') monthWBar = 4
							else if (s == 'autumn') monthWBar = 11
							else if (s == 'winter') monthWBar = 1
						} else monthWBar = months[[months.length - 1]]
						const t = ticks[monthWBar - 1],
							heightPct = barHeightScale(value)
						createP(value).parent(t).addClass('value')
						createDiv().parent(t).addClass('bar')
							.style('height', `${heightPct}vh`)
					} else {
						const t = s == 'spring' ? ticks[0]
							: s == 'autumn' ? ticks[1]
								: ticks[2],
							heightPct = barHeightScale(value)
						t.addClass(s)
						createP(value).parent(t).addClass('value')
						createDiv().parent(t).addClass('bar')
							.style('height', `${heightPct}vh`)
					}
					total += value
				}
			}
			total = round(total, 2)
			select('.total .value', lWrapper).html(total)
			if (total == 0) ticks.forEach(t => {
				for (let s of seasons) t.removeClass(s)
			})
		}
		if (note && note.appliedTo(Year)) {
			const rWrapper = select(`.region-wrapper[region="${region}"]`),
				noteT = select(`.note`, rWrapper)
			if (noteT) noteT.html(note.text)
			else createP(note.text).parent(rWrapper).addClass('note small')
		} else {
			const noteT = select(`.region-wrapper[region="${region}"] .note`)
			if (noteT) noteT.remove()
		}
	}
}
function redrawGraph() {
	pestCount = 0
	slinkyCount = 0
	pestControlHandheld = false
	pestControlSolar = false
	controlHandheldButton.removeClass('selected')
	controlSolarButton.removeClass('selected')
	// scrollTo(0, 0)
	sortData()
	updateDOM()
	quadtree.clear()
	field.clear()
	field.getSizing()
	field.grow()
}
function initInteractive() {
	sidebarButton = select('button#open-sidebar')
	sidebar = select('#sidebar')
	backLayer = select('#back-layer')
	sidebarButton.mouseClicked(() => {
		sidebarButton.toggleClass('open')
		if (sidebarButton.hasClass('open')) {
			sidebar.addClass('open')
			backLayer.addClass('open')
		} else {
			sidebar.removeClass('open')
			backLayer.removeClass('open')
		}
	})
	backLayer.mouseClicked(() => {
		sidebar.removeClass('open')
		backLayer.removeClass('open')
	})

	const iOOptions = { // options for IntersectionObserver
		root: null, // use document's viewport
		rootMargin: '0px',
		threshold: .1, //trigger when 10% of element is in view
	}, handleIntersection = (entries, observer) => {
		for (let entry of entries) {
			const loc = entry.target.getAttribute('location'),
				region = entry.target.getAttribute('region')
			if (loc) {
				if (entry.isIntersecting) field.addLocation(loc)
				else field.removeLocation(loc)
				field.sortLocations()
			} else if (region) {
				const button = select(`#summary button[region="${region}"]`)
				if (entry.isIntersecting) button.addClass('highlighted')
				else button.removeClass('highlighted')
			}
		}
	}
	scrollObserver = new IntersectionObserver(handleIntersection, iOOptions)
	selectAll('#graph .location-wrapper').forEach(e => scrollObserver.observe(e.elt))
	selectAll('#graph .region-wrapper').forEach(e => scrollObserver.observe(e.elt))

	selectAll('#legends .seasons button').forEach(b => {
		b.mouseClicked(() => {
			b.toggleClass('selected')
			const season = b.attribute('season')
			if (b.hasClass('selected')) seasonsShown[season] = true
			else seasonsShown[season] = false
		})
	})

	const metricButtons = selectAll(`#metrics button`)
	for (let b of metricButtons) {
		if (b.attribute('metric') == Metric) b.addClass('selected')
		else b.removeClass('selected')
		b.mouseClicked(() => {
			if (b.hasClass('selected')) return
			Metric = b.attribute('metric')
			select('#legends .metric').html(titles[Metric])
			select('#legends .unit').html(units[Metric])
			for (let s of seasons) {
				select(`#legends .seasons button[season="${s}"]`).addClass('selected')
				seasonsShown[s] = true
			}
			for (let b2 of metricButtons) {
				if (b2 == b) b2.addClass('selected')
				else b2.removeClass('selected')
			}
			redrawGraph()
			if (screenSize != 'laptop') sidebar.removeClass('open')
		})
	}

	yearSelect.changed(() => {
		Year = yearSelect.value()
		redrawGraph()
	})

	selectAll('.year-div', summary).forEach(yDiv => {
		yDiv.mouseClicked(() => {
			if (yDiv.attribute('year') == Year) return
			Year = yDiv.attribute('year')
			yearSelect.selected(Year)
			redrawGraph()
		})
	})

	const simButtons = selectAll('#simulation button')
	for (let b of simButtons) {
		if (b.attribute('mode') == 'add-pest-auto') {
			if (addPestAuto) b.addClass('selected')
			else b.removeClass('selected')
			b.mouseClicked(() => {
				b.toggleClass('selected')
				addPestAuto = b.hasClass('selected')
				if (b.hasClass('selected')) addPestAutoN.removeClass('faint')
				else addPestAutoN.addClass('faint')
			})
		} else if (b.attribute('mode') == 'add-pest-100') {
			b.mouseClicked(() => {
				if (mouseControl) field.addPests(100, mouseX, mouseY)
				else field.addPests(100)
				if (screenSize != 'laptop') sidebar.removeClass('open')
			})
		} else if (b.attribute('mode') == 'add-pest-all') {
			b.mouseClicked(() => {
				const n = pestMaxN - field.pests.length
				if (mouseControl) field.addPests(n, mouseX, mouseY)
				else field.addPests(n)
				if (screenSize != 'laptop') sidebar.removeClass('open')
			})
		} else if (b.attribute('mode') == 'pest-control-auto') {
			if (pestControlAuto) b.addClass('selected')
			else b.removeClass('selected')
			b.mouseClicked(() => {
				b.toggleClass('selected')
				pestControlAuto = b.hasClass('selected')
				if (b.hasClass('selected')) pestControlAutoN.removeClass('faint')
				else pestControlAutoN.addClass('faint')
			})
		} else if (b.attribute('mode') == 'pest-control-handheld') {
			if (pestControlHandheld) b.addClass('selected')
			else b.removeClass('selected')
			b.mouseClicked(() => {
				b.toggleClass('selected')
				pestControlHandheld = b.hasClass('selected')
				if (pestControlHandheld) {
					if (!field.slinkyGun) field.addSlinkyGun()
					else field.slinkyGun.wake()
					if (pestControlSolar) {
						pestControlSolar = false
						controlSolarButton.removeClass('selected')
						field.slinkySun.sleep()
					}
					if (screenSize != 'laptop') sidebar.removeClass('open')
				} else if (field.slinkyGun) field.slinkyGun.sleep()
			})
		} else if (b.attribute('mode') == 'pest-control-solar') {
			if (pestControlSolar) b.addClass('selected')
			else b.removeClass('selected')
			if (pestControlSolar) field.addSlinkySun()
			b.mouseClicked(() => {
				b.toggleClass('selected')
				pestControlSolar = b.hasClass('selected')
				if (pestControlSolar) {
					if (!field.slinkySun) field.addSlinkySun()
					else field.slinkySun.wake()
					if (pestControlHandheld) {
						pestControlHandheld = false
						controlHandheldButton.removeClass('selected')
						field.slinkyGun.sleep()
					}
					if (screenSize != 'laptop') sidebar.removeClass('open')
				} else if (field.slinkySun) field.slinkySun.sleep()
			})
		}
	}

	selectAll('#summary button.region-number').forEach(b => {
		b.mouseClicked(() => {
			const region = b.attribute('region'),
				rName = select(`.region-wrapper[region="${region}"] .region-name`),
				rY = rName.elt.getBoundingClientRect().top + scrollY - windowHeight / 2
			window.scrollTo({
				top: rY,
				behavior: 'smooth'
			})
			rName.addClass('flash')
			setTimeout(() => {
				rName.removeClass('flash')
			}, 1000)
			if (screenSize != 'laptop') sidebar.removeClass('open')
		})
	})

	document.addEventListener('scroll', () => {
		const yDelta = (scrollY - oldScrollY) * .33
		field.pushPests(yDelta)
		oldScrollY = scrollY
	})
	document.addEventListener('mouseleave', () => {
		forceField = null
		pestControlHandheld = false
		controlHandheldButton.removeClass('selected')
		if (field.slinkyGun) field.slinkyGun.sleep()
		// noLoop()
	})
	// document.addEventListener('mouseenter', () => {
	// 	loop()
	// })
}
class Worm {
	constructor(x, baseY, h, season, location, health, bar) {
		this.type = 'worm'
		this.bar = bar
		this.season = season
		this.location = location
		this.x = x
		this.baseY = baseY
		this.fullH = h
		this.corrected = false
		this.health = health
		this.maxHealth = health
		this.halfHealth = this.maxHealth / 2
		this.eyeY = 0
		this.maxWiggleF = map(health ** 2, 0, maxVal ** 2, .000002, .00015)
		if (Metric == 'yield') this.maxWiggleF *= .2
		this.wiggleF = this.maxWiggleF / 40
		const mult = Metric == 'yield' ? 1 : 4
		this.plungeXD = map(health, 0, maxVal, wormR, wormW * mult)
		const maxPSp = Metric == 'yield' ? 5 : 15
		this.plungeSp = map(health, 0, maxVal, 2, maxPSp)
		const maxPF = Metric == 'yield' ? .0002 : .002
		this.maxPanicF = map(health ** 2, 0, maxVal ** 2, .00005, maxPF)
		this.panicSpX = random(.1, .15)
		this.panicSpY = random(.07, .3)
		this.pulseSp = random(.02, .04)
		this.hDelta = random(5)
		this.zzzX = screenSize == 'phone' ? wormR + 3 : wormR + 4
		this.zzzXDir = -1
		this.cI = colorTransitionN - 1
		this.healSp = this.maxHealth / 300
		this.bloodPressure = 0
	}
	growBody() {
		this.segmentH = wormW / 3
		if (this.fullH < this.segmentH * 2.5) {
			this.hatchlet = true
			this.y = this.baseY - this.fullH / 2
			this.eyeY = -this.fullH / 4
		}
		else {
			this.h = this.fullH - this.segmentH // make space for rounded stroke adding 1/2 of stroke width at start and end of line
			let n = ceil((this.h + this.segmentH * .5) / (this.segmentH * 1.5))
			this.segmentH = this.h / (n * 1.5 - .5)
			this.segmentHH = this.segmentH / 2
			this.segments = []
			this.constraints = []
			const startY = this.baseY - this.segmentH
			for (let i = 0; i < n; i++) {
				const y = startY - (this.segmentH * 1.5) * i
				const segment = Bodies.rectangle(
					this.x, y,
					wormW, this.segmentH,
					{
						collisionFilter: { group: -1 },
						mass: .01,
						isStatic: i == 0,
					}
				), constraint = Constraint.create({
					bodyA: segment,
					bodyB: i == 0 ? null : this.segments[i - 1],
					pointB: i == 0 ? { x: this.x, y: y } : { x: 0, y: 0 },
					stiffness: 1,
					length: i == 0 ? 0 : this.segmentH * 1.5

				})
				Composite.add(engine.world, segment)
				Composite.add(engine.world, constraint)
				this.segments.push(segment)
				this.constraints.push(constraint)

				if (i == 0) this.base = segment
				if (i == 1) this.booty = segment
				if (i == n - 2) this.neck = segment
				if (i == n - 1) this.head = segment
			}
		}
	}
	sleep() {
		this.hPulse = map(sineTable.lookup(frameCount * this.pulseSp), -1, 1, 0, this.hDelta)
		this.h = this.fullH + this.hPulse
		this.y = this.baseY - this.h / 2

		if (!this.snoring && random() < .0025) {
			if (screenSize == 'phone') this.zzzXDir = random([-1, 1])
			this.snoring = true
			setTimeout(() => { this.snoring = false }, 1400)
		}
	}
	applyForceToHead(force) {
		Body.applyForce(
			this.head,
			this.head.position,
			force
		)
	}
	update() {
		this.bitten = millis() - this.lastBitten < 200
		if (!this.hiding && this.wiggleF < this.maxWiggleF) this.wiggleF *= 1.04
		if (!this.blinking && random() < .01) {
			this.blinking = true
			this.lastBlink = millis()
			setTimeout(() => { this.blinking = false }, 100)
		}
		if (this.hiding && this.headAnchor.length > 0) {
			this.headAnchor.length -= this.plungeSp
			if (this.headAnchor.length < 0) this.headAnchor.length = 0
		}
		if (this.omg) this.cI = round(map(this.bloodPressure, 0, wormMaxBloodPressure, colorTransitionN - 1, 0, true))
		else this.cI = round(map(this.health, 0, this.maxHealth, 0, colorTransitionN - 1, true))
	}
	correctHeight() {
		if (this.corrected) return
		const currentH = this.base.position.y - this.head.position.y + this.segmentH
		if (currentH > this.h) {
			const lastSegment = this.segments.pop(),
				lastConstraint = this.constraints.pop()
			Composite.remove(engine.world, lastSegment)
			Composite.remove(engine.world, lastConstraint)
			this.head = this.segments[this.segments.length - 1]
			this.neck = this.segments[this.segments.length - 2]
		} else if (currentH != this.h) {
			const d = this.h - currentH
			this.lastSegmentHH = abs(d) / 3
			this.lastSegmentH = this.lastSegmentHH * 2
			const pSegment = this.segments[this.segments.length - 1],
				newY = pSegment.position.y - this.segmentHH - this.lastSegmentH,
				newHead = Bodies.rectangle(
					this.x, newY,
					wormW, this.lastSegmentH,
					{
						collisionFilter: { group: -1 },
						mass: .01
					}
				), constraint = Constraint.create({
					bodyA: newHead,
					bodyB: pSegment,
					stiffness: 1,
					length: this.segmentHH + this.lastSegmentH,
				})
			Composite.add(engine.world, newHead)
			Composite.add(engine.world, constraint)
			this.segments.push(newHead)
			this.constraints.push(constraint)
			this.neck = pSegment
			this.head = newHead
			this.corrected = true
		}
	}
	followBar() {
		const barDim = this.bar.elt.getBoundingClientRect()

		this.baseY = barDim.bottom + scrollY
		this.x = barDim.left + barDim.width / 2

		if (this.hatchlet) this.y = this.baseY - this.fullH / 2
		else {
			const newY = this.baseY - this.segmentH
			Body.setPosition(this.base, { x: this.x, y: newY })
			if (this.headAnchor) this.headAnchor.pointB = { x: this.x - this.plungeXD, y: newY }
		}
	}
	wiggle() {
		if (this.hatchlet) return
		const xF = sineTable.lookup(frameCount * .11) * this.wiggleF
		Body.applyForce(
			this.booty,
			this.booty.position,
			{ x: xF, y: 0 }
		)
	}
	bleedOn(step) {
		this.lastBitten = millis()
		this.health--
		const p = random()
		if (p > .33) return
		Body.applyForce(
			this.head,
			this.head.position,
			{ x: 0, y: -.0002 }
		)
		if (p > .2) return
		return new Drop(
			this.head.position.x,
			this.head.position.y,
			step.y - 1
		)
	}
	panic() {
		const panicP = map(this.health, this.halfHealth, this.maxHealth, 1, .01, true)
		if (random() > panicP) return
		const panicForce = map(this.health, 0, this.maxHealth, this.maxPanicF, .00001, true),
			xF = sineTable.lookup(frameCount * this.panicSpX) * panicForce,
			yF = sineTable.lookup(frameCount * this.panicSpY) * panicForce
		Body.applyForce(
			this.head,
			this.head.position,
			{ x: xF, y: yF }
		)
	}
	hide() {
		if (this.hiding) return
		this.headAnchor = Constraint.create({
			bodyA: this.head,
			pointB: { x: this.x - this.plungeXD, y: this.baseY - this.segmentH },
			stiffness: 1
		})
		Composite.add(engine.world, this.headAnchor)
		this.hiding = true
		this.wiggleF = this.maxWiggleF / 40
	}
	heal() {
		if (this.health < this.maxHealth) {
			this.health += this.healSp
			if (pestControlSolar) this.health += this.healSp
		} else if (this.hiding) {
			Composite.remove(engine.world, this.headAnchor)
			this.headAnchor = null
			this.hiding = false
		}
	}
	aaaaah() {
		this.omg = true
		this.pressureRising = true
		this.blushing = true
		setTimeout(() => { Body.setStatic(this.head, false) }, 650)
	}
	fangirl() {
		if (random() < .25) {
			Body.applyForce(
				this.head,
				this.head.position,
				{ x: 0, y: -.0004 }
			)
		}
		if (this.pressureRising) {
			if (this.bloodPressure < wormMaxBloodPressure) this.bloodPressure++
			else {
				setTimeout(() => { this.pressureRising = false }, 5000)
			}
		} else {
			this.bloodPressure -= 5
			if (this.bloodPressure <= 0) {
				this.omg = false
				setTimeout(() => {
					this.smooched = false
					this.blushing = false
				}, 5000)
			}
		}
	}
	show() {
		if (this.hatchlet) {
			push()
			noStroke()
			translate(this.x, this.y)
			if (seasonsShown[this.season]) {
				fill(borderColors[this.season])
				if (this.fullH < 20) ellipse(0, 0, wormW + 2, this.h + 2)
				else rect(0, 0, wormW + 2, this.h + 2, width)
				if (this.snoring) {
					textAlign(this.zzzXDir < 0 ? RIGHT : LEFT, BASELINE)
					text('zzz', this.zzzX * this.zzzXDir, this.eyeY)
				}
				fill(seasonColors[this.season])
				if (this.fullH < 20) ellipse(0, 0, wormW, this.h)
				else rect(0, 0, wormW, this.h, width)
			} else {
				fill(ghostC)
				ellipse(0, 0, wormW + 2, this.h + 2)
				// fill(faintC)
				// ellipse(0,0,wormW,this.h)
			}
			const scaledEW = map(this.h, 2, this.segmentH, 0, eyeClosedW, true)
			fill(eyeC)
			rect(eyeLX, this.eyeY, scaledEW, 1)
			rect(eyeRX, this.eyeY, scaledEW, 1)
			pop()

		} else {
			// noStroke()
			// fill(seasonColors[this.season])
			// for (let i=0; i<this.segments.length; i++){
			//     const s=this.segments[i],
			//         h=i==this.segments.length-1&&this.lastSegmentH?this.lastSegmentH:this.segmentH
			//     push()
			//     translate(s.position.x,s.position.y)
			//     rotate(s.angle)
			//     rect(0,0,wormW,h)
			//     pop()
			// }
			// noFill()
			// stroke('red')
			// strokeWeight(1)
			// for (let c of this.constraints){
			//     const p1=Constraint.pointAWorld(c),
			//         p2=Constraint.pointBWorld(c)
			//     line(p1.x,p1.y,p2.x,p2.y)
			// }
			if (seasonsShown[this.season]) {
				strokeWeight(wormW + 2)
				noFill()
				stroke(borderColors[this.season])
				beginShape()
				for (let i = 0; i < this.segments.length; i++) {
					const { x, y } = this.segments[i].position
					vertex(x, y)
				}
				endShape()
				strokeWeight(wormW)
				noFill()
				stroke(seasonCT[this.season][this.cI])
				beginShape()
				for (let i = 0; i < this.segments.length; i++) {
					const { x, y } = this.segments[i].position
					vertex(x, y)
				}
				endShape()
			} else {
				strokeWeight(wormW + 2)
				noFill()
				stroke(ghostC)
				beginShape()
				for (let i = 0; i < this.segments.length; i++) {
					const { x, y } = this.segments[i].position
					vertex(x, y)
				}
				endShape()
			}

			push()
			noStroke()
			translate(this.head.position.x, this.head.position.y)
			if (this.neck) {
				const neckHeadV = createVector(
					this.head.position.x - this.neck.position.x,
					this.head.position.y - this.neck.position.y
				)
				rotate(neckHeadV.heading() + HALF_PI)
			}
			if (this.blushing && !this.hiding) {
				fill(blushC)
				ellipse(eyeLX, eyeW, eyeW * 2, eyeW)
				ellipse(eyeRX, eyeW, eyeW * 2, eyeW)
			}
			fill(eyeC)
			if (this.bitten || this.hiding || this.scared) {
				text('>', eyeLX, 0)
				text('<', eyeRX, 0)
			} else if (this.omg) {
				if (this.head.velocity.x < 0) scale(-1, 1)
				const dx = wormR / 2,
					mouthX = dx / 2
				text('3', eyeLX + dx, 0)
				text('3', eyeRX, 0)
				rect(mouthX, dx, eyeW, eyeW * 2)
			} else if (!this.corrected || this.blinking) {
				rect(eyeLX, 0, eyeClosedW, 1)
				rect(eyeRX, 0, eyeClosedW, 1)
			} else {
				square(eyeLX, 0, eyeW)
				square(eyeRX, 0, eyeW)
			}
			pop()
		}
	}
}
class Drop {
	constructor(x, y, yStep) {
		this.p = createVector(x, y)
		this.v = createVector(
			randomGaussian(wormR, 10) * random([-1, 1]),
			random(-5, -10)
		)
		this.dropF = createVector(0, 8)
		this.maxSp = random(2, 4)
		this.yStep = yStep
		this.life = 1
	}
	update() {
		if (this.p.y >= this.yStep) {
			if (this.life > 0) this.life -= .025
			return
		}
		this.v.add(this.dropF)
		this.v.limit(this.maxSp)
		this.p.add(this.v)
		if (this.p.y > this.yStep) this.p.y = this.yStep
	}
	show() {
		point(this.p.x, this.p.y)
	}
}
class Pest {
	constructor(x, y, vx, vy) {
		this.type = 'pest'
		this.p = createVector(x, y)
		this.v = createVector(vx, vy)
		this.a = createVector()
		this.maxF = random(3, 5)
		// this.maxF=1
		this.maxSp = random(4, 6)
		this.maxSpSq = this.maxSp ** 2
		this.v.setMag(this.maxSp)
		this.mass = 1
		this.separationMult = random(5, 10)
		this.cohesionMult = .2
		this.alignmentMult = .3
		this.wanderMult = random(2, 10)
		this.seekFoodMult = random(2, 5)
		this.view = {
			lx: this.p.x - pestViewR,
			rx: this.p.x + pestViewR,
			ty: this.p.y - pestViewR,
			by: this.p.y + pestViewR
		}
		this.maxHealth = 40
		this.halfHealth = this.maxHealth / 2
		this.lowHealth = this.maxHealth * .05
		this.health = randomGaussian(this.halfHealth, 5)
	}
	applyForce(force) {
		const f = V.div(force, this.mass)
		f.limit(this.maxF)
		this.a.add(f)
	}
	separation(neighbors) {
		let force = createVector(), count = 0
		for (let n of neighbors) {
			let desiredV = V.sub(this.p, n.p)
			if (desiredV.magSq() > pestMinDistanceRSq) continue
			force.add(desiredV)
			count++
		}
		if (!count) return
		force.div(count)
		force.limit(this.maxSp)
		force.sub(this.v)
		force.limit(this.maxF)
		return force
	}
	cohesion(neighbors) {
		let groupP = createVector()
		for (let n of neighbors) groupP.add(n.p)
		groupP.div(neighbors.length)
		let force = V.sub(groupP, this.p)
		force.limit(this.maxSp)
		force.sub(this.v)
		force.limit(this.maxF)
		return force
	}
	alignment(neighbors) {
		let force = createVector()
		for (let n of neighbors) force.add(n.v)
		force.div(neighbors.length)
		force.limit(this.maxSp)
		force.sub(this.v)
		force.limit(this.maxF)
		return force
	}
	swarm(neighbors) {
		for (let type of ['separation', 'cohesion', 'alignment']) {
			let force = this[type](neighbors)
			if (force) {
				force.mult(this[`${type}Mult`])
				this.applyForce(force)
			}
		}
	}
	avoidEdges() {
		if (this.p.x < pestR || this.p.x > width - pestR) this.v.x *= -.75
		if (this.p.y < pestR || this.p.y > height - pestR) this.v.y *= -.75
	}
	seekPosition(target) {
		let force = V.sub(target, this.p)
		force.limit(this.maxSp)
		force.sub(this.v)
		force.limit(this.maxF)
		force.mult(this.wanderMult)
		this.applyForce(force)
	}
	seekFood(target) {
		let force = createVector(
			target.head.position.x - this.p.x,
			target.head.position.y - scrollY - this.p.y
		), dSq = force.magSq()
		force.limit(this.maxSp)
		force.sub(this.v)
		force.limit(this.maxF)
		force.mult(this.seekFoodMult)
		this.applyForce(force)
		return dSq <= wormRSq + pestRSq + 2 * wormR * pestR
	}
	wander() {
		let futureV = this.v.copy(),
			wanderAngle = this.v.heading()
		futureV.setMag(pestW)
		futureV.add(this.p)

		let p = random()
		if (p < .05) wanderAngle += random(-.5, .5)
		let target = V.fromAngle(wanderAngle)
		target.setMag(pestViewR)
		target.add(futureV)
		this.seekPosition(target)
	}
	findClosest(worms) {
		let closest, minDSq = Infinity
		for (let worm of worms) {
			if (worm.hiding || !worm.corrected) continue
			const vec = createVector(
				worm.head.position.x - this.p.x,
				worm.head.position.y - scrollY - this.p.y
			), dSq = vec.magSq()
			if (dSq >= minDSq) continue
			minDSq = dSq
			closest = worm
		}
		return closest
	}
	bite(worm) {
		this.health++
		this.cI = colorTransitionN - 1 - worm.cI
		this.season = worm.season
	}
	redistribute() {
		this.p.x = random(pestR, width - pestR)
		this.p.y = random(pestR, height - pestR)
	}
	update() {
		this.health -= .03
		this.v.add(this.a)
		this.v.limit(this.maxSp)
		this.p.add(this.v)
		this.a.mult(0)

		this.view = {
			lx: this.p.x - pestViewR,
			rx: this.p.x + pestViewR,
			ty: this.p.y - pestViewR,
			by: this.p.y + pestViewR
		}

		this.cI = round(map(this.health, 0, this.maxHealth, 0, colorTransitionN - 1, true))
	}
	show() {
		if (!this.season) c2.stroke(pestColor)
		else c2.stroke(seasonCT[this.season][this.cI])
		c2.point(this.p.x, this.p.y)
	}
}
class Slinky {
	constructor(xSpawn, ySpawn, health, collisionCategory, lXLimit, rXLimit) {
		this.type = 'slinky'
		this.lXLim = lXLimit
		this.rXLim = rXLimit
		this.layers = []
		this.layerR = []
		this.constraints = []
		this.xSpawn = xSpawn
		this.ySpawn = ySpawn
		this.category = collisionCategory
		this.maxHealth = 150
		this.health = health
		this.healthLow = this.maxHealth * .35
		this.jumpF = map(this.health, 0, this.maxHealth, .001, .0015, true)
		this.jumpDelay = map(this.health, 0, this.maxHealth, 600, 400, true)
		this.headFY = map(this.health, 0, this.maxHealth, .000003, -.000003, true)
		this.jumpXDir = random([-1, 1])
		this.headSwingSp = random(.1, .15)
		this.lastJump = 0
		this.cI = colorTransitionN - 1
	}
	growBody() {
		const baseW = round(map(this.health, 100, 150, 30, 35, true)),
			layerH = 6
		for (let i = 0; i < 5; i++) {
			const w = baseW * (.95 ** 4 ** i),
				layer = Bodies.rectangle(
					this.xSpawn, this.ySpawn - layerH * i,
					w, layerH,
					{ collisionFilter: { category: 1, mask: i == 0 ? this.category : 1 } }
				)
			if (i) Body.setMass(layer, .001)
			Composite.add(engine2.world, layer)
			this.layers.push(layer)
			this.layerR.push(w / 2)
			if (!i) continue
			const pX = w * .4, pY = layerH / 2,
				constraint1 = Constraint.create({
					bodyA: this.layers[i - 1],
					pointA: { x: -pX, y: -pY },
					bodyB: layer,
					pointB: { x: -pX, y: pY },
					stiffness: .1
				}), constraint2 = Constraint.create({
					bodyA: this.layers[i - 1],
					pointA: { x: pX, y: -pY },
					bodyB: layer,
					pointB: { x: pX, y: pY },
					stiffness: .1
				}), constraint3 = Constraint.create({
					bodyA: this.layers[i - 1],
					pointA: { x: 0, y: -pY },
					bodyB: layer,
					pointB: { x: 0, y: pY },
					stiffness: .1
				})
			Composite.add(engine2.world, constraint1)
			Composite.add(engine2.world, constraint2)
			Composite.add(engine2.world, constraint2)
			this.constraints.push(constraint1, constraint2, constraint3)
		}
		this.base = this.layers[0]
		this.head = this.layers[this.layers.length - 1]
		const { x, y } = this.head.position
		this.view = {
			lx: x - slinkyViewR,
			rx: x + slinkyViewR,
			ty: y - scrollY - slinkyViewR,
			by: y - scrollY + slinkyViewR
		}
		this.groundingFY = []
		for (let i = 0; i < this.layers.length; i++) {
			const layer = this.layers[i]
			this.groundingFY.push(
				-layer.mass * engine.gravity.y * engine.gravity.scale * 2
			)
		}
	}
	avoidStepEdges() {
		const { x, } = this.base.position,
			overLeft = x <= this.lXLim && this.jumpXDir < 0,
			overRight = x >= this.rXLim && this.jumpXDir > 0,
			randomSwitch = x > this.lXLim + 30 && x < this.rXLim - 30 && random() < .001
		if (overLeft || overRight || randomSwitch) this.jumpXDir *= -1
	}
	update() {
		this.health -= .25
		this.jumpF = map(this.health, 0, this.maxHealth, .001, .0015, true)
		this.jumpDelay = map(this.health, 0, this.maxHealth, 600, 400, true)
		this.headFY = map(this.health, 0, this.maxHealth, .000003, -.000003, true)
		const { x, y } = this.head.position
		this.view = {
			lx: x - slinkyViewR,
			rx: x + slinkyViewR,
			ty: y - scrollY - slinkyViewR,
			by: y - scrollY + slinkyViewR
		}
		for (let layer of this.layers) {
			Body.applyForce(
				layer,
				layer.position,
				{ x: 0, y: -.0000005 }
			)
		}
		const headFX = sineTable.lookup(frameCount * this.headSwingSp) * .0000001
		Body.applyForce(
			this.head,
			this.head.position,
			{ x: headFX, y: this.headFY }
		)
		if (this.prey) this.preyTime++
		this.cI = round(map(this.health, 0, this.maxHealth, 0, colorTransitionN - 1, true))
	}
	followStep(step) {
		this.lXLim = step.lX
		this.rXLim = step.rX
		this.ySpawn = step.y - step.hh
		this.xSpawn = random(step.lX + 20, step.rX - 20)
		Body.setPosition(this.base, { x: this.xSpawn, y: this.ySpawn })
		Body.setPosition(this.head, { x: this.xSpawn, y: this.ySpawn - 20 })
	}
	jump() {
		if (millis() - this.lastJump < this.jumpDelay) return
		Body.applyForce(
			this.base,
			this.base.position,
			{ x: this.jumpF * this.jumpXDir, y: -this.jumpF }
		)
		this.lastJump = millis()
	}
	findClosest(pests) {
		let closest, minDSq = Infinity
		const { x, y } = this.head.position
		for (let pest of pests) {
			const vec = createVector(
				pest.p.x - x,
				pest.p.y - y + scrollY
			), dSq = vec.magSq()
			if (dSq >= minDSq || dSq > slinkyViewRSq) continue
			minDSq = dSq
			closest = pest
		}
		if (closest) return closest
	}
	setPrey(pest) {
		this.prey = pest
		this.preyTime = 0
	}
	resetPrey() {
		this.prey = null
		this.preyTime = 0
	}
	getPreyDistance() {
		const { x, y } = this.head.position
		this.preyV = createVector(
			this.prey.p.x - x,
			this.prey.p.y - y + scrollY
		)
		const dSq = this.preyV.magSq()
		this.withinTongueLength = dSq <= slinkyTongueLSq
		this.lostPrey = dSq > slinkyViewRSq || this.prey.health <= 0
		this.chaseTooLong = this.preyTime > 300 // more than 5s (at 60 frames/s)
	}
	chasePrey() {
		this.jumpXDir = this.prey.p.x > this.base.position.x ? 1 : -1
		if (random() > .25) return
		this.jump()
	}
	snatchPrey() {
		this.caughtPrey = true
		this.health += this.prey.health
		this.prey.health = 0
		const { x, y } = this.head.position
		this.preyBody = Bodies.circle(
			x + this.preyV.x, y + this.preyV.y, 5,
			{
				collisionFilter: { category: 2 ** 10 },
				isStatic: true
			}
		)
		Composite.add(engine2.world, this.preyBody)
		this.tongueConstraint = Constraint.create({
			bodyA: this.head,
			bodyB: this.preyBody,
			stiffness: .2
		})
		Composite.add(engine2.world, this.tongueConstraint)
	}
	eat() {
		if (this.tongueConstraint.length > .5) {
			this.tongueConstraint.length *= .7
		} else {
			Composite.remove(engine2.world, this.tongueConstraint)
			Composite.remove(engine2.world, this.preyBody)
			this.prey = null
			this.preyBody = null
			this.tongueConstraint = null
			this.caughtPrey = false
		}
	}
	die() {
		for (let layer of this.layers) Composite.remove(engine2.world, layer)
		for (let constraint of this.constraints) Composite.remove(engine2.world, constraint)
		if (this.tongueConstraint) Composite.remove(engine2.world, this.tongueConstraint)
		if (this.preyBody) Composite.remove(engine2.world, this.preyBody)
		slinkyCount--
		slinkyCountT.html(slinkyCount)
	}
	show() {
		if (this.tongueConstraint) {
			strokeWeight(slinkyW)
			stroke(slinkyTongueC)
			const p1 = Constraint.pointAWorld(this.tongueConstraint),
				p2 = Constraint.pointBWorld(this.tongueConstraint)
			line(p1.x, p1.y, p2.x, p2.y)
		}
		stroke(slinkyBorderC)
		strokeWeight(slinkyW + 2)
		for (let i = 0; i < this.layers.length; i++) {
			const layer = this.layers[i],
				{ x, y } = layer.position,
				r = max([this.layerR[i], 2])
			line(x - r, y, x + r, y)
			if (layer != this.head) {
				const nextLayer = this.layers[i + 1],
					nextX = nextLayer.position.x,
					nextY = nextLayer.position.y,
					nextR = this.layerR[i + 1]
				if (i % 2) line(x + r, y, nextX + nextR, nextY)
				else line(x - r, y, nextX - nextR, nextY)
			}
		}
		stroke(slinkyCT[this.cI])
		strokeWeight(slinkyW)
		for (let i = 0; i < this.layers.length; i++) {
			const layer = this.layers[i],
				{ x, y } = layer.position,
				r = max([this.layerR[i], 2])
			line(x - r, y, x + r, y)
			if (layer != this.head) {
				const nextLayer = this.layers[i + 1],
					nextX = nextLayer.position.x,
					nextY = nextLayer.position.y,
					nextR = this.layerR[i + 1]
				if (i % 2) line(x + r, y, nextX + nextR, nextY)
				else line(x - r, y, nextX - nextR, nextY)
			}
		}
		push()
		noStroke()
		fill(eyeC)
		translate(this.head.position.x, this.head.position.y)
		if (this.health <= this.healthLow) {
			text('~', slinkyEyeLX, 0)
			text('~', slinkyEyeRX, 0)
		} else {
			square(slinkyEyeLX, 0, slinkyEyeW)
			square(slinkyEyeRX, 0, slinkyEyeW)
		}
		pop()
	}
}
class ForceField {
	constructor(x, y) {
		this.type = 'forcefield'
		this.p = createVector(x, y)
		this.r = forceFieldR
		this.d = this.r * 2
		this.mass = forceFieldRSq * PI / 100
	}
	update() {
		this.range = {
			lx: this.p.x - forceFieldR,
			rx: this.p.x + forceFieldR,
			ty: this.p.y - forceFieldR,
			by: this.p.y + forceFieldR
		}
	}
	setTarget(x, y) {
		this.target = { x, y }
	}
	towardTarget() {
		if (!this.target) return
		const dX = this.target.x - this.p.x,
			dY = this.target.y - this.p.y
		this.p.x += dX * .2
		this.p.y += dY * .2
	}
	attract(pest) {
		let force = V.sub(this.p, pest.p),
			massProduct = this.mass * pest.mass
		const dSq = constrain(force.magSq(), 100, 625),
			mag = massProduct / dSq
		force.setMag(mag)
		return force
	}
	repel(worm) {
		let force = createVector(
			worm.head.position.x - this.p.x,
			worm.head.position.y - scrollY - this.p.y
		),
			massProduct = worm.head.mass * this.mass,
			maxDSq = forceFieldRSq + wormRSq + 2 * this.r * wormR

		const applicable = force.magSq() <= maxDSq,
			dSq = constrain(force.magSq(), 100, 625),
			mag = massProduct / dSq
		force.setMag(mag)
		return [force, applicable]
	}
	exertForces() {
		const neighbors = quadtree.getNeighborsInRange(this.range)
		if (neighbors && neighbors.length) {
			const pests = neighbors.filter(n => n.type == 'pest'),
				worms = neighbors.filter(n => n.type == 'worm')
			if (pests) {
				for (let pest of pests) {
					const force = forceField.attract(pest)
					force.mult(4)
					pest.applyForce(force)
				}
			}
			if (worms) {
				for (let worm of worms) {
					if (!worm.corrected || worm.hidden || worm.omg) continue
					const [force, applicable] = forceField.repel(worm)
					if (applicable) {
						worm.scared = true
						force.mult(.03)
						worm.applyForceToHead(force)
					} else worm.scared = false
				}
			}
		}
	}
	showForcefield() {
		push()
		// drawingContext.filter = 'blur(20px)'
		stroke(forceFieldC)
		strokeWeight(this.d)
		point(this.p.x, this.p.y)
		pop()
	}
}
class SlinkyGun extends ForceField {
	constructor(x, y, headCount, collisionCategory) {
		super(x, y)
		this.rSq = this.r ** 2
		this.category = collisionCategory
		this.heads = []
		this.body = Bodies.circle(
			x, y, this.r,
			{
				isStatic: true,
				collisionFilter: { category: this.category, mask: this.category }
			}
		)
		Composite.add(engine2.world, this.body)
		const baseV = createVector(this.r, 0),
			angle = TWO_PI / headCount
		for (let i = 0; i < headCount; i++) {
			const baseP = createVector(
				x + baseV.x,
				y + baseV.y
			)
			this.heads.push(new SlinkyHead(baseP, baseV, this.body, this.rSq))
			baseV.rotate(angle)
		}
	}
	updateBody() {
		Body.setPosition(this.body, { x: this.p.x, y: this.p.y })
	}
	sleep() {
		this.body.isSleeping = true
		for (let head of this.heads) {
			for (let layer of head.layers) {
				layer.isSleeping = true
			}
		}
	}
	wake() {
		this.body.isSleeping = false
		for (let head of this.heads) {
			for (let layer of head.layers) {
				layer.isSleeping = false
			}
		}
	}
	repel(pests) {
		for (let pest of pests) {
			let force = V.sub(pest.p, this.p),
				massProduct = this.mass * pest.mass
			const dSq = constrain(force.magSq(), 100, 625),
				mag = massProduct / dSq
			force.setMag(mag * 5)
			pest.applyForce(force)
		}
	}
	attract(worms) {
		for (let worm of worms) {
			if (!worm.corrected || worm.smooched || worm.omg) continue
			let force = createVector(
				this.p.x - worm.head.position.x,
				this.p.y - worm.head.position.y + scrollY
			)
			if (force.magSq() < forceFieldRSq) continue

			const massProduct = worm.head.mass * this.mass,
				dSq = constrain(force.magSq(), 100, 625),
				mag = massProduct / dSq
			force.setMag(mag * .02)
			worm.applyForceToHead(force)
		}
	}
	show() {
		for (let head of this.heads) head.show()
	}
}
class SlinkySun extends SlinkyGun {
	constructor(x, y, headCount, collisionCategory) {
		super(x, y, headCount, collisionCategory)
		this.rayW = max([width, height])
		this.pathXR = width / 2 - forceFieldR * 2
		this.pathYR = height / 2 - forceFieldR * 2
		this.cycleDuration = map(width, 300, 2000, 12, 10, true)
		this.angle = PI * 1.5
		this.dAngle = TWO_PI / (60 * this.cycleDuration)// finish one cycle every x seconds at 60 frames/s
	}
	resize() {
		this.rayW = max([width, height])
		this.pathXR = width / 2 - forceFieldR * 2
		this.pathYR = height / 2 - forceFieldR * 2
	}
	sunPath() {
		this.p.x = width / 2 + this.pathXR * sineTable.lookup(this.angle + PI / 2) // cos(this.angle)=sin(this.angle+PI/2)
		this.p.y = height / 2 + this.pathYR * sineTable.lookup(this.angle)
		this.angle += this.dAngle
	}
	show() {
		// push()
		// translate(this.p.x, this.p.y)
		// // drawingContext.filter = 'blur(20px)'
		// stroke(sunRayC)
		// strokeWeight(this.rayW)
		// point(0, 0)
		// stroke('red')
		// strokeWeight(this.d)
		// point(0, 0)
		// pop()
		// this.ray.position(this.p.x, this.p.y)
		const ctx = select('#canvas .back').elt.getContext('2d'),
			gradient = ctx.createRadialGradient(this.p.x, this.p.y, 0, this.p.x, this.p.y, this.rayW)
		gradient.addColorStop(0, sunRayC[0])
		gradient.addColorStop(.25, sunRayC[1])
		gradient.addColorStop(.5, sunRayC[2])
		gradient.addColorStop(.75, sunRayC[3])
		ctx.fillStyle = gradient
		ctx.fillRect(0, 0, width, height)
		for (let head of this.heads) head.show()
	}
}
class SlinkyHead {
	constructor(basePosition, baseVector, gunBody, gunBodyRSq) {
		this.type = 'slinky-head'
		this.layers = []
		this.constraints = []
		this.gunBody = gunBody
		this.gunBodyRSq = gunBodyRSq

		let layerV = baseVector.copy(),
			layerN = 5, layerH = wormW / 3,
			currentP = basePosition.copy(),
			collisionCategory = gunBody.collisionFilter.category
		layerV.setMag(layerH)
		for (let i = 0; i < layerN; i++) {
			const layer = Bodies.rectangle(
				currentP.x, currentP.y,
				wormW, layerH,
				{
					collisionFilter: { category: collisionCategory, mask: collisionCategory },
					friction: .25,
					// frictionAir: .075,
					frictionAir: .02
				}
			), constraint = Constraint.create({
				bodyA: layer,
				bodyB: i == 0 ? gunBody : this.layers[this.layers.length - 1],
				pointB: i == 0 ? { x: baseVector.x, y: baseVector.y } : { x: 0, y: 0 },
				stiffness: i == 0 ? 1 : .2,
				damping: .1
			})
			this.layers.push(layer)
			this.constraints.push(constraint)
			Composite.add(engine2.world, layer)
			Composite.add(engine2.world, constraint)
			if (i == 0) this.base = layer
			if (i == layerN - 1) this.head = layer
			if (i == layerN - 2) this.neck = layer
			currentP.add(layerV)
		}

		this.view = {
			lx: this.head.position.x - slinkyGunViewR,
			rx: this.head.position.x + slinkyGunViewR,
			ty: this.head.position.y - slinkyGunViewR,
			by: this.head.position.y + slinkyGunViewR
		}
	}
	update() {
		this.view = {
			lx: this.head.position.x - slinkyGunViewR,
			rx: this.head.position.x + slinkyGunViewR,
			ty: this.head.position.y - slinkyGunViewR,
			by: this.head.position.y + slinkyGunViewR
		}
	}
	findClosest(pests) {
		let closest, minDSq = Infinity
		const { x, y } = this.head.position
		for (let pest of pests) {
			const vec = createVector(
				pest.p.x - x,
				pest.p.y - y
			), dSq = vec.magSq()
			if (dSq >= minDSq || dSq > slinkyGunViewRSq) continue
			minDSq = dSq
			closest = pest
		}
		if (closest) return closest
	}
	getPreyDistance() {
		this.preyV = createVector(
			this.prey.p.x - this.head.position.x,
			this.prey.p.y - this.head.position.y
		)
		const dSq = this.preyV.magSq()
		this.withinTongueLength = dSq <= slinkyGunTongueLSq
	}
	snatchPrey() {
		this.caughtPrey = true
		this.prey.health = 0
		this.preyBody = Bodies.circle(
			this.head.position.x + this.preyV.x,
			this.head.position.y + this.preyV.y,
			5, {
			collisionFilter: { category: 2 ** 31, mask: 2 ** 31 },
			isStatic: true
		}
		)
		Composite.add(engine2.world, this.preyBody)
		this.tongueConstraint = Constraint.create({
			bodyA: this.head,
			bodyB: this.preyBody,
			stiffness: .2,
		})
		Composite.add(engine2.world, this.tongueConstraint)
	}
	eat() {
		if (this.tongueConstraint.length > .5) {
			this.tongueConstraint.length *= .5
		} else {
			Composite.remove(engine2.world, this.tongueConstraint)
			Composite.remove(engine2.world, this.preyBody)
			this.prey = null
			this.preyBody = null
			this.tongueConstraint = null
			this.caughtPrey = false
		}
	}
	findClosestPartner(worms) {
		let closest, minDSq = Infinity
		for (let worm of worms) {
			const vec = createVector(
				worm.head.position.x - this.head.position.x,
				worm.head.position.y - scrollY - this.head.position.y
			), dSq = vec.magSq(),
				vec2 = createVector(
					worm.head.position.x - this.gunBody.position.x,
					worm.head.position.y - scrollY - this.gunBody.position.y
				), dSq2 = vec2.magSq()
			if (dSq >= minDSq || dSq > slinkyGunViewRSq) continue
			if (dSq2 <= this.gunBodyRSq) continue
			minDSq = dSq
			closest = worm
		}
		if (closest) return closest
	}
	smooch() {
		this.smooching = true
		this.partner.smooched = true
		Body.setStatic(this.partner.head, true)
		this.smoochTarget = Bodies.circle(
			this.partner.head.position.x,
			this.partner.head.position.y - scrollY,
			5, {
			collisionFilter: { category: 2 ** 31 },
			isStatic: true
		}
		)
		Composite.add(engine2.world, this.smoochTarget)
		this.pullConstraint = Constraint.create({
			bodyA: this.head,
			bodyB: this.smoochTarget,
			stiffness: .2,
		})
		Composite.add(engine2.world, this.pullConstraint)
	}
	smoochHarder() {
		if (this.pullConstraint.length > wormR / 2) {
			this.pullConstraint.length *= .85
		} else this.endSmooch()
	}
	endSmooch() {
		this.partner.aaaaah()
		Composite.remove(engine2.world, this.smoochTarget)
		Composite.remove(engine2.world, this.pullConstraint)
		this.smoochTarget = null
		this.pullConstraint = null
		this.smooching = false
		this.partner = null
	}
	show() {
		if (this.tongueConstraint) {
			const p1 = Constraint.pointAWorld(this.tongueConstraint),
				p2 = Constraint.pointBWorld(this.tongueConstraint)
			strokeWeight(slinkyGunTongueW)
			stroke(slinkyTongueC)
			line(p1.x, p1.y, p2.x, p2.y)
		}
		stroke(slinkyBorderC)
		strokeWeight(wormW + 2)
		beginShape()
		for (let i = 0; i < this.layers.length; i++) {
			const { x, y } = this.layers[i].position
			vertex(x, y)
		}
		endShape()
		stroke(slinkyC)
		strokeWeight(wormW)
		beginShape()
		for (let i = 0; i < this.layers.length; i++) {
			const { x, y } = this.layers[i].position
			vertex(x, y)
		}
		endShape()
		push()
		noStroke()
		fill(eyeC)
		translate(this.head.position.x, this.head.position.y)
		const neckHeadV = createVector(
			this.head.position.x - this.neck.position.x,
			this.head.position.y - this.neck.position.y
		)
		rotate(neckHeadV.heading() + HALF_PI)
		square(eyeLX, 0, eyeW)
		square(eyeRX, 0, eyeW)
		pop()
	}
}
class Step {
	constructor(lX, rX, y, category, location) {
		this.location = location
		this.lX = lX
		this.rX = rX
		this.y = y
		this.h = 12
		this.hh = this.h / 2
		this.worms = []
		this.slinkies = []
		this.nutrients = 0
		this.category = category
		this.body = Bodies.rectangle(
			width / 2, this.y + this.hh, width, this.h,
			{
				isStatic: true,
				collisionFilter: { category: category, mask: 1 }
			}
		)
		Composite.add(engine2.world, this.body)
	}
	absorbNutrients() {
		this.nutrients++
	}
	mostDamagedWorm() {
		let worm, maxDamage = 0
		for (let w of this.worms) {
			const wDamage = w.maxHealth - w.health
			if (!wDamage || wDamage < maxDamage) continue
			worm = w
			maxDamage = wDamage
		}
		if (!worm) worm = random(this.worms)
		return worm
	}
	reposition() {
		const lWrapper = select(`.location-wrapper[location="${this.location}"]`),
			lWDim = lWrapper.elt.getBoundingClientRect()
		this.lX = lWDim.left
		this.rX = lWDim.right
		this.y = lWDim.bottom + scrollY
		Composite.remove(engine2.world, this.body)
		this.body = Bodies.rectangle(
			width / 2, this.y + this.hh, width, this.h,
			{
				isStatic: true,
				collisionFilter: { category: this.category, mask: 1 }
			}
		)
		Composite.add(engine2.world, this.body)
	}
	update() {
		if (this.nutrients <= 0) return
		this.nutrients -= .01
	}
	spawnSlinkyNear(worm) {
		if (slinkyCount >= slinkyMaxN) return
		if (this.slinkies.length >= slinkyPerStepN) return
		const xSpawn = constrain(worm.x + random(-30, 30), this.lX, this.rX),
			ySpawn = this.y - this.hh,
			slinky = new Slinky(xSpawn, ySpawn, this.nutrients, this.category, this.lX, this.rX)
		slinky.growBody()
		this.slinkies.push(slinky)
		this.nutrients = 0
		slinkyCount++
		slinkyCountT.html(slinkyCount)
	}
	spawnSlinky() {
		if (slinkyCount >= slinkyMaxN) return
		if (this.slinkies.length >= slinkyPerStepN) return
		const xSpawn = random(this.lX + 20, this.rX - 20),
			ySpawn = this.y - this.hh,
			slinky = new Slinky(xSpawn, ySpawn, this.nutrients, this.category, this.lX, this.rX)
		slinky.growBody()
		this.slinkies.push(slinky)
		this.nutrients = 0
		slinkyCount++
		slinkyCountT.html(slinkyCount)
	}
}
class Field {
	constructor() {
		this.locSorted = []
		this.locInView = []
		this.steps = {}
		this.pests = []
		this.drops = []
		this.correcting = true
		this.wormsCorrected = 0
		this.wormsToCorrect = 0
	}
	getSizing() {
		wormW = select('.bar').elt.getBoundingClientRect().width
		wormR = wormW / 2
		wormRSq = wormR ** 2
		eyeW = map(windowWidth, 300, 1000, 2.5, 4, true)
		eyeClosedW = eyeW * 1.25
		eyeLX = -wormR
		eyeRX = wormR
		pestMaxN = round(map(windowWidth, 300, 2000, 100, 600, true))
		slinkyMaxN = round(map(windowWidth, 300, 2000, 20, 50, true))
		slinkyEyeW = map(windowWidth, 300, 1000, 3, 3.5, true)
		slinkyEyeLX = -slinkyW * .8
		slinkyEyeRX = slinkyW * .8
		slinkyGunTongueW = wormW * .9
		select('#simulation .pest-count .max').html(pestMaxN)
		select('#simulation .pest-control-count .max').html(slinkyMaxN)
		forceFieldR = map(windowWidth, 300, 1000, 30, 45, true)
		forceFieldRSq = forceFieldR ** 2
	}
	grow() {
		for (let region of regions) {
			const lData = data[region].locations
			for (let i = 0; i < lData.length; i++) {
				const d = lData[i],
					lW = select(`.location-wrapper[location="${d.name}"]`),
					lWDim = lW.elt.getBoundingClientRect()
				this.locInView.push(d.name)
				this.locSorted.push(d.name)
				const collisionCategory = 2 ** (i % 9 + 1),
					step = new Step(lWDim.left, lWDim.right, lWDim.bottom + scrollY, collisionCategory, d.name)
				for (let season of seasons) {
					const b = select(`.tick.${season} .bar`, lW)
					if (!b) continue
					const bS = b.elt.getBoundingClientRect(),
						x = bS.left + bS.width / 2,
						value = +select(`.tick.${season} .value`, lW).html(),
						worm = new Worm(x, bS.bottom + scrollY, bS.height, season, d.name, value, b)
					worm.growBody()
					step.worms.push(worm)
					if (!worm.hatchlet) this.wormsToCorrect++
				}
				this.steps[d.name] = step
			}
		}
	}
	updateQuadtree() {
		for (let loc of this.locInView) {
			const step = this.steps[loc]
			for (let slinky of step.slinkies) quadtree.insert(slinky)
			for (let worm of step.worms) {
				if (!worm.hatchlet) quadtree.insert(worm)
			}
		}
		for (let pest of this.pests) quadtree.insert(pest)
		if (pestControlHandheld) {
			quadtree.insert(this.slinkyGun)
			for (let head of this.slinkyGun.heads) quadtree.insert(head)
		} else if (pestControlSolar) {
			quadtree.insert(this.slinkySun)
			for (let head of this.slinkySun.heads) quadtree.insert(head)
		}
	}
	addLocation(loc) {
		if (this.locInView.includes(loc)) return
		this.locInView.push(loc)
	}
	removeLocation(loc) {
		const i = this.locInView.indexOf(loc)
		this.locInView.splice(i, 1)
		for (let slinky of this.steps[loc].slinkies) slinky.die()
		this.steps[loc].slinkies = []
		for (let worm of this.steps[loc].worms) {
			if (worm.hatchlet || !worm.corrected) continue
			for (let segment of worm.segments) segment.isSleeping = true
		}
	}
	sortLocations() {
		this.locInView.sort((a, b) => this.locSorted.indexOf(a) - this.locSorted.indexOf(b))
	}
	correctWormsHeight() {
		if (frameCount < 150 || random() > .02) return
		for (let loc of this.locSorted) {
			const worms = this.steps[loc].worms
			if (!worms.length) continue
			for (let worm of worms) {
				if (worm.hatchlet) continue
				if (worm.corrected && !worm.counted) {
					this.wormsCorrected++
					worm.counted = true
				} else worm.correctHeight()
			}
		}
		this.correcting = this.wormsCorrected != this.wormsToCorrect
	}
	reassignBars() {
		for (let loc of this.locSorted) {
			for (let worm of this.steps[loc].worms) {
				worm.bar = select(`.location-wrapper[location="${worm.location}"] .tick.${worm.season} .bar`)
			}
		}
	}
	resize() {
		this.getSizing()
		for (let loc of this.locSorted) {
			const step = this.steps[loc]
			step.reposition()
			for (let worm of step.worms) worm.followBar()
			for (let slinky of step.slinkies) slinky.followStep(step)
		}
		for (let pest of this.pests) pest.redistribute()
		if (this.slinkySun) this.slinkySun.resize()
		this.resizeNeeded = false
	}
	stepBelow(worm) {
		let stepBelow
		const wX = worm.head.position.x,
			wY = worm.head.position.y
		for (let loc of this.locInView) {
			const step = this.steps[loc]
			if (step.y <= wY) continue
			if (step.rX < wX - wormW || step.lX > wX + wormW) continue
			stepBelow = step
			break
		}
		if (!stepBelow) stepBelow = this.steps[worm.location]
		return stepBelow
	}
	runField() {
		for (let loc of this.locInView) {
			const step = this.steps[loc]
			step.update()
			// spawn & run pest control
			const spawnP = map(step.nutrients, 100, 150, 0, 1, true) ** 2
			if (pestControlAuto && random() < spawnP) {
				const worm = step.mostDamagedWorm()
				if (worm) step.spawnSlinkyNear(worm)
				else step.spawnSlinky()
			}
			for (let i = step.slinkies.length - 1; i >= 0; i--) {
				const slinky = step.slinkies[i]
				if (slinky.health <= 0) {
					slinky.die()
					step.slinkies.splice(i, 1)
					continue
				}
				if (!slinky.prey) {
					const huntingP = map(slinky.health, 0, slinky.maxHealth, 1, .05, true)
					if (random() <= huntingP) {
						let neighbors = quadtree.getNeighborsInRange(slinky.view),
							pests, pest
						if (neighbors && neighbors.length) {
							pests = neighbors.filter(n => n.type == 'pest' && n.health > 0)
							if (pests.length) pest = slinky.findClosest(pests)
							if (pest) slinky.setPrey(pest)
						}
					}
				}
				if (slinky.prey) {
					if (slinky.caughtPrey) slinky.eat()
					else {
						slinky.getPreyDistance()
						if (slinky.withinTongueLength) slinky.snatchPrey()
						else if (slinky.lostPrey || slinky.chaseTooLong) slinky.resetPrey()
						else slinky.chasePrey()
					}
				} else if (random() < .05) slinky.jump()
				slinky.avoidStepEdges()
				slinky.update()
			}
			// run worms
			for (let worm of step.worms) {
				if (worm.hatchlet) worm.sleep()
				else if (!worm.corrected) continue
				else {
					if (worm.bitten) worm.panic()
					if (worm.health < 0) worm.hide()
					if (!worm.hiding && !worm.bitten) worm.wiggle()
					if (worm.hiding || !worm.bitten) worm.heal()
					if (worm.omg) worm.fangirl()
					worm.update()
				}
			}
		}
	}
	addPests(n = 20, gX = null, gY = null) {
		let groupX, groupY
		if (random() < .5) {
			groupX = random([pestR, width - pestR])
			groupY = random(height)
		} else {
			groupX = random(width)
			groupY = random([pestR, height - pestR])
		}
		for (let i = 0; i < n; i++) {
			if (this.pests.length >= pestMaxN) break
			const x = !gX && !gY ? randomGaussian(groupX, 50) : randomGaussian(gX, 50),
				y = !gX && !gY ? randomGaussian(groupY, 50) : randomGaussian(gY, 50),
				vx = random([-1, 1]),
				vy = random([-1, 1])
			this.pests.push(new Pest(x, y, vx, vy))
			pestCount++
			pestCountT.html(pestCount)
		}
	}
	pushPests(y) {
		for (let pest of this.pests) {
			pest.p.y -= y
			pest.p.y = constrain(pest.p.y, pestR, height - pestR)
		}
	}
	runPests() {
		for (let i = this.pests.length - 1; i >= 0; i--) {
			const pest = this.pests[i]
			if (pest.health <= 0) {
				this.pests.splice(i, 1)
				pestCount--
				pestCountT.html(pestCount)
				continue
			}
			// let neighbors = quadtree.getNeighbors(pest)
			let neighbors = quadtree.getNeighborsInRange(pest.view)
			if (neighbors && neighbors.length) {
				const otherPests = neighbors.filter(n => n != pest && n.type == 'pest')
				if (otherPests.length) pest.swarm(otherPests)
				const huntingP = map(pest.health, 0, pest.maxHealth, 1, 0, true)
				if (random() <= huntingP) {
					const worms = neighbors.filter(n => n.type == 'worm')
					let worm, biteable
					if (worms.length) {
						worm = pest.findClosest(worms)
						if (worm) biteable = pest.seekFood(worm)
						if (biteable) {
							pest.bite(worm)
							const stepBelow = this.stepBelow(worm),
								drop = worm.bleedOn(stepBelow)
							if (drop) {
								this.drops.push(drop)
								stepBelow.absorbNutrients()
							}
						}
					}
				}
			}
			// if (!hunting && forceField) {
			// 	const [force,] = forceField.attract(pest)
			// 	force.mult(3)
			// 	pest.applyForce(force)
			// }
			pest.avoidEdges()
			pest.wander()
			pest.update()
		}
	}
	runDrops() {
		for (let i = this.drops.length - 1; i >= 0; i--) {
			const drop = this.drops[i]
			drop.update()
			if (drop.life > 0) continue
			this.drops.splice(i, 1)
		}
	}
	addSlinkyGun() {
		const C = TWO_PI * forceFieldR,
			headN = ceil(C / wormW),
			collisionCategory = 2 ** 30
		this.slinkyGun = new SlinkyGun(mouseX, mouseY, headN, collisionCategory)
	}
	runSlinkyGun() {
		if (!this.slinkyGun) return
		this.slinkyGun.update()
		this.slinkyGun.towardTarget()
		this.slinkyGun.updateBody()
		this.slinkyGun.repel(this.pests)
		for (let loc of this.locInView) {
			this.slinkyGun.attract(this.steps[loc].worms)
		}
		for (let head of this.slinkyGun.heads) {
			let neighbors = quadtree.getNeighborsInRange(head.view),
				hasNeighbors = neighbors && neighbors.length
			if (!head.prey && hasNeighbors) {
				let pests = neighbors.filter(n => n.type == 'pest')
				if (pests.length) head.prey = head.findClosest(pests)
			}
			if (head.prey) {
				if (head.smooching) head.endSmooch()
				if (head.caughtPrey) head.eat()
				else if (head.prey.health <= 0) head.prey = null
				else {
					head.getPreyDistance()
					if (head.withinTongueLength) head.snatchPrey()
				}
			} else {
				if (!head.partner && random() < .0025 && hasNeighbors) {
					let worms = neighbors.filter(n => n.type == 'worm' && n.corrected && !n.hiding && !n.smooched && !n.omg)
					if (worms.length) head.partner = head.findClosestPartner(worms)
				}
				if (head.partner) {
					if (head.smooching) head.smoochHarder()
					else head.smooch()
				}
			}
			head.update()
		}
	}
	addSlinkySun() {
		const C = TWO_PI * forceFieldR,
			headN = ceil(C / wormW),
			collisionCategory = 2 ** 31
		this.slinkySun = new SlinkySun(width / 2, forceFieldR * 2, headN, collisionCategory)
	}
	runSlinkySun() {
		if (!this.slinkySun) return
		this.slinkySun.update()
		this.slinkySun.sunPath()
		this.slinkySun.updateBody()
		this.slinkySun.repel(this.pests)
		for (let loc of this.locInView) {
			this.slinkySun.attract(this.steps[loc].worms)
		}
		for (let head of this.slinkySun.heads) {
			let neighbors = quadtree.getNeighborsInRange(head.view),
				hasNeighbors = neighbors && neighbors.length
			if (!head.prey && hasNeighbors) {
				let pests = neighbors.filter(n => n.type == 'pest')
				if (pests.length) head.prey = head.findClosest(pests)
			}
			if (head.prey) {
				if (head.smooching) head.endSmooch()
				if (head.caughtPrey) head.eat()
				else if (head.prey.health <= 0) head.prey = null
				else {
					head.getPreyDistance()
					if (head.withinTongueLength) head.snatchPrey()
				}
			} else {
				if (!head.partner && random() < .0025 && hasNeighbors) {
					let worms = neighbors.filter(n => n.type == 'worm' && n.corrected && !n.hiding && !n.smooched && !n.omg)
					if (worms.length) head.partner = head.findClosestPartner(worms)
				}
				if (head.partner) {
					if (head.smooching) head.smoochHarder()
					else head.smooch()
				}
			}
			head.update()
		}
	}
	clear() {
		Composite.clear(engine.world, false)
		Composite.clear(engine2.world, false)
		// if (quadtree) quadtree.clear()
		this.locSorted = []
		this.locInView = []
		this.steps = {}
		this.pests = []
		this.drops = []
		this.slinkyGun = null
		this.slinkySun = null
		this.correcting = true
		this.wormsCorrected = 0
		this.wormsToCorrect = 0
	}
	show() {
		if (pestControlSolar) {
			this.slinkySun.show()
		}
		push()
		translate(0, -scrollY)
		stroke(dropC)
		strokeWeight(dropW)
		for (let drop of this.drops) drop.show()
		for (let loc of this.locInView) {
			const step = this.steps[loc]
			for (let slinky of step.slinkies) slinky.show()
			for (let worm of step.worms) worm.show()
		}
		pop()
		for (let pest of this.pests) pest.show()
		if (pestControlHandheld) this.slinkyGun.show()
		// else if (pestControlSolar) {
		// 	this.slinkySun.show()
		// }
		// quadtree.show()
	}
}
class QuadTree {
	constructor(boundary = { lx: 0, rx: width, ty: 0, by: height, w: width, h: height }) {
		this.boundary = boundary
		this.objects = []
		this.subdivided = false
		this.quadrants = ['topleft', 'topright', 'botleft', 'botright']
	}
	contains(object) {
		let x, y
		switch (object.type) {
			case 'pest':
			case 'forcefield':
				x = object.p.x
				y = object.p.y
				break
			case 'worm':
			case 'slinky':
				x = object.head.position.x
				y = object.head.position.y - scrollY
				break
			case 'slinky-head':
				x = object.head.position.x
				y = object.head.position.y
				break
		}
		return x >= this.boundary.lx && x < this.boundary.rx
			&& y >= this.boundary.ty && y < this.boundary.by
	}
	intersects(range) {
		return range.lx <= this.boundary.rx
			&& range.rx >= this.boundary.lx
			&& range.ty <= this.boundary.by
			&& range.by >= this.boundary.ty
	}
	subdivide() {
		let hw = this.boundary.w / 2, hh = this.boundary.h / 2,
			subBoundaries = {
				topleft: { lx: this.boundary.lx, rx: this.boundary.lx + hw, ty: this.boundary.ty, by: this.boundary.ty + hh, w: hw, h: hh },
				topright: { lx: this.boundary.lx + hw, rx: this.boundary.rx, ty: this.boundary.ty, by: this.boundary.ty + hh, w: hw, h: hh },
				botleft: { lx: this.boundary.lx, rx: this.boundary.lx + hw, ty: this.boundary.ty + hh, by: this.boundary.by, w: hw, h: hh },
				botright: { lx: this.boundary.lx + hw, rx: this.boundary.rx, ty: this.boundary.ty + hh, by: this.boundary.by, w: hw, h: hh }
			}
		for (let q of this.quadrants) {
			this[q] = new QuadTree(subBoundaries[q])
		}
		this.subdivided = true
		// move objects to subquadrants to improve performance
		for (let o of this.objects) {
			for (let q of this.quadrants) {
				this[q].insert(o)
			}
		}
		this.objects = []
	}
	insert(object) {
		if (!this.contains(object)) return
		if (!this.subdivided && this.objects.length < quadtreeCellCount) this.objects.push(object)
		else {
			if (!this.subdivided) this.subdivide()
			for (let q of this.quadrants) this[q].insert(object)
		}
	}
	getNeighbors(object) {
		if (!this.contains(object)) return
		if (!this.subdivided) return this.objects
		for (let q of this.quadrants) {
			let found = this[q].getNeighbors(object)
			if (found) return found
		}
	}
	getNeighborsInRange(range) {
		if (!this.intersects(range)) return
		if (!this.subdivided) return this.objects
		let found = []
		for (let q of this.quadrants) {
			let foundInQ = this[q].getNeighborsInRange(range)
			if (foundInQ) found.push(...foundInQ)
		}
		return found
	}
	clear() {
		this.objects = []
		this.subdivided = false
		for (let q of this.quadrants) delete this[q]
	}
	show() {
		c2.push()
		c2.noFill()

		c2.stroke('red')
		c2.rect(this.boundary.lx, this.boundary.ty, this.boundary.w, this.boundary.h)
		if (!this.subdivided) return
		for (let q of this.quadrants) this[q].show()
		c2.pop()
	}
}
class SineTable {
	constructor() {
		this.results = []
		for (let i = 0; i < TWO_PI; i += .01) {
			this.results.push(sin(i))
		}
	}
	lookup(value) {
		const i = floor(value % TWO_PI / .01)
		return this.results[i]
	}
}
