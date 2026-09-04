jQuery(document).ready(function($) {

	var map = $('.mapplic-routes'),
		self = map.data('mapplic'),
		wayfinding = null;
	var fastMode = window.matchMedia('(max-width: 760px)').matches;
	var autoRouteAttempts = 0;
	var specialLocations = {
		'FOYER': 'Enter',
		'EXIT': 'Enter',
		'MAINCANTEEN': 'EatingRoomMain',
		'ENTRANCECANTEEN': 'EatingRoomEnter',
		'RIGHTBUFFET': 'EatingShopEnterRight',
		'LEFTBUFFET': 'EatingShopEnterLeft',
		'B313BUFFET': 'EatingRoomBcac',
		'V313BUFFET': 'EatingRoomCcac',
		'G309BUFFET': 'EatingRoomGcki'
	};

	function normalizeLocation(value) {
		return (value || '')
			.toUpperCase()
			.replace(/\(В[–—\- ]?78\)/g, '')
			.replace(/КАБИНЕТ|АУДИТОРИЯ|№/g, '')
			.replace(/[^А-ЯЁA-Z0-9.]/g, '')
			.replace(/^ИВЦ/, 'ИВЦ');
	}

	function resolveLocation(token) {
		if (!token || !self || !self.l) return null;
		var normalized = normalizeLocation(token).replace(/^@/, '');
		var specialId = specialLocations[normalized];
		if (specialId && self.l[specialId]) return self.l[specialId];
		if (self.l[token]) return self.l[token];
		var ids = Object.keys(self.l);
		for (var i = 0; i < ids.length; i++) {
			var location = self.l[ids[i]];
			var aliases = [location.id, location.title, location.thumbnail];
			for (var j = 0; j < aliases.length; j++) {
				if (normalizeLocation(aliases[j]) === normalized) return location;
			}
		}
		return null;
	}

	function routeLabel(token, location) {
		var labels = {
			'FOYER': 'Фойе главного корпуса',
			'EXIT': 'Главный выход',
			'MAINCANTEEN': 'Главная столовая',
			'ENTRANCECANTEEN': 'Столовая у главного входа',
			'RIGHTBUFFET': 'Буфет у главного входа · справа',
			'LEFTBUFFET': 'Буфет у главного входа · слева',
			'B313BUFFET': 'Буфет у Б-313',
			'V313BUFFET': 'Буфет у В-313',
			'G309BUFFET': 'Буфет у Г-309'
		};
		var normalized = normalizeLocation(token).replace(/^@/, '');
		if (labels[normalized]) return labels[normalized];
		var room = (token || location.title || '').replace(/\s*\(В[–—\- ]?78\)\s*/i, '').trim();
		return room || location.title;
	}

	function setRouteSummary(fromLabel, toLabel, status, error) {
		$('#route-from').text(fromLabel || 'Выбери точку на карте');
		$('#route-to').text(toLabel || 'Выбери точку на карте');
		$('#route-status').text(status || 'Укажи начало и конец маршрута').toggleClass('is-error', !!error);
	}

	function tryAutoRoute() {
		var params = new URLSearchParams(window.location.search);
		var fromToken = params.get('from');
		var toToken = params.get('to');
		if (!fromToken || !toToken || !wayfinding || !self) return;
		var from = resolveLocation(fromToken);
		var to = resolveLocation(toToken);
		if (!from || !to) {
			if (autoRouteAttempts++ < 40) {
				window.setTimeout(tryAutoRoute, 150);
				return;
			}
			setRouteSummary(
				from ? routeLabel(fromToken, from) : fromToken,
				to ? routeLabel(toToken, to) : toToken,
				'Точка не найдена на карте. Выбери её вручную через поиск.',
				true
			);
			return;
		}
		var fromPointId = wayfinding.resolvePointId(from.id);
		var toPointId = wayfinding.resolvePointId(to.id);
		if (!fromPointId || !toPointId) {
			if (autoRouteAttempts++ < 40) window.setTimeout(tryAutoRoute, 150);
			return;
		}
		// The official schedule token is the user-facing source of truth.
		// Original map labels are from 2022–2023 and may use legacy spelling.
		var fromDisplay = $.extend({}, from, { title: routeLabel(fromToken, from) });
		var toDisplay = $.extend({}, to, { title: routeLabel(toToken, to) });
		wayfinding.setLoc(fromDisplay, wayfinding.fromselect);
		wayfinding.setLoc(toDisplay, wayfinding.toselect);
		wayfinding.showPanel(wayfinding);
		if (wayfinding.showPath(fromPointId, toPointId) === false) {
			setRouteSummary(routeLabel(fromToken, from), routeLabel(toToken, to), 'Между этими точками нет маршрута на карте.', true);
			return;
		}
		setRouteSummary(routeLabel(fromToken, from), routeLabel(toToken, to), 'Маршрут построен. Переключай этажи кнопками на карте.');
	}
	var buildFloors = function() {
		wayfinding = new Wayfinding().init();
		map.on('svgloaded', function(e, svg, id) {
			wayfinding.build(svg, id);
			window.setTimeout(tryAutoRoute, 0);
		});
	}

	
	if (self) buildFloors();
	else {
		map.on('mapstart', function(e, s) {
			self = s;
			buildFloors();
		});
	}

	var isWayDrawning = false;
	var FirstTimeCall = true;
	var childs = [];

	map.on('mapready', function(e, self) {
		window.setTimeout(tryAutoRoute, 0);
	});
	map.on('levelswitched', function(e, level) {
		if(isWayDrawning){
			switch(level)
			{
			case 'zero-floor':
				if(!FirstTimeCall){
				WayDetailsShowing("По лестнице на нулевой этаж");
				}
				WayDetailsShowing("Маршрут по нулевому этажу");
				FirstTimeCall = false;
				break;
			case 'first-floor':
				if(!FirstTimeCall){
				WayDetailsShowing("По лестнице на первый этаж");
				}
				WayDetailsShowing("Маршрут по первому этажу");
				FirstTimeCall = false;
				break;
			case 'second-floor':
				if(!FirstTimeCall){
				WayDetailsShowing("По лестнице на второй этаж");
				}
				WayDetailsShowing("Маршрут по второму этажу");
				FirstTimeCall = false;
				break;
			case 'third-floor':
				if(!FirstTimeCall){
				WayDetailsShowing("По лестнице на третий этаж");
				}
				WayDetailsShowing("Маршрут по третьему этажу");
				FirstTimeCall = false;
				break;
			case 'fourth-floor':
				if(!FirstTimeCall){
				WayDetailsShowing("По лестнице на четвертый этаж");
				}
				WayDetailsShowing("Маршрут по четвертому этажу");
				FirstTimeCall = false;
				break;
			};
		}
	});

	function WayDetailsShowing(text){
		showRoute(text);
		return text;
	}

	const showRoute = (text) =>{
	//$(".way-details-text").append(`<button class="routeBtn")>${text}`)
	function getFloor(text) {
		if(text.indexOf("нулевому") != -1 || text.indexOf("нулевой") != -1){
			SwitchLevel('zero-floor');
		}
		else if(text.indexOf("первому") != -1 || text.indexOf("первый") != -1){
			SwitchLevel('first-floor');
		}
		else if(text.indexOf("второму") != -1 || text.indexOf("второй") != -1){
			SwitchLevel('second-floor');
		}
		else if(text.indexOf("третьему") != -1 || text.indexOf("третий") != -1){
			SwitchLevel('third-floor');
		}
		else if(text.indexOf("четвертому") != -1 || text.indexOf("четвертый") != -1){
			SwitchLevel('fourth-floor');
		}
		
	}
	//$("document").on('click', '.routeBtn', function() {getFloor(text)})
	$(".way-details-text").append(`<span>${text}`)
	$(".way-details-text").append(`<br/>`)
	} 

	// wayfinding
	function Wayfinding() {
		this.waypoints = [];
		this.pointIndex = Object.create(null);
		this.endpointIndex = Object.create(null);
		this.floorConnectorGroups = Object.create(null);
		this.element = null;
		this.path = null;
		this.el = null;
		this.close = null;
		this.wheelchair = null;
		this.waydetails = null;
		this.waydetailstext = null;
		this.fromselect = null;
		this.toselect = null;
		this.submit = null;
		this.timeouts = [];

		this.endPoints = [];

		this.o = {
			opened: true,
			from: false,
			accessible: false,
			disability: false,
			floordist: 20,
			smoothing: 5,
			linecolor: '#f23543',
			linewidth: 1.5,
			speed: 1
		};

		this.init = function() {
			// merging options with defaults
			this.o = $.extend(this.o, self.o.routes);

			// data-from attribute
			if (self.el.data('from')) this.o.from = self.el.data('from');

			this.el = this.markup();
			self.container.el.append(this.el);

			return this;
		}

		this.markup = function() {
			var s = this;

			// panel
			this.el = $('<div></div>').addClass('mapplic-routes-panel');
			if (self.o.fullscreen) this.el.css('top', '40px');

			// detais
			this.waydetails = $('<div></div>').addClass('mapplic-routes-details-panel').appendTo(this.el);
			this.waydetailstext = $('<div></div>').addClass('way-details-text').appendTo(this.waydetails);
			
			this.fromselect = $('<div></div').addClass('mapplic-routes-select').appendTo(this.el);
			$('<small></small>').appendTo(this.fromselect);
			$('<div></div>').appendTo(this.fromselect);
			$('<span></span>').text('Выберите начальную точку').appendTo(this.fromselect);

			// dots
			var dots = $('<div></div>').addClass('mapplic-routes-dots').appendTo(this.el);
			for (i = 0; i < 3; i++) $('<span></span>').appendTo(dots);


			// fixed from
			map.on('mapready', function(e) {
				if (s.o.from) {
					s.setLoc(self.l[s.o.from], s.fromselect);
					s.fromselect.addClass('fixed');
				}
			});

			if (!this.o.from) {
				var swap = $('<div></div>').addClass('mapplic-routes-swap').appendTo(this.el).on('click', function() {
					$(this).toggleClass('rotate');

					var from = $('> div', s.fromselect);
					var to = $('> div', s.toselect);
					to.appendTo(s.fromselect);
					from.appendTo(s.toselect);

					s.fromselect.toggleClass('filled', !!to.children().length);
					s.toselect.toggleClass('filled', !!from.children().length);
				});
			}

			this.toselect = $('<div></div>').addClass('mapplic-routes-select').appendTo(this.el);
			$('<small></small>').appendTo(this.toselect);
			$('<div></div').appendTo(this.toselect);
			$('<span></span>').text('Выберите конечную точку').appendTo(this.toselect);


			$(document).on('click', '.mapplic-routes-select:not(.fixed)', function() {
				$('.active', s.el).removeClass('active');
				$(this).addClass('active');
			});

			// clear field small
			$(document).on('click', '.mapplic-routes-select.filled:not(.fixed) small', function() {
				$(this).siblings('div').empty();
				$(this).parent('.mapplic-routes-select.filled').removeClass('filled');
			});

			this.submit = $('<button></button>').addClass('mapplic-routes-submit').appendTo(this.el);
			this.submit.on('click touchstart', function(e) {
				e.preventDefault();

				s.el.removeClass('mapplic-closed');
				
				var f = s.getFrom(),
					t = s.getTo();

				$('.active', s.el).removeClass('active');

				if (f && t) s.showPath(f, t);
				else if (!f) s.fromselect.addClass('active');
				else if (!t) s.toselect.addClass('active');
				self.hideLocation();
			});

			// hide panel
			this.close = $('<div></div>').text('Скрыть').addClass('mapplic-routes-close').appendTo(this.el);
			this.close.on('click touchstart', function() {
				s.clear();

				s.hidePanel(s);
			});

			// accessible
			if (this.o.accessible) {
				this.wheelchair = $('<button></button>').addClass('mapplic-routes-wheelchair').appendTo(this.el);
				this.wheelchair.on('click touchstart', function(e) {
					e.preventDefault();
					s.o.disability = !s.o.disability;
					$(this).toggleClass('enabled', s.o.disability);
				});

				if (this.o.disability) this.wheelchair.addClass('enabled');
			}

			// icon
			$(document).on('click touchstart', '.mapplic-routes-icon', function() {
				var id = $(this).attr('data-location'),
					f = s.getFrom();

				s.setLoc(self.l[id], s.toselect);
				s.showPanel(s);

				if (!f) s.fromselect.trigger('click');
				else {
					s.showPath(f, id);
					self.hideLocation();
				}
			});

			self.el.on('locationopened', function(e, location, content) {
				// route action
				if (location.action == 'route') {
					var f = s.getFrom();

					s.setLoc(location, s.toselect);
					s.showPanel(s);

					if (!f) s.fromselect.trigger('click');
					else {
						s.showPath(f, location.id);
						self.hideLocation();
					}
				}
				else {
					s.setLoc(location, false);

					// content icon
					if ($('.mapplic-tooltip-body', content).length) content = $('.mapplic-tooltip-body', content);
					if ($('.mapplic-routes-icon', content).length) $('.mapplic-routes-icon', content).attr('data-location', location.id);
					else $('<div></div>').addClass('mapplic-routes-icon').attr('data-location', location.id).appendTo(content);
				}

			});

			// hidden by default
			if (!this.o.opened) this.hidePanel(this);

			return this.el;
		}



		// set location
		this.setLoc = function(location, target) {
			// no target set
			if (!target) target = $('.mapplic-routes-select.active', this.el);

			// clear
			target.removeClass('filled');
			$('> div', target).empty();

			// location already set (from or to)
			if (location.id == this.getFrom() && !this.o.from || location.id == this.getTo()) return false;

			// set location
			var loc = $('<div></div>').addClass('mapplic-routes-loc').text(location.title).attr('data-location', location.id);
			$('> div', target).append(loc);
			target.addClass('filled');
		}

		// get from and to locations
		this.getFrom = function() {
			if (this.o.from) return this.o.from;
			else return $('.mapplic-routes-loc', this.fromselect).data('location');
		}

		this.getTo = function() {
			return $('.mapplic-routes-loc', this.toselect).data('location');
		}

		// show/hide panel
		this.showPanel = function(s) {
			s.el.removeClass('mapplic-closed');
		}

		this.hidePanel = function(s) {
			s.el.addClass('mapplic-closed');

			$('.active', s.el).removeClass('active');
		}

		// build graph
		this.build = function(svg, fid) {
			var routes = $('[id^=route]', svg),
				s = this,
				firstWaypointIndex = this.waypoints.length;

			this.element = routes;
			$('> *', routes).each(function() {
				var id = $(this).attr('id'),
					ndo = ($(this).css('stroke') == 'rgb(255, 0, 0)'); // non-disabled only

				if (id) id = id.replace(/_[1-9]+_$/g, '');

				switch (this.tagName) {
					case 'line':
						var a = s.addPoint($(this).attr('x1'), $(this).attr('y1'), id, routes, fid),
							b = s.addPoint($(this).attr('x2'), $(this).attr('y2'), id, routes, fid);
							val = s.distance(a, b);
						s.linkPoint(a, b, val, ndo);
						s.linkPoint(b, a, val, ndo);
						break;
					case 'polygon':
					case 'polyline':
						var pairs = $(this).attr('points').replace(/\s\s+/g, ' ').trim().split(' ');
						var list = [];
						for (var i = 0; i < pairs.length; i++) {
							var pair = pairs[i].split(','),
								point = s.addPoint(pair[0], pair[1], id, routes, fid);

							if (list.length > 0) {
								var val = s.distance(point, list[list.length - 1]);
								s.linkPoint(point, list[list.length - 1], val, ndo);
								s.linkPoint(list[list.length - 1], point, val, ndo);

								if ((this.tagName == 'polygon') && ($(this).css('fill') != 'none')) {
									for (var j = list.length - 2; j >= 0; j--) {
										val = s.distance(point, list[j]);
										s.linkPoint(point, list[j], val, ndo);
										s.linkPoint(list[j], point, val, ndo);
									}
								}
							}
							list.push(point);
						}

						if (this.tagName == 'polygon') {
							var val = s.distance(list[0], point);
							s.linkPoint(point, list[0], val, ndo);
							s.linkPoint(list[0], point, val, ndo);
						}
						break;
					default:
						console.error('Invalid element in routes: ' + this.tagName + '. Valid types are line, polyline and polygon.');
				}
			});

			// Link only the newly loaded stairs and lifts. The original code
			// rescanned the whole graph after every floor and rendered thousands
			// of debug circles, which made mobile browsers stutter badly.
			for (var i = firstWaypointIndex; i < this.waypoints.length; i++) {
				var waypoint = this.waypoints[i];
				if (!waypoint.id || waypoint.id.indexOf('pf-') !== 0) continue;
				var group = waypoint.id.split('-').slice(0, 2).join('-');
				var peers = this.floorConnectorGroups[group] || [];
				for (var j = 0; j < peers.length; j++) {
					s.linkPoint(waypoint, peers[j], this.o.floordist);
					s.linkPoint(peers[j], waypoint, this.o.floordist);
				}
				peers.push(waypoint);
				this.floorConnectorGroups[group] = peers;
			}

			// auto assign points to location shapes
			var lp = []; // location points

			$('[id^=landmark] > *[points], [id^=landmark] > g > *[points]', svg).each(function() {
				var pairs = $(this).attr('points').replace(/\s\s+/g, ' ').trim().split(' '),
					id = $(this).attr('id');

				if (id) {
					for (var i = 0; i < pairs.length; i++) {
						var pair = pairs[i].split(',');
						lp.push({
							id: id,
							x: pair[0],
							y: pair[1]
						});
					}
				}
			});

			var locationsByPoint = Object.create(null);
			for (var i = 0; i < lp.length; i++) {
				locationsByPoint[this.pointKey(lp[i].x, lp[i].y)] = lp[i].id;
			}
			for (var i = firstWaypointIndex; i < this.waypoints.length; i++) {
				var waypoint = this.waypoints[i];
				if (waypoint.n.length !== 1 || waypoint.id) continue;
				var locationId = locationsByPoint[this.pointKey(waypoint.x, waypoint.y)];
				if (locationId) {
					waypoint.id = 'p-' + locationId;
					this.indexEndpoint(locationId, i);
					this.addListIcon(locationId);
				}
			}

		}

		this.showPath = function(a, b) {
			var wpa = this.getPoints(a),
				wpb = this.getPoints(b);
				
			if (!wpa || !wpb) return false;

			var path = this.shortestPath(wpa, wpb),
				start = 0,
				dist = 0;

			this.clear();
			
			if (!path) {
				console.error('There is no path between target locations!');
				return false;
			}

			// multifloor support
			for (var i = 1; i < path.length; i++) {
				if (path[i-1].fid != path[i].fid) {
					this.showSubPath(path.slice(start, i), path[i].dist - dist, dist, path[start].fid);
					dist = path[i].dist;
					start = i;
				}
			}

			this.endPoints = Array.from(document.getElementsByClassName('mapplic-routes-loc')).map(v => v.innerText)
			// last or only floor
			this.showSubPath(
				path.slice(start,path.length), 
				path[path.length - 1].dist - dist, 
				dist, 
				path[start].fid);

			let s = this

			childs = $(".way-details-text");
			childs.empty();


			WayDetailsShowing(s.endPoints[0]);
			var t = setTimeout(function() {
				WayDetailsShowing(s.endPoints[1]);
				FirstTimeCall = true;
				isWayDrawning = false;
			}, fastMode ? 0 : dist * 10 / this.o.speed + this.timeouts.length * 600); // delay between floors
			this.timeouts.push(t);


			
		}


		this.showSubPath = function(subpath, dist, dur, fid) {
			var s = this;
			var t = setTimeout(function() {
				// switch level, zoom and draw
				self.switchLevel(fid);
				var path = s.drawPath(subpath, dist);
				self.bboxZoom(path);
			}, fastMode ? 0 : dur * 10 / s.o.speed + s.timeouts.length * 600); // delay between floors
			s.timeouts.push(t);

			isWayDrawning = true;
			
		}

		this.addListIcon = function(id) {
			$('<div></div>').addClass('mapplic-routes-icon').attr('data-location', id).appendTo($('.mapplic-list-location[data-location=' + id + ']', self.el));
		}

		this.bboxZoom = function(bbox) {
			var padding = 40,
				wr = self.container.el.width() / (bbox.width + padding),
				hr = self.container.el.height() / (bbox.height + padding);

			return Math.min(wr, hr);
		}

		this.drawCircle = function(wp, color) {
			color = typeof color !== 'undefined' ? color : 'red';
			var circle = $(this.svg('circle')).attr('cx', wp.x)
				.attr('cy', wp.y)
				.attr('r', 2)
				.attr('fill', color)
				.attr('stroke', 'none')
				.appendTo(wp.floor);
		}

		this.linePoint = function(a, b) {
			var xlen = parseFloat(b.x) - parseFloat(a.x),
				ylen = parseFloat(b.y) - parseFloat(a.y),
				len = Math.abs(a.dist-b.dist);
				size = Math.min(this.o.smoothing, len/2),
				r = size / len;

			return {
				x: parseFloat(a.x) + xlen * r,
				y: parseFloat(a.y) + ylen * r
			}
		}
		// the route
		this.drawPath = function(list, dist) {


			var d = 'M ' + list[0].x + ',' + list[0].y;

			for (var i = 0; i < list.length; i++) {
				if (this.o.smoothing && (i>0 && i<list.length-1)) {
					var p = this.linePoint(list[i], list[i-1]);
					d += ' L' + p.x + ',' + p.y;
					d += ' Q' + list[i].x + ',' + list[i].y;
					var p = this.linePoint(list[i], list[i+1]);
					d += ' ' + p.x + ',' + p.y;
				}
				else d += ' L' + list[i].x + ',' + list[i].y;
			}		

			this.path = $(this.svg('path'))
				.attr('class', 'mapplic-routes-path')
				.attr('stroke', this.o.linecolor)
				.attr('stroke-width', this.o.linewidth)
				.attr('d', d)
				.insertAfter(list[0].floor);

			// Drawing a long animated SVG path is expensive on mobile GPUs.
			if (!fastMode) {
				var p = this.path.get(0),
					length = p.getTotalLength();
				p.style.strokeDasharray = length + ' ' + length;
				p.style.strokeDashoffset = length;
				p.getBoundingClientRect();
				p.style.transition = p.style.WebkitTransition = 'stroke-dashoffset ' + dist / 100 / this.o.speed + 's ease-in-out 0.4s'; // 400ms delay
				p.style.strokeDashoffset = '0';
			}
			//debugger;

			return this.path;
		}

		// clear route
		this.clear = function() {
			$('.mapplic-routes-path', map).remove();
			for (var i = 0; i < this.timeouts.length; i++) { clearTimeout(this.timeouts[i]); }
			this.timeouts = [];
		}

		this.shortestPath = function(a, b) {
			for (var i = 0; i < this.waypoints.length; i++) {
				this.waypoints[i].dist = Number.POSITIVE_INFINITY;
				this.waypoints[i].prev = undefined;
			}

			// Binary-heap Dijkstra avoids the original O(V²) full graph scan.
			var heap = [], target = null, path = [], targets = Object.create(null);
			for (var i = 0; i < b.length; i++) targets[b[i]] = true;
			for (var i = 0; i < a.length; i++) {
				this.waypoints[a[i]].dist = 0;
				this.heapPush(heap, { index: a[i], dist: 0 });
			}

			while (heap.length) {
				var current = this.heapPop(heap), p = this.waypoints[current.index];
				if (current.dist !== p.dist) continue;
				if (targets[current.index]) {
					target = p;
					break;
				}
				for (var i = 0; i < p.n.length; i++) {
					var edge = p.n[i];
					if (this.o.disability && edge.ndo) continue;
					var alt = p.dist + edge.val;
					if (alt < edge.to.dist) {
						edge.to.dist = alt;
						edge.to.prev = p;
						this.heapPush(heap, { index: edge.to.index, dist: alt });
					}
				}
			}

			if (!target) return false;
			path.push(target);

			while (target.prev !== undefined) {
				target = target.prev;
				path.unshift(target);
			}
			return path;
		}

		this.heapPush = function(heap, entry) {
			heap.push(entry);
			var index = heap.length - 1;
			while (index > 0) {
				var parent = Math.floor((index - 1) / 2);
				if (heap[parent].dist <= entry.dist) break;
				heap[index] = heap[parent];
				index = parent;
			}
			heap[index] = entry;
		}

		this.heapPop = function(heap) {
			var first = heap[0], last = heap.pop();
			if (heap.length && last) {
				var index = 0;
				while (true) {
					var left = index * 2 + 1, right = left + 1;
					if (left >= heap.length) break;
					var child = right < heap.length && heap[right].dist < heap[left].dist ? right : left;
					if (heap[child].dist >= last.dist) break;
					heap[index] = heap[child];
					index = child;
				}
				heap[index] = last;
			}
			return first;
		}

		this.addPoint = function(x, y, id, floor, fid) {
			var key = this.pointKey(x, y),
				point = this.pointIndex[key];
			if (!point) {
				point = {
					id: id,
					index: this.waypoints.length,
					x: x,
					y: y,
					floor: floor,
					fid: fid,
					n: []
				};
				this.waypoints.push(point);
				this.pointIndex[key] = point;
				if (id && id.indexOf('p-') === 0) this.indexEndpoint(id.slice(2), point.index);
			
				// list button
				if (id) this.addListIcon(id.replace('p-', ''));
			}

			return point;
		}

		this.getPoints = function(id) {
			var p = this.endpointIndex[id];
			if (p && p.length > 0) return p;
			else {
				console.error('There is no path to location: ' + id);
				return null;
			}
		}

		// A few entries in the original JSON have a trailing "o" that is
		// absent from the SVG route graph (A-205, A-206, A-208 and others).
		// Keep the public location IDs intact and only adapt the graph endpoint.
		this.resolvePointId = function(id) {
			var candidates = [id];
			if (/o$/.test(id)) candidates.push(id.slice(0, -1));

			for (var c = 0; c < candidates.length; c++)
				if (this.endpointIndex[candidates[c]]) return candidates[c];
			return null;
		}

		this.indexEndpoint = function(id, index) {
			if (!this.endpointIndex[id]) this.endpointIndex[id] = [];
			if (this.endpointIndex[id].indexOf(index) === -1) this.endpointIndex[id].push(index);
		}

		this.pointKey = function(x, y) {
			return parseFloat(x) + '|' + parseFloat(y);
		}

		this.linkPoint = function(a, b, val, ndo) {
			val = typeof val !== 'undefined' ? val : 0;
			if (!this.pointExists(a.n, b.x, b.y)) {
				var link = { to: b, val: val };
				if (ndo) link.ndo = true // non-disabled only

				a.n.push(link);
			}
		}

		this.pointExists = function(list, x, y) {
			for (var i = 0; i < list.length; i++) {
				if ((list[i].x == parseFloat(x)) && (list[i].y == parseFloat(y))) {
					return list[i];
				}
			}
			return null;
		}

		this.distance = function(a, b) {
			return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
		}

		this.svg = function(tag) {
			return document.createElementNS('http://www.w3.org/2000/svg', tag);
		}
	}

});
