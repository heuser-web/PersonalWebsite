/**
 * HEUSER — THE DRIVE: ENGINE
 *
 * Scroll is the gas pedal. This file turns scroll position into a place on the
 * road, a camera move and a set of things the visitor can do; drive-world.js
 * owns the objects.
 *
 * Two modes, one world:
 *   home     .rd exists: a pinned stage with nine scenes
 *   ambient  every other page: the same road runs behind the content
 *
 * Hard rules:
 *   - real text is in the HTML; if WebGL never starts, nothing is lost
 *   - reduced motion gets still frames, redrawn only when the scene changes
 *   - native scrolling is never hijacked, so nobody can be trapped
 *   - sound only ever starts from a press
 */
(function () {
  'use strict';

  var root = document.documentElement, body = document.body;
  var mm = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduced = mm('(prefers-reduced-motion: reduce)');
  var coarse = mm('(pointer: coarse)');
  var stage = document.querySelector('.rd__stage');
  var rd = document.querySelector('.rd');
  var ambient = !rd;
  if (!body.classList.contains('rd-on')) return;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sm(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ------------------------------------------------------------ the pick */
  var ACCENT = { gomojo: '#FF6FAE', lifeswitch: '#E9CB86', goinvest: '#6BE79A' }, pick = null;
  try { pick = window.sessionStorage.getItem('rh-pick'); } catch (e) {}
  if (!ACCENT[pick]) pick = null;
  function paintPick() {
    if (pick) root.style.setProperty('--rd-accent', ACCENT[pick]); else root.style.removeProperty('--rd-accent');
    $$('[data-pick]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pick') === pick ? 'true' : 'false'); });
    body.classList.toggle('rd-picked', !!pick);
  }
  /* Pressing the lit sign again turns it off. */
  function setPick(id) { pick = pick === id ? null : id; try { window.sessionStorage.setItem('rh-pick', pick || ''); } catch (e) {} paintPick(); if (kick) kick(); }
  var kick = null;
  paintPick();
  $$('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { setPick(b.getAttribute('data-pick')); }); });

  /* ------------------------------------------------------------ reveals
     Text moves even where WebGL does not. Two-way: it plays again on the way
     back up. */
  (function () {
    var els = $$('.rd-card,.rd-inset,.rd-door');
    if (ambient) els = els.concat($$('.rh-article > *, .rh-gallery__item, .rh-pagehead .rh-edge > *'));
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('rd-in'); }); return; }
    els.forEach(function (e) { e.classList.add('rd-rv'); });
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('rd-in', e.isIntersecting); }); }, { rootMargin: '-4% 0px -7% 0px', threshold: 0.02 });
    els.forEach(function (e) { io.observe(e); });
  }());

  /* --------------------------------------------------------------- stops
     The rail and Skip land where a stop has something to read, not at the bare
     start of its stretch of road. replaceState, so ten stops are not ten presses
     of Back. Runs without WebGL too. */
  var skipA = $('.rd-skip');
  function stopY(id) {
    var el = document.getElementById(id); if (!el) return null;
    if (id === 'rd-vegas') return 0;
    var flat = body.classList.contains('rd-nogl'), vh = window.innerHeight, y = window.pageYOffset, r = el.getBoundingClientRect();
    var c = id === 'rd-doors' || flat ? null : $('.rd-pin,.rd-card', el);
    if (!c) return r.top + y - (flat ? 90 : 0);
    if (c.classList.contains('rd-pin')) {
      if (c.offsetHeight <= vh + 2) return r.top + y + (r.height - vh) * 0.5;
      c = $('.rd-signs__head', c) || c;
    }
    var cr = c.getBoundingClientRect(); return cr.top + y - Math.max(96, (vh - cr.height) * 0.55);
  }
  function goStop(id, jump) {
    var t = stopY(id); if (t === null) return false;
    if (jump) root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: Math.max(0, Math.round(t)), behavior: reduced || jump ? 'auto' : 'smooth' });
    if (jump) window.setTimeout(function () { root.style.scrollBehavior = ''; }, 60);
    return true;
  }
  if (rd) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.rd-rail a, .rd-skip'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var id = a.getAttribute('href').slice(1); if (!goStop(id)) return;
      e.preventDefault(); try { window.history.replaceState(null, '', id === 'rd-vegas' ? window.location.pathname + window.location.search : '#' + id); } catch (x) {}
    });
    /* A link shared with a stop in it (index#rd-sae) opens on that stop. */
    if (/^#rd-\w+$/.test(window.location.hash)) window.addEventListener('load', function () { var n = ''; try { n = window.performance.getEntriesByType('navigation')[0].type; } catch (x) {} if (n === 'navigate') goStop(window.location.hash.slice(1), true); });
  }

  /* ---------------------------------------------------------------- bass
     A synthesised 808 pattern. No samples, so no licensing. */
  var BPS = 1.2;                         // beats per second (72 bpm)
  var Bass = (function () {
    var ctx = null, out = null, t0 = 0, next = 0, timer = 0, on = false, held = false, vol = 0;
    function init() {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC(); out = ctx.createGain(); out.gain.value = 0;
      var cmp = ctx.createDynamicsCompressor(); cmp.threshold.value = -14; cmp.ratio.value = 5; out.connect(cmp); cmp.connect(ctx.destination); return true;
    }
    function kickAt(t, f, len, g) {
      var o = ctx.createOscillator(), a = ctx.createGain(), sh = ctx.createWaveShaper(), c = new Float32Array(257);
      for (var i = 0; i < 257; i++) { var x = i / 128 - 1; c[i] = Math.tanh(x * 2.2); } sh.curve = c;
      o.type = 'sine'; o.frequency.setValueAtTime(f * 3.2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07);
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.006); a.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(sh); sh.connect(a); a.connect(out); o.start(t); o.stop(t + len + 0.05);
    }
    function hat(t, g) {
      var n = Math.floor(ctx.sampleRate * 0.05), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      var s = ctx.createBufferSource(), h = ctx.createBiquadFilter(), a = ctx.createGain(); s.buffer = b; h.type = 'highpass'; h.frequency.value = 7000; a.gain.value = g; s.connect(h); h.connect(a); a.connect(out); s.start(t);
    }
    var LINE = [43.65, 43.65, 38.89, 51.91];
    function sched() {
      if (!ctx) return;
      while (next < ctx.currentTime + 0.25) {
        var n = Math.round((next - t0) * BPS * 4), bar = Math.floor(n / 16) % 4, st = n % 16, f = LINE[bar];
        if (st === 0 || st === 4 || st === 8 || st === 12) kickAt(next, f, st === 0 ? 0.95 : 0.62, st === 0 ? 1 : 0.8);
        if (st === 11) kickAt(next, f * 1.335, 0.3, 0.5);
        if (st % 2 === 0) hat(next, st % 4 === 2 ? 0.16 : 0.07); if (bar === 3 && st > 12) hat(next, 0.12);
        next += 1 / (BPS * 4);
      }
    }
    function apply() {
      var want = (on ? 0.5 : 0) + (held ? 0.45 : 0); if (!ctx) { if (!want || !init()) return; t0 = ctx.currentTime + 0.05; next = t0; }
      if (want && ctx.state === 'suspended') ctx.resume();
      if (want && !timer) { t0 = ctx.currentTime + 0.05; next = t0; timer = window.setInterval(sched, 60); sched(); }
      out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(want, ctx.currentTime, want ? 0.04 : 0.14); vol = want;
      if (!want && timer) { window.setTimeout(function () { if (!vol && timer) { window.clearInterval(timer); timer = 0; } }, 600); }
    }
    return {
      toggle: function () { on = !on; apply(); return on; },
      hold: function (v) { if (held === v) return; held = v; apply(); },
      phase: function (t) { return ctx && timer ? Math.max(0, ctx.currentTime - t0) * BPS : t * BPS; },
      live: function () { return vol > 0; },
      hush: function (h) { if (ctx) { if (h) ctx.suspend(); else if (vol) ctx.resume(); } }
    };
  }());
  var snd = $('.rd-sound');
  if (snd) snd.addEventListener('click', function () { var v = Bass.toggle(); snd.setAttribute('aria-pressed', v ? 'true' : 'false'); var l = $('.rd-sound__t', snd); if (l) l.textContent = v ? 'Bass on' : 'Bass off'; });
  document.addEventListener('visibilitychange', function () { Bass.hush(document.hidden); });

  /* ------------------------------------------------------------ WebGL? */
  function fail(why) { body.classList.add('rd-nogl'); if (window.console && why) console.warn('[drive] falling back:', why); }
  if (!window.THREE || !window.RHWorld) { fail('library missing'); return; }
  var T = window.THREE; T.ColorManagement.enabled = false;

  /* scroll distance -> road distance: [g, s], eased so the car slows at stops */
  var GS = [[0, 0], [0.36, 5], [1, 182], [2, 424], [2.3, 540], [2.7, 558], [3, 650], [3.34, 838], [3.76, 858], [3.9, 902], [3.93, 940], [3.966, 946], [3.972, 958], [4, 1046], [4.42, 1222], [4.56, 1240], [4.9, 1250], [5, 1290], [5.25, 1526], [5.75, 1540], [6, 1660], [6.26, 1866], [6.74, 1878], [7, 1960], [7.28, 2080], [7.5, 2190], [7.57, 2196], [9, 2196]];
  var GM = (function () { // monotone tangents
    var n = GS.length, d = [], m = [], i; for (i = 0; i < n - 1; i++) d.push((GS[i + 1][1] - GS[i][1]) / (GS[i + 1][0] - GS[i][0]));
    m[0] = d[0]; m[n - 1] = d[n - 2]; for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]); return m;
  }());
  function gToS(g) {
    var i = 0; while (i < GS.length - 2 && GS[i + 1][0] < g) i++;
    var a = GS[i], b = GS[i + 1], h = b[0] - a[0], t = clamp((g - a[0]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * h * GM[i] + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * h * GM[i + 1];
  }

  /* camera: [g, pos(right,up,back), look, fov, shiftX, anchor?]  no anchor = rides with the car */
  var KF = [
    [0, [3.4, 0.95, -6.9], [-0.2, 2.0, 0], 44, 0.18], [0.38, [5.9, 0.85, -0.7], [-0.6, 0.86, 0.1], 40, 0.06], [0.72, [3.2, 1.5, 6], [0, 1, -4], 46, 0.05],
    [1, [0.2, 2.3, 8.2], [-0.4, 1.3, -10], 50, 0], [1.45, [-1.5, 3.3, 9.5], [-1.4, 1.7, -14], 52, -0.1], [1.9, [0, 2.2, 8], [0, 1.4, -12], 50, 0],
    [2.12, [1.2, 2.6, 8.5], [5, 0.9, -8], 50, 0], [2.3, [2.6, 9.2, 0.6], [15.6, -0.6, 0], 52, 0.13, 'wash'], [2.68, [1.9, 9.8, -0.8], [15.4, -0.6, 0], 52, 0.13, 'wash'], [2.86, [1, 2.4, 8.5], [0, 1.4, -10], 50, 0],
    [3.08, [-0.8, 2.6, 10], [-1.8, 4.2, -26], 54, 0], [3.4, [-2.1, 2.2, 10], [-2.1, 4.2, -30], 52, 0], [3.74, [-2.1, 2.4, 9], [-2.1, 4.4, -30], 50, 0], [3.9, [-1, 2.4, 9], [-1, 2.8, -20], 50, 0],
    [3.912, [0.6, 2.8, 9], [5, 4.2, -22], 50, 0.04], [3.93, [1.8, 2.4, 20], [14.4, 7.7, 0], 48, 0.17, 'vault'], [3.953, [6.0, 2.0, 18.5], [15.2, 7.8, 0], 48, 0.17, 'vault'], [3.967, [10.4, 3.6, 19.5], [15.9, 7.9, 0], 50, 0.17, 'vault'],
    [3.974, [0, 2.7, 9], [0, 2.6, -18], 54, -0.14], [3.988, [-0.6, 2.4, 9], [-0.6, 2.8, -18], 54, -0.14], [4, [0, 2.4, 8.6], [0, 1.6, -12], 50, -0.06],
    [4.1, [4.2, 1.1, 2.6], [-1, 0.95, -3], 44, -0.12], [4.36, [2.8, 1.7, 6.4], [0, 1, -4], 46, -0.12], [4.56, [0.35, 1.2, 5.2], [0, 0.86, 1.2], 36, -0.18], [4.88, [-0.5, 1.12, 4.7], [0, 0.84, 1.2], 35, -0.18], [5.02, [0, 2.6, 9], [0, 1.6, -12], 50, 0],
    [5.28, [9.6, 1.5, 4.8], [16, 8.2, -0.4], 62, 0.1, 'net'], [5.74, [13, 1.6, 3.4], [16.4, 8.6, -0.6], 62, 0.1, 'net'], [5.93, [0, 2.6, 9], [0, 1.5, -12], 50, 0],
    [6.26, [2.6, 4.6, 5.2], [21, 3.0, -0.4], 50, -0.13, 'sae'], [6.74, [3.8, 5.6, -4.6], [21, 3.0, 0.2], 48, -0.13, 'sae'], [6.92, [-0.4, 2.4, 9], [-1.2, 2.6, -14], 50, 0],
    [7.1, [-2.15, 1.7, 9.5], [-2.15, 6, -28], 54, 0.06], [7.4, [-2, 2.3, 10], [-1.6, 3.4, -14], 52, 0.08], [7.6, [-4.4, 1.35, -6.4], [0.1, 1.95, 1], 48, 0.15], [7.88, [-5, 1.5, -7.6], [0, 2.5, 1.5], 48, 0.15],
    [8.12, [-3, 6, -24], [-2.15, 10, 0], 50, 0], [8.42, [-2.15, 12, -48], [-2.15, 21, 8], 50, 0], [9, [-2.15, 14, -53], [-2.15, 22.5, 8], 50, 0]
  ];

  var SC = [
    { id: 'vegas', hold: 'Hold to start', pose: 0.04 }, { id: 'home', pose: 0.5, right: 1 }, { id: 'jobs', hold: 'Hold to wash', pose: 0.6 }, { id: 'signs', pose: 0.5 }, { id: 'lifeswitch', hold: 'Hold to turn two keys', pose: 0.8 }, { id: 'builds', pose: 0.45, right: 1 }, { id: 'bass', hold: 'Hold to bump', pose: 0.7, right: 1 },
    { id: 'treenet', hold: 'Hold to bounce', pose: 0.6 }, { id: 'sae', hold: 'Hold to toss', pose: 0.5, right: 1 }, { id: 'reno', hold: 'Hand over the keys', pose: 0.68 }, { id: 'finale', pose: 0.8 }
  ];

  /* Each section of the page owns a stretch of story. The two stops added between
     the signs and the desert share a short stretch, so nothing after them moved. */
  var SG = [[0, 1], [1, 2], [2, 3], [3, 3.9], [3.9, 3.97], [3.97, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]];
  function idxOf(g) { var i = 0; while (i < SG.length - 1 && SG[i + 1][0] <= g + 0.00001) i++; return i; }

  var canvas, renderer, camera, world, W = 1, Hh = 1, dpr = 1, maxDpr, narrow;
  var lite = coarse || Math.min(window.innerWidth, window.innerHeight) < 560 || (navigator.hardwareConcurrency || 8) < 4;
  var scenes = $$('.rd-scene'), tops = [], heights = [], rdTop = 0, rdH = 1;
  var S = { t: 0, dt: 0.016, g: 0, s: 0, beat: 0, beatPhase: 0, bump: 0.25, hold: false, holdStart: false, ignition: 0, sceneId: ambient ? '' : 'vegas', pick: pick, hoverPick: null, ray: null, tilt: { x: 0, y: 0 }, keys: 0, vault: 0, speed: 0, hatch: 0, rev: 0, flare: 0, brake: 0, ambient: ambient, camS: 0 };
  var gTarget = 0, started = false, holdAmt = 0, floodHold = 0;

  function boot() {
    canvas = document.createElement('canvas'); canvas.className = 'rd-canvas'; canvas.setAttribute('aria-hidden', 'true');
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !lite, powerPreference: 'high-performance', alpha: false, stencil: false });
    } catch (e) { fail(e && e.message); return; }
    renderer.outputColorSpace = T.LinearSRGBColorSpace; renderer.setClearColor(0x050912, 1); renderer.info.autoReset = true;
    if (stage) stage.insertBefore(canvas, stage.firstChild); else { canvas.classList.add('rd-canvas--fixed'); body.insertBefore(canvas, body.firstChild); }
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); cancelAnimationFrame(raf); fail('context lost'); });
    camera = new T.PerspectiveCamera(50, 1, 0.1, 1400);
    narrow = window.innerWidth / window.innerHeight < 0.8;
    try { world = window.RHWorld(T, { lite: lite, narrow: narrow, plates: window.location.protocol === 'file:' ? '' : body.getAttribute('data-rd-img'),   /* browsers refuse file:// textures */
      upload: function (t) { renderer.initTexture(t); }, onplate: function () { if (kick) kick(); } }); } catch (e) { fail(e && (e.stack || e.message)); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); return; }
    world.picks.list.forEach(function (p) { p.hit.material.visible = false; });
    maxDpr = Math.min(window.devicePixelRatio || 1, ambient ? 1.25 : lite ? 1.5 : 1.75); dpr = maxDpr;
    body.classList.add('rd-gl');
    if (!lite) { try { post = Post(!ambient); } catch (e) { post = null; } }
    measure(); resize(); bind();
    gTarget = readG(); S.g = gTarget; S.s = gToS(S.g);
    if (S.g > 0.2 || ambient) started = true;
    if (reduced) { still(); window.addEventListener('scroll', function () { window.requestAnimationFrame(still); }, { passive: true }); return; }
    last = performance.now(); raf = window.requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = window.requestAnimationFrame(loop); } });
  }

  /* --------------------------------------------------------------- light
     Render to a buffer, then let what is bright glow and what is fast smear.
     Desktop home page only, and the first thing dropped if frames run long. */
  var VQ = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  function Post(withMirror) {
    var ext = renderer.extensions; if (!T.WebGLRenderTarget || !(ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'))) return null;
    var HALF = 1016, o = { type: HALF, depthBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter };
    function rt(x) { var p = {}; for (var k in o) p[k] = o[k]; for (k in x || {}) p[k] = x[k]; var t = new T.WebGLRenderTarget(4, 4, p); t.texture.colorSpace = T.NoColorSpace; return t; }
    var full = rt({ depthBuffer: true, samples: 4 }), a = rt(), b = rt(), c = rt(), d = rt(), e = rt(), f = rt(), k1 = rt(), k2 = rt(), mir = withMirror ? rt({ depthBuffer: true }) : null;
    var sc = new T.Scene(), quad = new T.Mesh(new T.PlaneGeometry(2, 2)); quad.frustumCulled = false; sc.add(quad);
    function pass(u, fs) { return new T.ShaderMaterial({ uniforms: u, vertexShader: VQ, fragmentShader: 'varying vec2 vUv; ' + fs, depthTest: false, depthWrite: false }); }
    var bright = pass({ t: { value: null }, px: { value: new T.Vector2() } }, [
      'uniform sampler2D t; uniform vec2 px; vec3 pk(vec2 o){ vec3 k=clamp(texture2D(t,vUv+o*px).rgb,0.0,2.2); if(!(k.r>=0.0)) k=vec3(0.0); float m=max(k.r,max(k.g,k.b)); return k*smoothstep(0.72,1.25,m); }',
      'void main(){ gl_FragColor=vec4((pk(vec2(-1.,-1.))+pk(vec2(1.,-1.))+pk(vec2(-1.,1.))+pk(vec2(1.,1.)))*0.25,1.0); }'].join('\n'));
    var blur = pass({ t: { value: null }, dir: { value: new T.Vector2() } }, [
      'uniform sampler2D t; uniform vec2 dir;',
      'void main(){ vec3 s=texture2D(t,vUv).rgb*0.1964825; s+=(texture2D(t,vUv+dir*1.4117647).rgb+texture2D(t,vUv-dir*1.4117647).rgb)*0.2969069; s+=(texture2D(t,vUv+dir*3.2941176).rgb+texture2D(t,vUv-dir*3.2941176).rgb)*0.0944703; s+=(texture2D(t,vUv+dir*5.1764706).rgb+texture2D(t,vUv-dir*5.1764706).rgb)*0.0103814; gl_FragColor=vec4(s,1.0); }'].join('\n'));
    var rays = pass({ t: { value: null }, sun: { value: new T.Vector2() }, tm: { value: 0 } }, [
      'uniform sampler2D t; uniform vec2 sun; uniform float tm; float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
      'void main(){ vec2 d=(sun-vUv)/34.0; vec2 u=vUv+d*h(gl_FragCoord.xy+fract(tm)*17.0); vec3 s=vec3(0.0); float w=1.0; for(int i=0;i<30;i++){ vec3 q=texture2D(t,u).rgb; float m=max(q.r,max(q.g,q.b)); s+=q*smoothstep(0.34,0.85,m)*step(0.0,u.y)*w; w*=0.955; u+=d; } gl_FragColor=vec4(min(s/30.0,vec3(1.2)),1.0); }'].join('\n'));
    var mix = pass({ rays: { value: null }, rk: { value: 0 }, ex: { value: 1 }, st: { value: null }, b3: { value: null }, t: { value: null }, b1: { value: null }, b2: { value: null }, sp: { value: 0 }, vp: { value: new T.Vector2(0.5, 0.5) }, tm: { value: 0 }, beat: { value: 0 } }, [
      'uniform sampler2D t,b1,b2,b3,rays,st; uniform float sp,tm,beat,rk,ex; uniform vec2 vp;',
      'float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
      'void main(){ vec2 d=vUv-vp; float r=length(d*vec2(1.25,1.0)); float e=smoothstep(0.16,0.75,r); vec3 c;',
      '  if(sp>0.004){ float k=sp*0.085*e,j=h(gl_FragCoord.xy+fract(tm)*37.0); c=vec3(0.0); for(int i=0;i<10;i++){ float q=(float(i)+j)/10.0; vec2 u=vUv-d*k*q; c+=vec3(texture2D(t,u+d*k*0.10).r,texture2D(t,u).g,texture2D(t,u-d*k*0.10).b); } c/=10.0; }',
      '  else c=texture2D(t,vUv).rgb;',
      '  c=max(c,0.0)*ex; vec3 g=texture2D(b1,vUv).rgb*0.30+texture2D(b2,vUv).rgb*0.34+texture2D(b3,vUv).rgb*0.40; c+=g*(1.0+beat*0.22);',
      '  c+=texture2D(st,vUv).rgb*vec3(1.0,0.86,0.66)*0.20; c+=texture2D(rays,vUv).rgb*vec3(1.0,0.80,0.54)*rk;',
      // filmic shoulder, a little contrast, cool shadows and warm light
      '  vec3 hi=max(c-0.68,0.0); c=min(c,0.68)+0.32*(1.0-exp(-hi/0.36)); c=mix(c,c*c*(3.0-2.0*c),0.24); float l=dot(c,vec3(0.3,0.59,0.11)); c+=vec3(-0.003,0.003,0.014)*pow(1.0-l,4.0); c*=mix(vec3(1.0),vec3(1.05,1.0,0.93),smoothstep(0.2,0.9,l));',
      '  vec2 vg=(vUv-0.5)*vec2(1.05,1.0); c*=1.0-0.34*smoothstep(0.32,0.86,length(vg));',
      '  c+=(h(gl_FragCoord.xy+fract(tm*0.7)*91.0)-0.5)*(2.4/255.0);',
      '  gl_FragColor=vec4(c,1.0); }'].join('\n'));
    function go(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(sc, camera); }
    function soften(x, y, w, h) { blur.uniforms.t.value = x.texture; blur.uniforms.dir.value.set(1 / w, 0); go(blur, y); blur.uniforms.t.value = y.texture; blur.uniforms.dir.value.set(0, 1 / h); go(blur, x); }
    var w4 = 1, h4 = 1, w8 = 1, h8 = 1, w16 = 1, h16 = 1, v3 = new T.Vector3(), n3 = new T.Vector3(), cam2 = new T.PerspectiveCamera(), Rm = new T.Matrix4(), pl = new T.Plane(), cp = new T.Vector4(), q4 = new T.Vector4();
    cam2.matrixAutoUpdate = false; cam2.matrixWorldAutoUpdate = false;
    /* Draw the world again from under the road. Same screen coordinates, so the
       ground can look its reflection up by pixel. */
    function reflect() {
      var f = world.frame(S.s + 5), x, y, z, dd; world.toWorld(S.s + 5, 0, 0.05, 0, v3); n3.set(-f.fx * Math.sin(f.pitch), Math.cos(f.pitch), -f.fz * Math.sin(f.pitch)).normalize(); x = n3.x; y = n3.y; z = n3.z; dd = 2 * n3.dot(v3);
      Rm.set(1 - 2 * x * x, -2 * x * y, -2 * x * z, dd * x, -2 * x * y, 1 - 2 * y * y, -2 * y * z, dd * y, -2 * x * z, -2 * y * z, 1 - 2 * z * z, dd * z, 0, 0, 0, 1);
      cam2.matrixWorld.copy(Rm).multiply(camera.matrixWorld); cam2.matrixWorldInverse.copy(cam2.matrixWorld).invert(); cam2.projectionMatrix.copy(camera.projectionMatrix);
      pl.setFromNormalAndCoplanarPoint(n3, v3).applyMatrix4(cam2.matrixWorldInverse); cp.set(pl.normal.x, pl.normal.y, pl.normal.z, pl.constant);
      var p = cam2.projectionMatrix, E = p.elements; q4.x = (Math.sign(cp.x) + E[8]) / E[0]; q4.y = (Math.sign(cp.y) + E[9]) / E[5]; q4.z = -1; q4.w = (1 + E[10]) / E[14];
      cp.multiplyScalar(2 / cp.dot(q4)); E[2] = cp.x; E[6] = cp.y; E[10] = cp.z + 1; E[14] = cp.w;
      cam2.projectionMatrixInverse.copy(p).invert();
      var U = world.U; world.mirrorHide.forEach(function (m) { m.visible = false; }); U.uMir.value = 1; U.uReflOn.value = 0;
      renderer.setRenderTarget(mir); renderer.render(world.scene, cam2);
      world.mirrorHide.forEach(function (m) { m.visible = true; }); U.uMir.value = 0; U.uReflOn.value = 1; U.uRefl.value = mir.texture;
    }
    return {
      on: true, mirror: !!withMirror, calls: 0, tris: 0,
      size: function () { var w = canvas.width, h = canvas.height; full.setSize(w, h); w4 = Math.max(2, w >> 2); h4 = Math.max(2, h >> 2); w8 = Math.max(2, w >> 4); h8 = Math.max(2, h >> 4); a.setSize(w4, h4); b.setSize(w4, h4); c.setSize(w8, h8); d.setSize(w8, h8); w16 = Math.max(2, w >> 5); h16 = Math.max(2, h >> 5); e.setSize(w16, h16); f.setSize(w16, h16); k1.setSize(w8, h4); k2.setSize(w8, h4); world.U.uRes.value.set(w, h); if (mir) mir.setSize(Math.max(2, Math.round(w * 0.6)), Math.max(2, Math.round(h * 0.6))); bright.uniforms.px.value.set(1 / w, 1 / h); },
      render: function () {
        if (this.mirror && world.U.uWet.value > 0.05) reflect(); else world.U.uReflOn.value = 0;
        renderer.setRenderTarget(full); renderer.render(world.scene, camera); this.calls = renderer.info.render.calls; this.tris = renderer.info.render.triangles;
        bright.uniforms.t.value = full.texture; go(bright, a); soften(a, b, w4, h4);
        blur.uniforms.t.value = a.texture; blur.uniforms.dir.value.set(1 / w4, 0); go(blur, c); soften(c, d, w8, h8);
        blur.uniforms.t.value = c.texture; blur.uniforms.dir.value.set(1 / w8, 0); go(blur, e); soften(e, f, w16, h16); soften(e, f, w16, h16);
        blur.uniforms.t.value = a.texture; blur.uniforms.dir.value.set(3.2 / w8, 0); go(blur, k1); blur.uniforms.t.value = k1.texture; blur.uniforms.dir.value.set(7 / w8, 0); go(blur, k2); blur.uniforms.t.value = k2.texture; blur.uniforms.dir.value.set(13 / w8, 0); go(blur, k1);
        var sn = world.sunAt(S.g, camera.position), rk = 0; v3.copy(sn.p).project(camera); if (v3.z < 1 && Math.abs(v3.x) < 1.7 && Math.abs(v3.y) < 1.7) rk = sn.k;
        if (rk > 0.01) { rays.uniforms.t.value = full.texture; rays.uniforms.sun.value.set(v3.x * 0.5 + 0.5, v3.y * 0.5 + 0.5); rays.uniforms.tm.value = S.t; go(rays, b); } mix.uniforms.rays.value = b.texture; mix.uniforms.rk.value = rk * 0.5; mix.uniforms.ex.value = 1.04 + 0.34 * sm(0.62, 1.1, S.g) * (1 - sm(6.8, 7.2, S.g)); mix.uniforms.st.value = k1.texture; mix.uniforms.b3.value = e.texture;
        /* smear away from the point the road runs to */
        world.toWorld(S.s + 140, 0, 2, 0, v3).project(camera); var m = mix.uniforms, ok = v3.z < 1 && Math.abs(v3.x) < 1.6; m.vp.value.set(ok ? v3.x * 0.5 + 0.5 : 0.5, ok ? clamp(v3.y * 0.5 + 0.5, 0.2, 0.8) : 0.5);
        m.t.value = full.texture; m.b1.value = a.texture; m.b2.value = c.texture; m.sp.value = S.speed; m.tm.value = S.t; m.beat.value = S.beat; go(mix, null);
      }
    };
  }
  var post = null;
  function paint() { if (post && post.on) post.render(); else { renderer.setRenderTarget(null); renderer.render(world.scene, camera); } }

  function measure() {
    if (ambient) return;
    var y = window.pageYOffset; rdTop = rd.getBoundingClientRect().top + y; rdH = rd.offsetHeight;
    tops = scenes.map(function (e) { return e.getBoundingClientRect().top + y - rdTop; }); heights = scenes.map(function (e) { return e.offsetHeight; });
  }
  function resize() {
    W = ambient ? window.innerWidth : stage.clientWidth; Hh = ambient ? window.innerHeight : stage.clientHeight; if (!W || !Hh) return;
    renderer.setPixelRatio(dpr); renderer.setSize(W, Hh, false); camera.aspect = W / Hh; if (post) post.size(); world.U.uDpr.value = dpr; world.U.uPx.value = 0.125 / Math.max(0.8, dpr * 0.82);
    var n = W / Hh < 0.8; if (n !== narrow) { narrow = n; world.cloud.setName(n); }
  }
  function readG() {
    var y = window.pageYOffset;
    if (ambient) {
      var max = Math.max(1, root.scrollHeight - window.innerHeight), p = clamp(y / max, 0, 1), r = (body.getAttribute('data-rd-range') || '1,7.3').split(',');
      return lerp(parseFloat(r[0]), parseFloat(r[1]), p);
    }
    y -= rdTop; var i = 0, n = tops.length; while (i < n - 1 && tops[i + 1] <= y) i++;
    var h = i === n - 1 ? Math.max(1, heights[i] - window.innerHeight) : heights[i];
    return lerp(SG[i][0], SG[i][1], clamp((y - tops[i]) / h, 0, 1));
  }

  /* --------------------------------------------------------------- input */
  var ptr = { x: 0, y: 0, nx: 0, ny: 0, inside: false }, ray, ndc;
  var holdBtn = $('.rd-hold'), holdLbl = holdBtn && $('.rd-hold__t', holdBtn), hx = null, hy = 0, hudTick = 0;
  function inUI(t) { return t && t.closest && t.closest('a,button,input,textarea,select,label,.rd-card,.rd-pick,.rd-door,.rh-header,.rh-nav,.rd-hud,.rd-rail,.rhxg,iframe'); }
  function startHold() { if (S.hold) return; var sc = SC[sceneIdx()]; if (!sc || !sc.hold) return; S.hold = true; S.holdStart = true; body.classList.add('rd-holding'); if (sc.id === 'bass') Bass.hold(true); }
  function endHold() { if (!S.hold) return; S.hold = false; body.classList.remove('rd-holding'); Bass.hold(false); }
  function sceneIdx() { return idxOf(S.g); }
  function bind() {
    ray = new T.Raycaster(); ndc = new T.Vector2();
    var rt = 0; window.addEventListener('resize', function () { window.clearTimeout(rt); rt = window.setTimeout(function () { measure(); resize(); if (reduced) still(); }, 120); });
    window.addEventListener('load', function () { measure(); }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if ('ResizeObserver' in window && rd) new ResizeObserver(function () { measure(); }).observe(rd);
    window.addEventListener('pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.nx = e.clientX / W * 2 - 1; ptr.ny = -(e.clientY / Hh * 2 - 1); ptr.inside = true; ptr.ui = !!inUI(e.target); }, { passive: true });
    if (ambient || reduced) return;
    window.addEventListener('pointerdown', function (e) {
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.nx = e.clientX / W * 2 - 1; ptr.ny = -(e.clientY / Hh * 2 - 1); ptr.inside = true;
      if (e.button || inUI(e.target) || !stageVisible()) return;
      if (S.hoverPick && e.pointerType === 'mouse') { setPick(S.hoverPick); return; }
      if (SC[sceneIdx()].id === 'signs') { var id = pickAt(); if (id) setPick(id); return; }
      if (e.pointerType === 'mouse') { if (SC[sceneIdx()].hold) { e.preventDefault(); if (window.getSelection) window.getSelection().removeAllRanges(); } startHold(); }
    });
    window.addEventListener('pointerup', endHold); window.addEventListener('pointercancel', endHold); window.addEventListener('blur', endHold);
    document.addEventListener('selectstart', function (e) { if (S.hold) e.preventDefault(); });
    if (holdBtn) {
      holdBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); ptr.nx = narrow ? 0 : 0.1; ptr.ny = 0; startHold(); try { holdBtn.setPointerCapture(e.pointerId); } catch (x) {} });
      holdBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      holdBtn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); ptr.nx = 0; ptr.ny = 0; startHold(); } });
      holdBtn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') endHold(); }); holdBtn.addEventListener('blur', endHold);
    }
  }
  function stageVisible() { var r = rd.getBoundingClientRect(); return r.bottom > window.innerHeight * 0.45; }
  function pickAt() {
    ndc.set(ptr.nx, ptr.ny); ray.setFromCamera(ndc, camera);
    var h = ray.intersectObjects(world.picks.list.map(function (p) { p.hit.material.visible = true; return p.hit; }), false);
    world.picks.list.forEach(function (p) { p.hit.material.visible = false; });
    return h.length ? h[0].object.userData.id : null;
  }

  /* -------------------------------------------------------------- camera */
  var pa, la, pb, lb, vP, vL, vR, vU2;
  function resolve(k, o, l) {
    var an = k[5], s = S.s, off = 2.15, uy = 0;
    if (an) { s = world.anchors[an]; off = 0; if (an === 'net') uy = world.anchors.netY; }
    world.toWorld(s, k[1][0] + off, k[1][1] + uy, k[1][2], o); world.toWorld(s, k[2][0] + off, k[2][1] + uy, k[2][2], l);
  }
  function camAt(g) {
    if (!pa) { pa = new T.Vector3(); la = new T.Vector3(); pb = new T.Vector3(); lb = new T.Vector3(); vP = new T.Vector3(); vL = new T.Vector3(); vR = new T.Vector3(); vU2 = new T.Vector3(); }
    var fov, sx;
    if (ambient) {
      var a = Math.sin(g * 1.7) * 0.42 + S.tilt.x * 0.1; world.toWorld(S.s, 2.15 + Math.sin(a) * 9, 2.2 + Math.sin(g * 2.3) * 0.6, Math.cos(a) * 8.6, vP); world.toWorld(S.s, 1.9, 1.5, -9, vL); fov = 52; sx = 0;
    } else {
      var i = 0; while (i < KF.length - 2 && KF[i + 1][0] < g) i++;
      var A = KF[i], B = KF[i + 1], t = clamp((g - A[0]) / (B[0] - A[0]), 0, 1); t = t * t * (3 - 2 * t);
      resolve(A, pa, la); resolve(B, pb, lb); vP.copy(pa).lerp(pb, t); vL.copy(la).lerp(lb, t); fov = lerp(A[3], B[3], t); sx = lerp(A[4], B[4], t);
    }
    camera.position.copy(vP); camera.up.set(0, 1, 0); camera.lookAt(vL);
    vR.setFromMatrixColumn(camera.matrixWorld, 0); vU2.setFromMatrixColumn(camera.matrixWorld, 1);
    var d = Math.min(vP.distanceTo(vL), 14), sh = S.bump > 0.7 && !ambient ? S.beat * 0.035 * (S.bump - 0.5) : 0;
    var n1 = Math.sin(S.t * 0.7) * 0.012 + Math.sin(S.t * 1.9) * 0.005 + S.tilt.x * 0.05 + Math.sin(S.t * 57) * sh + Math.sin(S.t * 33) * S.rev * 0.0012, n2 = Math.cos(S.t * 0.6) * 0.009 + S.tilt.y * 0.03 + Math.cos(S.t * 63) * sh;
    camera.position.addScaledVector(vR, n1 * d).addScaledVector(vU2, n2 * d); camera.lookAt(vL);
    var asp = W / Hh, k = 1; if (asp < 1.25) k = Math.min(1.75, Math.pow(1.25 / asp, 0.62));
    if (!ambient) k *= 1 + S.speed * 0.14;            // the lens opens up with speed
    camera.fov = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * k) * 180 / Math.PI;
    var oy = 0; if (asp < 0.9) { sx = 0; oy = ambient ? 0 : 0.13 + 0.12 * (1 - sm(0.2, 0.7, g)); if (g > 8.1) oy = Hh < 720 ? 0.15 : 0.06; }
    camera.setViewOffset(W, Hh, -sx * W, oy * Hh, W, Hh); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    S.camS = -camera.position.z;
  }

  /* ----------------------------------------------------------------- HUD */
  var hud = { mi: $('.rd-hud__mi'), bar: $('.rd-hud__bar i'), place: $('.rd-hud__place') }, railA = $$('.rd-rail a'), flood = $('.rd-flood'), counters = $$('[data-count]'), lastIdx = -1, insets = $$('.rd-inset'), covers = $$('.rd-card,.rd-inset,.rd-signs__head,.rd-pick');
  var PLACE = ['Las Vegas', 'Summerlin', 'The jobs', 'Three signs', 'LifeSwitch', 'The builds', 'US-95 North', 'The pines', 'SAE house', 'Reno', 'Reno'];
  function hudUpdate() {
    var mi = Math.round(440 * clamp(S.s / 2196, 0, 1)), idx = sceneIdx();
    if (hud.mi) hud.mi.textContent = ('00' + mi).slice(-3); if (hud.bar) hud.bar.style.transform = 'scaleX(' + clamp(S.g / 8.7, 0, 1).toFixed(4) + ')';
    if (idx !== lastIdx) {
      lastIdx = idx; S.sceneId = SC[idx].id; body.setAttribute('data-rd-scene', S.sceneId); if (hud.place) hud.place.textContent = PLACE[idx];
      if (skipA) { var end = idx === SC.length - 1; skipA.textContent = end ? 'Back to start' : 'Skip the drive'; skipA.setAttribute('href', end ? '#rd-vegas' : '#rd-doors'); }
      railA.forEach(function (a, i) { if (i === idx) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
      if (holdBtn) { var h = SC[idx].hold; holdBtn.classList.toggle('is-on', !!h); holdBtn.tabIndex = h ? 0 : -1; if (h && holdLbl) holdLbl.textContent = h; }
      endHold();
    }
    if (holdBtn) {
      if (S.sceneId === 'vegas' && holdLbl) { var lb = started && !S.hold ? 'Hold to rev' : started ? holdLbl.textContent : 'Hold to start'; if (holdLbl.textContent !== lb) holdLbl.textContent = lb; }
      holdBtn.style.setProperty('--h', holdAmt.toFixed(3));
      if (!coarse && SC[idx].hold) {
        var tx = ptr.inside ? ptr.x : W * (SC[idx].right ? 0.4 : 0.565), ty = ptr.inside ? ptr.y : Hh * 0.84; holdBtn.classList.toggle('is-off', !!ptr.ui && !S.hold); if (hx === null) { hx = tx; hy = ty; } hx += (tx - hx) * 0.14; hy += (ty - hy) * 0.14; holdBtn.style.transform = 'translate3d(' + hx.toFixed(1) + 'px,' + hy.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + (1 + holdAmt * 0.16 + S.beat * 0.03).toFixed(3) + ')';
      }
      /* On touch it sits in the corner, so it steps aside while a card passes under it. */
      if (coarse && SC[idx].hold && !S.hold && ++hudTick % 6 === 0) { var hb = holdBtn.getBoundingClientRect(); holdBtn.classList.toggle('is-off', covers.some(function (c) { var r = c.getBoundingClientRect(); return r.bottom > hb.top + 8 && r.top < hb.bottom - 8 && r.right > hb.left + 8 && r.left < hb.right; })); }
      holdBtn.classList.add('is-set');
    }
    var ct = S.g < 1 ? 1 : sm(0.1, 0.62, S.g - 1); /* the real number until its stop, so print and screen readers never get a zero */ counters.forEach(function (c) { var v = Math.round(parseInt(c.getAttribute('data-count'), 10) * ct); c.textContent = v + (v >= parseInt(c.getAttribute('data-count'), 10) ? '+' : ''); });
    if (flood) { var f = Math.max(sm(7.74, 7.95, S.g), floodHold) , o = 1 - sm(8.02, 8.22, S.g); flood.style.setProperty('--f', f.toFixed(4)); flood.style.opacity = (f > 0.002 ? o : 0).toFixed(3); flood.style.visibility = f > 0.002 && o > 0.002 ? 'visible' : 'hidden'; }
    body.classList.toggle('rd-endon', S.g > 8.28);
    insets.forEach(function (n) { var r = n.getBoundingClientRect(), p = clamp((r.top + r.height / 2) / Hh, -0.5, 1.5); n.style.setProperty('--p', (p - 0.5).toFixed(3)); n.style.setProperty('--dev', sm(0.95, 0.5, p).toFixed(3)); });
  }
  /* sm() with a > b: smoothstep falls instead of rising */
  function sceneVisible() { if (ambient) return true; var r = rd.getBoundingClientRect(); return r.bottom > -20 && r.top < window.innerHeight + 20; }

  /* ---------------------------------------------------------------- loop */
  var raf = 0, last = 0, acc = 0, frames = 0, slow = 0, shed = null, shedOff = false, skip = 0, introWas = false, col = null;
  function introOpen() { var i = document.getElementById('rh-intro'); return !!(i && !i.hidden && !i.classList.contains('is-leaving')); }
  function step(dt) {
    S.dt = dt; S.t += dt;
    gTarget = readG(); var rate = 1 - Math.exp(-dt * 5.2); S.g += (gTarget - S.g) * rate; if (Math.abs(gTarget - S.g) < 0.00005) S.g = gTarget;
    var ps = S.s; S.s = gToS(S.g); var v = (S.s - ps) / Math.max(dt, 0.001); S.brake += ((v < -0.5 || (gTarget - S.g) < -0.001 ? 1 : 0) - S.brake) * 0.1;
    S.speed += (clamp((Math.abs(v) - 30) / 420, 0, 1) - S.speed) * 0.12; if (S.speed < 0.002) S.speed = 0;
    S.tilt.x += ((ptr.inside ? ptr.nx : 0) - S.tilt.x) * 0.06; S.tilt.y += ((ptr.inside ? ptr.ny : 0) - S.tilt.y) * 0.06;
    var ph = Bass.phase(S.t), fr = ph - Math.floor(ph); S.beatPhase = fr; S.beat = Math.exp(-fr * 4.2) * (Math.floor(ph) % 4 === 0 ? 1 : 0.82);
    var id = S.sceneId, inBass = id === 'bass' ? sm(4.36, 4.58, S.g) * (1 - sm(4.9, 5, S.g)) : 0;
    holdAmt += ((S.hold ? 1 : 0) - holdAmt) * (S.hold ? 0.07 : 0.16);
    var bt = 0.22 + inBass * 0.4 + (Bass.live() ? 0.2 : 0) + (S.hold && id === 'bass' ? 0.6 : 0); S.bump += (bt - S.bump) * 0.1;
    if (S.hold && id === 'vegas' && holdAmt > 0.82) started = true; if (S.g > 0.16) started = true;
    S.rev += ((S.hold && id === 'vegas' ? 1 : 0) - S.rev) * 0.12; if (S.rev > 0.5 && started) S.flare = Math.max(S.flare, (post && post.on ? 0.1 : 0.22) + (post && post.on ? 0.07 : 0.16) * Math.sin(S.t * 24)); S.ignition += ((started ? 1 : holdAmt * 0.35 * (id === 'vegas' ? 1 : 0)) - S.ignition) * 0.06; S.flare *= 0.94;
    S.hatch += (inBass - S.hatch) * 0.08; S.keys += ((S.hold && id === 'reno' ? 1 : 0) - S.keys) * 0.05; floodHold = id === 'reno' ? sm(0.55, 0.95, S.keys) : 0;
    S.vault += ((S.hold && id === 'lifeswitch' ? 1 : 0) - S.vault) * (S.hold ? 0.035 : 0.02);
    S.pick = pick; if (!col) col = new T.Color(); col.set(pick ? ACCENT[pick] : '#C9A227'); world.U.uAccent.value.lerp(col, 0.06);
  }
  function loop(now) {
    raf = window.requestAnimationFrame(loop);
    var io = introOpen(); if (io) { introWas = true; last = now; if (!warmed) { warmed = true; camAt(S.g); world.update(S); renderer.compile(world.scene, camera); } return; }
    if (introWas) { introWas = false; S.flare = post && post.on ? 0.8 : 1.6; started = true; measure(); }
    if (!sceneVisible()) { last = now; return; }
    if (ambient) { skip ^= 1; if (skip && now - last < 30) return; }
    var ms = now - last, dt = clamp(ms / 1000, 0.001, 0.05); last = now;
    step(dt); camAt(S.g);
    S.ray = null; S.hoverPick = null;
    if (ptr.inside && !ambient) { ndc.set(ptr.nx, ptr.ny); ray.setFromCamera(ndc, camera); S.ray = ray.ray; if (S.sceneId === 'signs' && !coarse) S.hoverPick = pickAt(); body.classList.toggle('rd-canpick', !!S.hoverPick); }
    world.update(S); S.holdStart = false;
    paint();
    if (!ambient) hudUpdate(); else ambientUpdate();
    /* Shed quality before shedding frames. But a 30 Hz cap (battery saver) looks
       exactly like a slow GPU, so every cut has to earn its keep: if the frame
       time did not improve, put the quality back and stop. */
    if (ms < 120) {
      acc += ms; frames++;
      if (frames >= 45) {
        var avg = acc / frames; acc = 0; frames = 0;
        if (shed) { if (avg > shed.avg * 0.9) { shed.n++; if (shed.n >= 2) { shed.undo(); shed = null; shedOff = true; } } else shed = null; }
        else if (!shedOff) {
          slow = avg > (ambient ? 40 : 22) ? slow + 1 : 0;
          if (slow >= 2) {
            slow = 0;
            if (post && post.on && post.mirror && dpr <= 1.2) { post.mirror = false; shed = { avg: avg, n: 0, undo: function () { post.mirror = true; } }; }
            else if (post && post.on && dpr <= 1) { post.on = false; shed = { avg: avg, n: 0, undo: function () { post.on = true; } }; }
            else if (dpr > 0.75) { var was = dpr; dpr = Math.max(0.75, dpr * 0.82); resize(); shed = { avg: avg, n: 0, undo: function () { dpr = was; resize(); } }; }
          }
        }
      }
    }
  }
  var warmed = false;
  kick = function () { if (reduced && world) still(); };

  /* Photos on inner pages develop from engraving to color as they rise. */
  var dev = $$('.rh-article figure img, .rh-gallery__item img');
  function ambientUpdate() { dev.forEach(function (im) { var r = im.getBoundingClientRect(); if (r.bottom < -50 || r.top > Hh + 50) return; var p = clamp((r.top + r.height * 0.4) / Hh, 0, 1.3); im.parentNode.style.setProperty('--dev', sm(1.0, 0.52, p).toFixed(3)); }); }

  function still() {
    if (!renderer) return; measure(); var i = ambient ? 0 : idxOf(readG());
    S.g = ambient ? readG() : lerp(SG[i][0], SG[i][1], SC[i].pose); S.s = gToS(S.g); S.t = 12.4; S.still = true; S.ignition = 1; S.beat = 0.2; S.bump = 0.2; S.hatch = S.g > 4.4 && S.g < 4.95 ? 1 : 0; S.pick = pick; world.U.uAccent.value.set(pick ? ACCENT[pick] : '#C9A227');
    camAt(S.g); for (var k = 0; k < 26; k++) { S.dt = 0.03; world.update(S); } paint();
    if (!ambient) { hudUpdate(); counters.forEach(function (c) { c.textContent = c.getAttribute('data-count') + '+'; }); if (flood) flood.style.visibility = 'hidden'; insets.forEach(function (n) { n.style.setProperty('--dev', 1); n.style.setProperty('--p', 0); }); if (holdBtn) holdBtn.hidden = true; }
    else dev.forEach(function (im) { im.parentNode.style.setProperty('--dev', 1); });
  }

  /* Test hook: deterministic inspection from the console or a script. */
  window.RHDrive = { state: S, jump: function (g) { if (ambient) return; var i = idxOf(g), h = i === SC.length - 1 ? heights[i] - window.innerHeight : heights[i]; root.style.scrollBehavior = 'auto'; window.scrollTo(0, rdTop + tops[i] + (g - SG[i][0]) / (SG[i][1] - SG[i][0]) * h + 1); S.g = gTarget = readG(); }, info: function () { var p = post && post.on; return { calls: p ? post.calls : renderer.info.render.calls, tris: p ? post.tris : renderer.info.render.triangles, post: !!p, dpr: dpr, g: S.g, s: S.s }; } };

  /* Neon lettering is drawn to canvas, so wait briefly for the display face. */
  /* Building the road blocks the page for a moment. Done in the middle of a page
     transition it freezes the wipe, so wait for that to finish (inline in <head>
     sets RHVT to its promise, or to null when there is none). */
  var booted = false; function start() { if (booted) return; booted = true; boot(); }
  function go() {
    var cap = window.setTimeout(start, 1600);
    function wait(p) { if (p && p.then) p.then(start, start); else { window.clearTimeout(cap); start(); } }
    if (window.RHVT !== undefined || !('onpagereveal' in window)) wait(window.RHVT);
    else window.addEventListener('pagereveal', function () { wait(window.RHVT); }, { once: true });
  }
  if (document.fonts && document.fonts.load) { Promise.all([document.fonts.load('400 64px "Playfair Display"'), document.fonts.load('600 64px "Playfair Display"'), document.fonts.load('700 64px "Playfair Display"'), document.fonts.load('700 32px Inter')]).then(go, go); window.setTimeout(go, 1200); } else go();
}());
