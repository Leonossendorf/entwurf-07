(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- Zollstock ---------- */
  // Ein Glied: 200 mm Skala, abgerundete Enden, Niete am Gelenk. 1 Einheit = 1 mm (leicht dicker gezeichnet).
  var GL = 200, GH = 22, END = 11;
  function zollstock(svg, opts) {
    var defs = el('defs', {}, svg);
    var lg = el('linearGradient', { id: 'zg', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    [['0', '#FFE170'], ['.18', '#F8CF2C'], ['.62', '#F1C114'], ['1', '#CF9C06']].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1] }, lg); });
    var rg = el('radialGradient', { id: 'nz', cx: '.36', cy: '.32', r: '.8' }, defs);
    [['0', '#FBF6E8'], ['.35', '#C9C2B2'], ['.75', '#7C7466'], ['1', '#4A443A']].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1] }, rg); });
    var f = el('filter', { id: 'wear', x: 0, y: 0, width: '100%', height: '100%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9 0.25', numOctaves: 2, seed: 5, result: 'n' }, f);
    el('feColorMatrix', { values: '0 0 0 0 0.45 0 0 0 0 0.33 0 0 0 0 0 0 0 0 0.5 -0.18' }, f);

    var x = 0, y = 0, pts = [], glieder = [];
    opts.angles.forEach(function (a, i) {
      var rad = a * Math.PI / 180;
      glieder.push({ x: x, y: y, a: a, i: i });
      x += Math.cos(rad) * GL; y += Math.sin(rad) * GL;
    });
    // Zeichenreihenfolge: abwechselnd oben/unten wie beim echten Zollstock
    var order = glieder.filter(function (g) { return g.i % 2 === 1; }).concat(glieder.filter(function (g) { return g.i % 2 === 0; }));
    var root = el('g', {}, svg);
    order.forEach(function (g) {
      var grp = el('g', { transform: 'translate(' + g.x.toFixed(2) + ' ' + g.y.toFixed(2) + ') rotate(' + g.a + ')' }, root);
      el('rect', { x: -END, y: -GH / 2, width: GL + 2 * END, height: GH, rx: END, fill: 'url(#zg)', stroke: '#A97F05', 'stroke-width': .6 }, grp);
      el('rect', { x: -END, y: -GH / 2, width: GL + 2 * END, height: GH, rx: END, filter: 'url(#wear)', opacity: .55 }, grp);
      el('rect', { x: -END + 3, y: -GH / 2 + .9, width: GL + 2 * END - 6, height: 1.2, rx: .6, fill: '#FFF4BF', opacity: .55 }, grp);
      var start = g.i * 20; // cm
      var tk = el('g', { stroke: '#1A1712', 'stroke-width': .38 }, grp);
      for (var mm = 0; mm <= GL; mm++) {
        if (mm < 4 || mm > GL - 4) continue;
        var len = mm % 10 === 0 ? 6.2 : (mm % 5 === 0 ? 4.4 : 2.6);
        el('line', { x1: mm, y1: -GH / 2 + .2, x2: mm, y2: -GH / 2 + len }, tk);
      }
      for (var cm = 1; cm < 20; cm++) {
        var n = start + cm, dez = n % 10 === 0;
        var t = el('text', { x: cm * 10, y: GH / 2 - 4.2, 'text-anchor': 'middle', 'font-size': dez ? 8.6 : 7.4, fill: dez ? '#C8321E' : '#1A1712', class: 'num' }, grp);
        t.textContent = n;
      }
      // Gelenkniete am Ende
      el('circle', { cx: GL, cy: 0, r: 4.4, fill: 'url(#nz)', stroke: '#5E574B', 'stroke-width': .4 }, grp);
      el('circle', { cx: GL, cy: 0, r: 1.1, fill: '#5E574B' }, grp);
      if (g.i === 0) { el('circle', { cx: 0, cy: 0, r: 3.2, fill: 'url(#nz)', stroke: '#5E574B', 'stroke-width': .4 }, grp); }
    });
    pts.push([0, 0], [x, y]);
    // Kreppband-Etiketten, Position als Abstand entlang des Zollstocks (mm)
    function at(s) {
      var i = Math.min(glieder.length - 1, Math.floor(s / GL)), g = glieder[i], r = g.a * Math.PI / 180, d = s - i * GL;
      return { x: g.x + Math.cos(r) * d, y: g.y + Math.sin(r) * d, a: g.a };
    }
    (opts.labels || []).forEach(function (l) {
      var p = at(l.s), w = l.w, h = 21;
      var a = el('a', { href: l.href, class: 'lbl', 'aria-label': l.text }, svg);
      var grp = el('g', { transform: 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') rotate(' + (p.a + (l.r || 0)) + ') translate(' + (-w / 2) + ' ' + (-h / 2 - .5) + ')' }, a);
      var d = 'M0 1.5 L2 0 L5 1.2 L8 .2 L' + (w - 6) + ' .4 L' + (w - 3) + ' 1.4 L' + w + ' .3 L' + (w - 1.2) + ' ' + (h / 2) + ' L' + w + ' ' + (h - .4) + ' L' + (w - 4) + ' ' + h + ' L' + (w - 7) + ' ' + (h - 1) + ' L7 ' + (h - .2) + ' L3.5 ' + (h - 1.2) + ' L0 ' + h + ' L1.4 ' + (h / 2) + ' Z';
      el('path', { d: d, class: 'tape-bg', fill: '#EFE5C9', opacity: .97, stroke: 'rgba(120,100,60,.25)', 'stroke-width': .4 }, grp);
      var t = el('text', { x: w / 2, y: h / 2 + 4.6, 'text-anchor': 'middle', 'font-size': 13.5 }, grp);
      t.textContent = l.text;
    });
    var minY = Math.min.apply(null, glieder.map(function (g) { return g.y; }).concat([y])) - 22;
    var maxY = Math.max.apply(null, glieder.map(function (g) { return g.y; }).concat([y])) + 22;
    svg.setAttribute('viewBox', [-16, minY.toFixed(1), (x + 32).toFixed(1), (maxY - minY).toFixed(1)].join(' '));
  }

  var hero = document.getElementById('hero-rule');
  if (hero) {
    zollstock(hero, {
      angles: [-1.6, 1.2, -.8, 1.4],
      labels: [
        { text: 'Küchen', href: '#arbeiten', s: 56, w: 74, r: 1.5 },
        { text: 'Badmöbel', href: '#arbeiten', s: 146, w: 86, r: -2 },
        { text: 'Küchendetails', href: '#details', s: 300, w: 124, r: 1 },
        { text: 'Über mich', href: '#ueber', s: 455, w: 92, r: -1.5 },
        { text: 'Anfrage', href: '#anfrage', s: 549, w: 78, r: 2 },
        { text: 'Kontakt', href: '#kontakt', s: 700, w: 80, r: -1 }
      ]
    });
    hero.querySelectorAll('a.lbl').forEach(function (a, i) {
      if (i === 1) a.addEventListener('click', function () { setFilter('b'); });
      if (i === 0) a.addEventListener('click', function () { setFilter('k'); });
    });
  }

  /* ---------- Galerie ---------- */
  var IMGS = {
    k: [[1,0],[2,0],[3,0],[4,0],[5,0],[6,1],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[15,1],[16,0],[17,0],[18,0],[19,0],[20,0],[21,1],[22,1],[23,2],[24,2],[25,2],[26,2],[27,2],[28,1],[29,0]],
    b: [[1,1],[2,0],[3,1],[4,1],[5,1],[6,0],[7,0],[8,0],[9,1],[10,0],[11,1],[12,1],[13,0]],
    s: [[1,0],[2,0],[3,0],[4,1],[5,0]],
    d: [[1,0],[2,0],[3,0],[4,0],[5,1],[6,0],[7,1],[8,0],[9,1],[10,1],[11,1],[12,0],[13,1],[14,0],[16,0],[17,0],[18,1],[19,0]]
  };
  var NAMES = { k: 'Küche', b: 'Badmöbel', s: 'Schlafzimmer', d: 'Küchendetail' };
  var grid = document.getElementById('grid'), more = document.getElementById('more');
  var current = 'k', showAll = false, list = [];
  function file(c, n) { return 'img/' + c + '-' + (n < 10 ? '0' : '') + n + '.jpg'; }
  function render() {
    list = IMGS[current];
    var max = showAll ? list.length : 12;
    grid.innerHTML = '';
    list.slice(0, max).forEach(function (it, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      if (it[1] === 1) b.className = 'tall';
      b.setAttribute('aria-label', NAMES[current] + ', Foto ' + (idx + 1) + ' von ' + list.length + ' groß ansehen');
      var im = document.createElement('img');
      im.src = file(current, it[0]); im.alt = NAMES[current] + ' der Tischlerei Vortkamp'; im.loading = 'lazy';
      im.width = it[1] === 1 ? 300 : 400; im.height = it[1] === 1 ? 400 : (it[1] === 2 ? 225 : 300);
      b.appendChild(im);
      b.addEventListener('click', function () { openLb(idx); });
      grid.appendChild(b);
    });
    more.hidden = showAll || list.length <= 12;
    more.textContent = 'Alle ' + list.length + ' Fotos zeigen';
  }
  function setFilter(f) {
    current = f; showAll = false;
    document.querySelectorAll('.tabs .tape').forEach(function (t) { t.setAttribute('aria-selected', t.dataset.f === f ? 'true' : 'false'); });
    render();
  }
  document.querySelectorAll('.tabs .tape').forEach(function (t) {
    t.querySelector('small').textContent = IMGS[t.dataset.f].length;
    t.addEventListener('click', function () { setFilter(t.dataset.f); });
  });
  more.addEventListener('click', function () { showAll = true; render(); });
  document.querySelectorAll('[data-jump]').forEach(function (a) { a.addEventListener('click', function () { setFilter(a.dataset.jump); }); });
  render();

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lb'), lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap'), lbIdx = 0, lastFocus;
  function showLb() {
    var it = list[lbIdx];
    lbImg.src = file(current, it[0]); lbImg.alt = NAMES[current] + ', Foto ' + (lbIdx + 1);
    lbCap.textContent = NAMES[current] + ' · Foto ' + (lbIdx + 1) + ' von ' + list.length;
  }
  function openLb(i) { lastFocus = document.activeElement; lbIdx = i; showLb(); lb.hidden = false; lb.querySelector('.lb-x').focus(); }
  function closeLb() { lb.hidden = true; if (lastFocus) lastFocus.focus(); }
  lb.querySelector('.lb-x').addEventListener('click', closeLb);
  lb.querySelector('.lb-prev').addEventListener('click', function () { lbIdx = (lbIdx - 1 + list.length) % list.length; showLb(); });
  lb.querySelector('.lb-next').addEventListener('click', function () { lbIdx = (lbIdx + 1) % list.length; showLb(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') lb.querySelector('.lb-prev').click();
    if (e.key === 'ArrowRight') lb.querySelector('.lb-next').click();
  });

  /* ---------- Anfrage mit Skizze ---------- */
  var SHAPES = {
    kueche: [
      { id: 'zeile', name: 'Zeile', icon: 'M8 10H92', dims: [['A', 'Wand', 300]] },
      { id: 'l', name: 'L-Form', icon: 'M8 10H92M8 10V72', dims: [['A', 'Wand oben', 300], ['B', 'Wand links', 240]] },
      { id: 'u', name: 'U-Form', icon: 'M8 72V10H92V72', dims: [['A', 'Wand oben', 300], ['B', 'Wand links', 220], ['C', 'Wand rechts', 200]] },
      { id: 'insel', name: 'Mit Insel', icon: 'M8 10H92M30 52H70', dims: [['A', 'Wand', 320], ['B', 'Insel', 180]] }
    ],
    bad: [
      { id: 'wt', name: 'Waschtisch', icon: 'M20 12H80', dims: [['A', 'Breite', 100]] },
      { id: 'dwt', name: 'Doppel-Waschtisch', icon: 'M10 12H90', dims: [['A', 'Breite', 160]] },
      { id: 'wth', name: 'Mit Hochschrank', icon: 'M10 12H66M74 12V40', dims: [['A', 'Waschtisch', 120], ['B', 'Hochschrank', 40]] }
    ],
    schrank: [
      { id: 'wand', name: 'Gerade Wand', icon: 'M14 72V12H86V72', dims: [['A', 'Breite', 240], ['B', 'Höhe', 240]] },
      { id: 'nische', name: 'Nische', icon: 'M8 12V72M92 12V72M20 72V20H80V72', dims: [['A', 'Breite', 160], ['B', 'Höhe', 240]] },
      { id: 'schraege', name: 'Dachschräge', icon: 'M10 72V44L50 12H90V72', dims: [['A', 'Breite', 300], ['B', 'Höhe', 240], ['C', 'Kniestock', 100]] }
    ]
  };
  var WISHES = {
    kueche: ['Ecklösung (Karussell, Auszug)', 'Mülltrennung', 'Backofen auf Arbeitshöhe', 'Insel oder Theke', 'Licht unter den Oberschränken'],
    bad: ['Spiegelschrank mit Licht', 'Viele Schubladen', 'Hochschrank', 'Holzoptik'],
    schrank: ['Kleiderschrank', 'Kinderzimmer', 'Regal oder Wohnwand', 'Theke', 'Schreibtisch']
  };
  var RAUM_NAME = { kueche: 'Küche', bad: 'Badmöbel', schrank: 'Schrank / Wohn-Idee' };
  var form = document.getElementById('form'), shapesBox = document.getElementById('shapes'), massBox = document.getElementById('mass'), wishBox = document.getElementById('wishes'), plan = document.getElementById('plan'), planCap = document.getElementById('plan-cap');
  var state = { raum: 'kueche', shape: 'l', vals: {} };

  function shapeObj() { return SHAPES[state.raum].filter(function (s) { return s.id === state.shape; })[0]; }
  function buildShapes() {
    shapesBox.innerHTML = '';
    shapesBox.style.gridTemplateColumns = window.innerWidth <= 640 ? '' : 'repeat(' + SHAPES[state.raum].length + ', 1fr)';
    SHAPES[state.raum].forEach(function (s) {
      var l = document.createElement('label');
      l.innerHTML = '<input type="radio" name="form" value="' + s.id + '"' + (s.id === state.shape ? ' checked' : '') + '><span class="sh"><svg viewBox="0 0 100 82" aria-hidden="true"><path d="' + s.icon + '"/></svg>' + s.name + '</span>';
      l.querySelector('input').addEventListener('change', function () { state.shape = s.id; state.vals = {}; buildMass(); draw(); });
      shapesBox.appendChild(l);
    });
  }
  function buildMass() {
    massBox.innerHTML = '';
    shapeObj().dims.forEach(function (d) {
      var l = document.createElement('label');
      l.innerHTML = '<span>' + d[0] + ' · ' + d[1] + '</span><span class="in"><input type="number" inputmode="numeric" min="20" max="1200" step="1" placeholder="' + d[2] + '" data-k="' + d[0] + '" aria-label="' + d[1] + ' in Zentimetern"><em>cm</em></span>';
      var inp = l.querySelector('input');
      inp.value = state.vals[d[0]] || '';
      inp.addEventListener('input', function () { var v = parseInt(inp.value, 10); state.vals[d[0]] = v >= 20 && v <= 1200 ? v : ''; draw(); });
      massBox.appendChild(l);
    });
  }
  function buildWishes() {
    wishBox.innerHTML = '';
    WISHES[state.raum].forEach(function (w) {
      var l = document.createElement('label');
      l.innerHTML = '<input type="checkbox" name="wunsch" value="' + w + '"><span>' + w + '</span>';
      wishBox.appendChild(l);
    });
  }
  form.querySelectorAll('input[name=raum]').forEach(function (r) {
    r.addEventListener('change', function () {
      state.raum = r.value; state.shape = SHAPES[r.value][r.value === 'kueche' ? 1 : 0].id; state.vals = {};
      buildShapes(); buildMass(); buildWishes(); draw();
    });
  });

  function val(k) { var d = shapeObj().dims.filter(function (x) { return x[0] === k; })[0]; return { v: state.vals[k] || d[2], known: !!state.vals[k] }; }
  function dim(g, x1, y1, x2, y2, label, side, known) {
    // Maßkette mit Schrägstrichen, Text in Bleistiftschrift
    var dg = el('g', { class: 'dim' + (known ? '' : ' fade') }, g);
    el('line', { x1: x1, y1: y1, x2: x2, y2: y2 }, dg);
    var vert = x1 === x2;
    [[x1, y1], [x2, y2]].forEach(function (p) {
      el('line', { class: 'tick', x1: p[0] - 4, y1: p[1] + 4, x2: p[0] + 4, y2: p[1] - 4 }, dg);
      if (vert) el('line', { x1: p[0] - 7, y1: p[1], x2: p[0] + 7, y2: p[1] }, dg);
      else el('line', { x1: p[0], y1: p[1] - 7, x2: p[0], y2: p[1] + 7 }, dg);
    });
    var tx = (x1 + x2) / 2, ty = (y1 + y2) / 2;
    var t = el('text', { 'text-anchor': 'middle' }, dg);
    if (vert) { t.setAttribute('transform', 'translate(' + (tx + (side || -1) * 9) + ' ' + ty + ') rotate(-90)'); }
    else { t.setAttribute('x', tx); t.setAttribute('y', ty + (side || -1) * 8 + (side === 1 ? 10 : 0)); }
    t.textContent = label;
  }
  function lab(v, k) { return k + ' = ' + (v.known ? v.v : '?'); }

  function draw(target) {
    var svg = target || plan;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var g = el('g', {}, svg), s = shapeObj(), r = state.raum;
    var W = 400, H = 320, pad = 58;
    if (r === 'kueche') {
      planCap.textContent = 'Draufsicht · Arbeitsplatte 60 cm tief';
      var A = val('A'), B = s.dims[1] ? val(s.dims[1][0]) : null, C = s.dims[2] ? val('C') : null;
      var spanX = A.v, spanY = 60;
      if (s.id === 'l') spanY = B.v;
      if (s.id === 'u') spanY = Math.max(B.v, C.v);
      if (s.id === 'insel') spanY = 60 + 110 + 90;
      var sc = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
      var ox = (W - spanX * sc) / 2, oy = s.id === 'zeile' ? 120 : pad + 8, d = 60 * sc;
      // Wände
      el('rect', { class: 'wall', x: ox - 6, y: oy - 6, width: spanX * sc + 12, height: 6 }, g);
      if (s.id === 'l' || s.id === 'u') el('rect', { class: 'wall', x: ox - 6, y: oy - 6, width: 6, height: B.v * sc + 6 }, g);
      if (s.id === 'u') el('rect', { class: 'wall', x: ox + spanX * sc, y: oy - 6, width: 6, height: C.v * sc + 6 }, g);
      // Arbeitsplatten
      el('rect', { class: 'counter', x: ox, y: oy, width: A.v * sc, height: d }, g);
      if (s.id === 'l' || s.id === 'u') el('rect', { class: 'counter', x: ox, y: oy + d, width: d, height: B.v * sc - d }, g);
      if (s.id === 'u') el('rect', { class: 'counter', x: ox + A.v * sc - d, y: oy + d, width: d, height: C.v * sc - d }, g);
      // Spüle und Kochfeld als Bleistiftandeutung
      var sx = ox + A.v * sc * .62, sy = oy + d * .22;
      el('rect', { class: 'detail', x: sx, y: sy, width: Math.min(50 * sc, 46), height: d * .56, rx: 4 }, g);
      var hx = ox + A.v * sc * (s.id === 'zeile' || s.id === 'insel' ? .2 : .3), hy = oy + d * .5, rr = Math.max(4, d * .12);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { el('circle', { class: 'detail', cx: hx + q[0] * rr * 1.5, cy: hy + q[1] * rr * 1.1, r: rr }, g); });
      dim(g, ox, oy - 22, ox + A.v * sc, oy - 22, lab(A, 'A'), -1, A.known);
      if (s.id === 'l' || s.id === 'u') dim(g, ox - 22, oy, ox - 22, oy + B.v * sc, lab(B, 'B'), -1, B.known);
      if (s.id === 'u') dim(g, ox + A.v * sc + 22, oy, ox + A.v * sc + 22, oy + C.v * sc, lab(C, 'C'), 1, C.known);
      if (s.id === 'insel') {
        var iw = Math.min(B.v, A.v) * sc, ix = ox + (A.v * sc - iw) / 2, iy = oy + d + 110 * sc;
        el('rect', { class: 'counter wood', x: ix, y: iy, width: iw, height: 90 * sc }, g);
        dim(g, ix, iy + 90 * sc + 22, ix + iw, iy + 90 * sc + 22, lab(B, 'B'), 1, B.known);
        var t = el('text', { class: 'lbl', x: ix + iw / 2, y: iy + 90 * sc / 2 + 5, 'text-anchor': 'middle' }, g); t.textContent = 'Insel';
      }
    } else if (r === 'bad') {
      planCap.textContent = 'Draufsicht · Waschtisch 50 cm tief';
      var A2 = val('A'), B2 = s.id === 'wth' ? val('B') : null;
      var tot = A2.v + (B2 ? B2.v + 10 : 0);
      var sc2 = Math.min((W - 2 * pad) / tot, 3), ox2 = (W - tot * sc2) / 2, oy2 = 120, d2 = 50 * sc2;
      el('rect', { class: 'wall', x: ox2 - 10, y: oy2 - 6, width: tot * sc2 + 20, height: 6 }, g);
      el('rect', { class: 'counter', x: ox2, y: oy2, width: A2.v * sc2, height: d2 }, g);
      var n = s.id === 'dwt' ? 2 : 1;
      for (var i = 0; i < n; i++) {
        var cx = ox2 + A2.v * sc2 * (n === 1 ? .5 : (i ? .73 : .27));
        el('ellipse', { class: 'detail', cx: cx, cy: oy2 + d2 * .5, rx: Math.min(22 * sc2, 34), ry: d2 * .3 }, g);
      }
      dim(g, ox2, oy2 - 22, ox2 + A2.v * sc2, oy2 - 22, lab(A2, 'A'), -1, A2.known);
      if (B2) {
        var hx2 = ox2 + (A2.v + 10) * sc2;
        el('rect', { class: 'counter wood', x: hx2, y: oy2, width: B2.v * sc2, height: 40 * sc2 }, g);
        dim(g, hx2, oy2 + 40 * sc2 + 22, hx2 + B2.v * sc2, oy2 + 40 * sc2 + 22, lab(B2, 'B'), 1, B2.known);
      }
    } else {
      planCap.textContent = 'Ansicht von vorn';
      var A3 = val('A'), B3 = val('B'), C3 = s.id === 'schraege' ? val('C') : null;
      var sc3 = Math.min((W - 2 * pad) / A3.v, (H - 2 * pad) / B3.v), w3 = A3.v * sc3, h3 = B3.v * sc3, ox3 = (W - w3) / 2 + 8, oy3 = (H - h3) / 2;
      el('line', { x1: ox3 - 20, y1: oy3 + h3, x2: ox3 + w3 + 20, y2: oy3 + h3, stroke: '#3E3B36', 'stroke-width': 2 }, g);
      var outline;
      if (s.id === 'schraege') {
        var kh = Math.min(C3.v, B3.v) * sc3, kx = ox3 + w3 * .5;
        outline = 'M' + ox3 + ' ' + (oy3 + h3) + 'V' + (oy3 + h3 - kh) + 'L' + kx + ' ' + oy3 + 'H' + (ox3 + w3) + 'V' + (oy3 + h3) + 'Z';
        el('path', { class: 'room', d: 'M' + (ox3 - 14) + ' ' + (oy3 + h3 - kh + 10) + 'L' + (kx - 4) + ' ' + (oy3 - 14) }, g);
        dim(g, ox3 - 22, oy3 + h3 - kh, ox3 - 22, oy3 + h3, lab(C3, 'C'), -1, C3.known);
      } else {
        outline = 'M' + ox3 + ' ' + (oy3 + h3) + 'V' + oy3 + 'H' + (ox3 + w3) + 'V' + (oy3 + h3) + 'Z';
        if (s.id === 'nische') { el('rect', { class: 'wall', x: ox3 - 10, y: oy3 - 10, width: 10, height: h3 + 10 }, g); el('rect', { class: 'wall', x: ox3 + w3, y: oy3 - 10, width: 10, height: h3 + 10 }, g); }
      }
      el('path', { class: 'counter wood', d: outline }, g);
      var cp = el('clipPath', { id: 'schrank-clip' }, el('defs', {}, g));
      el('path', { d: outline }, cp);
      var fugen = el('g', { 'clip-path': 'url(#schrank-clip)' }, g);
      var doors = Math.max(1, Math.round(A3.v / 55));
      for (var j = 1; j < doors; j++) el('line', { class: 'detail', x1: ox3 + w3 * j / doors, y1: oy3 + 4, x2: ox3 + w3 * j / doors, y2: oy3 + h3 - 2 }, fugen);
      dim(g, ox3, oy3 + h3 + 24, ox3 + w3, oy3 + h3 + 24, lab(A3, 'A'), 1, A3.known);
      dim(g, ox3 + w3 + 22, oy3, ox3 + w3 + 22, oy3 + h3, lab(B3, 'B'), 1, B3.known);
    }
    return svg;
  }
  buildShapes(); buildMass(); buildWishes(); draw();
  window.addEventListener('resize', function () { shapesBox.style.gridTemplateColumns = window.innerWidth <= 640 ? '' : 'repeat(' + SHAPES[state.raum].length + ', 1fr)'; });

  var sent = document.getElementById('sent');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'tel'].forEach(function (n) { var i = form.elements[n]; var bad = !i.value.trim(); i.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) return;
    var s = shapeObj();
    var masse = s.dims.map(function (d) { return d[1] + ' ' + (state.vals[d[0]] ? state.vals[d[0]] + ' cm' : '?'); }).join(', ');
    var w = [].slice.call(form.querySelectorAll('input[name=wunsch]:checked')).map(function (c) { return c.value; }).join(', ') || '–';
    var rows = [['Was', RAUM_NAME[state.raum] + ', ' + s.name], ['Maße', masse], ['Wichtig', w], ['Name', form.elements.name.value], ['Telefon', form.elements.tel.value], ['Ort', form.elements.ort.value || '–'], ['Wann', form.elements.wann.value], ['Nachricht', form.elements.text.value || '–']];
    var dl = document.getElementById('sent-list'); dl.innerHTML = '';
    rows.forEach(function (r) { var dt = document.createElement('dt'); dt.textContent = r[0]; var dd = document.createElement('dd'); dd.textContent = r[1]; dl.appendChild(dt); dl.appendChild(dd); });
    var sp = document.getElementById('sent-plan'); sp.innerHTML = '';
    var clone = plan.cloneNode(true); clone.removeAttribute('id'); sp.appendChild(clone);
    form.hidden = true; sent.hidden = false; sent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('again').addEventListener('click', function () { sent.hidden = true; form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
})();
