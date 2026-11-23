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
  var ACCENT = { gomojo: '#FF6FAE', tagdata: '#4FD6F7', goinvest: '#6BE79A' }, pick = null;
  try { pick = window.sessionStorage.getItem('rh-pick'); } catch (e) {}
  if (!ACCENT[pick]) pick = null;
  function paintPick() {
    if (pick) root.style.setProperty('--rd-accent', ACCENT[pick]); else root.style.removeProperty('--rd-accent');
    $$('[data-pick]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pick') === pick ? 'true' : 'false'); });
    body.classList.toggle('rd-picked', !!pick);
  }
  function setPick(id) { pick = id; try { window.sessionStorage.setItem('rh-pick', id); } catch (e) {} paintPick(); if (kick) kick(); }
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
  var GS = [[0, 0], [0.36, 5], [1, 182], [2, 424], [2.3, 540], [2.7, 558], [3, 650], [3.34, 838], [3.76, 858], [4, 950], [4.42, 1222], [4.56, 1240], [4.9, 1250], [5, 1290], [5.25, 1526], [5.75, 1540], [6, 1660], [6.26, 1866], [6.74, 1878], [7, 1960], [7.28, 2080], [7.5, 2190], [7.57, 2196], [9, 2196]];
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
    [4.1, [4.2, 1.1, 2.6], [-1, 0.95, -3], 44, -0.12], [4.36, [2.8, 1.7, 6.4], [0, 1, -4], 46, -0.12], [4.56, [0.35, 1.2, 5.2], [0, 0.86, 1.2], 36, -0.18], [4.88, [-0.5, 1.12, 4.7], [0, 0.84, 1.2], 35, -0.18], [5.02, [0, 2.6, 9], [0, 1.6, -12], 50, 0],
    [5.28, [9.6, 1.5, 4.8], [16, 8.2, -0.4], 62, 0.1, 'net'], [5.74, [13, 1.6, 3.4], [16.4, 8.6, -0.6], 62, 0.1, 'net'], [5.93, [0, 2.6, 9], [0, 1.5, -12], 50, 0],
    [6.26, [2.6, 4.6, 5.2], [21, 3.0, -0.4], 50, -0.13, 'sae'], [6.74, [3.8, 5.6, -4.6], [21, 3.0, 0.2], 48, -0.13, 'sae'], [6.92, [-0.4, 2.4, 9], [-1.2, 2.6, -14], 50, 0],
    [7.1, [-2.15, 1.7, 9.5], [-2.15, 6, -28], 54, 0.06], [7.4, [-2, 2.3, 10], [-1.6, 3.4, -14], 52, 0.08], [7.6, [-4.4, 1.35, -6.4], [0.1, 1.95, 1], 48, 0.15], [7.88, [-5, 1.5, -7.6], [0, 2.5, 1.5], 48, 0.15],
    [8.12, [-3, 6, -24], [-2.15, 10, 0], 50, 0], [8.42, [-2.15, 12, -48], [-2.15, 21, 8], 50, 0], [9, [-2.15, 14, -53], [-2.15, 22.5, 8], 50, 0]
  ];

  var SC = [
    { id: 'vegas', hold: 'Hold to start', pose: 0.04 }, { id: 'home', pose: 0.5, right: 1 }, { id: 'jobs', hold: 'Hold to wash', pose: 0.6 }, { id: 'signs', pose: 0.5 }, { id: 'bass', hold: 'Hold to bump', pose: 0.7, right: 1 },
    { id: 'treenet', hold: 'Hold to bounce', pose: 0.6 }, { id: 'sae', hold: 'Hold to toss', pose: 0.5, right: 1 }, { id: 'reno', hold: 'Hand over the keys', pose: 0.68 }, { id: 'finale', pose: 0.8 }
  ];

  var canvas, renderer, camera, world, W = 1, Hh = 1, dpr = 1, maxDpr, narrow;
  var lite = coarse || Math.min(window.innerWidth, window.innerHeight) < 560 || (navigator.hardwareConcurrency || 8) < 4;
  var scenes = $$('.rd-scene'), tops = [], heights = [], rdTop = 0, rdH = 1;
  var S = { t: 0, dt: 0.016, g: 0, s: 0, beat: 0, beatPhase: 0, bump: 0.25, hold: false, holdStart: false, ignition: 0, sceneId: ambient ? '' : 'vegas', pick: pick, hoverPick: null, ray: null, tilt: { x: 0, y: 0 }, keys: 0, hatch: 0, rev: 0, flare: 0, brake: 0, ambient: ambient, camS: 0 };
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
    try { world = window.RHWorld(T, { lite: lite, narrow: narrow }); } catch (e) { fail(e && (e.stack || e.message)); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); return; }
    world.picks.list.forEach(function (p) { p.hit.material.visible = false; });
    maxDpr = Math.min(window.devicePixelRatio || 1, ambient ? 1.25 : lite ? 1.5 : 1.75); dpr = maxDpr;
    body.classList.add('rd-gl');
    measure(); resize(); bind();
    gTarget = readG(); S.g = gTarget; S.s = gToS(S.g);
    if (S.g > 0.2 || ambient) started = true;
    if (reduced) { still(); window.addEventListener('scroll', function () { window.requestAnimationFrame(still); }, { passive: true }); return; }
    last = performance.now(); raf = window.requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = window.requestAnimationFrame(loop); } });
  }

  function measure() {
    if (ambient) return;
    var y = window.pageYOffset; rdTop = rd.getBoundingClientRect().top + y; rdH = rd.offsetHeight;
    tops = scenes.map(function (e) { return e.getBoundingClientRect().top + y - rdTop; }); heights = scenes.map(function (e) { return e.offsetHeight; });
  }
  function resize() {
    W = ambient ? window.innerWidth : stage.clientWidth; Hh = ambient ? window.innerHeight : stage.clientHeight; if (!W || !Hh) return;
    renderer.setPixelRatio(dpr); renderer.setSize(W, Hh, false); camera.aspect = W / Hh; world.U.uDpr.value = dpr; world.U.uPx.value = 0.125 / Math.max(0.8, dpr * 0.82);
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
    return i + clamp((y - tops[i]) / h, 0, 1);
  }

  /* --------------------------------------------------------------- input */
  var ptr = { x: 0, y: 0, nx: 0, ny: 0, inside: false }, ray, ndc;
  var holdBtn = $('.rd-hold'), holdLbl = holdBtn && $('.rd-hold__t', holdBtn), hx = 0, hy = 0;
  function inUI(t) { return t && t.closest && t.closest('a,button,input,textarea,select,label,.rd-card,.rd-pick,.rd-door,.rh-header,.rh-nav,.rd-hud,.rd-rail,.rhxg,iframe'); }
  function startHold() { if (S.hold) return; var sc = SC[sceneIdx()]; if (!sc || !sc.hold) return; S.hold = true; S.holdStart = true; body.classList.add('rd-holding'); if (sc.id === 'bass') Bass.hold(true); }
  function endHold() { if (!S.hold) return; S.hold = false; body.classList.remove('rd-holding'); Bass.hold(false); }
  function sceneIdx() { return clamp(Math.floor(S.g + 0.0001), 0, SC.length - 1); }
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
    camera.fov = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * k) * 180 / Math.PI;
    var oy = 0; if (asp < 0.9) { sx = 0; oy = ambient ? 0 : 0.13 + 0.12 * (1 - sm(0.2, 0.7, g)); if (g > 8.1) oy = 0.06; }
    camera.setViewOffset(W, Hh, -sx * W, oy * Hh, W, Hh); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    S.camS = -camera.position.z;
  }

  /* ----------------------------------------------------------------- HUD */
  var hud = { mi: $('.rd-hud__mi'), bar: $('.rd-hud__bar i'), place: $('.rd-hud__place') }, railA = $$('.rd-rail a'), flood = $('.rd-flood'), counters = $$('[data-count]'), lastIdx = -1, insets = $$('.rd-inset');
  var PLACE = ['Las Vegas', 'Summerlin', 'The jobs', 'Three signs', 'US-95 North', 'The pines', 'SAE house', 'Reno', 'Reno'];
  function hudUpdate() {
    var mi = Math.round(440 * clamp(S.s / 2196, 0, 1)), idx = sceneIdx();
    if (hud.mi) hud.mi.textContent = ('00' + mi).slice(-3); if (hud.bar) hud.bar.style.transform = 'scaleX(' + clamp(S.g / 8.7, 0, 1).toFixed(4) + ')';
    if (idx !== lastIdx) {
      lastIdx = idx; S.sceneId = SC[idx].id; body.setAttribute('data-rd-scene', S.sceneId); if (hud.place) hud.place.textContent = PLACE[idx];
      railA.forEach(function (a, i) { if (i === idx) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
      if (holdBtn) { var h = SC[idx].hold; holdBtn.classList.toggle('is-on', !!h); holdBtn.tabIndex = h ? 0 : -1; if (h && holdLbl) holdLbl.textContent = h; }
      endHold();
    }
    if (holdBtn) {
      if (S.sceneId === 'vegas' && holdLbl) { var lb = started && !S.hold ? 'Hold to rev' : started ? holdLbl.textContent : 'Hold to start'; if (holdLbl.textContent !== lb) holdLbl.textContent = lb; }
      holdBtn.style.setProperty('--h', holdAmt.toFixed(3));
      if (!coarse && SC[idx].hold) {
        var tx = ptr.inside ? ptr.x : W * (SC[idx].right ? 0.4 : 0.565), ty = ptr.inside ? ptr.y : Hh * 0.84; holdBtn.classList.toggle('is-off', !!ptr.ui && !S.hold); hx += (tx - hx) * 0.14; hy += (ty - hy) * 0.14; holdBtn.style.transform = 'translate3d(' + hx.toFixed(1) + 'px,' + hy.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + (1 + holdAmt * 0.16 + S.beat * 0.03).toFixed(3) + ')';
      }
    }
    var ct = sm(0.1, 0.62, S.g - 1); counters.forEach(function (c) { var v = Math.round(parseInt(c.getAttribute('data-count'), 10) * ct); c.textContent = v + (v >= parseInt(c.getAttribute('data-count'), 10) ? '+' : ''); });
    if (flood) { var f = Math.max(sm(7.74, 7.95, S.g), floodHold) , o = 1 - sm(8.02, 8.22, S.g); flood.style.setProperty('--f', f.toFixed(4)); flood.style.opacity = (f > 0.002 ? o : 0).toFixed(3); flood.style.visibility = f > 0.002 && o > 0.002 ? 'visible' : 'hidden'; }
    body.classList.toggle('rd-endon', S.g > 8.28);
    insets.forEach(function (n) { var r = n.getBoundingClientRect(), p = clamp((r.top + r.height / 2) / Hh, -0.5, 1.5); n.style.setProperty('--p', (p - 0.5).toFixed(3)); n.style.setProperty('--dev', sm(0.95, 0.5, p).toFixed(3)); });
  }
  /* sm() with a > b: smoothstep falls instead of rising */
  function sceneVisible() { if (ambient) return true; var r = rd.getBoundingClientRect(); return r.bottom > -20 && r.top < window.innerHeight + 20; }

  /* ---------------------------------------------------------------- loop */
  var raf = 0, last = 0, acc = 0, frames = 0, slow = 0, skip = 0, introWas = false, col = null;
  function introOpen() { var i = document.getElementById('rh-intro'); return !!(i && !i.hidden && !i.classList.contains('is-leaving')); }
  function step(dt) {
    S.dt = dt; S.t += dt;
    gTarget = readG(); var rate = 1 - Math.exp(-dt * 5.2); S.g += (gTarget - S.g) * rate; if (Math.abs(gTarget - S.g) < 0.00005) S.g = gTarget;
    var ps = S.s; S.s = gToS(S.g); var v = (S.s - ps) / Math.max(dt, 0.001); S.brake += ((v < -0.5 || (gTarget - S.g) < -0.001 ? 1 : 0) - S.brake) * 0.1;
    S.tilt.x += ((ptr.inside ? ptr.nx : 0) - S.tilt.x) * 0.06; S.tilt.y += ((ptr.inside ? ptr.ny : 0) - S.tilt.y) * 0.06;
    var ph = Bass.phase(S.t), fr = ph - Math.floor(ph); S.beatPhase = fr; S.beat = Math.exp(-fr * 4.2) * (Math.floor(ph) % 4 === 0 ? 1 : 0.82);
    var id = S.sceneId, inBass = id === 'bass' ? sm(4.36, 4.58, S.g) * (1 - sm(4.9, 5, S.g)) : 0;
    holdAmt += ((S.hold ? 1 : 0) - holdAmt) * (S.hold ? 0.07 : 0.16);
    var bt = 0.22 + inBass * 0.4 + (Bass.live() ? 0.2 : 0) + (S.hold && id === 'bass' ? 0.6 : 0); S.bump += (bt - S.bump) * 0.1;
    if (S.hold && id === 'vegas' && holdAmt > 0.82) started = true; if (S.g > 0.16) started = true;
    S.rev += ((S.hold && id === 'vegas' ? 1 : 0) - S.rev) * 0.12; if (S.rev > 0.5 && started) S.flare = Math.max(S.flare, 0.22 + 0.16 * Math.sin(S.t * 24)); S.ignition += ((started ? 1 : holdAmt * 0.35 * (id === 'vegas' ? 1 : 0)) - S.ignition) * 0.06; S.flare *= 0.94;
    S.hatch += (inBass - S.hatch) * 0.08; S.keys += ((S.hold && id === 'reno' ? 1 : 0) - S.keys) * 0.05; floodHold = id === 'reno' ? sm(0.55, 0.95, S.keys) : 0;
    S.pick = pick; if (!col) col = new T.Color(); col.set(pick ? ACCENT[pick] : '#C9A227'); world.U.uAccent.value.lerp(col, 0.06);
  }
  function loop(now) {
    raf = window.requestAnimationFrame(loop);
    var io = introOpen(); if (io) { introWas = true; last = now; if (!warmed) { warmed = true; camAt(S.g); world.update(S); renderer.compile(world.scene, camera); } return; }
    if (introWas) { introWas = false; S.flare = 1.6; started = true; measure(); }
    if (!sceneVisible()) { last = now; return; }
    if (ambient) { skip ^= 1; if (skip && now - last < 30) return; }
    var ms = now - last, dt = clamp(ms / 1000, 0.001, 0.05); last = now;
    step(dt); camAt(S.g);
    S.ray = null; S.hoverPick = null;
    if (ptr.inside && !ambient) { ndc.set(ptr.nx, ptr.ny); ray.setFromCamera(ndc, camera); S.ray = ray.ray; if (S.sceneId === 'signs' && !coarse) S.hoverPick = pickAt(); body.classList.toggle('rd-canpick', !!S.hoverPick); }
    world.update(S); S.holdStart = false;
    renderer.render(world.scene, camera);
    if (!ambient) hudUpdate(); else ambientUpdate();
    /* shed resolution before shedding frames */
    if (ms < 120) { acc += ms; frames++; if (frames >= 45) { var avg = acc / frames; acc = 0; frames = 0; if (avg > (ambient ? 40 : 22)) slow++; else slow = 0; if (slow >= 2 && dpr > 0.75) { dpr = Math.max(0.75, dpr * 0.82); slow = 0; resize(); } } }
  }
  var warmed = false;
  kick = function () { if (reduced && world) still(); };

  /* Photos on inner pages develop from engraving to color as they rise. */
  var dev = $$('.rh-article figure img, .rh-gallery__item img');
  function ambientUpdate() { dev.forEach(function (im) { var r = im.getBoundingClientRect(); if (r.bottom < -50 || r.top > Hh + 50) return; var p = clamp((r.top + r.height * 0.4) / Hh, 0, 1.3); im.parentNode.style.setProperty('--dev', sm(1.0, 0.52, p).toFixed(3)); }); }

  function still() {
    if (!renderer) return; measure(); var i = ambient ? 0 : clamp(Math.floor(readG()), 0, SC.length - 1);
    S.g = ambient ? readG() : i + SC[i].pose; S.s = gToS(S.g); S.t = 12.4; S.ignition = 1; S.beat = 0.2; S.bump = 0.2; S.hatch = S.g > 4.4 && S.g < 4.95 ? 1 : 0; S.pick = pick; world.U.uAccent.value.set(pick ? ACCENT[pick] : '#C9A227');
    camAt(S.g); for (var k = 0; k < 26; k++) { S.dt = 0.03; world.update(S); } renderer.render(world.scene, camera);
    if (!ambient) { hudUpdate(); counters.forEach(function (c) { c.textContent = c.getAttribute('data-count') + '+'; }); if (flood) flood.style.visibility = 'hidden'; insets.forEach(function (n) { n.style.setProperty('--dev', 1); n.style.setProperty('--p', 0); }); if (holdBtn) holdBtn.hidden = true; }
    else dev.forEach(function (im) { im.parentNode.style.setProperty('--dev', 1); });
  }

  /* Test hook: deterministic inspection from the console or a script. */
  window.RHDrive = { state: S, jump: function (g) { if (ambient) return; var i = clamp(Math.floor(g), 0, SC.length - 1), h = i === SC.length - 1 ? heights[i] - window.innerHeight : heights[i]; root.style.scrollBehavior = 'auto'; window.scrollTo(0, rdTop + tops[i] + (g - i) * h + 1); S.g = gTarget = readG(); }, info: function () { return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr: dpr, g: S.g, s: S.s }; } };

  /* Neon lettering is drawn to canvas, so wait briefly for the display face. */
  var booted = false; function go() { if (booted) return; booted = true; boot(); }
  if (document.fonts && document.fonts.load) { Promise.all([document.fonts.load('400 64px "Playfair Display"'), document.fonts.load('600 64px "Playfair Display"'), document.fonts.load('700 64px "Playfair Display"'), document.fonts.load('700 32px Inter')]).then(go, go); window.setTimeout(go, 1200); } else go();
}());
