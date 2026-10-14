/**
 * HEUSER — CINEMATIC LAYER
 *
 * Four independent modules. Each one feature-detects, wraps itself in
 * try/catch, and fails silently to the plain themed site rather than taking
 * the page down with it:
 *
 *   Starfield  — canvas 2D star drift behind the intro
 *   Intro      — the opening crawl, driven by an explicit state machine
 *   Galaxy     — interactive WebGL particle galaxy behind the hero
 *   Tilt       — cursor-driven 3D tilt on cards
 *
 * Hard rules, because this runs before the visitor sees anything:
 *   - reduced motion  -> the intro never mounts at all
 *   - once per tab    -> sessionStorage, with a replay button
 *   - always escapes  -> skip button, Escape key, and a failsafe timer that
 *                        tears the overlay down even if a phase throws
 *   - scroll restored -> unlocked in one place that every exit path calls
 */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEEN_KEY = 'rh-intro-seen';

  function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt || false); }

  /* =====================================================================
     1. HYPERSPACE
     2D canvas rather than WebGL on purpose: the effect is streaks, which the
     2D context draws natively, and trail-based motion blur is a translucent
     fill instead of a framebuffer pass. One less thing that can fail to
     initialize in front of the visitor's first impression.
     ===================================================================== */
  function Hyperspace(canvas) {
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var stars = [], raf = 0, w = 0, h = 0, dpr = 1, running = false;
    var speed = 0.00016, target = 0.00016, last = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function star() {
      var a = Math.random() * 6.2832;
      var r = Math.sqrt(Math.random()) * 1.15;
      return {
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        z: Math.random() * 0.92 + 0.06,
        // a few warm ones so it reads brass rather than sci-fi blue
        warm: Math.random() < 0.22
      };
    }
    function seed() {
      var n = Math.round(Math.min(620, (w * h) / 2600));
      stars.length = 0;
      for (var i = 0; i < n; i++) stars.push(star());
    }

    function frame(now) {
      if (!running) return;
      raf = window.requestAnimationFrame(frame);
      var dt = last ? Math.min(now - last, 48) : 16;
      last = now;

      speed += (target - speed) * 0.045;

      // Trail length is inversely tied to how much of the previous frame we
      // keep — faster travel, longer streaks.
      var keep = 0.10 + Math.min(speed / 0.0042, 1) * 0.62;
      ctx.fillStyle = 'rgba(4,6,11,' + (1 - keep).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);

      var cx = w / 2, cy = h / 2, k = Math.min(w, h) * 0.62;
      var stretch = 1 + Math.min(speed / 0.0016, 1) * 9;

      ctx.lineCap = 'round';
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var z0 = st.z;
        st.z -= speed * dt;
        if (st.z <= 0.045) { stars[i] = star(); stars[i].z = 1.0; continue; }

        var z1 = Math.min(z0 + speed * dt * stretch, 1.6);
        var x0 = cx + (st.x / st.z) * k, y0 = cy + (st.y / st.z) * k;
        var x1 = cx + (st.x / z1) * k,  y1 = cy + (st.y / z1) * k;

        if (x0 < -60 && x1 < -60) continue;
        if (x0 > w + 60 && x1 > w + 60) continue;

        var depth = 1 - st.z;                     // 0 far, 1 near
        var a = Math.min(depth * 1.5, 1);
        ctx.strokeStyle = st.warm
          ? 'rgba(242,219,160,' + (a * 0.92).toFixed(3) + ')'
          : 'rgba(226,240,255,' + (a * 0.80).toFixed(3) + ')';
        ctx.lineWidth = Math.max(0.6, depth * 2.3);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x0, y0);
        ctx.stroke();
      }
    }

    resize();
    on(window, 'resize', resize);

    return {
      start: function () { if (!running) { running = true; last = 0; raf = window.requestAnimationFrame(frame); } },
      stop:  function () { running = false; if (raf) window.cancelAnimationFrame(raf); },
      /** 0 = drifting, 1 = full hyperspace. */
      throttle: function (v) { target = 0.00016 + Math.max(0, Math.min(v, 1)) * 0.0040; },
      /** Deterministic pose for scrubbed inspection. */
      poseAt: function (v) { target = speed = 0.00016 + Math.max(0, Math.min(v, 1)) * 0.0040; }
    };
  }

  /* =====================================================================
     2. THE COLD OPEN
     ===================================================================== */

  /* Terminal script. Each step is typed or printed; the renderer is a pure
     function of elapsed time, which is what makes ?intro= scrubbing exact. */
  var BOOT_OUT = (window.RH_INTRO && window.RH_INTRO.boot) ||
                 'roman heuser · founder, builder, student';
  var BOOT = [
    { type: '$ whoami', cps: 24 },
    { wait: 380 },
    { out:  BOOT_OUT },
    { wait: 680 },
    { type: '$ launch --site', cps: 24 },
    { wait: 260 }
  ];

  function bootHTML(elapsed) {
    var t = 0, html = '', done = true;
    for (var i = 0; i < BOOT.length; i++) {
      var st = BOOT[i];
      if (st.wait) {
        if (elapsed < t + st.wait) { done = false; break; }
        t += st.wait;
      } else if (st.out) {
        html += '<span class="rh-boot__dim">' + st.out + '</span>\n';
      } else if (st.type) {
        var dur = (st.type.length / st.cps) * 1000;
        if (elapsed < t + dur) {
          var n = Math.max(0, Math.floor(((elapsed - t) / dur) * st.type.length));
          html += st.type.slice(0, n);
          done = false;
          break;
        }
        html += st.type + '\n';
        t += dur;
      }
    }
    return { html: html, done: done, total: t };
  }

  var T = {
    BOOT:  250,
    WARP:  2150,   // hyperspace begins ramping
    FLASH: 4750,
    NAME:  5000,
    FLARE: 5450,
    C1:    7300,
    C2:    8900,
    C3:    10550,
    SIGN:  12200,
    END:   14400
  };

  function Intro() {
    var el = document.getElementById('rh-intro');
    if (!el) return;

    var seen = false;
    try { seen = window.sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { seen = false; }
    if (reduced || seen) { el.parentNode && el.parentNode.removeChild(el); mountReplay(); return; }

    var warp   = Hyperspace(el.querySelector('.rh-intro__warp'));
    var flash  = el.querySelector('.rh-intro__flash');
    var flare  = el.querySelector('.rh-intro__flare');
    var prog   = el.querySelector('.rh-intro__prog');
    var skip   = el.querySelector('.rh-intro__skip');
    var bootEl = el.querySelector('.rh-beat--boot');
    var bootLn = bootEl && bootEl.querySelector('.rh-boot__line');
    var beat   = function (n) { return el.querySelector('[data-beat="' + n + '"]'); };

    var timers = [], done = false, bootRaf = 0;
    function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }

    function finish() {
      if (done) return;
      done = true;
      for (var i = 0; i < timers.length; i++) window.clearTimeout(timers[i]);
      timers.length = 0;
      if (bootRaf) window.cancelAnimationFrame(bootRaf);
      try { window.sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
      if (warp) warp.stop();
      el.classList.add('is-leaving');
      document.body.classList.remove('rh-intro-open');
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        mountReplay();
      }, 950);
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
    }

    var scrub = null;
    try {
      var m = /[?&]intro=(\d+)/.exec(window.location.search);
      if (m) scrub = parseInt(m[1], 10);
    } catch (e) { scrub = null; }

    /** Warp throttle as a function of the timeline. */
    function warpAt(ms) {
      if (ms < T.WARP) return 0;
      if (ms < T.FLASH) return Math.pow((ms - T.WARP) / (T.FLASH - T.WARP), 1.7);
      if (ms < T.FLASH + 900) return 1 - (ms - T.FLASH) / 900 * 0.95;   // decay after the punch
      return 0.05;                                                      // ambient drift
    }

    try {
      el.hidden = false;
      el.style.setProperty('--rh-intro-dur', (T.END / 1000) + 's');

      if (scrub !== null) {
        // Freeze the exact composite frame at t = scrub.
        var b = bootHTML(Math.max(0, scrub - T.BOOT));
        if (bootLn) bootLn.textContent = b.html.replace(/<[^>]+>/g, '');
        if (bootEl && scrub >= T.BOOT && scrub < T.FLASH) bootEl.classList.add('is-on');
        seek(flash,       T.FLASH, scrub);
        seek(beat('name'), T.NAME, scrub);
        seek(flare,       T.FLARE, scrub);
        seek(beat('c1'),  T.C1,    scrub);
        seek(beat('c2'),  T.C2,    scrub);
        seek(beat('c3'),  T.C3,    scrub);
        seek(beat('sign'),T.SIGN,  scrub);
        if (warp) { warp.poseAt(warpAt(scrub)); warp.start(); }
        on(skip, 'click', finish);
        return;
      }

      document.body.classList.add('rh-intro-open');
      if (warp) warp.start();
      if (prog) prog.classList.add('is-on');

      // Boot line types itself, driven off a clock so it stays in sync.
      var t0 = performance.now();
      if (bootEl) bootEl.classList.add('is-on');
      (function tick(now) {
        var e = (now || performance.now()) - t0 - T.BOOT;
        if (e >= 0 && bootLn) {
          var r = bootHTML(e);
          bootLn.innerHTML = r.html;
          if (r.done) return;
        }
        bootRaf = window.requestAnimationFrame(tick);
      }(t0));

      later(function () { if (bootEl) bootEl.style.opacity = '0'; }, T.FLASH - 250);

      // Warp throttle stepped along the ramp.
      var stepMs = 120;
      for (var ms = T.WARP; ms <= T.FLASH + 1000; ms += stepMs) {
        (function (at) { later(function () { if (warp) warp.throttle(warpAt(at)); }, at); }(ms));
      }
      later(function () { if (warp) warp.throttle(0.05); }, T.FLASH + 1100);

      later(function () { if (flash) flash.classList.add('is-on'); }, T.FLASH);
      later(function () { var n = beat('name'); if (n) n.classList.add('is-on'); }, T.NAME);
      later(function () { if (flare) flare.classList.add('is-on'); }, T.FLARE);
      later(function () { var c = beat('c1'); if (c) c.classList.add('is-on'); }, T.C1);
      later(function () { var c = beat('c2'); if (c) c.classList.add('is-on'); }, T.C2);
      later(function () { var c = beat('c3'); if (c) c.classList.add('is-on'); }, T.C3);
      later(function () { var g = beat('sign'); if (g) g.classList.add('is-on'); }, T.SIGN);
      later(finish, T.END);
      later(finish, T.END + 4000);          // failsafe

      on(skip, 'click', finish);
      document.addEventListener('keydown', onKey);
      on(el, 'wheel', finish, { passive: true });
    } catch (err) {
      finish();
    }

    /* Place one beat at its state for a given moment on the timeline. */
    function seek(node, startMs, atMs) {
      if (!node) return;
      if (atMs < startMs) { node.style.opacity = '0'; return; }
      node.style.animationDelay = '-' + ((atMs - startMs) / 1000) + 's';
      node.style.animationPlayState = 'paused';
      node.classList.add('is-on');
    }
  }

  /* =====================================================================
     3. INTERACTIVE WEBGL GALAXY
     ===================================================================== */
  function Galaxy(canvas) {
    if (!canvas || reduced) return;
    var gl;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
        || canvas.getContext('experimental-webgl');
    } catch (e) { return; }
    if (!gl) return;

    var VS = [
      'attribute vec3 aPos;',
      'attribute float aSize;',
      'attribute vec3 aColor;',
      'uniform mat4 uProj;',
      'uniform mat4 uView;',
      'uniform float uTime;',
      'uniform float uDpr;',
      'varying vec3 vColor;',
      'varying float vFade;',
      'void main(){',
      '  vec3 p = aPos;',
      '  float r = length(p.xz);',
      '  float a = uTime * (0.16 / (0.45 + r));',   // differential rotation
      '  float s = sin(a), c = cos(a);',
      '  vec3 q = vec3(p.x*c - p.z*s, p.y, p.x*s + p.z*c);',
      '  vec4 mv = uView * vec4(q, 1.0);',
      '  gl_Position = uProj * mv;',
      '  float d = -mv.z;',
      '  gl_PointSize = clamp(aSize * uDpr * (17.0 / max(d, 0.35)), 1.0, 14.0);',
      '  vColor = aColor;',
      '  vFade = clamp(1.35 - (d - 2.0) / 9.0, 0.10, 1.0);',
      '}'
    ].join('\n');

    var FS = [
      'precision mediump float;',
      'varying vec3 vColor;',
      'varying float vFade;',
      'void main(){',
      '  vec2 d = gl_PointCoord - vec2(0.5);',
      '  float r2 = dot(d, d);',
      '  if (r2 > 0.25) discard;',
      '  float a = smoothstep(0.25, 0.0, r2);',
      '  gl_FragColor = vec4(vColor, a * vFade * 0.90);',
      '}'
    ].join('\n');

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    /* --- build a barred-spiral point cloud --- */
    var N = 2800, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N);
    var ARMS = 3;
    for (var i = 0; i < N; i++) {
      var t = Math.pow(Math.random(), 0.62);            // denser core
      var rad = 0.25 + t * 2.55;
      var arm = Math.floor(Math.random() * ARMS) * (6.2832 / ARMS);
      var spin = rad * 1.55;
      var scatter = (Math.random() - 0.5) * (0.55 + rad * 0.30);
      var ang = arm + spin + scatter;
      var thick = (Math.random() - 0.5) * (0.36 / (1 + rad * 1.5));
      pos[i * 3]     = Math.cos(ang) * rad + (Math.random() - 0.5) * 0.10;
      pos[i * 3 + 1] = thick + (Math.random() - 0.5) * 0.05;
      pos[i * 3 + 2] = Math.sin(ang) * rad + (Math.random() - 0.5) * 0.10;

      // brass core -> pale gold -> cool blue rim
      var m = Math.min(rad / 2.8, 1);
      if (m < 0.42) {
        var k = m / 0.42;
        col[i * 3] = 1.00; col[i * 3 + 1] = 0.86 - k * 0.10; col[i * 3 + 2] = 0.55 + k * 0.12;
      } else {
        var k2 = (m - 0.42) / 0.58;
        col[i * 3] = 1.00 - k2 * 0.55; col[i * 3 + 1] = 0.76 - k2 * 0.24; col[i * 3 + 2] = 0.67 + k2 * 0.28;
      }
      siz[i] = (Math.random() * 1.5 + 0.55) * (1 - m * 0.35);
    }

    function buf(data, loc, n) {
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      var l = gl.getAttribLocation(prog, loc);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, n, gl.FLOAT, false, 0, 0);
    }
    buf(pos, 'aPos', 3); buf(col, 'aColor', 3); buf(siz, 'aSize', 1);

    var uProj = gl.getUniformLocation(prog, 'uProj');
    var uView = gl.getUniformLocation(prog, 'uView');
    var uTime = gl.getUniformLocation(prog, 'uTime');
    var uDpr  = gl.getUniformLocation(prog, 'uDpr');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);           // additive glow
    gl.disable(gl.DEPTH_TEST);

    /* --- camera --- */
    var yaw = 0.6, pitch = 0.52, tYaw = 0.6, tPitch = 0.52;
    var drag = false, lx = 0, ly = 0, dpr = 1, W = 0, H = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth || canvas.parentNode.clientWidth || 1;
      H = canvas.clientHeight || canvas.parentNode.clientHeight || 1;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function proj() {
      var f = 1 / Math.tan(0.62), a = W / Math.max(H, 1), near = 0.1, far = 60;
      return new Float32Array([
        f / a, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
      ]);
    }

    function view() {
      var cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
      var d = 5.4;
      // camera position on a sphere, looking at the origin
      var ex = d * cp * sy, ey = d * sp, ez = d * cp * cy;
      var zx = ex / d, zy = ey / d, zz = ez / d;                       // forward
      var xx = cy, xy = 0, xz = -sy;                                    // right
      var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,
        -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1
      ]);
    }

    var t0 = performance.now(), raf = 0, visible = true;
    function frame(now) {
      raf = window.requestAnimationFrame(frame);
      if (!visible) return;
      yaw += (tYaw - yaw) * 0.06;
      pitch += (tPitch - pitch) * 0.06;
      if (!drag) tYaw += 0.00042;                 // gentle idle drift
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniformMatrix4fv(uProj, false, proj());
      gl.uniformMatrix4fv(uView, false, view());
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform1f(uDpr, dpr);
      gl.drawArrays(gl.POINTS, 0, N);
    }

    function down(e) {
      drag = true; canvas.classList.add('is-drag');
      var p = e.touches ? e.touches[0] : e; lx = p.clientX; ly = p.clientY;
    }
    function move(e) {
      var p = e.touches ? e.touches[0] : e;
      if (!drag) {
        // subtle parallax from cursor position alone
        var r = canvas.getBoundingClientRect();
        tYaw = 0.6 + ((p.clientX - r.left) / r.width - 0.5) * 0.55;
        tPitch = 0.52 + ((p.clientY - r.top) / r.height - 0.5) * -0.30;
        return;
      }
      tYaw += (p.clientX - lx) * 0.006;
      tPitch = Math.max(-1.25, Math.min(1.25, tPitch + (p.clientY - ly) * -0.005));
      lx = p.clientX; ly = p.clientY;
      if (e.cancelable && e.touches) e.preventDefault();
    }
    function up() { drag = false; canvas.classList.remove('is-drag'); }

    resize();
    on(window, 'resize', resize);
    on(canvas, 'mousedown', down); on(window, 'mousemove', move); on(window, 'mouseup', up);
    on(canvas, 'touchstart', down, { passive: true });
    on(canvas, 'touchmove', move, { passive: false });
    on(canvas, 'touchend', up);

    // Stop burning GPU when the hero is off-screen or the tab is hidden.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; },
        { threshold: 0 }).observe(canvas);
    }
    on(document, 'visibilitychange', function () {
      if (document.hidden) { if (raf) window.cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) raf = window.requestAnimationFrame(frame);
    });

    raf = window.requestAnimationFrame(frame);
    canvas.setAttribute('data-webgl', 'on');
    // Only restack the hero once the context is genuinely live, so a WebGL
    // failure leaves the original, photo-friendly vignette untouched.
    var hero = canvas.closest ? canvas.closest('.rh-hero') : null;
    if (hero) hero.classList.add('rh-hero--fx');
  }

  /* =====================================================================
     4. 3D TILT
     ===================================================================== */
  function Tilt() {
    if (reduced || !window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    var cards = document.querySelectorAll('.rh-tilt');
    Array.prototype.forEach.call(cards, function (card) {
      var raf = 0;
      function apply(e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rh-mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--rh-my', (py * 100).toFixed(1) + '%');
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          raf = 0;
          card.style.transform =
            'perspective(900px) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg) rotateY(' +
            ((px - 0.5) * 9).toFixed(2) + 'deg) translateZ(0)';
        });
      }
      on(card, 'mouseenter', function () { card.classList.add('is-tilting'); });
      on(card, 'mousemove', apply);
      on(card, 'mouseleave', function () {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  }

  /* =====================================================================
     BOOT
     ===================================================================== */
  function boot() {
    try { Intro(); }  catch (e) { document.body.classList.remove('rh-intro-open'); }
    try { Galaxy(document.getElementById('rh-galaxy')); } catch (e) {}
    try { Tilt(); }   catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
